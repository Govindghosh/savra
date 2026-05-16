"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRoleHome } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? getRoleHome(user.role) : "/login");
  }, [loading, router, user]);

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-sm font-medium text-slate-500">Loading Savra</div>
    </main>
  );
}
