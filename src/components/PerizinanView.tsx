import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  LogIn,
  LogOut,
  Plus,
  Search,
  X,
} from 'lucide-react';
import {
  AppUser,
  CatatanKedisiplinan,
  JenisIzin,
  KategoriKedisiplinan,
  PerizinanSantri,
  Santri,
  StatusIzin,
} from '../types/pesantren';
import { formatTanggalPendek, formatWaktuIndo } from '../utils/formatters';
import { SantriAvatar } from './SantriAvatar';

interface PerizinanViewProps {
  santriList: Santri[];
  perizinanList: PerizinanSantri[];
  kedisiplinanList: CatatanKedisiplinan[];
  currentUser: AppUser;
  onAddPerizinan: (izin: PerizinanSantri) => void;
  onUpdatePerizinanStatus: (id: string, newStatus: StatusIzin) => void;
  onAddKedisiplinan: (catatan: CatatanKedisiplinan) => void;
}

export function PerizinanView({
  santriList,
  perizinanList,
  kedisiplinanList,
  currentUser,
  onAddPerizinan,
  onUpdatePerizinanStatus,
  onAddKedisiplinan,
}: PerizinanViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'izin' | 'disiplin'>('izin');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIzinStatus, setFilterIzinStatus] = useState<'Semua' | StatusIzin>('Semua');

  const [izinModalOpen, setIzinModalOpen] = useState(false);
  const [disiplinModalOpen, setDisiplinModalOpen] = useState(false);

  const [izinForm, setIzinForm] = useState({
    santriId: santriList[0]?.id ?? '',
    jenisIzin: 'Izin Pulang' as JenisIzin,
    alasan: '',
    penjemput: '',
    tanggalKeluar: '2026-11-22T18:00',
    rencanaKembali: '2026-11-24T17:00',
  });

  const [disiplinForm, setDisiplinForm] = useState({
    santriId: santriList[0]?.id ?? '',
    tanggal: '2026-11-22',
    kategori: 'Pelanggaran Ringan' as KategoriKedisiplinan,
    deskripsi: '',
    poinPerubahan: -5,
    tindakLanjut: '',
  });

  const santriMap = useMemo(() => {
    const map = new Map<string, Santri>();
    santriList.forEach((s) => map.set(s.id, s));
    return map;
  }, [santriList]);

  const filteredIzin = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return perizinanList.filter((p) => {
      const s = santriMap.get(p.santriId);
      const matchSearch =
        !q ||
        (s?.namaLengkap.toLowerCase().includes(q) ?? false) ||
        p.alasan.toLowerCase().includes(q) ||
        p.penjemput.toLowerCase().includes(q);
      const matchStatus = filterIzinStatus === 'Semua' || p.status === filterIzinStatus;
      return matchSearch && matchStatus;
    });
  }, [perizinanList, santriMap, searchQuery, filterIzinStatus]);

  const filteredDisiplin = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return kedisiplinanList.filter((d) => {
      const s = santriMap.get(d.santriId);
      return (
        !q ||
        (s?.namaLengkap.toLowerCase().includes(q) ?? false) ||
        d.deskripsi.toLowerCase().includes(q) ||
        d.kategori.toLowerCase().includes(q)
      );
    });
  }, [kedisiplinanList, santriMap, searchQuery]);

  const handleSaveIzin = (e: React.FormEvent) => {
    e.preventDefault();
    const record: PerizinanSantri = {
      id: `izin-${Date.now()}`,
      santriId: izinForm.santriId,
      jenisIzin: izinForm.jenisIzin,
      alasan: izinForm.alasan,
      penjemput: izinForm.penjemput,
      tanggalKeluar: izinForm.tanggalKeluar,
      rencanaKembali: izinForm.rencanaKembali,
      status: 'Sedang Keluar',
      disetujuiOleh: currentUser.nama,
    };
    onAddPerizinan(record);
    setIzinForm({
      ...izinForm,
      alasan: '',
      penjemput: '',
    });
    setIzinModalOpen(false);
  };

  const handleSaveDisiplin = (e: React.FormEvent) => {
    e.preventDefault();
    const record: CatatanKedisiplinan = {
      id: `dis-${Date.now()}`,
      santriId: disiplinForm.santriId,
      tanggal: disiplinForm.tanggal,
      kategori: disiplinForm.kategori,
      deskripsi: disiplinForm.deskripsi,
      poinPerubahan: Number(disiplinForm.poinPerubahan),
      tindakLanjut: disiplinForm.tindakLanjut,
      dicatatOleh: currentUser.nama,
    };
    onAddKedisiplinan(record);
    setDisiplinForm({
      ...disiplinForm,
      deskripsi: '',
      tindakLanjut: '',
    });
    setDisiplinModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Segmented Sub-Tab & Action Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center rounded-lg bg-slate-100 p-1 w-fit">
            <button
              type="button"
              onClick={() => setActiveSubTab('izin')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeSubTab === 'izin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogOut className="h-3.5 w-3.5" />
              Perizinan Keluar-Masuk ({perizinanList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('disiplin')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeSubTab === 'disiplin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Poin Kedisiplinan & Pelanggaran ({kedisiplinanList.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari santri atau keterangan..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </div>

            {activeSubTab === 'izin' ? (
              <>
                <select
                  value={filterIzinStatus}
                  onChange={(e) => setFilterIzinStatus(e.target.value as 'Semua' | StatusIzin)}
                  aria-label="Filter Status Izin"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-600 focus:outline-none"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
                  <option value="Sedang Keluar">Sedang Keluar</option>
                  <option value="Sudah Kembali">Sudah Kembali</option>
                  <option value="Terlambat">Terlambat</option>
                </select>
                <button
                  type="button"
                  onClick={() => setIzinModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 whitespace-nowrap shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  Catat Izin Keluar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setDisiplinModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4" />
                Catat Pelanggaran / Prestasi
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-tab Content */}
      {activeSubTab === 'izin' ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="px-5 py-3.5">Santri</th>
                  <th className="px-4 py-3.5">Jenis & Alasan Izin</th>
                  <th className="px-4 py-3.5">Penjemput</th>
                  <th className="px-4 py-3.5">Waktu Keluar / Rencana Kembali</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIzin.map((p) => {
                  const santri = santriMap.get(p.santriId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3.5">
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
                            <p className="text-xs text-slate-500">
                              {santri?.kelas} · {santri?.kamar}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <p className="font-medium text-slate-800">{p.jenisIzin}</p>
                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{p.alasan}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-700">
                        <p className="font-medium">{p.penjemput}</p>
                        {p.disetujuiOleh && (
                          <p className="mt-0.5 text-slate-400">Disetujui: {p.disetujuiOleh}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono-tabular text-slate-600 whitespace-nowrap">
                        <p>Keluar: {formatWaktuIndo(p.tanggalKeluar)}</p>
                        <p className="mt-0.5 text-slate-500">
                          Kembali: {formatWaktuIndo(p.rencanaKembali)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                            p.status === 'Sudah Kembali'
                              ? 'text-emerald-700'
                              : p.status === 'Terlambat'
                              ? 'text-rose-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {p.status === 'Sudah Kembali' ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Clock className="h-3.5 w-3.5" />
                          )}
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {p.status === 'Menunggu Persetujuan' && (
                          <button
                            type="button"
                            onClick={() => onUpdatePerizinanStatus(p.id, 'Sedang Keluar')}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800"
                          >
                            Setujui Keluar
                          </button>
                        )}
                        {p.status === 'Sedang Keluar' && (
                          <button
                            type="button"
                            onClick={() => onUpdatePerizinanStatus(p.id, 'Sudah Kembali')}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-700 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                          >
                            <LogIn className="h-3.5 w-3.5" />
                            Konfirmasi Kembali
                          </button>
                        )}
                        {(p.status === 'Sudah Kembali' || p.status === 'Terlambat') && (
                          <span className="text-xs text-slate-400">
                            Tercatat {p.waktuKembaliAktual ? formatWaktuIndo(p.waktuKembaliAktual) : 'Selesai'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="px-5 py-3.5">Santri</th>
                  <th className="px-4 py-3.5">Tanggal</th>
                  <th className="px-4 py-3.5">Kategori & Uraian</th>
                  <th className="px-4 py-3.5">Tindak Lanjut / Pembinaan</th>
                  <th className="px-4 py-3.5 text-right">Poin</th>
                  <th className="px-5 py-3.5 text-right">Total Poin Santri</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDisiplin.map((d) => {
                  const santri = santriMap.get(d.santriId);
                  const isMerit = d.poinPerubahan > 0;
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3.5">
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
                            <p className="text-xs text-slate-500">
                              {santri?.kelas} · {santri?.kamar}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap font-mono-tabular">
                        {formatTanggalPendek(d.tanggal)}
                      </td>
                      <td className="px-4 py-3.5 max-w-sm">
                        <p
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            isMerit ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isMerit ? (
                            <Award className="h-3.5 w-3.5" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          )}
                          {d.kategori}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-700">{d.deskripsi}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          Dicatat oleh {d.dicatatOleh}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 max-w-xs">
                        {d.tindakLanjut}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono-tabular font-semibold whitespace-nowrap">
                        <span className={isMerit ? 'text-emerald-700' : 'text-rose-700'}>
                          {isMerit ? `+${d.poinPerubahan}` : d.poinPerubahan}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono-tabular font-bold text-slate-900 whitespace-nowrap">
                        {santri?.poinKedisiplinan ?? 100}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Izin Modal */}
      {izinModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">Catat Perizinan Keluar Pondok</h3>
              <button
                type="button"
                onClick={() => setIzinModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveIzin} className="space-y-4 p-6">
              <div>
                <label className="block text-xs font-medium text-slate-700">Santri</label>
                <select
                  value={izinForm.santriId}
                  onChange={(e) => setIzinForm({ ...izinForm, santriId: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                >
                  {santriList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.namaLengkap} ({s.kelas} · {s.kamar})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Jenis Izin</label>
                  <select
                    value={izinForm.jenisIzin}
                    onChange={(e) =>
                      setIzinForm({ ...izinForm, jenisIzin: e.target.value as JenisIzin })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="Izin Pulang">Izin Pulang</option>
                    <option value="Izin Sakit">Izin Sakit / Berobat</option>
                    <option value="Izin Kegiatan">Izin Kegiatan / Lomba</option>
                    <option value="Izin Keperluan Keluarga">Keperluan Keluarga</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Penjemput / Pendamping</label>
                  <input
                    type="text"
                    required
                    value={izinForm.penjemput}
                    onChange={(e) => setIzinForm({ ...izinForm, penjemput: e.target.value })}
                    placeholder="Nama wali / ustadz pendamping"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Waktu Keluar</label>
                  <input
                    type="datetime-local"
                    required
                    value={izinForm.tanggalKeluar}
                    onChange={(e) => setIzinForm({ ...izinForm, tanggalKeluar: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Rencana Kembali</label>
                  <input
                    type="datetime-local"
                    required
                    value={izinForm.rencanaKembali}
                    onChange={(e) => setIzinForm({ ...izinForm, rencanaKembali: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Alasan / Keperluan</label>
                <textarea
                  rows={2}
                  required
                  value={izinForm.alasan}
                  onChange={(e) => setIzinForm({ ...izinForm, alasan: e.target.value })}
                  placeholder="Jelaskan keperluan izin keluar..."
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIzinModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                >
                  Terbitkan Izin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Kedisiplinan Modal */}
      {disiplinModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">
                Catat Poin Kedisiplinan Santri
              </h3>
              <button
                type="button"
                onClick={() => setDisiplinModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveDisiplin} className="space-y-4 p-6">
              <div>
                <label className="block text-xs font-medium text-slate-700">Santri</label>
                <select
                  value={disiplinForm.santriId}
                  onChange={(e) => setDisiplinForm({ ...disiplinForm, santriId: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                >
                  {santriList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.namaLengkap} (Poin saat ini: {s.poinKedisiplinan})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700">Kategori</label>
                  <select
                    value={disiplinForm.kategori}
                    onChange={(e) => {
                      const kategori = e.target.value as KategoriKedisiplinan;
                      const defaultPoin =
                        kategori === 'Prestasi & Kebajikan'
                          ? 15
                          : kategori === 'Pelanggaran Ringan'
                          ? -5
                          : kategori === 'Pelanggaran Sedang'
                          ? -15
                          : -30;
                      setDisiplinForm({
                        ...disiplinForm,
                        kategori,
                        poinPerubahan: defaultPoin,
                      });
                    }}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="Pelanggaran Ringan">Pelanggaran Ringan (-5)</option>
                    <option value="Pelanggaran Sedang">Pelanggaran Sedang (-15)</option>
                    <option value="Pelanggaran Berat">Pelanggaran Berat (-30)</option>
                    <option value="Prestasi & Kebajikan">Prestasi & Kebajikan (+15)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Perubahan Poin</label>
                  <input
                    type="number"
                    required
                    value={disiplinForm.poinPerubahan}
                    onChange={(e) =>
                      setDisiplinForm({ ...disiplinForm, poinPerubahan: Number(e.target.value) })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Tanggal</label>
                <input
                  type="date"
                  required
                  value={disiplinForm.tanggal}
                  onChange={(e) => setDisiplinForm({ ...disiplinForm, tanggal: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Deskripsi Kejadian</label>
                <textarea
                  rows={2}
                  required
                  value={disiplinForm.deskripsi}
                  onChange={(e) => setDisiplinForm({ ...disiplinForm, deskripsi: e.target.value })}
                  placeholder="Contoh: Terlambat shalat berjamaah atau juara lomba pidato..."
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Tindak Lanjut / Pembinaan</label>
                <input
                  type="text"
                  required
                  value={disiplinForm.tindakLanjut}
                  onChange={(e) => setDisiplinForm({ ...disiplinForm, tindakLanjut: e.target.value })}
                  placeholder="Contoh: Teguran lisan & setoran surat pendek"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisiplinModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
