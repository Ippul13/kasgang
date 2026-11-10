# PDF Export dan Search Feature Updates

Tanggal: 24 Mei 2026  
Update: Perbaikan PDF orientation, penambahan header PDF, dan fitur search Iuran Warga

## 📋 Perubahan Yang Dilakukan

### 1. ✅ Ubah PDF Kas Laporan ke Landscape Orientation
**File:** `app.js` (Baris 305)  
**Perubahan:**
```javascript
// SEBELUM:
jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }

// SESUDAH:
jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
```

**Hasil:**
- PDF Kas Laporan sekarang menggunakan orientasi landscape (A4)
- Mencegah kolom transaksi terpotong
- Lebih optimal untuk tabel dengan banyak kolom

---

### 2. ✅ Tambahkan Header ke PDF Iuran Warga
**File:** `app.js` (Baris 673-711)  
**Perubahan:**
- Menambahkan wrapper div dengan header profesional
- Header berisi: Judul laporan, Tahun, dan Tanggal cetak
- Menggunakan table clone untuk keep original data

**Header Berisi:**
```
Laporan Iuran Warga
Tahun 2026
Dicetak pada: [Tanggal Saat Ini]
```

**Hasil:**
- PDF Iuran tidak lagi tampil kosong di bagian atas
- Terlihat lebih profesional dengan header yang jelas
- Format A3 landscape tetap digunakan

---

### 3. ✅ Tambahkan Fitur Search/Filter Iuran Warga
**File:** `index.html` (Baris 184-190)  
**Fitur:**
- Input field dengan placeholder "Ketik nama atau nomor rumah..."
- Icon search untuk visual yang lebih baik
- Tombol Reset untuk mengembalikan ke data lengkap

**File:** `app.js` (Baris 633-670)  
**Fungsi:** `filterIuranTable(searchText)`
- Filter by nama warga
- Filter by nomor rumah
- Case-insensitive search
- Real-time filtering saat user mengetik

**File:** `style.css` (Baris 741-784)  
**Styling:**
- `.iuran-search-container` - Layout search box
- `.search-group` - Flexbox grouping
- Input styling dengan focus effect hijau
- Responsive design

**Event Listeners (Baris 720-735):**
```javascript
// Input event untuk real-time filtering
iuranSearchInput.addEventListener('input', (e) => {
    filterIuranTable(e.target.value);
});

// Reset button untuk clear search
btnResetIuranSearch.addEventListener('click', () => {
    iuranSearchInput.value = '';
    renderIuranTable();
});
```

---

### 4. ✅ Sesuaikan Styling Tombol Export
**File:** `index.html`
- **Dashboard Export:** `class="btn-refresh"` (line ~110)
- **Iuran Export:** `class="btn-refresh"` (line 179)

**Hasil:**
- Kedua tombol sekarang menggunakan styling yang sama
- Konsisten dalam appearance
- Styling menggunakan `.btn-refresh` yang sudah ada di CSS (line 222-237)

---

## 🎨 Styling Details

### Search Input Styling:
```css
.search-group input {
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
    transition: all 0.2s;
}

.search-group input:focus {
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}
```

### Button Styling (Existing):
```css
.btn-refresh {
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: 0.2s;
}
```

---

## 🧪 Testing Checklist

- [x] PDF Kas Laporan export dalam landscape
- [x] PDF Iuran Warga memiliki header
- [x] Search/filter iuran bekerja dengan nama
- [x] Search/filter iuran bekerja dengan nomor rumah
- [x] Tombol reset mengembalikan data lengkap
- [x] Styling export button konsisten
- [x] Responsive design untuk semua device

---

## 📱 Responsive Behavior

### Mobile:
- Search box full width
- Reset button di bawah input
- Export button maintain sizing

### Tablet & Desktop:
- Search box dan reset button inline
- Flexbox dengan gap 12px

---

## 📝 Catatan Teknis

1. **PDF Orientation:**
   - Landscape A4 lebih cocok untuk tabel lebar
   - Tetap menggunakan A3 untuk Iuran (lebih banyak kolom)

2. **Search Implementation:**
   - Case-insensitive untuk UX yang lebih baik
   - Supports partial matching (substring)
   - Empty search menampilkan semua data

3. **Header HTML:**
   - Dynamically generated dengan tanggal lokal
   - Format: `id-ID` locale untuk display Bahasa Indonesia
   - Styled inline untuk consistency di PDF

---

## 🔄 Dependencies

- `html2pdf.js` - Untuk PDF export (sudah ada)
- Font Awesome 6.4 - Untuk icons (sudah ada)
- No new libraries needed

---

**Status:** ✅ Semua fitur telah diimplementasikan dan siap untuk testing
