import { Check, LogOut, ShieldCheck, UserCheck, Users, X } from 'lucide-react';
import { AppUser, UserRole } from '../types/pesantren';
import { SantriAvatar } from './SantriAvatar';

interface UserSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AppUser[];
  currentUser: AppUser;
  onSelectUser: (user: AppUser) => void;
  onLogout: () => void;
}

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Admin',
  pengurus: 'Pengurus / Ustadz',
  wali: 'Wali Santri',
};

export function UserSwitcherModal({
  isOpen,
  onClose,
  users,
  currentUser,
  onSelectUser,
  onLogout,
}: UserSwitcherModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-switcher-title"
    >
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 id="user-switcher-title" className="text-lg font-semibold text-slate-900">
              Ganti Akun Pengguna Sistem
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Pilih akun aktif untuk menguji hak akses Admin, Pengurus/Ustadz, atau Wali Santri.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Tutup dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto p-4">
          {users.map((user) => {
            const isActive = user.id === currentUser.id;
            const isInactive = user.status === 'Nonaktif';

            return (
              <button
                key={user.id}
                type="button"
                disabled={isInactive}
                onClick={() => {
                  onSelectUser(user);
                  onClose();
                }}
                className={`flex w-full items-start gap-4 rounded-xl p-4 text-left transition-colors ${
                  isInactive
                    ? 'cursor-not-allowed opacity-55 bg-slate-50'
                    : isActive
                    ? 'bg-emerald-50/70 ring-1 ring-emerald-600/30'
                    : 'hover:bg-slate-50'
                }`}
              >
                <SantriAvatar
                  src={user.avatarUrl}
                  name={user.nama}
                  sizeClass="w-12 h-12"
                  roundedClass="rounded-full"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold text-slate-900">{user.nama}</p>
                    {isInactive ? (
                      <span className="text-xs font-semibold text-rose-600 whitespace-nowrap shrink-0">
                        Nonaktif
                      </span>
                    ) : isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 whitespace-nowrap shrink-0">
                        <Check className="h-3.5 w-3.5" />
                        Aktif
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-600">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        user.role === 'admin'
                          ? 'text-emerald-700'
                          : user.role === 'wali'
                          ? 'text-sky-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {user.role === 'admin' ? (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      ) : user.role === 'wali' ? (
                        <Users className="h-3.5 w-3.5" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5" />
                      )}
                      {ROLE_LABEL[user.role]}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular text-slate-500">@{user.username}</span>
                    <span aria-hidden="true">·</span>
                    <span>{user.jabatan}</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                    {user.bidangTugas}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5 rounded-b-xl">
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 whitespace-nowrap"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar ke Halaman Login
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
