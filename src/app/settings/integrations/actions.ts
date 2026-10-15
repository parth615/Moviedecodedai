'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function disconnectIntegration(provider: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return;
  await prisma.oAuthCredential.deleteMany({
    where: { provider, userId: session.user.id }
  });
  revalidatePath('/settings/integrations');
}
