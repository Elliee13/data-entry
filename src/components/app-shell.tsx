"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Archive,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileClock,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
} from "lucide-react";
import { UserRole } from "@/generated/prisma/enums";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APP_TITLE } from "@/lib/constants";
import { cn } from "@/lib/utils";

type AppShellProps = {
  role: UserRole;
  userName: string;
  userEmail: string;
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Weekly overview and recent event activity.",
    icon: BarChart3,
  },
  {
    href: "/entries",
    label: "Entries",
    description: "Create and manage active event submissions.",
    icon: ClipboardList,
  },
  {
    href: "/archive",
    label: "Archive",
    description: "Historical entries preserved after reporting.",
    icon: Archive,
  },
  {
    href: "/admin/reports",
    label: "Weekly Reports",
    description: "Manual report runs, downloads, and status history.",
    icon: ShieldCheck,
    adminOnly: true,
  },
  {
    href: "/admin/history",
    label: "Entry History",
    description: "Review admin edits and entry-level change activity.",
    icon: FileClock,
    adminOnly: true,
  },
  {
    href: "/admin/users",
    label: "Users",
    description: "Approved-user access and credential management.",
    icon: Users,
    adminOnly: true,
  },
];

function getPageMeta(pathname: string) {
  if (pathname.startsWith("/entries/") && pathname.endsWith("/edit")) {
    return {
      title: "Edit Entry",
      description: "Adjust event details without changing any reporting or archival logic.",
    };
  }

  if (pathname.startsWith("/entries/")) {
    return {
      title: "Entry Detail",
      description: "Review the full submission record and available administrative actions.",
    };
  }

  if (pathname.startsWith("/entries")) {
    return {
      title: "Entries",
      description: "Create new event entries and manage the live active-week register.",
    };
  }

  if (pathname.startsWith("/archive")) {
    return {
      title: "Archive",
      description: "Browse preserved historical entries from completed reporting weeks.",
    };
  }

  if (pathname.startsWith("/admin/reports")) {
    return {
      title: "Weekly Reports",
      description: "Generate, download, and monitor weekly reporting runs.",
    };
  }

  if (pathname.startsWith("/admin/history")) {
    return {
      title: "Entry History",
      description: "Review entry edits, acting users, and the recorded before-and-after field changes.",
    };
  }

  if (pathname.startsWith("/admin/users")) {
    return {
      title: "Users",
      description: "Control approved internal access, roles, and password resets.",
    };
  }

  if (pathname.startsWith("/admin/audit")) {
    return {
      title: "Audit Logs",
      description: "Inspect the internal activity trail across login, entry, and report operations.",
    };
  }

  return {
    title: "Dashboard",
    description: "Weekly metrics, recent event activity, and operational shortcuts.",
  };
}

function SidebarLink({
  item,
  pathname,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm font-medium transition-colors",
        isActive
          ? "border-[var(--sidebar-border)] bg-[var(--sidebar-active)] text-[var(--sidebar-active-foreground)] shadow-[var(--shadow-card)]"
          : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]",
        collapsed && "justify-center px-0",
      )}
      title={collapsed ? item.label : undefined}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--sidebar-border)] bg-[var(--card)] text-[var(--muted-foreground)]",
          isActive && "border-transparent bg-[var(--accent-soft)] text-[var(--accent-strong)]",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      {!collapsed ? (
        <span className="min-w-0">
          <span className="block truncate font-semibold">{item.label}</span>
          <span className="mt-0.5 block truncate text-xs text-[var(--muted-foreground)]">{item.description}</span>
        </span>
      ) : null}
    </Link>
  );
}

export function AppShell({ role, userName, userEmail, children }: AppShellProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const pageMeta = getPageMeta(pathname);
  const availableItems = useMemo(
    () => navItems.filter((item) => (item.adminOnly ? role === UserRole.ADMIN : true)),
    [role],
  );

  return (
    <div className="min-h-screen px-3 py-3 lg:px-4 lg:py-4">
      <div className="page-shell flex min-h-[calc(100vh-1.5rem)] gap-4">
        <div
          className={cn(
            "fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity lg:hidden",
            isMobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          onClick={() => setIsMobileNavOpen(false)}
        />

        <aside
          className={cn(
            "surface-outer fixed inset-y-3 left-3 z-50 flex w-[292px] flex-col overflow-hidden border-[var(--sidebar-border)] bg-[var(--sidebar)] text-[var(--sidebar-foreground)] transition-transform lg:static lg:inset-auto lg:z-auto lg:translate-x-0",
            isMobileNavOpen ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]",
            isCollapsed && "lg:w-[104px]",
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-[var(--sidebar-border)] px-4 py-5">
            <div className={cn("min-w-0", isCollapsed && "lg:hidden")}>
              <p className="section-eyebrow">Internal Ops</p>
              <h1 className="mt-2 text-lg font-semibold leading-tight text-[var(--sidebar-foreground)]">{APP_TITLE}</h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileNavOpen(false)}
                aria-label="Close navigation"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:inline-flex"
                onClick={() => setIsCollapsed((current) => !current)}
                aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
            {availableItems.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                pathname={pathname}
                collapsed={isCollapsed}
                onNavigate={() => setIsMobileNavOpen(false)}
              />
            ))}
          </nav>

          <div className="border-t border-[var(--sidebar-border)] p-3">
            <div
              className={cn(
                "rounded-2xl border border-[var(--sidebar-border)] bg-[var(--sidebar-active)] p-3",
                isCollapsed && "lg:px-2",
              )}
            >
              <Avatar name={userName} email={isCollapsed ? undefined : userEmail} className={cn(isCollapsed && "justify-center")} />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 lg:pl-0">
          <div className="surface-outer min-h-[calc(100vh-2rem)] overflow-hidden">
            <header className="border-b border-[var(--border)] px-5 py-5 lg:px-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setIsMobileNavOpen(true)}
                    aria-label="Open navigation"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                  <div>
                    <p className="section-eyebrow">Operations Workspace</p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                      {pageMeta.title}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
                      {pageMeta.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-1.5 shadow-[var(--shadow-card)]">
                        <Avatar name={userName} className="gap-0" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>
                        <p className="text-sm font-semibold normal-case tracking-normal text-[var(--foreground)]">{userName}</p>
                        <p className="mt-1 text-xs font-normal normal-case tracking-normal text-[var(--muted-foreground)]">
                          {userEmail}
                        </p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/login" })}>
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>

            <main className="px-5 py-5 lg:px-8 lg:py-7">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
