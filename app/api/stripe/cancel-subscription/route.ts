// app/api/stripe/cancel-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import stripe from '@/lib/stripe'

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


    if (profileError) {
      return NextResponse.json(
        { error: 'Error al obtener información del perfil: ' + profileError.message },
        { status: 500 }
      )
    }

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No se encontró información de suscripción. Asegúrate de tener una suscripción activa.' },
        { status: 404 }
      )
    }

    // 2. Obtener las suscripciones activas del cliente
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
    })


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



    let endDate: Date | null = null;

    // Stripe's current_period_end is a Unix timestamp (seconds), convert to milliseconds for JavaScript Date object
    if (subscription.current_period_end) {
      endDate = new Date(subscription.current_period_end * 1000);
      
      // Ensure endDate is a valid Date object, otherwise set to null
      if (isNaN(endDate.getTime())) {
        endDate = null;
      }
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