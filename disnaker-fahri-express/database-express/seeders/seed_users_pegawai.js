// database-express/seeders/seed-user-pegawai.js
/**
 * Seeder untuk membuat user account untuk pegawai
 * Ambil data dari tabel pegawai, buat user account dengan role 'pegawai'
 * Password default: password
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'password';

async function main() {
  console.log('🌱 Memulai seeding user pegawai...\n');

  try {
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    console.log(`🔒 Password default: ${DEFAULT_PASSWORD}\n`);

    // Get all pegawai
    const pegawaiList = await prisma.pegawai.findMany({
      select: {
        id_pegawai: true,
        nama_pegawai: true,
        id_bidang: true,
      }
    });

    console.log(`📦 Ditemukan ${pegawaiList.length} pegawai\n`);

    let created = 0;
    let skipped = 0;

    // Create user for each pegawai (sample: first 10 pegawai per bidang)
    const bidangGroups = {};
    
    pegawaiList.forEach(peg => {
      if (!bidangGroups[peg.id_bidang]) {
        bidangGroups[peg.id_bidang] = [];
      }
      if (bidangGroups[peg.id_bidang].length < 10) {
        bidangGroups[peg.id_bidang].push(peg);
      }
    });

    console.log('👤 Membuat user account untuk pegawai...\n');

    for (const bidangId in bidangGroups) {
      const pegawais = bidangGroups[bidangId];
      console.log(`   📌 Bidang ${bidangId}: ${pegawais.length} pegawai`);

      for (const peg of pegawais) {
        // Generate email from name
        const emailName = peg.nama_pegawai
          .toLowerCase()
          .replace(/\s+/g, '.')
          .replace(/[^a-z0-9.]/g, '');
        
        const email = `${emailName}@dpmd.bogorkab.go.id`;

        try {
          // Check if user exists
          const existingUser = await prisma.users.findUnique({
            where: { email }
          });

          if (existingUser) {
            skipped++;
            continue;
          }

          // Create user
          await prisma.users.create({
            data: {
              name: peg.nama_pegawai,
              email: email,
              password: hashedPassword,
              role: 'pegawai',
              bidang_id: Number(peg.id_bidang)
            }
          });

          created++;
        } catch (error) {
          console.error(`      ❌ Error creating user for ${peg.nama_pegawai}:`, error.message);
        }
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ User baru: ${created}`);
    console.log(`   ⏭️  Dilewati (sudah ada): ${skipped}`);
    console.log(`   🔑 Password: ${DEFAULT_PASSWORD}\n`);

    console.log('🎉 Seeding user pegawai selesai!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
