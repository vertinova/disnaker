# Flow Verifikasi Bantuan Keuangan - Update 2026-01-30

## 🔄 Flow Baru (3-Level Verification)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLOW VERIFIKASI BANKEU 2026                      │
└─────────────────────────────────────────────────────────────────────┘

1. DESA → DINAS TERKAIT
   ├─ Upload proposal
   ├─ Submit ke Dinas Terkait (sesuai kegiatan)
   └─ Status: dinas_status = 'pending'

2. DINAS TERKAIT → Review
   ├─ ✅ APPROVED → Kirim ke KECAMATAN
   │   └─ kecamatan_status = 'pending'
   │
   └─ ❌ REJECTED/REVISION → Return ke DESA
       └─ submitted_to_dinas_at = NULL
       └─ Desa upload ulang → Kembali ke Step 1

3. KECAMATAN → Review
   ├─ ✅ APPROVED → Kirim ke DPMD
   │   └─ dpmd_status = 'pending'
   │   └─ submitted_to_dpmd = TRUE
   │
   └─ ❌ REJECTED/REVISION → Return ke DESA
       └─ Reset semua status (dinas, kecamatan)
       └─ Desa upload ulang → Kembali ke Step 1

4. DPMD → Final Approval
   ├─ ✅ APPROVED → SELESAI
   │   └─ dpmd_status = 'approved'
   │   └─ status = 'verified'
   │
   └─ ❌ REJECTED/REVISION → Return ke DESA
       └─ Reset semua status
       └─ Desa upload ulang → Kembali ke Step 1
```

## 📊 Database Schema

### Field Baru di `bankeu_proposals`:

```sql
-- Verifikasi Dinas Terkait
dinas_status ENUM('pending', 'in_review', 'approved', 'rejected', 'revision')
submitted_to_dinas_at TIMESTAMP
dinas_verified_at TIMESTAMP
dinas_verified_by INT
dinas_catatan TEXT

-- Verifikasi Kecamatan
kecamatan_status ENUM('pending', 'in_review', 'approved', 'rejected', 'revision')
submitted_to_kecamatan BOOLEAN
kecamatan_verified_at TIMESTAMP
kecamatan_verified_by BIGINT
kecamatan_catatan TEXT

-- Verifikasi DPMD (Final)
dpmd_status ENUM('pending', 'in_review', 'approved', 'rejected', 'revision')
submitted_to_dpmd BOOLEAN
submitted_to_dpmd_at TIMESTAMP
dpmd_verified_at TIMESTAMP
dpmd_verified_by BIGINT
dpmd_catatan TEXT
```

## 🔧 API Endpoints

### Desa
```
POST   /api/desa/bankeu/upload-proposal
POST   /api/desa/bankeu/submit-to-dinas-terkait  # First submission
POST   /api/desa/bankeu/resubmit                  # Revisi dari reject
GET    /api/desa/bankeu/proposals
```

### Dinas Terkait
```
GET    /api/dinas/bankeu/proposals
GET    /api/dinas/bankeu/proposals/:id
POST   /api/dinas/bankeu/proposals/:id/verify
       Body: { action: 'approved|rejected|revision', catatan: 'text' }
```

### Kecamatan
```
GET    /api/kecamatan/bankeu/proposals
GET    /api/kecamatan/bankeu/proposals/:id
PUT    /api/kecamatan/bankeu/proposals/:id/verify
       Body: { action: 'approved|rejected|revision', catatan: 'text' }
```

### DPMD (Final Approval)
```
GET    /api/dpmd/bankeu/proposals
GET    /api/dpmd/bankeu/proposals/:id
PUT    /api/dpmd/bankeu/proposals/:id/verify
       Body: { action: 'approved|rejected|revision', catatan: 'text' }
```

## 📝 Status Tracking

### Status Proposal di Setiap Level:

| Level | Field | Status Values |
|-------|-------|--------------|
| Dinas | `dinas_status` | pending, in_review, approved, rejected, revision |
| Kecamatan | `kecamatan_status` | pending, in_review, approved, rejected, revision |
| DPMD | `dpmd_status` | pending, in_review, approved, rejected, revision |
| Overall | `status` | pending, verified, rejected, revision |

### Kondisi Return ke Desa:

**Reject dari Dinas:**
- Reset: `submitted_to_dinas_at = NULL`
- Status: `dinas_status = 'rejected'`

**Reject dari Kecamatan:**
- Reset: `submitted_to_dinas_at = NULL`, `submitted_to_kecamatan = FALSE`
- Reset: Semua field `dinas_*` dan `kecamatan_*`
- Status: `kecamatan_status = 'rejected'`

**Reject dari DPMD:**
- Reset: Semua field `dinas_*`, `kecamatan_*`, `dpmd_*`
- Reset: `submitted_to_dinas_at = NULL`, `submitted_to_kecamatan = FALSE`, `submitted_to_dpmd = FALSE`
- Status: `dpmd_status = 'rejected'`

## 🔐 Role-Based Access

| Role | Access |
|------|--------|
| `desa` | Upload, submit, view own proposals |
| `dinas_{nama}` | Verify proposals for their dinas only |
| `kecamatan` | Verify proposals from desas in their kecamatan (after dinas approved) |
| `superadmin`, `kepala_dinas`, `sekretariat` | Final approval (DPMD level) |

## 🚀 Migration Guide

### 1. Run Migration SQL
```bash
mysql -u root -p dpmd < migrations/20260130_add_multilevel_verification_bankeu.sql
```

### 2. Update Prisma Client
```bash
cd dpmd-express-backend
npx prisma generate
```

### 3. Restart Backend
```bash
pm2 restart dpmd-backend
```

## 📖 Perubahan dari Flow Lama

### Flow Lama (DEPRECATED):
```
Desa → Kecamatan → Dinas Terkait → DPMD
```

### Flow Baru (2026-01-30):
```
Desa → Dinas Terkait → Kecamatan → DPMD
```

### Alasan Perubahan:
1. ✅ Dinas lebih paham teknis kegiatan di awal
2. ✅ Kecamatan fokus koordinasi administratif
3. ✅ DPMD final check sebelum approval
4. ✅ Setiap reject langsung ke Desa (bukan level sebelumnya)

## ⚠️ Breaking Changes

### Frontend Updates Required:
1. Update endpoint: `/submit-to-kecamatan` → `/submit-to-dinas-terkait`
2. Update endpoint: `/submit-to-dinas` → `/resubmit`
3. Add UI for 3-level status tracking
4. Show verifier names from all 3 levels

### Database Updates:
1. Run migration SQL (mandatory)
2. Existing proposals: `kecamatan_status`, `dpmd_status` akan NULL
3. Backward compatible (old endpoints deprecated tapi masih berfungsi)

## 🐛 Troubleshooting

**Proposal stuck di Dinas:**
```sql
SELECT id, dinas_status, submitted_to_dinas_at 
FROM bankeu_proposals 
WHERE dinas_status IS NULL AND submitted_to_dinas_at IS NOT NULL;
```

**Proposal stuck di Kecamatan:**
```sql
SELECT id, kecamatan_status, submitted_to_kecamatan, dinas_status
FROM bankeu_proposals 
WHERE submitted_to_kecamatan = TRUE 
  AND dinas_status = 'approved' 
  AND kecamatan_status IS NULL;
```

**Check full status:**
```sql
SELECT 
  id, 
  status,
  dinas_status, 
  kecamatan_status, 
  dpmd_status,
  submitted_to_dinas_at,
  submitted_to_kecamatan,
  submitted_to_dpmd
FROM bankeu_proposals 
WHERE id = ?;
```

---

**Last Updated:** 2026-01-30  
**Migration File:** `migrations/20260130_add_multilevel_verification_bankeu.sql`  
**Controllers Updated:** 
- `bankeuProposal.controller.js`
- `dinasVerification.controller.js`
- `bankeuVerification.controller.js` (Kecamatan)
- `dpmdVerification.controller.js` (NEW)
