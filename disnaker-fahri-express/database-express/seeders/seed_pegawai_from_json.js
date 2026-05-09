// database-express/seeders/seed-pegawai.js
/**
 * Seeder untuk table pegawai
 * Jalankan dengan: node database-express/seeders/seed-pegawai.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai seeding pegawai...\n');

  try {
    // Load data from JSON
    const dataPath = path.join(__dirname, 'pegawai-data.json');
    const pegawaiData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    console.log(`📦 Ditemukan ${pegawaiData.length} data pegawai di file JSON\n`);

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Menghapus data pegawai lama...');
    await prisma.pegawai.deleteMany({});
    console.log('✅ Data pegawai lama berhasil dihapus\n');

    // Insert pegawai data
    console.log('📥 Memasukkan data pegawai baru...');
    let successCount = 0;
    let errorCount = 0;

    for (const pegawai of pegawaiData) {
      try {
        await prisma.pegawai.create({
          data: {
            id_pegawai: BigInt(pegawai.id_pegawai),
            id_bidang: pegawai.id_bidang ? BigInt(pegawai.id_bidang) : null,
            nama_pegawai: pegawai.nama_pegawai,
            created_at: pegawai.created_at ? new Date(pegawai.created_at) : new Date(),
            updated_at: pegawai.updated_at ? new Date(pegawai.updated_at) : new Date()
          }
        });
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`   ✓ ${successCount}/${pegawaiData.length} pegawai berhasil diinsert`);
        }
      } catch (error) {
        errorCount++;
        console.error(`   ✗ Error inserting pegawai ${pegawai.nama_pegawai}:`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Berhasil: ${successCount} pegawai`);
    console.log(`   ❌ Gagal: ${errorCount} pegawai`);
    console.log('\n🎉 Seeding pegawai selesai!');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
