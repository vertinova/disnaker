/**
 * Seeder untuk menghapus data lama dan mengisi data Kecamatan, Desa, dan User
 * Berdasarkan: dpmd-backend/database/seeders/WilayahUserSeeder.php
 */

// Load environment variables
require('dotenv').config();

const mysql = require('../../src/config/mysql');
const bcrypt = require('bcryptjs');

// Data berdasarkan MasterDataSeeder.php dari dpmd-backend
// Format kode: 32.01.XX.YYYY (32=Prov Jabar, 01=Kab Bogor, XX=Kec, YYYY=Desa)

const kecamatanMap = {
  'Cibinong': 1, 'Gunung Putri': 2, 'Citeureup': 3, 'Sukaraja': 4, 'Babakan Madang': 5,
  'Jonggol': 6, 'Cileungsi': 7, 'Cariu': 8, 'Sukamakmur': 9, 'Parung': 10,
  'Gunung Sindur': 11, 'Kemang': 12, 'Bojong Gede': 13, 'Leuwiliang': 14, 'Ciampea': 15,
  'Cibungbulang': 16, 'Pamijahan': 17, 'Rumpin': 18, 'Jasinga': 19, 'Parung Panjang': 20,
  'Nanggung': 21, 'Cigudeg': 22, 'Tenjo': 23, 'Ciawi': 24, 'Cisarua': 25,
  'Megamendung': 26, 'Caringin': 27, 'Cijeruk': 28, 'Ciomas': 29, 'Dramaga': 30,
  'Tamansari': 31, 'Klapanunggal': 32, 'Ciseeng': 33, 'Rancabungur': 34, 'Tajurhalang': 35,
  'Sukajaya': 36, 'Tanjungsari': 37, 'Leuwisadeng': 38, 'Tenjolaya': 39, 'Cigombong': 40
};

const kecamatans = Object.entries(kecamatanMap).map(([nama, id]) => ({ id, nama }));

// List kelurahan berdasarkan UpdateDesaStatusPemerintahanSeeder.php
const kelurahanList = [
  'PONDOK RAJEG', 'KARADENAN', 'HARAPAN JAYA', 'NANGGEWER', 'Nanggewer Mekar',
  'CIBINONG', 'PAKANSARI', 'TENGAH', 'SUKAHATI', 'CIRIUNG', 'CIRIMEKAR',
  'PABUARAN', 'Pabuaran Mekar', 'PUSPANEGARA', 'KARANG ASEM BARAT',
  'ATANG SENJAYA', 'CISARUA', 'PADASUKA'
];

// Data desa lengkap dari MasterDataSeeder.php (434 desa/kelurahan)
const kodifikasiData = [
  // Kecamatan Cibinong
  { kode: '32.01.01.1001', nama: 'Pondok Rajeg', kec: 'Cibinong' },
  { kode: '32.01.01.1002', nama: 'Karadenan', kec: 'Cibinong' },
  { kode: '32.01.01.1003', nama: 'Harapan Jaya', kec: 'Cibinong' },
  { kode: '32.01.01.1004', nama: 'Nanggewer', kec: 'Cibinong' },
  { kode: '32.01.01.1005', nama: 'Nanggewer Mekar', kec: 'Cibinong' },
  { kode: '32.01.01.1006', nama: 'Cibinong', kec: 'Cibinong' },
  { kode: '32.01.01.1007', nama: 'Pakansari', kec: 'Cibinong' },
  { kode: '32.01.01.1008', nama: 'Tengah', kec: 'Cibinong' },
  { kode: '32.01.01.1009', nama: 'Sukahati', kec: 'Cibinong' },
  { kode: '32.01.01.1010', nama: 'Ciriung', kec: 'Cibinong' },
  { kode: '32.01.01.1011', nama: 'Cirimekar', kec: 'Cibinong' },
  { kode: '32.01.01.1012', nama: 'Pabuaran', kec: 'Cibinong' },
  { kode: '32.01.01.1013', nama: 'Pabuaran Mekar', kec: 'Cibinong' },
  
  // Kecamatan Gunung Putri
  { kode: '32.01.02.2001', nama: 'Wanaherang', kec: 'Gunung Putri' },
  { kode: '32.01.02.2002', nama: 'Bojong Kulur', kec: 'Gunung Putri' },
  { kode: '32.01.02.2003', nama: 'Ciangsana', kec: 'Gunung Putri' },
  { kode: '32.01.02.2004', nama: 'Gunung Putri', kec: 'Gunung Putri' },
  { kode: '32.01.02.2005', nama: 'Bojong Nangka', kec: 'Gunung Putri' },
  { kode: '32.01.02.2006', nama: 'Tlajung Udik', kec: 'Gunung Putri' },
  { kode: '32.01.02.2007', nama: 'Cicadas', kec: 'Gunung Putri' },
  { kode: '32.01.02.2008', nama: 'Cikeas Udik', kec: 'Gunung Putri' },
  { kode: '32.01.02.2009', nama: 'Nagrak', kec: 'Gunung Putri' },
  { kode: '32.01.02.2010', nama: 'Karanggan', kec: 'Gunung Putri' },
  
  // Kecamatan Citeureup  
  { kode: '32.01.03.1006', nama: 'Puspanegara', kec: 'Citeureup' },
  { kode: '32.01.03.1007', nama: 'Karang Asem Barat', kec: 'Citeureup' },
  { kode: '32.01.03.2001', nama: 'Puspasari', kec: 'Citeureup' },
  { kode: '32.01.03.2002', nama: 'Citeureup', kec: 'Citeureup' },
  { kode: '32.01.03.2003', nama: 'Leuwinutug', kec: 'Citeureup' },
  { kode: '32.01.03.2004', nama: 'Tajur', kec: 'Citeureup' },
  { kode: '32.01.03.2005', nama: 'Sanja', kec: 'Citeureup' },
  { kode: '32.01.03.2008', nama: 'Karang Asem Timur', kec: 'Citeureup' },
  { kode: '32.01.03.2009', nama: 'Tarikolot', kec: 'Citeureup' },
  { kode: '32.01.03.2010', nama: 'Gunungsari', kec: 'Citeureup' },
  { kode: '32.01.03.2011', nama: 'Tangkil', kec: 'Citeureup' },
  { kode: '32.01.03.2012', nama: 'Sukahati', kec: 'Citeureup' },
  { kode: '32.01.03.2013', nama: 'Hambalang', kec: 'Citeureup' },
  { kode: '32.01.03.2014', nama: 'Pasirmukti', kec: 'Citeureup' },
  
  // Kecamatan Sukaraja
  { kode: '32.01.04.2001', nama: 'Gununggeulis', kec: 'Sukaraja' },
  { kode: '32.01.04.2002', nama: 'Cilebut Timur', kec: 'Sukaraja' },
  { kode: '32.01.04.2003', nama: 'Cilebut Barat', kec: 'Sukaraja' },
  { kode: '32.01.04.2004', nama: 'Cibanon', kec: 'Sukaraja' },
  { kode: '32.01.04.2005', nama: 'Nagrak', kec: 'Sukaraja' },
  { kode: '32.01.04.2006', nama: 'Sukatani', kec: 'Sukaraja' },
  { kode: '32.01.04.2007', nama: 'Sukaraja', kec: 'Sukaraja' },
  { kode: '32.01.04.2008', nama: 'Cikeas', kec: 'Sukaraja' },
  { kode: '32.01.04.2009', nama: 'Pasir Jambu', kec: 'Sukaraja' },
  { kode: '32.01.04.2010', nama: 'Cimandala', kec: 'Sukaraja' },
  { kode: '32.01.04.2011', nama: 'Cijujung', kec: 'Sukaraja' },
  { kode: '32.01.04.2012', nama: 'Cadasngampar', kec: 'Sukaraja' },
  { kode: '32.01.04.2013', nama: 'Pasirlaja', kec: 'Sukaraja' },
  
  // Kecamatan Babakan Madang
  { kode: '32.01.05.2001', nama: 'Cijayanti', kec: 'Babakan Madang' },
  { kode: '32.01.05.2002', nama: 'Sumurbatu', kec: 'Babakan Madang' },
  { kode: '32.01.05.2003', nama: 'Sentul', kec: 'Babakan Madang' },
  { kode: '32.01.05.2004', nama: 'Karangtengah', kec: 'Babakan Madang' },
  { kode: '32.01.05.2005', nama: 'Cipambuan', kec: 'Babakan Madang' },
  { kode: '32.01.05.2006', nama: 'Kadumanggu', kec: 'Babakan Madang' },
  { kode: '32.01.05.2007', nama: 'Citaringgul', kec: 'Babakan Madang' },
  { kode: '32.01.05.2008', nama: 'Babakan Madang', kec: 'Babakan Madang' },
  { kode: '32.01.05.2009', nama: 'Bojong Koneng', kec: 'Babakan Madang' },
  
  // Kecamatan Jonggol
  { kode: '32.01.06.2001', nama: 'Sukamaju', kec: 'Jonggol' },
  { kode: '32.01.06.2002', nama: 'Sirnagalih', kec: 'Jonggol' },
  { kode: '32.01.06.2003', nama: 'Singajaya', kec: 'Jonggol' },
  { kode: '32.01.06.2004', nama: 'Sukasirna', kec: 'Jonggol' },
  { kode: '32.01.06.2005', nama: 'Sukanegara', kec: 'Jonggol' },
  { kode: '32.01.06.2006', nama: 'Sukamanah', kec: 'Jonggol' },
  { kode: '32.01.06.2007', nama: 'Weninggalih', kec: 'Jonggol' },
  { kode: '32.01.06.2008', nama: 'Cibodas', kec: 'Jonggol' },
  { kode: '32.01.06.2009', nama: 'Jonggol', kec: 'Jonggol' },
  { kode: '32.01.06.2010', nama: 'Bendungan', kec: 'Jonggol' },
  { kode: '32.01.06.2011', nama: 'Singasari', kec: 'Jonggol' },
  { kode: '32.01.06.2012', nama: 'Balekambang', kec: 'Jonggol' },
  { kode: '32.01.06.2013', nama: 'Sukajaya', kec: 'Jonggol' },
  { kode: '32.01.06.2014', nama: 'Sukagalih', kec: 'Jonggol' },
  
  // Kecamatan Cileungsi
  { kode: '32.01.07.2001', nama: 'Pasirangin', kec: 'Cileungsi' },
  { kode: '32.01.07.2002', nama: 'Mekarsari', kec: 'Cileungsi' },
  { kode: '32.01.07.2003', nama: 'Mampir', kec: 'Cileungsi' },
  { kode: '32.01.07.2004', nama: 'Dayeuh', kec: 'Cileungsi' },
  { kode: '32.01.07.2005', nama: 'Gandoang', kec: 'Cileungsi' },
  { kode: '32.01.07.2006', nama: 'Jatisari', kec: 'Cileungsi' },
  { kode: '32.01.07.2007', nama: 'Cileungsi Kidul', kec: 'Cileungsi' },
  { kode: '32.01.07.2008', nama: 'Cipeucang', kec: 'Cileungsi' },
  { kode: '32.01.07.2009', nama: 'Situsari', kec: 'Cileungsi' },
  { kode: '32.01.07.2010', nama: 'Cipenjo', kec: 'Cileungsi' },
  { kode: '32.01.07.2011', nama: 'Limusnunggal', kec: 'Cileungsi' },
  { kode: '32.01.07.2012', nama: 'Cileungsi', kec: 'Cileungsi' },
  
  // Kecamatan Cariu
  { kode: '32.01.08.2001', nama: 'Karyamekar', kec: 'Cariu' },
  { kode: '32.01.08.2002', nama: 'Babakanraden', kec: 'Cariu' },
  { kode: '32.01.08.2003', nama: 'Cikutamahi', kec: 'Cariu' },
  { kode: '32.01.08.2004', nama: 'Kutamekar', kec: 'Cariu' },
  { kode: '32.01.08.2005', nama: 'Cariu', kec: 'Cariu' },
  { kode: '32.01.08.2006', nama: 'Mekarwangi', kec: 'Cariu' },
  { kode: '32.01.08.2007', nama: 'Bantarkuning', kec: 'Cariu' },
  { kode: '32.01.08.2008', nama: 'Sukajadi', kec: 'Cariu' },
  { kode: '32.01.08.2009', nama: 'Tegalpanjang', kec: 'Cariu' },
  { kode: '32.01.08.2010', nama: 'Cibatutiga', kec: 'Cariu' },
  
  // Kecamatan Sukamakmur
  { kode: '32.01.09.2001', nama: 'Wargajaya', kec: 'Sukamakmur' },
  { kode: '32.01.09.2002', nama: 'Pabuaran', kec: 'Sukamakmur' },
  { kode: '32.01.09.2003', nama: 'Sukadamai', kec: 'Sukamakmur' },
  { kode: '32.01.09.2004', nama: 'Sukawangi', kec: 'Sukamakmur' },
  { kode: '32.01.09.2005', nama: 'Cibadak', kec: 'Sukamakmur' },
  { kode: '32.01.09.2006', nama: 'Sukaresmi', kec: 'Sukamakmur' },
  { kode: '32.01.09.2007', nama: 'Sukamulya', kec: 'Sukamakmur' },
  { kode: '32.01.09.2008', nama: 'Sukaharja', kec: 'Sukamakmur' },
  { kode: '32.01.09.2009', nama: 'Sirnajaya', kec: 'Sukamakmur' },
  { kode: '32.01.09.2010', nama: 'Sukamakmur', kec: 'Sukamakmur' },
  
  // Kecamatan Parung
  { kode: '32.01.10.2001', nama: 'Parung', kec: 'Parung' },
  { kode: '32.01.10.2002', nama: 'Iwul', kec: 'Parung' },
  { kode: '32.01.10.2003', nama: 'Bojongsempu', kec: 'Parung' },
  { kode: '32.01.10.2004', nama: 'Waru', kec: 'Parung' },
  { kode: '32.01.10.2005', nama: 'Cogreg', kec: 'Parung' },
  { kode: '32.01.10.2006', nama: 'Pamegarsari', kec: 'Parung' },
  { kode: '32.01.10.2007', nama: 'Warujaya', kec: 'Parung' },
  { kode: '32.01.10.2008', nama: 'Bojongindah', kec: 'Parung' },
  { kode: '32.01.10.2009', nama: 'Jabonmekar', kec: 'Parung' },
  
  // Kecamatan Gunung Sindur
  { kode: '32.01.11.2001', nama: 'Cidokom', kec: 'Gunung Sindur' },
  { kode: '32.01.11.2002', nama: 'Padurenan', kec: 'Gunung Sindur' },
  { kode: '32.01.11.2003', nama: 'Pengasinan', kec: 'Gunung Sindur' },
  { kode: '32.01.11.2004', nama: 'Curug', kec: 'Gunung Sindur' },
  { kode: '32.01.11.2005', nama: 'Gunungsindur', kec: 'Gunung Sindur' },
  { kode: '32.01.11.2006', nama: 'Jampang', kec: 'Gunung Sindur' },
  { kode: '32.01.11.2007', nama: 'Cibadung', kec: 'Gunung Sindur' },
  { kode: '32.01.11.2008', nama: 'Cibinong', kec: 'Gunung Sindur' },
  { kode: '32.01.11.2009', nama: 'Rawakalong', kec: 'Gunung Sindur' },
  { kode: '32.01.11.2010', nama: 'Pabuaran', kec: 'Gunung Sindur' },
  
  // Kecamatan Kemang
  { kode: '32.01.12.1006', nama: 'Atang Senjaya', kec: 'Kemang' },
  { kode: '32.01.12.2001', nama: 'Bojong', kec: 'Kemang' },
  { kode: '32.01.12.2002', nama: 'Parakanjaya', kec: 'Kemang' },
  { kode: '32.01.12.2003', nama: 'Kemang', kec: 'Kemang' },
  { kode: '32.01.12.2004', nama: 'Pabuaran', kec: 'Kemang' },
  { kode: '32.01.12.2005', nama: 'Semplak Barat', kec: 'Kemang' },
  { kode: '32.01.12.2007', nama: 'Jampang', kec: 'Kemang' },
  { kode: '32.01.12.2008', nama: 'Pondok Udik', kec: 'Kemang' },
  { kode: '32.01.12.2009', nama: 'Tegal', kec: 'Kemang' },
  
  // Kecamatan Bojong Gede
  { kode: '32.01.13.1007', nama: 'Pabuaran', kec: 'Bojong Gede' },
  { kode: '32.01.13.2001', nama: 'Bojongbaru', kec: 'Bojong Gede' },
  { kode: '32.01.13.2002', nama: 'Cimanggis', kec: 'Bojong Gede' },
  { kode: '32.01.13.2003', nama: 'Susukan', kec: 'Bojong Gede' },
  { kode: '32.01.13.2004', nama: 'Ragajaya', kec: 'Bojong Gede' },
  { kode: '32.01.13.2005', nama: 'Kedungwaringin', kec: 'Bojong Gede' },
  { kode: '32.01.13.2006', nama: 'Waringinjaya', kec: 'Bojong Gede' },
  { kode: '32.01.13.2008', nama: 'Rawapanjang', kec: 'Bojong Gede' },
  { kode: '32.01.13.2009', nama: 'Bojonggede', kec: 'Bojong Gede' },
  
  // Kecamatan Leuwiliang
  { kode: '32.01.14.2001', nama: 'Leuwiliang', kec: 'Leuwiliang' },
  { kode: '32.01.14.2002', nama: 'Purasari', kec: 'Leuwiliang' },
  { kode: '32.01.14.2003', nama: 'Karyasari', kec: 'Leuwiliang' },
  { kode: '32.01.14.2004', nama: 'Pabangbon', kec: 'Leuwiliang' },
  { kode: '32.01.14.2005', nama: 'Karacak', kec: 'Leuwiliang' },
  { kode: '32.01.14.2006', nama: 'Barengkok', kec: 'Leuwiliang' },
  { kode: '32.01.14.2007', nama: 'Leuwimekar', kec: 'Leuwiliang' },
  { kode: '32.01.14.2008', nama: 'Puraseda', kec: 'Leuwiliang' },
  { kode: '32.01.14.2009', nama: 'Cibeber I', kec: 'Leuwiliang' },
  { kode: '32.01.14.2010', nama: 'Cibeber II', kec: 'Leuwiliang' },
  { kode: '32.01.14.2011', nama: 'Karehkel', kec: 'Leuwiliang' },
  
  // Data kecamatan lainnya (Ciampea, Cibungbulang, Pamijahan, Rumpin, Jasinga, dll)
  // ... akan dilanjutkan dalam implementasi
];

/**
 * Fungsi untuk membuat slug dari string
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Spasi jadi -
    .replace(/[^\w\-]+/g, '')   // Hapus karakter non-word
    .replace(/\-\-+/g, '-')     // Multiple - jadi single -
    .replace(/^-+/, '')         // Trim - dari awal
    .replace(/-+$/, '');        // Trim - dari akhir
}

async function clearAndSeed() {
  let connection;
  
  try {
    connection = await mysql.getConnection();
    
    console.log('🗑️  Menghapus data lama...');
    
    // Hapus data dalam urutan yang benar (child dulu, parent belakangan)
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Hapus users
    await connection.query('DELETE FROM users WHERE role IN ("desa", "kecamatan")');
    console.log('✅ Data users (desa & kecamatan) dihapus');
    
    // Hapus data kelembagaan yang terkait dengan desa
    await connection.query('DELETE FROM pengurus');
    await connection.query('DELETE FROM pkks');
    await connection.query('DELETE FROM satlinmas');
    await connection.query('DELETE FROM lpms');
    await connection.query('DELETE FROM karang_tarunas');
    await connection.query('DELETE FROM posyandus');
    await connection.query('DELETE FROM rts');
    await connection.query('DELETE FROM rws');
    console.log('✅ Data kelembagaan dihapus');
    
    // Hapus desa dan kecamatan
    await connection.query('DELETE FROM desas');
    await connection.query('DELETE FROM kecamatans');
    console.log('✅ Data desas & kecamatans dihapus');
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('\n📥 Memasukkan data baru...\n');
    
    // --- INSERT KECAMATAN ---
    console.log('📍 Inserting kecamatans...');
    for (const kec of kecamatans) {
      await connection.query(
        'INSERT INTO kecamatans (id_kecamatan, nama_kecamatan) VALUES (?, ?)',
        [kec.id, kec.nama]
      );
      console.log(`  ✓ Kecamatan ${kec.nama}`);
    }
    console.log(`✅ ${kecamatans.length} kecamatan berhasil ditambahkan\n`);
    
    // --- INSERT DESA ---
    console.log('🏘️  Inserting desas...');
    for (const desa of desas) {
      // Generate kode_desa (format: 32.01.XXXX atau sesuai kebutuhan)
      // Untuk sementara gunakan format: kecamatan_id.desa_id (contoh: 1.001, 2.009, dst)
      const kodeDesa = `${String(desa.kecamatan_id).padStart(2, '0')}.${String(desa.id).padStart(3, '0')}`;
      
      await connection.query(
        'INSERT INTO desas (id_desa, nama_desa, id_kecamatan, kode_desa, status_pemerintahan) VALUES (?, ?, ?, ?, ?)',
        [desa.id, desa.nama, desa.kecamatan_id, kodeDesa, desa.status]
      );
      console.log(`  ✓ ${desa.status === 'desa' ? 'Desa' : 'Kelurahan'} ${desa.nama} (Kec. ${kecamatans.find(k => k.id === desa.kecamatan_id).nama}) - Kode: ${kodeDesa}`);
    }
    console.log(`✅ ${desas.length} desa/kelurahan berhasil ditambahkan\n`);
    
    // --- INSERT USER ADMIN DESA ---
    console.log('👤 Creating admin desa users...');
    const hashedPassword = await bcrypt.hash('password', 10);
    
    for (const desa of desas) {
      const kecamatan = kecamatans.find(k => k.id === desa.kecamatan_id);
      const desaSlug = slugify(desa.nama);
      const kecamatanSlug = slugify(kecamatan.nama);
      
      const email = `desa.${desaSlug}.${kecamatanSlug}@dpmd.bogorkab.go.id`;
      const name = `Admin Desa ${desa.nama}`;
      
      await connection.query(
        `INSERT INTO users (name, email, password, role, desa_id, created_at, updated_at) 
         VALUES (?, ?, ?, 'desa', ?, NOW(), NOW())`,
        [name, email, hashedPassword, desa.id]
      );
      
      console.log(`  ✓ ${email}`);
    }
    console.log(`✅ ${desas.length} admin desa berhasil ditambahkan\n`);
    
    // --- INSERT USER ADMIN KECAMATAN ---
    console.log('👥 Creating admin kecamatan users...');
    
    for (const kec of kecamatans) {
      const kecamatanSlug = slugify(kec.nama);
      const email = `kecamatan.${kecamatanSlug}@dpmd.bogorkab.go.id`;
      const name = `Admin Kecamatan ${kec.nama}`;
      
      await connection.query(
        `INSERT INTO users (name, email, password, role, kecamatan_id, created_at, updated_at) 
         VALUES (?, ?, ?, 'kecamatan', ?, NOW(), NOW())`,
        [name, email, hashedPassword, kec.id]
      );
      
      console.log(`  ✓ ${email}`);
    }
    console.log(`✅ ${kecamatans.length} admin kecamatan berhasil ditambahkan\n`);
    
    // --- SUMMARY ---
    console.log('=' .repeat(60));
    console.log('🎉 SEEDER BERHASIL DIJALANKAN!');
    console.log('=' .repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   • Kecamatan: ${kecamatans.length} data`);
    console.log(`   • Desa/Kelurahan: ${desas.length} data`);
    console.log(`   • Admin Desa: ${desas.length} users`);
    console.log(`   • Admin Kecamatan: ${kecamatans.length} users`);
    console.log(`   • Total Users: ${desas.length + kecamatans.length} users`);
    console.log('');
    console.log('📝 Credential Login:');
    console.log('   Email: desa.[nama-desa].[nama-kecamatan]@dpmd.bogorkab.go.id');
    console.log('   Email: kecamatan.[nama-kecamatan]@dpmd.bogorkab.go.id');
    console.log('   Password: password');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('❌ Error saat seeding:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
    mysql.end();
  }
}

// Run seeder
clearAndSeed()
  .then(() => {
    console.log('\n✅ Seeder completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeder failed:', error);
    process.exit(1);
  });
