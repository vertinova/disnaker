# Jadwal Kegiatan - Authorization Rules

## 📋 Business Rules

### 1. **Viewing (READ)**
- ✅ **SEMUA role** bisa melihat jadwal kegiatan dari **SEMUA bidang**
- Tidak ada filter berdasarkan bidang_id untuk viewing
- Tujuan: Koordinasi antar bidang dan integrasi kegiatan

### 2. **Creating (CREATE)**
- ✅ **HANYA Sekretariat (bidang_id = 2)** yang boleh menambah jadwal kegiatan
- ✅ **HANYA Superadmin** yang boleh menambah jadwal kegiatan
- ❌ **Bidang lain** (SPKED, KKD, PMD, Pemdes) TIDAK bisa menambah jadwal

### 3. **Editing (UPDATE)**
- ✅ **HANYA Sekretariat (bidang_id = 2)** yang boleh edit jadwal kegiatan
- ✅ **HANYA Superadmin** yang boleh edit jadwal kegiatan
- ❌ **Bidang lain** TIDAK bisa edit jadwal

### 4. **Deleting (DELETE)**
- ✅ **HANYA Sekretariat (bidang_id = 2)** yang boleh hapus jadwal kegiatan
- ✅ **HANYA Superadmin** yang boleh hapus jadwal kegiatan
- ❌ **Bidang lain** TIDAK bisa hapus jadwal

## 🔧 Backend Changes

### File: `jadwalKegiatan.controller.js`

#### 1. `getAllJadwal()` - NO FILTER
```javascript
// ❌ OLD: Filter by bidang_id
if (user.bidang_id) {
  where.bidang_id = user.bidang_id;
}

// ✅ NEW: No filter - all users see all jadwal
console.log('✓ No bidang filter - showing all jadwal kegiatan for coordination');
```

#### 2. `createJadwal()` - ONLY SEKRETARIAT & SUPERADMIN
```javascript
// Check authorization
if (user.role !== 'superadmin' && user.bidang_id !== 2) {
  return res.status(403).json({
    success: false,
    message: 'Hanya Sekretariat yang dapat menambah jadwal kegiatan'
  });
}
```

#### 3. `updateJadwal()` - ONLY SEKRETARIAT & SUPERADMIN
```javascript
// Check authorization
if (req.user.role !== 'superadmin' && req.user.bidang_id !== 2) {
  return res.status(403).json({
    success: false,
    message: 'Hanya Sekretariat yang dapat mengedit jadwal kegiatan'
  });
}
```

#### 4. `deleteJadwal()` - ONLY SEKRETARIAT & SUPERADMIN
```javascript
// Check authorization
if (req.user.role !== 'superadmin' && req.user.bidang_id !== 2) {
  return res.status(403).json({
    success: false,
    message: 'Hanya Sekretariat yang dapat menghapus jadwal kegiatan'
  });
}
```

## 🎨 Frontend Changes

### File: `JadwalKegiatanPage.jsx`

#### 1. Hide "Tambah Jadwal" Button
```jsx
{/* Tambah Jadwal - Only show for Sekretariat and Superadmin */}
{(user?.bidang_id === 2 || user?.role === 'superadmin') && (
  <button
    onClick={() => setShowAddModal(true)}
    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl hover:from-teal-700 hover:to-cyan-700 font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
  >
    <LuPlus className="w-5 h-5" />
    Tambah Jadwal
  </button>
)}
```

#### 2. Hide Edit & Hapus Buttons in Grid View
```jsx
{/* Actions - Only show for Sekretariat (bidang_id = 2) and Superadmin */}
{(user?.bidang_id === 2 || user?.role === 'superadmin') && (
  <div className="flex gap-2 pt-4 border-t">
    <button
      onClick={() => handleEdit(jadwal)}
      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
    >
      <LuPencil className="w-4 h-4" />
      Edit
    </button>
    <button
      onClick={() => handleDelete(jadwal.id)}
      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
    >
      <LuTrash2 className="w-4 h-4" />
      Hapus
    </button>
  </div>
)}
```

#### 3. Disable Click Event in Calendar View (for non-Sekretariat)
```jsx
<JadwalKalenderView
  jadwals={jadwals}
  onEventClick={(user?.bidang_id === 2 || user?.role === 'superadmin') ? handleEdit : undefined}
/>
```

## 📊 User Experience by Bidang

### Sekretariat (bidang_id = 2)
- ✅ Lihat semua jadwal
- ✅ Tambah jadwal baru
- ✅ Edit semua jadwal
- ✅ Hapus semua jadwal
- **Dashboard**: Button "Tambah Jadwal" muncul, button Edit & Hapus muncul

### SPKED / KKD / PMD / Pemdes (bidang_id = 3-6)
- ✅ Lihat semua jadwal (read-only)
- ❌ Tidak bisa tambah jadwal
- ❌ Tidak bisa edit jadwal
- ❌ Tidak bisa hapus jadwal
- **Dashboard**: Button "Tambah Jadwal" TIDAK muncul, button Edit & Hapus TIDAK muncul

### Kepala Dinas / Sekretaris Dinas
- ✅ Lihat semua jadwal (read-only)
- ❌ Tidak bisa tambah jadwal (unless bidang_id = 2)
- ❌ Tidak bisa edit jadwal (unless bidang_id = 2)
- ❌ Tidak bisa hapus jadwal (unless bidang_id = 2)

### Superadmin
- ✅ Lihat semua jadwal
- ✅ Tambah jadwal baru
- ✅ Edit semua jadwal
- ✅ Hapus semua jadwal
- **Dashboard**: Full control seperti Sekretariat

## 🔐 Security Notes

1. **Backend Enforcement**: Always check authorization di backend, jangan hanya di frontend
2. **Consistent Checking**: Gunakan `req.user.bidang_id === 2` atau `req.user.role === 'superadmin'`
3. **Error Messages**: Return clear 403 Forbidden dengan pesan yang jelas
4. **Frontend Hiding**: Hide UI elements untuk UX yang lebih baik, tapi tetap enforce di backend

## 🧪 Testing Checklist

### Test sebagai Sekretariat User
- [ ] Bisa lihat semua jadwal kegiatan
- [ ] Button "Tambah Jadwal" muncul
- [ ] Bisa membuat jadwal kegiatan baru
- [ ] Button "Edit" muncul di setiap card jadwal
- [ ] Bisa edit jadwal kegiatan
- [ ] Button "Hapus" muncul di setiap card jadwal
- [ ] Bisa hapus jadwal kegiatan

### Test sebagai SPKED/KKD/PMD/Pemdes User
- [ ] Bisa lihat semua jadwal kegiatan
- [ ] Button "Tambah Jadwal" TIDAK muncul
- [ ] Tidak bisa membuat jadwal (kalau coba via API return 403)
- [ ] Button "Edit" TIDAK muncul di card jadwal
- [ ] Tidak bisa edit jadwal (kalau coba via API return 403)
- [ ] Button "Hapus" TIDAK muncul di card jadwal
- [ ] Tidak bisa hapus jadwal (kalau coba via API return 403)

### Test sebagai Superadmin
- [ ] Bisa lihat semua jadwal kegiatan
- [ ] Button "Tambah Jadwal" muncul
- [ ] Bisa membuat jadwal kegiatan baru
- [ ] Button "Edit" muncul
- [ ] Bisa edit jadwal kegiatan
- [ ] Button "Hapus" muncul
- [ ] Bisa hapus jadwal kegiatan

## 📝 Files to Modify

### Backend
- ✅ `src/controllers/jadwalKegiatan.controller.js`
  - Update `getAllJadwal()` - remove bidang filter
  - Update `createJadwal()` - add Sekretariat check
  - Update `updateJadwal()` - add Sekretariat check
  - Update `deleteJadwal()` - add Sekretariat check

### Frontend
- ⏳ `src/pages/bidang/sekretariat/JadwalKegiatanPage.jsx` (FILE RUSAK - PERLU DIPERBAIKI MANUAL)
  - Add conditional rendering untuk "Tambah Jadwal" button
  - Add conditional rendering untuk "Edit" button
  - Add conditional rendering untuk "Hapus" button
  - Update calendar onEventClick prop

## ✅ IMPLEMENTATION STATUS - COMPLETED

### Backend Implementation ✅
- **File**: `jadwalKegiatan.controller.js`
- **Status**: COMPLETE - All authorization checks implemented
- **Changes**:
  - ✅ `getAllJadwal()`: NO bidang filter - all users see all jadwal
  - ✅ `createJadwal()`: Authorization check for Sekretariat/Superadmin
  - ✅ `updateJadwal()`: Authorization check for Sekretariat/Superadmin  
  - ✅ `deleteJadwal()`: Authorization check for Sekretariat/Superadmin
- **Authorization Logic**:
  ```javascript
  const SEKRETARIAT_BIDANG_ID = 2;
  const userBidangId = Number(req.user.bidang_id);
  
  if (req.user.role !== 'superadmin' && userBidangId !== SEKRETARIAT_BIDANG_ID) {
    return res.status(403).json({
      success: false,
      message: 'Hanya bidang Sekretariat yang dapat mengelola jadwal.'
    });
  }
  ```

### Frontend Implementation ✅
- **File**: `JadwalKegiatanPage.jsx`
- **Status**: COMPLETE - File rebuilt with conditional rendering
- **Changes**:
  - ✅ Fetch user from localStorage
  - ✅ Check authorization: `canManageJadwal = user?.bidang_id === 2 || user?.role === 'superadmin'`
  - ✅ Conditional "Tambah Jadwal" button in header
  - ✅ Conditional "Edit" and "Hapus" buttons in jadwal cards
  - ✅ Grid and Calendar view modes
  - ✅ Filtering and pagination
- **Key Code**:
  ```javascript
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canManageJadwal = user?.bidang_id === 2 || user?.role === 'superadmin';
  
  // Then wrap management buttons:
  {canManageJadwal && (
    <button onClick={() => handleEdit(jadwal)}>Edit</button>
  )}
  ```

### Routes Implementation ✅
- **Status**: COMPLETE - All routes configured
- **Files Updated**:
  - ✅ `App.jsx`: Added `/kepala-dinas/jadwal-kegiatan`, `/sekretaris-dinas/jadwal-kegiatan`, `/kepala-bidang/jadwal-kegiatan`, `/ketua-tim/jadwal-kegiatan`, `/pegawai/jadwal-kegiatan`
  - ✅ All Layout files: Updated bottomNavItems to point to role-specific routes

## 🎯 Summary

**Prinsip Utama**: 
- ✅ Semua bidang bisa LIHAT semua jadwal (untuk koordinasi)
- ✅ Hanya SEKRETARIAT yang bisa KELOLA (tambah/edit/hapus) jadwal
- ✅ Superadmin memiliki akses penuh seperti Sekretariat

**Tujuan**:
- ✅ Transparansi kegiatan antar bidang
- ✅ Koordinasi yang lebih baik
- ✅ Centralized management oleh Sekretariat

## 🧪 Testing Checklist

### Test Case 1: Sekretariat User
- [ ] Login sebagai user dari bidang Sekretariat (bidang_id=2)
- [ ] Verifikasi tombol "Tambah Jadwal" muncul
- [ ] Verifikasi tombol "Edit" dan "Hapus" muncul di setiap jadwal card
- [ ] Test create jadwal baru → harus berhasil
- [ ] Test edit jadwal existing → harus berhasil
- [ ] Test delete jadwal → harus berhasil

### Test Case 2: Non-Sekretariat User (SPKED/KKD/PMD)
- [ ] Login sebagai user dari bidang SPKED (bidang_id=3) atau lainnya
- [ ] Verifikasi tombol "Tambah Jadwal" TIDAK muncul
- [ ] Verifikasi tombol "Edit" dan "Hapus" TIDAK muncul
- [ ] Verifikasi dapat melihat semua jadwal (read-only)
- [ ] Test akses API create → harus return 403 Forbidden
- [ ] Test akses API update → harus return 403 Forbidden
- [ ] Test akses API delete → harus return 403 Forbidden

### Test Case 3: Superadmin
- [ ] Login sebagai superadmin
- [ ] Verifikasi semua tombol management muncul
- [ ] Test semua operasi CRUD → semua harus berhasil

## 📅 Implementation Date
- **Completed**: December 2024
- **Backend Authorization**: ✅ Complete
- **Frontend Conditional Rendering**: ✅ Complete
- **Testing**: ⏳ Pending user testing

```