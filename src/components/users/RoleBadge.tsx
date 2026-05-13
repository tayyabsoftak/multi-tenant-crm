export default function RoleBadge({ role }: { role: "ADMIN" | "MEMBER" }): React.JSX.Element {
  return <span className="rounded bg-muted px-2 py-1 text-xs">{role}</span>;
}
