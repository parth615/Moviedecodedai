import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UPI_PACKAGES } from "@/lib/upi";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { packageId, utr, referenceId } = body;

    const selectedPkg = UPI_PACKAGES.find((p) => p.id === packageId) || UPI_PACKAGES[0];

    // Atomically increment user credits and record Payment
    const [updatedUser, payment] = await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          credits: { increment: selectedPkg.credits },
        },
        select: {
          id: true,
          credits: true,
        },
      }),
      prisma.payment.create({
        data: {
          userId: session.user.id,
          amount: selectedPkg.priceInr,
          currency: "INR",
          credits: selectedPkg.credits,
          status: "COMPLETED",
          method: "UPI",
          utr: utr ? String(utr).trim() : null,
          packageId: selectedPkg.id,
          notes: referenceId ? `Ref: ${referenceId}` : undefined,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Payment confirmed! Added ${selectedPkg.credits} credits to your account.`,
      newCredits: updatedUser.credits,
      paymentId: payment.id,
    });
  } catch (error: any) {
    console.error("UPI Verification Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
