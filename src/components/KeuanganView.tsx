import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  Printer,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  AppUser,
  JenisTagihan,
  MetodePembayaran,
  PembayaranTagihan,
  ProfilPesantren,
  Santri,
} from '../types/pesantren';
import { formatRupiah, formatTanggalPendek } from '../utils/formatters';
import { SantriAvatar } from './SantriAvatar';

interface KeuanganViewProps {
  santriList: Santri[];
  tagihanList: PembayaranTagihan[];
  profil: ProfilPesantren;
  currentUser: AppUser;
  onMarkPaid: (tagihanId: string, metode: MetodePembayaran) => void;
  onCreateTagihan: (tagihan: PembayaranTagihan) => void;
}

export function KeuanganView({
  santriList,
  tagihanList,
  profil,
  currentUser,
  onMarkPaid,
  onCreateTagihan,
}: KeuanganViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriode, setFilterPeriode] = useState('2026-11');
  const [filterJenis, setFilterJenis] = useState<'Semua' | JenisTagihan>('Semua');
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'Lunas' | 'Belum Lunas'>('Semua');

  const [payingTagihan, setPayingTagihan] = useState<PembayaranTagihan | null>(null);
  const [metodeBayar, setMetodeBayar] = useState<MetodePembayaran>('Transfer Bank');

  const [receiptTagihan, setReceiptTagihan] = useState<PembayaranTagihan | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [newTagihanForm, setNewTagihanForm] = useState({
    santriId: santriList[0]?.id ?? '',
    jenis: 'SPP Bulanan' as JenisTagihan,
    bulan: 'November 2026',
    periodeKey: '2026-11',
    nominal: 450000,
    status: 'Belum Lunas' as 'Lunas' | 'Belum Lunas',
  });

  const isAdmin = currentUser.role === 'admin';

  const santriMap = useMemo(() => {
    const map = new Map<string, Santri>();
    santriList.forEach((s) => map.set(s.id, s));
    return map;
  }, [santriList]);

  const periodeOptions = useMemo(() => {
    const map = new Map<string, string>();
    tagihanList.forEach((t) => map.set(t.periodeKey, t.bulan));
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [tagihanList]);

  const filteredTagihan = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tagihanList.filter((t) => {
      const santri = santriMap.get(t.santriId);
      const matchSearch =
        !q ||
        (santri?.namaLengkap.toLowerCase().includes(q) ?? false) ||
        (santri?.nis.toLowerCase().includes(q) ?? false) ||
        (t.nomorKuitansi?.toLowerCase().includes(q) ?? false);
      const matchPeriode = filterPeriode === 'Semua' || t.periodeKey === filterPeriode;
      const matchJenis = filterJenis === 'Semua' || t.jenis === filterJenis;
      const matchStatus = filterStatus === 'Semua' || t.status === filterStatus;
      return matchSearch && matchPeriode && matchJenis && matchStatus;
    });
  }, [tagihanList, santriMap, searchQuery, filterPeriode, filterJenis, filterStatus]);

  const summary = useMemo(() => {
    const scope =
      filterPeriode === 'Semua'
        ? tagihanList
        : tagihanList.filter((t) => t.periodeKey === filterPeriode);

    const lunasItems = scope.filter((t) => t.status === 'Lunas');
    const belumItems = scope.filter((t) => t.status === 'Belum Lunas');

    const totalPemasukan = lunasItems.reduce((acc, t) => acc + t.nominal, 0);
    const totalTunggakan = belumItems.reduce((acc, t) => acc + t.nominal, 0);
    const pemasukanSpp = lunasItems
      .filter((t) => t.jenis === 'SPP Bulanan')
      .reduce((acc, t) => acc + t.nominal, 0);
    const pemasukanMakan = lunasItems
      .filter((t) => t.jenis === 'Uang Makan')
      .reduce((acc, t) => acc + t.nominal, 0);

    return {
      totalPemasukan,
      totalTunggakan,
      pemasukanSpp,
      pemasukanMakan,
      countLunas: lunasItems.length,
      countBelum: belumItems.length,
    };
  }, [tagihanList, filterPeriode]);

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingTagihan) return;
    onMarkPaid(payingTagihan.id, metodeBayar);
    setPayingTagihan(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const periodeLabel =
      newTagihanForm.periodeKey === '2026-12'
        ? 'Desember 2026'
        : newTagihanForm.periodeKey === '2026-11'
        ? 'November 2026'
        : 'Oktober 2026';

    const created: PembayaranTagihan = {
      id: `tag-${Date.now()}`,
      santriId: newTagihanForm.santriId,
      jenis: newTagihanForm.jenis,
      bulan: periodeLabel,
      periodeKey: newTagihanForm.periodeKey,
      nominal: Number(newTagihanForm.nominal),
      status: newTagihanForm.status,
      ...(newTagihanForm.status === 'Lunas'
        ? {
            tanggalBayar: new Date().toISOString().slice(0, 10),
            metodeBayar: 'Tunai Bendahara',
            nomorKuitansi: `KW/${newTagihanForm.periodeKey.replace('-', '/')}/${String(
              tagihanList.length + 1
            ).padStart(3, '0')}`,
            dicatatOleh: currentUser.nama,
          }
        : {}),
    };
    onCreateTagihan(created);
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Role Notice if Pengurus */}
      {!isAdmin && (
        <div className="no-print flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/70 px-5 py-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-700" />
            <span>
              Mode Pengurus/Ustadz: Anda dapat memantau status SPP, uang makan, dan mencetak kuitansi. Pencatatan pelunasan dan pembuatan tagihan khusus otorisasi <strong>Admin</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Summary Rekap Pemasukan */}
      <section className="no-print grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Total Pemasukan Terkumpul</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700 font-mono-tabular">
            {formatRupiah(summary.totalPemasukan)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            {summary.countLunas} transaksi berstatus Lunas
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Rekap Pemasukan SPP</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 font-mono-tabular">
            {formatRupiah(summary.pemasukanSpp)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">Tarif standar Rp 450.000 / bulan</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Rekap Uang Makan</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 font-mono-tabular">
            {formatRupiah(summary.pemasukanMakan)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">Tarif standar Rp 550.000 / bulan</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Tagihan Belum Lunas</p>
          <p className="mt-2 text-2xl font-bold text-amber-700 font-mono-tabular">
            {formatRupiah(summary.totalTunggakan)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            {summary.countBelum} tagihan menunggu pembayaran
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="no-print rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama santri, NIS, atau nomor kuitansi..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={filterPeriode}
              onChange={(e) => setFilterPeriode(e.target.value)}
              aria-label="Filter Periode"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-600 focus:outline-none"
            >
              <option value="Semua">Semua Periode</option>
              {periodeOptions.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <div className="flex items-center rounded-lg bg-slate-100 p-1">
              {(['Semua', 'SPP Bulanan', 'Uang Makan'] as const).map((jenis) => (
                <button
                  key={jenis}
                  type="button"
                  onClick={() => setFilterJenis(jenis)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    filterJenis === jenis
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {jenis === 'Semua' ? 'Semua Jenis' : jenis}
                </button>
              ))}
            </div>

            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as 'Semua' | 'Lunas' | 'Belum Lunas')
              }
              aria-label="Filter Status Pembayaran"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-600 focus:outline-none"
            >
              <option value="Semua">Semua Status</option>
              <option value="Lunas">Lunas</option>
              <option value="Belum Lunas">Belum Lunas</option>
            </select>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4" />
                Buat Tagihan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Table */}
      <div className="no-print overflow-hidden rounded-xl border border-slate-200 bg-white">
        {filteredTagihan.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sm font-semibold text-slate-800">Tidak ada data tagihan ditemukan</p>
            <p className="mt-1 text-xs text-slate-500">Sesuaikan filter periode atau status pembayaran.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="px-5 py-3.5">Santri</th>
                  <th className="px-4 py-3.5">Jenis Tagihan</th>
                  <th className="px-4 py-3.5">Periode</th>
                  <th className="px-4 py-3.5 text-right">Nominal</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Keterangan Bayar</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTagihan.map((t) => {
                  const santri = santriMap.get(t.santriId);
                  const isLunas = t.status === 'Lunas';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <SantriAvatar
                            src={santri?.fotoUrl}
                            name={santri?.namaLengkap ?? 'Santri'}
                            sizeClass="w-9 h-9"
                          />
                          <div>
                            <p className="font-semibold text-slate-900">
                              {santri?.namaLengkap ?? 'Santri'}
                            </p>
                            <p className="text-xs text-slate-500 font-mono-tabular">
                              NIS {santri?.nis ?? '-'} · {santri?.kelas ?? '-'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                        {t.jenis}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{t.bulan}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 font-mono-tabular whitespace-nowrap">
                        {formatRupiah(t.nominal)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                            isLunas ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {isLunas ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5" />
                          )}
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {isLunas ? (
                          <div>
                            <p className="font-medium text-slate-700">
                              {t.metodeBayar} · {t.tanggalBayar ? formatTanggalPendek(t.tanggalBayar) : '-'}
                            </p>
                            <p className="font-mono-tabular text-[11px] text-slate-400">
                              {t.nomorKuitansi}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400">Menunggu pelunasan</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {isLunas ? (
                          <button
                            type="button"
                            onClick={() => setReceiptTagihan(t)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            Kuitansi
                          </button>
                        ) : isAdmin ? (
                          <button
                            type="button"
                            onClick={() => setPayingTagihan(t)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800"
                          >
                            Catat Bayar
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">Khusus Admin</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Payment Modal */}
      {payingTagihan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">Konfirmasi Pelunasan</h3>
              <button
                type="button"
                onClick={() => setPayingTagihan(null)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleConfirmPayment} className="space-y-4 p-6">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                <p className="font-semibold text-slate-900">
                  {santriMap.get(payingTagihan.santriId)?.namaLengkap}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {payingTagihan.jenis} · {payingTagihan.bulan}
                </p>
                <p className="mt-2 text-lg font-bold text-emerald-700 font-mono-tabular">
                  {formatRupiah(payingTagihan.nominal)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Metode Pembayaran</label>
                <select
                  value={metodeBayar}
                  onChange={(e) => setMetodeBayar(e.target.value as MetodePembayaran)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                >
                  <option value="Transfer Bank">Transfer Bank Syariah</option>
                  <option value="Virtual Account">Virtual Account Santri</option>
                  <option value="Tunai Bendahara">Tunai di Bendahara Pondok</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingTagihan(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                >
                  Tandai Lunas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Tagihan Modal */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">Buat Tagihan Baru</h3>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 p-6">
              <div>
                <label className="block text-xs font-medium text-slate-700">Pilih Santri</label>
                <select
                  value={newTagihanForm.santriId}
                  onChange={(e) =>
                    setNewTagihanForm({ ...newTagihanForm, santriId: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                >
                  {santriList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.namaLengkap} ({s.nis})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Jenis</label>
                  <select
                    value={newTagihanForm.jenis}
                    onChange={(e) => {
                      const jenis = e.target.value as JenisTagihan;
                      setNewTagihanForm({
                        ...newTagihanForm,
                        jenis,
                        nominal: jenis === 'SPP Bulanan' ? 450000 : 550000,
                      });
                    }}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="SPP Bulanan">SPP Bulanan</option>
                    <option value="Uang Makan">Uang Makan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Periode</label>
                  <select
                    value={newTagihanForm.periodeKey}
                    onChange={(e) =>
                      setNewTagihanForm({ ...newTagihanForm, periodeKey: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="2026-11">November 2026</option>
                    <option value="2026-12">Desember 2026</option>
                    <option value="2026-10">Oktober 2026</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Nominal (Rp)</label>
                  <input
                    type="number"
                    min={50000}
                    step={50000}
                    required
                    value={newTagihanForm.nominal}
                    onChange={(e) =>
                      setNewTagihanForm({ ...newTagihanForm, nominal: Number(e.target.value) })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Status Awal</label>
                  <select
                    value={newTagihanForm.status}
                    onChange={(e) =>
                      setNewTagihanForm({
                        ...newTagihanForm,
                        status: e.target.value as 'Lunas' | 'Belum Lunas',
                      })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="Belum Lunas">Belum Lunas</option>
                    <option value="Lunas">Lunas</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                >
                  Simpan Tagihan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Kuitansi Modal */}
      {receiptTagihan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="print-only-container w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="no-print flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">Kuitansi Pembayaran Resmi</h3>
              <button
                type="button"
                onClick={() => setReceiptTagihan(null)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between border-b-2 border-emerald-800 pb-4 gap-3">
                <div className="flex items-start gap-3">
                  <img
                    src={profil.logoUrl || '/assets/aistudio/images_710b9fe7.jpg'}
                    alt={profil.namaPesantren}
                    referrerPolicy="no-referrer"
                    className="h-12 w-12 shrink-0 rounded-lg object-contain border border-slate-200 bg-white p-0.5"
                  />
                  <div>
                    <h4 className="text-base font-bold text-emerald-900">{profil.namaPesantren}</h4>
                    <p className="text-xs text-slate-500">{profil.alamat}</p>
                    <p className="text-xs text-slate-500">Telp: {profil.telepon}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-emerald-800">KUITANSI LUNAS</p>
                  <p className="font-mono-tabular text-xs text-slate-600">
                    {receiptTagihan.nomorKuitansi}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Telah diterima dari</span>
                  <span className="font-semibold text-slate-900">
                    {santriMap.get(receiptTagihan.santriId)?.namaWali} (Wali Santri)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Santri / NIS</span>
                  <span className="font-semibold text-slate-900">
                    {santriMap.get(receiptTagihan.santriId)?.namaLengkap} ·{' '}
                    <span className="font-mono-tabular">
                      {santriMap.get(receiptTagihan.santriId)?.nis}
                    </span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Untuk Pembayaran</span>
                  <span className="font-medium text-slate-900">
                    {receiptTagihan.jenis} ({receiptTagihan.bulan})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Metode & Tanggal</span>
                  <span className="text-slate-800">
                    {receiptTagihan.metodeBayar} ·{' '}
                    {receiptTagihan.tanggalBayar
                      ? formatTanggalPendek(receiptTagihan.tanggalBayar)
                      : '-'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
                <span className="text-xs font-semibold text-emerald-900">TOTAL DIBAYAR</span>
                <span className="text-xl font-bold text-emerald-800 font-mono-tabular">
                  {formatRupiah(receiptTagihan.nominal)}
                </span>
              </div>

              <div className="flex items-end justify-between pt-2 text-xs text-slate-500">
                <span>Dicatat oleh: {receiptTagihan.dicatatOleh ?? currentUser.nama}</span>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="no-print inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-800"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Cetak Kuitansi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
