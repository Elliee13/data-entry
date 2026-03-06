import { UserManagement } from "@/components/admin/user-management";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminUser } from "@/lib/session";
import { listUsers } from "@/lib/users";

export default async function AdminUsersPage() {
  await requireAdminUser();

  const users = await listUsers();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
        <p className="section-eyebrow">Administration</p>
        <CardTitle className="mt-2 text-3xl tracking-[-0.04em]">Approved Users</CardTitle>
        </CardHeader>
      </Card>

      <UserManagement users={users} />
    </div>
  );
}
