import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { PasswordManager } from '@/lib/password';
import type { Id } from '../../../../../convex/_generated/dataModel';

function getConvexClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL is not configured');
  }
  return new ConvexHttpClient(url);
}

export async function POST(request: Request): Promise<NextResponse> {
  const convex = getConvexClient();
  try {
    const body = await request.json();
    const { name, email, password, role, createdBy } = body;

    if (!name || !email || !password || !role || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['owner', 'admin', 'moderator'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await PasswordManager.hash(password);

    // Create the super admin in Convex
    const adminId = await convex.mutation(api.superAdmins.create, {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      createdBy,
    });

    return NextResponse.json({
      success: true,
      adminId,
      message: 'Super admin created successfully',
    });
  } catch (error) {
    console.error('Error creating super admin:', error);

    if (error instanceof Error) {
      if (error.message.includes('Email already exists')) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create super admin' },
      { status: 500 }
    );
  }
}
