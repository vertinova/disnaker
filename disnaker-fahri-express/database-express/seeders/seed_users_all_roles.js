// database-express/seeders/seed-users.js
/**
 * Seeder untuk users (kepala dinas, sekretaris dinas, kepala bidang)
 * Jalankan dengan: node database-express/seeders/seed-users.js
 * 
 * Password default untuk semua user: password
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'password';

async function main() {
  console.log('🌱 Memulai seeding users...\n');

  try {
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    console.log(`🔒 Password default: ${DEFAULT_PASSWORD}\n`);

    // 1. Kepala Dinas
    console.log('👤 Membuat user Kepala Dinas...');
    const kepalaDinas = await prisma.users.upsert({
      where: { email: 'kepaladinas@dpmd.bogorkab.go.id' },
      update: {},
      create: {
        name: 'Kepala Dinas DPMD',
        email: 'kepaladinas@dpmd.bogorkab.go.id',
        password: hashedPassword,
        role: 'kepala_dinas'
      }
    });
    console.log(`   ✅ ${kepalaDinas.name} - ${kepalaDinas.email}\n`);

    // 2. Sekretaris Dinas
    console.log('👤 Membuat user Sekretaris Dinas...');
    const sekretarisDinas = await prisma.users.upsert({
      where: { email: 'sekretaris@dpmd.bogorkab.go.id' },
      update: {},
      create: {
        name: 'Sekretaris Dinas DPMD',
        email: 'sekretaris@dpmd.bogorkab.go.id',
        password: hashedPassword,
        role: 'sekretaris_dinas'
      }
    });
    console.log(`   ✅ ${sekretarisDinas.name} - ${sekretarisDinas.email}\n`);

    // 3. Kepala Bidang Sekretariat
    console.log('👤 Membuat user Kepala Bidang Sekretariat...');
    const kabidSekretariat = await prisma.users.upsert({
      where: { email: 'subag.umpeg@dpmd.bogorkab.go.id' },
      update: {},
      create: {
        name: 'Kepala Sub Bagian Umum dan Pegawai',
        email: 'subag.umpeg@dpmd.bogorkab.go.id',
        password: hashedPassword,
        role: 'kabid_sekretariat',
        bidang_id: 2 // Sekretariat
      }
    });
    console.log(`   ✅ ${kabidSekretariat.name} - ${kabidSekretariat.email}\n`);

    // 4. Kepala Bidang Pemerintahan Desa
    console.log('👤 Membuat user Kepala Bidang Pemerintahan Desa...');
    const kabidPemdes = await prisma.users.upsert({
      where: { email: 'kabid.pemdes@dpmd.bogorkab.go.id' },
      update: {},
      create: {
        name: 'Kepala Bidang Pemerintahan Desa',
        email: 'kabid.pemdes@dpmd.bogorkab.go.id',
        password: hashedPassword,
        role: 'kabid_pemerintahan_desa',
        bidang_id: 6 // Pemerintahan Desa
      }
    });
    console.log(`   ✅ ${kabidPemdes.name} - ${kabidPemdes.email}\n`);

    // 5. Kepala Bidang SPKED
    console.log('👤 Membuat user Kepala Bidang SPKED...');
    const kabidSpked = await prisma.users.upsert({
      where: { email: 'kabid.spked@dpmd.bogorkab.go.id' },
      update: {},
      create: {
        name: 'Kepala Bidang Sarana Prasarana Kewilayahan dan Ekonomi Desa',
        email: 'kabid.spked@dpmd.bogorkab.go.id',
        password: hashedPassword,
        role: 'kabid_spked',
        bidang_id: 3 // Sarana Prasarana Kewilayahan dan Ekonomi Desa
      }
    });
    console.log(`   ✅ ${kabidSpked.name} - ${kabidSpked.email}\n`);

    // 6. Kepala Bidang Kekayaan dan Keuangan Desa
    console.log('👤 Membuat user Kepala Bidang Kekayaan dan Keuangan Desa...');
    const kabidKKD = await prisma.users.upsert({
      where: { email: 'kabid.kkd@dpmd.bogorkab.go.id' },
      update: {},
      create: {
        name: 'Kepala Bidang Kekayaan dan Keuangan Desa',
        email: 'kabid.kkd@dpmd.bogorkab.go.id',
        password: hashedPassword,
        role: 'kabid_kekayaan_keuangan_desa',
        bidang_id: 4 // Kekayaan dan Keuangan Desa
      }
    });
    console.log(`   ✅ ${kabidKKD.name} - ${kabidKKD.email}\n`);

    // 7. Kepala Bidang Pemberdayaan Masyarakat Desa
    console.log('👤 Membuat user Kepala Bidang Pemberdayaan Masyarakat Desa...');
    const kabidPM = await prisma.users.upsert({
      where: { email: 'kabid.pm@dpmd.bogorkab.go.id' },
      update: {},
      create: {
        name: 'Kepala Bidang Pemberdayaan Masyarakat Desa',
        email: 'kabid.pm@dpmd.bogorkab.go.id',
        password: hashedPassword,
        role: 'kabid_pemberdayaan_masyarakat_desa',
        bidang_id: 5 // Pemberdayaan Masyarakat Desa
      }
    });
    console.log(`   ✅ ${kabidPM.name} - ${kabidPM.email}\n`);

    console.log('📊 Summary:');
    console.log('   ✅ 1 Kepala Dinas');
    console.log('   ✅ 1 Sekretaris Dinas');
    console.log('   ✅ 5 Kepala Bidang');
    console.log(`   🔑 Password: ${DEFAULT_PASSWORD}`);
    console.log('\n🎉 Seeding users selesai!');

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
