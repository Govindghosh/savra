"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Activity, BookOpen, GraduationCap, LogOut, Shield, User as UserIcon, type LucideIcon } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getHealth, getRoleHome, type Role } from "@/lib/api";

type AppShellProps = {
  title: string;
  requiredRoles: Role[];
  children: ReactNode;
};

const navItems: Array<{
  href: string;
  label: string;
  roles: Role[];
  icon: LucideIcon;
}> = [
  { href: "/teacher", label: "Teacher", roles: ["teacher"], icon: GraduationCap },
  { href: "/student", label: "Student", roles: ["student"], icon: BookOpen },
  { href: "/admin", label: "Admin", roles: ["admin"], icon: Shield }
];

export function AppShell({ title, requiredRoles, children }: AppShellProps) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [health, setHealth] = useState<"checking" | "ok" | "down">("checking");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    if (!requiredRoles.includes(user.role)) {
      router.replace(getRoleHome(user.role));
    }
  }, [loading, requiredRoles, router, user]);

  useEffect(() => {
    let active = true;

    getHealth()
      .then((response) => {
        if (active) setHealth(response.status === "ok" ? "ok" : "down");
      })
      .catch(() => {
        if (active) setHealth("down");
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading || !user || !requiredRoles.includes(user.role)) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm font-medium text-slate-500">Loading Savra</div>
      </main>
    );
  }

  const visibleNav = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur px-5 py-3">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">S</div>
            <div>
              <div className="text-lg font-bold text-slate-950">Savra</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">{user.role}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${
                    active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              <Activity className={`h-4 w-4 ${health === "ok" ? "text-emerald-600" : "text-amber-600"}`} aria-hidden="true" />
              API {health}
            </div>
            <Link
              href="/profile"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <UserIcon className="h-4 w-4 text-slate-500" />
              Profile
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >

              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-950">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{user.email}</p>
        </div>
        {children}
      </main>
    </div>
  );
}
