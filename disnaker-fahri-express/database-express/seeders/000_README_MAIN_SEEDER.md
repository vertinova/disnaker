# Main VPS Seeder

## File: `000_seed_main_vps_data.sql`

Seeder utama yang berisi backup data lengkap dari VPS production tanggal 1 Januari 2025.

### Isi Data:
- **activity_logs**: 5 records - Log aktivitas user
- **aparatur_desa**: Data aparatur desa (empty)
- **berita**: 5 records - Berita/pengumuman
- **bidangs**: 8 records - Data bidang organisasi
- **bumdes**: Data BUMDes (struktur tabel)
- Dan tabel-tabel lainnya...

### Urutan Eksekusi:
File ini akan dijalankan **PERTAMA** karena menggunakan prefix `000_` sebelum seeder lainnya.

### Cara Menjalankan:

#### Jalankan Semua Seeder (termasuk ini):
```bash
cd /home/erlangga/Projects/dpmd/dpmd-fahri-express
node database-express/seed.js
```

#### Jalankan Hanya Seeder Ini:
```bash
mysql -u root -p dpmd < database-express/seeders/000_seed_main_vps_data.sql
```

### Catatan Penting:
⚠️ **PERHATIAN**: Seeder ini akan menghapus (DROP) dan membuat ulang tabel!
- Pastikan database backup sudah dibuat sebelum menjalankan
- File ini berisi struktur lengkap dan data dari production VPS
- Cocok untuk fresh installation atau reset database ke state VPS

### Related Files:
- File original: `/home/erlangga/Projects/dpmd/dpmd-fahri-express/dpmd_vps_20260101_162927.sql`
- Seeder runner: `/home/erlangga/Projects/dpmd/dpmd-fahri-express/database-express/seed.js`

### Tanggal Backup: 
1 Januari 2025, 16:29:27

### Database:
MySQL 8.0.44, Database: `dpmd`
