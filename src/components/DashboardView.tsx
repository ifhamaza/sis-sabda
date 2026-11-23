import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  Plus,
  Users,
  X,
} from 'lucide-react';
import {
  ActiveTab,
  CatatanKedisiplinan,
  KehadiranHarian,
  PembayaranTagihan,
  PerizinanSantri,
  Santri,
  UstadzPengajar,
} from '../types/pesantren';
import { formatRupiah, formatTanggalPendek } from '../utils/formatters';
import { SantriAvatar } from './SantriAvatar';

interface DashboardViewProps {
  santriList: Santri[];
  ustadzList: UstadzPengajar[];
  tagihanList: PembayaranTagihan[];
  perizinanList: PerizinanSantri[];
  kedisiplinanList: CatatanKedisiplinan[];
  kehadiranList: KehadiranHarian[];
  onAddKehadiran: (entry: KehadiranHarian) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export function DashboardView({
  santriList,
  ustadzList,
  tagihanList,
  perizinanList,
  kedisiplinanList,
  kehadiranList,
  onAddKehadiran,
  onNavigate,
}: DashboardViewProps) {
  const [chartRange, setChartRange] = useState<'7' | '13'>('7');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isPresensiModalOpen, setIsPresensiModalOpen] = useState(false);

  const [presensiForm, setPresensiForm] = useState({
    tanggal: '2026-11-23',
    hadir: 317,
    izin: 4,
    sakit: 2,
    alpha: 1,
  });

  const stats = useMemo(() => {
    const aktifSantri = santriList.filter((s) => s.status === 'Aktif');
    const putraCount = aktifSantri.filter((s) => s.jenisKelamin === 'Laki-laki').length;
    const putriCount = aktifSantri.filter((s) => s.jenisKelamin === 'Perempuan').length;

    const sppNov = tagihanList.filter(
      (t) => t.periodeKey === '2026-11' && t.jenis === 'SPP Bulanan'
    );
    const sppNovLunas = sppNov.filter((t) => t.status === 'Lunas');
    const sppPct = sppNov.length > 0 ? Math.round((sppNovLunas.length / sppNov.length) * 100) : 0;

    const pemasukanNov = tagihanList
      .filter((t) => t.periodeKey === '2026-11' && t.status === 'Lunas')
      .reduce((acc, curr) => acc + curr.nominal, 0);

    const sedangKeluar = perizinanList.filter(
      (p) => p.status === 'Sedang Keluar' || p.status === 'Menunggu Persetujuan'
    );

    const latestDay = kehadiranList[kehadiranList.length - 1];
    const totalDay = latestDay
      ? latestDay.hadir + latestDay.izin + latestDay.sakit + latestDay.alpha
      : 0;
    const hadirPct =
      totalDay > 0 && latestDay ? ((latestDay.hadir / totalDay) * 100).toFixed(1) : '0';

    return {
      totalAktif: aktifSantri.length,
      totalTerdaftar: santriList.length,
      putraCount,
      putriCount,
      totalUstadz: ustadzList.length,
      ustadzTetap: ustadzList.filter((u) => u.status === 'Tetap').length,
      sppLunasCount: sppNovLunas.length,
      sppTotalCount: sppNov.length,
      sppPct,
      pemasukanNov,
      sedangKeluarCount: sedangKeluar.length,
      hadirPct,
      latestDay,
    };
  }, [santriList, ustadzList, tagihanList, perizinanList, kehadiranList]);

  const visibleKehadiran = useMemo(() => {
    const count = chartRange === '7' ? 7 : 13;
    return kehadiranList.slice(-count);
  }, [kehadiranList, chartRange]);

  const maxDayTotal = useMemo(() => {
    return Math.max(
      ...visibleKehadiran.map((d) => d.hadir + d.izin + d.sakit + d.alpha),
      330
    );
  }, [visibleKehadiran]);

  const santriMap = useMemo(() => {
    const map = new Map<string, Santri>();
    santriList.forEach((s) => map.set(s.id, s));
    return map;
  }, [santriList]);

  const recentTagihan = useMemo(() => {
    return tagihanList
      .filter((t) => t.periodeKey === '2026-11')
      .slice(0, 6);
  }, [tagihanList]);

  const recentPerizinan = useMemo(() => {
    return perizinanList.slice(0, 5);
  }, [perizinanList]);

  const handleSavePresensi = (e: React.FormEvent) => {
    e.preventDefault();
    const dateObj = new Date(`${presensiForm.tanggal}T00:00:00`);
    const dayNames = ['Aha', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const labelHari = Number.isNaN(dateObj.getTime())
      ? presensiForm.tanggal.slice(5)
      : `${dayNames[dateObj.getDay()]} ${dateObj.getDate()}`;

    onAddKehadiran({
      tanggal: presensiForm.tanggal,
      labelHari,
      hadir: Number(presensiForm.hadir),
      izin: Number(presensiForm.izin),
      sakit: Number(presensiForm.sakit),
      alpha: Number(presensiForm.alpha),
    });
    setIsPresensiModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary Strip (4 columns) */}
      <section aria-label="Ringkasan Statistik Utama" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Santri Aktif</span>
            <Users className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {stats.totalAktif}
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              dari {stats.totalTerdaftar} terdaftar
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 tabular-nums">
            {stats.putraCount} Putra · {stats.putriCount} Putri
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Total Ustadz & Pengajar</span>
            <CalendarCheck className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {stats.totalUstadz}
            </span>
            <span className="text-xs text-slate-500">pengajar aktif</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 tabular-nums">
            {stats.ustadzTetap} Tetap · {stats.totalUstadz - stats.ustadzTetap} Pengabdian
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">SPP Bulan November 2026</span>
            <CreditCard className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {stats.sppPct}%
            </span>
            <span className="text-xs font-medium text-emerald-700 tabular-nums">
              {stats.sppLunasCount}/{stats.sppTotalCount} lunas
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 tabular-nums">
            Masuk bulan ini: <strong className="font-semibold text-slate-800">{formatRupiah(stats.pemasukanNov)}</strong>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Kehadiran Harian</span>
            <Clock className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {stats.hadirPct}%
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              {stats.latestDay ? `${stats.latestDay.hadir} hadir` : '-'}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 tabular-nums">
            {stats.sedangKeluarCount} pengajuan / izin aktif di luar pondok
          </p>
        </div>
      </section>

      {/* Main Chart & Discipline Highlights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Attendance Chart */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Grafik Kehadiran Santri
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Rekapitulasi harian KBM & pengajian (asrama putra & putri)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setChartRange('7')}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    chartRange === '7'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  7 Hari
                </button>
                <button
                  type="button"
                  onClick={() => setChartRange('13')}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    chartRange === '13'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  13 Hari
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsPresensiModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-800 whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Input Presensi
              </button>
            </div>
          </div>

          {/* Chart Legend */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600" />
                Hadir
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-amber-400" />
                Izin
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-sky-500" />
                Sakit
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-rose-500" />
                Alpha
              </span>
            </div>

            {hoveredIdx !== null && visibleKehadiran[hoveredIdx] ? (
              <div className="text-xs text-slate-700 font-mono-tabular">
                {visibleKehadiran[hoveredIdx].labelHari}: Hadir{' '}
                <strong className="text-emerald-700">{visibleKehadiran[hoveredIdx].hadir}</strong> · Izin{' '}
                <strong>{visibleKehadiran[hoveredIdx].izin}</strong> · Sakit{' '}
                <strong>{visibleKehadiran[hoveredIdx].sakit}</strong> · Alpha{' '}
                <strong className="text-rose-600">{visibleKehadiran[hoveredIdx].alpha}</strong>
              </div>
            ) : (
              <div className="text-xs text-slate-400">
                Arahkan kursor pada batang grafik untuk detail harian
              </div>
            )}
          </div>

          {/* Responsive Bar Chart */}
          <div className="mt-5 h-64 w-full">
            <div className="flex h-full items-end gap-2 sm:gap-3 border-b border-slate-200 pb-2 pt-4">
              {visibleKehadiran.map((item, idx) => {
                const total = item.hadir + item.izin + item.sakit + item.alpha;
                const heightPct = Math.max(8, Math.round((total / maxDayTotal) * 100));
                const hadirRatio = total > 0 ? (item.hadir / total) * 100 : 0;
                const izinRatio = total > 0 ? (item.izin / total) * 100 : 0;
                const sakitRatio = total > 0 ? (item.sakit / total) * 100 : 0;
                const alphaRatio = total > 0 ? (item.alpha / total) * 100 : 0;
                const isHovered = hoveredIdx === idx;

                return (
                  <div
                    key={item.tanggal}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="group flex h-full flex-1 flex-col items-center justify-end gap-2 cursor-pointer"
                  >
                    <span
                      className={`text-[11px] font-mono-tabular transition-opacity ${
                        isHovered ? 'text-slate-900 font-semibold opacity-100' : 'text-slate-400 opacity-80'
                      }`}
                    >
                      {item.hadir}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`flex w-full max-w-[38px] flex-col-reverse overflow-hidden rounded-t-md transition-transform duration-150 ${
                        isHovered ? 'ring-2 ring-emerald-700/40 -translate-y-0.5' : ''
                      }`}
                    >
                      <div
                        style={{ height: `${hadirRatio}%` }}
                        className="w-full bg-emerald-600"
                        title={`Hadir: ${item.hadir}`}
                      />
                      <div
                        style={{ height: `${izinRatio}%` }}
                        className="w-full bg-amber-400"
                        title={`Izin: ${item.izin}`}
                      />
                      <div
                        style={{ height: `${sakitRatio}%` }}
                        className="w-full bg-sky-500"
                        title={`Sakit: ${item.sakit}`}
                      />
                      <div
                        style={{ height: `${alphaRatio}%` }}
                        className="w-full bg-rose-500"
                        title={`Alpha: ${item.alpha}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex gap-2 sm:gap-3">
              {visibleKehadiran.map((item, idx) => (
                <div
                  key={`label-${item.tanggal}`}
                  className={`flex-1 truncate text-center text-[11px] font-medium ${
                    hoveredIdx === idx ? 'text-emerald-700 font-semibold' : 'text-slate-500'
                  }`}
                >
                  {item.labelHari}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Kedisiplinan & Prestasi Terkini */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Catatan Kedisiplinan
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Pelanggaran & prestasi terbaru
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('perizinan')}
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 whitespace-nowrap shrink-0"
              >
                Kelola
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {kedisiplinanList.slice(0, 4).map((cat) => {
                const santri = santriMap.get(cat.santriId);
                const isPositive = cat.poinPerubahan > 0;
                return (
                  <div key={cat.id} className="py-3 first:pt-2 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {santri?.namaLengkap ?? 'Santri'}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {cat.kategori} · {formatTanggalPendek(cat.tanggal)}
                        </p>
                      </div>
                      <span
                        className={`font-mono-tabular text-xs font-semibold whitespace-nowrap shrink-0 ${
                          isPositive ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isPositive ? `+${cat.poinPerubahan}` : cat.poinPerubahan} poin
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-600">{cat.deskripsi}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('perizinan')}
            className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            Lihat Semua Catatan Kedisiplinan
          </button>
        </section>
      </div>

      {/* Bottom 2-Column Operational Summaries */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* SPP & Uang Makan November */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Status SPP & Uang Makan (November 2026)
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Ringkasan tagihan santri periode berjalan
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('keuangan')}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 whitespace-nowrap shrink-0"
            >
              Keuangan
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-2 divide-y divide-slate-100">
            {recentTagihan.map((tag) => {
              const santri = santriMap.get(tag.santriId);
              const isLunas = tag.status === 'Lunas';
              return (
                <div key={tag.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <SantriAvatar
                      src={santri?.fotoUrl}
                      name={santri?.namaLengkap ?? 'Santri'}
                      sizeClass="w-9 h-9"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {santri?.namaLengkap ?? 'Santri'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {tag.jenis} · {santri?.kelas ?? '-'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-900 font-mono-tabular">
                      {formatRupiah(tag.nominal)}
                    </p>
                    <p
                      className={`mt-0.5 inline-flex items-center gap-1 text-xs font-medium ${
                        isLunas ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {isLunas ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5" />
                      )}
                      {tag.status}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Perizinan Keluar-Masuk */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Perizinan Keluar-Masuk Pondok
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Monitoring santri pulang, sakit, dan delegasi kegiatan
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('perizinan')}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 whitespace-nowrap shrink-0"
            >
              Semua Izin
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-2 divide-y divide-slate-100">
            {recentPerizinan.map((izin) => {
              const santri = santriMap.get(izin.santriId);
              const statusColor =
                izin.status === 'Sudah Kembali'
                  ? 'text-emerald-700'
                  : izin.status === 'Terlambat'
                  ? 'text-rose-700'
                  : 'text-amber-700';

              return (
                <div key={izin.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <SantriAvatar
                      src={santri?.fotoUrl}
                      name={santri?.namaLengkap ?? 'Santri'}
                      sizeClass="w-9 h-9"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {santri?.namaLengkap ?? 'Santri'}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {izin.jenisIzin} · Penjemput: {izin.penjemput}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-semibold ${statusColor}`}>
                      {izin.status}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 font-mono-tabular">
                      Kembali: {izin.rencanaKembali.slice(0, 10)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Input Presensi Modal */}
      {isPresensiModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">
                Catat Rekap Presensi Harian
              </h3>
              <button
                type="button"
                onClick={() => setIsPresensiModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSavePresensi} className="space-y-4 p-6">
              <div>
                <label className="block text-xs font-medium text-slate-700">Tanggal</label>
                <input
                  type="date"
                  required
                  value={presensiForm.tanggal}
                  onChange={(e) => setPresensiForm({ ...presensiForm, tanggal: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Hadir</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={presensiForm.hadir}
                    onChange={(e) =>
                      setPresensiForm({ ...presensiForm, hadir: Number(e.target.value) })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Izin</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={presensiForm.izin}
                    onChange={(e) =>
                      setPresensiForm({ ...presensiForm, izin: Number(e.target.value) })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Sakit</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={presensiForm.sakit}
                    onChange={(e) =>
                      setPresensiForm({ ...presensiForm, sakit: Number(e.target.value) })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Alpha</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={presensiForm.alpha}
                    onChange={(e) =>
                      setPresensiForm({ ...presensiForm, alpha: Number(e.target.value) })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPresensiModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                >
                  Simpan Presensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
