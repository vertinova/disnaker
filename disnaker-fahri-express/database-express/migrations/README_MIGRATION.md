# Migration Instructions: Add produk_hukum_id to All Kelembagaan

## What This Migration Does
Adds `produk_hukum_id` field to the following kelembagaan tables:
- `karang_tarunas`
- `lpms`
- `pkks`
- `rts`
- `posyandus`

Note: `rws` and `satlinmas` already have this field.

## Steps to Run Migration

### 1. Run SQL Migration
```bash
# From project root
cd /home/erlangga/Projects/dpmd/dpmd-fahri-express

# Run migration
mysql -u root -p dpmd_db < database-express/migrations/add_produk_hukum_to_kelembagaan.sql
```

### 2. Regenerate Prisma Client
```bash
npx prisma generate
```

### 3. Restart Backend Server
The nodemon should auto-restart, but if not:
```bash
npm run dev
```

## Verification
After migration, all kelembagaan should support connecting to produk hukum:
- ✅ RW (already had it)
- ✅ RT (newly added)
- ✅ Posyandu (newly added)
- ✅ Karang Taruna (newly added)
- ✅ LPM (newly added)
- ✅ PKK (newly added)
- ✅ Satlinmas (already had it)

## Rollback (if needed)
```sql
ALTER TABLE karang_tarunas DROP FOREIGN KEY karang_tarunas_produk_hukum_id_foreign;
ALTER TABLE karang_tarunas DROP INDEX karang_tarunas_produk_hukum_id_foreign;
ALTER TABLE karang_tarunas DROP COLUMN produk_hukum_id;

ALTER TABLE lpms DROP FOREIGN KEY lpms_produk_hukum_id_foreign;
ALTER TABLE lpms DROP INDEX lpms_produk_hukum_id_foreign;
ALTER TABLE lpms DROP COLUMN produk_hukum_id;

ALTER TABLE pkks DROP FOREIGN KEY pkks_produk_hukum_id_foreign;
ALTER TABLE pkks DROP INDEX pkks_produk_hukum_id_foreign;
ALTER TABLE pkks DROP COLUMN produk_hukum_id;

ALTER TABLE rts DROP FOREIGN KEY rts_produk_hukum_id_foreign;
ALTER TABLE rts DROP INDEX rts_produk_hukum_id_foreign;
ALTER TABLE rts DROP COLUMN produk_hukum_id;

ALTER TABLE posyandus DROP FOREIGN KEY posyandus_produk_hukum_id_foreign;
ALTER TABLE posyandus DROP INDEX posyandus_produk_hukum_id_foreign;
ALTER TABLE posyandus DROP COLUMN produk_hukum_id;
```
