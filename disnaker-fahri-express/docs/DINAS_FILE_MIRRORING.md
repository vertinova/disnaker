# Fitur Mirroring File Review Dinas

## 📋 Overview
Fitur ini memastikan bahwa hasil review dari dinas terkait **tidak hilang** di setiap flow verifikasi. Ketika kecamatan melakukan reject dan desa mengupload ulang file, kecamatan akan mendapatkan **2 file proposal** untuk dibandingkan.

## 🎯 Tujuan
- **Mencegah konflik**: Jika desa upload file yang salah, kecamatan punya acuan
- **Transparansi**: Semua pihak bisa lihat file yang sudah direview dinas
- **Quality Control**: Kecamatan bisa membandingkan file baru dengan file yang sudah disetujui dinas

## 🗄️ Database Changes

### Tabel: `bankeu_proposals`

```sql
ALTER TABLE bankeu_proposals 
ADD COLUMN dinas_reviewed_file VARCHAR(255) NULL COMMENT 'File proposal hasil review dinas (reference)',
ADD COLUMN dinas_reviewed_at TIMESTAMP NULL COMMENT 'Timestamp review dinas';
```

**Kolom Baru:**
| Kolom | Type | Nullable | Deskripsi |
|-------|------|----------|-----------|
| `dinas_reviewed_file` | VARCHAR(255) | YES | Path file proposal yang sudah direview oleh dinas terkait (sebagai reference untuk kecamatan) |
| `dinas_reviewed_at` | TIMESTAMP | YES | Timestamp kapan dinas melakukan review terhadap proposal |

## 🔄 Flow Diagram

### Flow Lengkap dengan Mirroring

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. DESA UPLOAD PROPOSAL                                          │
│    - file_proposal: proposal_v1.pdf                              │
│    - dinas_reviewed_file: NULL                                   │
└─────────────────────┬────────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. DINAS TERKAIT REVIEW & APPROVE                                │
│    Action: Copy file_proposal → dinas_reviewed_file              │
│    - file_proposal: proposal_v1.pdf                              │
│    - dinas_reviewed_file: proposal_v1.pdf (COPY/MIRROR)          │
│    - dinas_reviewed_at: 2026-02-02 10:00:00                      │
│    - dinas_status: verified                                      │
└─────────────────────┬────────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. KECAMATAN REVIEW                                              │
│    Dapat 1 file:                                                 │
│    - file_proposal: proposal_v1.pdf                              │
│                                                                  │
│    Action: REJECT (butuh revisi)                                │
│    - kecamatan_status: rejected                                  │
│    - kecamatan_catatan: "Volume kurang jelas"                    │
└─────────────────────┬────────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. DESA UPLOAD ULANG                                             │
│    - file_proposal: proposal_v2.pdf (FILE BARU)                  │
│    - dinas_reviewed_file: proposal_v1.pdf (TETAP ADA!)           │
│    - status: pending                                             │
│    - submitted_to_kecamatan: true                                │
└─────────────────────┬────────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. KECAMATAN REVIEW ULANG                                        │
│    Dapat 2 file untuk dibandingkan:                              │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ 📄 FILE REFERENCE (dari Dinas)                          │  │
│    │ - dinas_reviewed_file: proposal_v1.pdf                  │  │
│    │ - Status: Read-only, sebagai acuan                      │  │
│    └─────────────────────────────────────────────────────────┘  │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ 📄 FILE BARU (dari Desa)                                │  │
│    │ - file_proposal: proposal_v2.pdf                        │  │
│    │ - Status: Untuk diverifikasi                            │  │
│    └─────────────────────────────────────────────────────────┘  │
│                                                                  │
│    Kecamatan bisa:                                               │
│    - Bandingkan kedua file                                       │
│    - Pastikan revisi sesuai catatan                              │
│    - Approve/Reject berdasarkan perbandingan                     │
└──────────────────────────────────────────────────────────────────┘
```

## 📝 Business Rules

### 1. Kapan `dinas_reviewed_file` Diisi?
- **Trigger**: Ketika dinas terkait melakukan **approve** atau **verified** pada proposal
- **Action**: System otomatis copy `file_proposal` ke `dinas_reviewed_file`
- **Storage**: File disimpan di direktori khusus `/storage/uploads/bankeu_reference/`

### 2. Kapan `dinas_reviewed_file` Digunakan?
- **Scenario 1**: Kecamatan reject → Desa upload ulang
  - Kecamatan lihat: File reference + File baru
- **Scenario 2**: DPMD reject → Desa upload ulang
  - DPMD lihat: File reference + File baru
- **Scenario 3**: Audit trail
  - Semua pihak bisa lihat file yang pernah direview dinas

### 3. Persistence Rules
- File `dinas_reviewed_file` **TIDAK PERNAH BERUBAH** setelah di-set
- Hanya bisa di-set **1 kali** oleh sistem ketika dinas approve
- Tetap ada meskipun `file_proposal` berubah berkali-kali

## 🔧 Implementation Checklist

### Backend ✅
- [x] Add database columns (`dinas_reviewed_file`, `dinas_reviewed_at`)
- [x] Create migration file with rollback
- [x] Update Prisma schema
- [x] Create file copy helper service (`utils/fileHelper.js`)
- [x] Update Dinas controller (`dinasVerification.controller.js`):
  - [x] Import fileHelper
  - [x] Copy file on approve action
  - [x] Set `dinas_reviewed_file` and `dinas_reviewed_at` in database
- [x] Update Kecamatan API (`bankeuVerification.controller.js`):
  - [x] Return `dinas_reviewed_file` in GET proposals
  - [x] Return `dinas_reviewed_at` in GET proposals

### Frontend ✅
- [x] **Kecamatan Verification Page** (`BankeuVerificationDetailPage.jsx`):
  - [x] Import new icons (LuShield, LuFileText, LuInfo, LuAlertCircle)
  - [x] Update `handleViewPdf` to support dual file view
  - [x] Update `PdfViewerModal` component:
    - [x] Tab navigation for 2 files
    - [x] Visual indicators (icons, colors)
    - [x] Info banners explaining each file
    - [x] Support single file fallback
  - [x] Visual indicator in proposal list (green badge)
  - [x] Update "Lihat" button text to show "(2 File)" when reference exists
- [x] **File Storage Structure**:
  - [x] Reference files: `/storage/uploads/bankeu_reference/`
  - [x] Current files: `/storage/uploads/bankeu/`

### Testing ⏳
- [ ] Test: Dinas approve → file copied to bankeu_reference/
- [ ] Test: Database updated with dinas_reviewed_file path
- [ ] Test: Desa upload ulang → file reference tetap ada
- [ ] Test: Kecamatan view → 2 files shown in tabs
- [ ] Test: Tab switching works correctly
- [ ] Test: File storage management (permissions, disk space)
- [ ] Test: Edge cases:
  - [ ] File not found error handling
  - [ ] File copy failure rollback
  - [ ] Missing dinas_reviewed_file (old data)

## 🎨 UI/UX Design

### Kecamatan Verification Page - Dual File View

```
┌───────────────────────────────────────────────────────────────────┐
│ Verifikasi Proposal - Desa Cibinong                              │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│ ⚠️ Proposal ini sudah direview oleh Dinas Terkait                │
│    File reference tersedia untuk perbandingan                     │
│                                                                   │
│ ┌─────────────────────────────┬──────────────────────────────┐   │
│ │ 📄 FILE REFERENCE (DINAS)    │ 📄 FILE BARU (DESA)          │   │
│ ├─────────────────────────────┼──────────────────────────────┤   │
│ │ ✅ Disetujui oleh:           │ 🔄 Status: Pending           │   │
│ │    Dinas Pekerjaan Umum      │                              │   │
│ │                              │                              │   │
│ │ 📅 Direview: 01 Feb 2026     │ 📅 Upload ulang: 02 Feb 2026 │   │
│ │                              │                              │   │
│ │ [👁️ Lihat PDF]               │ [👁️ Lihat PDF]              │   │
│ └─────────────────────────────┴──────────────────────────────┘   │
│                                                                   │
│ 💡 Tips: Bandingkan kedua file untuk memastikan revisi sudah     │
│         sesuai dengan catatan yang diberikan                      │
│                                                                   │
│ [🔍 Buka Side-by-Side Viewer]  [✅ Setujui]  [❌ Tolak]          │
└───────────────────────────────────────────────────────────────────┘
```

## 🚀 Future Enhancements

1. **Version Control**:
   - Simpan history semua versi file
   - Numbering: v1, v2, v3, dst

2. **Diff Viewer**:
   - Highlight perbedaan antara file reference dan file baru
   - Side-by-side PDF comparison

3. **Automatic Validation**:
   - Compare metadata (jumlah halaman, ukuran file, etc)
   - Alert jika file baru suspicious

4. **Storage Optimization**:
   - Deduplikasi file yang sama
   - Compression untuk file reference

## 📞 Contact

Jika ada pertanyaan tentang fitur ini, hubungi:
- **Developer**: Team DPMD Bogor
- **Documentation**: `/docs/DINAS_FILE_MIRRORING.md`
