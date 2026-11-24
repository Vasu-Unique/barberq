import { useState } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  Calendar,
  Eye,
  UserCheck,
} from 'lucide-react';
import { Button, Modal, Pagination } from '@/components/ui';
import { useUsers } from '@/hooks/useQueue';
import { formatRelativeTime } from '@/utils/format';
import type { UserOut } from '@/api';

export function AdminCustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedUser, setSelectedUser] = useState<UserOut | null>(null);

  const { data: usersData, isLoading } = useUsers({
    search: search.trim() || undefined,
    page,
    limit,
  });

  const users = usersData?.items ?? [];
  const totalUsers = usersData?.total ?? 0;
  const totalPages = usersData?.total_pages ?? 1;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-mist pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-100 px-3 py-1 rounded-full">
            Client Directory &amp; History
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-ink mt-2">
            Customers &amp; Users
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft">
            Manage client accounts, contact details, account status, and role access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white px-3.5 py-2 rounded-xl border border-mist shadow-xs text-xs font-bold text-ink">
            Registered Users: <span className="text-primary-700 font-black">{totalUsers}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-mist shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" />
          <input
            type="text"
            placeholder="Search by client name, mobile, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-mist text-xs sm:text-sm text-ink focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-mist shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-sm text-ink-soft">Loading customer directory...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users className="h-8 w-8 text-ink-soft/40 mx-auto mb-2" />
            <p className="font-bold text-ink text-sm">No customers found</p>
            <p className="text-xs text-ink-soft mt-1">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-mist bg-mist-light/70 text-[11px] font-bold text-ink-soft uppercase tracking-wider">
                  <th className="py-3.5 px-4">Client Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Roles</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist text-sm">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-mist-light/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {u.full_name ? u.full_name.slice(0, 2).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-ink">{u.full_name}</p>
                          <span className="text-[11px] text-ink-soft">
                            {u.is_active ? 'Active Account' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-mono">
                      <p className="font-semibold text-ink">{u.email}</p>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-mono">
                      {u.phone || <span className="text-ink-soft">Not provided</span>}
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="flex gap-1 flex-wrap">
                        {u.roles.map((r) => (
                          <span
                            key={r}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-50 text-primary-800 border border-primary-200"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-ink-soft">
                      {formatRelativeTime(u.created_at)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-semibold px-3 py-1 h-8"
                        onClick={() => setSelectedUser(u)}
                        leftIcon={<Eye className="h-3.5 w-3.5" />}
                      >
                        Profile
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-4 border-t border-mist">
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalUsers}
            limit={limit}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            limitOptions={[5, 10, 20, 50]}
          />
        </div>
      </div>

      {/* Customer Profile Drawer Modal */}
      {selectedUser && (
        <Modal open={true} onClose={() => setSelectedUser(null)} size="md">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-mist">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {selectedUser.full_name ? selectedUser.full_name.slice(0, 2).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-ink">{selectedUser.full_name}</h3>
                  <p className="text-xs text-ink-soft">ID: {selectedUser.id}</p>
                </div>
              </div>
            </div>

            {/* Profile fields */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-mist/70">
                <span className="text-ink-soft flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                </span>
                <span className="font-semibold text-ink font-mono text-xs">{selectedUser.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-mist/70">
                <span className="text-ink-soft flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Phone
                </span>
                <span className="font-semibold text-ink font-mono text-xs">
                  {selectedUser.phone || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-mist/70">
                <span className="text-ink-soft flex items-center gap-2">
                  <UserCheck className="h-4 w-4" /> Assigned Roles
                </span>
                <div className="flex gap-1">
                  {selectedUser.roles.map((r) => (
                    <span key={r} className="text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-ink-soft flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Member Since
                </span>
                <span className="font-semibold text-ink">{formatRelativeTime(selectedUser.created_at)}</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="md"
              className="w-full justify-center"
              onClick={() => setSelectedUser(null)}
            >
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
