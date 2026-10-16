export interface PromoToken {
  credits: number;
  label: string;
}

export const DEFAULT_PROMO_TOKENS: Record<string, PromoToken> = {
  // Family & Friends specific tokens
  'PARTH-VIP-100': {
    credits: 100,
    label: 'Parth VIP Pass (100 Free Videos)',
  },
  'PARTH-VIP': {
    credits: 100,
    label: 'Parth VIP Pass (100 Free Videos)',
  },
  'FAMILY-FREE-PASS': {
    credits: 250,
    label: 'Family & Friends Superpass (250 Free Videos)',
  },
  'FRIENDS-FREE': {
    credits: 50,
    label: 'Friends Gift Pass (50 Free Videos)',
  },
  'UNLIMITED-CREATOR': {
    credits: 1000,
    label: 'Creator Ultimate Pass (1000 Free Videos)',
  },
};

export function getPromoToken(code: string): PromoToken | null {
  const normalized = code.trim().toUpperCase();
  return DEFAULT_PROMO_TOKENS[normalized] || null;
}
