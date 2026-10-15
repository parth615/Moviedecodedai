"use client";

import { useState, useEffect } from "react";
import { Bell, User, LogOut, LogIn, Coins, Zap } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { UpiPaymentModal } from "@/components/UpiPaymentModal";

export function Header() {
  const { data: session } = useSession();
  const [credits, setCredits] = useState<number>(0);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);

  // Sync credits with backend
  useEffect(() => {
    if (!session?.user?.id) return;
    
    // Initial from session
    if (typeof (session.user as any).credits === "number") {
      setCredits((session.user as any).credits);
    }

    // Refresh from API
    fetch("/api/user/credits")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.credits === "number") {
          setCredits(data.credits);
        }
      })
      .catch(() => {});
  }, [session?.user?.id]);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-800 bg-slate-900 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            
            {session?.user && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#26e200]/10 text-white text-xs sm:text-sm font-bold border border-[#26e200]/30">
                <Coins size={16} className="text-[#ffff00]" />
                <span>
                  <strong className="text-[#26e200]">{credits}</strong> Credits
                </span>
                <button
                  onClick={() => setIsUpiModalOpen(true)}
                  className="ml-1 bg-[#26e200] hover:bg-[#20be00] text-black text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Zap size={12} className="fill-black" />
                  <span>Top Up UPI (₹9)</span>
                </button>
              </div>
            )}

            <button type="button" className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-300">
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" aria-hidden="true" />
            </button>
            
            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-700" aria-hidden="true" />
            
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {session ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    {session.user?.image ? (
                      <img src={session.user.image} alt="" className="h-8 w-8 rounded-full bg-slate-800" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                    )}
                    <span className="hidden lg:block text-sm font-semibold leading-6 text-slate-200">
                      {session.user?.name}
                    </span>
                  </div>
                  <button 
                    onClick={() => signOut()}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => signIn('google')}
                  className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <LogIn size={16} />
                  <span>Sign In with Google</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Pay-As-You-Go UPI Modal */}
      <UpiPaymentModal
        isOpen={isUpiModalOpen}
        onClose={() => setIsUpiModalOpen(false)}
        onSuccess={(newCredits) => setCredits(newCredits)}
      />
    </>
  );
}
