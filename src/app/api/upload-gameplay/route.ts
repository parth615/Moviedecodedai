import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// Allow large file uploads (up to 500MB)
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const durationStr = formData.get('duration') as string;
    const tags = formData.get('tags') as string;
    const license = formData.get('license') as string;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Missing video file" }, { status: 400 });
    }

    console.log(`[UPLOAD] Receiving file: ${file.name}, size: ${file.size} bytes`);

    const gpDir = path.join(process.cwd(), 'public', 'gameplay');
    if (!fs.existsSync(gpDir)) {
      fs.mkdirSync(gpDir, { recursive: true });
    }

    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filepath = path.join(gpDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    console.log(`[UPLOAD] File saved to: ${filepath}`);

    const url = `/gameplay/${filename}`;
    const duration = durationStr ? parseInt(durationStr, 10) : 60;

    const asset = await prisma.gameplayAsset.create({
      data: {
        title: title || file.name,
        url,
        duration,
        tags,
        license
      }
    });

    console.log(`[UPLOAD] Asset created with id: ${asset.id}`);

    return NextResponse.json({ success: true, id: asset.id, url });
  } catch (e: any) {
    console.error('[UPLOAD] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
