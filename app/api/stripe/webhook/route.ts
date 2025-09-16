// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { buffer } from 'micro'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { addMonths, fromUnixTime } from 'date-fns'

export const config = {
  api: {
    bodyParser: false,
  },
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature') as string
  const rawBody = await req.arrayBuffer()
  const buf = Buffer.from(rawBody)

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(buf, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('❌ Error verificando webhook:', err.message)
    return new NextResponse(`Webhook error: ${err.message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string


        if (!userId) {
          console.error('❌ No se encontró userId en metadata para checkout.session.completed');
          return new NextResponse('Missing userId', { status: 400 });
        }

        // Obtener información de la suscripción para el price_id
        let priceId = null;
        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            priceId = subscription.items.data[0]?.price?.id || null;
          } catch (err) {
            console.warn('⚠️ No se pudo obtener price_id de la suscripción:', err);
          }
        }

        const subscriptionRenewDate = addMonths(new Date(), 1)

        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_plan: 'pro',
            subscription_status: 'active',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            subscription_end_date: null,
            subscription_renew_date: subscriptionRenewDate.toISOString(),
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        if (error) {
          console.error(`❌ Error al actualizar el perfil en Supabase para checkout.session.completed: ${error.message}`, error);
          throw new Error(error.message);
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) {
          console.error('❌ No se encontró userId en metadata de cancelación')
          return new NextResponse('Missing userId', { status: 400 })
        }

        const endDate = subscription.ended_at
          ? fromUnixTime(subscription.ended_at).toISOString()
          : new Date().toISOString()

        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_plan: 'free',
            subscription_status: 'cancelled',
            subscription_end_date: endDate,
            subscription_renew_date: null,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        if (error) throw new Error(error.message)

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        const newStatus = subscription.status

        if (!userId) {
          console.error('❌ No se encontró userId en metadata de actualización')
          return new NextResponse('Missing userId', { status: 400 })
        }

        let mappedStatus: string;
        let subscriptionPlan: string = 'free';
        
        switch (newStatus) {
          case 'active':
          case 'trialing':
            mappedStatus = 'active';
            subscriptionPlan = 'pro';
            break;
          case 'canceled':
          case 'unpaid':
            mappedStatus = 'cancelled';
            subscriptionPlan = 'free';
            break;
          case 'past_due':
            mappedStatus = 'past_due';
            subscriptionPlan = 'pro'; // Mantener pro hasta que se cancele definitivamente
            break;
          case 'incomplete':
            mappedStatus = 'incomplete';
            subscriptionPlan = 'free';
            break;
          case 'incomplete_expired':
            mappedStatus = 'incomplete_expired';
            subscriptionPlan = 'free';
            break;
          case 'paused':
            mappedStatus = 'paused';
            subscriptionPlan = 'free';
            break;
          default:
            console.warn(`⚠️ Estado de suscripción de Stripe desconocido: ${newStatus}. Usando 'active' por defecto.`);
            mappedStatus = 'active';
            subscriptionPlan = 'pro';
        }

        const priceId = subscription.items.data[0]?.price?.id || null;

        const updateData: any = {
          subscription_plan: subscriptionPlan,
          subscription_status: mappedStatus,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
          cancel_at_period_end: subscription.cancel_at_period_end || false,
          updated_at: new Date().toISOString(),
        }

        if (subscription.cancel_at_period_end && subscription.cancel_at) {
          updateData.subscription_end_date = fromUnixTime(subscription.cancel_at).toISOString()
          updateData.subscription_status = 'cancelling' // Estado especial para cancelación pendiente
          updateData.subscription_renew_date = null
        } else if (mappedStatus === 'active') {
          updateData.subscription_end_date = null
          updateData.subscription_renew_date = addMonths(new Date(), 1).toISOString()
        } else if (mappedStatus === 'cancelled') {
          updateData.subscription_end_date = subscription.ended_at ? fromUnixTime(subscription.ended_at).toISOString() : new Date().toISOString()
          updateData.subscription_renew_date = null
        }

        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId)

        if (error) throw new Error(error.message)

        break
      }

      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string
        
        if (!subscriptionId) {
          console.warn('⚠️ No se encontró subscription_id en invoice.payment_succeeded');
          break;
        }

        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const userId = subscription.metadata?.userId

          if (!userId) {
            console.warn('⚠️ No se encontró userId en metadata de la suscripción');
            break;
          }

          const priceId = subscription.items.data[0]?.price?.id || null;
          const subscriptionRenewDate = addMonths(new Date(), 1)

          const { error } = await supabase
            .from('profiles')
            .update({
              subscription_plan: 'pro',
              subscription_status: 'active',
              stripe_subscription_id: subscriptionId,
              stripe_price_id: priceId,
              subscription_end_date: null,
              subscription_renew_date: subscriptionRenewDate.toISOString(),
              cancel_at_period_end: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId)

          if (error) {
            console.error(`❌ Error al actualizar el perfil en Supabase para invoice.payment_succeeded: ${error.message}`, error);
            throw new Error(error.message);
          }

        } catch (err) {
          console.error('❌ Error al procesar invoice.payment_succeeded:', err);
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string
        
        if (!subscriptionId) {
          console.warn('⚠️ No se encontró subscription_id en invoice.payment_failed');
          break;
        }

        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const userId = subscription.metadata?.userId

          if (!userId) {
            console.warn('⚠️ No se encontró userId en metadata de la suscripción');
            break;
          }

          const { error } = await supabase
            .from('profiles')
            .update({
              subscription_status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId)

          if (error) {
            console.error(`❌ Error al actualizar el perfil en Supabase para invoice.payment_failed: ${error.message}`, error);
            throw new Error(error.message);
          }

    
        } catch (err) {
          console.error('❌ Error al procesar invoice.payment_failed:', err);
        }
        break
      }

      default:
        // console.log(`🔔 Evento no manejado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('❌ Error procesando el evento:', err.message)
    return new NextResponse(`Error procesando webhook: ${err.message}`, { status: 500 })
  }
}
