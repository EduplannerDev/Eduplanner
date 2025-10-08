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
        
        // En desarrollo, agregar un listener para cuando regrese del pago
        if (url && process.env.NODE_ENV === 'development') {
            // Guardar userId en localStorage para usarlo cuando regrese
            localStorage.setItem('pendingSubscriptionUserId', userId);
        }
        
        return url;
  } catch (err: any) {
    return null;
  }
};

// Función para simular webhook en desarrollo
export const simulateWebhookInDevelopment = async (userId: string) => {
  if (process.env.NODE_ENV !== 'development') return;
  
  try {
    // Usar los datos reales que ya tienes en tu perfil
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_' + Date.now(),
          customer: 'cus_TC8CDCk22htjb5', // Tu customer ID real
          subscription: 'sub_1SFjwJFNlJlgjkmJmff19epT', // Tu subscription ID real
          customer_email: 'hazzel90@gmail.com',
          metadata: {
            userId: userId
          }
        }
      }
    };

    const response = await fetch('/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature'
      },
      body: JSON.stringify(mockEvent)
    });

    if (!response.ok) {
      // Error silencioso en desarrollo
    }
  } catch (error) {
    // Error silencioso en desarrollo
  }
};
