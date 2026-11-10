# 📋 Setup Cepat - Iuran Warga

## Ringkasan Setup
Fitur Iuran Warga menggunakan **Google Sheet terpisah** dari data transaksi untuk memudahkan pengelolaan data.

## Checklist Setup (Ikuti Urutan!)

### ✅ 1. Buat Google Sheet Baru
- [ ] Buka https://sheets.google.com
- [ ] Buat spreadsheet baru → Namai: "Iuran Warga"
- [ ] Isi data dengan format di bawah

### ✅ 2. Format Data di Sheet Iuran Warga

**Header (Baris 1):**
```
Rumah | Nama | Jan | Feb | Mar | Apr | Mei | Juni | Juli | Agu | Sep | Okt | Nov | Des
```

**Contoh Data (Baris 2 ke bawah):**
```
1/2/3 | Nama Kepala Keluarga | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y
1/2/4 | Nama Kepala Keluarga | Y | Y | Y | - | - | Y | Y | Y | Y | Y | Y | Y
1/2/5 | Nama Kepala Keluarga | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y
```

### ✅ 3. Setup Google Apps Script

**Di Google Sheet "Iuran Warga":**

1. Klik **Tools** → **Script Editor**
2. Hapus semua code
3. **Copy-paste code di bawah:**

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

4. Klik **Deploy** (pojok kanan atas)
5. Pilih **New Deployment**
6. Atur:
   - Type: **Web app**
   - Execute as: **Pilih akun Anda**
   - Who has access: **Anyone**
7. Klik **Deploy**
8. **COPY URL** yang tampil (format: https://script.google.com/macros/s/XXXXX/exec)

### ✅ 4. Update File app.js

Buka file `app.js` di line 3:

**Sebelum:**
```javascript
const SCRIPT_URL_IURAN = 'https://script.google.com/macros/s/YOUR_IURAN_SCRIPT_URL_HERE/exec';
```

**Sesudah (ganti dengan URL dari step 3.8):**
```javascript
const SCRIPT_URL_IURAN = 'https://script.google.com/macros/s/AKfycby123456789ABCD/exec';
```

✅ **Selesai!**

---

## Testing

1. Buka aplikasi di browser
2. Klik menu **Iuran Warga** di sidebar
3. Seharusnya data muncul dalam tabel dengan:
   - ✓ (hijau) = Sudah bayar
   - \- (abu-abu) = Belum bayar

## Tips

- **Tambah Warga Baru**: Tambahkan baris baru di Google Sheet → Refresh browser
- **Ubah Status Iuran**: Edit value di Google Sheet → Refresh browser
- **Backup Data**: Selalu backup Google Sheet secara berkala
- **Performa**: Tabel optimal untuk max 100 warga

## Support

Jika ada error:
1. Periksa console browser (F12 → Console)
2. Cek apakah URL SCRIPT_URL_IURAN sudah benar di app.js
3. Cek struktur data di Google Sheet sesuai format
4. Pastikan Google Apps Script sudah di-deploy dengan akses "Anyone"

---
**Setup Iuran Warga v1.0**
