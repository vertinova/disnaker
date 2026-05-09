// Route: CRUD Bidang untuk Superadmin
// Mount di: /api/admin/bidang
const express = require('express');
const prisma = require('../config/prisma');
const { auth, requireSuperadmin } = require('../middlewares/auth');

const router = express.Router();
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.use(auth, requireSuperadmin);

// GET /api/admin/bidang - list semua bidang
router.get('/', asyncHandler(async (_req, res) => {
  const bidangs = await prisma.bidangs.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      nama: true,
      _count: { select: { pegawai: true } },
    },
  });

  return res.json({
    success: true,
    data: bidangs.map((b) => ({
      id: b.id.toString(),
      nama: b.nama,
      jumlah_pegawai: b._count.pegawai,
    })),
  });
}));

// POST /api/admin/bidang - tambah bidang baru
router.post('/', asyncHandler(async (req, res) => {
  const nama = (req.body.nama || '').trim();
  if (!nama) {
    return res.status(422).json({ success: false, message: 'Nama bidang wajib diisi' });
  }

  const existing = await prisma.bidangs.findFirst({ where: { nama: { equals: nama } } });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Nama bidang sudah ada' });
  }

  const bidang = await prisma.bidangs.create({
    data: { nama, created_at: new Date(), updated_at: new Date() },
  });

  return res.status(201).json({ success: true, data: { id: bidang.id.toString(), nama: bidang.nama } });
}));

// PUT /api/admin/bidang/:id - edit bidang
router.put('/:id', asyncHandler(async (req, res) => {
  const id = BigInt(req.params.id);
  const nama = (req.body.nama || '').trim();
  if (!nama) {
    return res.status(422).json({ success: false, message: 'Nama bidang wajib diisi' });
  }

  const duplicate = await prisma.bidangs.findFirst({
    where: { nama: { equals: nama }, NOT: { id } },
  });
  if (duplicate) {
    return res.status(409).json({ success: false, message: 'Nama bidang sudah ada' });
  }

  const bidang = await prisma.bidangs.update({
    where: { id },
    data: { nama, updated_at: new Date() },
  });

  return res.json({ success: true, data: { id: bidang.id.toString(), nama: bidang.nama } });
}));

// DELETE /api/admin/bidang/:id - hapus bidang (cek ada pegawai dulu)
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = BigInt(req.params.id);

  const count = await prisma.pegawai.count({ where: { id_bidang: id } });
  if (count > 0) {
    return res.status(409).json({
      success: false,
      message: `Tidak bisa dihapus, masih ada ${count} pegawai di bidang ini`,
    });
  }

  await prisma.bidangs.delete({ where: { id } });
  return res.json({ success: true, message: 'Bidang dihapus' });
}));

module.exports = router;
