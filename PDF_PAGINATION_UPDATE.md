# Pembaruan Fitur Pagination PDF

## Deskripsi
Fitur pagination PDF telah diimplementasikan untuk mengatasi masalah data tabel yang terpotong saat export ke PDF, terutama ketika data lebih dari 30 baris.

## Perubahan yang Dilakukan

### 1. **Export Transaksi PDF (`exportToPDF`)**
- **Sebelumnya**: Semua data transaksi ditampilkan dalam satu halaman PDF, menyebabkan data terpotong ketika ada lebih dari ~60 baris
- **Sekarang**: 
  - Data dipecah menjadi beberapa halaman dengan **30 baris per halaman**
  - Setiap halaman memiliki header lengkap (judul, tanggal, filter yang digunakan)
  - Nomor halaman ditampilkan (e.g., "Halaman 1 dari 5")
  - Ringkasan (Pemasukan, Pengeluaran, Saldo) hanya ditampilkan di halaman terakhir
  - Menggunakan `page-break-after` untuk pemisahan halaman otomatis

### 2. **Export Iuran PDF (`exportIuranToPDF`)**
- **Sebelumnya**: Seluruh tabel iuran warga dalam satu halaman, data sering terpotong
- **Sekarang**:
  - Data dipecah menjadi halaman dengan **30 baris per halaman**
  - Setiap halaman memiliki header terpisah dengan nomor halaman
  - Tabel dibangun secara dinamis per halaman dengan styling yang konsisten
  - Format: A2 landscape (lebih lebar dari A3) untuk accommodate 14 kolom (No + Nama + 12 bulan)

## Fitur Utama Pagination

### Batasan per Halaman
- **Transaksi**: 30 baris per halaman
- **Iuran Warga**: 30 baris per halaman

### Elemen yang Dipertahankan
- Header informasi lengkap setiap halaman
- Nomor halaman otomatis
- Styling konsisten antar halaman
- Format kertas landscape (lebih cocok untuk tabel lebar)

### Keuntungan
✅ Data tidak terpotong saat dicetak atau di-export ke PDF  
✅ Lebih mudah dibaca dengan data terbagi ke halaman  
✅ Nomor halaman membantu tracking dokumen panjang  
✅ Kompatibel dengan semua printer dan PDF viewer  
✅ Cocok untuk data dengan 100+ baris  

## Testing
Fitur ini telah diuji dengan data yang berbeda:
- ✅ Data kecil (< 30 baris) - tetap 1 halaman
- ✅ Data sedang (30-60 baris) - 2 halaman
- ✅ Data besar (100+ baris) - multiple halaman

## Format Dokumen
- **Transaksi**: A3 Landscape
- **Iuran**: A2 Landscape (lebih lebar untuk kolom bulan)

## Catatan Teknis
- Menggunakan CSS `page-break-after: always` untuk pemisahan halaman
- Kompatibel dengan library `html2pdf.js` yang sudah digunakan
- Tidak memerlukan dependency tambahan
- Responsive dan cocok untuk semua ukuran data
