import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/user';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(session.user);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Cancel any stuck or hanging jobs
    await prisma.job.updateMany({
      where: {
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      data: {
        status: 'FAILED',
        error: 'Reset by user',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pipeline state reset successfully. You can now generate fresh videos.',
    });
  } catch (error: any) {
    console.error('Error resetting pipeline:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
