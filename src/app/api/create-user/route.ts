import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { email, password, displayName, role } = await request.json();

    if (!email || !password || !displayName || !role) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    await adminAuth.setCustomUserClaims(userRecord.uid, { role });

    return NextResponse.json({ uid: userRecord.uid }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
