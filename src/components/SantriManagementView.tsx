import { useMemo, useState } from 'react';
import {
  CreditCard,
  Edit3,
  Eye,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  ASRAMA_OPTIONS,
  IMAGE_ASSETS,
  KELAS_OPTIONS,
} from '../data/mockData';
import {
  AppUser,
  CatatanKedisiplinan,
  JenisKelamin,
  MutasiSaldo,
  PembayaranTagihan,
  PerizinanSantri,
  Santri,
  StatusSantri,
} from '../types/pesantren';
import {
  formatRupiah,
  formatTanggalIndo,
  formatWaktuIndo,
  getLocalDateKey,
} from '../utils/formatters';
import { SantriAvatar } from './SantriAvatar';

interface SantriManagementViewProps {
  santriList: Santri[];
  tagihanList: PembayaranTagihan[];
  perizinanList: PerizinanSantri[];
  kedisiplinanList: CatatanKedisiplinan[];
  mutasiSaldoList: MutasiSaldo[];
  asramaOptions?: string[];
  currentUser: AppUser;
  onSaveSantri: (santri: Santri, isNew: boolean) => void;
  onDeleteSantri: (id: string) => void;
  onOpenKartuSantri: (santriId: string) => void;
}

const EMPTY_FORM: Omit<Santri, 'id'> = {
  nis: '',
  namaLengkap: '',
  jenisKelamin: 'Laki-laki',
  tempatLahir: '',
  tanggalLahir: '2010-01-01',
  kelas: '7 MTs',
  asrama: ASRAMA_OPTIONS[0],
  kamar: 'AF-101',
  namaWali: '',
  hubunganWali: 'Ayah Kandung',
  teleponWali: '',
  alamat: '',
  tahunMasuk: 2026,
  status: 'Aktif',
  fotoUrl: IMAGE_ASSETS.santriMale1,
  hafalanJuz: 1,
  poinKedisiplinan: 100,
  saldoEmoney: 50000,
  limitHarian: 20000,
  pinKartu: '123456',
  saldoTabungan: 100000,
  targetTabunganNama: 'Kitab & Seragam Baru',
  targetTabunganNominal: 1000000,
};

export function SantriManagementView({
  santriList,
  tagihanList,
  perizinanList,
  kedisiplinanList,
  mutasiSaldoList,
  asramaOptions,
  currentUser,
  onSaveSantri,
  onDeleteSantri,
  onOpenKartuSantri,
}: SantriManagementViewProps) {
  const resolvedAsramaOptions =
    asramaOptions && asramaOptions.length > 0 ? asramaOptions : ASRAMA_OPTIONS;
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelas, setFilterKelas] = useState('Semua');
  const [filterAsrama, setFilterAsrama] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  const [detailSantri, setDetailSantri] = useState<Santri | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<Omit<Santri, 'id'>>(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'admin';

  const filteredSantri = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return santriList.filter((s) => {
      const matchSearch =
        !q ||
        s.namaLengkap.toLowerCase().includes(q) ||
        s.nis.toLowerCase().includes(q) ||
        s.namaWali.toLowerCase().includes(q) ||
        s.kamar.toLowerCase().includes(q);
      const matchKelas = filterKelas === 'Semua' || s.kelas === filterKelas;
      const matchAsrama = filterAsrama === 'Semua' || s.asrama === filterAsrama;
      const matchStatus = filterStatus === 'Semua' || s.status === filterStatus;
      return matchSearch && matchKelas && matchAsrama && matchStatus;
    });
  }, [santriList, searchQuery, filterKelas, filterAsrama, filterStatus]);

  const openCreateModal = () => {
    const nextNis = `2026${String(santriList.length + 310).padStart(4, '0')}`;
    setEditingId(null);
    setFormState({ ...EMPTY_FORM, nis: nextNis, asrama: resolvedAsramaOptions[0] ?? ASRAMA_OPTIONS[0] });
    setFormOpen(true);
  };

  const openEditModal = (santri: Santri) => {
    setEditingId(santri.id);
    const { id: _id, ...rest } = santri;
    setFormState(rest);
    setFormOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormState((prev) => ({ ...prev, fotoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const record: Santri = {
      id: editingId ?? `s-${Date.now()}`,
      ...formState,
    };
    onSaveSantri(record, !editingId);
    setFormOpen(false);
    if (detailSantri && detailSantri.id === record.id) {
      setDetailSantri(record);
    }
  };

  const detailFinancials = useMemo(() => {
    if (!detailSantri) return [];
    return tagihanList.filter((t) => t.santriId === detailSantri.id);
  }, [detailSantri, tagihanList]);

  const detailIzin = useMemo(() => {
    if (!detailSantri) return [];
    return perizinanList.filter((p) => p.santriId === detailSantri.id);
  }, [detailSantri, perizinanList]);

  const detailDisiplin = useMemo(() => {
    if (!detailSantri) return [];
    return kedisiplinanList.filter((d) => d.santriId === detailSantri.id);
  }, [detailSantri, kedisiplinanList]);

  const detailMutasi = useMemo(() => {
    if (!detailSantri) return [];
    return mutasiSaldoList.filter((m) => m.santriId === detailSantri.id);
  }, [detailSantri, mutasiSaldoList]);

  const detailSpentToday = useMemo(() => {
    if (!detailSantri) return 0;
    const todayKey = getLocalDateKey();
    return detailMutasi
      .filter((m) => m.jenis === 'Pembayaran' && m.tanggalWaktu.startsWith(todayKey))
      .reduce((acc, m) => acc + m.nominal, 0);
  }, [detailSantri, detailMutasi]);

  return (
    <div className="space-y-6">
      {/* Toolbar & Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama santri, NIS, kamar, atau wali..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              aria-label="Filter Kelas"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-600 focus:outline-none"
            >
              <option value="Semua">Semua Kelas</option>
              {KELAS_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>

            <select
              value={filterAsrama}
              onChange={(e) => setFilterAsrama(e.target.value)}
              aria-label="Filter Asrama"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-600 focus:outline-none"
            >
              <option value="Semua">Semua Asrama</option>
              {resolvedAsramaOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter Status"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-600 focus:outline-none"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Cuti">Cuti</option>
              <option value="Alumni">Alumni</option>
            </select>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              Tambah Santri
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>
            Menampilkan <strong className="font-semibold text-slate-800 tabular-nums">{filteredSantri.length}</strong> dari{' '}
            <span className="tabular-nums">{santriList.length}</span> santri
          </span>
          {(searchQuery || filterKelas !== 'Semua' || filterAsrama !== 'Semua' || filterStatus !== 'Semua') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterKelas('Semua');
                setFilterAsrama('Semua');
                setFilterStatus('Semua');
              }}
              className="font-medium text-emerald-700 hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Santri Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {filteredSantri.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-sm font-semibold text-slate-900">Data santri tidak ditemukan</p>
            <p className="mt-1 text-xs text-slate-500">
              Coba ubah kata kunci pencarian atau tambahkan data santri baru.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Santri Baru
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="px-5 py-3.5">Santri & NIS</th>
                  <th className="px-4 py-3.5">Kelas</th>
                  <th className="px-4 py-3.5">Asrama & Kamar</th>
                  <th className="px-4 py-3.5">Wali Santri</th>
                  <th className="px-4 py-3.5 text-right">Saldo E-Money</th>
                  <th className="px-4 py-3.5 text-right">Hafalan</th>
                  <th className="px-4 py-3.5 text-right">Poin</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSantri.map((s) => (
                  <tr
                    key={s.id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <SantriAvatar src={s.fotoUrl} name={s.namaLengkap} sizeClass="w-10 h-10" />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setDetailSantri(s)}
                            className="truncate font-semibold text-slate-900 hover:text-emerald-700 text-left"
                          >
                            {s.namaLengkap}
                          </button>
                          <p className="text-xs text-slate-500 font-mono-tabular">
                            NIS {s.nis} · {s.jenisKelamin === 'Laki-laki' ? 'Putra' : 'Putri'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{s.kelas}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800">{s.asrama.replace(' (Putra)', '').replace(' (Putri)', '')}</p>
                      <p className="text-xs text-slate-500 font-mono-tabular">Kamar {s.kamar}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800">{s.namaWali}</p>
                      <p className="text-xs text-slate-500 font-mono-tabular">{s.teleponWali}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono-tabular font-semibold text-emerald-700 whitespace-nowrap">
                      {formatRupiah(s.saldoEmoney)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-tabular text-slate-700 whitespace-nowrap">
                      {s.hafalanJuz} Juz
                    </td>
                    <td className="px-4 py-3 text-right font-mono-tabular whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          s.poinKedisiplinan >= 100
                            ? 'text-emerald-700'
                            : s.poinKedisiplinan >= 85
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {s.poinKedisiplinan}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-xs font-semibold ${
                          s.status === 'Aktif'
                            ? 'text-emerald-700'
                            : s.status === 'Cuti'
                            ? 'text-amber-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setDetailSantri(s)}
                          title="Lihat Detail Profil"
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenKartuSantri(s.id)}
                          title="Kartu Santri Digital"
                          className="rounded-lg p-2 text-emerald-700 transition-colors hover:bg-emerald-50"
                        >
                          <CreditCard className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(s)}
                          title="Edit Data Santri"
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(s.id)}
                            title="Hapus Data Santri"
                            className="rounded-lg p-2 text-rose-600 transition-colors hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Profil Modal */}
      {detailSantri && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">Profil Lengkap Santri</h3>
              <button
                type="button"
                onClick={() => setDetailSantri(null)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                  <SantriAvatar
                    src={detailSantri.fotoUrl}
                    name={detailSantri.namaLengkap}
                    sizeClass="w-20 h-20"
                    textClass="text-xl"
                  />
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">
                      {detailSantri.namaLengkap}
                    </h4>
                    <p className="mt-1 text-sm text-slate-600 font-mono-tabular">
                      NIS {detailSantri.nis} · Angkatan {detailSantri.tahunMasuk} · Status:{' '}
                      <strong className="text-emerald-700">{detailSantri.status}</strong>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {detailSantri.kelas} · {detailSantri.asrama} · Kamar {detailSantri.kamar}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const targetId = detailSantri.id;
                      setDetailSantri(null);
                      onOpenKartuSantri(targetId);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-emerald-800 whitespace-nowrap"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Kartu Digital
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = detailSantri;
                      setDetailSantri(null);
                      openEditModal(target);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </div>
              </div>

              {/* Bio Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-xs text-slate-500">Tempat, Tanggal Lahir</span>
                  <p className="mt-0.5 font-medium text-slate-900">
                    {detailSantri.tempatLahir}, {formatTanggalIndo(detailSantri.tanggalLahir)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Jenis Kelamin</span>
                  <p className="mt-0.5 font-medium text-slate-900">{detailSantri.jenisKelamin}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Wali Santri ({detailSantri.hubunganWali})</span>
                  <p className="mt-0.5 font-medium text-slate-900">{detailSantri.namaWali}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">No. Telepon / WhatsApp Wali</span>
                  <p className="mt-0.5 font-medium text-slate-900 font-mono-tabular">
                    {detailSantri.teleponWali}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-xs text-slate-500">Alamat Domisili</span>
                  <p className="mt-0.5 font-medium text-slate-900">{detailSantri.alamat}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Capaian Tahfidz</span>
                  <p className="mt-0.5 font-semibold text-emerald-700 font-mono-tabular">
                    {detailSantri.hafalanJuz} Juz Al-Quran
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Poin Kedisiplinan</span>
                  <p className="mt-0.5 font-semibold text-slate-900 font-mono-tabular">
                    {detailSantri.poinKedisiplinan} Poin
                  </p>
                </div>
              </div>

              {/* Info Saldo E-Money & Pengaturan Limit */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-emerald-900">
                      Dompet E-Money Kartu Santri
                    </p>
                    <p className="text-[11px] text-emerald-800/80">
                      Uang saku non-tunai untuk transaksi kantin & koperasi
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const targetId = detailSantri.id;
                      setDetailSantri(null);
                      onOpenKartuSantri(targetId);
                    }}
                    className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800 whitespace-nowrap"
                  >
                    Kelola Saldo & PIN
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 border-t border-emerald-200/70 pt-3">
                  <div>
                    <span className="text-[11px] text-slate-500">Saldo E-Money</span>
                    <p className="text-base font-bold text-emerald-800 font-mono-tabular">
                      {formatRupiah(detailSantri.saldoEmoney)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Batas Jajan Harian</span>
                    <p className="text-sm font-semibold text-slate-900 font-mono-tabular">
                      {formatRupiah(detailSantri.limitHarian)} / hari
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Terpakai Hari Ini</span>
                    <p className="text-sm font-semibold text-slate-900 font-mono-tabular">
                      {formatRupiah(detailSpentToday)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Saldo Tabungan</span>
                    <p className="text-base font-bold text-slate-900 font-mono-tabular">
                      {formatRupiah(detailSantri.saldoTabungan)}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-medium truncate">
                      Target: {detailSantri.targetTabunganNama} (
                      {detailSantri.targetTabunganNominal > 0
                        ? Math.min(
                            100,
                            Math.round(
                              (detailSantri.saldoTabungan / detailSantri.targetTabunganNominal) * 100
                            )
                          )
                        : 0}
                      %)
                    </p>
                  </div>
                </div>

                {detailMutasi.length > 0 && (
                  <div className="border-t border-emerald-200/70 pt-3">
                    <p className="text-[11px] font-semibold text-slate-700 mb-1.5">
                      Mutasi Saldo Terbaru
                    </p>
                    <ul className="divide-y divide-emerald-100 text-xs">
                      {detailMutasi.slice(0, 3).map((m) => (
                        <li key={m.id} className="flex items-center justify-between gap-2 py-1.5">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800">
                              {m.keterangan}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {m.sumberAtauLokasi} · {formatWaktuIndo(m.tanggalWaktu)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p
                              className={`font-mono-tabular font-semibold ${
                                m.jenis === 'Top-Up' ? 'text-emerald-700' : 'text-slate-900'
                              }`}
                            >
                              {m.jenis === 'Top-Up' ? '+' : '-'}
                              {formatRupiah(m.nominal)}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono-tabular">
                              Saldo {formatRupiah(m.saldoAkhir)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Riwayat Keuangan & Perizinan */}
              <div className="grid grid-cols-1 gap-6 border-t border-slate-100 pt-5 sm:grid-cols-2">
                <div>
                  <h5 className="text-xs font-semibold text-slate-700">Riwayat Tagihan Terakhir</h5>
                  {detailFinancials.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-500">Belum ada catatan tagihan.</p>
                  ) : (
                    <ul className="mt-2 divide-y divide-slate-100 text-xs">
                      {detailFinancials.slice(0, 4).map((t) => (
                        <li key={t.id} className="flex items-center justify-between py-2">
                          <div>
                            <p className="font-medium text-slate-800">{t.jenis}</p>
                            <p className="text-slate-500">{t.bulan}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono-tabular font-semibold text-slate-900">
                              {formatRupiah(t.nominal)}
                            </p>
                            <p className={t.status === 'Lunas' ? 'text-emerald-700' : 'text-amber-700'}>
                              {t.status}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-slate-700">Perizinan & Kedisiplinan</h5>
                  {detailIzin.length === 0 && detailDisiplin.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-500">Belum ada riwayat izin atau pelanggaran.</p>
                  ) : (
                    <ul className="mt-2 divide-y divide-slate-100 text-xs">
                      {detailIzin.slice(0, 2).map((p) => (
                        <li key={p.id} className="py-2">
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-800">{p.jenisIzin}</span>
                            <span className="font-medium text-amber-700">{p.status}</span>
                          </div>
                          <p className="mt-0.5 text-slate-500 truncate">{p.alasan}</p>
                        </li>
                      ))}
                      {detailDisiplin.slice(0, 2).map((d) => (
                        <li key={d.id} className="py-2">
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-800">{d.kategori}</span>
                            <span
                              className={`font-mono-tabular font-semibold ${
                                d.poinPerubahan > 0 ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {d.poinPerubahan > 0 ? `+${d.poinPerubahan}` : d.poinPerubahan}
                            </span>
                          </div>
                          <p className="mt-0.5 text-slate-500 truncate">{d.deskripsi}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Tambah / Edit Santri Modal */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">
                {editingId ? 'Edit Data Santri' : 'Tambah Santri Baru'}
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
              {/* Foto Profil Selector */}
              <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                <SantriAvatar
                  src={formState.fotoUrl}
                  name={formState.namaLengkap || 'Santri Baru'}
                  sizeClass="w-16 h-16"
                />
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-semibold text-slate-700">Foto Profil Santri</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormState({ ...formState, fotoUrl: IMAGE_ASSETS.santriMale1 })
                      }
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
                    >
                      Foto Putra 1
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormState({ ...formState, fotoUrl: IMAGE_ASSETS.santriMale2 })
                      }
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
                    >
                      Foto Putra 2
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormState({ ...formState, fotoUrl: IMAGE_ASSETS.santriFemale1 })
                      }
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
                    >
                      Foto Putri
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
                <div>
                  <label className="block text-xs font-medium text-slate-700">NIS (Nomor Induk Santri)</label>
                  <input
                    type="text"
                    required
                    value={formState.nis}
                    onChange={(e) => setFormState({ ...formState, nis: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={formState.namaLengkap}
                    onChange={(e) => setFormState({ ...formState, namaLengkap: e.target.value })}
                    placeholder="Contoh: Muhammad Fatih Al-Ayyubi"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Jenis Kelamin</label>
                  <select
                    value={formState.jenisKelamin}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        jenisKelamin: e.target.value as JenisKelamin,
                      })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="Laki-laki">Laki-laki (Putra)</option>
                    <option value="Perempuan">Perempuan (Putri)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Status Santri</label>
                  <select
                    value={formState.status}
                    onChange={(e) =>
                      setFormState({ ...formState, status: e.target.value as StatusSantri })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Cuti">Cuti</option>
                    <option value="Alumni">Alumni</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Tempat Lahir</label>
                  <input
                    type="text"
                    required
                    value={formState.tempatLahir}
                    onChange={(e) => setFormState({ ...formState, tempatLahir: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Tanggal Lahir</label>
                  <input
                    type="date"
                    required
                    value={formState.tanggalLahir}
                    onChange={(e) => setFormState({ ...formState, tanggalLahir: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Kelas / Tingkat</label>
                  <select
                    value={formState.kelas}
                    onChange={(e) => setFormState({ ...formState, kelas: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  >
                    {KELAS_OPTIONS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Asrama</label>
                  <select
                    value={formState.asrama}
                    onChange={(e) => setFormState({ ...formState, asrama: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  >
                    {resolvedAsramaOptions.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Kode Kamar</label>
                  <input
                    type="text"
                    required
                    value={formState.kamar}
                    onChange={(e) => setFormState({ ...formState, kamar: e.target.value })}
                    placeholder="Contoh: AF-102"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Tahun Masuk</label>
                  <input
                    type="number"
                    required
                    min={2015}
                    max={2030}
                    value={formState.tahunMasuk}
                    onChange={(e) =>
                      setFormState({ ...formState, tahunMasuk: Number(e.target.value) })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Nama Wali Santri</label>
                  <input
                    type="text"
                    required
                    value={formState.namaWali}
                    onChange={(e) => setFormState({ ...formState, namaWali: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">No. Telepon Wali</label>
                  <input
                    type="text"
                    required
                    value={formState.teleponWali}
                    onChange={(e) => setFormState({ ...formState, teleponWali: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700">Alamat Lengkap</label>
                  <textarea
                    rows={2}
                    required
                    value={formState.alamat}
                    onChange={(e) => setFormState({ ...formState, alamat: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Capaian Hafalan (Juz)</label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={formState.hafalanJuz}
                    onChange={(e) =>
                      setFormState({ ...formState, hafalanJuz: Number(e.target.value) })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Hubungan Wali</label>
                  <select
                    value={formState.hubunganWali}
                    onChange={(e) => setFormState({ ...formState, hubunganWali: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="Ayah Kandung">Ayah Kandung</option>
                    <option value="Ibu Kandung">Ibu Kandung</option>
                    <option value="Paman / Wali">Paman / Wali</option>
                    <option value="Kakak Kandung">Kakak Kandung</option>
                  </select>
                </div>
              </div>

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
                  {editingId ? 'Simpan Perubahan' : 'Daftarkan Santri'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">Hapus Data Santri?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Data santri yang dihapus tidak dapat dikembalikan dari daftar aktif. Lanjutkan?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteSantri(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
