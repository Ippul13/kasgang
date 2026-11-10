-- Database Schema for dbgang (Cloudflare D1)

-- 1. Table Transactions (Kas)
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tanggal TEXT NOT NULL,
    jenis TEXT NOT NULL,
    nominal REAL NOT NULL,
    keterangan TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table Iuran Warga
CREATE TABLE IF NOT EXISTS iuran (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rumah TEXT NOT NULL UNIQUE,
    nama TEXT NOT NULL,
    jan TEXT DEFAULT '-',
    feb TEXT DEFAULT '-',
    mar TEXT DEFAULT '-',
    apr TEXT DEFAULT '-',
    mei TEXT DEFAULT '-',
    juni TEXT DEFAULT '-',
    juli TEXT DEFAULT '-',
    agu TEXT DEFAULT '-',
    sep TEXT DEFAULT '-',
    okt TEXT DEFAULT '-',
    nov TEXT DEFAULT '-',
    des TEXT DEFAULT '-',
    hut_ri INTEGER DEFAULT 0,
    thr_security INTEGER DEFAULT 0,
    partisipasi_ronda INTEGER DEFAULT 0
);

-- 3. Table Inventaris
CREATE TABLE IF NOT EXISTS inventaris (
    no INTEGER PRIMARY KEY,
    nama TEXT NOT NULL,
    kategori TEXT NOT NULL,
    jumlah INTEGER NOT NULL,
    kondisi TEXT NOT NULL,
    lokasi TEXT NOT NULL,
    keterangan TEXT
);

-- 4. Table Program Kerja
CREATE TABLE IF NOT EXISTS program_kerja (
    no INTEGER PRIMARY KEY,
    program TEXT NOT NULL,
    pic TEXT NOT NULL,
    target TEXT NOT NULL,
    status TEXT NOT NULL,
    keterangan TEXT
);

-- 5. Table Kritik & Saran
CREATE TABLE IF NOT EXISTS kritik_saran (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT DEFAULT 'Anonim',
    alamat TEXT DEFAULT 'Rahasia',
    tanggal TEXT NOT NULL,
    detail TEXT NOT NULL,
    foto TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Table Data Warga
CREATE TABLE IF NOT EXISTS data_warga (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    no_rumah TEXT NOT NULL UNIQUE,
    nama TEXT NOT NULL,
    no_telp TEXT,
    jumlah_anggota INTEGER DEFAULT 1,
    file_kk TEXT,
    file_kk_nama TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Table Galeri Foto (metadata only, file disimpan di R2 bucket galerigang)
CREATE TABLE IF NOT EXISTS galeri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    judul TEXT NOT NULL,
    keterangan TEXT,
    tag TEXT,
    r2_key TEXT NOT NULL,        -- object key di R2, format: galeri/{id}-{timestamp}.{ext}
    foto_nama TEXT,               -- nama file asli dari user
    content_type TEXT DEFAULT 'image/jpeg',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Migration: jika tabel galeri lama sudah ada (dengan kolom foto), jalankan perintah ini:
-- ALTER TABLE galeri ADD COLUMN r2_key TEXT;
-- ALTER TABLE galeri ADD COLUMN content_type TEXT DEFAULT 'image/jpeg';
-- (kemudian drop kolom foto tidak didukung SQLite, buat ulang tabel jika perlu)

INSERT OR IGNORE INTO iuran (rumah, nama, jan, feb, mar, apr, mei, juni, juli, agu, sep, okt, nov, des, hut_ri, thr_security, partisipasi_ronda) VALUES
('E20/01', 'Budi', 'Y', 'Y', 'Y', 'Y', 'Y', '-', '-', '-', '-', '-', '-', '-', 10000, 20000, 5000),
('E20/02', 'Siti', 'Y', 'Y', 'Y', '-', '-', '-', '-', '-', '-', '-', '-', '-', 10000, 20000, 0),
('E20/03', 'Agus', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 10000, 20000, 10000);

INSERT OR IGNORE INTO inventaris (no, nama, kategori, jumlah, kondisi, lokasi, keterangan) VALUES
(1, 'Lampu LED Jalan', 'Penerangan', 8, 'Baik', 'Gang Utama', 'Dipasang 2023'),
(2, 'Tong Sampah Besi', 'Fasilitas', 5, 'Baik', 'Tiap sudut', 'Kapastias 50L');

INSERT OR IGNORE INTO program_kerja (no, program, pic, target, status, keterangan) VALUES
(1, 'Renovasi Jalan Gang', 'Pak Budi', 'Maret 2026', 'Dalam Proses', 'Perbaikan aspal'),
(2, 'Pengecatan Tembok', 'Ibu Siti', 'Februari 2026', 'Selesai', 'Cat biru muda');
