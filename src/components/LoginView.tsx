import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  User,
  UserCheck,
  Users,
} from 'lucide-react';
import { IMAGE_ASSETS } from '../data/mockData';
import { AppUser, ProfilPesantren, UserRole } from '../types/pesantren';
import { SantriAvatar } from './SantriAvatar';

interface LoginViewProps {
  users: AppUser[];
  profil: ProfilPesantren;
  onLogin: (user: AppUser) => void;
}

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Admin',
  pengurus: 'Pengurus / Ustadz',
  wali: 'Wali Santri',
};

export function LoginView({ users, profil, onLogin }: LoginViewProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('sabda123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<'semua' | UserRole>('semua');

  const filteredDemoUsers = useMemo(() => {
    if (roleFilter === 'semua') return users;
    return users.filter((u) => u.role === roleFilter);
  }, [users, roleFilter]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const query = identifier.trim().toLowerCase();
    if (!query) {
      setErrorMsg('Masukkan username atau email pengguna terlebih dahulu.');
      return;
    }

    const matched = users.find(
      (u) => u.username.toLowerCase() === query || u.email.toLowerCase() === query
    );

    if (!matched) {
      setErrorMsg('Akun dengan username atau email tersebut tidak ditemukan.');
      return;
    }

    if (matched.status === 'Nonaktif') {
      setErrorMsg('Akun ini sedang dinonaktifkan oleh Administrator. Hubungi Tata Usaha pondok.');
      return;
    }

    const expectedPass = matched.password || 'sabda123';
    if (password !== expectedPass) {
      setErrorMsg('Kata sandi tidak sesuai. Gunakan kata sandi akun atau tombol Masuk Cepat.');
      return;
    }

    onLogin(matched);
  };

  const handleQuickLogin = (user: AppUser) => {
    setErrorMsg(null);
    if (user.status === 'Nonaktif') {
      setErrorMsg(`Akun ${user.nama} sedang berstatus Nonaktif dan tidak dapat digunakan.`);
      return;
    }
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:grid lg:grid-cols-12">
      {/* Left Institutional Showcase Panel */}
      <aside className="relative flex flex-col justify-between overflow-hidden bg-emerald-950 text-white lg:col-span-5 xl:col-span-6">
        <img
          src={profil.bannerUrl || IMAGE_ASSETS.campusBanner}
          alt={profil.namaPesantren}
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/80 to-emerald-900/70" />

        <div className="relative z-10 p-6 sm:p-10 lg:p-12">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm">
              <img
                src={profil.logoUrl || IMAGE_ASSETS.pesantrenLogo}
                alt={profil.namaPesantren}
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">SIS SABDA</p>
              <p className="text-xs text-emerald-200">{profil.namaPesantren}</p>
            </div>
          </div>

          <div className="mt-10 max-w-xl">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl text-balance">
              Sistem Informasi Santri & Manajemen Pondok Pesantren
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-emerald-100/90 sm:text-base">
              Platform terpadu untuk pengelolaan data santri, kartu digital & E-Money kantin, pembayaran SPP, perizinan keluar-masuk, serta pemantauan oleh wali santri.
            </p>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/10 bg-emerald-950/60 p-6 sm:p-10 lg:px-12">
          <p className="text-xs font-semibold tracking-wide text-emerald-300">
            PEMBAGIAN HAK AKSES SISTEM
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
            <div className="space-y-1">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                Admin
              </p>
              <p className="leading-relaxed text-emerald-100/80">
                Akses penuh kelola user, profil pondok, top-up e-money, dan pelunasan SPP.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                Pengurus / Ustadz
              </p>
              <p className="leading-relaxed text-emerald-100/80">
                Data santri, presensi, perizinan, kedisiplinan, dan kasir E-Money kantin.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                Wali Santri
              </p>
              <p className="leading-relaxed text-emerald-100/80">
                Pantau profil anak, kartu & mutasi e-money, tagihan SPP, dan riwayat izin.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Right Login & Quick-Access Workspace */}
      <main className="flex flex-col justify-center px-4 py-8 sm:px-8 lg:col-span-7 lg:px-12 xl:col-span-6 xl:px-16">
        <div className="mx-auto w-full max-w-lg space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Masuk ke Akun SIS SABDA</h2>
              <p className="mt-1 text-sm text-slate-500">
                Gunakan username/email terdaftar atau pilih akun di panel Masuk Cepat.
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="login-identifier"
                  className="block text-xs font-medium text-slate-700"
                >
                  Username atau Email
                </label>
                <div className="relative mt-1.5">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Contoh: admin, ridwan, aminah, wali.zaki"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Kata Sandi
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono-tabular">
                    Default demo: sabda123
                  </span>
                </div>
                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Masukkan kata sandi"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-10 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label="Tampilkan atau sembunyikan kata sandi"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
              >
                Masuk ke Sistem
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Masuk Cepat Per Role & User Tersimpan */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Masuk Cepat Simulasi ({users.filter((u) => u.status === 'Aktif').length} Akun Aktif)
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Pilih peran atau pengguna terdaftar (termasuk user baru dari Admin).
                </p>
              </div>
              <div className="flex items-center rounded-lg bg-slate-100 p-1">
                {(
                  [
                    { id: 'semua', label: 'Semua' },
                    { id: 'admin', label: 'Admin' },
                    { id: 'pengurus', label: 'Pengurus' },
                    { id: 'wali', label: 'Wali' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRoleFilter(tab.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      roleFilter === tab.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
              {filteredDemoUsers.map((user) => {
                const isInactive = user.status === 'Nonaktif';
                return (
                  <button
                    key={user.id}
                    type="button"
                    disabled={isInactive}
                    onClick={() => handleQuickLogin(user)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${
                      isInactive
                        ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
                        : 'border-slate-200 bg-white hover:border-emerald-600/50 hover:bg-emerald-50/40'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <SantriAvatar
                        src={user.avatarUrl}
                        name={user.nama}
                        sizeClass="w-10 h-10"
                        roundedClass="rounded-full"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {user.nama}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          <span className="font-medium text-emerald-700">
                            {ROLE_LABEL[user.role]}
                          </span>
                          {' · '}
                          <span className="font-mono-tabular">@{user.username}</span>
                          {' · '}
                          {user.jabatan}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 text-xs font-semibold whitespace-nowrap ${
                        isInactive ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {isInactive ? 'Nonaktif' : 'Masuk →'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
