"use client";

import { useEffect, useState } from "react";
import { User as UserIcon, Mail, Shield, Calendar, Award, BookOpen, GraduationCap, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser, getRoleHome, type User } from "@/lib/api";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppShell title="Profile" requiredRoles={["admin", "teacher", "student"]}>
        <div className="flex items-center justify-center p-12">
          <div className="text-slate-500">Loading profile...</div>
        </div>
      </AppShell>
    );
  }

  if (!user) return null;

  return (
    <AppShell title="Your Profile" requiredRoles={["admin", "teacher", "student"]}>
      <div className="mb-6">
        <Link
          href={getRoleHome(user.role)}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <UserIcon className="h-12 w-12" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-950">{user.name || "Savra User"}</h2>
            <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-500">
              <Shield className="h-4 w-4" />
              {user.role.toUpperCase()}
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {user.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600"
                >
                  {cap.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 space-y-4 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-slate-400" />
              <div className="flex-1 overflow-hidden">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-tight">Email</div>
                <div className="truncate font-medium text-slate-900">{user.email}</div>
              </div>
            </div>
            {user.age && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-slate-400" />
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-tight">Age</div>
                  <div className="font-medium text-slate-900">{user.age} Years</div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950 mb-6">Profile Details</h3>

            <div className="grid gap-8 sm:grid-cols-2">
              {user.role === "teacher" && (
                <>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Qualification</div>
                      <div className="mt-0.5 font-bold text-slate-900">{user.qualification || "N/A"}</div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Experience</div>
                      <div className="mt-0.5 font-bold text-slate-900">{user.experience} Years</div>
                    </div>
                  </div>
                  <div className="col-span-full flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Proficiency</div>
                      <div className="mt-0.5 font-bold text-slate-900">{user.proficiency || "N/A"}</div>
                    </div>
                  </div>
                </>
              )}

              {user.role === "student" && (
                <>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Academic Grade</div>
                      <div className="mt-0.5 font-bold text-slate-900">Grade {user.grade}</div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Subjects</div>
                      <div className="mt-0.5 font-bold text-slate-900">{user.subjects || "N/A"}</div>
                    </div>
                  </div>
                </>
              )}

              {user.role === "admin" && (
                <div className="col-span-full p-4 rounded-lg bg-slate-50 text-sm text-slate-500">
                  As an administrator, you have full system-wide control. No specific academic profile fields assigned.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950 mb-4">Account Security</h3>
            <p className="text-sm text-slate-500 mb-6">
              Manage your password and security settings. Currently, profile edits are managed by school administrators.
            </p>
            <button
              disabled
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400 cursor-not-allowed"
            >
              Change Password
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
