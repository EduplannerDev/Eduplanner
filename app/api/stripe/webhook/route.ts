// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { addMonths, fromUnixTime } from 'date-fns'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)


export async function POST(req: NextRequest) {
  // Log temporal solo para producción
  if (process.env.NODE_ENV === 'production') {
    console.log('🔔 Webhook recibido en producción:', req.method, req.url);
  }
  
  try {
    const signature = req.headers.get('stripe-signature') as string
    const rawBody = await req.arrayBuffer()
    const buf = Buffer.from(rawBody)

    if (!signature) {
      return new NextResponse('Missing stripe signature', { status: 400 })
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return new NextResponse('Missing webhook secret', { status: 500 })
    }

    let event: Stripe.Event

    try {
      // En desarrollo, permitir signatures de prueba
      const webhookSecret = process.env.NODE_ENV === 'development' && signature === 'test_signature'
        ? 'test_secret'
        : process.env.STRIPE_WEBHOOK_SECRET!
      
      if (process.env.NODE_ENV === 'development' && signature === 'test_signature') {
        // Crear un evento simulado sin verificar signature
        event = JSON.parse(buf.toString()) as Stripe.Event;
      } else {
        event = stripe.webhooks.constructEvent(buf, signature, webhookSecret)
      }
      
      // Log temporal solo para producción
      if (process.env.NODE_ENV === 'production') {
        console.log('🔔 Evento verificado en producción:', event.type, event.id);
      }
    } catch (err: any) {
      return new NextResponse(`Webhook error: ${err.message}`, { status: 400 })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string


        // En desarrollo, usar un userId por defecto si no está en metadata
        let finalUserId = userId;
        if (!finalUserId && process.env.NODE_ENV === 'development') {
          finalUserId = '7f942e6b-3810-468e-9617-3c24afa5ce2b'; // Tu userId real
        }

        if (!finalUserId) {
          return new NextResponse('Missing userId', { status: 400 });
        }

        // Obtener información de la suscripción para el price_id
        let priceId = null;
        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            priceId = subscription.items.data[0]?.price?.id || null;
          } catch (err) {
            // Error silencioso
          }
        }

        const subscriptionRenewDate = addMonths(new Date(), 1)


        const { data: existingProfile, error: selectError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', finalUserId)
          .single();


        const { data: updateResult, error } = await supabase
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
          .eq('id', finalUserId)
          .select();


        if (error) {
          // Log temporal solo para producción
          if (process.env.NODE_ENV === 'production') {
            console.log('❌ Error actualizando perfil en producción:', error.message);
          }
          throw new Error(error.message);
        }
        
        // Log temporal solo para producción
        if (process.env.NODE_ENV === 'production') {
          console.log('✅ Perfil actualizado a PRO en producción para userId:', finalUserId);
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) {
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
        const subscriptionId = invoice.subscription as string | Stripe.Subscription
        
        if (!subscriptionId) {
          break;
        }

        try {
          const subscription = typeof subscriptionId === 'string' 
            ? await stripe.subscriptions.retrieve(subscriptionId)
            : subscriptionId
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
            throw new Error(error.message);
          }

        } catch (err) {
          // Error silencioso
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string | Stripe.Subscription
        
        if (!subscriptionId) {
          break;
        }

        try {
          const subscription = typeof subscriptionId === 'string' 
            ? await stripe.subscriptions.retrieve(subscriptionId)
            : subscriptionId
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
            throw new Error(error.message);
          }

    
        } catch (err) {
          // Error silencioso
        }
        break
      }

      default:
        // Evento no manejado
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    return new NextResponse(`Error procesando webhook: ${err.message}`, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
    },
  })
}
