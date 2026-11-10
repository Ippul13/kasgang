# Fitur Baru: Inventaris dan Program Kerja

## Deskripsi
Telah ditambahkan 2 menu baru dalam aplikasi Sistem Informasi Kas RT/RW:
1. **Inventaris** - Untuk menampilkan daftar barang/peralatan gang
2. **Program Kerja** - Untuk menampilkan program kerja tahunan gang

Kedua menu ini menggunakan data dummy dan dapat diakses oleh semua user (tidak memerlukan login admin).

## Fitur yang Ditambahkan

### 1. Menu Inventaris
- **Akses**: Menu di sidebar → Inventaris
- **Data**: 8 item inventaris dummy dengan informasi:
  - Nomor item
  - Nama barang
  - Kategori (Penerangan, Fasilitas, Peralatan, dsb)
  - Jumlah
  - Kondisi (Baik, Cukup, Rusak) dengan badge berwarna
  - Lokasi penyimpanan
  - Keterangan tambahan

- **Status Badge Kondisi**:
  - 🟢 **Baik** - Hijau (status-good)
  - 🟡 **Cukup** - Kuning (status-fair)
  - 🔴 **Rusak** - Merah (status-poor)

### 2. Menu Program Kerja
- **Akses**: Menu di sidebar → Program Kerja
- **Data**: 8 program kerja dummy dengan informasi:
  - Nomor urut
  - Nama program kerja
  - PIC (Penanggung Jawab)
  - Target waktu
  - Status dengan badge berwarna
  - Keterangan deskripsi

- **Status Badge Program**:
  - 🟢 **Selesai** - Hijau (status-done)
  - 🔵 **Dalam Proses** - Biru (status-in-progress)
  - 🟣 **Berkelanjutan** - Ungu (status-ongoing)
  - 🟪 **Belum Dimulai** - Ungu muda (status-pending)

## Data Dummy Inventaris

| No | Barang | Kategori | Jumlah | Kondisi | Lokasi |
|----|--------|----------|--------|---------|--------|
| 1 | Lampu LED Jalan | Penerangan | 8 | Baik | Gang Utama |
| 2 | Tong Sampah Besi | Fasilitas | 5 | Baik | Tiap sudut gang |
| 3 | Kursi Plastik | Peralatan Rapat | 20 | Baik | Rumah Ketua RT |
| 4 | Meja Pertemuan | Peralatan Rapat | 2 | Baik | Rumah Ketua RT |
| 5 | Genset 3000 Watt | Peralatan | 1 | Baik | Gudang |
| 6 | Sound System Portable | Peralatan | 1 | Baik | Gudang |
| 7 | Tabung Apar 5Kg | Keselamatan | 3 | Baik | Pos RT |
| 8 | Sapu dan Kemoceng | Perlengkapan Kebersihan | 12 | Cukup | Pos RT |

## Data Dummy Program Kerja

| No | Program | PIC | Target | Status |
|----|---------|-----|--------|--------|
| 1 | Renovasi Jalan Gang | Pak Budi | Maret 2026 | Dalam Proses |
| 2 | Pengecatan Tembok Gang | Ibu Siti | Februari 2026 | Selesai |
| 3 | Pemasangan CCTV | Pak Hendra | April 2026 | Belum Dimulai |
| 4 | Pemeliharaan Lampu Jalan | Pak Doni | Setiap Bulan | Berkelanjutan |
| 5 | Program Sedekah Sampah | Ibu Rini | Jan - Des | Berkelanjutan |
| 6 | Senam Pagi Bersama | Ibu Tuti | Setiap Minggu | Berkelanjutan |
| 7 | Arisan Keluarga Besar | Ibu Dewi | Bulan Ganjil | Berkelanjutan |
| 8 | Pelatihan Tanggap Bencana | Pak Ari | Juni 2026 | Belum Dimulai |

## Perubahan File

### 1. **index.html**
- Tambah item menu di sidebar untuk Inventaris dan Program Kerja
- Tambah section HTML untuk tampilan Inventaris (id: inventaris)
- Tambah section HTML untuk tampilan Program Kerja (id: program)
- Kedua section menggunakan tabel untuk menampilkan data

### 2. **app.js**
- Tambah array data dummy: `inventarisData`
- Tambah array data dummy: `programKerjaData`
- Tambah fungsi `renderInventarisTable()` - untuk populate tabel inventaris
- Tambah fungsi `renderProgramKerjaTable()` - untuk populate tabel program kerja
- Panggil kedua fungsi render dalam event `DOMContentLoaded`

### 3. **style.css**
- Tambah CSS untuk `.status-badge` dengan berbagai variant (good, fair, poor, done, in-progress, ongoing, pending)
- Tambah CSS untuk `.inventaris-container`
- Tambah CSS untuk `.program-container`

## Cara Menggunakan

1. **Lihat Inventaris**:
   - Klik menu "Inventaris" di sidebar
   - Lihat daftar barang/peralatan dengan kondisinya

2. **Lihat Program Kerja**:
   - Klik menu "Program Kerja" di sidebar
   - Lihat daftar program kerja dengan status dan PIC-nya

## Integrasi Data Real

Untuk mengintegrasikan dengan data real dari Google Sheets, edit fungsi `renderInventarisTable()` dan `renderProgramKerjaTable()` untuk:
- Fetch data dari API/Google Sheets
- Replace array dummy dengan data yang diambil dari server
- Tambahkan error handling jika data tidak tersedia

## Styling

Semua elemen mengikuti design system yang sudah ada:
- Warna sesuai dengan color scheme aplikasi
- Typography konsisten menggunakan Inter font
- Responsive design untuk mobile dan desktop
- Badge status dengan warna yang mudah dipahami

## Catatan

- Data saat ini adalah dummy untuk demo purposes
- Tidak ada fitur edit/delete/add untuk data dummy (hanya read-only)
- Bisa dikembangkan lebih lanjut dengan fitur CRUD jika diperlukan
- Tabel menggunakan styling yang sama dengan tabel lain di aplikasi
