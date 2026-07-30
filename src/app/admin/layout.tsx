import type { ReactNode } from "react";
import { requireAdminSession } from "@/server/auth/session";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await requireAdminSession();

  return children;
}
