import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ filename?: string[] }> }
) {
  try {
    const params = await props.params;
    const segments = params.filename || [];
    if (segments.length === 0) {
      return new NextResponse('Filename required', { status: 400 });
    }

    const rawFilename = segments.join('/');
    const safeFilename = path.normalize(rawFilename).replace(/^(\.\.[\/\\])+/, '');

    const searchDirs = [
      '/data/images',
      path.join(process.cwd(), 'public', 'images'),
      path.join(process.cwd(), 'public'),
      '/data',
    ];

    let filePath: string | null = null;
    for (const dir of searchDirs) {
      const candidate = path.join(/*turbopackIgnore: true*/ dir, safeFilename);
      if (fs.existsSync(/*turbopackIgnore: true*/ candidate) && fs.statSync(/*turbopackIgnore: true*/ candidate).isFile()) {
        filePath = candidate;
        break;
      }
    }

    if (!filePath) {
      return new NextResponse(`Image not found: ${safeFilename}`, { status: 404 });
    }

    const stat = fs.statSync(/*turbopackIgnore: true*/ filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.svg' ? 'image/svg+xml' : 'image/jpeg';

    const nodeStream = fs.createReadStream(/*turbopackIgnore: true*/ filePath);
    const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;

    return new Response(webStream, {
      status: 200,
      headers: {
        'Content-Length': String(stat.size),
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    console.error('[ImageRoute] Error streaming image:', error);
    return new NextResponse(`Internal error: ${error.message}`, { status: 500 });
  }
}
