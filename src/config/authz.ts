export type Role = 'operator' | 'worker' | 'admin';

export function parseRoles(raw: string | undefined): Role[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((r) => r.trim().toLowerCase())
    .filter((r): r is Role => r === 'operator' || r === 'worker' || r === 'admin');
}

export function hasRole(roles: Role[], required: Role): boolean {
  if (roles.includes('admin')) return true;
  return roles.includes(required);
}
