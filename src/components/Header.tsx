"use client";

import { useState, useEffect } from "react";
import { Bell, User, LogOut, LogIn, Coins, Zap, Menu } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { UpiPaymentModal } from "@/components/UpiPaymentModal";

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
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
      <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-3 sm:px-6 lg:px-8 shadow-sm">
        
        {/* Left Side: Mobile Hamburger + Brand */}
        <div className="flex items-center gap-2 sm:gap-4">
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 -ml-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}

          {/* Mobile Brand Name */}
          <div className="md:hidden flex items-center">
            <span className="font-black text-sm text-white tracking-wide">
              <span className="text-blue-500">Movie</span>Decoded
            </span>
          </div>
        </div>

        {/* Right Side: Credits + Top Up + Profile / Logout */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {session?.user && (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#26e200]/10 text-white text-xs sm:text-sm font-bold border border-[#26e200]/30 shrink-0">
              <Coins size={14} className="text-[#ffff00] shrink-0" />
              <span className="whitespace-nowrap">
                <strong className="text-[#26e200]">{credits}</strong> <span className="hidden sm:inline">Credits</span>
              </span>
              <button
                onClick={() => setIsUpiModalOpen(true)}
                className="ml-0.5 sm:ml-1 bg-[#26e200] hover:bg-[#20be00] text-black text-[11px] sm:text-xs font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shadow-sm"
              >
                <Zap size={11} className="fill-black shrink-0" />
                <span className="hidden sm:inline">Top Up UPI (₹9)</span>
                <span className="inline sm:hidden">Top Up ₹9</span>
              </button>
            </div>
          )}

          <button 
            type="button" 
            className="hidden sm:flex -m-2 p-2 text-slate-400 hover:text-slate-300"
            aria-label="View notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
          
          <div className="hidden lg:block h-6 w-px bg-slate-800" aria-hidden="true" />
          
          <div className="flex items-center gap-2 sm:gap-3">
            {session ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  {session.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt="" 
                      className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-slate-800 ring-1 ring-slate-700" 
                    />
                  ) : (
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                  )}
                  <span className="hidden lg:block text-sm font-semibold text-slate-200">
                    {session.user?.name}
                  </span>
                </div>
                
                <button 
                  onClick={() => signOut()}
                  className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-white p-1.5 sm:p-0 rounded-lg hover:bg-slate-800 sm:hover:bg-transparent transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => signIn('google')}
                className="flex items-center gap-1.5 bg-white text-black px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold hover:bg-slate-200 transition-colors cursor-pointer shadow-sm"
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Pay-As-You-Go UPI Modal */}
      <UpiPaymentModal
        isOpen={isUpiModalOpen}
        onClose={() => setIsUpiModalOpen(false)}
        reason="Instant UPI recharge for automated short video generation."
        onSuccess={(newCredits) => setCredits(newCredits)}
      />
    </>
  );
}
