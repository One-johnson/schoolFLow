import * as admin from 'firebase-admin';

// IMPORTANT: Environment variable handling for Firebase Admin SDK
//
// The `FIREBASE_PRIVATE_KEY` is a multi-line key. When you add it to your
// `.env.local` file, you must wrap it in double quotes (`"`) to preserve
// the newline characters. It should look like this:
//
// FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...your actual key...\n-----END PRIVATE KEY-----\n"
//
// Do NOT attempt to manually escape the newlines. The process.env will
// handle it correctly if it's quoted.

if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!privateKey || !clientEmail || !projectId) {
      throw new Error('Missing Firebase Admin SDK credentials. Please check your .env.local file.');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // The process.env variable will have the literal `\n` characters.
        // We need to replace them with actual newline characters `\n`.
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    // Throwing the error ensures that if initialization fails,
    // the server will not start, preventing cryptic errors elsewhere.
    throw new Error('Could not initialize Firebase Admin SDK. Please check server logs and .env.local configuration.');
  }
}

export const adminAuth = admin.auth();
export const adminDatabase = admin.database();
