# Panduan Deploy Worker & Setup Tabel data_warga

## 1. Tambah Tabel data_warga ke D1

Buka **Cloudflare Dashboard** → **D1** → database **dbgang** → tab **Console**, lalu jalankan:

```sql
CREATE TABLE IF NOT EXISTS data_warga (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    no_rumah TEXT NOT NULL UNIQUE,
    nama TEXT NOT NULL,
    no_telp TEXT DEFAULT '',
    jumlah_anggota INTEGER DEFAULT 1,
    file_kk TEXT,
    file_kk_nama TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Klik **Execute** dan pastikan muncul pesan sukses.

---

## 2. Deploy Worker via Wrangler (Terminal/CMD)

Buka terminal, masuk ke folder worker:

```bash
cd d:\kas\testDB\worker
```

Login ke Cloudflare (sekali saja, skip kalau sudah):

```bash
npx wrangler login
```

Deploy worker:

```bash
npx wrangler deploy
```

Output sukses akan terlihat seperti:
```
✅ Successfully published your Worker to:
   https://dbgang-api.cvpts.workers.dev
```

---

## 3. Alternatif Deploy via Cloudflare Dashboard (tanpa Wrangler)

Jika Wrangler tidak bisa dijalankan:

1. Buka [dash.cloudflare.com](https://dash.cloudflare.com)
2. Klik **Workers & Pages** → pilih worker **dbgang-api**
3. Klik **Edit Code**
4. **Hapus semua kode** yang ada di editor
5. **Copy-paste seluruh isi** file `worker/src/index.js`
6. Klik **Deploy** (tombol biru kanan atas)

---

## 4. Verifikasi API Sudah Berjalan

Buka browser dan akses URL berikut — harus muncul JSON:

```
https://dbgang-api.cvpts.workers.dev/api/transactions
https://dbgang-api.cvpts.workers.dev/api/warga
```

Contoh respons `/api/warga` jika berhasil:
```json
{"status":"success","data":[]}
```

Jika muncul error `"table data_warga does not exist"`, berarti langkah 1 (buat tabel) belum dilakukan.

---

## 5. Pastikan D1 Binding di wrangler.toml

File `wrangler.toml` harus berisi binding berikut (sudah ada):

```toml
[[d1_databases]]
binding = "DB"
database_name = "dbgang"
database_id = "f423214c-19a0-4605-9b10-150e05003e56"
```

Kalau deploy via dashboard, binding D1 harus diset di:
**Worker Settings** → **Bindings** → **D1 Database** → nama binding: `DB` → pilih database `dbgang`

---

## Catatan File KK

File KK disimpan sebagai **base64** di kolom `file_kk` (TEXT).  
- Format yang didukung: JPG, PNG, PDF  
- Ukuran maksimal: **2MB** per file  
- Untuk file lebih besar, pertimbangkan migrasi ke Cloudflare R2
