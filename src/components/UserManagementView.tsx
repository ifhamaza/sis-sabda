import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Power,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { IMAGE_ASSETS } from '../data/mockData';
import { AppUser, Santri, UserRole, UserStatus } from '../types/pesantren';
import { SantriAvatar } from './SantriAvatar';

interface UserManagementViewProps {
  usersList: AppUser[];
  santriList: Santri[];
  currentUser: AppUser;
  onSaveUser: (user: AppUser, isNew: boolean) => void;
  onToggleUserStatus: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  pengurus: 'Pengurus / Ustadz',
  wali: 'Wali Santri',
};

export function UserManagementView({
  usersList,
  santriList,
  currentUser,
  onSaveUser,
  onToggleUserStatus,
  onDeleteUser,
}: UserManagementViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'Semua' | UserRole>('Semua');
  const [filterStatus, setFilterStatus] = useState<'Semua' | UserStatus>('Semua');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AppUser | null>(null);

  const [formState, setFormState] = useState<Omit<AppUser, 'id'>>({
    nama: '',
    username: '',
    email: '',
    jabatan: '',
    role: 'pengurus',
    telepon: '',
    avatarUrl: IMAGE_ASSETS.ustadz1,
    bidangTugas: '',
    status: 'Aktif',
    password: 'sabda123',
    santriId: santriList[0]?.id ?? '',
  });

  const isAdmin = currentUser.role === 'admin';

  const santriMap = useMemo(() => {
    const map = new Map<string, Santri>();
    santriList.forEach((s) => map.set(s.id, s));
    return map;
  }, [santriList]);

  const stats = useMemo(() => {
    return {
      total: usersList.length,
      aktif: usersList.filter((u) => u.status === 'Aktif').length,
      nonaktif: usersList.filter((u) => u.status === 'Nonaktif').length,
      adminCount: usersList.filter((u) => u.role === 'admin').length,
      pengurusCount: usersList.filter((u) => u.role === 'pengurus').length,
      waliCount: usersList.filter((u) => u.role === 'wali').length,
    };
  }, [usersList]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return usersList.filter((u) => {
      const matchSearch =
        !q ||
        u.nama.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.jabatan.toLowerCase().includes(q);
      const matchRole = filterRole === 'Semua' || u.role === filterRole;
      const matchStatus = filterStatus === 'Semua' || u.status === filterStatus;
      return matchSearch && matchRole && matchStatus;
    });
  }, [usersList, searchQuery, filterRole, filterStatus]);

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-amber-700" />
        <h2 className="mt-3 text-base font-semibold text-slate-900">
          Akses Terbatas — Khusus Administrator
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Halaman Kelola Pengguna dan pembagian hak akses hanya dapat diakses oleh akun Admin.
        </p>
      </div>
    );
  }

  const openCreateModal = () => {
    setEditingId(null);
    setFormError(null);
    setFormState({
      nama: '',
      username: '',
      email: '',
      jabatan: 'Pengurus Kesantrian',
      role: 'pengurus',
      telepon: '',
      avatarUrl: IMAGE_ASSETS.ustadz1,
      bidangTugas: 'Pengelolaan data santri, presensi harian, perizinan keluar-masuk, dan kasir e-money.',
      status: 'Aktif',
      password: 'sabda123',
      santriId: santriList[0]?.id ?? '',
    });
    setFormOpen(true);
  };

  const openEditModal = (user: AppUser) => {
    setEditingId(user.id);
    setFormError(null);
    setFormState({
      nama: user.nama,
      username: user.username,
      email: user.email,
      jabatan: user.jabatan,
      role: user.role,
      telepon: user.telepon,
      avatarUrl: user.avatarUrl,
      bidangTugas: user.bidangTugas,
      status: user.status,
      password: user.password ?? 'sabda123',
      santriId: user.santriId ?? santriList[0]?.id ?? '',
    });
    setFormOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormState((prev) => ({ ...prev, avatarUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanUsername = formState.username.trim().toLowerCase().replace(/\s+/g, '.');
    const cleanEmail = formState.email.trim().toLowerCase();

    if (!cleanUsername) {
      setFormError('Username wajib diisi.');
      return;
    }

    const duplicate = usersList.find(
      (u) =>
        u.id !== editingId &&
        (u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail)
    );
    if (duplicate) {
      setFormError('Username atau email sudah digunakan oleh pengguna lain.');
      return;
    }

    const record: AppUser = {
      id: editingId ?? `user-${Date.now()}`,
      ...formState,
      username: cleanUsername,
      email: cleanEmail,
      password: formState.password?.trim() || 'sabda123',
      santriId: formState.role === 'wali' ? formState.santriId : undefined,
    };

    onSaveUser(record, !editingId);
    setFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary Strip */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Total Akun Pengguna</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{stats.total}</p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            Tersimpan di localStorage browser
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Status Akun</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700 tabular-nums">
            {stats.aktif} Aktif
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {stats.nonaktif} akun dinonaktifkan
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Admin & Pengurus</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {stats.adminCount + stats.pengurusCount}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {stats.adminCount} Admin · {stats.pengurusCount} Pengurus / Ustadz
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Akun Wali Santri</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{stats.waliCount}</p>
          <p className="mt-1 text-xs text-slate-500">Terhubung ke profil anak asuh</p>
        </div>
      </section>

      {/* Toolbar & Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, username, email, atau jabatan..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as 'Semua' | UserRole)}
              aria-label="Filter Peran"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-600 focus:outline-none"
            >
              <option value="Semua">Semua Peran</option>
              <option value="admin">Admin</option>
              <option value="pengurus">Pengurus / Ustadz</option>
              <option value="wali">Wali Santri</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'Semua' | UserStatus)}
              aria-label="Filter Status Akun"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-600 focus:outline-none"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 whitespace-nowrap shrink-0"
            >
              <UserPlus className="h-4 w-4" />
              Tambah Pengguna
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {filteredUsers.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sm font-semibold text-slate-800">Tidak ada pengguna ditemukan</p>
            <p className="mt-1 text-xs text-slate-500">
              Ubah filter pencarian atau tambahkan pengguna baru.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="px-5 py-3.5">Pengguna & Username</th>
                  <th className="px-4 py-3.5">Jabatan & Tugas</th>
                  <th className="px-4 py-3.5">Nomor HP</th>
                  <th className="px-4 py-3.5">Peran</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const isSelf = user.id === currentUser.id;
                  const linkedSantri = user.santriId ? santriMap.get(user.santriId) : undefined;
                  const isAktif = user.status === 'Aktif';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <SantriAvatar
                            src={user.avatarUrl}
                            name={user.nama}
                            sizeClass="w-10 h-10"
                            roundedClass="rounded-full"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">
                              {user.nama}
                              {isSelf && (
                                <span className="ml-2 text-[11px] font-medium text-emerald-700">
                                  (Sedang Login)
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500">
                              <span className="font-mono-tabular font-medium text-slate-700">
                                @{user.username}
                              </span>
                              {' · '}
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <p className="font-medium text-slate-800">{user.jabatan}</p>
                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                          {linkedSantri
                            ? `Anak asuh: ${linkedSantri.namaLengkap} (${linkedSantri.kelas})`
                            : user.bidangTugas}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono-tabular text-slate-700 whitespace-nowrap">
                        {user.telepon}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                            user.role === 'admin'
                              ? 'text-emerald-800'
                              : user.role === 'pengurus'
                              ? 'text-slate-800'
                              : 'text-sky-800'
                          }`}
                        >
                          {user.role === 'admin' ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                          ) : user.role === 'pengurus' ? (
                            <UserCheck className="h-3.5 w-3.5 text-slate-600" />
                          ) : (
                            <Users className="h-3.5 w-3.5 text-sky-700" />
                          )}
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                            isAktif ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isAktif ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5" />
                          )}
                          {user.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            title="Edit Data Pengguna"
                            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => onToggleUserStatus(user.id)}
                            title={
                              isSelf
                                ? 'Akun yang sedang aktif digunakan tidak dapat dinonaktifkan'
                                : isAktif
                                ? 'Nonaktifkan Akun'
                                : 'Aktifkan Akun'
                            }
                            className={`rounded-lg p-2 transition-colors ${
                              isSelf
                                ? 'cursor-not-allowed text-slate-300'
                                : isAktif
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => setDeleteConfirmUser(user)}
                            title={
                              isSelf
                                ? 'Akun yang sedang login tidak dapat dihapus'
                                : 'Hapus Pengguna'
                            }
                            className={`rounded-lg p-2 transition-colors ${
                              isSelf
                                ? 'cursor-not-allowed text-slate-300'
                                : 'text-rose-600 hover:bg-rose-50'
                            }`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit User Modal */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">
                {editingId ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {/* Foto Profil */}
              <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                <SantriAvatar
                  src={formState.avatarUrl}
                  name={formState.nama || 'Pengguna Baru'}
                  sizeClass="w-16 h-16"
                  roundedClass="rounded-full"
                />
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-semibold text-slate-700">Foto Profil Pengguna</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormState({ ...formState, avatarUrl: IMAGE_ASSETS.ustadz1 })}
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
                    >
                      Ustadz
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormState({ ...formState, avatarUrl: IMAGE_ASSETS.santriMale1 })
                      }
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
                    >
                      Pengurus Putra
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormState({ ...formState, avatarUrl: IMAGE_ASSETS.santriFemale1 })
                      }
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
                    >
                      Pengurus Putri
                    </button>
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-emerald-600 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100">
                      <Upload className="h-3.5 w-3.5" />
                      Unggah Foto
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700">
                    Nama Lengkap & Gelar
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.nama}
                    onChange={(e) => setFormState({ ...formState, nama: e.target.value })}
                    placeholder="Contoh: Ustadz Wildan Firdaus, S.Kom."
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Username Login</label>
                  <input
                    type="text"
                    required
                    value={formState.username}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        username: e.target.value.toLowerCase().replace(/\s+/g, '.'),
                      })
                    }
                    placeholder="Contoh: wildan.firdaus"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    required
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    placeholder="nama@sabilulhuda.pesantren.id"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Peran / Role Akses
                  </label>
                  <select
                    value={formState.role}
                    onChange={(e) => {
                      const nextRole = e.target.value as UserRole;
                      setFormState({
                        ...formState,
                        role: nextRole,
                        bidangTugas:
                          nextRole === 'admin'
                            ? 'Akses penuh manajemen santri, kelola user, keuangan, dan profil pesantren.'
                            : nextRole === 'pengurus'
                            ? 'Pengelolaan data santri, presensi harian, perizinan keluar-masuk, poin kedisiplinan, dan kasir e-money.'
                            : 'Memantau profil anak asuh, kartu digital, mutasi e-money, tagihan SPP, dan perizinan.',
                      });
                    }}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="admin">Admin (Akses Penuh)</option>
                    <option value="pengurus">Pengurus / Ustadz</option>
                    <option value="wali">Wali Santri</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Status Akun</label>
                  <select
                    value={formState.status}
                    disabled={editingId === currentUser.id}
                    onChange={(e) =>
                      setFormState({ ...formState, status: e.target.value as UserStatus })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none disabled:bg-slate-100"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Jabatan</label>
                  <input
                    type="text"
                    required
                    value={formState.jabatan}
                    onChange={(e) => setFormState({ ...formState, jabatan: e.target.value })}
                    placeholder="Contoh: Musyrif Asrama / Wali Santri"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Nomor HP</label>
                  <input
                    type="text"
                    required
                    value={formState.telepon}
                    onChange={(e) => setFormState({ ...formState, telepon: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Kata Sandi Simulasi Login
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.password ?? 'sabda123'}
                    onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                {formState.role === 'wali' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Anak Asuh / Santri Terhubung
                    </label>
                    <select
                      value={formState.santriId ?? santriList[0]?.id ?? ''}
                      onChange={(e) => setFormState({ ...formState, santriId: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                    >
                      {santriList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.namaLengkap} (NIS {s.nis} · {s.kelas})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700">
                    Deskripsi Tugas & Hak Akses
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formState.bidangTugas}
                    onChange={(e) => setFormState({ ...formState, bidangTugas: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                >
                  {editingId ? 'Simpan Perubahan' : 'Daftarkan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">Hapus Akun Pengguna?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Akun <strong>{deleteConfirmUser.nama}</strong> (@{deleteConfirmUser.username}) akan dihapus permanen dari daftar pengguna lokal.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteUser(deleteConfirmUser.id);
                  setDeleteConfirmUser(null);
                }}
                className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800"
              >
                Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
