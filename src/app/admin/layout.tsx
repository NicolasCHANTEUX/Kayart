import type { ReactNode } from "react";
import { requireAdminSession } from "@/server/auth/session";
import { AdminNavigation } from "@/components/layout/navigation";
// Scoped to /admin/**: Next only ships this CSS to routes under this layout,
// keeping it out of the render-blocking stylesheet for public pages.
import "@/styles/legacy/admin-components.css";
import "@/styles/legacy/admin-operations.css";
import "@/styles/legacy/admin-theme.css";
import "@/styles/atelier/admin.css";

type AdminLayoutProps = {
  children: ReactNode;
};

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await requireAdminSession();

  return <div className="admin-shell"><AdminNavigation/><div className="admin-workspace">{children}</div></div>;
}
