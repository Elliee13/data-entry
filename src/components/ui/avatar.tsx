import { cn } from "@/lib/utils";

type AvatarProps = {
  name: string;
  email?: string;
  className?: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Avatar({ name, email, className }: AvatarProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--avatar-bg)] text-sm font-semibold text-[var(--avatar-fg)] shadow-[var(--shadow-inset)]">
        {getInitials(name)}
      </div>
      {email ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--foreground)]">{name}</p>
          <p className="truncate text-xs text-[var(--muted-foreground)]">{email}</p>
        </div>
      ) : null}
    </div>
  );
}
