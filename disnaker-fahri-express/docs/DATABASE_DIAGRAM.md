# Database Schema Diagram - DPMD

## Overview
Diagram struktur database DPMD dengan 32+ tables dan relasi antar entitas.

---

## 1. Core User & Auth Module

```mermaid
erDiagram
    users ||--o{ kelembagaan_activity_logs : creates
    users ||--o{ activity_logs : performs
    users ||--o{ surat_masuk : creates
    users ||--o{ disposisi : "dari/ke"
    users ||--o{ lampiran_surat : uploads
    users ||--o{ push_subscriptions : has
    users ||--o{ jadwal_kegiatan : "creates/approves"
    users ||--o| pegawai : "linked to"
    users ||--o{ app_settings : updates
    
    users {
        bigint id PK
        string name
        string email UK
        string password
        enum role
        bigint kecamatan_id
        bigint desa_id
        bigint bidang_id
        bigint pegawai_id FK
        string avatar
        boolean is_active
    }
    
    pegawai {
        bigint id_pegawai PK
        bigint id_bidang FK
        string nama_pegawai
    }
    
    bidangs {
        bigint id PK
        string nama
    }
    
    pegawai }o--|| bidangs : "belongs to"
```

---

## 2. Kelembagaan Module (Main Entities)

```mermaid
erDiagram
    desas ||--o{ rws : has
    desas ||--o{ rts : has
    desas ||--o{ posyandus : has
    desas ||--o{ karang_tarunas : has
    desas ||--o{ lpms : has
    desas ||--o{ pkks : has
    desas ||--o{ satlinmas : has
    desas ||--o{ aparatur_desa : has
    desas ||--o{ pengurus : has
    desas ||--o{ produk_hukums : has
    desas ||--o| profil_desas : has
    desas ||--o{ kelembagaan_activity_logs : tracked
    
    kecamatans ||--o{ desas : contains
    
    desas {
        bigint id PK
        bigint kecamatan_id FK
        string kode UK
        string nama
        enum status_pemerintahan
        boolean is_musdesus_target
    }
    
    kecamatans {
        bigint id PK
        string kode UK
        string nama
    }
```

---

## 3. RW & RT Structure

```mermaid
erDiagram
    desas ||--o{ rws : "located in"
    rws ||--o{ rts : contains
    rws }o--o| produk_hukums : "linked to"
    rts }o--o| produk_hukums : "linked to"
    
    rws {
        string id PK
        bigint desa_id FK
        string nomor
        string alamat
        enum status_kelembagaan
        enum status_verifikasi
        string produk_hukum_id FK
    }
    
    rts {
        string id PK
        string rw_id FK
        bigint desa_id FK
        string nomor
        string alamat
        enum status_kelembagaan
        enum status_verifikasi
        string produk_hukum_id FK
    }
```

---

## 4. Kelembagaan Entities (Posyandu, LPM, PKK, etc)

```mermaid
erDiagram
    desas ||--o{ posyandus : has
    desas ||--o{ karang_tarunas : has
    desas ||--o{ lpms : has
    desas ||--o{ pkks : has
    desas ||--o{ satlinmas : has
    
    posyandus }o--o| produk_hukums : "linked to"
    karang_tarunas }o--o| produk_hukums : "linked to"
    lpms }o--o| produk_hukums : "linked to"
    pkks }o--o| produk_hukums : "linked to"
    satlinmas }o--o| produk_hukums : "linked to"
    
    posyandus {
        string id PK
        bigint desa_id FK
        string nama
        string alamat
        enum status_kelembagaan
        enum status_verifikasi
        string produk_hukum_id FK
    }
    
    lpms {
        string id PK
        bigint desa_id FK
        string nama
        string alamat
        enum status_kelembagaan
        enum status_verifikasi
        string produk_hukum_id FK
    }
    
    pkks {
        string id PK
        bigint desa_id FK
        string nama
        string alamat
        enum status_kelembagaan
        enum status_verifikasi
        string produk_hukum_id FK
    }
    
    karang_tarunas {
        string id PK
        bigint desa_id FK
        string nama
        string alamat
        enum status_kelembagaan
        enum status_verifikasi
        string produk_hukum_id FK
    }
    
    satlinmas {
        string id PK
        bigint desa_id FK
        string nama
        string alamat
        enum status_kelembagaan
        enum status_verifikasi
        string produk_hukum_id FK
    }
```

---

## 5. Pengurus (Polymorphic Relation)

```mermaid
erDiagram
    desas ||--o{ pengurus : has
    pengurus }o--o| produk_hukums : "SK pengangkatan"
    
    pengurus {
        string id PK
        bigint desa_id FK
        string pengurusable_id
        string pengurusable_type
        string jabatan
        string nama_lengkap
        string nik
        date tanggal_mulai_jabatan
        date tanggal_akhir_jabatan
        enum status_jabatan
        enum status_verifikasi
        string produk_hukum_id FK
        string avatar
    }
```

**Note**: `pengurusable_type` dapat berisi:
- `rws`
- `rts`
- `posyandus`
- `karang_tarunas`
- `lpms`
- `pkks`
- `satlinmas`

---

## 6. Produk Hukum Module

```mermaid
erDiagram
    desas ||--o{ produk_hukums : issues
    produk_hukums ||--o{ aparatur_desa : "for"
    produk_hukums ||--o{ bumdes : "PERDES/SK"
    produk_hukums ||--o{ rws : "for"
    produk_hukums ||--o{ rts : "for"
    produk_hukums ||--o{ posyandus : "for"
    produk_hukums ||--o{ karang_tarunas : "for"
    produk_hukums ||--o{ lpms : "for"
    produk_hukums ||--o{ pkks : "for"
    produk_hukums ||--o{ satlinmas : "for"
    
    produk_hukums {
        string id PK
        string uuid UK
        bigint desa_id FK
        string tipe_dokumen
        string judul
        string nomor
        int tahun
        enum jenis
        enum singkatan_jenis
        string tempat_penetapan
        date tanggal_penetapan
        enum status_peraturan
        string file
    }
```

---

## 7. Aparatur Desa Module

```mermaid
erDiagram
    desas ||--o{ aparatur_desa : employs
    aparatur_desa }o--o| produk_hukums : "SK pengangkatan"
    
    aparatur_desa {
        string id PK
        bigint desa_id FK
        string nama_lengkap
        string jabatan
        string nipd
        string niap
        date tanggal_pengangkatan
        date tanggal_pemberhentian
        enum status
        string produk_hukum_id FK
        string file_pas_foto
        string file_ktp
        string file_bpjs_kesehatan
    }
```

---

## 8. BUMDes Module

```mermaid
erDiagram
    bumdes }o--o| produk_hukums : "PERDES"
    bumdes }o--o| produk_hukums : "SK BUMDes"
    
    bumdes {
        int id PK
        int desa_id
        string kode_desa
        string namabumdesa
        enum status
        string NIB
        string NPWP
        string NamaDirektur
        string NamaSekretaris
        string NamaBendahara
        decimal Omset2024
        decimal Laba2024
        string produk_hukum_perdes_id FK
        string produk_hukum_sk_bumdes_id FK
    }
```

---

## 9. Surat Masuk & Disposisi Module

```mermaid
erDiagram
    users ||--o{ surat_masuk : creates
    surat_masuk ||--o{ disposisi : has
    surat_masuk ||--o{ lampiran_surat : has
    users ||--o{ disposisi : "dari"
    users ||--o{ disposisi : "ke"
    users ||--o{ lampiran_surat : uploads
    
    surat_masuk {
        bigint id PK
        string nomor_surat UK
        date tanggal_surat
        datetime tanggal_terima
        string pengirim
        text perihal
        enum jenis_surat
        string file_path
        enum status
        bigint created_by FK
    }
    
    disposisi {
        bigint id PK
        bigint surat_id FK
        bigint dari_user_id FK
        bigint ke_user_id FK
        text catatan
        enum instruksi
        enum status
        int level_disposisi
        datetime tanggal_disposisi
        datetime tanggal_dibaca
        datetime tanggal_selesai
    }
    
    lampiran_surat {
        bigint id PK
        bigint surat_id FK
        string nama_file
        string file_path
        bigint uploaded_by FK
    }
```

---

## 10. Jadwal Kegiatan Module

```mermaid
erDiagram
    bidangs ||--o{ jadwal_kegiatan : plans
    users ||--o{ jadwal_kegiatan : creates
    users ||--o{ jadwal_kegiatan : approves
    
    jadwal_kegiatan {
        bigint id PK
        string judul
        text deskripsi
        bigint bidang_id FK
        datetime tanggal_mulai
        datetime tanggal_selesai
        string lokasi
        string asal_kegiatan
        string pic_name
        enum status
        enum prioritas
        enum kategori
        decimal anggaran
        bigint created_by FK
        bigint approved_by FK
        datetime approved_at
    }
```

---

## 11. Activity Logs Module

```mermaid
erDiagram
    users ||--o{ kelembagaan_activity_logs : performs
    users ||--o{ activity_logs : performs
    desas ||--o{ kelembagaan_activity_logs : tracked
    
    kelembagaan_activity_logs {
        string id PK
        string kelembagaan_type
        string kelembagaan_id
        string kelembagaan_nama
        bigint desa_id FK
        string activity_type
        string entity_type
        string entity_id
        string entity_name
        text action_description
        json old_value
        json new_value
        bigint user_id FK
        string user_name
        string user_role
        datetime created_at
    }
    
    activity_logs {
        bigint id PK
        bigint user_id FK
        string user_name
        string user_role
        bigint bidang_id
        string module
        string action
        string entity_type
        bigint entity_id
        string entity_name
        text description
        json old_value
        json new_value
        string ip_address
        string user_agent
        datetime created_at
    }
```

---

## 12. App Settings & Other Modules

```mermaid
erDiagram
    users ||--o{ app_settings : updates
    users ||--o{ push_subscriptions : subscribes
    
    app_settings {
        int id PK
        string setting_key UK
        text setting_value
        string description
        bigint updated_by_user_id FK
    }
    
    push_subscriptions {
        bigint id PK
        bigint user_id FK
        text endpoint
        json subscription
    }
    
    profil_desas {
        bigint id PK
        bigint desa_id FK UK
        string klasifikasi_desa
        string status_desa
        int jumlah_penduduk
        text sejarah_desa
        string no_telp
        string email
        decimal latitude
        decimal longitude
    }
```

---

## 13. Legacy/Support Tables

```mermaid
erDiagram
    berita {
        int id_berita PK
        string judul
        string slug UK
        text konten
        enum kategori
        enum status
        datetime tanggal_publish
        string penulis
        int views
    }
    
    hero_galleries {
        bigint id PK
        string image_path
        string title
        boolean is_active
        int order
    }
    
    petugas_monitoring {
        bigint id PK
        bigint desa_id FK
        bigint kecamatan_id FK
        string nama_desa
        string nama_kecamatan
        string nama_petugas
        boolean is_active
    }
```

---

## Database Statistics

- **Total Models**: 32+
- **Main Modules**:
  - User Management & Auth
  - Kelembagaan (8 entity types: RW, RT, Posyandu, Karang Taruna, LPM, PKK, Satlinmas, Pengurus)
  - Aparatur Desa
  - BUMDes
  - Produk Hukum (Legal Documents)
  - Surat Masuk & Disposisi
  - Jadwal Kegiatan (Activity Scheduling)
  - Activity Logs (2 types: general & kelembagaan-specific)
  - Push Notifications
  - App Settings

## Key Features

1. **Polymorphic Relations**: 
   - `pengurus` dapat terhubung ke berbagai kelembagaan via `pengurusable_type` & `pengurusable_id`

2. **Soft Foreign Keys**:
   - Produk Hukum dapat di-link ke berbagai entitas (Aparatur, BUMDes, Kelembagaan)

3. **Activity Tracking**:
   - 2 level: `kelembagaan_activity_logs` (specific) & `activity_logs` (general)

4. **Multi-level Disposisi**:
   - Surat dapat didisposisikan bertingkat dengan `level_disposisi`

5. **Status Tracking**:
   - Hampir semua entitas kelembagaan memiliki:
     - `status_kelembagaan` (aktif/nonaktif)
     - `status_verifikasi` (verified/unverified)

---

## Enum Types Summary

### User Roles
- superadmin, kepala_dinas, sekretaris_dinas, kepala_bidang, ketua_tim, pegawai, desa, kecamatan

### Status Types
- Kelembagaan: aktif, nonaktif
- Verifikasi: verified, unverified
- Surat: draft, dikirim, selesai
- Disposisi: pending, dibaca, proses, selesai, teruskan
- Jadwal: draft, pending, approved, rejected, completed, cancelled

### Produk Hukum
- Jenis: Peraturan Desa, Peraturan Kepala Desa, Keputusan Kepala Desa
- Singkatan: PERDES, PERKADES, SK KADES
- Status: berlaku, dicabut

---

## Indexes & Performance

**Key Indexes**:
- Foreign keys: semua relasi memiliki index
- Status fields: untuk filtering
- Timestamps: untuk sorting & filtering
- Composite indexes: untuk query kompleks (e.g., `surat_status_tanggal`)

---

**Generated**: December 31, 2025  
**Database**: MySQL  
**ORM**: Prisma  
**Project**: DPMD Bogor - Sistem Informasi Pemberdayaan Masyarakat Desa
