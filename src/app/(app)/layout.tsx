import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/session";

export default async function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();

  return (
    <AppShell role={user.role} userName={user.name} userEmail={user.email}>
      {children}
    </AppShell>
  );
}
