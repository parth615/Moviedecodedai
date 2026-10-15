import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LandingPageClient } from "./LandingPageClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getServerSession(authOptions);
  return <LandingPageClient session={session} />;
}
