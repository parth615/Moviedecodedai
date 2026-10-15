import Link from 'next/link';
import { Home, List, FileText, Video, CheckSquare, Send, BarChart2, Settings, Server, Activity, Heart, Film } from 'lucide-react';

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

export function Sidebar() {
  return (
    <div className="flex h-full w-60 flex-col bg-slate-900 border-r border-slate-800">
      <div className="flex h-16 shrink-0 items-center px-6">
        <div>
          <h1 className="text-lg font-bold text-white tracking-wide">
            <span className="text-blue-500">Movie</span>Decoded<span className="text-xs font-mono ml-1 text-slate-400">AI</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Universal Content Engine</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto pt-3 pb-4">
        <nav className="mt-2 flex-1 space-y-0.5 px-3">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <item.icon
                className="mr-3 h-4 w-4 flex-shrink-0 text-slate-400 group-hover:text-white"
                aria-hidden="true"
              />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
