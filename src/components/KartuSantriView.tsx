import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  History,
  KeyRound,
  PiggyBank,
  Printer,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
  Settings2,
  ShieldAlert,
  ShoppingBag,
  Target,
  Wallet,
  X,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  AppUser,
  MutasiSaldo,
  MutasiTabungan,
  PerizinanSantri,
  ProfilPesantren,
  Santri,
} from '../types/pesantren';
import {
  buildSantriQrPayload,
  formatRupiah,
  formatTanggalIndo,
  formatWaktuIndo,
  getLocalDateKey,
} from '../utils/formatters';
import { QrCodeCanvas } from './QrCodeCanvas';
import { SantriAvatar } from './SantriAvatar';

interface KartuSantriViewProps {
  santriList: Santri[];
  perizinanList: PerizinanSantri[];
  mutasiSaldoList: MutasiSaldo[];
  mutasiTabunganList: MutasiTabungan[];
  profil: ProfilPesantren;
  currentUser: AppUser;
  selectedSantriId: string | null;
  onSelectSantri: (id: string) => void;
  onUpdatePengaturan: (santriId: string, limitHarian: number, newPin?: string) => void;
  onTopUpSaldo: (
    santriId: string,
    nominal: number,
    sumberDana: string,
    keterangan: string
  ) => void;
  onTransaksiKantin: (
    santriId: string,
    nominal: number,
    lokasi: string,
    keterangan: string,
    pinInput: string
  ) => { ok: boolean; error?: string; mutasi?: MutasiSaldo };
  onUpdateTargetTabungan: (
    santriId: string,
    targetNama: string,
    targetNominal: number
  ) => void;
  onTransaksiTabungan: (
    santriId: string,
    jenis: 'Setor' | 'Tarik',
    nominal: number,
    metode: string,
    keterangan: string
  ) => { ok: boolean; error?: string };
  onPindahTabunganKeEmoney: (
    santriId: string,
    nominal: number,
    keterangan: string
  ) => { ok: boolean; error?: string };
}

type CardSubTab = 'pratinjau' | 'kasir' | 'tabungan' | 'pengaturan';

export function KartuSantriView({
  santriList,
  perizinanList,
  mutasiSaldoList,
  mutasiTabunganList,
  profil,
  currentUser,
  selectedSantriId,
  onSelectSantri,
  onUpdatePengaturan,
  onTopUpSaldo,
  onTransaksiKantin,
  onUpdateTargetTabungan,
  onTransaksiTabungan,
  onPindahTabunganKeEmoney,
}: KartuSantriViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [subTab, setSubTab] = useState<CardSubTab>('pratinjau');
  const [cardSide, setCardSide] = useState<'depan' | 'belakang'>('depan');
  const [scanSimOpen, setScanSimOpen] = useState(false);
  const [scanMode, setScanMode] = useState<'absensi' | 'perizinan'>('absensi');
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);

  // Top-up Modal State
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpNominal, setTopUpNominal] = useState<number>(50000);
  const [topUpSumber, setTopUpSumber] = useState('Tunai Bendahara');
  const [topUpKeterangan, setTopUpKeterangan] = useState('');

  // Kasir / Scan Bayar State
  const [kasirSantriId, setKasirSantriId] = useState<string>(selectedSantriId ?? santriList[0]?.id ?? '');
  const [kasirLokasi, setKasirLokasi] = useState('Kantin Putra Al-Farabi');
  const [kasirNominal, setKasirNominal] = useState<number>(12000);
  const [kasirKeterangan, setKasirKeterangan] = useState('Makan Siang & Minum');
  const [kasirPin, setKasirPin] = useState('');
  const [showKasirPin, setShowKasirPin] = useState(false);
  const [kasirError, setKasirError] = useState<string | null>(null);
  const [kasirSuccess, setKasirSuccess] = useState<MutasiSaldo | null>(null);
  const [kasirQrNotice, setKasirQrNotice] = useState<string | null>(null);

  // Pengaturan Kartu & PIN State
  const [limitInput, setLimitInput] = useState<number>(20000);
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [pengaturanError, setPengaturanError] = useState<string | null>(null);
  const [pengaturanSuccess, setPengaturanSuccess] = useState<string | null>(null);

  // Mutasi Filter
  const [mutasiFilter, setMutasiFilter] = useState<'Semua' | 'Top-Up' | 'Pembayaran'>('Semua');

  // Tabungan Santri State
  const [pindahNominal, setPindahNominal] = useState<number>(50000);
  const [pindahKeterangan, setPindahKeterangan] = useState('');
  const [pindahError, setPindahError] = useState<string | null>(null);
  const [pindahSuccess, setPindahSuccess] = useState<string | null>(null);

  const [editTargetOpen, setEditTargetOpen] = useState(false);
  const [targetNamaInput, setTargetNamaInput] = useState('Kitab & Seragam Baru');
  const [targetNominalInput, setTargetNominalInput] = useState<number>(1500000);

  const [tabunganModalOpen, setTabunganModalOpen] = useState(false);
  const [tabunganJenis, setTabunganJenis] = useState<'Setor' | 'Tarik'>('Setor');
  const [tabunganNominal, setTabunganNominal] = useState<number>(100000);
  const [tabunganMetode, setTabunganMetode] = useState('Tunai Bendahara');
  const [tabunganKeterangan, setTabunganKeterangan] = useState('');
  const [tabunganModalError, setTabunganModalError] = useState<string | null>(null);
  const [tabunganFilter, setTabunganFilter] = useState<
    'Semua' | 'Setor' | 'Tarik' | 'Pindah ke E-Money'
  >('Semua');

  const isAdmin = currentUser.role === 'admin';

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return santriList;
    return santriList.filter(
      (s) =>
        s.namaLengkap.toLowerCase().includes(q) ||
        s.nis.toLowerCase().includes(q) ||
        s.asrama.toLowerCase().includes(q)
    );
  }, [santriList, searchQuery]);

  const activeSantri = useMemo(() => {
    return (
      santriList.find((s) => s.id === selectedSantriId) ??
      filteredList[0] ??
      santriList[0]
    );
  }, [santriList, filteredList, selectedSantriId]);

  useEffect(() => {
    if (activeSantri) {
      setLimitInput(activeSantri.limitHarian);
      setPinInput('');
      setConfirmPinInput('');
      setPengaturanError(null);
      setPengaturanSuccess(null);
      setKasirSantriId(activeSantri.id);
      setTargetNamaInput(activeSantri.targetTabunganNama);
      setTargetNominalInput(activeSantri.targetTabunganNominal);
      setPindahError(null);
      setPindahSuccess(null);
      setEditTargetOpen(false);
    }
  }, [activeSantri?.id]);

  const activeIzin = useMemo(() => {
    if (!activeSantri) return null;
    return perizinanList.find(
      (p) =>
        p.santriId === activeSantri.id &&
        (p.status === 'Sedang Keluar' || p.status === 'Menunggu Persetujuan')
    );
  }, [activeSantri, perizinanList]);

  const activeSantriMutasi = useMemo(() => {
    if (!activeSantri) return [];
    return mutasiSaldoList.filter((m) => m.santriId === activeSantri.id);
  }, [activeSantri, mutasiSaldoList]);

  const filteredMutasi = useMemo(() => {
    if (mutasiFilter === 'Semua') return activeSantriMutasi;
    return activeSantriMutasi.filter((m) => m.jenis === mutasiFilter);
  }, [activeSantriMutasi, mutasiFilter]);

  const activeTabunganMutasi = useMemo(() => {
    if (!activeSantri) return [];
    return mutasiTabunganList.filter((m) => m.santriId === activeSantri.id);
  }, [activeSantri, mutasiTabunganList]);

  const filteredTabunganMutasi = useMemo(() => {
    if (tabunganFilter === 'Semua') return activeTabunganMutasi;
    return activeTabunganMutasi.filter((m) => m.jenis === tabunganFilter);
  }, [activeTabunganMutasi, tabunganFilter]);

  const spentTodayActive = useMemo(() => {
    if (!activeSantri) return 0;
    const todayKey = getLocalDateKey();
    return activeSantriMutasi
      .filter((m) => m.jenis === 'Pembayaran' && m.tanggalWaktu.startsWith(todayKey))
      .reduce((acc, m) => acc + m.nominal, 0);
  }, [activeSantri, activeSantriMutasi]);

  const kasirSantri = useMemo(() => {
    return santriList.find((s) => s.id === kasirSantriId) ?? activeSantri;
  }, [santriList, kasirSantriId, activeSantri]);

  const kasirSpentToday = useMemo(() => {
    if (!kasirSantri) return 0;
    const todayKey = getLocalDateKey();
    return mutasiSaldoList
      .filter(
        (m) =>
          m.santriId === kasirSantri.id &&
          m.jenis === 'Pembayaran' &&
          m.tanggalWaktu.startsWith(todayKey)
      )
      .reduce((acc, m) => acc + m.nominal, 0);
  }, [kasirSantri, mutasiSaldoList]);

  const qrPayload = activeSantri
    ? buildSantriQrPayload(
        activeSantri.nis,
        activeSantri.namaLengkap,
        activeSantri.asrama,
        activeSantri.kamar
      )
    : '';

  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadPng = async () => {
    if (!activeSantri) return;
    setIsDownloadingPng(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1016;
      canvas.height = 638;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const grad = ctx.createLinearGradient(0, 0, canvas.width, 160);
      grad.addColorStop(0, '#065f46');
      grad.addColorStop(1, '#047857');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, 152);

      ctx.fillStyle = '#065f46';
      ctx.fillRect(0, canvas.height - 26, canvas.width, 26);

      ctx.fillStyle = '#d1fae5';
      ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('KARTU TANDA SANTRI & E-MONEY PONDOK', 44, 54);

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 32px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(profil.namaPesantren.toUpperCase(), 44, 98);

      ctx.fillStyle = '#a7f3d0';
      ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`NSPP ${profil.nspp} · ${profil.kota}`, 44, 130);

      const logoSrc = profil.logoUrl || '/assets/aistudio/images_710b9fe7.jpg';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(872, 26, 100, 100);
      await new Promise<void>((resolve) => {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.onload = () => {
          ctx.drawImage(logoImg, 876, 30, 92, 92);
          resolve();
        };
        logoImg.onerror = () => resolve();
        logoImg.src = logoSrc;
      });

      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(44, 192, 200, 250);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(44, 192, 200, 250);

      await new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.drawImage(img, 44, 192, 200, 250);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = activeSantri.fotoUrl;
      });

      ctx.fillStyle = '#64748b';
      ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('NAMA LENGKAP', 280, 222);

      ctx.fillStyle = '#0f172a';
      ctx.font = '700 30px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(activeSantri.namaLengkap, 280, 260);

      ctx.fillStyle = '#64748b';
      ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('NOMOR INDUK SANTRI (NIS)', 280, 314);

      ctx.fillStyle = '#065f46';
      ctx.font = '700 28px "JetBrains Mono", monospace';
      ctx.fillText(activeSantri.nis, 280, 350);

      ctx.fillStyle = '#64748b';
      ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('KELAS & ASRAMA', 280, 404);

      ctx.fillStyle = '#1e293b';
      ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${activeSantri.kelas} · ${activeSantri.asrama}`, 280, 438);

      ctx.fillStyle = '#475569';
      ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        `Kamar ${activeSantri.kamar} · Limit Jajan ${formatRupiah(activeSantri.limitHarian)}/hari`,
        280,
        472
      );

      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 220,
        margin: 1,
        color: { dark: '#064e3b', light: '#ffffff' },
      });
      await new Promise<void>((resolve) => {
        const qrImg = new Image();
        qrImg.onload = () => {
          ctx.drawImage(qrImg, 764, 210, 208, 208);
          resolve();
        };
        qrImg.onerror = () => resolve();
        qrImg.src = qrDataUrl;
      });

      ctx.fillStyle = '#475569';
      ctx.font = '600 16px "JetBrains Mono", monospace';
      ctx.fillText(`ID: SH-${activeSantri.nis}`, 790, 444);

      ctx.fillStyle = '#64748b';
      ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`Berlaku selama berstatus santri aktif · ${profil.pengasuh}`, 44, 575);

      const link = document.createElement('a');
      link.download = `Kartu_Santri_${activeSantri.nis}_${activeSantri.namaLengkap.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setIsDownloadingPng(false);
    }
  };

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSantri || topUpNominal <= 0) return;
    onTopUpSaldo(activeSantri.id, Number(topUpNominal), topUpSumber, topUpKeterangan);
    setTopUpKeterangan('');
    setTopUpOpen(false);
  };

  const handleSimulateKasirQrScan = () => {
    if (!activeSantri) return;
    setKasirSantriId(activeSantri.id);
    setKasirError(null);
    setKasirSuccess(null);
    setKasirQrNotice(
      `QR Kartu Terbaca: ${activeSantri.namaLengkap} (NIS ${activeSantri.nis} · ${activeSantri.kamar})`
    );
  };

  const handleKasirSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kasirSantri) return;
    setKasirError(null);
    setKasirSuccess(null);

    const result = onTransaksiKantin(
      kasirSantri.id,
      Number(kasirNominal),
      kasirLokasi,
      kasirKeterangan,
      kasirPin
    );

    if (!result.ok) {
      setKasirError(result.error ?? 'Transaksi gagal diproses.');
      return;
    }

    setKasirSuccess(result.mutasi ?? null);
    setKasirPin('');
    onSelectSantri(kasirSantri.id);
  };

  const handleSavePengaturan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSantri) return;
    setPengaturanError(null);
    setPengaturanSuccess(null);

    if (limitInput < 5000) {
      setPengaturanError('Batas jajan harian minimal Rp 5.000.');
      return;
    }

    let nextPin: string | undefined;
    if (pinInput.trim() || confirmPinInput.trim()) {
      if (!/^\d{6}$/.test(pinInput)) {
        setPengaturanError('PIN baru harus terdiri dari tepat 6 digit angka.');
        return;
      }
      if (pinInput !== confirmPinInput) {
        setPengaturanError('Konfirmasi PIN baru tidak cocok.');
        return;
      }
      nextPin = pinInput;
    }

    onUpdatePengaturan(activeSantri.id, Number(limitInput), nextPin);
    setPinInput('');
    setConfirmPinInput('');
    setPengaturanSuccess(
      nextPin
        ? 'Batas harian & PIN 6 digit baru berhasil disimpan.'
        : 'Batas maksimal jajan harian berhasil diperbarui.'
    );
  };

  const handlePindahDanaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSantri) return;
    setPindahError(null);
    setPindahSuccess(null);

    const nominalNum = Number(pindahNominal);
    if (!nominalNum || nominalNum <= 0) {
      setPindahError('Masukkan nominal pindah dana lebih dari Rp 0.');
      return;
    }
    if (nominalNum > activeSantri.saldoTabungan) {
      setPindahError(
        `Nominal transfer (${formatRupiah(nominalNum)}) melebihi saldo tabungan aktif (${formatRupiah(
          activeSantri.saldoTabungan
        )}).`
      );
      return;
    }

    const res = onPindahTabunganKeEmoney(activeSantri.id, nominalNum, pindahKeterangan);
    if (!res.ok) {
      setPindahError(res.error ?? 'Gagal memindahkan dana.');
      return;
    }

    setPindahSuccess(
      `Berhasil memindahkan ${formatRupiah(nominalNum)} dari Tabungan ke E-Money ${activeSantri.namaLengkap}.`
    );
    setPindahKeterangan('');
  };

  const handleSaveTargetTabungan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSantri) return;
    const cleanName = targetNamaInput.trim() || 'Tabungan Pendidikan Santri';
    const cleanNominal = Math.max(50000, Number(targetNominalInput) || 500000);
    onUpdateTargetTabungan(activeSantri.id, cleanName, cleanNominal);
    setEditTargetOpen(false);
  };

  const handleTabunganModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSantri) return;
    setTabunganModalError(null);
    const res = onTransaksiTabungan(
      activeSantri.id,
      tabunganJenis,
      Number(tabunganNominal),
      tabunganMetode,
      tabunganKeterangan
    );
    if (!res.ok) {
      setTabunganModalError(res.error ?? 'Transaksi tabungan gagal.');
      return;
    }
    setTabunganKeterangan('');
    setTabunganModalOpen(false);
  };

  if (!activeSantri) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-sm font-medium text-slate-700">Belum ada data santri untuk dicetak.</p>
      </div>
    );
  }

  const sisaLimitActive = Math.max(0, activeSantri.limitHarian - spentTodayActive);
  const kasirSisaLimit = kasirSantri
    ? Math.max(0, kasirSantri.limitHarian - kasirSpentToday)
    : 0;
  const targetPct =
    activeSantri.targetTabunganNominal > 0
      ? Math.min(
          100,
          Math.round((activeSantri.saldoTabungan / activeSantri.targetTabunganNominal) * 100)
        )
      : 0;
  const kekuranganTarget = Math.max(
    0,
    activeSantri.targetTabunganNominal - activeSantri.saldoTabungan
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left Selector Panel (Hidden on Print) */}
      <aside className="no-print rounded-xl border border-slate-200 bg-white p-4 lg:col-span-4 flex flex-col max-h-[780px]">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-semibold text-slate-900">Pilih Santri & Dompet E-Money</h2>
          <div className="relative mt-2.5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau NIS..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-3 flex-1 space-y-1 overflow-y-auto pr-1">
          {filteredList.map((s) => {
            const isSelected = s.id === activeSantri.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectSantri(s.id)}
                className={`flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600/30'
                    : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <SantriAvatar src={s.fotoUrl} name={s.namaLengkap} sizeClass="w-10 h-10" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{s.namaLengkap}</p>
                    <span className="text-xs font-bold text-emerald-700 font-mono-tabular shrink-0">
                      {formatRupiah(s.saldoEmoney)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 font-mono-tabular">
                    <span className="truncate">
                      {s.nis} · {s.kelas}
                    </span>
                    <span className="shrink-0 text-slate-600">
                      Tab: {formatRupiah(s.saldoTabungan)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right Workspace Panel */}
      <section className="lg:col-span-8 space-y-5">
        {/* Top Segmented Tabs + Quick Actions */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setSubTab('pratinjau')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                subTab === 'pratinjau'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pratinjau Kartu
            </button>
            <button
              type="button"
              onClick={() => {
                setKasirSantriId(activeSantri.id);
                setKasirError(null);
                setKasirSuccess(null);
                setSubTab('kasir');
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                subTab === 'kasir'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Kasir / Scan Bayar
            </button>
            <button
              type="button"
              onClick={() => {
                setPindahError(null);
                setPindahSuccess(null);
                setSubTab('tabungan');
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                subTab === 'tabungan'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PiggyBank className="h-3.5 w-3.5" />
              Tabungan Santri
            </button>
            <button
              type="button"
              onClick={() => setSubTab('pengaturan')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                subTab === 'pengaturan'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings2 className="h-3.5 w-3.5" />
              Pengaturan & Mutasi
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setTopUpOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-emerald-800 whitespace-nowrap shrink-0"
              >
                <Wallet className="h-3.5 w-3.5" />
                Top-Up Saldo
              </button>
            )}
            <button
              type="button"
              onClick={() => setScanSimOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <ScanLine className="h-3.5 w-3.5 text-emerald-700" />
              Verifikasi QR
            </button>
          </div>
        </div>

        {/* Live E-Money & Tabungan Wallet Strip */}
        <div className="no-print grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Saldo E-Money Harian</p>
            <p className="mt-1 text-xl font-bold text-emerald-700 font-mono-tabular">
              {formatRupiah(activeSantri.saldoEmoney)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500 truncate">
              {activeSantri.namaLengkap}
            </p>
          </div>

          <div className="sm:border-l sm:border-slate-100 sm:pl-4">
            <p className="text-xs font-medium text-slate-500">Saldo Tabungan Santri</p>
            <p className="mt-1 text-xl font-bold text-slate-900 font-mono-tabular">
              {formatRupiah(activeSantri.saldoTabungan)}
            </p>
            <button
              type="button"
              onClick={() => setSubTab('tabungan')}
              className="mt-1 text-left text-[11px] font-medium text-emerald-700 hover:underline"
            >
              Target {targetPct}% · Pindah Dana →
            </button>
          </div>

          <div className="xl:border-l xl:border-slate-100 xl:pl-4">
            <p className="text-xs font-medium text-slate-500">Batas Jajan Harian</p>
            <p className="mt-1 text-xl font-bold text-slate-900 font-mono-tabular">
              {formatRupiah(activeSantri.limitHarian)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Terpakai: <strong className="font-mono-tabular text-slate-700">{formatRupiah(spentTodayActive)}</strong>
            </p>
          </div>

          <div className="sm:border-l sm:border-slate-100 sm:pl-4 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Sisa Limit Hari Ini</p>
              <p
                className={`mt-1 text-xl font-bold font-mono-tabular ${
                  sisaLimitActive === 0 ? 'text-rose-700' : 'text-slate-900'
                }`}
              >
                {formatRupiah(sisaLimitActive)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSubTab('pengaturan')}
              className="mt-1 text-left text-[11px] font-medium text-emerald-700 hover:underline"
            >
              Atur Limit & PIN →
            </button>
          </div>
        </div>

        {/* SUB-TAB 1: PRATINJAU KARTU & PRINT */}
        {subTab === 'pratinjau' && (
          <div className="space-y-5">
            <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setCardSide('depan')}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    cardSide === 'depan'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sisi Depan
                </button>
                <button
                  type="button"
                  onClick={() => setCardSide('belakang')}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    cardSide === 'belakang'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sisi Belakang
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={isDownloadingPng}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700 bg-emerald-50 px-3.5 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-100 whitespace-nowrap shrink-0 disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {isDownloadingPng ? 'Memproses...' : 'Unduh PNG'}
                </button>
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-800 whitespace-nowrap shrink-0"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Cetak / Export PDF
                </button>
              </div>
            </div>

            {/* Printable ID Card Stage */}
            <div className="print-only-container rounded-xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8 flex flex-col items-center justify-center gap-6">
              {/* Front Card */}
              <div
                className={`print-card-exact w-full max-w-[540px] overflow-hidden rounded-2xl border border-emerald-900/15 bg-white shadow-lg ${
                  cardSide === 'belakang' ? 'hidden print:block' : 'block'
                }`}
              >
                {/* Emerald Header */}
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
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-xs">
                      <img
                        src={profil.logoUrl || '/assets/aistudio/images_710b9fe7.jpg'}
                        alt={profil.namaPesantren}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-[11px] text-emerald-100/90 font-mono-tabular">
                    NSPP {profil.nspp} · {profil.kota}
                  </p>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="h-32 w-24 overflow-hidden rounded-xl border-2 border-emerald-700/20 bg-slate-100">
                        <SantriAvatar
                          src={activeSantri.fotoUrl}
                          name={activeSantri.namaLengkap}
                          sizeClass="h-full w-full"
                          roundedClass="rounded-none"
                          textClass="text-2xl"
                        />
                      </div>
                      <span className="mt-2 text-[11px] font-semibold text-emerald-800 font-mono-tabular">
                        {activeSantri.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-2.5">
                      <div>
                        <p className="text-[10px] font-semibold tracking-wider text-slate-400">
                          NAMA LENGKAP
                        </p>
                        <p className="text-lg font-bold leading-tight text-slate-900">
                          {activeSantri.namaLengkap}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] font-semibold tracking-wider text-slate-400">
                            NIS
                          </p>
                          <p className="text-sm font-bold text-emerald-800 font-mono-tabular">
                            {activeSantri.nis}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold tracking-wider text-slate-400">
                            KELAS
                          </p>
                          <p className="text-sm font-semibold text-slate-800">
                            {activeSantri.kelas}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold tracking-wider text-slate-400">
                          ASRAMA & KAMAR
                        </p>
                        <p className="text-xs font-medium text-slate-800">
                          {activeSantri.asrama} · Kamar{' '}
                          <span className="font-mono-tabular font-semibold">
                            {activeSantri.kamar}
                          </span>
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold tracking-wider text-slate-400">
                          TEMPAT, TANGGAL LAHIR
                        </p>
                        <p className="text-xs text-slate-700">
                          {activeSantri.tempatLahir}, {formatTanggalIndo(activeSantri.tanggalLahir)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2.5 shrink-0">
                      <QrCodeCanvas value={qrPayload} size={96} />
                      <span className="mt-1.5 text-[10px] font-medium text-slate-600 font-mono-tabular">
                        SH-{activeSantri.nis}
                      </span>
                    </div>
                  </div>

                  {/* Live E-Money Saldo Strip Inside Digital Card */}
                  <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-2.5">
                    <div>
                      <p className="text-[10px] font-semibold tracking-wider text-emerald-800">
                        SALDO E-MONEY SANTRI
                      </p>
                      <p className="text-base font-bold text-emerald-900 font-mono-tabular">
                        {formatRupiah(activeSantri.saldoEmoney)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold tracking-wider text-slate-500">
                        BATAS JAJAN HARIAN
                      </p>
                      <p className="text-xs font-semibold text-slate-800 font-mono-tabular">
                        {formatRupiah(activeSantri.limitHarian)} / hari
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-emerald-900/10 bg-emerald-900 px-6 py-2.5 text-[11px] text-emerald-100">
                  <span>Angkatan {activeSantri.tahunMasuk} · Kartu Santri & E-Money</span>
                  <span className="font-semibold text-white">Absensi · Perizinan · Kantin</span>
                </div>
              </div>

              {/* Back Card */}
              <div
                className={`print-card-exact w-full max-w-[540px] overflow-hidden rounded-2xl border border-emerald-900/15 bg-white shadow-lg ${
                  cardSide === 'depan' ? 'hidden print:block print:mt-6' : 'block'
                }`}
              >
                <div className="bg-emerald-800 px-6 py-3 text-white flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wide">
                    KETENTUAN PENGGUNAAN KARTU SANTRI & E-MONEY
                  </span>
                  <span className="text-[11px] font-mono-tabular text-emerald-200">
                    {profil.singkatan}
                  </span>
                </div>

                <div className="p-6 space-y-4">
                  <ol className="list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-slate-700">
                    <li>Kartu ini adalah identitas resmi sekaligus dompet elektronik santri {profil.namaPesantren}.</li>
                    <li>Wajib dipindai (QR Code) saat presensi, perizinan keluar-masuk, serta transaksi non-tunai di kantin/koperasi.</li>
                    <li>Setiap transaksi pembayaran dilindungi PIN 6 digit pribadi santri dan batas belanja harian.</li>
                    <li>Apabila kartu hilang atau rusak, segera melapor ke Kantor Kesantrian / Bendahara untuk pemblokiran saldo.</li>
                  </ol>

                  <div className="flex items-end justify-between border-t border-slate-100 pt-4">
                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <p className="font-semibold text-slate-800">{profil.namaPesantren}</p>
                      <p>{profil.alamat}</p>
                      <p>Telp: {profil.telepon} · {profil.website}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-500">Pengasuh Pondok</p>
                      <p className="mt-5 text-xs font-bold text-slate-900 underline decoration-emerald-700/40 underline-offset-4">
                        {profil.pengasuh}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="no-print text-xs text-slate-500 text-center">
                Tips: Klik <strong>Cetak / Export PDF</strong> lalu pilih “Simpan sebagai PDF” dengan opsi Grafis Latar Belakang aktif.
              </p>
            </div>
          </div>
        )}

        {/* SUB-TAB 2: KASIR / SCAN BAYAR KANTIN & KOPERASI */}
        {subTab === 'kasir' && (
          <div className="no-print rounded-xl border border-slate-200 bg-white p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Kasir Kantin & Koperasi Pondok (Scan Bayar E-Money)
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Pilih santri atau pindai QR kartu, masukkan nominal belanja, lalu verifikasi PIN 6 digit santri.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSimulateKasirQrScan}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 whitespace-nowrap"
              >
                <QrCode className="h-4 w-4" />
                Simulasi Scan QR Kartu Aktif
              </button>
            </div>

            {kasirQrNotice && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-900">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                <span>{kasirQrNotice}</span>
              </div>
            )}

            <form onSubmit={handleKasirSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-7">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Santri Pembeli
                  </label>
                  <select
                    value={kasirSantriId}
                    onChange={(e) => {
                      setKasirSantriId(e.target.value);
                      setKasirError(null);
                      setKasirSuccess(null);
                      setKasirQrNotice(null);
                    }}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  >
                    {santriList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.namaLengkap} ({s.nis}) — Saldo {formatRupiah(s.saldoEmoney)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Unit Usaha / Lokasi
                    </label>
                    <select
                      value={kasirLokasi}
                      onChange={(e) => setKasirLokasi(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                    >
                      <option value="Kantin Putra Al-Farabi">Kantin Putra Al-Farabi</option>
                      <option value="Kantin Putri Khadijah">Kantin Putri Khadijah</option>
                      <option value="Koperasi Sabda">Koperasi Sabda</option>
                      <option value="Klinik & UKS Pondok">Klinik & UKS Pondok</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Nominal Belanja (Rp)
                    </label>
                    <input
                      type="number"
                      min={500}
                      step={500}
                      required
                      value={kasirNominal}
                      onChange={(e) => {
                        setKasirNominal(Number(e.target.value));
                        setKasirError(null);
                      }}
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular font-semibold focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Preset Item Cepat */}
                <div>
                  <p className="text-[11px] font-medium text-slate-500 mb-1.5">
                    Pilih Cepat Item Kantin / Koperasi:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Snack & Air Mineral (Rp 5.000)', nominal: 5000, item: 'Snack & Air Mineral' },
                      { label: 'Makan Siang (Rp 12.000)', nominal: 12000, item: 'Makan Siang & Es Teh' },
                      { label: 'Alat Tulis (Rp 8.000)', nominal: 8000, item: 'Buku Tulis & Pulpen' },
                      { label: 'Kitab Kuning (Rp 25.000)', nominal: 25000, item: 'Kitab Fiqih & Kamus' },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setKasirNominal(preset.nominal);
                          setKasirKeterangan(preset.item);
                          setKasirError(null);
                        }}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Keterangan Item Belanja
                  </label>
                  <input
                    type="text"
                    required
                    value={kasirKeterangan}
                    onChange={(e) => setKasirKeterangan(e.target.value)}
                    placeholder="Contoh: Nasi Goreng, Susu Kedelai, Buku Tulis"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700">
                      Verifikasi PIN 6 Digit Santri
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono-tabular">
                      PIN simulasi santri: {kasirSantri?.pinKartu ?? '123456'}
                    </span>
                  </div>
                  <div className="relative mt-1.5">
                    <input
                      type={showKasirPin ? 'text' : 'password'}
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={kasirPin}
                      onChange={(e) => {
                        setKasirPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setKasirError(null);
                      }}
                      placeholder="Masukkan 6 digit PIN kartu"
                      className="w-full rounded-lg border border-slate-300 py-2 pl-3 pr-10 text-sm font-mono-tabular tracking-widest focus:border-emerald-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKasirPin((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      aria-label="Tampilkan/sembunyikan PIN"
                    >
                      {showKasirPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {kasirError && (
                  <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{kasirError}</span>
                  </div>
                )}

                {kasirSuccess && (
                  <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700 mt-0.5" />
                    <div>
                      <p className="font-semibold">
                        Transaksi Berhasil! Saldo dipotong {formatRupiah(kasirSuccess.nominal)}
                      </p>
                      <p className="mt-0.5 text-emerald-800/90 font-mono-tabular">
                        Sisa saldo akhir: {formatRupiah(kasirSuccess.saldoAkhir)} · {kasirSuccess.sumberAtauLokasi}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
                >
                  Proses Pembayaran Non-Tunai
                </button>
              </div>

              {/* Right Mini Summary for Kasir */}
              <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-4 h-fit">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                  <SantriAvatar
                    src={kasirSantri?.fotoUrl}
                    name={kasirSantri?.namaLengkap ?? 'Santri'}
                    sizeClass="w-12 h-12"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {kasirSantri?.namaLengkap}
                    </p>
                    <p className="text-xs text-slate-500 font-mono-tabular">
                      NIS {kasirSantri?.nis} · {kasirSantri?.kelas}
                    </p>
                  </div>
                </div>

                <dl className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Saldo Kartu Saat Ini</dt>
                    <dd className="text-base font-bold text-emerald-700 font-mono-tabular">
                      {formatRupiah(kasirSantri?.saldoEmoney ?? 0)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Batas Jajan Harian</dt>
                    <dd className="font-semibold text-slate-800 font-mono-tabular">
                      {formatRupiah(kasirSantri?.limitHarian ?? 20000)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Terpakai Hari Ini</dt>
                    <dd className="font-semibold text-slate-800 font-mono-tabular">
                      {formatRupiah(kasirSpentToday)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
                    <dt className="font-medium text-slate-700">Sisa Limit Jajan Hari Ini</dt>
                    <dd
                      className={`font-bold font-mono-tabular ${
                        kasirSisaLimit === 0 ? 'text-rose-700' : 'text-emerald-800'
                      }`}
                    >
                      {formatRupiah(kasirSisaLimit)}
                    </dd>
                  </div>
                </dl>

                <div className="rounded-lg border border-slate-200 bg-white p-3 text-[11px] leading-relaxed text-slate-600">
                  Sistem otomatis menolak transaksi apabila PIN 6 digit salah, saldo tidak mencukupi, atau total belanja hari ini melebihi batas harian.
                </div>
              </div>
            </form>
          </div>
        )}

        {/* SUB-TAB 3: PENGATURAN KARTU & RIWAYAT MUTASI SALDO */}
        {subTab === 'pengaturan' && (
          <div className="no-print space-y-6">
            {/* Pengaturan Limit & PIN */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Pengaturan Batas Jajan & Keamanan PIN
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Atur limit maksimal belanja harian dan PIN 6 digit untuk {activeSantri.namaLengkap}
                  </p>
                </div>
                <KeyRound className="h-5 w-5 text-emerald-700" />
              </div>

              <form onSubmit={handleSavePengaturan} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Batas Maksimal Jajan Harian (Rp)
                    </label>
                    <input
                      type="number"
                      min={5000}
                      step={5000}
                      required
                      value={limitInput}
                      onChange={(e) => {
                        setLimitInput(Number(e.target.value));
                        setPengaturanError(null);
                        setPengaturanSuccess(null);
                      }}
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular font-semibold focus:border-emerald-600 focus:outline-none"
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[15000, 20000, 25000, 30000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setLimitInput(val)}
                          className={`rounded-md border px-2 py-1 text-[11px] font-mono-tabular ${
                            limitInput === val
                              ? 'border-emerald-700 bg-emerald-50 font-semibold text-emerald-800'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {formatRupiah(val)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">PIN Kartu Aktif Saat Ini</span>
                      <button
                        type="button"
                        onClick={() => setShowCurrentPin((v) => !v)}
                        className="text-xs font-medium text-emerald-700 hover:underline"
                      >
                        {showCurrentPin ? 'Sembunyikan' : 'Lihat PIN'}
                      </button>
                    </div>
                    <p className="mt-1.5 text-lg font-bold tracking-widest text-slate-900 font-mono-tabular">
                      {showCurrentPin ? activeSantri.pinKartu : '••••••'}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Kosongkan kolom PIN baru di bawah jika hanya mengubah batas jajan harian.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Buat / Ubah PIN Baru (6 Digit Angka)
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={pinInput}
                      onChange={(e) => {
                        setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setPengaturanError(null);
                        setPengaturanSuccess(null);
                      }}
                      placeholder="Contoh: 654321"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular tracking-widest focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Konfirmasi PIN Baru
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={confirmPinInput}
                      onChange={(e) => {
                        setConfirmPinInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setPengaturanError(null);
                        setPengaturanSuccess(null);
                      }}
                      placeholder="Ulangi 6 digit PIN baru"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular tracking-widest focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                {pengaturanError && (
                  <p className="text-xs font-medium text-rose-700">{pengaturanError}</p>
                )}
                {pengaturanSuccess && (
                  <p className="text-xs font-medium text-emerald-700">{pengaturanSuccess}</p>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                  >
                    Simpan Pengaturan Kartu
                  </button>
                </div>
              </form>
            </div>

            {/* Riwayat Mutasi Saldo */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-emerald-700" />
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Riwayat Mutasi Saldo ({filteredMutasi.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Catatan top-up masuk dan transaksi pembayaran keluar {activeSantri.namaLengkap}
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
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    Belum ada riwayat mutasi saldo untuk filter ini.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                        <th className="px-5 py-3">Tanggal & Waktu</th>
                        <th className="px-4 py-3">Jenis</th>
                        <th className="px-4 py-3">Keterangan & Lokasi/Sumber</th>
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
                              <p className="text-[11px] text-slate-500">
                                {m.sumberAtauLokasi} · Petugas: {m.dicatatOleh}
                              </p>
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

        {/* SUB-TAB 4: TABUNGAN SANTRI, TARGET & PINDAH DANA KE E-MONEY */}
        {subTab === 'tabungan' && (
          <div className="no-print space-y-6">
            {/* Progres Target Tabungan & Atur Target */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-medium text-slate-500">
                    Target / Tujuan Tabungan Santri
                  </span>
                  <h3 className="mt-0.5 flex items-center gap-2 text-lg font-bold text-slate-900">
                    <Target className="h-4 w-4 text-emerald-700 shrink-0" />
                    {activeSantri.targetTabunganNama}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Santri: {activeSantri.namaLengkap} · NIS {activeSantri.nis}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetNamaInput(activeSantri.targetTabunganNama);
                      setTargetNominalInput(activeSantri.targetTabunganNominal);
                      setEditTargetOpen((v) => !v);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                  >
                    {editTargetOpen ? 'Tutup Form Target' : 'Atur Target Tabungan'}
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setTabunganJenis('Setor');
                        setTabunganNominal(100000);
                        setTabunganModalError(null);
                        setTabunganModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-emerald-800 whitespace-nowrap"
                    >
                      <PiggyBank className="h-3.5 w-3.5" />
                      Setor / Tarik Tabungan
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-500">Saldo Tabungan Terkumpul</p>
                    <p className="text-2xl font-bold text-emerald-800 font-mono-tabular">
                      {formatRupiah(activeSantri.saldoTabungan)}
                      <span className="ml-2 text-sm font-normal text-slate-500">
                        dari target {formatRupiah(activeSantri.targetTabunganNominal)}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-emerald-700 font-mono-tabular">
                      {targetPct}%
                    </span>
                  </div>
                </div>

                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    style={{ width: `${targetPct}%` }}
                    className="h-full rounded-full bg-emerald-600 transition-all"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  {kekuranganTarget === 0 ? (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Alhamdulillah, target tabungan telah tercapai!
                    </span>
                  ) : (
                    <span className="text-slate-600 font-mono-tabular">
                      Kekurangan untuk mencapai target:{' '}
                      <strong className="text-slate-900">{formatRupiah(kekuranganTarget)}</strong>
                    </span>
                  )}
                  <span className="text-slate-500">
                    Bisa dipindahkan sebagian ke E-Money kapan saja
                  </span>
                </div>
              </div>

              {/* Inline Form Edit Target Tabungan */}
              {editTargetOpen && (
                <form
                  onSubmit={handleSaveTargetTabungan}
                  className="border-t border-slate-200 pt-5 space-y-4"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-2">
                      Pilih Cepat Tujuan Tabungan:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { nama: 'Kitab & Seragam Baru', nominal: 1200000 },
                        { nama: 'Pulang Kampung / Liburan', nominal: 1000000 },
                        { nama: 'Dana Wisuda / Kelulusan', nominal: 2500000 },
                        { nama: 'Study Tour & Ziarah Wali', nominal: 1500000 },
                      ].map((preset) => (
                        <button
                          key={preset.nama}
                          type="button"
                          onClick={() => {
                            setTargetNamaInput(preset.nama);
                            setTargetNominalInput(preset.nominal);
                          }}
                          className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
                        >
                          {preset.nama}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700">
                        Nama Tujuan / Target Tabungan
                      </label>
                      <input
                        type="text"
                        required
                        value={targetNamaInput}
                        onChange={(e) => setTargetNamaInput(e.target.value)}
                        placeholder="Contoh: Kitab & Seragam Baru"
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">
                        Nominal Target (Rp)
                      </label>
                      <input
                        type="number"
                        min={50000}
                        step={50000}
                        required
                        value={targetNominalInput}
                        onChange={(e) => setTargetNominalInput(Number(e.target.value))}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular font-semibold focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditTargetOpen(false)}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                    >
                      Simpan Target Tabungan
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Form Pindah Dana Tabungan ke E-Money */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <ArrowLeftRight className="h-4 w-4 text-emerald-700" />
                    Pindah Dana Tabungan ke E-Money
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Pindahkan sebagian saldo tabungan langsung ke dompet E-Money santri untuk kebutuhan mendesak di kantin/koperasi.
                  </p>
                </div>
              </div>

              <form onSubmit={handlePindahDanaSubmit} className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-7">
                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-1.5">
                      Nominal Cepat Pindah Dana
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[20000, 50000, 100000, 200000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            setPindahNominal(val);
                            setPindahError(null);
                            setPindahSuccess(null);
                          }}
                          className={`rounded-lg border py-2 text-xs font-semibold font-mono-tabular transition-colors ${
                            pindahNominal === val
                              ? 'border-emerald-700 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {formatRupiah(val)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Nominal Pindah Dana (Rp)
                    </label>
                    <input
                      type="number"
                      min={5000}
                      step={5000}
                      required
                      value={pindahNominal}
                      onChange={(e) => {
                        setPindahNominal(Number(e.target.value));
                        setPindahError(null);
                        setPindahSuccess(null);
                      }}
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular font-semibold focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Keterangan Keperluan (Opsional)
                    </label>
                    <input
                      type="text"
                      value={pindahKeterangan}
                      onChange={(e) => setPindahKeterangan(e.target.value)}
                      placeholder="Contoh: Tambahan uang saku beli kitab & kebutuhan kantin"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  {pindahError && (
                    <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                      <span>{pindahError}</span>
                    </div>
                  )}

                  {pindahSuccess && (
                    <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-900">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700 mt-0.5" />
                      <span>{pindahSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
                  >
                    Transfer Tabungan ke E-Money
                  </button>
                </div>

                {/* Live Before/After Saldo Preview */}
                <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-4 h-fit">
                  <p className="text-xs font-semibold text-slate-700">
                    Simulasi Perubahan Saldo
                  </p>
                  <dl className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-500">Tabungan Saat Ini</dt>
                      <dd className="font-semibold text-slate-900 font-mono-tabular">
                        {formatRupiah(activeSantri.saldoTabungan)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-500">Estimasi Sisa Tabungan</dt>
                      <dd
                        className={`font-bold font-mono-tabular ${
                          pindahNominal > activeSantri.saldoTabungan
                            ? 'text-rose-700'
                            : 'text-slate-900'
                        }`}
                      >
                        {pindahNominal > activeSantri.saldoTabungan
                          ? 'Saldo tidak cukup'
                          : formatRupiah(activeSantri.saldoTabungan - (Number(pindahNominal) || 0))}
                      </dd>
                    </div>
                    <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                      <dt className="text-slate-500">E-Money Saat Ini</dt>
                      <dd className="font-semibold text-slate-900 font-mono-tabular">
                        {formatRupiah(activeSantri.saldoEmoney)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="font-medium text-emerald-800">E-Money Setelah Pindah</dt>
                      <dd className="text-base font-bold text-emerald-700 font-mono-tabular">
                        {formatRupiah(activeSantri.saldoEmoney + (Number(pindahNominal) || 0))}
                      </dd>
                    </div>
                  </dl>
                  <p className="text-[11px] leading-relaxed text-slate-500 border-t border-slate-200 pt-3">
                    Transfer otomatis mencatat mutasi keluar di Buku Tabungan dan mutasi Top-Up masuk di riwayat E-Money.
                  </p>
                </div>
              </form>
            </div>

            {/* Tabel Riwayat Mutasi Buku Tabungan */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-emerald-700" />
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Buku Mutasi Tabungan ({filteredTabunganMutasi.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Catatan setoran, penarikan, dan pemindahan dana ke E-Money {activeSantri.namaLengkap}
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
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    Belum ada mutasi buku tabungan untuk filter ini.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                        <th className="px-5 py-3">Tanggal & Waktu</th>
                        <th className="px-4 py-3">Jenis</th>
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
      </section>

      {/* Modal Setor / Tarik Tabungan (Khusus Admin / Bendahara) */}
      {tabunganModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-emerald-700" />
                <h3 className="text-base font-semibold text-slate-900">
                  Transaksi Tabungan Santri
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTabunganModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleTabunganModalSubmit} className="space-y-4 p-6">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{activeSantri.namaLengkap}</p>
                  <p className="text-xs text-slate-500 font-mono-tabular">NIS {activeSantri.nis}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-500">Saldo Tabungan</p>
                  <p className="text-sm font-bold text-emerald-700 font-mono-tabular">
                    {formatRupiah(activeSantri.saldoTabungan)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
                {(['Setor', 'Tarik'] as const).map((jenis) => (
                  <button
                    key={jenis}
                    type="button"
                    onClick={() => {
                      setTabunganJenis(jenis);
                      setTabunganModalError(null);
                    }}
                    className={`rounded-md py-1.5 text-xs font-semibold transition-colors ${
                      tabunganJenis === jenis
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    {jenis === 'Setor' ? 'Setor Tabungan (+)' : 'Tarik Tunai (-)'}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Nominal (Rp)</label>
                <input
                  type="number"
                  min={5000}
                  step={5000}
                  required
                  value={tabunganNominal}
                  onChange={(e) => {
                    setTabunganNominal(Number(e.target.value));
                    setTabunganModalError(null);
                  }}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular font-semibold focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Metode / Sumber
                </label>
                <select
                  value={tabunganMetode}
                  onChange={(e) => setTabunganMetode(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                >
                  <option value="Tunai Bendahara">Tunai di Bendahara Pondok</option>
                  <option value="Transfer Bank Wali">Transfer Bank Wali Santri</option>
                  <option value="Virtual Account Wali">Virtual Account Wali</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  value={tabunganKeterangan}
                  onChange={(e) => setTabunganKeterangan(e.target.value)}
                  placeholder="Contoh: Setoran rutin bulanan / beli kitab"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {tabunganModalError && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{tabunganModalError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setTabunganModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                >
                  {tabunganJenis === 'Setor' ? 'Catat Setoran' : 'Catat Penarikan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top-Up Saldo Modal (Admin / Bendahara) */}
      {topUpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-700" />
                <h3 className="text-base font-semibold text-slate-900">Top-Up Saldo Kartu Santri</h3>
              </div>
              <button
                type="button"
                onClick={() => setTopUpOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!isAdmin ? (
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                  <span>
                    Pengisian ulang (Top-Up) saldo hanya dapat dilakukan oleh <strong>Admin / Bendahara</strong>.
                  </span>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setTopUpOpen(false)}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTopUpSubmit} className="space-y-4 p-6">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {activeSantri.namaLengkap}
                    </p>
                    <p className="text-xs text-slate-500 font-mono-tabular">
                      NIS {activeSantri.nis} · {activeSantri.kelas}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-500">Saldo Saat Ini</p>
                    <p className="text-sm font-bold text-emerald-700 font-mono-tabular">
                      {formatRupiah(activeSantri.saldoEmoney)}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Pilih Nominal Cepat
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[20000, 50000, 100000, 200000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setTopUpNominal(val)}
                        className={`rounded-lg border py-2 text-xs font-semibold font-mono-tabular transition-colors ${
                          topUpNominal === val
                            ? 'border-emerald-700 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {formatRupiah(val)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Atau Masukkan Nominal Bebas (Rp)
                  </label>
                  <input
                    type="number"
                    min={5000}
                    step={5000}
                    required
                    value={topUpNominal}
                    onChange={(e) => setTopUpNominal(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-tabular font-semibold focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Sumber Dana</label>
                  <select
                    value={topUpSumber}
                    onChange={(e) => setTopUpSumber(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="Tunai Bendahara">Tunai di Bendahara Pondok</option>
                    <option value="Transfer Bank Wali">Transfer Bank Wali Santri</option>
                    <option value="Virtual Account Wali">Virtual Account Wali Santri</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Keterangan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={topUpKeterangan}
                    onChange={(e) => setTopUpKeterangan(e.target.value)}
                    placeholder="Contoh: Kiriman uang saku pekan ini"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs">
                  <span className="font-medium text-emerald-900">Estimasi Saldo Setelah Top-Up</span>
                  <span className="text-sm font-bold text-emerald-800 font-mono-tabular">
                    {formatRupiah(activeSantri.saldoEmoney + (Number(topUpNominal) || 0))}
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setTopUpOpen(false)}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                  >
                    Tambah Saldo
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* QR Scan Verification Simulator Modal */}
      {scanSimOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-emerald-700" />
                <h3 className="text-base font-semibold text-slate-900">
                  Simulasi Verifikasi QR Santri
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setScanSimOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setScanMode('absensi')}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                    scanMode === 'absensi'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  Cek Absensi Harian
                </button>
                <button
                  type="button"
                  onClick={() => setScanMode('perizinan')}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                    scanMode === 'perizinan'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  Cek Gerbang / Perizinan
                </button>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <div className="flex items-center gap-3">
                  <SantriAvatar
                    src={activeSantri.fotoUrl}
                    name={activeSantri.namaLengkap}
                    sizeClass="w-12 h-12"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {activeSantri.namaLengkap}
                    </p>
                    <p className="text-xs text-slate-600 font-mono-tabular">
                      NIS {activeSantri.nis} · Saldo {formatRupiah(activeSantri.saldoEmoney)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-emerald-200/70 pt-3">
                  {scanMode === 'absensi' ? (
                    <div className="flex items-start gap-2.5 text-xs text-emerald-900">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700 mt-0.5" />
                      <div>
                        <p className="font-semibold">QR Terverifikasi — Status Santri {activeSantri.status}</p>
                        <p className="mt-0.5 text-emerald-800/80">
                          Siap dicatat untuk presensi KBM, shalat berjamaah, atau halaqah tahfidz ({activeSantri.hafalanJuz} Juz).
                        </p>
                      </div>
                    </div>
                  ) : activeIzin ? (
                    <div className="flex items-start gap-2.5 text-xs text-amber-900">
                      <RefreshCw className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                      <div>
                        <p className="font-semibold">
                          Izin Terdaftar: {activeIzin.jenisIzin} ({activeIzin.status})
                        </p>
                        <p className="mt-0.5 text-amber-800/90">
                          Penjemput: {activeIzin.penjemput} · Rencana kembali: {activeIzin.rencanaKembali.replace('T', ' ')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5 text-xs text-slate-700">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700 mt-0.5" />
                      <div>
                        <p className="font-semibold">Tidak Ada Izin Keluar Aktif</p>
                        <p className="mt-0.5 text-slate-600">
                          Santri terdata berada di lingkungan pondok pesantren. Poin kedisiplinan: {activeSantri.poinKedisiplinan}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <p className="text-[11px] font-semibold text-slate-600">Payload QR Terenkode</p>
                <p className="mt-1 break-all font-mono-tabular text-[11px] text-slate-500">
                  {qrPayload}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
