'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SantisoftLogo from './SantisoftLogo';
import {
  LayoutDashboard,
  ShieldX,
  Settings,
  Code2,
  LogOut,
  Shield,
  Bell,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard',             icon: LayoutDashboard, label: 'Vista General' },
  { href: '/dashboard/blocked-ips', icon: ShieldX,          label: 'IPs Bloqueadas' },
  { href: '/dashboard/rules',       icon: Settings,         label: 'Reglas de Bloqueo' },
  { href: '/dashboard/install',     icon: Code2,            label: 'Instalación' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-screen bg-[#0d1117] border-r border-white/5">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/5">
        <Link href="/dashboard" className="block hover:opacity-90 transition-opacity">
          <SantisoftLogo mode="dark" size={32} animated={true} />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={active ? 'sidebar-item-active' : 'sidebar-item'}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-white/5 space-y-1">
        <button className="sidebar-item w-full">
          <Bell className="w-4 h-4" />
          Notificaciones
        </button>
        <button
          id="logout-btn"
          className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
