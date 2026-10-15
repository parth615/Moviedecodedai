import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { UPI_PACKAGES, getUpiPaymentUrl, getQrCodeUrl } from "@/lib/upi";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const packageId = body.packageId || "single";
    const selectedPkg = UPI_PACKAGES.find((p) => p.id === packageId) || UPI_PACKAGES[0];

    // Read UPI ID from settings or environment, or fallback to user default
    const dbUpi = await getSetting("UPI_ID");
    const payeeVpa = dbUpi || process.env.UPI_ID || "parth.khanna1509@okaxis";
    const payeeName = "MovieDecoded AI";

    const refId = `MD-${Date.now().toString(36).toUpperCase()}`;
    const transactionNote = `Credits for ${selectedPkg.credits} Videos Ref ${refId}`;

    const upiUrl = getUpiPaymentUrl({
      payeeVpa,
      payeeName,
      amount: selectedPkg.priceInr,
      transactionNote,
      referenceId: refId,
    });

    const qrCodeUrl = getQrCodeUrl(upiUrl);

    return NextResponse.json({
      success: true,
      order: {
        packageId: selectedPkg.id,
        packageName: selectedPkg.name,
        amount: selectedPkg.priceInr,
        credits: selectedPkg.credits,
        payeeVpa,
        payeeName,
        referenceId: refId,
        upiUrl,
        qrCodeUrl,
      },
    });
  } catch (error: any) {
    console.error("UPI Order Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
