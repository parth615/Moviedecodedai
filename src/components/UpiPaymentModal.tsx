"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  QrCode, 
  Check, 
  Copy, 
  Smartphone, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Coins, 
  Zap,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { UPI_PACKAGES, UpiPackage } from "@/lib/upi";

interface UpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newCredits: number) => void;
  reason?: string;
}

export function UpiPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  reason = "You need generation credits to research topics and render videos.",
}: UpiPaymentModalProps) {
  const [selectedPkg, setSelectedPkg] = useState<UpiPackage>(UPI_PACKAGES[2]); // Default to 15 videos (₹99)
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch / update order whenever selected package changes or modal opens
  useEffect(() => {
    if (!isOpen) {
      setVerifiedSuccess(false);
      setErrorMessage("");
      setUtrNumber("");
      return;
    }

    let isMounted = true;
    setLoadingOrder(true);
    setErrorMessage("");

    fetch("/api/payment/upi/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId: selectedPkg.id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setErrorMessage(data.error || "Failed to generate UPI order.");
        }
      })
      .catch((err) => {
        if (isMounted) setErrorMessage(err.message);
      })
      .finally(() => {
        if (isMounted) setLoadingOrder(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedPkg.id]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, type: "upi" | "amount") => {
    navigator.clipboard.writeText(text);
    if (type === "upi") {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  const handleConfirmPayment = async () => {
    setIsVerifying(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/payment/upi/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPkg.id,
          utr: utrNumber,
          referenceId: order?.referenceId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setVerifiedSuccess(true);
        if (onSuccess) {
          setTimeout(() => {
            onSuccess(data.newCredits);
            onClose();
          }, 1400);
        }
      } else {
        setErrorMessage(data.error || "Could not verify payment. Please check your UTR.");
      }
    } catch (e: any) {
      setErrorMessage(e.message || "Network error. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-950 border-2 border-[#26e200] rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-[0_0_50px_rgba(38,226,0,0.3)] brutal-shadow-green my-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 p-2 rounded-full border border-slate-700 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 bg-[#26e200]/15 text-[#26e200] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-[#26e200]/30 mb-2">
            <Zap size={14} className="fill-[#26e200]" />
            Pay-As-You-Go UPI Instant Recharge
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            GET VIDEO CREDITS
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {reason} Scan with any Indian UPI App (Google Pay, PhonePe, Paytm, CRED).
          </p>
        </div>

        {/* Success Banner */}
        {verifiedSuccess ? (
          <div className="bg-[#26e200]/20 border-2 border-[#26e200] rounded-2xl p-6 text-center space-y-3 animate-wiggle">
            <CheckCircle2 size={48} className="mx-auto text-[#26e200]" />
            <h3 className="text-xl font-black text-white uppercase">Payment Verified!</h3>
            <p className="text-sm text-[#26e200] font-bold">
              Added +{selectedPkg.credits} Video Credits to your account.
            </p>
            <p className="text-xs text-slate-400">Launching your video engine now...</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Package Selector */}
            <div>
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider block mb-2.5">
                1. Select Credits Package:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {UPI_PACKAGES.map((pkg) => {
                  const isSelected = selectedPkg.id === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPkg(pkg)}
                      className={`relative p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-[#26e200] bg-[#26e200]/15 text-white scale-[1.02] shadow-[0_0_15px_rgba(38,226,0,0.3)]"
                          : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {pkg.badge && (
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded block mb-1 w-fit ${
                          pkg.popular ? "bg-[#fe017f] text-white" : "bg-[#ffff00] text-black"
                        }`}>
                          {pkg.badge}
                        </span>
                      )}
                      <div>
                        <div className="text-lg font-black text-white">₹{pkg.priceInr}</div>
                        <div className="text-xs font-bold text-[#26e200]">
                          {pkg.credits} {pkg.credits === 1 ? "Video" : "Videos"}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        {pkg.perVideo}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* UPI QR & Payment Info Card */}
            <div className="bg-black border-2 border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
              
              <div className="flex flex-col sm:flex-row items-center gap-6">
                
                {/* QR Code Frame */}
                <div className="relative shrink-0 bg-white p-2.5 rounded-2xl shadow-xl flex items-center justify-center">
                  {loadingOrder || !order?.qrCodeUrl ? (
                    <div className="w-[180px] h-[180px] flex items-center justify-center text-slate-800 font-mono text-xs">
                      Generating QR...
                    </div>
                  ) : (
                    <img
                      src={order.qrCodeUrl}
                      alt="UPI QR Code"
                      className="w-[180px] h-[180px] object-contain rounded-lg"
                    />
                  )}
                  <div className="absolute -bottom-2 bg-black text-[#ffff00] text-[9px] font-black uppercase px-2 py-0.5 rounded border border-[#ffff00]/40 font-mono">
                    Any UPI App
                  </div>
                </div>

                {/* Amount & UPI Details */}
                <div className="flex-1 space-y-3 w-full text-left">
                  
                  {/* Amount to Pay */}
                  <div className="flex items-center justify-between p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Amount to Pay</span>
                      <span className="text-2xl font-black text-white">₹{selectedPkg.priceInr}.00</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(String(selectedPkg.priceInr), "amount")}
                      className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1.5 rounded border border-slate-700 cursor-pointer"
                    >
                      {copiedAmount ? <Check size={14} className="text-[#26e200]" /> : <Copy size={14} />}
                      {copiedAmount ? "Copied" : "Copy"}
                    </button>
                  </div>

                  {/* Payee UPI ID */}
                  <div className="flex items-center justify-between p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <div className="truncate mr-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Send to UPI ID</span>
                      <span className="text-xs font-mono font-bold text-[#2fcaee] truncate block">
                        {order?.payeeVpa || "parth.khanna1509@okaxis"}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(order?.payeeVpa || "parth.khanna1509@okaxis", "upi")}
                      className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1.5 rounded border border-slate-700 shrink-0 cursor-pointer"
                    >
                      {copiedUpi ? <Check size={14} className="text-[#26e200]" /> : <Copy size={14} />}
                      {copiedUpi ? "Copied" : "Copy"}
                    </button>
                  </div>

                  {/* Mobile 1-Tap Pay Intent Button */}
                  {order?.upiUrl && (
                    <a
                      href={order.upiUrl}
                      className="w-full bg-[#26e200] text-black text-xs font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider hover:bg-[#20be00] transition-colors"
                    >
                      <Smartphone size={14} />
                      <span>Tap to Pay on Mobile (GPay/PhonePe)</span>
                      <ExternalLink size={12} />
                    </a>
                  )}

                </div>

              </div>

              {/* Step 2: Confirmation / UTR */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider block">
                  2. Enter UPI UTR / Ref No (from payment receipt):
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="e.g. 428910398124 (12 digits or Ref ID)"
                    className="flex-1 bg-slate-900 border border-slate-700 focus:border-[#26e200] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 font-mono outline-none"
                  />
                  <button
                    onClick={handleConfirmPayment}
                    disabled={isVerifying}
                    className="w-full sm:w-auto bg-[#26e200] text-black text-xs font-black px-5 py-2.5 rounded-xl uppercase tracking-wider hover:bg-[#20be00] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {isVerifying ? "Verifying..." : "Confirm & Add"}
                    <ArrowRight size={14} />
                  </button>
                </div>

                {errorMessage && (
                  <p className="text-xs text-red-400 font-bold">{errorMessage}</p>
                )}

                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <ShieldCheck size={13} className="text-[#26e200]" />
                  Instant credit activation. 100% money-back guarantee if render fails.
                </p>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
