import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  // With localStorage-based auth, logout is handled client-side
  // This endpoint just returns success for API consistency
  return NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });
}
