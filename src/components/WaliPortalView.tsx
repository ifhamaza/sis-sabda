import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Award,
  CheckCircle2,
  Clock,
  CreditCard,
  History,
  IdCard,
  PiggyBank,
  Printer,
  ShieldAlert,
  Target,
  User,
  Wallet,
  X,
} from 'lucide-react';
import {
  AppUser,
  CatatanKedisiplinan,
  MutasiSaldo,
  MutasiTabungan,
  PembayaranTagihan,
  PerizinanSantri,
  ProfilPesantren,
  Santri,
} from '../types/pesantren';
import {
  buildSantriQrPayload,
  formatRupiah,
  formatTanggalIndo,
  formatTanggalPendek,
  formatWaktuIndo,
  getLocalDateKey,
} from '../utils/formatters';
import { QrCodeCanvas } from './QrCodeCanvas';
import { SantriAvatar } from './SantriAvatar';

export type WaliSection = 'dashboard' | 'kartu' | 'tabungan' | 'keuangan' | 'perizinan';

interface WaliPortalViewProps {
  currentUser: AppUser;
  santriList: Santri[];
  tagihanList: PembayaranTagihan[];
  perizinanList: PerizinanSantri[];
  kedisiplinanList: CatatanKedisiplinan[];
  mutasiSaldoList: MutasiSaldo[];
  mutasiTabunganList: MutasiTabungan[];
  profil: ProfilPesantren;
  activeSection: WaliSection;
  onChangeSection: (section: WaliSection) => void;
}

export function WaliPortalView({
  currentUser,
  santriList,
  tagihanList,
  perizinanList,
  kedisiplinanList,
  mutasiSaldoList,
  mutasiTabunganList,
  profil,
  activeSection,
  onChangeSection,
}: WaliPortalViewProps) {
  const [cardSide, setCardSide] = useState<'depan' | 'belakang'>('depan');
  const [mutasiFilter, setMutasiFilter] = useState<'Semua' | 'Top-Up' | 'Pembayaran'>('Semua');
  const [tabunganFilter, setTabunganFilter] = useState<
    'Semua' | 'Setor' | 'Tarik' | 'Pindah ke E-Money'
  >('Semua');
  const [receiptTagihan, setReceiptTagihan] = useState<PembayaranTagihan | null>(null);

  const anakAsuh = useMemo(() => {
    if (currentUser.santriId) {
      return santriList.find((s) => s.id === currentUser.santriId) ?? null;
    }
    return null;
  }, [santriList, currentUser.santriId]);

  const childTagihan = useMemo(() => {
    if (!anakAsuh) return [];
    return tagihanList.filter((t) => t.santriId === anakAsuh.id);
  }, [tagihanList, anakAsuh]);

  const childMutasi = useMemo(() => {
    if (!anakAsuh) return [];
    return mutasiSaldoList.filter((m) => m.santriId === anakAsuh.id);
  }, [mutasiSaldoList, anakAsuh]);

  const filteredMutasi = useMemo(() => {
    if (mutasiFilter === 'Semua') return childMutasi;
    return childMutasi.filter((m) => m.jenis === mutasiFilter);
  }, [childMutasi, mutasiFilter]);

  const childTabunganMutasi = useMemo(() => {
    if (!anakAsuh) return [];
    return mutasiTabunganList.filter((m) => m.santriId === anakAsuh.id);
  }, [mutasiTabunganList, anakAsuh]);

  const filteredTabunganMutasi = useMemo(() => {
    if (tabunganFilter === 'Semua') return childTabunganMutasi;
    return childTabunganMutasi.filter((m) => m.jenis === tabunganFilter);
  }, [childTabunganMutasi, tabunganFilter]);

  const childPerizinan = useMemo(() => {
    if (!anakAsuh) return [];
    return perizinanList.filter((p) => p.santriId === anakAsuh.id);
  }, [perizinanList, anakAsuh]);

  const childDisiplin = useMemo(() => {
    if (!anakAsuh) return [];
    return kedisiplinanList.filter((d) => d.santriId === anakAsuh.id);
  }, [kedisiplinanList, anakAsuh]);

  const spentToday = useMemo(() => {
    const todayKey = getLocalDateKey();
    return childMutasi
      .filter((m) => m.jenis === 'Pembayaran' && m.tanggalWaktu.startsWith(todayKey))
      .reduce((acc, m) => acc + m.nominal, 0);
  }, [childMutasi]);

  if (!anakAsuh) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-amber-700" />
        <h2 className="mt-3 text-base font-semibold text-slate-900">
          Data Santri Belum Terhubung
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Akun wali santri Anda belum dihubungkan dengan data santri anak asuh. Hubungi Admin Tata Usaha pondok.
        </p>
      </div>
    );
  }

  const belumLunasCount = childTagihan.filter((t) => t.status === 'Belum Lunas').length;
  const totalTunggakan = childTagihan
    .filter((t) => t.status === 'Belum Lunas')
    .reduce((acc, t) => acc + t.nominal, 0);

  const targetPct =
    anakAsuh.targetTabunganNominal > 0
      ? Math.min(100, Math.round((anakAsuh.saldoTabungan / anakAsuh.targetTabunganNominal) * 100))
      : 0;
  const kekuranganTarget = Math.max(0, anakAsuh.targetTabunganNominal - anakAsuh.saldoTabungan);

  const qrPayload = buildSantriQrPayload(
    anakAsuh.nis,
    anakAsuh.namaLengkap,
    anakAsuh.asrama,
    anakAsuh.kamar
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Anak Asuh + Section Switcher */}
      <div className="no-print rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <SantriAvatar
              src={anakAsuh.fotoUrl}
              name={anakAsuh.namaLengkap}
              sizeClass="w-14 h-14"
              textClass="text-lg"
            />
            <div>
              <p className="text-xs font-medium text-emerald-700">
                Portal Wali Santri · {currentUser.nama}
              </p>
              <h2 className="text-lg font-bold text-slate-900">{anakAsuh.namaLengkap}</h2>
              <p className="text-xs text-slate-500 font-mono-tabular">
                NIS {anakAsuh.nis} · {anakAsuh.kelas} · {anakAsuh.asrama} · Kamar {anakAsuh.kamar}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center rounded-lg bg-slate-100 p-1 w-fit">
            {(
              [
                { id: 'dashboard', label: 'Profil Anak' },
                { id: 'kartu', label: 'Kartu & E-Money' },
                { id: 'tabungan', label: 'Tabungan Anak' },
                { id: 'keuangan', label: 'Tagihan SPP' },
                { id: 'perizinan', label: 'Izin & Poin' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeSection(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  activeSection === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 1: PROFIL ANAK ASUH */}
      {activeSection === 'dashboard' && (
        <div className="space-y-6">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Saldo E-Money Kartu</span>
                <Wallet className="h-4 w-4 text-emerald-700" />
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-700 font-mono-tabular">
                {formatRupiah(anakAsuh.saldoEmoney)}
              </p>
              <p className="mt-1 text-xs text-slate-500 font-mono-tabular">
                Limit {formatRupiah(anakAsuh.limitHarian)}/hari · Terpakai {formatRupiah(spentToday)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Saldo Tabungan Santri</span>
                <PiggyBank className="h-4 w-4 text-emerald-700" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900 font-mono-tabular">
                {formatRupiah(anakAsuh.saldoTabungan)}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate">{anakAsuh.targetTabunganNama}</span>
                <span className="font-semibold text-emerald-700 font-mono-tabular shrink-0">
                  {targetPct}%
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  style={{ width: `${targetPct}%` }}
                  className="h-full rounded-full bg-emerald-600 transition-all"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Status Tagihan SPP</span>
                <CreditCard className="h-4 w-4 text-emerald-700" />
              </div>
              <p
                className={`mt-2 text-2xl font-bold font-mono-tabular ${
                  belumLunasCount === 0 ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {belumLunasCount === 0 ? 'Semua Lunas' : `${belumLunasCount} Tagihan`}
              </p>
              <p className="mt-1 text-xs text-slate-500 font-mono-tabular">
                {belumLunasCount === 0
                  ? 'Tidak ada tunggakan aktif'
                  : `Menunggu pelunasan ${formatRupiah(totalTunggakan)}`}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Tahfidz & Kedisiplinan</span>
                <Award className="h-4 w-4 text-emerald-700" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900 font-mono-tabular">
                {anakAsuh.hafalanJuz} Juz
              </p>
              <p className="mt-1 text-xs text-slate-500 font-mono-tabular">
                Poin Kedisiplinan: {anakAsuh.poinKedisiplinan} ({anakAsuh.status})
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
              <h3 className="border-b border-slate-100 pb-3 text-base font-semibold text-slate-900">
                Biodata Lengkap Santri
              </h3>
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Nama Lengkap</dt>
                  <dd className="mt-0.5 font-semibold text-slate-900">{anakAsuh.namaLengkap}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Nomor Induk Santri (NIS)</dt>
                  <dd className="mt-0.5 font-semibold text-emerald-800 font-mono-tabular">
                    {anakAsuh.nis}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Tempat, Tanggal Lahir</dt>
                  <dd className="mt-0.5 text-slate-800">
                    {anakAsuh.tempatLahir}, {formatTanggalIndo(anakAsuh.tanggalLahir)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Kelas & Angkatan</dt>
                  <dd className="mt-0.5 text-slate-800">
                    {anakAsuh.kelas} · Angkatan {anakAsuh.tahunMasuk}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Asrama & Kamar</dt>
                  <dd className="mt-0.5 text-slate-800">
                    {anakAsuh.asrama} · Kamar {anakAsuh.kamar}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Wali Terdaftar</dt>
                  <dd className="mt-0.5 text-slate-800">
                    {anakAsuh.namaWali} ({anakAsuh.hubunganWali})
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-slate-500">Alamat Rumah</dt>
                  <dd className="mt-0.5 text-slate-800">{anakAsuh.alamat}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-semibold text-slate-900">
                    Ringkasan Tabungan & E-Money
                  </h3>
                  <button
                    type="button"
                    onClick={() => onChangeSection('tabungan')}
                    className="text-xs font-medium text-emerald-700 hover:underline"
                  >
                    Buku Tabungan →
                  </button>
                </div>

                {/* Progres Target Tabungan Mini */}
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                      <Target className="h-3.5 w-3.5 text-emerald-700" />
                      Target: {anakAsuh.targetTabunganNama}
                    </span>
                    <span className="text-xs font-bold text-emerald-800 font-mono-tabular">
                      {targetPct}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-100">
                    <div
                      style={{ width: `${targetPct}%` }}
                      className="h-full rounded-full bg-emerald-700 transition-all"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono-tabular">
                    <span>Terkumpul {formatRupiah(anakAsuh.saldoTabungan)}</span>
                    <span>Target {formatRupiah(anakAsuh.targetTabunganNominal)}</span>
                  </div>
                </div>

                {childMutasi.length === 0 ? (
                  <p className="mt-4 text-xs text-slate-500">Belum ada transaksi E-Money.</p>
                ) : (
                  <ul className="mt-3 divide-y divide-slate-100 text-xs">
                    {childMutasi.slice(0, 3).map((m) => (
                      <li key={m.id} className="flex items-center justify-between gap-2 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">{m.keterangan}</p>
                          <p className="text-[11px] text-slate-500">
                            {m.sumberAtauLokasi} · {formatWaktuIndo(m.tanggalWaktu)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p
                            className={`font-mono-tabular font-semibold ${
                              m.jenis === 'Top-Up' ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {m.jenis === 'Top-Up' ? '+' : '-'}
                            {formatRupiah(m.nominal)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="button"
                onClick={() => onChangeSection('kartu')}
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <IdCard className="h-3.5 w-3.5 text-emerald-700" />
                Lihat Kartu Santri Digital
              </button>
            </section>
          </div>
        </div>
      )}

      {/* SECTION 2: KARTU SANTRI DIGITAL & RIWAYAT MUTASI E-MONEY */}
      {activeSection === 'kartu' && (
        <div className="space-y-6">
          <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5">
            <div className="flex items-center rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setCardSide('depan')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  cardSide === 'depan' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Sisi Depan
              </button>
              <button
                type="button"
                onClick={() => setCardSide('belakang')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  cardSide === 'belakang' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Sisi Belakang
              </button>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-800 whitespace-nowrap"
            >
              <Printer className="h-3.5 w-3.5" />
              Cetak / Simpan PDF Kartu
            </button>
          </div>

          <div className="print-only-container rounded-xl border border-slate-200 bg-slate-50/70 p-6 flex flex-col items-center justify-center gap-6">
            <div
              className={`print-card-exact w-full max-w-[540px] overflow-hidden rounded-2xl border border-emerald-900/15 bg-white shadow-lg ${
                cardSide === 'belakang' ? 'hidden print:block' : 'block'
              }`}
            >
              <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-700 px-6 py-4 text-white">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-wider text-emerald-200">
                      KARTU TANDA SANTRI & E-MONEY PONDOK
                    </p>
                    <h3 className="mt-0.5 text-base font-bold tracking-tight">
                      {profil.namaPesantren}
                    </h3>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white p-1">
                    <img
                      src={profil.logoUrl || '/assets/aistudio/images_710b9fe7.jpg'}
                      alt={profil.namaPesantren}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="h-32 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-emerald-700/20 bg-slate-100">
                    <SantriAvatar
                      src={anakAsuh.fotoUrl}
                      name={anakAsuh.namaLengkap}
                      sizeClass="h-full w-full"
                      roundedClass="rounded-none"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400">NAMA LENGKAP</p>
                      <p className="text-lg font-bold text-slate-900">{anakAsuh.namaLengkap}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400">NIS</p>
                        <p className="text-sm font-bold text-emerald-800 font-mono-tabular">
                          {anakAsuh.nis}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400">KELAS</p>
                        <p className="text-sm font-semibold text-slate-800">{anakAsuh.kelas}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400">ASRAMA & KAMAR</p>
                      <p className="text-xs text-slate-700">
                        {anakAsuh.asrama} · Kamar {anakAsuh.kamar}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2.5 shrink-0">
                    <QrCodeCanvas value={qrPayload} size={92} />
                    <span className="mt-1 text-[10px] text-slate-600 font-mono-tabular">
                      SH-{anakAsuh.nis}
                    </span>
                  </div>
                </div>

                <div className="no-print flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-2.5">
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-800">SALDO E-MONEY</p>
                    <p className="text-base font-bold text-emerald-900 font-mono-tabular">
                      {formatRupiah(anakAsuh.saldoEmoney)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-slate-500">BATAS JAJAN HARIAN</p>
                    <p className="text-xs font-semibold text-slate-800 font-mono-tabular">
                      {formatRupiah(anakAsuh.limitHarian)} / hari
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`print-card-exact w-full max-w-[540px] overflow-hidden rounded-2xl border border-emerald-900/15 bg-white shadow-lg ${
                cardSide === 'depan' ? 'hidden print:block print:mt-6' : 'block'
              }`}
            >
              <div className="bg-emerald-800 px-6 py-3 text-white flex items-center justify-between">
                <span className="text-xs font-semibold">
                  KETENTUAN KARTU SANTRI & E-MONEY
                </span>
                <span className="text-[11px] font-mono-tabular text-emerald-200">
                  {profil.singkatan}
                </span>
              </div>
              <div className="p-6 space-y-3 text-xs text-slate-700">
                <p>1. Kartu resmi identitas santri dan alat transaksi non-tunai kantin/koperasi.</p>
                <p>2. Untuk pengisian ulang saldo (Top-Up), wali santri dapat mentransfer ke rekening pondok atau melalui Bendahara.</p>
                <p>3. Pengaturan perubahan PIN 6 digit dan batas jajan dapat diajukan melalui pengurus/admin pesantren.</p>
              </div>
            </div>
          </div>

          {/* Mutasi Saldo E-Money Table */}
          <div className="no-print overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-emerald-700" />
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Riwayat Mutasi Saldo E-Money ({filteredMutasi.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pantauan pemasukan uang saku dan pengeluaran jajan di pondok
                  </p>
                </div>
              </div>
              <div className="flex items-center rounded-lg bg-slate-100 p-1">
                {(['Semua', 'Top-Up', 'Pembayaran'] as const).map((jenis) => (
                  <button
                    key={jenis}
                    type="button"
                    onClick={() => setMutasiFilter(jenis)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                      mutasiFilter === jenis
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {jenis}
                  </button>
                ))}
              </div>
            </div>

            {filteredMutasi.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                Belum ada mutasi saldo untuk filter ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="px-5 py-3">Tanggal & Waktu</th>
                      <th className="px-4 py-3">Jenis</th>
                      <th className="px-4 py-3">Keterangan & Lokasi</th>
                      <th className="px-4 py-3 text-right">Nominal</th>
                      <th className="px-5 py-3 text-right">Sisa Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMutasi.map((m) => {
                      const isTopUp = m.jenis === 'Top-Up';
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3 text-xs font-mono-tabular text-slate-600 whitespace-nowrap">
                            {formatWaktuIndo(m.tanggalWaktu)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-semibold ${
                                isTopUp ? 'text-emerald-700' : 'text-slate-700'
                              }`}
                            >
                              {isTopUp ? (
                                <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-700" />
                              ) : (
                                <ArrowUpRight className="h-3.5 w-3.5 text-amber-700" />
                              )}
                              {m.jenis}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs font-medium text-slate-900">{m.keterangan}</p>
                            <p className="text-[11px] text-slate-500">{m.sumberAtauLokasi}</p>
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-mono-tabular font-semibold whitespace-nowrap ${
                              isTopUp ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {isTopUp ? '+' : '-'}
                            {formatRupiah(m.nominal)}
                          </td>
                          <td className="px-5 py-3 text-right font-mono-tabular font-semibold text-slate-900 whitespace-nowrap">
                            {formatRupiah(m.saldoAkhir)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: TABUNGAN SANTRI, TARGET & BUKU MUTASI */}
      {activeSection === 'tabungan' && (
        <div className="no-print space-y-6">
          {/* Ringkasan Saldo & Target Tabungan */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    Total Saldo Tabungan Santri
                  </span>
                  <PiggyBank className="h-5 w-5 text-emerald-700" />
                </div>
                <p className="mt-2 text-3xl font-bold text-emerald-800 font-mono-tabular">
                  {formatRupiah(anakAsuh.saldoTabungan)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Buku Tabungan resmi {anakAsuh.namaLengkap} · NIS {anakAsuh.nis}
                </p>
              </div>
              <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-between text-xs">
                <span className="text-slate-500">Saldo E-Money Uang Saku</span>
                <span className="font-bold text-slate-900 font-mono-tabular">
                  {formatRupiah(anakAsuh.saldoEmoney)}
                </span>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-medium text-slate-500">
                    Target / Tujuan Tabungan
                  </span>
                  <h3 className="mt-0.5 flex items-center gap-2 text-lg font-bold text-slate-900">
                    <Target className="h-4 w-4 text-emerald-700 shrink-0" />
                    {anakAsuh.targetTabunganNama}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Ketercapaian</span>
                  <p className="text-2xl font-bold text-emerald-700 font-mono-tabular">
                    {targetPct}%
                  </p>
                </div>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  style={{ width: `${targetPct}%` }}
                  className={`h-full rounded-full transition-all ${
                    targetPct >= 100 ? 'bg-emerald-600' : 'bg-emerald-700'
                  }`}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-600 font-mono-tabular">
                  Terkumpul: <strong className="text-slate-900">{formatRupiah(anakAsuh.saldoTabungan)}</strong> /{' '}
                  {formatRupiah(anakAsuh.targetTabunganNominal)}
                </span>
                {kekuranganTarget === 0 ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Target Tabungan Tercapai
                  </span>
                ) : (
                  <span className="text-slate-600 font-mono-tabular">
                    Kurang <strong className="text-slate-900">{formatRupiah(kekuranganTarget)}</strong> lagi
                  </span>
                )}
              </div>
            </section>
          </div>

          {/* Riwayat Mutasi Buku Tabungan */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-emerald-700" />
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Riwayat Mutasi Buku Tabungan ({filteredTabunganMutasi.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Catatan setoran wali, penarikan tunai, dan pemindahan dana ke E-Money santri
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center rounded-lg bg-slate-100 p-1">
                {(['Semua', 'Setor', 'Tarik', 'Pindah ke E-Money'] as const).map((jenis) => (
                  <button
                    key={jenis}
                    type="button"
                    onClick={() => setTabunganFilter(jenis)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                      tabunganFilter === jenis
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {jenis}
                  </button>
                ))}
              </div>
            </div>

            {filteredTabunganMutasi.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                Belum ada catatan mutasi buku tabungan untuk filter ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="px-5 py-3">Tanggal & Waktu</th>
                      <th className="px-4 py-3">Jenis Transaksi</th>
                      <th className="px-4 py-3">Keterangan & Metode</th>
                      <th className="px-4 py-3 text-right">Nominal</th>
                      <th className="px-5 py-3 text-right">Saldo Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTabunganMutasi.map((m) => {
                      const isSetor = m.jenis === 'Setor';
                      const isTransfer = m.jenis === 'Pindah ke E-Money';
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3 text-xs font-mono-tabular text-slate-600 whitespace-nowrap">
                            {formatWaktuIndo(m.tanggalWaktu)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                                isSetor
                                  ? 'text-emerald-700'
                                  : isTransfer
                                  ? 'text-sky-700'
                                  : 'text-amber-700'
                              }`}
                            >
                              {isSetor ? (
                                <ArrowDownLeft className="h-3.5 w-3.5" />
                              ) : isTransfer ? (
                                <ArrowLeftRight className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              )}
                              {m.jenis}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs font-medium text-slate-900">{m.keterangan}</p>
                            <p className="text-[11px] text-slate-500">
                              {m.sumberAtauMetode} · Petugas: {m.dicatatOleh}
                            </p>
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-mono-tabular font-semibold whitespace-nowrap ${
                              isSetor ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {isSetor ? '+' : '-'}
                            {formatRupiah(m.nominal)}
                          </td>
                          <td className="px-5 py-3 text-right font-mono-tabular font-semibold text-slate-900 whitespace-nowrap">
                            {formatRupiah(m.saldoAkhir)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: STATUS TAGIHAN SPP & UANG MAKAN */}
      {activeSection === 'keuangan' && (
        <div className="no-print overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <h3 className="text-base font-semibold text-slate-900">
              Status Tagihan SPP & Uang Makan — {anakAsuh.namaLengkap}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Riwayat pembayaran bulanan dan cetak kuitansi resmi
            </p>
          </div>
          {childTagihan.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Belum ada catatan tagihan untuk santri ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="px-5 py-3.5">Jenis Tagihan</th>
                    <th className="px-4 py-3.5">Periode</th>
                    <th className="px-4 py-3.5 text-right">Nominal</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Keterangan Bayar</th>
                    <th className="px-5 py-3.5 text-right">Kuitansi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {childTagihan.map((t) => {
                    const isLunas = t.status === 'Lunas';
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5 font-medium text-slate-900">{t.jenis}</td>
                        <td className="px-4 py-3.5 text-slate-600">{t.bulan}</td>
                        <td className="px-4 py-3.5 text-right font-mono-tabular font-semibold text-slate-900">
                          {formatRupiah(t.nominal)}
                        </td>
                        <td className="px-4 py-3.5">
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
                        <td className="px-4 py-3.5 text-xs text-slate-500">
                          {isLunas
                            ? `${t.metodeBayar} · ${
                                t.tanggalBayar ? formatTanggalPendek(t.tanggalBayar) : '-'
                              }`
                            : 'Silakan selesaikan melalui transfer / Bendahara'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {isLunas ? (
                            <button
                              type="button"
                              onClick={() => setReceiptTagihan(t)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              Lihat Kuitansi
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
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
      )}

      {/* SECTION 5: RIWAYAT PERIZINAN & KEDISIPLINAN */}
      {activeSection === 'perizinan' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-base font-semibold text-slate-900">
                Riwayat Perizinan Keluar-Masuk ({childPerizinan.length})
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Catatan izin pulang, sakit, atau kegiatan luar pondok
              </p>
            </div>
            {childPerizinan.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">Belum ada riwayat perizinan.</p>
            ) : (
              <ul className="divide-y divide-slate-100 p-5">
                {childPerizinan.map((p) => (
                  <li key={p.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900">{p.jenisIzin}</span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          p.status === 'Sudah Kembali'
                            ? 'text-emerald-700'
                            : p.status === 'Terlambat'
                            ? 'text-rose-700'
                            : 'text-amber-700'
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">{p.alasan}</p>
                    <p className="text-[11px] text-slate-500 font-mono-tabular">
                      Keluar: {formatWaktuIndo(p.tanggalKeluar)} · Kembali:{' '}
                      {formatWaktuIndo(p.rencanaKembali)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-base font-semibold text-slate-900">
                Catatan Kedisiplinan & Prestasi ({childDisiplin.length})
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Total Poin Saat Ini:{' '}
                <strong className="text-slate-900">{anakAsuh.poinKedisiplinan} Poin</strong>
              </p>
            </div>
            {childDisiplin.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">
                Tidak ada catatan pelanggaran maupun prestasi khusus tercatat.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 p-5">
                {childDisiplin.map((d) => {
                  const isMerit = d.poinPerubahan > 0;
                  return (
                    <li key={d.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs font-semibold ${
                            isMerit ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {d.kategori}
                        </span>
                        <span
                          className={`text-xs font-bold font-mono-tabular ${
                            isMerit ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isMerit ? `+${d.poinPerubahan}` : d.poinPerubahan} poin
                        </span>
                      </div>
                      <p className="text-xs text-slate-800">{d.deskripsi}</p>
                      <p className="text-[11px] text-slate-500">
                        {formatTanggalPendek(d.tanggal)} · Tindak lanjut: {d.tindakLanjut}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* Printable Kuitansi Modal for Wali */}
      {receiptTagihan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="print-only-container w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="no-print flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">Kuitansi Pembayaran</h3>
              <button
                type="button"
                onClick={() => setReceiptTagihan(null)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h4 className="font-bold text-emerald-900">{profil.namaPesantren}</h4>
                  <p className="text-xs text-slate-500">{receiptTagihan.nomorKuitansi}</p>
                </div>
                <span className="text-xs font-bold text-emerald-700">LUNAS</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Santri</span>
                  <span className="font-semibold text-slate-900">
                    {anakAsuh.namaLengkap} ({anakAsuh.nis})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pembayaran</span>
                  <span className="font-medium text-slate-900">
                    {receiptTagihan.jenis} · {receiptTagihan.bulan}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nominal</span>
                  <span className="font-bold text-emerald-800 font-mono-tabular">
                    {formatRupiah(receiptTagihan.nominal)}
                  </span>
                </div>
              </div>
              <div className="flex justify-end pt-2">
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
