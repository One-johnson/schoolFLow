import { NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';

export async function POST(): Promise<NextResponse> {
  try {
    await SessionManager.clearSession();
    
    return NextResponse.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    );
  }
}
