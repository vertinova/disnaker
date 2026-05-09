# Berita Acara Verifikasi - Konfigurasi dan Penggunaan

## 📋 Deskripsi
Fitur generate Berita Acara Verifikasi untuk Proposal Bantuan Keuangan dengan format resmi sesuai standar pemerintahan.

## 🗂️ Struktur File

### Backend
- **Service**: `src/services/beritaAcaraService.js` - PDF generation logic
- **Controller**: `src/controllers/bankeuVerification.controller.js` - API endpoint
- **Migration**: `database-express/migrations/031_create_kecamatan_config_table.sql`
- **Setup SQL**: `SETUP_KECAMATAN_CONFIG.sql` - Quick setup script

### Frontend
- **Page**: `dpmd-frontend/src/pages/kecamatan/bankeu/BankeuVerificationDetailPage.jsx`
- **Function**: `handleGenerateBeritaAcara()` (lines 570-660)

## 📊 Database Schema

### Tabel: `kecamatan_config`
Konfigurasi kop surat per kecamatan:
```sql
- id (PK)
- kecamatan_id (FK -> kecamatans.id, UNIQUE)
- nama_kecamatan VARCHAR(255)
- nama_camat VARCHAR(255)
- nip_camat VARCHAR(50)
- logo_path VARCHAR(255) - Path ke logo kecamatan
- alamat TEXT - Alamat lengkap untuk kop surat
- created_at, updated_at
```

### Tabel: `tim_verifikasi_kecamatan`
Anggota tim verifikasi per kecamatan:
```sql
- id (PK)
- kecamatan_id (FK -> kecamatans.id)
- jabatan ENUM('ketua', 'sekretaris', 'anggota')
- nama VARCHAR(255)
- nip VARCHAR(50)
- urutan TINYINT - Urutan tampil di PDF
- is_active BOOLEAN
- created_at, updated_at
```

## ⚙️ Instalasi

### 1. Jalankan Migration
Buka HeidiSQL atau phpMyAdmin, pilih database `dpmd`, kemudian jalankan query dari file:
```
SETUP_KECAMATAN_CONFIG.sql
```

### 2. Konfigurasi Kecamatan
Insert data kecamatan Anda:
```sql
INSERT INTO kecamatan_config (kecamatan_id, nama_kecamatan, nama_camat, nip_camat, alamat) 
VALUES (1, 'CIOMAS', 'Drs. H. NAMA CAMAT, M.Si', '196501011990031001', 'Jl. Raya Ciomas No. 123, Kabupaten Bogor, Jawa Barat');
```

### 3. Konfigurasi Tim Verifikasi
Insert 5 anggota tim (1 ketua, 1 sekretaris, 3 anggota):
```sql
INSERT INTO tim_verifikasi_kecamatan (kecamatan_id, jabatan, nama, nip, urutan) VALUES
(1, 'ketua', 'Nama Ketua Tim', '196501011990031001', 1),
(1, 'sekretaris', 'Nama Sekretaris', '197001011995031001', 2),
(1, 'anggota', 'Nama Anggota 1', '197501012000031001', 3),
(1, 'anggota', 'Nama Anggota 2', '198001012005031001', 4),
(1, 'anggota', 'Nama Anggota 3', '198501012010031001', 5);
```

**Catatan:** Sesuaikan `kecamatan_id` dengan ID kecamatan yang ada di database Anda.

## 📄 Format Dokumen PDF

### Halaman 1: Berita Acara dan Checklist
```
┌──────────────────────────────────────────┐
│     PEMERINTAH KABUPATEN BOGOR           │
│         KECAMATAN CIOMAS                 │
│   Jl. Raya Ciomas, Kabupaten Bogor       │
├══════════════════════════════════════════┤
│                                          │
│      BERITA ACARA VERIFIKASI             │
│ PROPOSAL PERMOHONAN BANTUAN KEUANGAN     │
│    KHUSUS AKSELERASI PEMBANGUNAN         │
│         PERDESAAN                        │
│      TAHUN ANGGARAN 2025                 │
│                                          │
├──────────────────────────────────────────┤
│ Pada hari ini, [tanggal], Kami Tim       │
│ Verifikasi Kecamatan [nama] telah        │
│ melakukan verifikasi...                  │
│                                          │
│ Desa: [Nama Desa]                        │
│ Jumlah Kegiatan: [x] Kegiatan            │
│                                          │
├──────────────────────────────────────────┤
│ NO │ URAIAN              │ √/- │ KET    │
├────┼─────────────────────┼─────┼────────┤
│ 1  │ Proposal telah...   │  √  │        │
│ 2  │ Foto copy dokumen.. │  √  │        │
│ 3  │ RAB sesuai format.. │  √  │        │
│ ...                                      │
│ 13 │ Proposal dapat...   │  √  │        │
└──────────────────────────────────────────┘
```

### Halaman 2: Tanda Tangan
```
┌──────────────────────────────────────────┐
│     TIM VERIFIKASI KECAMATAN             │
│                                          │
│ Ketua     : [Nama]                       │
│             NIP. [NIP]                   │
│             *Tanda tangan dan nama       │
│                                          │
│ Sekretaris: [Nama]                       │
│             NIP. [NIP]                   │
│             *Tanda tangan dan nama       │
│                                          │
│ Anggota 1 : [Nama]                       │
│             NIP. [NIP]                   │
│             *Tanda tangan dan nama       │
│                                          │
│ Anggota 2 : [Nama]                       │
│             NIP. [NIP]                   │
│             *Tanda tangan dan nama       │
│                                          │
│ Anggota 3 : [Nama]                       │
│             NIP. [NIP]                   │
│             *Tanda tangan dan nama       │
│                                          │
├──────────────────────────────────────────┤
│       PENANGGUNG JAWAB                   │
│                                          │
│ CAMAT     : [Nama Camat]                 │
│             NIP. [NIP Camat]             │
│             *Tanda tangan dan nama       │
└──────────────────────────────────────────┘
```

## 🚀 Cara Penggunaan

### Di Frontend (Kecamatan)
1. Buka halaman Verifikasi Detail Desa
2. Scroll ke bawah hingga menemukan tombol **"Download Berita Acara"**
3. Klik tombol tersebut
4. Sistem akan konfirmasi via SweetAlert
5. Klik "Ya, Generate!" untuk membuat PDF
6. File PDF akan tersimpan dan link download muncul

### API Endpoint
```
POST /api/kecamatan/bankeu/desa/:desaId/berita-acara
Headers: Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Berita Acara berhasil dibuat",
  "data": {
    "file_path": "/uploads/berita-acara-123-1234567890.pdf",
    "desa_nama": "Desa Sukamaju",
    "download_url": "/storage/uploads/berita-acara-123-1234567890.pdf"
  }
}
```

## 🔧 Kustomisasi

### Menambah/Edit Anggota Tim
```sql
-- Update nama anggota
UPDATE tim_verifikasi_kecamatan 
SET nama = 'Nama Baru', nip = 'NIP Baru' 
WHERE kecamatan_id = 1 AND jabatan = 'ketua';

-- Tambah anggota baru (jika butuh lebih dari 3)
INSERT INTO tim_verifikasi_kecamatan (kecamatan_id, jabatan, nama, nip, urutan) 
VALUES (1, 'anggota', 'Nama Anggota 4', '198501012010031001', 6);

-- Nonaktifkan anggota
UPDATE tim_verifikasi_kecamatan 
SET is_active = FALSE 
WHERE id = 5;
```

### Mengganti Logo Kecamatan
1. Upload logo ke folder `storage/uploads/kecamatan/logos/`
2. Update database:
```sql
UPDATE kecamatan_config 
SET logo_path = 'kecamatan/logos/logo-ciomas.png' 
WHERE kecamatan_id = 1;
```

### Mengedit Checklist Verifikasi
Edit file `src/services/beritaAcaraService.js` pada array `checklistItems` (line ~330):
```javascript
const checklistItems = [
  'Item checklist 1',
  'Item checklist 2',
  // ... tambah/edit sesuai kebutuhan
];
```

## 📝 Catatan Penting

1. **Satu Konfigurasi per Kecamatan**: Setiap kecamatan hanya boleh punya 1 record di `kecamatan_config` (UNIQUE constraint)

2. **Tim Verifikasi**: Minimal 5 anggota (1 ketua, 1 sekretaris, 3 anggota). Bisa ditambah lebih banyak.

3. **Default Values**: Jika belum ada konfigurasi, sistem akan menggunakan nilai default:
   - Nama Kecamatan: dari tabel `kecamatans`
   - Camat: "CAMAT"
   - Tim: "KETUA TIM", "SEKRETARIS", "ANGGOTA 1/2/3"

4. **File Storage**: PDF disimpan di `storage/uploads/` dengan nama:
   ```
   berita-acara-{desaId}-{timestamp}.pdf
   ```

5. **Update Proposals**: Setelah generate, kolom `berita_acara_path` dan `berita_acara_generated_at` di tabel `bankeu_proposals` akan diupdate.

## 🐛 Troubleshooting

### Error: "User tidak terkait dengan kecamatan"
**Solusi**: Pastikan user yang login memiliki `kecamatan_id` di tabel `users`.

### Error: "Desa tidak ditemukan"
**Solusi**: Pastikan desa yang dipilih memang berada di bawah kecamatan user yang login.

### PDF kosong atau error
**Solusi**: 
1. Pastikan folder `storage/uploads/` writable
2. Check log di console backend
3. Pastikan PDFKit terinstall: `npm list pdfkit`

### Nama tim/camat tidak muncul
**Solusi**: Pastikan sudah insert data ke `kecamatan_config` dan `tim_verifikasi_kecamatan` untuk `kecamatan_id` yang sesuai.

## 📞 Support

Jika ada pertanyaan atau masalah, check:
1. Backend logs: `logs/combined.log`
2. Frontend console (F12)
3. Database query log

---

**Created**: 2026-01-27  
**Version**: 1.0.0  
**Author**: System  
**Last Updated**: 2026-01-27
