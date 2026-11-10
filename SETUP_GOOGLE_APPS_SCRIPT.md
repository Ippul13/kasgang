# Panduan Setup Google Apps Script untuk Program Kerja dan Inventaris

## Langkah-langkah Setup:

### 1. PROGRAM KERJA Sheet
1. Buka Google Sheet untuk Program Kerja (URL: https://script.google.com/macros/s/AKfycbwbz_fcvxPW8upmnjE4ugtYZXbjNs-7K5zbjAKDre0Od3U1jgnaQbxF7FFXNi9Do1V5CA/exec)
2. Di sheet, pastikan header sudah ada di baris pertama dengan kolom:
   - **no** | **program** | **pic** | **target** | **status** | **keterangan**
3. Isi data dummy di baris 2 dan seterusnya
4. Klik menu **Tools → Script editor**
5. Hapus semua kode yang ada, salin kode dari file `APPS_SCRIPT_PROGRAM_KERJA.js`
6. Klik **Deploy → New deployment**
7. Pilih type: **Web app**
8. Execute as: **Your Google Account**
9. Who has access: **Anyone**
10. Klik **Deploy**
11. Copy URL yang muncul dan gunakan sebagai SCRIPT_URL_PROGRAM

### 2. INVENTARIS Sheet
1. Buka Google Sheet untuk Inventaris (URL: https://script.google.com/macros/s/AKfycbyifFQmlZseHSasnmfTrPmpA6t_XvSwD3OI9WHpqAg6ymb9EFN05FdmP-u1PLEiMNBE/exec)
2. Di sheet, pastikan header sudah ada di baris pertama dengan kolom:
   - **no** | **nama** | **kategori** | **jumlah** | **kondisi** | **lokasi** | **keterangan**
3. Isi data dummy di baris 2 dan seterusnya
4. Klik menu **Tools → Script editor**
5. Hapus semua kode yang ada, salin kode dari file `APPS_SCRIPT_INVENTARIS.js`
6. Klik **Deploy → New deployment**
7. Pilih type: **Web app**
8. Execute as: **Your Google Account**
9. Who has access: **Anyone**
10. Klik **Deploy**
11. Copy URL yang muncul dan gunakan sebagai SCRIPT_URL_INVENTARIS

### 3. Update app.js (Opsional)
Pastikan constants di app.js sudah sesuai dengan URL yang di-deploy:
```javascript
const SCRIPT_URL_PROGRAM = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/usercontent/exec';
const SCRIPT_URL_INVENTARIS = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/usercontent/exec';
```

## Format Data di Sheet:

### Program Kerja:
| no | program | pic | target | status | keterangan |
|----|---------|-----|--------|--------|-----------|
| 1 | Renovasi Jalan Gang | Pak Budi | Maret 2026 | Dalam Proses | Perbaikan aspal |
| 2 | Pengecatan Tembok | Ibu Siti | Februari 2026 | Selesai | Cat biru muda |

### Inventaris:
| no | nama | kategori | jumlah | kondisi | lokasi | keterangan |
|----|------|----------|--------|---------|--------|-----------|
| 1 | Lampu LED Jalan | Penerangan | 8 | Baik | Gang Utama | Dipasang 2023 |
| 2 | Tong Sampah Besi | Fasilitas | 5 | Baik | Tiap sudut | Kapasitas 50L |

## Testing:
1. Setelah deploy, buka URL deployment di browser
2. Anda akan melihat JSON response dengan data dari sheet
3. Jika sudah bekerja, data akan muncul di web app

## Troubleshooting:
- Jika data tidak muncul, pastikan header di sheet sesuai dengan kode
- Jika error 404, URL deployment mungkin salah
- Jika data kosong, pastikan sheet tidak kosong dan header di baris pertama
