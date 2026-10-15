'use server';

import { revalidatePath } from 'next/cache';
import { setSetting, DEFAULT_SETTINGS } from '@/lib/settings';

export async function updateSetting(formData: FormData) {
  const key = formData.get('key') as string;
  const value = formData.get('value') as string;
  
  if (!key || !value) return;
  
  await setSetting(key as keyof typeof DEFAULT_SETTINGS, value);
  revalidatePath('/settings');
}

export async function pauseAutomation() {
  await setSetting('AUTOMATION_PAUSED', 'true');
  revalidatePath('/settings');
}

export async function resumeAutomation() {
  await setSetting('AUTOMATION_PAUSED', 'false');
  revalidatePath('/settings');
}
