import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { registerAuthRoutes } from "./api/auth-routes.js";
import { registerGenerateRoutes } from "./api/generate-routes.js";
import { registerJobRoutes } from "./api/job-routes.js";
import { registerProtectedRoutes } from "./api/protected-routes.js";
import { registerContentRoutes } from "./api/content-routes.js";
import { registerUserManagementRoutes } from "./api/user-management-routes.js";
import { createSeedUsers, syncSeedUsers } from "./auth/seed-users.js";

const app = Fastify({
  logger: env.NODE_ENV !== "test",
  bodyLimit: env.MAX_REQUEST_BODY_BYTES
});

await app.register(cors);
await app.register(rateLimit);
await app.register(jwt, {
  secret: env.JWT_SECRET_KEY
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicFilesPath = path.join(process.cwd(), "public", "files");
if (!fs.existsSync(publicFilesPath)) {
  fs.mkdirSync(publicFilesPath, { recursive: true });
}

await app.register(fastifyStatic, {
  root: publicFilesPath,
  prefix: "/files/",
  decorateReply: false
});

const seedUsers = await createSeedUsers();
await syncSeedUsers(seedUsers);

app.get("/health", async () => ({
  status: "ok"
}));

await registerAuthRoutes(app, seedUsers);
await registerGenerateRoutes(app);
await registerJobRoutes(app);
await registerProtectedRoutes(app);
await registerContentRoutes(app);
await registerUserManagementRoutes(app);

await app.listen({
  port: env.BACKEND_PORT,
  host: env.BACKEND_HOST
});
