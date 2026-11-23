export type UserRole = 'admin' | 'pengurus' | 'wali';
export type UserStatus = 'Aktif' | 'Nonaktif';

export interface AppUser {
  id: string;
  nama: string;
  username: string;
  jabatan: string;
  role: UserRole;
  email: string;
  telepon: string;
  avatarUrl: string;
  bidangTugas: string;
  status: UserStatus;
  password?: string;
  santriId?: string;
}

export type JenisKelamin = 'Laki-laki' | 'Perempuan';
export type StatusSantri = 'Aktif' | 'Cuti' | 'Alumni';

export interface Santri {
  id: string;
  nis: string;
  namaLengkap: string;
  jenisKelamin: JenisKelamin;
  tempatLahir: string;
  tanggalLahir: string; // YYYY-MM-DD
  kelas: string;
  asrama: string;
  kamar: string;
  namaWali: string;
  hubunganWali: string;
  teleponWali: string;
  alamat: string;
  tahunMasuk: number;
  status: StatusSantri;
  fotoUrl: string;
  hafalanJuz: number;
  poinKedisiplinan: number; // Base 100
  saldoEmoney: number;
  limitHarian: number;
  pinKartu: string; // 6-digit PIN
  saldoTabungan: number;
  targetTabunganNama: string;
  targetTabunganNominal: number;
}

export type JenisMutasi = 'Top-Up' | 'Pembayaran';

export interface MutasiSaldo {
  id: string;
  santriId: string;
  tanggalWaktu: string; // YYYY-MM-DDTHH:mm:ss
  jenis: JenisMutasi;
  nominal: number;
  keterangan: string;
  sumberAtauLokasi: string;
  saldoAkhir: number;
  dicatatOleh: string;
}

export type JenisMutasiTabungan = 'Setor' | 'Tarik' | 'Pindah ke E-Money';

export interface MutasiTabungan {
  id: string;
  santriId: string;
  tanggalWaktu: string; // YYYY-MM-DDTHH:mm:ss
  jenis: JenisMutasiTabungan;
  nominal: number;
  keterangan: string;
  sumberAtauMetode: string;
  saldoAkhir: number;
  dicatatOleh: string;
}

export type JenisTagihan = 'SPP Bulanan' | 'Uang Makan';
export type StatusPembayaran = 'Lunas' | 'Belum Lunas';
export type MetodePembayaran = 'Transfer Bank' | 'Tunai Bendahara' | 'Virtual Account';

export interface PembayaranTagihan {
  id: string;
  santriId: string;
  jenis: JenisTagihan;
  bulan: string; // e.g. 'November 2026'
  periodeKey: string; // e.g. '2026-11'
  nominal: number;
  status: StatusPembayaran;
  tanggalBayar?: string;
  metodeBayar?: MetodePembayaran;
  nomorKuitansi?: string;
  dicatatOleh?: string;
}

export type JenisIzin = 'Izin Pulang' | 'Izin Sakit' | 'Izin Kegiatan' | 'Izin Keperluan Keluarga';
export type StatusIzin = 'Menunggu Persetujuan' | 'Sedang Keluar' | 'Sudah Kembali' | 'Terlambat';

export interface PerizinanSantri {
  id: string;
  santriId: string;
  jenisIzin: JenisIzin;
  alasan: string;
  penjemput: string;
  tanggalKeluar: string; // ISO or YYYY-MM-DD HH:mm
  rencanaKembali: string;
  waktuKembaliAktual?: string;
  status: StatusIzin;
  disetujuiOleh?: string;
}

export type KategoriKedisiplinan = 'Pelanggaran Ringan' | 'Pelanggaran Sedang' | 'Pelanggaran Berat' | 'Prestasi & Kebajikan';

export interface CatatanKedisiplinan {
  id: string;
  santriId: string;
  tanggal: string;
  kategori: KategoriKedisiplinan;
  deskripsi: string;
  poinPerubahan: number; // negative for violation, positive for achievement
  tindakLanjut: string;
  dicatatOleh: string;
}

export interface KehadiranHarian {
  tanggal: string; // YYYY-MM-DD
  labelHari: string;
  hadir: number;
  izin: number;
  sakit: number;
  alpha: number;
}

export interface UstadzPengajar {
  id: string;
  nip: string;
  nama: string;
  bidangStudi: string;
  amanah: string;
  pendidikan: string;
  status: 'Tetap' | 'Pengabdian';
  telepon: string;
}

export interface AsramaInfo {
  id: string;
  nama: string;
  kategori: 'Putra' | 'Putri';
  jumlahKamar: number;
  kapasitas: number;
  musyrif: string;
  keterangan?: string;
}

export interface ProfilPesantren {
  namaPesantren: string;
  singkatan: string;
  nspp: string;
  npsn: string;
  tahunBerdiri: number;
  pengasuh: string;
  akreditasi: string;
  motto: string;
  alamat: string;
  kota: string;
  provinsi: string;
  telepon: string;
  email: string;
  website: string;
  visi: string;
  misi: string[];
  bannerUrl: string;
  logoUrl?: string;
  asramaList: AsramaInfo[];
}

export type ActiveTab =
  | 'dashboard'
  | 'santri'
  | 'kartu'
  | 'tabungan'
  | 'keuangan'
  | 'perizinan'
  | 'pengguna'
  | 'profil';
