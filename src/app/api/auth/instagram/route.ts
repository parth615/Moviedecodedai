import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/api/auth/instagram/callback';

  if (!clientId) {
    return NextResponse.json({ error: 'Missing INSTAGRAM_CLIENT_ID in .env' }, { status: 400 });
  }

  // Instagram Basic Display API OAuth URL
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile,user_media&response_type=code`;

  return NextResponse.redirect(authUrl);
}
