import { FastifyReply, FastifyRequest } from 'fastify';
import { hasRole, parseRoles, Role } from '../config/authz';

declare module 'fastify' {
  interface FastifyRequest {
    actorRoles?: Role[];
  }
}

export function attachRoles(request: FastifyRequest) {
  const header = request.headers['x-roles'];
  const raw = typeof header === 'string' ? header : undefined;
  request.actorRoles = parseRoles(raw);
}

export function requireRole(required: Role) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const roles = request.actorRoles ?? [];
    if (!hasRole(roles, required)) {
      return reply.status(403).send({ error: `Forbidden: requires ${required} role` });
    }
  };
}
