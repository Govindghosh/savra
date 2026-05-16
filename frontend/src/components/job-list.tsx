import { Download, Eye } from "lucide-react";
import { getPptDownloadName, getPptDownloadUrl, type Job } from "@/lib/api";

type JobListProps = {
  jobs: Job[];
  onInspect?: (jobId: string) => void;
};

export function JobList({ jobs, onInspect }: JobListProps) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        No jobs found
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Topic</th>
              <th className="px-4 py-3">Grade</th>
              <th className="px-4 py-3">Slides</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jobs.map((job) => (
              <tr key={job.id}>
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">{job.topic}</div>
                  <div className="text-xs text-slate-500">{job.subject ?? "General"}</div>
                </td>
                <td className="px-4 py-3 text-slate-700">{job.grade}</td>
                <td className="px-4 py-3 text-slate-700">{job.slides}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {job.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{job.progress}%</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {onInspect && (
                      <button
                        type="button"
                        onClick={() => onInspect(job.id)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        Inspect
                      </button>
                    )}
                    {job.pptUrl && (
                      <a
                        href={getPptDownloadUrl(job.pptUrl)}
                        download={getPptDownloadName(job.topic, job.grade)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        PPT
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
