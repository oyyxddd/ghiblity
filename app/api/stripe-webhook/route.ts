import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { recordPayment } from '../../../lib/payment-verification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');
    
    // 在生产环境中，这里应该验证Stripe webhook签名
    // const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    // stripe.webhooks.constructEvent(body, signature, endpointSecret);
    
    console.log('Stripe webhook received');
    
    // 解析webhook数据
    const event = JSON.parse(body);
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const sessionId = session.id;
      
      console.log('Payment completed for session:', sessionId);
      
      // 记录支付成功
      recordPayment(sessionId);
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 400 }
    );
  }
} 