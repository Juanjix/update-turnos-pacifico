// app/page.tsx
// Root redirect → /reservar
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/reservar");
}
