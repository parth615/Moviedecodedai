'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

import fs from 'fs';
import path from 'path';

export async function addGameplayAsset(formData: FormData) {
  const file = formData.get('file') as File | null;
  const title = formData.get('title') as string;
  let durationStr = formData.get('duration') as string;
  const tags = formData.get('tags') as string;
  const license = formData.get('license') as string;

  if (!file || file.size === 0) {
    throw new Error("Missing video file");
  }

  // Ensure gameplay directory exists
  const gpDir = path.join(process.cwd(), 'public', 'gameplay');
  if (!fs.existsSync(gpDir)) {
    fs.mkdirSync(gpDir, { recursive: true });
  }

  // Save the file
  const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filepath = path.join(gpDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filepath, buffer);

  const url = `/gameplay/${filename}`;
  const duration = durationStr ? parseInt(durationStr, 10) : 60; // default 60s

  await prisma.gameplayAsset.create({
    data: {
      title: title || file.name,
      url,
      duration,
      tags,
      license
    }
  });

  revalidatePath('/gameplay');
}

export async function deleteGameplayAsset(id: string) {
  await prisma.gameplayAsset.delete({
    where: { id }
  });
  
  revalidatePath('/gameplay');
}
