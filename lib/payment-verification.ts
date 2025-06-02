import Stripe from 'stripe';

// 只有在有 Stripe 密钥时才初始化 Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function verifyStripePayment(sessionId: string): Promise<boolean> {
  try {
    if (!stripe) {
      console.error('Stripe not initialized');
      return false;
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // 检查支付状态
    if (session.payment_status === 'paid') {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Stripe verification error:', error);
    return false;
  }
}

export async function createStripeCheckoutSession(priceId: string, successUrl: string, cancelUrl: string) {
  try {
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return session;
  } catch (error) {
    console.error('Stripe session creation error:', error);
    throw error;
  }
}

// 简单的内存存储（生产环境应该使用数据库）
const paidSessions = new Set<string>();

export function recordPayment(sessionId: string): void {
  paidSessions.add(sessionId);
  console.log('Payment recorded for session:', sessionId);
}

export function verifyPayment(sessionId: string): boolean {
  return paidSessions.has(sessionId);
}

export { stripe }; 