import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/providers?error=missing_code', req.url));
  }

  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/api/auth/instagram/callback';

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/providers?error=missing_credentials', req.url));
  }

  try {
    // 1. Exchange code for short-lived access token
    const tokenForm = new URLSearchParams();
    tokenForm.append('client_id', clientId);
    tokenForm.append('client_secret', clientSecret);
    tokenForm.append('grant_type', 'authorization_code');
    tokenForm.append('redirect_uri', redirectUri);
    tokenForm.append('code', code);

    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: tokenForm
    });
    const tokenData = await tokenRes.json();

    if (tokenData.error_message) {
      console.error('Instagram Token Error:', tokenData.error_message);
      return NextResponse.redirect(new URL('/providers?error=instagram_token_failed', req.url));
    }

    const shortLivedToken = tokenData.access_token;
    const userId = tokenData.user_id;

    // 2. Exchange short-lived token for long-lived token
    const longTokenUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedToken}`;
    const longTokenRes = await fetch(longTokenUrl);
    const longTokenData = await longTokenRes.json();
    
    const accessToken = longTokenData.access_token || shortLivedToken;
    const expiresIn = longTokenData.expires_in; // Usually 60 days
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    // 3. Get basic profile info for UI
    const profileUrl = `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`;
    const profileRes = await fetch(profileUrl);
    const profileData = await profileRes.json();

    await prisma.oAuthCredential.upsert({
      where: {
        userId_provider: {
          userId,
          provider: 'instagram'
        }
      },
      update: {
        accessToken,
        expiresAt,
        accountInfo: JSON.stringify({ name: profileData.username || 'Instagram Account', id: userId })
      },
      create: {
        userId,
        provider: 'instagram',
        accessToken,
        expiresAt,
        accountInfo: JSON.stringify({ name: profileData.username || 'Instagram Account', id: userId })
      }
    });

    return NextResponse.redirect(new URL('/providers?success=instagram_connected', req.url));
  } catch (error) {
    console.error('Error in Instagram OAuth:', error);
    return NextResponse.redirect(new URL('/providers?error=internal_server_error', req.url));
  }
}
