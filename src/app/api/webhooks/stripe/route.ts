import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2024-12-18.acacia" as any,
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || "whsec_mock"
    );
  } catch (error: any) {
    console.error(`Webhook signature verification failed:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const userId = session.metadata?.userId;
    const creditsToAdd = parseInt(session.metadata?.credits || "0", 10);

    if (userId && creditsToAdd > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          credits: {
            increment: creditsToAdd
          }
        }
      });
      console.log(`Added ${creditsToAdd} credits to user ${userId}`);
    }
  }

  return NextResponse.json({ received: true });
}
