import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Check,
  Edit3,
  Globe,
  Image as ImageIcon,
  Mail,
  MapPin,
  Phone,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import { BANNER_PRESETS, IMAGE_ASSETS } from '../data/mockData';
import {
  AppUser,
  AsramaInfo,
  ProfilPesantren,
  Santri,
  UstadzPengajar,
} from '../types/pesantren';

interface ProfilPesantrenViewProps {
  profil: ProfilPesantren;
  santriList: Santri[];
  ustadzList: UstadzPengajar[];
  currentUser: AppUser;
  onUpdateProfil: (updated: ProfilPesantren) => void;
  onSaveAsrama: (asrama: AsramaInfo, isNew: boolean, previousName?: string) => void;
  onDeleteAsrama: (id: string) => void;
  onSaveUstadz: (ustadz: UstadzPengajar, isNew: boolean) => void;
  onDeleteUstadz: (id: string) => void;
  onResetDemoData: () => void;
}

type EditModalTab = 'bg-logo' | 'identitas' | 'visimisi';

export function ProfilPesantrenView({
  profil,
  santriList,
  ustadzList,
  currentUser,
  onUpdateProfil,
  onSaveAsrama,
  onDeleteAsrama,
  onSaveUstadz,
  onDeleteUstadz,
  onResetDemoData,
}: ProfilPesantrenViewProps) {
  const isAdmin = currentUser.role === 'admin';

  // Hero image error state
  const [heroBannerError, setHeroBannerError] = useState(false);
  const [heroLogoError, setHeroLogoError] = useState(false);

  // Edit Profil & Background modal
  const [editOpen, setEditOpen] = useState(false);
  const [editModalTab, setEditModalTab] = useState<EditModalTab>('bg-logo');
  const [editForm, setEditForm] = useState<ProfilPesantren>(profil);
  const [previewBannerError, setPreviewBannerError] = useState(false);
  const [previewLogoError, setPreviewLogoError] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Asrama filter & CRUD modals
  const [asramaFilter, setAsramaFilter] = useState<'Semua' | 'Putra' | 'Putri'>('Semua');
  const [asramaModalOpen, setAsramaModalOpen] = useState(false);
  const [editingAsrama, setEditingAsrama] = useState<AsramaInfo | null>(null);
  const [asramaForm, setAsramaForm] = useState<Omit<AsramaInfo, 'id'>>({
    nama: '',
    kategori: 'Putra',
    jumlahKamar: 8,
    kapasitas: 48,
    musyrif: '',
    keterangan: '',
  });
  const [deleteAsramaTarget, setDeleteAsramaTarget] = useState<AsramaInfo | null>(null);

  // Ustadz filter & CRUD modals
  const [ustadzQuery, setUstadzQuery] = useState('');
  const [ustadzStatusFilter, setUstadzStatusFilter] = useState<'Semua' | 'Tetap' | 'Pengabdian'>(
    'Semua'
  );
  const [ustadzModalOpen, setUstadzModalOpen] = useState(false);
  const [editingUstadz, setEditingUstadz] = useState<UstadzPengajar | null>(null);
  const [ustadzForm, setUstadzForm] = useState<Omit<UstadzPengajar, 'id'>>({
    nip: '',
    nama: '',
    bidangStudi: '',
    amanah: '',
    pendidikan: '',
    status: 'Tetap',
    telepon: '',
  });
  const [deleteUstadzTarget, setDeleteUstadzTarget] = useState<UstadzPengajar | null>(null);

  // Reset demo data modal
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Occupancy calculated dynamically from active santri
  const asramaOccupancy = useMemo(() => {
    const counts = new Map<string, number>();
    santriList
      .filter((s) => s.status === 'Aktif')
      .forEach((s) => {
        counts.set(s.asrama, (counts.get(s.asrama) ?? 0) + 1);
      });
    return counts;
  }, [santriList]);

  const filteredAsrama = useMemo(() => {
    if (asramaFilter === 'Semua') return profil.asramaList;
    return profil.asramaList.filter((a) => a.kategori === asramaFilter);
  }, [profil.asramaList, asramaFilter]);

  const asramaSummary = useMemo(() => {
    const totalKamar = profil.asramaList.reduce((acc, a) => acc + a.jumlahKamar, 0);
    const totalKapasitas = profil.asramaList.reduce((acc, a) => acc + a.kapasitas, 0);
    const totalAktif = profil.asramaList.reduce(
      (acc, a) => acc + (asramaOccupancy.get(a.nama) ?? 0),
      0
    );
    return { totalKamar, totalKapasitas, totalAktif };
  }, [profil.asramaList, asramaOccupancy]);

  const filteredUstadz = useMemo(() => {
    const q = ustadzQuery.trim().toLowerCase();
    return ustadzList.filter((u) => {
      const matchStatus = ustadzStatusFilter === 'Semua' || u.status === ustadzStatusFilter;
      const matchQuery =
        !q ||
        u.nama.toLowerCase().includes(q) ||
        u.nip.toLowerCase().includes(q) ||
        u.bidangStudi.toLowerCase().includes(q) ||
        u.amanah.toLowerCase().includes(q) ||
        u.pendidikan.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [ustadzList, ustadzQuery, ustadzStatusFilter]);

  // Handlers: Edit Profil & Background
  const openEditProfilModal = (initialTab: EditModalTab = 'bg-logo') => {
    setEditForm({
      ...profil,
      misi: [...profil.misi],
      asramaList: [...profil.asramaList],
    });
    setEditModalTab(initialTab);
    setPreviewBannerError(false);
    setPreviewLogoError(false);
    setUploadError(null);
    setEditOpen(true);
  };

  const handleImageFileUpload = (
    file: File | undefined,
    target: 'banner' | 'logo'
  ) => {
    if (!file) return;
    setUploadError(null);
    const maxBytes = target === 'banner' ? 2 * 1024 * 1024 : 1 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError(
        target === 'banner'
          ? 'Ukuran file background maksimal 2 MB agar penyimpanan lokal tetap optimal.'
          : 'Ukuran file logo maksimal 1 MB.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (target === 'banner') {
          setPreviewBannerError(false);
          setEditForm((prev) => ({ ...prev, bannerUrl: reader.result as string }));
        } else {
          setPreviewLogoError(false);
          setEditForm((prev) => ({ ...prev, logoUrl: reader.result as string }));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfil = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMisi = editForm.misi.map((m) => m.trim()).filter(Boolean);
    setHeroBannerError(false);
    setHeroLogoError(false);
    onUpdateProfil({
      ...editForm,
      bannerUrl: editForm.bannerUrl.trim() || IMAGE_ASSETS.campusBanner,
      logoUrl: (editForm.logoUrl ?? '').trim() || IMAGE_ASSETS.pesantrenLogo,
      misi: cleanMisi.length > 0 ? cleanMisi : profil.misi,
    });
    setEditOpen(false);
  };

  // Handlers: Asrama CRUD
  const openCreateAsramaModal = () => {
    setEditingAsrama(null);
    setAsramaForm({
      nama: '',
      kategori: 'Putra',
      jumlahKamar: 8,
      kapasitas: 48,
      musyrif: '',
      keterangan: '',
    });
    setAsramaModalOpen(true);
  };

  const openEditAsramaModal = (asrama: AsramaInfo) => {
    setEditingAsrama(asrama);
    setAsramaForm({
      nama: asrama.nama,
      kategori: asrama.kategori,
      jumlahKamar: asrama.jumlahKamar,
      kapasitas: asrama.kapasitas,
      musyrif: asrama.musyrif,
      keterangan: asrama.keterangan ?? '',
    });
    setAsramaModalOpen(true);
  };

  const handleSubmitAsrama = (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !editingAsrama;
    const saved: AsramaInfo = {
      id: editingAsrama ? editingAsrama.id : `asr-${Date.now()}`,
      nama: asramaForm.nama.trim(),
      kategori: asramaForm.kategori,
      jumlahKamar: Math.max(1, Number(asramaForm.jumlahKamar) || 1),
      kapasitas: Math.max(1, Number(asramaForm.kapasitas) || 1),
      musyrif: asramaForm.musyrif.trim(),
      keterangan: (asramaForm.keterangan ?? '').trim() || undefined,
    };
    onSaveAsrama(saved, isNew, editingAsrama?.nama);
    setAsramaModalOpen(false);
  };

  // Handlers: Ustadz CRUD
  const openCreateUstadzModal = () => {
    setEditingUstadz(null);
    setUstadzForm({
      nip: `SH-2026${String(ustadzList.length + 1).padStart(2, '0')}`,
      nama: '',
      bidangStudi: '',
      amanah: '',
      pendidikan: '',
      status: 'Tetap',
      telepon: '',
    });
    setUstadzModalOpen(true);
  };

  const openEditUstadzModal = (ustadz: UstadzPengajar) => {
    setEditingUstadz(ustadz);
    setUstadzForm({
      nip: ustadz.nip,
      nama: ustadz.nama,
      bidangStudi: ustadz.bidangStudi,
      amanah: ustadz.amanah,
      pendidikan: ustadz.pendidikan,
      status: ustadz.status,
      telepon: ustadz.telepon,
    });
    setUstadzModalOpen(true);
  };

  const handleSubmitUstadz = (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !editingUstadz;
    const saved: UstadzPengajar = {
      id: editingUstadz ? editingUstadz.id : `ust-${Date.now()}`,
      nip: ustadzForm.nip.trim(),
      nama: ustadzForm.nama.trim(),
      bidangStudi: ustadzForm.bidangStudi.trim(),
      amanah: ustadzForm.amanah.trim(),
      pendidikan: ustadzForm.pendidikan.trim(),
      status: ustadzForm.status,
      telepon: ustadzForm.telepon.trim() || '-',
    };
    onSaveUstadz(saved, isNew);
    setUstadzModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 px-5 py-3 text-xs text-amber-900">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-700" />
          <span>
            Mode Lihat Saja: Pengubahan profil & background pondok, data asrama, data dewan pengajar, dan reset sistem khusus otorisasi <strong>Admin</strong>.
          </span>
        </div>
      )}

      {/* Campus Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-emerald-950">
        <div className="relative h-64 sm:h-72 w-full">
          {!heroBannerError && profil.bannerUrl ? (
            <img
              src={profil.bannerUrl}
              alt={profil.namaPesantren}
              referrerPolicy="no-referrer"
              onError={() => setHeroBannerError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900">
              <Building2 className="h-16 w-16 text-emerald-700/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/50 to-slate-900/15" />

          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-4 max-w-2xl text-white">
              <div className="hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-md overflow-hidden">
                {!heroLogoError ? (
                  <img
                    src={profil.logoUrl || IMAGE_ASSETS.pesantrenLogo}
                    alt={profil.namaPesantren}
                    referrerPolicy="no-referrer"
                    onError={() => setHeroLogoError(true)}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-emerald-700" />
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-300 font-mono-tabular">
                  NSPP {profil.nspp} · NPSN {profil.npsn} · Berdiri {profil.tahunBerdiri}
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl text-balance">
                  {profil.namaPesantren}
                </h2>
                <p className="mt-1 text-sm text-slate-200">
                  “{profil.motto}”
                </p>
              </div>
            </div>

            {isAdmin && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditProfilModal('bg-logo')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-emerald-50 whitespace-nowrap"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-emerald-700" />
                  Ubah Background & Profil
                </button>
                <button
                  type="button"
                  onClick={() => setResetConfirmOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-slate-900/60 px-3.5 py-2 text-xs font-medium text-white backdrop-blur-xs hover:bg-slate-900/80 whitespace-nowrap"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Simulasi
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Identitas & Visi Misi */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Identitas & Kontak */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Identitas & Kontak</h3>
              <p className="mt-0.5 text-xs text-slate-500">Informasi resmi lembaga pesantren</p>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => openEditProfilModal('identitas')}
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline whitespace-nowrap shrink-0"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          </div>

          <dl className="space-y-3.5 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Pengasuh Pondok</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">{profil.pengasuh}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Status Akreditasi</dt>
              <dd className="mt-0.5 font-medium text-emerald-700">{profil.akreditasi}</dd>
            </div>
            <div className="flex items-start gap-2.5 pt-1">
              <MapPin className="h-4 w-4 shrink-0 text-emerald-700 mt-0.5" />
              <div className="text-xs leading-relaxed text-slate-700">
                <p>{profil.alamat}</p>
                <p>
                  {profil.kota}, {profil.provinsi}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-emerald-700" />
              <span className="text-xs font-mono-tabular text-slate-700">{profil.telepon}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-emerald-700" />
              <span className="text-xs text-slate-700">{profil.email}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 shrink-0 text-emerald-700" />
              <span className="text-xs text-emerald-700 font-medium">{profil.website}</span>
            </div>
          </dl>
        </section>

        {/* Visi & Misi */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2 space-y-5">
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Visi & Misi Pendidikan</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Arah pembinaan keilmuan dan akhlak santri
              </p>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => openEditProfilModal('visimisi')}
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline whitespace-nowrap shrink-0"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit Visi & Misi
              </button>
            )}
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Visi Pesantren
            </h4>
            <p className="mt-2 rounded-lg bg-emerald-50/70 border border-emerald-200/70 p-4 text-sm leading-relaxed text-slate-800">
              {profil.visi}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Misi Strategis
            </h4>
            <ol className="mt-2.5 space-y-2 text-sm text-slate-700">
              {profil.misi.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-xs font-semibold text-emerald-800 font-mono-tabular">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>

      {/* Asrama & Musyrif */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Daftar Asrama & Musyrif ({profil.asramaList.length})
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 font-mono-tabular">
              {asramaSummary.totalKamar} Kamar · Kapasitas {asramaSummary.totalKapasitas} Santri ·{' '}
              {asramaSummary.totalAktif} Penghuni Aktif Terdaftar
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center rounded-lg bg-slate-100 p-1">
              {(['Semua', 'Putra', 'Putri'] as const).map((kat) => (
                <button
                  key={kat}
                  type="button"
                  onClick={() => setAsramaFilter(kat)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    asramaFilter === kat
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {kat}
                </button>
              ))}
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={openCreateAsramaModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-emerald-800 whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Asrama
              </button>
            )}
          </div>
        </div>

        {filteredAsrama.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Belum ada data asrama untuk kategori ini.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAsrama.map((asr) => {
              const terisiAktif = asramaOccupancy.get(asr.nama) ?? 0;
              const occupancyPct =
                asr.kapasitas > 0
                  ? Math.min(100, Math.round((terisiAktif / asr.kapasitas) * 100))
                  : 0;

              return (
                <div
                  key={asr.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">{asr.nama}</h4>
                      <span
                        className={`text-xs font-semibold shrink-0 ${
                          asr.kategori === 'Putra' ? 'text-emerald-700' : 'text-sky-700'
                        }`}
                      >
                        {asr.kategori}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">
                      Pembina: <span className="font-medium text-slate-900">{asr.musyrif}</span>
                    </p>
                    {asr.keterangan && (
                      <p className="text-xs leading-relaxed text-slate-500">{asr.keterangan}</p>
                    )}
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        style={{ width: `${occupancyPct}%` }}
                        className="h-full rounded-full bg-emerald-600 transition-all"
                      />
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200/80 pt-2 text-xs text-slate-500 font-mono-tabular">
                      <span>{asr.jumlahKamar} Kamar</span>
                      <span>Kapasitas {asr.kapasitas}</span>
                      <span className="font-semibold text-emerald-800">
                        {terisiAktif} Penghuni Aktif
                      </span>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => openEditAsramaModal(asr)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Edit3 className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteAsramaTarget(asr)}
                          className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Dewan Ustadz & Tenaga Pengajar */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Dewan Ustadz & Tenaga Pengajar ({ustadzList.length})
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Pengajar kitab kuning, tahfidz Al-Quran, dan kurikulum formal MTs/MA
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center rounded-lg bg-slate-100 p-1">
              {(['Semua', 'Tetap', 'Pengabdian'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setUstadzStatusFilter(status)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    ustadzStatusFilter === status
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={ustadzQuery}
                onChange={(e) => setUstadzQuery(e.target.value)}
                placeholder="Cari NIP, nama, bidang..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={openCreateUstadzModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-emerald-800 whitespace-nowrap shrink-0"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Tambah Pengajar
              </button>
            )}
          </div>
        </div>

        {filteredUstadz.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Tidak ada data dewan pengajar yang sesuai dengan pencarian atau filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="px-5 py-3">NIP</th>
                  <th className="px-4 py-3">Nama Ustadz / Ustadzah</th>
                  <th className="px-4 py-3">Bidang Studi</th>
                  <th className="px-4 py-3">Amanah / Jabatan</th>
                  <th className="px-4 py-3">Pendidikan</th>
                  <th className="px-4 py-3 text-right">Status</th>
                  {isAdmin && <th className="px-5 py-3 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUstadz.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono-tabular text-xs text-slate-500 whitespace-nowrap">
                      {u.nip}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{u.nama}</p>
                      {u.telepon && u.telepon !== '-' && (
                        <p className="text-[11px] font-mono-tabular text-slate-500">{u.telepon}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{u.bidangStudi}</td>
                    <td className="px-4 py-3 text-slate-600">{u.amanah}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{u.pendidikan}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span
                        className={`text-xs font-semibold ${
                          u.status === 'Tetap' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditUstadzModal(u)}
                            title={`Edit ${u.nama}`}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Edit3 className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteUstadzTarget(u)}
                            title={`Hapus ${u.nama}`}
                            className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3 w-3" />
                            Hapus
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Edit Profil & Background Modal */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Pengaturan Profil & Background Pesantren
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Sesuaikan banner utama, logo lembaga, identitas resmi, serta visi & misi pondok
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Sub-Navigation Tabs */}
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-2.5">
              <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-200/70 p-1 w-fit">
                {(
                  [
                    { id: 'bg-logo', label: 'Background & Logo' },
                    { id: 'identitas', label: 'Identitas & Kontak' },
                    { id: 'visimisi', label: 'Visi & Misi' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setEditModalTab(tab.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      editModalTab === tab.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveProfil} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {uploadError && (
                  <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {editModalTab === 'bg-logo' && (
                  <div className="space-y-6">
                    {/* Live Preview Banner */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-slate-700">
                          Pratinjau Langsung Banner Utama
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewBannerError(false);
                            setEditForm({ ...editForm, bannerUrl: IMAGE_ASSETS.campusBanner });
                          }}
                          className="text-xs font-medium text-emerald-700 hover:underline"
                        >
                          Pulihkan Banner Default
                        </button>
                      </div>

                      <div className="relative h-44 w-full overflow-hidden rounded-xl border border-slate-200 bg-emerald-950">
                        {!previewBannerError && editForm.bannerUrl ? (
                          <img
                            src={editForm.bannerUrl}
                            alt="Pratinjau Banner Pesantren"
                            referrerPolicy="no-referrer"
                            onError={() => setPreviewBannerError(true)}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-emerald-950 to-slate-900 text-emerald-200/80">
                            <Building2 className="h-8 w-8" />
                            <span className="text-xs">
                              {previewBannerError
                                ? 'Gambar URL tidak dapat dimuat. Pilih preset atau unggah foto lokal.'
                                : 'Belum ada gambar banner'}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/45 to-slate-900/10" />
                        <div className="absolute inset-x-0 bottom-0 p-4 flex items-center gap-3 text-white">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white p-1 overflow-hidden">
                            {!previewLogoError ? (
                              <img
                                src={editForm.logoUrl || IMAGE_ASSETS.pesantrenLogo}
                                alt="Pratinjau Logo"
                                referrerPolicy="no-referrer"
                                onError={() => setPreviewLogoError(true)}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <Building2 className="h-6 w-6 text-emerald-700" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold">{editForm.namaPesantren}</p>
                            <p className="truncate text-xs text-slate-200">“{editForm.motto}”</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Upload Lokal + Input URL Banner */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                      <div className="sm:col-span-5">
                        <label className="block text-xs font-semibold text-slate-700">
                          Unggah File Gambar Lokal
                        </label>
                        <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-emerald-400 bg-emerald-50/50 px-4 py-2.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-50">
                          <Upload className="h-4 w-4 text-emerald-700" />
                          <span>Pilih Foto (Maks. 2 MB)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileUpload(e.target.files?.[0], 'banner')}
                            className="sr-only"
                          />
                        </label>
                      </div>

                      <div className="sm:col-span-7">
                        <label className="block text-xs font-semibold text-slate-700">
                          Atau Masukkan URL Gambar Banner
                        </label>
                        <input
                          type="text"
                          value={editForm.bannerUrl}
                          onChange={(e) => {
                            setPreviewBannerError(false);
                            setEditForm({ ...editForm, bannerUrl: e.target.value });
                          }}
                          placeholder="https://... atau path gambar lokal"
                          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Preset Foto Lingkungan Pondok */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Pilih Preset Foto Lingkungan Pondok
                      </label>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {BANNER_PRESETS.map((preset) => {
                          const isSelected = editForm.bannerUrl === preset.url;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                setPreviewBannerError(false);
                                setEditForm({ ...editForm, bannerUrl: preset.url });
                              }}
                              className={`group relative overflow-hidden rounded-xl border text-left transition-all ${
                                isSelected
                                  ? 'border-emerald-600 ring-2 ring-emerald-600/20'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="relative aspect-video w-full bg-slate-100">
                                <img
                                  src={preset.url}
                                  alt={preset.label}
                                  referrerPolicy="no-referrer"
                                  className="h-full w-full object-cover"
                                />
                                {isSelected && (
                                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                                    <Check className="h-3 w-3" />
                                  </span>
                                )}
                              </div>
                              <p className="truncate bg-white px-2.5 py-2 text-[11px] font-medium text-slate-700">
                                {preset.label}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pengaturan Logo Lembaga */}
                    <div className="border-t border-slate-200 pt-5">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-slate-700">
                          Logo Resmi Pondok Pesantren
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewLogoError(false);
                            setEditForm({ ...editForm, logoUrl: IMAGE_ASSETS.pesantrenLogo });
                          }}
                          className="text-xs font-medium text-emerald-700 hover:underline"
                        >
                          Pulihkan Logo Asli
                        </button>
                      </div>

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-1.5 overflow-hidden">
                          {!previewLogoError ? (
                            <img
                              src={editForm.logoUrl || IMAGE_ASSETS.pesantrenLogo}
                              alt="Logo Pesantren"
                              referrerPolicy="no-referrer"
                              onError={() => setPreviewLogoError(true)}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <Building2 className="h-7 w-7 text-emerald-700" />
                          )}
                        </div>

                        <div className="flex-1 grid grid-cols-1 gap-3 sm:grid-cols-12">
                          <div className="sm:col-span-5">
                            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                              <Upload className="h-3.5 w-3.5 text-emerald-700" />
                              <span>Unggah Logo (Maks. 1 MB)</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageFileUpload(e.target.files?.[0], 'logo')}
                                className="sr-only"
                              />
                            </label>
                          </div>
                          <div className="sm:col-span-7">
                            <input
                              type="text"
                              value={editForm.logoUrl ?? ''}
                              onChange={(e) => {
                                setPreviewLogoError(false);
                                setEditForm({ ...editForm, logoUrl: e.target.value });
                              }}
                              placeholder="URL atau path logo lembaga"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {editModalTab === 'identitas' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700">
                        Nama Pesantren
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.namaPesantren}
                        onChange={(e) =>
                          setEditForm({ ...editForm, namaPesantren: e.target.value })
                        }
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">
                        Singkatan Lembaga
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.singkatan}
                        onChange={(e) => setEditForm({ ...editForm, singkatan: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">NSPP</label>
                      <input
                        type="text"
                        required
                        value={editForm.nspp}
                        onChange={(e) => setEditForm({ ...editForm, nspp: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">NPSN</label>
                      <input
                        type="text"
                        required
                        value={editForm.npsn}
                        onChange={(e) => setEditForm({ ...editForm, npsn: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">
                        Pengasuh Pondok
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.pengasuh}
                        onChange={(e) => setEditForm({ ...editForm, pengasuh: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700">
                          Tahun Berdiri
                        </label>
                        <input
                          type="number"
                          required
                          min={1900}
                          max={2035}
                          value={editForm.tahunBerdiri}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              tahunBerdiri: Number(e.target.value) || 1998,
                            })
                          }
                          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular focus:border-emerald-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700">
                          Akreditasi
                        </label>
                        <input
                          type="text"
                          required
                          value={editForm.akreditasi}
                          onChange={(e) =>
                            setEditForm({ ...editForm, akreditasi: e.target.value })
                          }
                          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700">
                        Motto Pesantren
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.motto}
                        onChange={(e) => setEditForm({ ...editForm, motto: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">Telepon</label>
                      <input
                        type="text"
                        required
                        value={editForm.telepon}
                        onChange={(e) => setEditForm({ ...editForm, telepon: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">Email Resmi</label>
                      <input
                        type="email"
                        required
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700">Website</label>
                      <input
                        type="text"
                        required
                        value={editForm.website}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700">
                        Alamat Lengkap
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.alamat}
                        onChange={(e) => setEditForm({ ...editForm, alamat: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">
                        Kota / Kabupaten
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.kota}
                        onChange={(e) => setEditForm({ ...editForm, kota: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">
                        Provinsi & Kode Pos
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.provinsi}
                        onChange={(e) => setEditForm({ ...editForm, provinsi: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {editModalTab === 'visimisi' && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Visi Pesantren
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={editForm.visi}
                        onChange={(e) => setEditForm({ ...editForm, visi: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700">
                          Daftar Misi Strategis ({editForm.misi.length})
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setEditForm({ ...editForm, misi: [...editForm.misi, ''] })
                          }
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Tambah Poin Misi
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {editForm.misi.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-700 font-mono-tabular">
                              {idx + 1}
                            </span>
                            <textarea
                              rows={2}
                              required
                              value={item}
                              onChange={(e) => {
                                const next = [...editForm.misi];
                                next[idx] = e.target.value;
                                setEditForm({ ...editForm, misi: next });
                              }}
                              placeholder={`Tuliskan poin misi ke-${idx + 1}`}
                              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                            />
                            {editForm.misi.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditForm({
                                    ...editForm,
                                    misi: editForm.misi.filter((_, i) => i !== idx),
                                  });
                                }}
                                title="Hapus poin misi"
                                className="mt-2 rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                <span className="text-xs text-slate-500">
                  Perubahan otomatis tersimpan ke penyimpanan lokal browser
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditOpen(false)}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                  >
                    Simpan Perubahan Profil
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Asrama Modal */}
      {asramaModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">
                {editingAsrama ? 'Edit Data Asrama & Musyrif' : 'Tambah Data Asrama Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setAsramaModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitAsrama} className="space-y-4 p-6">
              <div>
                <label className="block text-xs font-medium text-slate-700">Nama Asrama</label>
                <input
                  type="text"
                  required
                  value={asramaForm.nama}
                  onChange={(e) => setAsramaForm({ ...asramaForm, nama: e.target.value })}
                  placeholder="Contoh: Asrama Al-Kindi (Putra)"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Kategori</label>
                  <select
                    value={asramaForm.kategori}
                    onChange={(e) =>
                      setAsramaForm({
                        ...asramaForm,
                        kategori: e.target.value as 'Putra' | 'Putri',
                      })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="Putra">Putra</option>
                    <option value="Putri">Putri</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Jumlah Kamar</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={200}
                    value={asramaForm.jumlahKamar}
                    onChange={(e) =>
                      setAsramaForm({ ...asramaForm, jumlahKamar: Number(e.target.value) })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Kapasitas Santri
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={1000}
                    value={asramaForm.kapasitas}
                    onChange={(e) =>
                      setAsramaForm({ ...asramaForm, kapasitas: Number(e.target.value) })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Nama Musyrif / Musyrifah Pembina
                </label>
                <input
                  type="text"
                  required
                  value={asramaForm.musyrif}
                  onChange={(e) => setAsramaForm({ ...asramaForm, musyrif: e.target.value })}
                  placeholder="Contoh: Ustadz Hanif Mubarok"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Keterangan / Fasilitas Asrama
                </label>
                <textarea
                  rows={2}
                  value={asramaForm.keterangan ?? ''}
                  onChange={(e) => setAsramaForm({ ...asramaForm, keterangan: e.target.value })}
                  placeholder="Contoh: Gedung 2 lantai, aula mutholaah, loker kayu & ruang kesehatan"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAsramaModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                >
                  {editingAsrama ? 'Simpan Perubahan' : 'Tambah Asrama'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Asrama Confirmation */}
      {deleteAsramaTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">Hapus Data Asrama?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Asrama <strong>{deleteAsramaTarget.nama}</strong> akan dihapus dari daftar asrama pesantren.
            </p>
            {(asramaOccupancy.get(deleteAsramaTarget.nama) ?? 0) > 0 && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                Catatan: Masih terdapat{' '}
                <strong className="font-mono-tabular">
                  {asramaOccupancy.get(deleteAsramaTarget.nama)}
                </strong>{' '}
                santri aktif yang terdaftar pada asrama ini.
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteAsramaTarget(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAsrama(deleteAsramaTarget.id);
                  setDeleteAsramaTarget(null);
                }}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
              >
                Hapus Asrama
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Ustadz Modal */}
      {ustadzModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">
                {editingUstadz ? 'Edit Data Ustadz / Pengajar' : 'Tambah Ustadz / Pengajar'}
              </h3>
              <button
                type="button"
                onClick={() => setUstadzModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitUstadz} className="space-y-4 p-6">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  required
                  value={ustadzForm.nama}
                  onChange={(e) => setUstadzForm({ ...ustadzForm, nama: e.target.value })}
                  placeholder="Contoh: Ustadz Ahmad Munawar, Lc."
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">NIP</label>
                  <input
                    type="text"
                    required
                    value={ustadzForm.nip}
                    onChange={(e) => setUstadzForm({ ...ustadzForm, nip: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Status</label>
                  <select
                    value={ustadzForm.status}
                    onChange={(e) =>
                      setUstadzForm({
                        ...ustadzForm,
                        status: e.target.value as 'Tetap' | 'Pengabdian',
                      })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="Tetap">Tetap</option>
                    <option value="Pengabdian">Pengabdian</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Bidang Studi</label>
                <input
                  type="text"
                  required
                  value={ustadzForm.bidangStudi}
                  onChange={(e) => setUstadzForm({ ...ustadzForm, bidangStudi: e.target.value })}
                  placeholder="Contoh: Nahwu Shorof & Kitab Kuning"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Amanah / Jabatan
                </label>
                <input
                  type="text"
                  required
                  value={ustadzForm.amanah}
                  onChange={(e) => setUstadzForm({ ...ustadzForm, amanah: e.target.value })}
                  placeholder="Contoh: Wali Kelas 9 MTs"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Jenjang Pendidikan
                  </label>
                  <input
                    type="text"
                    required
                    value={ustadzForm.pendidikan}
                    onChange={(e) => setUstadzForm({ ...ustadzForm, pendidikan: e.target.value })}
                    placeholder="Contoh: S1 Al-Azhar Kairo"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Nomor Telepon / WA
                  </label>
                  <input
                    type="text"
                    value={ustadzForm.telepon}
                    onChange={(e) => setUstadzForm({ ...ustadzForm, telepon: e.target.value })}
                    placeholder="Contoh: 0812-xxxx-xxxx"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUstadzModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                >
                  {editingUstadz ? 'Simpan Perubahan' : 'Simpan Pengajar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Ustadz Confirmation */}
      {deleteUstadzTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">Hapus Data Pengajar?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Data <strong>{deleteUstadzTarget.nama}</strong> ({deleteUstadzTarget.nip}) akan dihapus dari daftar dewan ustadz & tenaga pengajar.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteUstadzTarget(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteUstadz(deleteUstadzTarget.id);
                  setDeleteUstadzTarget(null);
                }}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
              >
                Hapus Pengajar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Demo Data Confirmation */}
      {resetConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">Reset Data Simulasi?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Seluruh perubahan lokal akan dikembalikan ke data awal simulasi pesantren.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetDemoData();
                  setResetConfirmOpen(false);
                }}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
              >
                Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
