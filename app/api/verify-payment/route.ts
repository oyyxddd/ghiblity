import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '../../../lib/payment-verification';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    console.log('Verifying payment for session:', sessionId);
    
    const isValidPayment = verifyPayment(sessionId);
    
    if (isValidPayment) {
      console.log('Payment verified successfully');
      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully'
      });
    } else {
      console.log('Payment verification failed');
      return NextResponse.json(
        { success: false, message: 'Payment not found or already used' },
        { status: 403 }
      );
    }
    
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Verification error' },
      { status: 500 }
    );
  }
} 