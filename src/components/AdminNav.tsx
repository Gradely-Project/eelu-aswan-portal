"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, UserPlus, Layers } from "lucide-react";

export default function AdminNav({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();

  const links = [
    {
      href: "/admin/students",
      label: "Pending Student Admissions",
      icon: Users,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      href: "/admin/teams",
      label: "Track Team Formation (Head & Core)",
      icon: UserPlus,
    },
    {
      href: "/admin/tracks",
      label: "Tracks Management",
      icon: Layers,
    },
  ];

  return (
    <div className="bg-white border-b border-slate-200 mb-8 rounded-xl shadow-sm p-2 no-print">
      <div className="flex flex-wrap items-center gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
              {link.badge !== null && link.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 text-xs font-black rounded-full ${
                    isActive ? "bg-red-500 text-white" : "bg-red-100 text-red-600"
                  }`}
                >
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
