import { ReactNode } from "react";

type Role = "ADMIN" | "MEMBER";

interface RoleGuardProps {
  allow: Role[];
  children: ReactNode;
}

export default function RoleGuard({ children }: RoleGuardProps): React.JSX.Element {
  return <>{children}</>;
}
