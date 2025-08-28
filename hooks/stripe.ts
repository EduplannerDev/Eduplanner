import stripe from "@/lib/stripe";

type Props = {
    userId: string;
    email?: string;
}
const baseUrl =
    process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://eduplanner.mx';
export const subscribestripe = async ({ userId, email }: Props): Promise<string | null> => {
    try {
        const { url } = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [
                {
                    price: process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID,
                    quantity: 1,
                },
            ],
            customer_email: email,
            metadata: {
                userId, // esto solo lo guarda en el objeto CheckoutSession
            },
            subscription_data: {
                metadata: {
                    userId, // ✅ esto lo guarda dentro de la Subscription (¡es lo que quieres!)
                },
            },
            allow_promotion_codes: true,
            success_url: `${baseUrl}`,
            cancel_url: `${baseUrl}`,
        });

        return url;
    } catch (err: any) {
        console.error('Error creando la sesión de checkout:', err.message);
        return null;
    }
};
