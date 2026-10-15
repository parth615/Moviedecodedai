"use client";

import { Bell, User, LogOut, LogIn, Coins } from 'lucide-react';
import { useSession, signIn, signOut } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-800 bg-slate-900 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          
          {session?.user && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium border border-indigo-500/20">
              <Coins size={16} />
              <span>{(session.user as any).credits || 0} Credits</span>
              <button 
                onClick={async () => {
                   const res = await fetch('/api/checkout', { method: 'POST', body: JSON.stringify({ credits: 10 }) });
                   const data = await res.json();
                   if (data.url) window.location.href = data.url;
                }}
                className="ml-2 hover:text-white underline decoration-indigo-500/50 underline-offset-2"
              >
                Buy More
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
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => signIn('google')}
                className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                <LogIn size={16} />
                <span>Sign In with Google</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
