import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.redirect(new URL('/providers?error=unauthorized', req.url));
  }
  const userId = (session.user as any).id;

  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/providers?error=missing_code', req.url));
  }

  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/auth/youtube/callback';

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/providers?error=missing_credentials', req.url));
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user profile info just to get a name for the UI
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });
    const userInfo = await oauth2.userinfo.get();
    
    await prisma.oAuthCredential.upsert({
      where: { userId_provider: { userId, provider: 'youtube' } },
      update: {
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token || undefined,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        scopes: tokens.scope,
        accountInfo: JSON.stringify({ name: userInfo.data.name || 'YouTube Account', email: userInfo.data.email })
      },
      create: {
        userId,
        provider: 'youtube',
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token || null,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scopes: tokens.scope,
        accountInfo: JSON.stringify({ name: userInfo.data.name || 'YouTube Account', email: userInfo.data.email })
      }
    });

    return NextResponse.redirect(new URL('/providers?success=youtube_connected', req.url));
  } catch (error) {
    console.error('Error exchanging YouTube token:', error);
    return NextResponse.redirect(new URL('/providers?error=token_exchange_failed', req.url));
  }
}
