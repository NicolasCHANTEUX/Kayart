import type { ReactNode } from "react";
import { requireAdminSession } from "@/server/auth/session";
import { AdminNavigation } from "@/components/layout/navigation";

type AdminLayoutProps = {
  children: ReactNode;
};

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await requireAdminSession();

  return <div className="admin-shell"><AdminNavigation/><div className="admin-workspace">{children}</div></div>;
}
