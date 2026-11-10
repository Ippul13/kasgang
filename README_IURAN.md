# Fitur Iuran Warga - Sistem Informasi Kas RT/RW

## Deskripsi
Fitur Iuran Warga menampilkan data checklist pembayaran iuran bulanan dari semua warga dalam bentuk tabel dengan status pembayaran untuk setiap bulan.

Data diambil dari **Google Sheet terpisah** untuk memisahkan data transaksi dan data iuran warga.

## Langkah Setup (PENTING!)

### Langkah 1: Buat Google Sheet Baru untuk Iuran Warga
1. Buka [Google Sheets](https://sheets.google.com)
2. Buat spreadsheet baru bernama **"Iuran Warga"** atau nama lain sesuai keinginan
3. Beri nama sheet pertama "Iuran" (atau biarkan nama defaultnya)

### Langkah 2: Struktur Data di Google Sheet Iuran Warga

## Langkah Setup (PENTING!)

### Langkah 1: Buat Google Sheet Baru untuk Iuran Warga
1. Buka [Google Sheets](https://sheets.google.com)
2. Buat spreadsheet baru bernama **"Iuran Warga"** atau nama lain sesuai keinginan
3. Beri nama sheet pertama "Iuran" (atau biarkan nama defaultnya)

### Langkah 2: Struktur Data di Google Sheet Iuran Warga

Isi spreadsheet dengan kolom header di baris pertama:

| Rumah | Nama | Jan | Feb | Mar | Apr | Mei | Juni | Juli | Agu | Sep | Okt | Nov | Des |
|-------|------|-----|-----|-----|-----|-----|------|------|-----|-----|-----|-----|-----|
| 1/2/3 | Nama Warga | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| 1/2/4 | Nama Warga | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| 1/2/5 | Nama Warga | Y | Y | Y | - | - | Y | Y | Y | Y | Y | Y | Y |

**Catatan:**
- **Rumah** = nomor rumah (misal 1/2/3 = Rumah No 1, Blok 2, RT 3)
- **Nama** = nama pemilik rumah/kepala keluarga
- **Bulan** (Jan-Des) = Gunakan:
  - `Y` atau `✓` atau `V` = Sudah bayar
  - `-` atau kosong = Belum bayar

### Langkah 3: Setup Google Apps Script untuk Iuran Warga
1. Di Google Sheet "Iuran Warga", klik menu **Tools** → **Script Editor**
2. Hapus semua code yang ada
3. Copy-paste code berikut:

```javascript
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0]; // Baris pertama sebagai header
    const records = [];
    
    // Skip header row dan baca data
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) break; // Berhenti di baris kosong
      
      const record = {};
      for (let j = 0; j < headers.length; j++) {
        record[headers[j]] = data[i][j] || '';
      }
      records.push(record);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: records
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### Langkah 4: Deploy Google Apps Script

1. Klik tombol **Deploy** (pojok kanan atas)
2. Pilih **New Deployment**
3. Atur pengaturan:
   - **Type**: Pilih "Web app"
   - **Execute as**: Pilih akun Google Anda
   - **Who has access**: Pilih "Anyone"
4. Klik **Deploy**
5. Salin URL yang muncul di dialog (format: `https://script.google.com/macros/s/XXXXX/exec`)

### Langkah 5: Update URL di File app.js

1. Buka file `app.js` di text editor
2. Cari baris ke-3:
```javascript
const SCRIPT_URL_IURAN = 'https://script.google.com/macros/s/YOUR_IURAN_SCRIPT_URL_HERE/exec';
```
3. Ganti `YOUR_IURAN_SCRIPT_URL_HERE` dengan URL dari Langkah 4
4. Simpan file

Contoh hasil akhir:
```javascript
const SCRIPT_URL_IURAN = 'https://script.google.com/macros/s/AKfycbyrR1234567890/exec';
```

## Cara Menggunakan

### Melihat Data Iuran
1. Buka aplikasi Kas Warga
2. Klik menu **Iuran Warga** di sidebar kiri
3. Tabel akan menampilkan checklist iuran dengan:
   - **No**: Nomor urut
   - **Nomor Rumah / Nama**: Identitas pemilik rumah
   - **Jan-Des**: Status pembayaran per bulan
   - **✓** = Sudah bayar (berwarna hijau)
   - **-** = Belum bayar (berwarna abu-abu)

### Menambah/Mengubah Data Iuran
1. Buka Google Sheet **"Iuran Warga"** Anda
2. Edit data sesuai kebutuhan
3. Tambahkan baris baru dengan format yang benar (Rumah, Nama, Jan, Feb, dst)
4. Refresh halaman aplikasi untuk melihat perubahan

## Troubleshooting

### Halaman Iuran Warga Menampilkan Error
- **Penyebab**: SCRIPT_URL_IURAN belum dikonfigurasi
- **Solusi**: 
  1. Buka `app.js`
  2. Ganti line 3 dengan URL dari Google Apps Script yang sudah di-deploy
  3. Simpan dan refresh halaman

### Data Tidak Muncul
- **Penyebab**: Format data di Google Sheets tidak sesuai
- **Solusi**:
  1. Periksa baris pertama harus berisi: Rumah, Nama, Jan, Feb, Mar, Apr, Mei, Juni, Juli, Agu, Sep, Okt, Nov, Des
  2. Data dimulai dari baris ke-2
  3. Pastikan tidak ada baris kosong di tengah data

### Deploy Google Apps Script Gagal
- Pastikan Anda menggunakan akun Google yang sama
- Coba buat deployment baru (jangan mengubah yang lama)
- Izinkan akses ke Google Sheets di popup yang muncul

## Pembaruan Data
Data iuran akan otomatis dimuat saat:
- ✅ Halaman pertama kali dibuka
- ✅ Anda membuka menu "Iuran Warga"
- ✅ Halaman di-refresh

Untuk melihat perubahan terbaru dari Google Sheets, cukup refresh halaman web.

---
**Dibuat untuk Sistem Informasi Kas RT/RW**

**Versi**: 1.0  
**Terakhir diperbarui**: 2025
