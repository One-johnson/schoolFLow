
import { adminAuth } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName } = await req.json();

    if (!email || !password || !displayName) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    // Create user in Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    // Set the custom claim for the admin role
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'admin' });

    return NextResponse.json({ uid: userRecord.uid }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    // Provide a more specific error message if available
    const errorMessage = error.code ? `Firebase error (${error.code}): ${error.message}` : 'Error creating user: ' + error.message;
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
