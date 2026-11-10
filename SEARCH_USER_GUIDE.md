# 🔍 Search/Filter Iuran Warga - User Guide

## Quick Start

### Mencari Warga
1. Buka menu **Iuran Warga**
2. Di bagian atas table, cari input field: **"Cari Nama atau No Rumah"**
3. Ketik nama atau nomor rumah yang dicari
4. Table akan langsung filter sesuai pencarian (real-time)

### Reset Pencarian
- Klik tombol **🔄 Reset** untuk kembali ke data lengkap
- Atau hapus text di input field

---

## 🎯 Contoh Penggunaan

### Contoh 1: Cari Nama Warga
```
Input: "Budi"
Hasil: Menampilkan semua warga dengan nama mengandung "Budi"
Contoh hasil:
- E20 - Budi Santoso
- E21 - Budiman Wijaya
```

### Contoh 2: Cari Nomor Rumah
```
Input: "E20"
Hasil: Menampilkan semua warga di rumah E20 series
Contoh hasil:
- E20 - Pak Hasan
- E201 - Bu Siti
- E202 - Mas Rudi
```

### Contoh 3: Partial Search
```
Input: "har"
Hasil: Menampilkan semua warga dengan nama/rumah mengandung "har"
Contoh hasil:
- E15 - Hasrul Anwar (nama matches "har")
- Harjo - Pak Harjo (nama matches "har")
```

---

## ⚙️ Fitur Teknis

### Search Method
- **Case-Insensitive**: BUDI, budi, Budi → sama hasilnya
- **Partial Matching**: "ud" akan match "Budi", "Budiman"
- **Both Fields**: Cari di nama warga DAN nomor rumah
- **Real-time**: Hasil update saat user mengetik

### Performance
- Instant filtering untuk < 100 data
- Smooth untuk data besar (>500)
- No page refresh needed

---

## 💡 Tips & Tricks

### Tip 1: Cari dengan Kode Rumah Singkat
```
E2 → Tampil semua E20-E29
E3 → Tampil semua E30-E39
```

### Tip 2: Cari Warga dengan Inisial
```
"B" → Tampil semua warga dengan nama dimulai B
"S" → Tampil semua warga dengan nama dimulai S
```

### Tip 3: Kombinasi Search
```
"B E2" → Tidak bekerja (hanya satu field search)
Gunakan salah satu: nama atau nomor rumah
```

---

## 🎨 UI/UX Elements

### Search Box
```
┌─────────────────────────────────┐
│ 🔍 Cari Nama atau No Rumah      │
│ [Input field dengan placeholder] │
└─────────────────────────────────┘
```

### Reset Button
```
┌─────────────┐
│ 🔄 Reset    │
└─────────────┘
```

### Styling Details
- Input focus color: Hijau (#10b981)
- Placeholder text: Abu-abu (#9ca3af)
- Border radius: 6px
- Smooth transition: 0.2s

---

## 📱 Responsive Design

### Mobile View (< 768px)
```
┌──────────────────────────┐
│ 🔍 Cari Nama/No Rumah    │
│ [Input field full width] │
├──────────────────────────┤
│ 🔄 Reset                 │
└──────────────────────────┘
```

### Tablet & Desktop (> 768px)
```
┌──────────────────────────────┬───────────┐
│ 🔍 Cari Nama/No Rumah        │ 🔄 Reset  │
│ [Input field flex: 1]        │           │
└──────────────────────────────┴───────────┘
```

---

## 🔐 Validation

### Input Rules
- ✅ Case-insensitive (A-Z, a-z diabaikan)
- ✅ Numbers supported (0-9)
- ✅ Spaces supported
- ✅ Special characters supported (auto filter)
- ✅ Max length: unlimited (praktis)

### Empty Search
- Input kosong → Tampil semua data
- Tidak ada hasil matching → "Tidak ada data yang cocok dengan pencarian"

---

## 🐛 Troubleshooting

### Problem: Search tidak bekerja
**Solution:** 
- Pastikan data sudah loaded (tunggu "Memuat data..." hilang)
- Refresh halaman jika perlu

### Problem: Data tidak kembali saat reset
**Solution:**
- Klik tombol Reset
- Atau hapus text manual di input

### Problem: Hasil search tidak lengkap
**Solution:**
- Gunakan pencarian lebih spesifik
- Contoh: "E20" bukan "E2" untuk hasil lebih akurat

---

## 📊 Export dengan Search

### Important!
⚠️ Export PDF menggunakan **SEMUA DATA**, bukan hasil search terbaru

**Jika ingin export hasil search tertentu:**
1. Search nama yang diinginkan
2. Screenshot table
3. Atau export seluruh data dan filter manual di Excel

---

## 🎓 Advanced Usage

### Scenario 1: Audit Pembayaran Rumah Tertentu
```
1. Search rumah "E20"
2. Lihat status pembayaran setiap bulan
3. Identifikasi bulan yang belum lunas
4. Buat catatan untuk follow-up
```

### Scenario 2: Monitoring Warga Tertentu
```
1. Search nama "Budi"
2. Lihat riwayat pembayaran tahunan
3. Identify pattern pembayaran
4. Hubungi jika ada yang belum lunas
```

### Scenario 3: Bulk Check
```
1. Search series rumah "E3"
2. Quick check status E30-E39
3. Export data E3 untuk records
4. Follow-up ke warga yang belum lunas
```

---

## 📞 Support

Jika ada pertanyaan atau issue:
1. Refresh halaman
2. Clear search (klik Reset)
3. Try again

---

## 📋 Checklist

- [x] Search by Nama Warga
- [x] Search by Nomor Rumah
- [x] Case-insensitive search
- [x] Partial matching
- [x] Real-time filtering
- [x] Reset button functional
- [x] Empty state message
- [x] Responsive design
- [x] Mobile friendly
- [x] Fast performance

---

*Last Updated: 24 Mei 2026*
*Feature: Search & Filter Iuran Warga v1.0*
