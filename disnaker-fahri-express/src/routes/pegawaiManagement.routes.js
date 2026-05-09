const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { auth, requireSuperadmin } = require('../middlewares/auth');

const router = express.Router();

const DEFAULT_PASSWORD = 'password';
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const statusOptions = [
  'PNS',
  'PPPK',
  'PPPK_Paruh_Waktu',
  'Honorer',
  'THL',
  'Kontrak',
  'Tenaga_Alih_Daya',
  'Tenaga_Keamanan',
  'Tenaga_Kebersihan',
];

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : value);

const toUserPayload = (record) => ({
  id: record.id.toString(),
  name: record.name,
  email: record.email,
  role: record.role,
  is_active: record.is_active,
  plain_password: record.plain_password,
  bidang_id: record.bidang_id,
  pegawai_id: record.pegawai_id ? record.pegawai_id.toString() : null,
  pegawai: record.pegawai ? {
    id_pegawai: record.pegawai.id_pegawai.toString(),
    nama_pegawai: record.pegawai.nama_pegawai,
    nip: record.pegawai.nip,
    jabatan: record.pegawai.jabatan,
    status_kepegawaian: record.pegawai.status_kepegawaian,
    jenis_kelamin: record.pegawai.jenis_kelamin,
    no_hp: record.pegawai.no_hp,
    unit_kerja: record.pegawai.unit_kerja,
    bidang: record.pegawai.bidangs ? {
      id: record.pegawai.bidangs.id.toString(),
      nama: record.pegawai.bidangs.nama,
    } : null,
  } : null,
});

const buildUserInclude = {
  pegawai: {
    include: {
      bidangs: true,
    },
  },
};

router.use(auth, requireSuperadmin);

router.get('/options', asyncHandler(async (_req, res) => {
  const bidangs = await prisma.bidangs.findMany({
    orderBy: { id: 'asc' },
    select: { id: true, nama: true },
  });

  return res.json({
    success: true,
    data: {
      bidangs: bidangs.map((bidang) => ({ id: bidang.id.toString(), nama: bidang.nama })),
      status_kepegawaian: statusOptions,
      default_password: DEFAULT_PASSWORD,
    },
  });
}));

router.get('/', asyncHandler(async (req, res) => {
  const search = normalizeText(req.query.search || '');

  const where = {
    role: { in: ['pegawai', 'superadmin', 'sekretaris_dinas', 'kepala_dinas', 'kepala_bidang', 'ketua_tim'] },
    ...(search ? {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
        { pegawai: { is: { nama_pegawai: { contains: search } } } },
        { pegawai: { is: { nip: { contains: search } } } },
      ],
    } : {}),
  };

  const users = await prisma.users.findMany({
    where,
    include: buildUserInclude,
    orderBy: { created_at: 'desc' },
  });

  return res.json({
    success: true,
    data: users.map(toUserPayload),
  });
}));

router.post('/', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const name = normalizeText(body.name);
  const email = normalizeText(body.email);
  const password = normalizeText(body.password) || DEFAULT_PASSWORD;
  const bidangId = body.bidang_id ? BigInt(body.bidang_id) : null;
  const role = normalizeText(body.role) || 'pegawai';

  if (!name || !email || !bidangId) {
    return res.status(422).json({
      success: false,
      message: 'Nama, email, dan bidang wajib diisi',
    });
  }

  const existing = await prisma.users.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'Email sudah digunakan',
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const pegawai = await tx.pegawai.create({
      data: {
        id_bidang: bidangId,
        nama_pegawai: name,
        nip: normalizeText(body.nip) || null,
        jabatan: normalizeText(body.jabatan) || null,
        jenis_kelamin: body.jenis_kelamin || null,
        status_kepegawaian: body.status_kepegawaian || null,
        no_hp: normalizeText(body.no_hp) || null,
        unit_kerja: normalizeText(body.unit_kerja) || 'Dinas Tenaga Kerja Kabupaten Bogor',
        tempat_lahir: normalizeText(body.tempat_lahir) || null,
        tanggal_lahir: body.tanggal_lahir ? new Date(body.tanggal_lahir) : null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return tx.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        plain_password: password,
        role,
        bidang_id: Number(bidangId),
        pegawai_id: pegawai.id_pegawai,
        is_active: body.is_active !== false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: buildUserInclude,
    });
  });

  return res.status(201).json({
    success: true,
    message: 'Pegawai berhasil dibuat',
    data: toUserPayload(result),
  });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const userId = BigInt(req.params.id);
  const body = req.body || {};
  const name = normalizeText(body.name);
  const email = normalizeText(body.email);
  const bidangId = body.bidang_id ? BigInt(body.bidang_id) : null;

  if (!name || !email || !bidangId) {
    return res.status(422).json({
      success: false,
      message: 'Nama, email, dan bidang wajib diisi',
    });
  }

  const existing = await prisma.users.findUnique({ where: { id: userId }, include: { pegawai: true } });
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Pegawai tidak ditemukan' });
  }

  const emailOwner = await prisma.users.findUnique({ where: { email } });
  if (emailOwner && emailOwner.id !== userId) {
    return res.status(409).json({ success: false, message: 'Email sudah digunakan' });
  }

  const data = {
    name,
    email,
    role: normalizeText(body.role) || existing.role,
    bidang_id: Number(bidangId),
    is_active: body.is_active !== false,
    updated_at: new Date(),
  };

  if (body.password) {
    data.password = await bcrypt.hash(String(body.password), 10);
    data.plain_password = String(body.password);
  }

  const result = await prisma.$transaction(async (tx) => {
    let pegawaiId = existing.pegawai_id;
    if (!pegawaiId) {
      const pegawai = await tx.pegawai.create({
        data: {
          id_bidang: bidangId,
          nama_pegawai: name,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      pegawaiId = pegawai.id_pegawai;
      data.pegawai_id = pegawaiId;
    }

    await tx.pegawai.update({
      where: { id_pegawai: pegawaiId },
      data: {
        id_bidang: bidangId,
        nama_pegawai: name,
        nip: normalizeText(body.nip) || null,
        jabatan: normalizeText(body.jabatan) || null,
        jenis_kelamin: body.jenis_kelamin || null,
        status_kepegawaian: body.status_kepegawaian || null,
        no_hp: normalizeText(body.no_hp) || null,
        unit_kerja: normalizeText(body.unit_kerja) || 'Dinas Tenaga Kerja Kabupaten Bogor',
        tempat_lahir: normalizeText(body.tempat_lahir) || null,
        tanggal_lahir: body.tanggal_lahir ? new Date(body.tanggal_lahir) : null,
        updated_at: new Date(),
      },
    });

    return tx.users.update({
      where: { id: userId },
      data,
      include: buildUserInclude,
    });
  });

  return res.json({
    success: true,
    message: 'Pegawai berhasil diperbarui',
    data: toUserPayload(result),
  });
}));

router.patch('/:id/reset-password', asyncHandler(async (req, res) => {
  const password = normalizeText(req.body?.password) || DEFAULT_PASSWORD;
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await prisma.users.update({
    where: { id: BigInt(req.params.id) },
    data: {
      password: hashedPassword,
      plain_password: password,
      updated_at: new Date(),
    },
    include: buildUserInclude,
  });

  return res.json({
    success: true,
    message: 'Password berhasil direset',
    data: toUserPayload(result),
  });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const userId = BigInt(req.params.id);

  if (String(req.user.id) === String(req.params.id)) {
    return res.status(422).json({
      success: false,
      message: 'Tidak bisa menghapus akun yang sedang digunakan',
    });
  }

  const existing = await prisma.users.findUnique({ where: { id: userId } });
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Pegawai tidak ditemukan' });
  }

  await prisma.$transaction(async (tx) => {
    await tx.users.delete({ where: { id: userId } });
    if (existing.pegawai_id) {
      await tx.pegawai.delete({ where: { id_pegawai: existing.pegawai_id } }).catch(() => null);
    }
  });

  return res.json({
    success: true,
    message: 'Pegawai berhasil dihapus',
  });
}));

module.exports = router;
