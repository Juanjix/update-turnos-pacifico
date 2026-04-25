// app/(dashboard)/layout.tsx
// Shared layout for all dashboard pages: /reservar, /mis-turnos
import { DashboardLayout } from "@/components/Dashboardlayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
