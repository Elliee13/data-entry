import { Lock, ShieldCheck, TableProperties } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";

const highlights = [
  {
    title: "Structured Weekly Operations",
    body: "Manage event entry, live registers, archives, and report preparation from one internal workspace.",
    icon: TableProperties,
  },
  {
    title: "Controlled Internal Access",
    body: "Credentials-only access for approved staff with role-based controls for administrative operations.",
    icon: Lock,
  },
  {
    title: "Verified Reporting Trail",
    body: "Track report generation, archival events, edits, and login activity through a preserved audit trail.",
    icon: ShieldCheck,
  },
];

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen px-4 py-6 lg:px-6 lg:py-8">
      <div className="page-shell grid min-h-[calc(100vh-3rem)] gap-4 lg:grid-cols-[1.2fr_28rem]">
        <section className="surface-outer relative overflow-hidden p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.22),transparent)]" />
          <div className="relative">
            <p className="section-eyebrow">Private Internal Dashboard</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-[-0.05em] text-[var(--foreground)] lg:text-6xl">
              {APP_TITLE}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">
              Formal event tracking, reporting operations, and controlled historical archiving for internal staff.
            </p>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {highlights.map((highlight) => {
                const Icon = highlight.icon;

                return (
                  <Card key={highlight.title} className="border-white/40 bg-white/60 backdrop-blur dark:border-white/10 dark:bg-white/5">
                    <CardHeader className="gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{highlight.title}</CardTitle>
                        <CardDescription className="mt-2">{highlight.body}</CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <Card className="flex items-center">
          <CardContent className="w-full p-8 lg:p-9">
            <div className="mb-8">
              <p className="section-eyebrow">Authorized Access</p>
              <CardTitle className="mt-3 text-3xl">Sign in to continue</CardTitle>
              <CardDescription className="mt-3">
                Use your assigned credentials to access event entry, reporting, and administrative controls.
              </CardDescription>
            </div>

            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
