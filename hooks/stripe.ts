type Props = {
    userId: string;
    email?: string;
}

export const subscribestripe = async ({ userId, email }: Props): Promise<string | null> => {
    try {
        const response = await fetch('/api/stripe/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, email }),
        });

        if (!response.ok) {
            throw new Error('Failed to create checkout session');
        }

        const { url } = await response.json();
        return url;
    } catch (err: any) {
        console.error('Error creando la sesión de checkout:', err.message);
        return null;
    }
};
