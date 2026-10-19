import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: Request) {
  const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl = process.env.NEXTAUTH_URL || new URL(req.url).origin;
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI || `${baseUrl.replace(/\/$/, '')}/api/auth/youtube/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Missing YouTube OAuth credentials in .env' }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Required to get a refresh token
    scope: scopes,
    prompt: 'consent' // Forces re-consent to ensure we always get a refresh token
  });

  return NextResponse.redirect(authUrl);
}
