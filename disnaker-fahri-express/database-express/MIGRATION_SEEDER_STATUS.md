# Migration & Seeder Check - Database Express

## Status: ✅ AMAN untuk Production

Tanggal Check: 28 Desember 2025

## 📊 Summary

### Database Structure
- **Total Users**: 534
- **Total Pegawai**: 98
- **Users with pegawai_id**: 10 (linked)
- **Users without pegawai_id**: 88 (menggunakan deprecated bidang_id)

### Migration Files Status

#### ✅ Core Migrations (AMAN)
1. `001_create_all_tables.sql` - Complete database schema ✅
2. `007_cleanup_roles.sql` - Migrate old roles to new system ✅
3. `011_create_produk_hukums_table.sql` - Produk hukum feature ✅
4. `020-027_*.sql` - Kelembagaan tables (RWs, RTs, Posyandu, dll) ✅
5. `20241212_create_kelembagaan_activity_logs.sql` - Activity logs ✅
6. `20251227_create_activity_logs.sql` - General activity logs ✅
7. `030_create_jadwal_kegiatan_table.sql` - Jadwal Kegiatan feature ✅
8. `add_produk_hukum_to_kelembagaan.sql` - Add FK to kelembagaan ✅

#### ⚠️ Duplicate/Legacy (Perlu Review)
- `create_activity_logs_table.sql` - DUPLICATE dengan 20251227 file

### Seeder Files Status

#### ✅ SQL Seeders (AMAN)
1. `001_seed_master_and_sample_data.sql` - Master data ✅
2. `002_seed_wilayah_kecamatan_desa.sql` - Wilayah data ✅
3. `003_seed_bidang_pegawai.sql` - 8 Bidang + 98 Pegawai ✅
4. `bumdes.sql` - Data BUMDes ✅

#### ✅ JavaScript Seeders (AMAN)
1. `seed_kecamatan_desa.js` - Kecamatan & Desa seeder ✅
2. `seed_pegawai_from_json.js` - Import pegawai dari JSON ✅
3. `seed_users_all_roles.js` - Seed users untuk semua roles ✅
4. `seed_users_pegawai.js` - Seed users pegawai DPMD ✅

## ⚠️ Known Issues

### Issue 1: Duplicate Activity Logs Migration
**Files:**
- `create_activity_logs_table.sql`
- `20251227_create_activity_logs.sql`

**Recommendation:** Hapus salah satu (keep 20251227 version)

### Issue 2: 88 Users Tanpa pegawai_id
**Impact:** 88 users pegawai DPMD masih menggunakan `users.bidang_id` (deprecated column)

**Current Solution:** 
- ✅ Controller sudah support fallback
- ✅ Bidang tetap ditampilkan dari `users.bidang_id` jika `pegawai_id` null

**Future Action (Optional):**
```sql
-- Script untuk link users ke pegawai (belum dibuat)
-- Akan membuat pegawai record untuk 88 users yang belum ter-link
```

## 🔧 Recommendations untuk Teman

### 1. Fresh Install (Database Baru)

```bash
# 1. Clone repository
git clone <repo-url>
cd dpmd-fahri-express

# 2. Install dependencies
npm install

# 3. Setup .env
cp .env.example .env
# Edit .env dengan database credentials

# 4. Run migrations
npm run migrate

# 5. Run seeders
npm run seed
```

### 2. Existing Database (Update)

```bash
# 1. Backup database dulu!
mysqldump -u root -p dpmd > backup_dpmd_$(date +%Y%m%d).sql

# 2. Pull latest code
git pull origin fahri

# 3. Install dependencies
npm install

# 4. Run new migrations only
npm run migrate

# 5. Start server
npm run dev
```

### 3. Verifikasi Setelah Install

```bash
# Check schema
node database-express/check-schema.js

# Check pegawai relation
node database-express/check-pegawai-relation.js

# Test API
curl http://localhost:3000/api/users?limit=10
```

## 📝 Migration Order

Migration files akan dijalankan sesuai urutan filename:

1. `001_create_all_tables.sql` (base schema)
2. `007_cleanup_roles.sql` (data migration)
3. `011_create_produk_hukums_table.sql`
4. `020_create_rws_table.sql`
5. `021_create_rts_table.sql`
6. `022_create_posyandus_table.sql`
7. `023_create_karang_tarunas_table.sql`
8. `024_create_lpms_table.sql`
9. `025_create_satlinmas_table.sql`
10. `026_create_pkks_table.sql`
11. `027_create_pengurus_table.sql`
12. `20241212_create_kelembagaan_activity_logs.sql`
13. `20251227_create_activity_logs.sql`
14. `add_produk_hukum_to_kelembagaan.sql`

## 📝 Seeder Order

Seeder akan dijalankan sesuai dependencies:

### SQL Seeders (Manual)
```sql
-- Run in this order:
source 001_seed_master_and_sample_data.sql;
source 002_seed_wilayah_kecamatan_desa.sql;
source 003_seed_bidang_pegawai.sql;
source bumdes.sql;
```

### JavaScript Seeders (Via npm)
```bash
# Run seeders
npm run seed

# Or run individually
node database-express/seeders/seed_kecamatan_desa.js
node database-express/seeders/seed_pegawai_from_json.js
node database-express/seeders/seed_users_all_roles.js
```

## ⚙️ Environment Variables

```env
# Database
DATABASE_URL="mysql://root:password@localhost:3001/dpmd"

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./storage/uploads
```

## 🔐 Default Credentials (After Seeding)

### Superadmin
- Email: `superadmin@dpmd.go.id`
- Password: `password`

### Kepala Dinas
- Email: `kepala.dinas@dpmd.go.id`
- Password: `password`

### Admin Desa (Sample)
- Email: `desa001@dpmd.go.id`
- Password: `password`

**⚠️ IMPORTANT:** Ganti semua password default setelah install!

## 🐛 Troubleshooting

### Migration Gagal
```bash
# Check MySQL running
mysql -u root -p -e "SHOW DATABASES;"

# Check database exists
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS dpmd;"

# Reset migrations (DANGER!)
mysql -u root -p dpmd < path/to/backup.sql
```

### Seeder Gagal
```bash
# Check foreign key constraints
SET FOREIGN_KEY_CHECKS=0;
# Run seeder
SET FOREIGN_KEY_CHECKS=1;

# Check data
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM pegawai;
SELECT COUNT(*) FROM bidangs;
```

### Bidang Tidak Muncul
```bash
# Check controller fallback
node database-express/check-pegawai-relation.js

# Expected: 88 users using deprecated bidang_id
# Expected: 10 users using pegawai_id
```

## ✅ Pre-Deployment Checklist

- [ ] Backup database production
- [ ] Test migrations di database local/staging
- [ ] Test seeders di database local/staging
- [ ] Verify API endpoints working
- [ ] Check all user roles can login
- [ ] Verify bidang tampil di user cards
- [ ] Test pagination working
- [ ] Change all default passwords
- [ ] Update .env.production
- [ ] Test frontend build (`npm run build`)
- [ ] Test backend in production mode

## 📚 Documentation Files

1. `BIDANG_SCHEMA_FIX.md` - Database schema explanation
2. `PAGINATION_FEATURE.md` - Pagination implementation
3. `check-schema.js` - Database inspection script
4. `check-pegawai-relation.js` - Pegawai relation checker

## 🎯 Conclusion

**Status: READY untuk Production** ✅

Migration dan seeder sudah aman untuk dijalankan. Teman Anda bisa:
1. Clone repo
2. Run migrations
3. Run seeders
4. Start coding!

Hanya ada 1 file duplicate yang perlu dihapus (optional cleanup).
Controller sudah support fallback untuk 88 users yang belum ter-link ke pegawai table.
