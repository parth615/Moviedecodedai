import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      credits?: number;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    credits?: number;
  }
}
