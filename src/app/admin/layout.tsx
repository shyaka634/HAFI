import type { ReactNode } from "react";
import "./admin-design.css";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="hafi-admin">{children}</div>;
}
