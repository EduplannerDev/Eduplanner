// app/api/stripe/cancel-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import stripe from '@/lib/stripe'
import { cancelSubscription } from '@/lib/subscription-utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'Se requiere userId' }, { status: 400 })
    }

    // 1. Obtener información de Stripe del usuario desde Supabase
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', userId)
      .single()

    if (profileError || !profile?.stripe_customer_id) {
      console.error('Error obteniendo stripe_customer_id:', profileError)
      return NextResponse.json(
        { error: 'No se encontró información de suscripción' },
        { status: 404 }
      )
    }

    // 2. Obtener las suscripciones activas del cliente
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
    })
    console.log('Subscriptions:', subscriptions)

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron suscripciones activas' },
        { status: 404 }
      )
    }

    // 3. Cancelar la suscripción al final del período actual
    const subscription = subscriptions.data[0]
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    })

    console.log('Full updatedSubscription object:', updatedSubscription)

    let endDate: Date | null = null;

    // Stripe's cancel_at is a Unix timestamp (seconds), convert to milliseconds for JavaScript Date object
    if (updatedSubscription.cancel_at_period_end && updatedSubscription.cancel_at) {
      endDate = new Date(updatedSubscription.cancel_at * 1000);
    } else if (updatedSubscription.current_period_end) {
      // Fallback to current_period_end if cancel_at is not available (e.g., immediate cancellation)
      endDate = new Date(updatedSubscription.current_period_end * 1000);
    }

    // Ensure endDate is a valid Date object, otherwise set to null
    if (endDate && isNaN(endDate.getTime())) {
      endDate = null;
    }

    // 4. Actualizar el estado en Supabase usando las funciones utilitarias
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'cancelling',
        subscription_end_date: endDate?.toISOString() || null,
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error actualizando estado de suscripción:', updateError)
      // Continuamos porque la cancelación en Stripe ya fue exitosa
    }

    return NextResponse.json({
      success: true,
      message: 'Suscripción cancelada correctamente. Permanecerá activa hasta el final del período de facturación.',
    })
  } catch (error: any) {
    console.error('Error cancelando suscripción:', error.message)
    return NextResponse.json(
      { error: 'Error al procesar la cancelación' },
      { status: 500 }
    )
  }
}