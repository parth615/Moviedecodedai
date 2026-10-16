import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPromoToken } from '@/lib/tokens';
import { getOrCreateUser } from '@/lib/user';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to redeem a token.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const rawToken = String(body.token || '').trim();

    if (!rawToken) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid VIP token code.' },
        { status: 400 }
      );
    }

    const normalizedToken = rawToken.toUpperCase();
    const promo = getPromoToken(normalizedToken);

    if (!promo) {
      return NextResponse.json(
        { success: false, error: 'Invalid token code. Please check the spelling or ask Parth for a valid VIP pass.' },
        { status: 400 }
      );
    }

    const user = await getOrCreateUser(session.user);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User record could not be resolved. Please re-login.' },
        { status: 400 }
      );
    }

    // Check if the user already redeemed this token
    const alreadyRedeemed = await prisma.payment.findFirst({
      where: {
        userId: user.id,
        packageId: normalizedToken,
        method: 'PROMO_CODE',
      },
    });

    if (alreadyRedeemed) {
      return NextResponse.json(
        { success: false, error: `You have already redeemed the token "${normalizedToken}" on this account.` },
        { status: 400 }
      );
    }

    // Atomically increment user credits
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        credits: { increment: promo.credits },
      },
    });

    // Record the redemption
    await prisma.payment.create({
      data: {
        userId: user.id,
        amount: 0,
        currency: 'INR',
        credits: promo.credits,
        status: 'COMPLETED',
        method: 'PROMO_CODE',
        packageId: normalizedToken,
        notes: promo.label,
      },
    });

    return NextResponse.json({
      success: true,
      message: `🎉 Success! Redeemed "${promo.label}". Added +${promo.credits} free video credits.`,
      newCredits: updatedUser.credits,
      creditsAdded: promo.credits,
    });
  } catch (error: any) {
    console.error('Error redeeming promo token:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error while redeeming token.' },
      { status: 500 }
    );
  }
}
