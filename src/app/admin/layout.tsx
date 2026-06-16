import { AdminLayout } from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminSidebarBadges } from "@/lib/admin-queries";

export const dynamic = "force-dynamic";

export default async function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Runs on every /admin/** request. Redirects if not admin.
  const me = await requireAdmin();
  const badges = await getAdminSidebarBadges();

  return (
    <AdminLayout adminName={me.name ?? me.email ?? "Admin"} badges={badges}>
      {children}
    </AdminLayout>
  );
}
