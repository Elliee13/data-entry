"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/components/theme-provider";

export function Toaster(props: ToasterProps) {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme === "dark" ? "dark" : "light"}
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast: "border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-[var(--shadow-card)]",
          title: "text-sm font-semibold",
          description: "text-sm text-[var(--muted-foreground)]",
          actionButton: "bg-[var(--primary)] text-[var(--primary-foreground)]",
          cancelButton: "bg-[var(--muted)] text-[var(--foreground)]",
        },
      }}
      {...props}
    />
  );
}
