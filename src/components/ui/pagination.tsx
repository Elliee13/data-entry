"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type PaginationProps = {
  page: number;
  totalPages: number;
  itemLabel: string;
  totalItems: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, totalPages, itemLabel, totalItems, onPageChange }: PaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4">
      <p className="text-sm text-muted-foreground">
        {totalItems} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="rounded-md bg-background shadow-none" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="min-w-[5.5rem] text-center text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button variant="outline" size="sm" className="rounded-md bg-background shadow-none" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
