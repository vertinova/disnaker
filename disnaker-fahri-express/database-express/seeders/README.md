# Database Seeders

Panduan untuk menjalankan seeders database DPMD Express Backend.

## Prerequisites

- Node.js sudah terinstall
- MySQL database sudah dibuat
- File `.env` sudah dikonfigurasi dengan benar
- Prisma sudah di-generate: `npx prisma generate`

## Struktur Seeder

```
database-express/seeders/
├── README.md                    # File ini
├── seed-users.js               # Seeder untuk users (kepala dinas, sekretaris, kabid) ⭐
├── seed-pegawai.js             # Seeder untuk pegawai ⭐
├── pegawai-data.json           # Data pegawai (98 records) ⭐
├── seed-kepala-bidang.js       # Seeder alternatif untuk kepala bidang
├── fix-sekretaris-dinas.js     # Fix script untuk struktur organisasi
└── clear_and_seed_wilayah.js   # Seeder untuk data wilayah
```

⭐ = File penting untuk fresh installation

## Cara Menjalankan Seeder

### 1. Seeder Users (Kepala Dinas, Sekretaris, Kepala Bidang)

Membuat 7 users:
- 1 Kepala Dinas
- 1 Sekretaris Dinas  
- 5 Kepala Bidang (Sekretariat, Pemerintahan Desa, SPKED, KKD, Pemberdayaan Masyarakat Desa)

**Password default untuk semua user: `password`**

```bash
# Dari root project (dpmd-express-backend)
node database-express/seeders/seed-users.js
```

**Akun yang dibuat:**
- `kepaladinas@dpmd.bogorkab.go.id` - Kepala Dinas
- `sekretaris@dpmd.bogorkab.go.id` - Sekretaris Dinas
- `subag.umpeg@dpmd.bogorkab.go.id` - Kepala Bidang Sekretariat
- `kabid.pemdes@dpmd.bogorkab.go.id` - Kepala Bidang Pemerintahan Desa
- `kabid.spked@dpmd.bogorkab.go.id` - Kepala Bidang SPKED
- `kabid.kkd@dpmd.bogorkab.go.id` - Kepala Bidang Kekayaan dan Keuangan Desa
- `kabid.pm@dpmd.bogorkab.go.id` - Kepala Bidang Pemberdayaan Masyarakat Desa

### 2. Seeder Pegawai

Membuat 98 data pegawai dari file `pegawai-data.json`.

⚠️ **PERHATIAN:** Seeder ini akan **menghapus semua data pegawai yang sudah ada** sebelum insert data baru. 

Jika tidak ingin menghapus data lama, comment baris berikut di `seed-pegawai.js`:
```javascript
// await prisma.pegawai.deleteMany({});
```

```bash
# Dari root project (dpmd-express-backend)
node database-express/seeders/seed-pegawai.js
```

### 3. Seeder Wilayah (Kecamatan & Desa)

Untuk seed data wilayah Kabupaten Bogor:

```bash
node database-express/seeders/clear_and_seed_wilayah.js
```

## Urutan Seeding (Recommended)

Untuk fresh installation, jalankan seeder dalam urutan ini:

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Push schema ke database (jika belum)
npx prisma db push

# 3. Seed users (WAJIB)
node database-express/seeders/seed-users.js

# 4. Seed pegawai (WAJIB)
node database-express/seeders/seed-pegawai.js

# 5. Seed wilayah (optional)
node database-express/seeders/clear_and_seed_wilayah.js
```

## Export Data Pegawai (Untuk Developer)

Jika perlu export data pegawai terbaru dari database:

```bash
node scripts/export-pegawai.js
```

Output akan tersimpan di `database-express/seeders/pegawai-data.json`.

## Troubleshooting

### Error: PrismaClientValidationError

Pastikan:
- Prisma client sudah di-generate: `npx prisma generate`
- Schema Prisma sudah sesuai dengan database
- File `.env` sudah benar

### Error: BigInt serialization

Sudah di-handle di script export. Semua BigInt di-convert ke string untuk JSON.

### Error: Cannot connect to database

Cek:
- MySQL service sudah running
- Kredensial database di `.env` sudah benar
- Database sudah dibuat

## Data Summary

### Users (seed-users.js)
- **Total**: 7 users
- **Roles**: kepala_dinas, sekretaris_dinas, kabid_*
- **Password**: `password` (semua user)

### Pegawai (seed-pegawai.js)
- **Total**: 98 pegawai
- **Source**: pegawai-data.json
- **Bidang**: Sekretariat, Pemerintahan Desa, SPKED, KKD, Pemberdayaan Masyarakat Desa

## Notes

- Semua seeder menggunakan `upsert` untuk users agar tidak error jika data sudah ada
- Seeder pegawai menggunakan `deleteMany` untuk clear data lama (bisa di-comment jika tidak diperlukan)
- BigInt ID di-handle dengan benar untuk compatibility
- Timestamps (created_at, updated_at) di-preserve dari data asli atau dibuat baru

## Contact

Jika ada masalah, hubungi team developer atau cek dokumentasi di `README.md` utama project.
cd dpmd-express-backend

# 1. Run migrations first
# (Jalankan semua migration files sesuai urutan di MIGRATIONS_SUMMARY.md)

# 2. Run JavaScript seeders (otomatis dengan urutan yang benar)
npm run db:seed

# Output akan seperti:
# 🌱 Running seeders...
# 📝 Running: bidangs_seeder.js
# 📝 Running: desas_seeder.js  
# 📝 Running: kecamatans_seeder.js
# 📝 Running: personil_seeder.js
# 📝 Running: users_seeder.js
# ✨ All seeders completed successfully!

# 3. Import BUMDes data (manual karena file besar)
mysql -u root dpmd < database-express/seeders/bumdes.sql
```

## Notes

- **JavaScript seeders** (.js) dijalankan otomatis dengan `npm run db:seed`
- **SQL seeders** (.sql) diimport manual karena ukuran file terlalu besar untuk embed di JS
- File JS seeders menggunakan module.exports dengan function `up()` dan `down()`
- Setiap seeder otomatis cek apakah data sudah ada (skip jika sudah ada)
- **personil_seeder.js** berisi 98 records embedded langsung di file (tidak pakai external file)
- **bumdes.sql** berisi 188 records dengan 75 kolom (terlalu besar untuk JS)
- Semua seeder di-export dari database production yang sudah terverifikasi

## Data Summary

- **Kecamatans**: 40 records
- **Desas**: 435 records
- **Bidangs**: 8 records
- **Personil**: 98 records (embedded in JS)
- **Users**: 492 records
- **BUMDes**: 188 records (SQL file ~800KB)

Total: ~1.5 MB data seeder

