"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function DeleteEntryButton({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setIsPending(true);
    setError(null);

    const response = await fetch(`/api/entries/${entryId}`, {
      method: "DELETE",
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setIsPending(false);

    if (!response.ok) {
      setError(payload?.error ?? "Unable to delete entry.");
      toast.error("Delete failed", {
        description: payload?.error ?? "Unable to delete entry.",
      });
      return;
    }

    toast.success("Entry deleted", {
      description: "The entry was removed from the active register.",
    });
    router.push("/entries");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {isPending ? (
        <div className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Deleting entry...
        </div>
      ) : null}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={isPending}>
            {isPending ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Entry"
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the selected event from the active register. The action is permanent for this record and will
              be captured in the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Entry"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
