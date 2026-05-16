import "@fastify/jwt";
import type { AccessTokenPayload } from "../auth/roles.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AccessTokenPayload;
    user: AccessTokenPayload;
  }
}
