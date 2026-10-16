import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        let dbUser = null;
        if (token.sub) {
          try {
            dbUser = await prisma.user.findUnique({ where: { id: token.sub } });
          } catch (_) {}
        }
        if (!dbUser && session.user.email) {
          try {
            dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
          } catch (_) {}
        }
        if (!dbUser && (token.sub || session.user.email)) {
          try {
            dbUser = await prisma.user.create({
              data: {
                id: token.sub || undefined,
                email: session.user.email || undefined,
                name: session.user.name || null,
                image: session.user.image || null,
                credits: 0,
              },
            });
          } catch (_) {
            if (session.user.email) {
              try {
                dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
              } catch (_) {}
            }
          }
        }

        if (dbUser) {
          session.user.id = dbUser.id;
          (session.user as any).credits = dbUser.credits;
        } else if (token.sub) {
          session.user.id = token.sub;
          (session.user as any).credits = 0;
        }
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_dev",
};
