import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { isOrgAdmin } from "@/lib/permissions";
import { listActivities } from "@/lib/services/ActivityService";
import { getDashboardStats, getTopAssignees } from "@/lib/services/CustomerService";

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId;
  const admin = isOrgAdmin(session.user.role);

  const stats = await getDashboardStats(orgId);
  if (!admin) {
    return NextResponse.json({
      stats,
      recentActivities: [] as Awaited<ReturnType<typeof listActivities>>["items"],
      topAssignees: [] as Awaited<ReturnType<typeof getTopAssignees>>,
    });
  }

  const [recent, topAssignees] = await Promise.all([
    listActivities({ organizationId: orgId, page: 1, pageSize: 10 }),
    getTopAssignees(orgId, 5),
  ]);

  return NextResponse.json({
    stats,
    recentActivities: recent.items,
    topAssignees,
  });
}
