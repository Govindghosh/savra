"use client";

import { useEffect, useState } from "react";
import { BarChart3, CheckCircle2, Clock3, Database, Layers, Library, ShieldCheck, UserPlus, Users, XCircle, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { JobList } from "@/components/job-list";
import { SummaryCard } from "@/components/summary-card";
import {
  getAdminAccess,
  getApiErrorMessage,
  getContentAccess,
  getContentLibrary,
  getJob,
  listJobs,
  listAdminUsers,
  createAdminUser,
  deleteAdminUser,
  type AccessResponse,
  type ContentLibraryResponse,
  type Job,
  type JobSummary,
  type AdminUser,
  type Role
} from "@/lib/api";

export default function AdminPage() {
  const [adminAccess, setAdminAccess] = useState<AccessResponse | null>(null);
  const [contentAccess, setContentAccess] = useState<AccessResponse | null>(null);
  const [library, setLibrary] = useState<ContentLibraryResponse | null>(null);
  const [summary, setSummary] = useState<JobSummary | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"jobs" | "users">("jobs");

  // Create user form state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<Role>("teacher");
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newExperience, setNewExperience] = useState("");
  const [newQualification, setNewQualification] = useState("");
  const [newProficiency, setNewProficiency] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [newSubjects, setNewSubjects] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);

  const refreshData = async () => {
    try {
      const [admin, content, libraryResponse, jobResponse, usersResponse] = await Promise.all([
        getAdminAccess(),
        getContentAccess(),
        getContentLibrary(),
        listJobs(),
        listAdminUsers()
      ]);
      setAdminAccess(admin);
      setContentAccess(content);
      setLibrary(libraryResponse);
      setJobs(jobResponse.jobs);
      setSummary(admin.summary ?? jobResponse.summary);
      setUsers(usersResponse);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    setError("");
    try {
      await createAdminUser({
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        name: newName || undefined,
        age: newAge ? parseInt(newAge) : undefined,
        experience: newExperience ? parseInt(newExperience) : undefined,
        qualification: newQualification || undefined,
        proficiency: newProficiency || undefined,
        grade: newGrade ? parseInt(newGrade) : undefined,
        subjects: newSubjects || undefined
      });
      setNewUserEmail("");
      setNewUserPassword("");
      setNewName("");
      setNewAge("");
      setNewExperience("");
      setNewQualification("");
      setNewProficiency("");
      setNewGrade("");
      setNewSubjects("");
      await refreshData();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteAdminUser(id);
      await refreshData();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const inspectJob = async (jobId: string) => {
    try {
      setSelectedJob(await getJob(jobId));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const failedJobs = jobs.filter((job) => job.status === "failed");
  const activeJobs = jobs.filter((job) => job.status === "queued" || job.status === "processing");

  return (
    <AppShell title="Admin Workspace" requiredRoles={["admin"]}>
      <div className="grid gap-4 md:grid-cols-6">
        <SummaryCard label="Total Jobs" value={summary?.total ?? 0} icon={Layers} />
        <SummaryCard label="Queued" value={summary?.queued ?? 0} icon={Clock3} />
        <SummaryCard label="Processing" value={summary?.processing ?? 0} icon={BarChart3} />
        <SummaryCard label="Completed" value={summary?.completed ?? 0} icon={CheckCircle2} />
        <SummaryCard label="Failed" value={summary?.failed ?? 0} icon={XCircle} />
        <SummaryCard label="Users" value={users.length} icon={Users} />
      </div>

      <div className="mt-8 flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("jobs")}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === "jobs" ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Generation Jobs
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 text-sm font-semibold transition-colors ${
            activeTab === "users" ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          User Management
        </button>
      </div>

      {activeTab === "jobs" ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-950">All Jobs</h2>
                <p className="mt-1 text-sm text-slate-500">{adminAccess?.capability ?? "analytics"} and {contentAccess?.capability ?? "read_content"}</p>
              </div>
              <button
                type="button"
                onClick={refreshData}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>
            <JobList jobs={jobs} onInspect={inspectJob} />
          </section>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 h-fit">
            <h2 className="text-xl font-bold text-slate-950">Job Detail</h2>
            {selectedJob ? (
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Topic</div>
                  <div className="font-semibold text-slate-950">{selectedJob.topic}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">Grade</div>
                    <div className="font-bold text-slate-900">{selectedJob.grade}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">Slides</div>
                    <div className="font-bold text-slate-900">{selectedJob.slides}</div>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Status</div>
                  <div className="font-bold text-slate-900">{selectedJob.status}</div>
                </div>
                {selectedJob.errorMessage && <div className="rounded-lg bg-red-50 p-3 text-red-700">{selectedJob.errorMessage}</div>}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                Select a job
              </div>
            )}
            {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
          </aside>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-950">System Users</h2>
              <span className="text-sm text-slate-500">{users.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3 font-semibold">Email</th>
                    <th className="px-6 py-3 font-semibold">Role</th>
                    <th className="px-6 py-3 font-semibold">Joined</th>
                    <th className="px-6 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-950">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                          u.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-950">Add User</h2>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@school.com"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as Role)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              {newUserRole === "teacher" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Age</label>
                      <input
                        type="number"
                        value={newAge}
                        onChange={(e) => setNewAge(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Exp (Years)</label>
                      <input
                        type="number"
                        value={newExperience}
                        onChange={(e) => setNewExperience(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Qualification</label>
                    <input
                      type="text"
                      value={newQualification}
                      onChange={(e) => setNewQualification(e.target.value)}
                      placeholder="M.Sc. Physics"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Proficiency</label>
                    <input
                      type="text"
                      value={newProficiency}
                      onChange={(e) => setNewProficiency(e.target.value)}
                      placeholder="Advanced"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {newUserRole === "student" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Grade</label>
                    <input
                      type="number"
                      value={newGrade}
                      onChange={(e) => setNewGrade(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Subjects</label>
                    <input
                      type="text"
                      value={newSubjects}
                      onChange={(e) => setNewSubjects(e.target.value)}
                      placeholder="Math, Science"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={creatingUser}
                className="w-full rounded-lg bg-blue-600 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
              >
                {creatingUser ? "Creating..." : "Create User"}
              </button>
            </form>
            {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
          </aside>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            <h2 className="text-lg font-bold text-slate-950">Operations</h2>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <span className="text-slate-600">Active jobs</span>
              <span className="font-bold text-slate-950">{activeJobs.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <span className="text-slate-600">Failed jobs</span>
              <span className="font-bold text-slate-950">{failedJobs.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <span className="text-slate-600">Content decks</span>
              <span className="font-bold text-slate-950">{library?.presentations.length ?? 0}</span>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Library className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <h2 className="text-lg font-bold text-slate-950">Student Library</h2>
          </div>
          <div className="mt-4 space-y-3">
            {(library?.presentations ?? []).slice(0, 3).map((item) => (
              <div key={item.id} className="rounded-lg bg-slate-50 p-3">
                <div className="text-sm font-semibold text-slate-950">{item.title}</div>
                <div className="mt-1 text-xs text-slate-500">Grade {item.grade} - {item.slides} slides</div>
              </div>
            ))}
            {(library?.presentations ?? []).length === 0 && <p className="text-sm text-slate-500">No student decks available yet.</p>}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">Failure Watch</h2>
          <div className="mt-4 space-y-3">
            {failedJobs.slice(0, 3).map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => inspectJob(job.id)}
                className="block w-full rounded-lg bg-red-50 p-3 text-left text-sm text-red-800 hover:bg-red-100"
              >
                <span className="font-semibold">{job.topic}</span>
                <span className="mt-1 block text-xs">{job.errorMessage ?? "Generation failed"}</span>
              </button>
            ))}
            {failedJobs.length === 0 && <p className="text-sm text-slate-500">No failed jobs right now.</p>}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

