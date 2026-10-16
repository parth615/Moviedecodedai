import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrCreateUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ credits: 0 });
    }

    const user = await getOrCreateUser(session.user);
    return NextResponse.json({ credits: user?.credits || 0 });
  } catch (e: any) {
    return NextResponse.json({ credits: 0 });
  }
}
