import type { FastifyReply, FastifyRequest } from "fastify";
import { isRole, type Role } from "../auth/roles.js";

export async function verifyJWT(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    if (request.user.type !== "access" || !isRole(request.user.role)) {
      return reply.code(401).send({
        error: "Unauthorized",
        message: "Token payload is not valid"
      });
    }
  } catch {
    return reply.code(401).send({
      error: "Unauthorized",
      message: "Missing, expired, or invalid token"
    });
  }
}

export function checkRole(allowedRoles: Role[]) {
  return async function roleGuard(request: FastifyRequest, reply: FastifyReply) {
    const userRole = request.user.role;

    if (!allowedRoles.includes(userRole)) {
      return reply.code(403).send({
        error: "Forbidden",
        message: "Role is not allowed for this action"
      });
    }
  };
}
