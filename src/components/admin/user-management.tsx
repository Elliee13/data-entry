"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, LoaderCircle, MoreHorizontal, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

type UserRecord = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type UserManagementProps = {
  users: UserRecord[];
};

type SortKey = "name" | "email" | "role" | "isActive" | "lastLoginAt" | "createdAt";

const PAGE_SIZE = 8;

function SortButton({
  label,
  column,
  sortKey,
  direction,
  onSort,
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  direction: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const isActive = sortKey === column;
  const Icon = !isActive ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <button className="inline-flex items-center gap-1" onClick={() => onSort(column)}>
      <span>{label}</span>
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

export function UserManagement({ users }: UserManagementProps) {
  const router = useRouter();
  const [createForm, setCreateForm] = useState({
    email: "",
    name: "",
    password: "",
    role: "USER",
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { name: string; role: "ADMIN" | "USER"; isActive: boolean; password: string }>>(
    Object.fromEntries(
      users.map((user) => [
        user.id,
        {
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          password: "",
        },
      ]),
    ),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsCreating(true);

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createForm),
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setIsCreating(false);

    if (!response.ok) {
      setError(payload?.error ?? "Unable to create user.");
      toast.error("User creation failed", {
        description: payload?.error ?? "Unable to create user.",
      });
      return;
    }

    toast.success("User created", {
      description: "The approved user has been added.",
    });
    setCreateForm({
      email: "",
      name: "",
      password: "",
      role: "USER",
    });
    router.refresh();
  }

  async function handleUpdate(userId: string) {
    setMessage(null);
    setError(null);
    setSavingUserId(userId);

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(drafts[userId]),
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setSavingUserId(null);

    if (!response.ok) {
      setError(payload?.error ?? "Unable to update user.");
      toast.error("User update failed", {
        description: payload?.error ?? "Unable to update user.",
      });
      return;
    }

    setEditingUserId(null);
    toast.success("User updated", {
      description: "The approved user record has been updated.",
    });
    router.refresh();
  }

  function handleSort(nextSortKey: SortKey) {
    setPage(1);

    if (nextSortKey === sortKey) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setDirection(nextSortKey === "lastLoginAt" ? "desc" : "asc");
  }

  const filteredUsers = users.filter((user) => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return true;
    }

    return [user.name, user.email, user.role, user.isActive ? "active" : "inactive"]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });

  const sortedUsers = [...filteredUsers].sort((left, right) => {
    if (sortKey === "lastLoginAt") {
      const leftValue = left.lastLoginAt ? new Date(left.lastLoginAt).getTime() : 0;
      const rightValue = right.lastLoginAt ? new Date(right.lastLoginAt).getTime() : 0;
      return direction === "asc" ? leftValue - rightValue : rightValue - leftValue;
    }

    if (sortKey === "createdAt") {
      const leftValue = new Date(left.createdAt).getTime();
      const rightValue = new Date(right.createdAt).getTime();
      return direction === "asc" ? leftValue - rightValue : rightValue - leftValue;
    }

    if (sortKey === "isActive") {
      return direction === "asc" ? Number(left.isActive) - Number(right.isActive) : Number(right.isActive) - Number(left.isActive);
    }

    return direction === "asc"
      ? String(left[sortKey]).localeCompare(String(right[sortKey]))
      : String(right[sortKey]).localeCompare(String(left[sortKey]));
  });

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sortedUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <p className="section-eyebrow">Create Approved User</p>
          <CardTitle className="mt-2 text-2xl">Access Provisioning</CardTitle>
          <CardDescription className="mt-2">
            Add new approved users with a temporary password and the correct internal role assignment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 xl:grid-cols-[1.1fr_1fr_1fr_0.9fr_auto]" onSubmit={handleCreate}>
            <Input
              required
              placeholder="Email address"
              value={createForm.email}
              disabled={isCreating}
              onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
            />
            <Input
              required
              placeholder="Full name"
              value={createForm.name}
              disabled={isCreating}
              onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))}
            />
            <Input
              required
              placeholder="Temporary password"
              type="password"
              value={createForm.password}
              disabled={isCreating}
              onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))}
            />
            <select
              value={createForm.role}
              disabled={isCreating}
              onChange={(event) => setCreateForm((current) => ({ ...current, role: event.target.value as "ADMIN" | "USER" }))}
              className="field-input"
            >
              <option value="USER">Standard User</option>
              <option value="ADMIN">Admin</option>
            </select>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-[color-mix(in_srgb,var(--danger)_28%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : null}
      {isCreating ? (
        <div className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Creating approved user...
        </div>
      ) : null}
      {savingUserId ? (
        <div className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Saving user changes...
        </div>
      ) : null}
      {message ? <p className="text-sm text-[var(--muted-foreground)]">{message}</p> : null}

      <Card className="overflow-hidden rounded-md border shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Approved Users</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Search and maintain approved internal accounts without changing access rules or backend behavior.
            </p>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, role, status..."
              className="h-9 rounded-md bg-background pl-9 shadow-none"
            />
          </div>
        </div>

        <div className="max-h-[24rem] overflow-auto">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>
                  <SortButton label="Name" column="name" sortKey={sortKey} direction={direction} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <SortButton label="Email" column="email" sortKey={sortKey} direction={direction} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <SortButton label="Role" column="role" sortKey={sortKey} direction={direction} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <SortButton label="Status" column="isActive" sortKey={sortKey} direction={direction} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <SortButton label="Last Login" column="lastLoginAt" sortKey={sortKey} direction={direction} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <SortButton label="Created" column="createdAt" sortKey={sortKey} direction={direction} onSort={handleSort} />
                </TableHead>
                <TableHead className="sticky right-0 w-[88px] bg-card text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((user) => {
                const isEditing = editingUserId === user.id;
                const draft = drafts[user.id];
                const isSavingThisUser = savingUserId === user.id;

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={draft.name}
                          disabled={isSavingThisUser}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [user.id]: { ...current[user.id], name: event.target.value },
                            }))
                          }
                        />
                      ) : (
                        <div>
                          <p className="font-semibold">{user.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">Updated {formatDateTime(user.updatedAt)}</p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <select
                          value={draft.role}
                          disabled={isSavingThisUser}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [user.id]: { ...current[user.id], role: event.target.value as "ADMIN" | "USER" },
                            }))
                          }
                          className="field-input"
                        >
                          <option value="USER">Standard User</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      ) : (
                        <Badge variant="outline" className="rounded-md px-2 py-0.5 text-[11px] tracking-normal">
                          {user.role}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <label className="inline-flex items-center gap-2 text-sm text-[var(--foreground)]">
                          <input
                            type="checkbox"
                            checked={draft.isActive}
                            disabled={isSavingThisUser}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [user.id]: { ...current[user.id], isActive: event.target.checked },
                              }))
                            }
                          />
                          Active
                        </label>
                      ) : (
                        <Badge variant="outline" className="rounded-md px-2 py-0.5 text-[11px] tracking-normal">
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Never"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(user.createdAt)}</TableCell>
                    <TableCell className="sticky right-0 bg-card text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <Input
                            type="password"
                            placeholder="New password"
                            value={draft.password}
                            disabled={isSavingThisUser}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [user.id]: { ...current[user.id], password: event.target.value },
                              }))
                            }
                            className="max-w-[11rem]"
                          />
                          <Button size="sm" onClick={() => handleUpdate(user.id)} disabled={isSavingThisUser}>
                            {isSavingThisUser ? (
                              <>
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              "Save"
                            )}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditingUserId(null)} disabled={isSavingThisUser}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-md text-muted-foreground"
                              aria-label={`Open actions for ${user.name}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setEditingUserId(user.id)}>Manage User</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={sortedUsers.length}
          itemLabel="users"
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}
