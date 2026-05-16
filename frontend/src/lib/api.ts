import axios, { AxiosError } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is required");
}

export type Role = "teacher" | "student" | "admin";

export type User = {
  id: string;
  email: string;
  role: Role;
  capabilities: string[];
  name?: string;
  age?: number;
  experience?: number;
  proficiency?: string;
  qualification?: string;
  grade?: number;
  subjects?: string;
};

export type HealthResponse = {
  status: "ok";
};

export type LoginResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresInMinutes: number;
  user: User;
};

export type AccessResponse = {
  status: "allowed";
  capability: string;
  role: Role;
  capabilities: string[];
  resources?: string[];
  summary?: JobSummary;
};

export type JobStatus = "queued" | "processing" | "completed" | "failed" | "cancelled";

export type Job = {
  id: string;
  topic: string;
  subject?: string | null;
  grade: number;
  slides: number;
  status: JobStatus;
  progress: number;
  pptUrl?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JobSummary = {
  total: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  cacheEntries: number;
};

export type GeneratePayload = {
  topic: string;
  subject?: string;
  grade: number;
  slides: number;
};

export type GenerateResponse = {
  jobId: string;
  status: JobStatus;
  progress: number;
  reused: boolean;
  cacheHit: boolean;
  similarity?: number;
  exact?: boolean;
  pptUrl?: string;
  statusUrl: string;
};

export type ContentMaterial = {
  id: string;
  title: string;
  type: string;
  description: string;
};

export type ContentPresentation = {
  id: string;
  title: string;
  subject?: string | null;
  grade: number;
  slides: number;
  pptUrl?: string | null;
  updatedAt: string;
};

export type ContentLibraryResponse = {
  role: Role;
  capabilities: string[];
  materials: ContentMaterial[];
  presentations: ContentPresentation[];
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? error.message;
  }

  return error instanceof Error ? error.message : "Request failed";
}

export function getRoleHome(role: Role) {
  return `/${role}`;
}

export function getPptDownloadUrl(pptUrl: string) {
  if (pptUrl.startsWith("http://") || pptUrl.startsWith("https://")) {
    return pptUrl;
  }

  return `${API_BASE_URL}${pptUrl}`;
}

export function getPptDownloadName(title: string, grade?: number) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "presentation";

  return grade ? `${slug}-grade-${grade}.pptx` : `${slug}.pptx`;
}

export async function getHealth() {
  const response = await api.get<HealthResponse>("/health");
  return response.data;
}

export async function loginRequest(email: string, password: string) {
  const response = await api.post<LoginResponse>("/auth/login", { email, password });
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get<{ user: User }>("/auth/me");
  return response.data.user;
}

export async function getTeacherAccess() {
  const response = await api.get<AccessResponse>("/generate/access");
  return response.data;
}

export async function getContentAccess() {
  const response = await api.get<AccessResponse>("/content/access");
  return response.data;
}

export async function getContentLibrary() {
  const response = await api.get<ContentLibraryResponse>("/content/library");
  return response.data;
}

export async function getAdminAccess() {
  const response = await api.get<AccessResponse>("/admin/access");
  return response.data;
}

export async function createGeneration(payload: GeneratePayload) {
  const response = await api.post<GenerateResponse>("/generate", payload);
  return response.data;
}

export async function listJobs() {
  const response = await api.get<{ jobs: Job[]; summary: JobSummary }>("/jobs");
  return response.data;
}

export async function getJob(jobId: string) {
  const response = await api.get<{ job: Job }>(`/jobs/${jobId}`);
  return response.data.job;
}

export type AdminUser = {
  id: string;
  email: string;
  role: Role;
  name?: string;
  age?: number;
  experience?: number;
  proficiency?: string;
  qualification?: string;
  grade?: number;
  subjects?: string;
  createdAt: string;
};

export async function listAdminUsers() {
  const response = await api.get<{ users: AdminUser[] }>("/admin/users");
  return response.data.users;
}

export async function listTeacherStudents() {
  const response = await api.get<{ users: AdminUser[] }>("/teacher/students");
  return response.data.users;
}


export async function createAdminUser(payload: {
  email: string;
  password: string;
  role: Role;
  name?: string;
  age?: number;
  experience?: number;
  proficiency?: string;
  qualification?: string;
  grade?: number;
  subjects?: string;
}) {
  const response = await api.post<{ user: AdminUser }>("/users", payload);
  return response.data.user;
}


export async function updateAdminUser(id: string, payload: Partial<Omit<AdminUser, "id" | "email" | "role" | "createdAt">>) {
  const response = await api.patch<{ user: AdminUser }>(`/users/${id}`, payload);
  return response.data.user;
}

export async function deleteAdminUser(id: string) {

  const response = await api.delete<{ success: boolean }>(`/admin/users/${id}`);
  return response.data.success;
}


