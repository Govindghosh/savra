"use client";

import { useEffect, useState, type FormEvent } from "react";
import { BookOpen, CheckCircle2, Clock3, Download, Layers, Send, Sparkles, XCircle, Users, UserPlus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { JobList } from "@/components/job-list";
import { SummaryCard } from "@/components/summary-card";
import {
  createGeneration,
  getApiErrorMessage,
  getContentAccess,
  getContentLibrary,
  getJob,
  getPptDownloadName,
  getPptDownloadUrl,
  getTeacherAccess,
  listJobs,
  createAdminUser,
  listTeacherStudents,
  type AccessResponse,
  type ContentLibraryResponse,
  type Job,
  type JobSummary,
  type AdminUser
} from "@/lib/api";

const pollingInterval = Number(process.env.NEXT_PUBLIC_POLLING_INTERVAL_MS);

export default function TeacherPage() {
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState(8);
  const [slides, setSlides] = useState(10);
  const [teacherAccess, setTeacherAccess] = useState<AccessResponse | null>(null);
  const [contentAccess, setContentAccess] = useState<AccessResponse | null>(null);
  const [library, setLibrary] = useState<ContentLibraryResponse | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [summary, setSummary] = useState<JobSummary | null>(null);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationNotice, setGenerationNotice] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"ppt" | "students">("ppt");

  // Student management state
  const [students, setStudents] = useState<AdminUser[]>([]);
  const [studentNameFilter, setStudentNameFilter] = useState("");
  const [studentGradeFilter, setStudentGradeFilter] = useState("");
  const [studentEmailFilter, setStudentEmailFilter] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentGrade, setStudentGrade] = useState("");
  const [studentSubjects, setStudentSubjects] = useState("");
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);

  const refreshJobs = async () => {
    const response = await listJobs();
    setJobs(response.jobs);
    setSummary(response.summary);
  };

  const refreshStudents = async () => {
    try {
      const users = await listTeacherStudents();
      setStudents(users);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  useEffect(() => {
    let active = true;

    Promise.all([getTeacherAccess(), getContentAccess(), getContentLibrary(), listJobs(), listTeacherStudents()])
      .then(([teacher, content, libraryResponse, jobResponse, studentResponse]) => {
        if (!active) return;
        setTeacherAccess(teacher);
        setContentAccess(content);
        setLibrary(libraryResponse);
        setJobs(jobResponse.jobs);
        setSummary(jobResponse.summary);
        setStudents(studentResponse);
      })
      .catch((err) => {
        if (active) setError(getApiErrorMessage(err));
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!currentJob || (currentJob.status !== "queued" && currentJob.status !== "processing")) return;

    const interval = setInterval(async () => {
      try {
        const updatedJob = await getJob(currentJob.id);
        setCurrentJob(updatedJob);

        if (updatedJob.status === "completed" || updatedJob.status === "failed") {
          setIsGenerating(false);
          await refreshJobs();
        }
      } catch (err) {
        setError(getApiErrorMessage(err));
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [currentJob]);

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsGenerating(true);
    setError("");
    setGenerationNotice("");

    try {
      const response = await createGeneration({
        topic,
        subject: subject.trim() ? subject : undefined,
        grade,
        slides
      });
      const createdJob = await getJob(response.jobId);
      setCurrentJob(createdJob);
      setGenerationNotice(response.cacheHit ? "Matched an existing deck from cache." : response.reused ? "Reusing your existing job." : "New generation queued.");
      await refreshJobs();
    } catch (err) {
      setError(getApiErrorMessage(err));
      setIsGenerating(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingStudent(true);
    setError("");
    try {
      await createAdminUser({
        email: studentEmail,
        password: studentPassword,
        role: "student",
        name: studentName || undefined,
        grade: studentGrade ? parseInt(studentGrade) : undefined,
        subjects: studentSubjects || undefined
      });
      setStudentName("");
      setStudentEmail("");
      setStudentPassword("");
      setStudentGrade("");
      setStudentSubjects("");
      alert("Student account created successfully!");
      await refreshStudents();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsCreatingStudent(false);
    }
  };
  const filteredStudents = students.filter((s) => {
    const matchesName = s.name?.toLowerCase().includes(studentNameFilter.toLowerCase()) ?? (studentNameFilter === "");
    const matchesEmail = s.email.toLowerCase().includes(studentEmailFilter.toLowerCase());
    const matchesGrade = studentGradeFilter ? s.grade === parseInt(studentGradeFilter) : true;
    return matchesName && matchesEmail && matchesGrade;
  });



  const applyPreset = (nextTopic: string, nextSubject: string, nextGrade: number, nextSlides: number) => {
    setTopic(nextTopic);
    setSubject(nextSubject);
    setGrade(nextGrade);
    setSlides(nextSlides);
  };

  return (
    <AppShell title="Teacher Workspace" requiredRoles={["teacher"]}>
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Total Jobs" value={summary?.total ?? 0} icon={Layers} />
        <SummaryCard label="Processing" value={(summary?.queued ?? 0) + (summary?.processing ?? 0)} icon={Clock3} />
        <SummaryCard label="Completed" value={summary?.completed ?? 0} icon={CheckCircle2} />
        <SummaryCard label="Students" value={teacherAccess?.capabilities.includes("manage_students") ? "Manage" : "View"} icon={Users} />
      </div>

      <div className="mt-8 flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("ppt")}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === "ppt" ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          PPT Generation
        </button>
        {teacherAccess?.capabilities.includes("manage_students") && (
          <button
            onClick={() => setActiveTab("students")}
            className={`pb-3 text-sm font-semibold transition-colors ${
              activeTab === "students" ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Manage Students
          </button>
        )}
      </div>

      {activeTab === "ppt" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 h-fit">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Generate PPT</h2>
                <p className="mt-1 text-sm text-slate-500">{teacherAccess?.capability ?? "ppt_generation"}</p>
              </div>
              <BookOpen className="h-6 w-6 text-blue-600" aria-hidden="true" />
            </div>

            <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-900">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Quick setup
              </div>
              <div className="grid gap-2">
                <button type="button" onClick={() => applyPreset("Photosynthesis", "Biology", 8, 10)} className="rounded-lg bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-blue-100">
                  Grade 8 Biology concept deck
                </button>
                <button type="button" onClick={() => applyPreset("Linear Equations", "Mathematics", 7, 8)} className="rounded-lg bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-blue-100">
                  Math formula and example deck
                </button>
                <button type="button" onClick={() => applyPreset("Indian Constitution", "Civics", 9, 12)} className="rounded-lg bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-blue-100">
                  Social studies summary deck
                </button>
              </div>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="label-text text-xs uppercase tracking-wide font-semibold text-slate-500">Topic</label>
                <input
                  className="input-field mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  disabled={isGenerating}
                  required
                />
              </div>

              <div>
                <label className="label-text text-xs uppercase tracking-wide font-semibold text-slate-500">Subject</label>
                <input
                  className="input-field mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text text-xs uppercase tracking-wide font-semibold text-slate-500">Grade</label>
                  <select
                    className="input-field mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={grade}
                    onChange={(event) => setGrade(Number(event.target.value))}
                    disabled={isGenerating}
                  >
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                      <option key={value} value={value}>
                        Grade {value}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label-text text-xs uppercase tracking-wide font-semibold text-slate-500">Slides</label>
                  <input
                    className="input-field mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    type="number"
                    min={1}
                    max={20}
                    value={slides}
                    onChange={(event) => setSlides(Number(event.target.value))}
                    disabled={isGenerating}
                  />
                </div>
              </div>

              <button type="submit" disabled={isGenerating} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-blue-300 transition-colors">
                <Send className="h-4 w-4" aria-hidden="true" />
                {isGenerating ? "Generating" : "Generate"}
              </button>
            </form>

            {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
          </section>

          <section className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">Current Job</h2>
                  <p className="mt-1 text-sm text-slate-500">{contentAccess?.capability ?? "read_content"}</p>
                </div>
                {currentJob?.pptUrl && (
                  <a
                    href={getPptDownloadUrl(currentJob.pptUrl)}
                    download={getPptDownloadName(currentJob.topic, currentJob.grade)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download
                  </a>
                )}
              </div>

              {currentJob ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-950">{currentJob.topic}</div>
                      <div className="text-sm text-slate-500">{currentJob.status}</div>
                    </div>
                    <div className="text-sm font-semibold text-slate-700">{currentJob.progress}%</div>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-blue-600 transition-all" style={{ width: `${currentJob.progress}%` }} />
                  </div>
                  {currentJob.errorMessage && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{currentJob.errorMessage}</p>}
                  {generationNotice && <p className="rounded-lg bg-blue-50 p-3 text-sm font-medium text-blue-800">{generationNotice}</p>}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  No active job
                </div>
              )}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-950">Recent Jobs</h2>
                <button
                  type="button"
                  onClick={() => refreshJobs().catch((err) => setError(getApiErrorMessage(err)))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Refresh
                </button>
              </div>
              <JobList jobs={jobs} onInspect={(jobId) => getJob(jobId).then(setCurrentJob).catch((err) => setError(getApiErrorMessage(err)))} />
            </div>
          </section>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-950">Add Student</h2>
            </div>
            <p className="mb-4 text-sm text-slate-500">Create a student account so they can access your generated presentations.</p>
            
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Student Name"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Student Email</label>
                <input
                  type="email"
                  required
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="student@school.com"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Grade</label>
                  <input
                    type="number"
                    required
                    value={studentGrade}
                    onChange={(e) => setStudentGrade(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Subjects</label>
                  <input
                    type="text"
                    required
                    value={studentSubjects}
                    onChange={(e) => setStudentSubjects(e.target.value)}
                    placeholder="e.g. Science, Art"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isCreatingStudent}
                className="w-full rounded-lg bg-blue-600 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
              >
                {isCreatingStudent ? "Creating..." : "Create Student Account"}
              </button>
            </form>
            {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 overflow-hidden">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-slate-950">Student Roster</h2>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Filter by name..."
                  value={studentNameFilter}
                  onChange={(e) => setStudentNameFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Filter by email..."
                  value={studentEmailFilter}
                  onChange={(e) => setStudentEmailFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                />
                <select
                  value={studentGradeFilter}
                  onChange={(e) => setStudentGradeFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                >
                  <option value="">All Grades</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="pb-3 pl-2">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Grade</th>
                    <th className="pb-3">Subjects</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="group hover:bg-slate-50">
                      <td className="py-3 pl-2 font-semibold text-slate-900">{s.name || "N/A"}</td>
                      <td className="py-3 text-slate-600">{s.email}</td>
                      <td className="py-3">
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          Grade {s.grade}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500 max-w-[200px] truncate">{s.subjects || "N/A"}</td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-500">
                        No students found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}


