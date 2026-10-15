import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = session?.user && (session.user as any).id;

  try {
    if (userId) {
      await prisma.oAuthCredential.deleteMany({
        where: { userId, provider: 'youtube' }
      });
    } else {
      await prisma.oAuthCredential.deleteMany({
        where: { provider: 'youtube' }
      });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: true });
  }
}
