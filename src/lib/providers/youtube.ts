import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { prisma } from '../prisma';

export async function uploadToYouTube(videoPath: string, title: string, description: string, tags: string[], userId: string): Promise<string> {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/auth/youtube/callback';

  if (!clientId || !clientSecret) {
    throw new Error('YouTube credentials missing. Ensure YOUTUBE_CLIENT_ID and SECRET are set in .env.');
  }

  const credential = await prisma.oAuthCredential.findUnique({
    where: { userId_provider: { userId, provider: 'youtube' } }
  });

  if (!credential || !credential.refreshToken) {
    throw new Error('No YouTube account connected. Please connect your account in the Settings dashboard.');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  // Passing both tokens allows the googleapis library to automatically refresh the access token if needed.
  oauth2Client.setCredentials({ 
    access_token: credential.accessToken,
    refresh_token: credential.refreshToken,
    expiry_date: credential.expiresAt ? credential.expiresAt.getTime() : null
  });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  // YouTube Shorts are simply videos under 60s uploaded vertically.
  // We include #Shorts in the title/desc to ensure they are picked up.
  const finalTitle = `${title} #Shorts`;
  const finalDesc = `${description}\n\n${tags.join(' ')} #Shorts`;

  const absPath = path.resolve(videoPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Video file not found at ${absPath}`);
  }

  try {
    const res = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: finalTitle.substring(0, 100),
          description: finalDesc,
          tags,
          categoryId: '24', // Entertainment
        },
        status: {
          privacyStatus: 'public', // Public so videos appear live on YouTube Shorts
          selfDeclaredMadeForKids: false
        },
      },
      media: {
        body: fs.createReadStream(absPath),
      },
    });

    if (!res.data.id) {
      throw new Error('YouTube API failed to return a video ID');
    }

    return res.data.id;
  } catch (err: any) {
    if (err.message === 'invalid_grant' || err.response?.data?.error === 'invalid_grant') {
      throw new Error('YouTube authorization has expired or was revoked. Please go to Providers (/providers) and click "Reconnect" to refresh your YouTube channel link.');
    }
    throw err;
  }
}
