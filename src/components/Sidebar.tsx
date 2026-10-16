'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  List, 
  FileText, 
  Video, 
  CheckSquare, 
  Send, 
  BarChart2, 
  Server, 
  Film, 
  X 
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Topics', href: '/topics', icon: List },
  { name: 'Scripts', href: '/scripts', icon: FileText },
  { name: 'Videos', href: '/videos', icon: Video },
  { name: 'Approval', href: '/approval', icon: CheckSquare },
  { name: 'Published', href: '/published', icon: Send },
  { name: 'Analytics', href: '/analytics', icon: BarChart2 },
  { name: 'Providers', href: '/providers', icon: Server },
  { name: 'Landing Page', href: '/', icon: Film },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-full flex-col bg-slate-900 border-r border-slate-800">
      {/* Sidebar Header */}
      <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-slate-800/60">
        <div>
          <h1 className="text-base font-bold text-white tracking-wide">
            <span className="text-blue-500">AIVideo</span>Generator
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">by MovieDecoded AI</p>
        </div>

        {/* Close Button on Mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex flex-1 flex-col overflow-y-auto pt-4 pb-6">
        <nav className="flex-1 space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onClose?.()}
                className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon
                  className={`mr-3 h-4 w-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Quick Footer inside Sidebar */}
        <div className="px-4 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 text-xs">
            <p className="font-semibold text-slate-300">MovieDecoded v2.1</p>
            <p className="text-slate-500 text-[11px] mt-0.5">Full Autonomous Cloud Engine</p>
          </div>
        </div>
      </div>
    </div>
  );
}
