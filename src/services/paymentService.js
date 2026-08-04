const API_BASE_URL = 'https://site--mutespeak-backend--22t95wnlrvvt.code.run/api/payments';

export const paymentService = {
    // Fetches the wall of successful supporters
    getSupporters: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/supporters`);
            if (!response.ok) throw new Error('Failed to fetch supporters');
            return await response.json();
        } catch (error) {
            console.error("Error fetching supporters:", error);
            throw error;
        }
    },

    // Triggers the Dodo session creation
    createCheckoutSession: async (amount, displayName) => {
        try {
            const response = await fetch(`${API_BASE_URL}/create-dodo-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: amount,
                    currency: 'INR', // Defaulting to INR as per backend design
                    displayName: displayName || 'Anonymous'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create session');
            }

            return await response.json();
        } catch (error) {
            console.error("Error creating checkout session:", error);
            throw error;
        }
    }
};