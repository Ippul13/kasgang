# Fitur Login - Sistem Informasi Kas RT/RW

## Deskripsi
Fitur login diimplementasikan untuk melindungi akses ke menu **Input Transaksi**. Hanya pengguna yang telah login yang dapat menginput transaksi baru.

## Kredensial Default
- **Username**: `admin`
- **Password**: `admin123`

## Cara Menggunakan

### Login
1. Klik tombol **"Login Admin"** di sidebar bagian bawah
2. Masukkan username dan password
3. Klik tombol **"Login"**
4. Jika berhasil, Anda akan dialihkan ke menu Input Transaksi

### Logout
1. Setelah login, tombol di sidebar akan berubah menjadi **"Logout"** (berwarna hijau)
2. Klik tombol tersebut untuk logout
3. Anda akan kembali ke halaman Dashboard

## Fitur Keamanan
- ✅ Modal login tidak dapat diakses jika user belum login
- ✅ Menu Input Transaksi dilindungi - hanya bisa dibuka setelah login
- ✅ Validasi username dan password
- ✅ Modal dapat ditutup dengan tombol X atau klik di luar modal

## Mengubah Kredensial
Untuk mengubah username/password, edit file `app.js` baris 30-33:

```javascript
const VALID_CREDENTIALS = {
    username: 'admin',           // Ubah ini
    password: 'admin123'         // Dan ini
};
```

## Integrasi dengan Server
Untuk menggunakan autentikasi dari server, ubah fungsi login di `app.js` (baris 68-102):
- Ganti validasi lokal dengan fetch ke endpoint server
- Simpan token/session dari server
- Gunakan untuk autentikasi API request

---
Dibuat untuk Sistem Informasi Kas RT/RW
