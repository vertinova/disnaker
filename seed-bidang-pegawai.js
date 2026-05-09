/**
 * Seed: Bidang Disnaker + Dummy Pegawai
 * Bidang: sesuai struktur Dinas Tenaga Kerja Kab. Bogor
 * Pegawai dummy: 3 pegawai per bidang
 * Password default: password
 */
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BIDANGS = [
  'Sekretariat',
  'Bidang Penempatan dan Perluasan Kesempatan Kerja',
  'Bidang Pelatihan Kerja dan Produktivitas',
  'Bidang Pengembangan Hubungan Industrial',
  'Bidang Pengawasan Ketenagakerjaan',
];

const PEGAWAI_DUMMY = [
  // Sekretariat
  { nama: 'Hendra Gunawan', nip: '197801012005011001', jabatan: 'Sekretaris Dinas', jk: 'L', status: 'PNS', bidang: 0 },
  { nama: 'Siti Rahayu', nip: '198503152010012002', jabatan: 'Kepala Sub Bagian Umum', jk: 'P', status: 'PNS', bidang: 0 },
  { nama: 'Ahmad Fauzi', nip: null, jabatan: 'Staf Administrasi', jk: 'L', status: 'Tenaga_Alih_Daya', bidang: 0 },
  // Penempatan
  { nama: 'Dina Puspitasari', nip: '198706202012012003', jabatan: 'Kepala Bidang Penempatan', jk: 'P', status: 'PNS', bidang: 1 },
  { nama: 'Rudi Hartono', nip: '198901052014011004', jabatan: 'Analis Ketenagakerjaan', jk: 'L', status: 'PNS', bidang: 1 },
  { nama: 'Maya Sari', nip: null, jabatan: 'Staf Penempatan', jk: 'P', status: 'Honorer', bidang: 1 },
  // Pelatihan
  { nama: 'Bambang Supriyadi', nip: '197502102003011005', jabatan: 'Kepala Bidang Pelatihan', jk: 'L', status: 'PNS', bidang: 2 },
  { nama: 'Lestari Dewi', nip: '199204152018012006', jabatan: 'Instruktur Pelatihan', jk: 'P', status: 'PPPK', bidang: 2 },
  { nama: 'Agus Salim', nip: null, jabatan: 'Staf Pelatihan', jk: 'L', status: 'THL', bidang: 2 },
  // Hubungan Industrial
  { nama: 'Wati Ningrum', nip: '198811282010012007', jabatan: 'Kepala Bidang HI', jk: 'P', status: 'PNS', bidang: 3 },
  { nama: 'Budi Santoso', nip: '199007012016011008', jabatan: 'Mediator Hubungan Industrial', jk: 'L', status: 'PNS', bidang: 3 },
  { nama: 'Rina Wulandari', nip: null, jabatan: 'Staf HI', jk: 'P', status: 'Kontrak', bidang: 3 },
  // Pengawasan
  { nama: 'Supriadi Santoso', nip: '197903152004011009', jabatan: 'Kepala Bidang Pengawasan', jk: 'L', status: 'PNS', bidang: 4 },
  { nama: 'Nurul Hidayah', nip: '199105202015012010', jabatan: 'Pengawas Ketenagakerjaan', jk: 'P', status: 'PNS', bidang: 4 },
  { nama: 'Taufik Rahman', nip: null, jabatan: 'Staf Pengawasan', jk: 'L', status: 'Tenaga_Alih_Daya', bidang: 4 },
];

function emailify(nama) {
  return nama.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '') + '@disnaker.id';
}

async function main() {
  const hash = await bcrypt.hash('password', 10);

  // 1. Seed bidangs
  console.log('📋 Seeding bidangs...');
  const bidangIds = [];
  for (const nama of BIDANGS) {
    const existing = await prisma.bidangs.findFirst({ where: { nama: { equals: nama } } });
    let b;
    if (existing) {
      b = existing;
    } else {
      b = await prisma.bidangs.create({ data: { nama, created_at: new Date(), updated_at: new Date() } });
    }
    bidangIds.push(b.id);
    console.log(`  ✅ ${nama} (id: ${b.id})`);
  }

  // 2. Seed pegawai + users
  console.log('\n👷 Seeding pegawai dummy...');
  for (const p of PEGAWAI_DUMMY) {
    const bidangId = bidangIds[p.bidang];
    const email = emailify(p.nama);

    // Upsert pegawai
    const pegawai = await prisma.pegawai.upsert({
      where: { id_pegawai: BigInt(0) }, // dummy, won't match
      create: {
        id_bidang: bidangId,
        nama_pegawai: p.nama,
        nip: p.nip,
        jabatan: p.jabatan,
        jenis_kelamin: p.jk === 'L' ? 'L' : 'P',
        status_kepegawaian: p.status,
        unit_kerja: 'Dinas Tenaga Kerja Kabupaten Bogor',
        created_at: new Date(),
        updated_at: new Date(),
      },
      update: {},
    }).catch(async () => {
      // upsert by name+bidang
      const existing = await prisma.pegawai.findFirst({
        where: { nama_pegawai: p.nama, id_bidang: bidangId },
      });
      if (existing) return existing;
      return prisma.pegawai.create({
        data: {
          id_bidang: bidangId,
          nama_pegawai: p.nama,
          nip: p.nip,
          jabatan: p.jabatan,
          jenis_kelamin: p.jk === 'L' ? 'L' : 'P',
          status_kepegawaian: p.status,
          unit_kerja: 'Dinas Tenaga Kerja Kabupaten Bogor',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    });

    // Upsert user
    const user = await prisma.users.upsert({
      where: { email },
      update: { pegawai_id: pegawai.id_pegawai },
      create: {
        name: p.nama,
        email,
        password: hash,
        plain_password: 'password',
        role: jabatanToRole(p.jabatan),
        pegawai_id: pegawai.id_pegawai,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log(`  ✅ ${p.nama} | ${email} | ${user.role}`);
  }

  console.log('\n🎉 Selesai!');
  await prisma.$disconnect();
}

function jabatanToRole(jabatan) {
  const j = jabatan.toLowerCase();
  if (j.includes('kepala bidang') || j.includes('kepala sub')) return 'kepala_bidang';
  if (j.includes('sekretaris dinas')) return 'sekretaris_dinas';
  if (j.includes('kepala dinas')) return 'kepala_dinas';
  return 'pegawai';
}

main().catch((e) => {
  console.error('Error:', e.message);
  prisma.$disconnect();
  process.exit(1);
});
