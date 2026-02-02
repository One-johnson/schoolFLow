import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { SessionManager } from '@/lib/session';
import { PasswordManager } from '@/lib/password';

function getConvexClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL is not configured');
  }
  return new ConvexHttpClient(url);
}

interface AdminToCreate {
  name: string;
  email: string;
  schoolId: string;
  tempPassword: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const convex = getConvexClient();

  try {
    // Verify Super Admin session
    const session = await SessionManager.getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { admins } = body as { admins: AdminToCreate[] };

    if (!admins || !Array.isArray(admins) || admins.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Admins array is required' },
        { status: 400 }
      );
    }

    // Hash all passwords
    const adminsWithHashedPasswords = await Promise.all(
      admins.map(async (admin) => ({
        name: admin.name,
        email: admin.email,
        schoolId: admin.schoolId,
        status: 'pending' as const,
        invitedBy: 'super_admin',
        tempPassword: await PasswordManager.hash(admin.tempPassword),
      }))
    );

    // Create all admins
    await convex.mutation(api.schoolAdmins.bulkCreate, {
      admins: adminsWithHashedPasswords,
    });

    return NextResponse.json({
      success: true,
      message: `${admins.length} School Admins created successfully`,
      count: admins.length,
      // Return the original admins with plain text passwords for display
      admins: admins.map((admin) => ({
        name: admin.name,
        email: admin.email,
        schoolId: admin.schoolId,
        password: admin.tempPassword,
      })),
    });
  } catch (error) {
    console.error('Bulk create school admins error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create school admins' },
      { status: 500 }
    );
  }
}
