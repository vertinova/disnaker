# Integrasi Profil Verifikator dengan Proposal Bankeu

**Tanggal**: 5 Februari 2026  
**Fitur**: Sinkronisasi data verifikator dengan proposal yang diverifikasi

## Overview

Setiap proposal yang diverifikasi oleh verifikator dinas akan menyimpan referensi ke verifikator tersebut, sehingga saat kecamatan membuat berita acara, data verifikator (nama, jabatan, pangkat/golongan, dan tanda tangan) dapat ditampilkan secara otomatis.

## Database Structure

### Tabel: `bankeu_proposals`
Field yang menyimpan referensi verifikator:
```sql
dinas_verified_by INT NULL  -- user_id dari verifikator yang melakukan verifikasi
dinas_verified_at TIMESTAMP NULL
```

### Tabel: `dinas_verifikator`
Menyimpan profil lengkap verifikator:
```sql
id BIGINT PRIMARY KEY
dinas_id BIGINT
user_id BIGINT -- link ke users.id
nama VARCHAR(255)
nip VARCHAR(50)
jabatan VARCHAR(255)
pangkat_golongan VARCHAR(100)
ttd_path VARCHAR(255) -- path ke file tanda tangan
email VARCHAR(255)
is_active BOOLEAN
```

## API Integration

### 1. Saat Verifikasi Proposal

**Endpoint**: `PATCH /api/dinas/proposals/:id/verify`

Ketika verifikator melakukan verifikasi (approve/reject), sistem otomatis menyimpan:
```javascript
{
  dinas_verified_by: parseInt(user_id), // ID dari req.user
  dinas_verified_at: new Date(),
  dinas_status: 'approved' // atau 'rejected', 'revision'
}
```

### 2. Mengambil Data Proposal dengan Verifikator

**Endpoint**: `GET /api/kecamatan/bankeu/proposals`

Response sudah include data verifikator lengkap:
```json
{
  "id": 123,
  "judul_proposal": "...",
  "dinas_status": "approved",
  "dinas_verified_at": "2026-02-05T10:30:00Z",
  "dinas_verifier_name": "John Doe", // dari users.name
  "dinas_verifikator_nama": "Dr. John Doe, S.Sos", // dari dinas_verifikator.nama
  "dinas_verifikator_jabatan": "Kepala Bidang Pemberdayaan Masyarakat",
  "dinas_verifikator_pangkat": "Penata Tk. I (III/d)",
  "dinas_verifikator_ttd": "uploads/verifikator_ttd/ttd_123_1234567890.png"
}
```

### 3. Query Join yang Diterapkan

**File**: `src/controllers/bankeuVerification.controller.js`, `src/controllers/dinasVerification.controller.js`

```sql
SELECT 
  bp.*,
  u_dinas.name as dinas_verifier_name,
  dv.nama as dinas_verifikator_nama,
  dv.jabatan as dinas_verifikator_jabatan,
  dv.pangkat_golongan as dinas_verifikator_pangkat,
  dv.ttd_path as dinas_verifikator_ttd
FROM bankeu_proposals bp
LEFT JOIN users u_dinas ON bp.dinas_verified_by = u_dinas.id
LEFT JOIN dinas_verifikator dv ON u_dinas.id = dv.user_id 
  AND u_dinas.dinas_id = dv.dinas_id
```

## Penggunaan di Berita Acara

### Frontend - Menampilkan Data Verifikator

Saat kecamatan membuat berita acara, data verifikator dapat diakses dari object proposal:

```javascript
// src/pages/kecamatan/BeritaAcaraPage.jsx
const proposal = { /* data dari API */ };

// Nama lengkap + gelar
const verifikatorNama = proposal.dinas_verifikator_nama || proposal.dinas_verifier_name;

// Jabatan
const verifikatorJabatan = proposal.dinas_verifikator_jabatan || '-';

// Pangkat/Golongan
const verifikatorPangkat = proposal.dinas_verifikator_pangkat || '-';

// TTD (untuk ditampilkan di PDF)
const verifikatorTTD = proposal.dinas_verifikator_ttd 
  ? `${imageBaseUrl}/storage/${proposal.dinas_verifikator_ttd}`
  : null;
```

### Backend - Generate PDF Berita Acara

**File**: `src/services/beritaAcaraService.js` (update diperlukan)

```javascript
async generateBeritaAcaraVerifikasi({ desaId, kecamatanId, proposalId }) {
  // Fetch proposal with verifikator data
  const proposal = await this.getProposalWithVerifikator(proposalId);
  
  // Extract verifikator info
  const verifikator = {
    nama: proposal.dinas_verifikator_nama,
    jabatan: proposal.dinas_verifikator_jabatan,
    pangkat: proposal.dinas_verifikator_pangkat,
    ttd_path: proposal.dinas_verifikator_ttd
  };
  
  // Add to PDF
  doc.text(`Nama: ${verifikator.nama}`, x, y);
  doc.text(`Jabatan: ${verifikator.jabatan}`, x, y + 15);
  doc.text(`Pangkat/Gol: ${verifikator.pangkat}`, x, y + 30);
  
  // Add signature image
  if (verifikator.ttd_path) {
    const ttdPath = path.join(__dirname, '../../storage', verifikator.ttd_path);
    if (fs.existsSync(ttdPath)) {
      doc.image(ttdPath, x, y + 50, { width: 100, height: 50 });
    }
  }
}
```

## Flow Lengkap

1. **Verifikator Login** → Akses `/dinas/profil`
2. **Verifikator Mengisi Profil**:
   - Nama lengkap + gelar
   - NIP
   - Jabatan
   - Pangkat/Golongan
   - Tanda tangan (digambar di canvas)
3. **Verifikator Verifikasi Proposal** → `dinas_verified_by` tersimpan otomatis
4. **Kecamatan Generate Berita Acara** → Data verifikator otomatis muncul (nama, jabatan, pangkat, TTD)

## File yang Diubah

- ✅ `src/controllers/bankeuVerification.controller.js` - tambah JOIN dinas_verifikator
- ✅ `src/controllers/dinasVerification.controller.js` - tambah JOIN dinas_verifikator
- ✅ `src/controllers/verifikatorProfile.controller.js` - CRUD profil verifikator
- ✅ `src/routes/verifikatorProfile.routes.js` - routes `/api/verifikator/profile`
- ✅ `src/pages/dinas/VerifikatorProfilePage.jsx` - UI profil dengan signature canvas

## File yang Perlu Update (Opsional)

- `src/services/beritaAcaraService.js` - tambahkan section verifikator di PDF
- Frontend berita acara - tampilkan data verifikator saat preview/generate

## Testing

### 1. Test API Response
```bash
# Login sebagai verifikator
POST /api/auth/login
{
  "email": "verifikator@dinas.go.id",
  "password": "password"
}

# Get proposals (cek ada field dinas_verifikator_*)
GET /api/dinas/proposals
```

### 2. Test Data Profil
```bash
# Get profil verifikator
GET /api/verifikator/profile

# Update profil
PUT /api/verifikator/profile
{
  "nama": "Dr. Ahmad Santoso, S.Sos, M.Si",
  "nip": "197501012005011001",
  "jabatan": "Kepala Bidang Pemberdayaan Masyarakat",
  "pangkat_golongan": "Pembina (IV/a)"
}

# Upload TTD (canvas to blob)
POST /api/verifikator/profile/upload-ttd
FormData: { ttd: <blob> }
```

## Notes

- TTD disimpan di `storage/uploads/verifikator_ttd/`
- Path di database: `uploads/verifikator_ttd/ttd_verifikator_123_1234567890.png`
- Akses via: `${imageBaseUrl}/storage/uploads/verifikator_ttd/...`
- Join menggunakan `user_id` dan `dinas_id` untuk match yang tepat
- Data verifikator hanya muncul jika proposal sudah diverifikasi (`dinas_verified_by NOT NULL`)
