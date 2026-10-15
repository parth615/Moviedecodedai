export interface UpiPackage {
  id: string;
  name: string;
  credits: number;
  priceInr: number;
  popular?: boolean;
  perVideo: string;
  badge?: string;
}

export const UPI_PACKAGES: UpiPackage[] = [
  {
    id: "single",
    name: "1 Video (Pay As You Go)",
    credits: 1,
    priceInr: 9,
    perVideo: "₹9 / video",
    badge: "Quick Try",
  },
  {
    id: "starter",
    name: "5 Videos Pack",
    credits: 5,
    priceInr: 39,
    perVideo: "₹7.80 / video",
  },
  {
    id: "creator",
    name: "15 Videos (Creator Pack)",
    credits: 15,
    priceInr: 99,
    popular: true,
    perVideo: "₹6.60 / video",
    badge: "Most Popular 🔥",
  },
  {
    id: "studio",
    name: "50 Videos (Studio Pro)",
    credits: 50,
    priceInr: 299,
    perVideo: "₹5.98 / video",
    badge: "Best Value",
  },
];

export function getUpiPaymentUrl({
  payeeVpa,
  payeeName,
  amount,
  transactionNote,
  referenceId,
}: {
  payeeVpa: string;
  payeeName: string;
  amount: number;
  transactionNote: string;
  referenceId?: string;
}): string {
  const params = new URLSearchParams();
  params.set("pa", payeeVpa);
  params.set("pn", payeeName);
  params.set("am", amount.toFixed(2));
  params.set("cu", "INR");
  params.set("tn", transactionNote);
  if (referenceId) {
    params.set("tr", referenceId);
  }
  return `upi://pay?${params.toString()}`;
}

export function getQrCodeUrl(upiUrl: string, size = 280): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    upiUrl
  )}&margin=10`;
}
