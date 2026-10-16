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
      '/data/audio',
      path.join(process.cwd(), 'public', 'audio'),
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
      return new NextResponse(`Audio not found: ${safeFilename}`, { status: 404 });
    }

    const stat = fs.statSync(/*turbopackIgnore: true*/ filePath);
    const fileSize = stat.size;
    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === '.wav' ? 'audio/wav' : ext === '.ogg' ? 'audio/ogg' : 'audio/mpeg';

    const range = request.headers.get('range');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        return new NextResponse('Requested range not satisfiable', {
          status: 416,
          headers: { 'Content-Range': `bytes */${fileSize}` },
        });
      }

      const chunkSize = end - start + 1;
      const nodeStream = fs.createReadStream(/*turbopackIgnore: true*/ filePath, { start, end });
      const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;

      return new Response(webStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    const nodeStream = fs.createReadStream(/*turbopackIgnore: true*/ filePath);
    const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;

    return new Response(webStream, {
      status: 200,
      headers: {
        'Content-Length': String(fileSize),
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error: any) {
    console.error('[AudioRoute] Error streaming audio:', error);
    return new NextResponse(`Internal error: ${error.message}`, { status: 500 });
  }
}
