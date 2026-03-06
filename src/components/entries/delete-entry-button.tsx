"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DeleteEntryButton({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm("Delete this entry from the active week?");

    if (!confirmed) {
      return;
    }

    setIsPending(true);
    setError(null);

    const response = await fetch(`/api/entries/${entryId}`, {
      method: "DELETE",
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setIsPending(false);

    if (!response.ok) {
      setError(payload?.error ?? "Unable to delete entry.");
      return;
    }

    router.push("/entries");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
        {isPending ? "Deleting..." : "Delete Entry"}
      </Button>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
