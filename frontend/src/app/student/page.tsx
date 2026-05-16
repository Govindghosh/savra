"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Download, FileText, Library, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SummaryCard } from "@/components/summary-card";
import {
  getApiErrorMessage,
  getContentAccess,
  getContentLibrary,
  getPptDownloadName,
  getPptDownloadUrl,
  getCurrentUser,
  type AccessResponse,
  type ContentLibraryResponse,
  type User
} from "@/lib/api";

export default function StudentPage() {
  const [contentAccess, setContentAccess] = useState<AccessResponse | null>(null);
  const [library, setLibrary] = useState<ContentLibraryResponse | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([getContentAccess(), getContentLibrary(), getCurrentUser()])
      .then(([access, content, user]) => {
        if (!active) return;
        setContentAccess(access);
        setLibrary(content);
        setCurrentUser(user);
      })
      .catch((err) => {
        if (active) setError(getApiErrorMessage(err));
      });


    return () => {
      active = false;
    };
  }, []);

  const presentations = library?.presentations ?? [];
  const materials = library?.materials ?? [];

  return (
    <AppShell title="Student Workspace" requiredRoles={["student"]}>
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Access" value={contentAccess?.status ?? "checking"} icon={ShieldCheck} />
        <SummaryCard label="Materials" value={materials.length} icon={BookOpen} />
        <SummaryCard label="Presentations" value={presentations.length} icon={Library} />
        <SummaryCard label="Mode" value="read only" icon={CheckCircle2} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Available Presentations</h2>
              <p className="mt-1 text-sm text-slate-500">Download teacher-approved decks for revision and class prep.</p>
            </div>
            <Library className="h-6 w-6 text-blue-600" aria-hidden="true" />
          </div>

          {presentations.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {presentations.map((item) => (
                <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-950">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Grade {item.grade} {item.subject ? `- ${item.subject}` : ""} - {item.slides} slides
                      </p>
                    </div>
                    <FileText className="h-5 w-5 text-slate-500" aria-hidden="true" />
                  </div>
                  {item.pptUrl && (
                    <a
                      href={getPptDownloadUrl(item.pptUrl)}
                      download={getPptDownloadName(item.title, item.grade)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      Download PPT
                    </a>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <h3 className="font-semibold text-slate-900">No presentations yet</h3>
              <p className="mt-1 text-sm text-slate-500">Completed teacher decks will appear here automatically.</p>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-950 mb-4">My Profile</h2>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</div>
                <div className="text-sm font-bold text-slate-950">{currentUser?.name || "Student"}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Grade</div>
                <div className="text-sm font-bold text-slate-950">Grade {currentUser?.grade || "N/A"}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Subjects</div>
                <div className="text-sm font-medium text-slate-700">{currentUser?.subjects || "N/A"}</div>
              </div>
            </div>
            <Link
              href="/profile"
              className="mt-4 block text-center text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
            >
              View Full Profile
            </Link>
          </section>


          <section className="rounded-lg border border-slate-200 bg-white p-5">

            <h2 className="text-lg font-bold text-slate-950">Study Material</h2>
            <div className="mt-4 space-y-3">
              {materials.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-sm font-semibold text-slate-950">{item.title}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.description}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold text-slate-950">How To Use</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>Open the latest deck before class.</p>
              <p>Use summary cards for quick revision.</p>
              <p>Practice quiz material after reading the slides.</p>
            </div>
          </section>
        </aside>
      </div>

      {error && <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
    </AppShell>
  );
}
