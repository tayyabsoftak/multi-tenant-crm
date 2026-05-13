export function isOrgAdmin(role: string): boolean {
  return role === "ADMIN";
}

export function isMemberRole(role: string): boolean {
  return role === "USER";
}
