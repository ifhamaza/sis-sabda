import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  ChevronDown,
  ClipboardCheck,
  CreditCard,
  IdCard,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  ShieldCheck,
  UserCheck,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { DashboardView } from './components/DashboardView';
import { KartuSantriView } from './components/KartuSantriView';
import { KeuanganView } from './components/KeuanganView';
import { LoginView } from './components/LoginView';
import { PerizinanView } from './components/PerizinanView';
import { ProfilPesantrenView } from './components/ProfilPesantrenView';
import { SantriAvatar } from './components/SantriAvatar';
import { SantriManagementView } from './components/SantriManagementView';
import { UserManagementView } from './components/UserManagementView';
import { UserSwitcherModal } from './components/UserSwitcherModal';
import { WaliPortalView, WaliSection } from './components/WaliPortalView';
import {
  INITIAL_KEDISIPLINAN,
  INITIAL_KEHADIRAN,
  INITIAL_MUTASI_SALDO,
  INITIAL_MUTASI_TABUNGAN,
  INITIAL_PERIZINAN,
  INITIAL_PROFIL_PESANTREN,
  INITIAL_SANTRI,
  INITIAL_TAGIHAN,
  INITIAL_USERS,
  INITIAL_USTADZ,
} from './data/mockData';
import {
  ActiveTab,
  AppUser,
  AsramaInfo,
  CatatanKedisiplinan,
  KehadiranHarian,
  MetodePembayaran,
  MutasiSaldo,
  MutasiTabungan,
  PembayaranTagihan,
  PerizinanSantri,
  ProfilPesantren,
  Santri,
  StatusIzin,
  UserRole,
  UstadzPengajar,
} from './types/pesantren';
import { getLocalDateKey, getLocalDateTimeIso } from './utils/formatters';

const STORAGE_KEY = 'sis_sabda_v1';

interface PersistedState {
  isAuthenticated: boolean;
  currentUserId: string;
  usersList: AppUser[];
  santriList: Santri[];
  tagihanList: PembayaranTagihan[];
  perizinanList: PerizinanSantri[];
  kedisiplinanList: CatatanKedisiplinan[];
  kehadiranList: KehadiranHarian[];
  ustadzList: UstadzPengajar[];
  profil: ProfilPesantren;
  mutasiSaldoList: MutasiSaldo[];
  mutasiTabunganList: MutasiTabungan[];
}

function backfillSantriWallets(list: Santri[]): Santri[] {
  const seedMap = new Map(INITIAL_SANTRI.map((s) => [s.id, s]));
  return list.map((s) => {
    const seed = seedMap.get(s.id);
    return {
      ...s,
      saldoEmoney: typeof s.saldoEmoney === 'number' ? s.saldoEmoney : seed?.saldoEmoney ?? 50000,
      limitHarian: typeof s.limitHarian === 'number' ? s.limitHarian : seed?.limitHarian ?? 20000,
      pinKartu:
        typeof s.pinKartu === 'string' && /^\d{6}$/.test(s.pinKartu)
          ? s.pinKartu
          : seed?.pinKartu ?? '123456',
      saldoTabungan:
        typeof s.saldoTabungan === 'number' ? s.saldoTabungan : seed?.saldoTabungan ?? 100000,
      targetTabunganNama:
        s.targetTabunganNama || seed?.targetTabunganNama || 'Kitab & Seragam Baru',
      targetTabunganNominal:
        typeof s.targetTabunganNominal === 'number' && s.targetTabunganNominal > 0
          ? s.targetTabunganNominal
          : seed?.targetTabunganNominal ?? 1000000,
    };
  });
}

function backfillUsers(list?: AppUser[]): AppUser[] {
  if (!list || list.length === 0) return INITIAL_USERS;
  const seedMap = new Map(INITIAL_USERS.map((u) => [u.id, u]));
  const normalized = list.map((u) => {
    const seed = seedMap.get(u.id);
    return {
      ...u,
      username: u.username || seed?.username || u.email.split('@')[0],
      status: u.status || 'Aktif',
      password: u.password || seed?.password || 'sabda123',
      santriId: u.santriId ?? seed?.santriId,
    };
  });

  // Ensure initial Wali demo accounts exist if migrating from pre-Wali cache
  const existingIds = new Set(normalized.map((u) => u.id));
  const missingSeeds = INITIAL_USERS.filter((u) => !existingIds.has(u.id));
  return [...normalized, ...missingSeeds];
}

function backfillProfil(profil?: ProfilPesantren): ProfilPesantren {
  if (!profil) return INITIAL_PROFIL_PESANTREN;
  const seedMap = new Map(INITIAL_PROFIL_PESANTREN.asramaList.map((a) => [a.id, a]));
  return {
    ...INITIAL_PROFIL_PESANTREN,
    ...profil,
    bannerUrl: profil.bannerUrl || INITIAL_PROFIL_PESANTREN.bannerUrl,
    logoUrl: profil.logoUrl || INITIAL_PROFIL_PESANTREN.logoUrl,
    misi:
      Array.isArray(profil.misi) && profil.misi.length > 0
        ? profil.misi
        : INITIAL_PROFIL_PESANTREN.misi,
    asramaList: Array.isArray(profil.asramaList)
      ? profil.asramaList.map((a) => ({
          ...a,
          keterangan: a.keterangan ?? seedMap.get(a.id)?.keterangan,
        }))
      : INITIAL_PROFIL_PESANTREN.asramaList,
  };
}

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      const usersList = backfillUsers(parsed.usersList);
      return {
        isAuthenticated: typeof parsed.isAuthenticated === 'boolean' ? parsed.isAuthenticated : false,
        currentUserId: parsed.currentUserId ?? usersList[0].id,
        usersList,
        santriList: backfillSantriWallets(parsed.santriList ?? INITIAL_SANTRI),
        tagihanList: parsed.tagihanList ?? INITIAL_TAGIHAN,
        perizinanList: parsed.perizinanList ?? INITIAL_PERIZINAN,
        kedisiplinanList: parsed.kedisiplinanList ?? INITIAL_KEDISIPLINAN,
        kehadiranList: parsed.kehadiranList ?? INITIAL_KEHADIRAN,
        ustadzList: parsed.ustadzList ?? INITIAL_USTADZ,
        profil: backfillProfil(parsed.profil),
        mutasiSaldoList: parsed.mutasiSaldoList ?? INITIAL_MUTASI_SALDO,
        mutasiTabunganList: parsed.mutasiTabunganList ?? INITIAL_MUTASI_TABUNGAN,
      };
    }
  } catch {
    // Fallback to initial seed data
  }

  return {
    isAuthenticated: false,
    currentUserId: INITIAL_USERS[0].id,
    usersList: INITIAL_USERS,
    santriList: INITIAL_SANTRI,
    tagihanList: INITIAL_TAGIHAN,
    perizinanList: INITIAL_PERIZINAN,
    kedisiplinanList: INITIAL_KEDISIPLINAN,
    kehadiranList: INITIAL_KEHADIRAN,
    ustadzList: INITIAL_USTADZ,
    profil: INITIAL_PROFIL_PESANTREN,
    mutasiSaldoList: INITIAL_MUTASI_SALDO,
    mutasiTabunganList: INITIAL_MUTASI_TABUNGAN,
  };
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: typeof LayoutDashboard;
}

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Admin',
  pengurus: 'Pengurus / Ustadz',
  wali: 'Wali Santri',
};

export default function App() {
  const [state, setState] = useState<PersistedState>(() => loadInitialState());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedCardSantriId, setSelectedCardSantriId] = useState<string | null>(
    state.santriList[0]?.id ?? null
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userSwitcherOpen, setUserSwitcherOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  const currentUser: AppUser =
    state.usersList.find((u) => u.id === state.currentUserId && u.status === 'Aktif') ??
    state.usersList.find((u) => u.status === 'Aktif') ??
    state.usersList[0];

  const navItems: NavItem[] = useMemo(() => {
    if (currentUser.role === 'wali') {
      return [
        { id: 'dashboard', label: 'Profil Anak', icon: LayoutDashboard },
        { id: 'kartu', label: 'Kartu & E-Money', icon: IdCard },
        { id: 'tabungan', label: 'Tabungan Anak', icon: PiggyBank },
        { id: 'keuangan', label: 'Tagihan SPP', icon: CreditCard },
        { id: 'perizinan', label: 'Izin & Poin', icon: ClipboardCheck },
        { id: 'profil', label: 'Profil Pesantren', icon: Building2 },
      ];
    }

    const base: NavItem[] = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'santri', label: 'Data Santri', icon: Users },
      { id: 'kartu', label: 'Kartu Santri', icon: IdCard },
      { id: 'keuangan', label: 'Keuangan', icon: CreditCard },
      { id: 'perizinan', label: 'Perizinan & Poin', icon: ClipboardCheck },
    ];

    if (currentUser.role === 'admin') {
      base.push({ id: 'pengguna', label: 'Kelola Pengguna', icon: UserCog });
    }

    base.push({ id: 'profil', label: 'Profil Pesantren', icon: Building2 });
    return base;
  }, [currentUser.role]);

  // Keep activeTab valid when switching roles
  useEffect(() => {
    const allowed = navItems.some((item) => item.id === activeTab);
    if (!allowed) {
      setActiveTab('dashboard');
    }
  }, [navItems, activeTab]);

  const handleLogin = (user: AppUser) => {
    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      currentUserId: user.id,
    }));
    setActiveTab('dashboard');
    showToast(`Selamat datang, ${user.nama} (${ROLE_LABEL[user.role]}).`);
  };

  const handleLogout = () => {
    setState((prev) => ({ ...prev, isAuthenticated: false }));
    setMobileMenuOpen(false);
    setUserSwitcherOpen(false);
  };

  const handleSelectUser = (user: AppUser) => {
    if (user.status === 'Nonaktif') {
      showToast(`Akun ${user.nama} sedang dinonaktifkan.`);
      return;
    }
    setState((prev) => ({ ...prev, currentUserId: user.id }));
    setActiveTab('dashboard');
    showToast(`Beralih ke akun ${user.nama} (${ROLE_LABEL[user.role]})`);
  };

  const handleSaveUser = (user: AppUser, isNew: boolean) => {
    setState((prev) => ({
      ...prev,
      usersList: isNew
        ? [user, ...prev.usersList]
        : prev.usersList.map((u) => (u.id === user.id ? user : u)),
    }));
    showToast(
      isNew
        ? `Pengguna ${user.nama} berhasil ditambahkan.`
        : `Data pengguna ${user.nama} berhasil diperbarui.`
    );
  };

  const handleToggleUserStatus = (userId: string) => {
    if (userId === currentUser.id) return;
    const target = state.usersList.find((u) => u.id === userId);
    if (!target) return;
    const nextStatus = target.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    setState((prev) => ({
      ...prev,
      usersList: prev.usersList.map((u) =>
        u.id === userId ? { ...u, status: nextStatus } : u
      ),
    }));
    showToast(
      `Akun ${target.nama} kini berstatus ${nextStatus}.`
    );
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) return;
    const target = state.usersList.find((u) => u.id === userId);
    setState((prev) => ({
      ...prev,
      usersList: prev.usersList.filter((u) => u.id !== userId),
    }));
    showToast(`Akun pengguna ${target?.nama ?? ''} telah dihapus.`);
  };

  const handleSaveSantri = (santri: Santri, isNew: boolean) => {
    setState((prev) => ({
      ...prev,
      santriList: isNew
        ? [santri, ...prev.santriList]
        : prev.santriList.map((s) => (s.id === santri.id ? santri : s)),
    }));
    showToast(
      isNew
        ? `Santri ${santri.namaLengkap} berhasil didaftarkan.`
        : `Data ${santri.namaLengkap} berhasil diperbarui.`
    );
  };

  const handleDeleteSantri = (id: string) => {
    if (currentUser.role !== 'admin') return;
    const target = state.santriList.find((s) => s.id === id);
    setState((prev) => ({
      ...prev,
      santriList: prev.santriList.filter((s) => s.id !== id),
    }));
    showToast(`Data santri ${target?.namaLengkap ?? ''} dihapus.`);
  };

  const handleOpenKartuSantri = (santriId: string) => {
    setSelectedCardSantriId(santriId);
    setActiveTab('kartu');
  };

  const handleMarkPaid = (tagihanId: string, metode: MetodePembayaran) => {
    if (currentUser.role !== 'admin') return;
    setState((prev) => ({
      ...prev,
      tagihanList: prev.tagihanList.map((t) => {
        if (t.id !== tagihanId) return t;
        return {
          ...t,
          status: 'Lunas',
          tanggalBayar: new Date().toISOString().slice(0, 10),
          metodeBayar: metode,
          nomorKuitansi: `KW/${t.periodeKey.replace('-', '/')}/${String(
            Math.floor(100 + Math.random() * 899)
          )}`,
          dicatatOleh: currentUser.nama,
        };
      }),
    }));
    showToast('Pembayaran berhasil dicatat lunas.');
  };

  const handleCreateTagihan = (tagihan: PembayaranTagihan) => {
    if (currentUser.role !== 'admin') return;
    setState((prev) => ({
      ...prev,
      tagihanList: [tagihan, ...prev.tagihanList],
    }));
    showToast('Tagihan baru berhasil diterbitkan.');
  };

  const handleAddPerizinan = (izin: PerizinanSantri) => {
    setState((prev) => ({
      ...prev,
      perizinanList: [izin, ...prev.perizinanList],
    }));
    showToast('Surat izin keluar pondok berhasil dicatat.');
  };

  const handleUpdatePerizinanStatus = (id: string, newStatus: StatusIzin) => {
    const nowIso = new Date().toISOString().slice(0, 16);
    setState((prev) => ({
      ...prev,
      perizinanList: prev.perizinanList.map((p) => {
        if (p.id !== id) return p;
        if (newStatus === 'Sudah Kembali') {
          const late = nowIso > p.rencanaKembali;
          return {
            ...p,
            status: late ? 'Terlambat' : 'Sudah Kembali',
            waktuKembaliAktual: nowIso,
          };
        }
        return {
          ...p,
          status: newStatus,
          disetujuiOleh: currentUser.nama,
        };
      }),
    }));
    showToast('Status perizinan santri diperbarui.');
  };

  const handleAddKedisiplinan = (catatan: CatatanKedisiplinan) => {
    setState((prev) => ({
      ...prev,
      kedisiplinanList: [catatan, ...prev.kedisiplinanList],
      santriList: prev.santriList.map((s) =>
        s.id === catatan.santriId
          ? { ...s, poinKedisiplinan: Math.max(0, s.poinKedisiplinan + catatan.poinPerubahan) }
          : s
      ),
    }));
    showToast('Catatan kedisiplinan santri tersimpan.');
  };

  const handleAddKehadiran = (entry: KehadiranHarian) => {
    setState((prev) => {
      const exists = prev.kehadiranList.some((k) => k.tanggal === entry.tanggal);
      const updated = exists
        ? prev.kehadiranList.map((k) => (k.tanggal === entry.tanggal ? entry : k))
        : [...prev.kehadiranList, entry].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
      return { ...prev, kehadiranList: updated };
    });
    showToast(`Presensi tanggal ${entry.labelHari} berhasil diperbarui.`);
  };

  const handleUpdateProfil = (updated: ProfilPesantren) => {
    if (currentUser.role !== 'admin') return;
    setState((prev) => ({ ...prev, profil: updated }));
    showToast('Profil & background Pondok Pesantren berhasil diperbarui.');
  };

  const handleSaveAsrama = (
    asrama: AsramaInfo,
    isNew: boolean,
    previousName?: string
  ) => {
    if (currentUser.role !== 'admin') return;
    setState((prev) => ({
      ...prev,
      profil: {
        ...prev.profil,
        asramaList: isNew
          ? [...prev.profil.asramaList, asrama]
          : prev.profil.asramaList.map((a) => (a.id === asrama.id ? asrama : a)),
      },
      santriList:
        !isNew && previousName && previousName !== asrama.nama
          ? prev.santriList.map((s) =>
              s.asrama === previousName ? { ...s, asrama: asrama.nama } : s
            )
          : prev.santriList,
    }));
    showToast(
      isNew
        ? `Data ${asrama.nama} berhasil ditambahkan.`
        : `Data ${asrama.nama} berhasil diperbarui.`
    );
  };

  const handleDeleteAsrama = (id: string) => {
    if (currentUser.role !== 'admin') return;
    const target = state.profil.asramaList.find((a) => a.id === id);
    setState((prev) => ({
      ...prev,
      profil: {
        ...prev.profil,
        asramaList: prev.profil.asramaList.filter((a) => a.id !== id),
      },
    }));
    showToast(`Data ${target?.nama ?? 'asrama'} telah dihapus.`);
  };

  const handleSaveUstadz = (ustadz: UstadzPengajar, isNew: boolean) => {
    if (currentUser.role !== 'admin') return;
    setState((prev) => ({
      ...prev,
      ustadzList: isNew
        ? [ustadz, ...prev.ustadzList]
        : prev.ustadzList.map((u) => (u.id === ustadz.id ? ustadz : u)),
    }));
    showToast(
      isNew
        ? `${ustadz.nama} ditambahkan ke daftar dewan pengajar.`
        : `Data ${ustadz.nama} berhasil diperbarui.`
    );
  };

  const handleDeleteUstadz = (id: string) => {
    if (currentUser.role !== 'admin') return;
    const target = state.ustadzList.find((u) => u.id === id);
    setState((prev) => ({
      ...prev,
      ustadzList: prev.ustadzList.filter((u) => u.id !== id),
    }));
    showToast(`Data pengajar ${target?.nama ?? ''} telah dihapus.`);
  };

  const handleUpdateKartuPengaturan = (
    santriId: string,
    limitHarian: number,
    newPin?: string
  ) => {
    setState((prev) => ({
      ...prev,
      santriList: prev.santriList.map((s) =>
        s.id === santriId
          ? {
              ...s,
              limitHarian,
              ...(newPin ? { pinKartu: newPin } : {}),
            }
          : s
      ),
    }));
    showToast(
      newPin
        ? 'Batas jajan harian dan PIN 6 digit kartu berhasil diperbarui.'
        : 'Batas maksimal jajan harian berhasil diperbarui.'
    );
  };

  const handleTopUpSaldo = (
    santriId: string,
    nominal: number,
    sumberDana: string,
    keterangan: string
  ) => {
    if (currentUser.role !== 'admin') return;
    const target = state.santriList.find((s) => s.id === santriId);
    if (!target || nominal <= 0) return;

    const saldoBaru = target.saldoEmoney + nominal;
    const mutasi: MutasiSaldo = {
      id: `mut-${Date.now()}`,
      santriId,
      tanggalWaktu: getLocalDateTimeIso(),
      jenis: 'Top-Up',
      nominal,
      keterangan: keterangan.trim() || `Isi ulang saldo kartu santri (${sumberDana})`,
      sumberAtauLokasi: sumberDana,
      saldoAkhir: saldoBaru,
      dicatatOleh: currentUser.nama,
    };

    setState((prev) => ({
      ...prev,
      santriList: prev.santriList.map((s) =>
        s.id === santriId ? { ...s, saldoEmoney: saldoBaru } : s
      ),
      mutasiSaldoList: [mutasi, ...prev.mutasiSaldoList],
    }));

    showToast(`Top-Up saldo ${target.namaLengkap} berhasil ditambahkan.`);
  };

  const handleTransaksiKantin = (
    santriId: string,
    nominal: number,
    lokasi: string,
    keterangan: string,
    pinInput: string
  ): { ok: boolean; error?: string; mutasi?: MutasiSaldo } => {
    const target = state.santriList.find((s) => s.id === santriId);
    if (!target) {
      return { ok: false, error: 'Data santri tidak ditemukan.' };
    }
    if (nominal <= 0) {
      return { ok: false, error: 'Nominal belanja harus lebih dari Rp 0.' };
    }
    if (!/^\d{6}$/.test(pinInput)) {
      return { ok: false, error: 'PIN harus berupa 6 digit angka.' };
    }
    if (pinInput !== target.pinKartu) {
      return { ok: false, error: 'PIN 6 digit santri tidak sesuai. Transaksi dibatalkan.' };
    }
    if (nominal > target.saldoEmoney) {
      return {
        ok: false,
        error: `Saldo kartu tidak mencukupi. Saldo tersedia Rp ${target.saldoEmoney.toLocaleString('id-ID')}.`,
      };
    }

    const todayKey = getLocalDateKey();
    const spentToday = state.mutasiSaldoList
      .filter(
        (m) =>
          m.santriId === santriId &&
          m.jenis === 'Pembayaran' &&
          m.tanggalWaktu.startsWith(todayKey)
      )
      .reduce((acc, m) => acc + m.nominal, 0);

    if (spentToday + nominal > target.limitHarian) {
      const sisaLimit = Math.max(0, target.limitHarian - spentToday);
      return {
        ok: false,
        error: `Melebihi batas jajan harian (Rp ${target.limitHarian.toLocaleString(
          'id-ID'
        )}/hari). Sisa limit hari ini: Rp ${sisaLimit.toLocaleString('id-ID')}.`,
      };
    }

    const saldoBaru = target.saldoEmoney - nominal;
    const mutasi: MutasiSaldo = {
      id: `mut-${Date.now()}`,
      santriId,
      tanggalWaktu: getLocalDateTimeIso(),
      jenis: 'Pembayaran',
      nominal,
      keterangan: keterangan.trim() || 'Belanja kantin / koperasi pesantren',
      sumberAtauLokasi: lokasi,
      saldoAkhir: saldoBaru,
      dicatatOleh: currentUser.nama,
    };

    setState((prev) => ({
      ...prev,
      santriList: prev.santriList.map((s) =>
        s.id === santriId ? { ...s, saldoEmoney: saldoBaru } : s
      ),
      mutasiSaldoList: [mutasi, ...prev.mutasiSaldoList],
    }));

    showToast(`Pembayaran ${target.namaLengkap} berhasil diproses.`);
    return { ok: true, mutasi };
  };

  const handleUpdateTargetTabungan = (
    santriId: string,
    targetNama: string,
    targetNominal: number
  ) => {
    setState((prev) => ({
      ...prev,
      santriList: prev.santriList.map((s) =>
        s.id === santriId
          ? {
              ...s,
              targetTabunganNama: targetNama,
              targetTabunganNominal: targetNominal,
            }
          : s
      ),
    }));
    showToast(`Target tabungan "${targetNama}" berhasil diperbarui.`);
  };

  const handleTransaksiTabungan = (
    santriId: string,
    jenis: 'Setor' | 'Tarik',
    nominal: number,
    metode: string,
    keterangan: string
  ): { ok: boolean; error?: string } => {
    if (currentUser.role !== 'admin') {
      return { ok: false, error: 'Transaksi setor/tarik tabungan khusus Admin / Bendahara.' };
    }
    const target = state.santriList.find((s) => s.id === santriId);
    if (!target) return { ok: false, error: 'Data santri tidak ditemukan.' };
    if (nominal <= 0) return { ok: false, error: 'Nominal transaksi harus lebih dari Rp 0.' };
    if (jenis === 'Tarik' && nominal > target.saldoTabungan) {
      return {
        ok: false,
        error: `Saldo tabungan tidak mencukupi (tersedia Rp ${target.saldoTabungan.toLocaleString(
          'id-ID'
        )}).`,
      };
    }

    const saldoBaru =
      jenis === 'Setor' ? target.saldoTabungan + nominal : target.saldoTabungan - nominal;
    const mutasi: MutasiTabungan = {
      id: `tab-${Date.now()}`,
      santriId,
      tanggalWaktu: getLocalDateTimeIso(),
      jenis,
      nominal,
      keterangan:
        keterangan.trim() ||
        (jenis === 'Setor'
          ? `Setoran tabungan santri (${metode})`
          : `Penarikan tabungan santri (${metode})`),
      sumberAtauMetode: metode,
      saldoAkhir: saldoBaru,
      dicatatOleh: currentUser.nama,
    };

    setState((prev) => ({
      ...prev,
      santriList: prev.santriList.map((s) =>
        s.id === santriId ? { ...s, saldoTabungan: saldoBaru } : s
      ),
      mutasiTabunganList: [mutasi, ...prev.mutasiTabunganList],
    }));

    showToast(
      jenis === 'Setor'
        ? `Setoran tabungan ${target.namaLengkap} berhasil dicatat.`
        : `Penarikan tabungan ${target.namaLengkap} berhasil dicatat.`
    );
    return { ok: true };
  };

  const handlePindahTabunganKeEmoney = (
    santriId: string,
    nominal: number,
    keterangan: string
  ): { ok: boolean; error?: string } => {
    const target = state.santriList.find((s) => s.id === santriId);
    if (!target) return { ok: false, error: 'Data santri tidak ditemukan.' };
    if (nominal <= 0) return { ok: false, error: 'Nominal pindah dana harus lebih dari Rp 0.' };
    if (nominal > target.saldoTabungan) {
      return {
        ok: false,
        error: `Nominal pindah dana melebihi saldo tabungan aktif (Rp ${target.saldoTabungan.toLocaleString(
          'id-ID'
        )}).`,
      };
    }

    const nowIso = getLocalDateTimeIso();
    const saldoTabunganBaru = target.saldoTabungan - nominal;
    const saldoEmoneyBaru = target.saldoEmoney + nominal;
    const note =
      keterangan.trim() || 'Pindah dana dari Tabungan Santri ke E-Money uang saku';

    const mutasiTabungan: MutasiTabungan = {
      id: `tab-${Date.now()}`,
      santriId,
      tanggalWaktu: nowIso,
      jenis: 'Pindah ke E-Money',
      nominal,
      keterangan: note,
      sumberAtauMetode: 'Transfer Tabungan → E-Money',
      saldoAkhir: saldoTabunganBaru,
      dicatatOleh: currentUser.nama,
    };

    const mutasiEmoney: MutasiSaldo = {
      id: `mut-${Date.now() + 1}`,
      santriId,
      tanggalWaktu: nowIso,
      jenis: 'Top-Up',
      nominal,
      keterangan: note,
      sumberAtauLokasi: 'Transfer dari Tabungan Santri',
      saldoAkhir: saldoEmoneyBaru,
      dicatatOleh: currentUser.nama,
    };

    setState((prev) => ({
      ...prev,
      santriList: prev.santriList.map((s) =>
        s.id === santriId
          ? { ...s, saldoTabungan: saldoTabunganBaru, saldoEmoney: saldoEmoneyBaru }
          : s
      ),
      mutasiTabunganList: [mutasiTabungan, ...prev.mutasiTabunganList],
      mutasiSaldoList: [mutasiEmoney, ...prev.mutasiSaldoList],
    }));

    showToast(`Dana Rp ${nominal.toLocaleString('id-ID')} dipindahkan ke E-Money ${target.namaLengkap}.`);
    return { ok: true };
  };

  const handleResetDemoData = () => {
    const fresh: PersistedState = {
      isAuthenticated: true,
      currentUserId: INITIAL_USERS[0].id,
      usersList: INITIAL_USERS,
      santriList: INITIAL_SANTRI,
      tagihanList: INITIAL_TAGIHAN,
      perizinanList: INITIAL_PERIZINAN,
      kedisiplinanList: INITIAL_KEDISIPLINAN,
      kehadiranList: INITIAL_KEHADIRAN,
      ustadzList: INITIAL_USTADZ,
      profil: INITIAL_PROFIL_PESANTREN,
      mutasiSaldoList: INITIAL_MUTASI_SALDO,
      mutasiTabunganList: INITIAL_MUTASI_TABUNGAN,
    };
    setState(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    showToast('Data simulasi berhasil dikembalikan ke kondisi awal.');
  };

  // Render Login Screen when unauthenticated
  if (!state.isAuthenticated) {
    return (
      <>
        <LoginView
          users={state.usersList}
          profil={state.profil}
          onLogin={handleLogin}
        />
        {toastMessage && (
          <div
            role="status"
            className="no-print fixed bottom-5 right-5 z-50 rounded-xl border border-emerald-800/20 bg-emerald-900 px-4 py-3 text-xs font-medium text-white shadow-lg"
          >
            {toastMessage}
          </div>
        )}
      </>
    );
  }

  const activeNavMeta = navItems.find((item) => item.id === activeTab) ?? navItems[0];
  const waliSection: WaliSection =
    activeTab === 'kartu' ||
    activeTab === 'tabungan' ||
    activeTab === 'keuangan' ||
    activeTab === 'perizinan'
      ? activeTab
      : 'dashboard';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 bg-white">
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <img
            src={state.profil.logoUrl || '/assets/aistudio/images_710b9fe7.jpg'}
            alt="Logo Pondok Pesantren Sabilul Huda"
            referrerPolicy="no-referrer"
            className="h-10 w-10 shrink-0 rounded-lg object-contain bg-white border border-slate-200 p-0.5"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-slate-900">
              SIS SABDA
            </p>
            <p className="truncate text-[11px] text-slate-500">
              {state.profil.singkatan}
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto" aria-label="Menu Utama">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active User Switcher Box */}
        <div className="border-t border-slate-200 p-3 space-y-2">
          <button
            type="button"
            onClick={() => setUserSwitcherOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-left transition-colors hover:bg-slate-100"
          >
            <SantriAvatar
              src={currentUser.avatarUrl}
              name={currentUser.nama}
              sizeClass="w-9 h-9"
              roundedClass="rounded-full"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900">
                {currentUser.nama}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                {currentUser.role === 'admin' ? (
                  <ShieldCheck className="h-3 w-3 shrink-0" />
                ) : currentUser.role === 'wali' ? (
                  <Users className="h-3 w-3 shrink-0" />
                ) : (
                  <UserCheck className="h-3 w-3 shrink-0" />
                )}
                <span>{ROLE_LABEL[currentUser.role]}</span>
              </p>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar / Layar Login
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="no-print fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/45"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
              <div className="flex items-center gap-2.5">
                <img
                  src={state.profil.logoUrl || '/assets/aistudio/images_710b9fe7.jpg'}
                  alt="Logo Pondok Pesantren Sabilul Huda"
                  referrerPolicy="no-referrer"
                  className="h-9 w-9 shrink-0 rounded-lg object-contain bg-white border border-slate-200 p-0.5"
                />
                <span className="text-sm font-bold text-slate-900">SIS SABDA</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-slate-200 p-3 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setUserSwitcherOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left"
              >
                <SantriAvatar
                  src={currentUser.avatarUrl}
                  name={currentUser.nama}
                  sizeClass="w-9 h-9"
                  roundedClass="rounded-full"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900">
                    {currentUser.nama}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    {ROLE_LABEL[currentUser.role]} · Ganti Akun
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                Keluar ke Halaman Login
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex flex-1 flex-col lg:pl-64 min-w-0">
        {/* Top Header */}
        <header className="no-print sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Buka menu navigasi"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="hidden sm:inline">{state.profil.namaPesantren}</span>
                <span className="hidden sm:inline" aria-hidden="true">/</span>
                <span className="font-medium text-emerald-700 truncate">{activeNavMeta.label}</span>
              </div>
              <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                {activeNavMeta.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setUserSwitcherOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              {currentUser.role === 'admin' ? (
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
              ) : currentUser.role === 'wali' ? (
                <Users className="h-3.5 w-3.5 text-sky-700" />
              ) : (
                <UserCheck className="h-3.5 w-3.5 text-emerald-700" />
              )}
              <span className="hidden sm:inline">
                {ROLE_LABEL[currentUser.role]} ·{' '}
              </span>
              <span className="max-w-[140px] truncate font-semibold text-slate-900">
                {currentUser.nama.split(',')[0]}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="Keluar ke Halaman Login"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-600 transition-colors hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1360px] w-full mx-auto">
          {currentUser.role === 'wali' ? (
            activeTab === 'profil' ? (
              <ProfilPesantrenView
                profil={state.profil}
                santriList={state.santriList}
                ustadzList={state.ustadzList}
                currentUser={currentUser}
                onUpdateProfil={handleUpdateProfil}
                onSaveAsrama={handleSaveAsrama}
                onDeleteAsrama={handleDeleteAsrama}
                onSaveUstadz={handleSaveUstadz}
                onDeleteUstadz={handleDeleteUstadz}
                onResetDemoData={handleResetDemoData}
              />
            ) : (
              <WaliPortalView
                currentUser={currentUser}
                santriList={state.santriList}
                tagihanList={state.tagihanList}
                perizinanList={state.perizinanList}
                kedisiplinanList={state.kedisiplinanList}
                mutasiSaldoList={state.mutasiSaldoList}
                mutasiTabunganList={state.mutasiTabunganList}
                profil={state.profil}
                activeSection={waliSection}
                onChangeSection={(sec) => setActiveTab(sec)}
              />
            )
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  santriList={state.santriList}
                  ustadzList={state.ustadzList}
                  tagihanList={state.tagihanList}
                  perizinanList={state.perizinanList}
                  kedisiplinanList={state.kedisiplinanList}
                  kehadiranList={state.kehadiranList}
                  onAddKehadiran={handleAddKehadiran}
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === 'santri' && (
                <SantriManagementView
                  santriList={state.santriList}
                  tagihanList={state.tagihanList}
                  perizinanList={state.perizinanList}
                  kedisiplinanList={state.kedisiplinanList}
                  mutasiSaldoList={state.mutasiSaldoList}
                  asramaOptions={state.profil.asramaList.map((a) => a.nama)}
                  currentUser={currentUser}
                  onSaveSantri={handleSaveSantri}
                  onDeleteSantri={handleDeleteSantri}
                  onOpenKartuSantri={handleOpenKartuSantri}
                />
              )}

              {activeTab === 'kartu' && (
                <KartuSantriView
                  santriList={state.santriList}
                  perizinanList={state.perizinanList}
                  mutasiSaldoList={state.mutasiSaldoList}
                  mutasiTabunganList={state.mutasiTabunganList}
                  profil={state.profil}
                  currentUser={currentUser}
                  selectedSantriId={selectedCardSantriId}
                  onSelectSantri={setSelectedCardSantriId}
                  onUpdatePengaturan={handleUpdateKartuPengaturan}
                  onTopUpSaldo={handleTopUpSaldo}
                  onTransaksiKantin={handleTransaksiKantin}
                  onUpdateTargetTabungan={handleUpdateTargetTabungan}
                  onTransaksiTabungan={handleTransaksiTabungan}
                  onPindahTabunganKeEmoney={handlePindahTabunganKeEmoney}
                />
              )}

              {activeTab === 'keuangan' && (
                <KeuanganView
                  santriList={state.santriList}
                  tagihanList={state.tagihanList}
                  profil={state.profil}
                  currentUser={currentUser}
                  onMarkPaid={handleMarkPaid}
                  onCreateTagihan={handleCreateTagihan}
                />
              )}

              {activeTab === 'perizinan' && (
                <PerizinanView
                  santriList={state.santriList}
                  perizinanList={state.perizinanList}
                  kedisiplinanList={state.kedisiplinanList}
                  currentUser={currentUser}
                  onAddPerizinan={handleAddPerizinan}
                  onUpdatePerizinanStatus={handleUpdatePerizinanStatus}
                  onAddKedisiplinan={handleAddKedisiplinan}
                />
              )}

              {activeTab === 'pengguna' && (
                <UserManagementView
                  usersList={state.usersList}
                  santriList={state.santriList}
                  currentUser={currentUser}
                  onSaveUser={handleSaveUser}
                  onToggleUserStatus={handleToggleUserStatus}
                  onDeleteUser={handleDeleteUser}
                />
              )}

              {activeTab === 'profil' && (
                <ProfilPesantrenView
                  profil={state.profil}
                  santriList={state.santriList}
                  ustadzList={state.ustadzList}
                  currentUser={currentUser}
                  onUpdateProfil={handleUpdateProfil}
                  onSaveAsrama={handleSaveAsrama}
                  onDeleteAsrama={handleDeleteAsrama}
                  onSaveUstadz={handleSaveUstadz}
                  onDeleteUstadz={handleDeleteUstadz}
                  onResetDemoData={handleResetDemoData}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* User Switcher Modal */}
      <UserSwitcherModal
        isOpen={userSwitcherOpen}
        onClose={() => setUserSwitcherOpen(false)}
        users={state.usersList}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        onLogout={handleLogout}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="no-print fixed bottom-5 right-5 z-50 rounded-xl border border-emerald-800/20 bg-emerald-900 px-4 py-3 text-xs font-medium text-white shadow-lg"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
