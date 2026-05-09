# Implementasi Navigasi Bidang untuk Pegawai & Activity Logs

**Date:** 27 Desember 2025  
**Author:** System  
**Purpose:** Menambahkan navigasi dinamis ke halaman bidang untuk pegawai dan tracking aktivitas

---

## 🎯 **Requirements**

### 1. **Navigasi Dinamis Berdasarkan Bidang**
- Pegawai dapat akses halaman bidangnya (contoh: Alan dari Bidang Sarpras bisa akses `/bidang/sarpras`)
- Menu di PegawaiLayout menampilkan link sesuai bidang
- Role-based access control

### 2. **Activity Logs / Ringkasan Aktivitas**
- Merekam setiap perubahan yang dilakukan pegawai
- Format: "Alan mengubah nama BUMDes dari A menjadi B"
- Tampilkan di halaman bidang masing-masing

### 3. **Access Control per Bidang**
- Pegawai hanya bisa kelola data sesuai bidang_id mereka
- Filter otomatis berdasarkan bidang

---

## 📊 **Database Structure**

### Table: `activity_logs`
```sql
CREATE TABLE `activity_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `user_name` VARCHAR(255) NOT NULL,
  `user_role` VARCHAR(50) NOT NULL,
  `bidang_id` BIGINT UNSIGNED NULL,
  `module` VARCHAR(100) NOT NULL,
  `action` ENUM('create', 'update', 'delete', 'approve', 'reject', 'upload', 'download'),
  `entity_type` VARCHAR(100) NOT NULL,
  `entity_id` BIGINT UNSIGNED NULL,
  `entity_name` VARCHAR(255) NULL,
  `description` TEXT NOT NULL,
  `old_value` JSON NULL,
  `new_value` JSON NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ...
);
```

---

## � **Bidang Management Mapping (CORRECTED)**

### **Bidang 2: Sekretariat**
Modules:
- Disposisi Surat
- Perjalanan Dinas (Perjadin)
- Manajemen Pegawai

### **Bidang 3: Sarana Prasarana Kewilayahan dan Ekonomi Desa (SPKED)**
Modules:
- Bankeu (Bantuan Keuangan)
- BUMDes (Badan Usaha Milik Desa)

### **Bidang 4: Kekayaan dan Keuangan Desa (KKD)**
Modules:
- ADD (Alokasi Dana Desa)
- DD (Dana Desa)
- BHPRD (Bagi Hasil Pajak dan Retribusi Daerah)

### **Bidang 5: Pemberdayaan Masyarakat Desa (PMD)**
Modules:
- Kelembagaan (RW, RT, Posyandu, Karang Taruna, LPM, PKK, Satlinmas)

### **Bidang 6: Pemerintahan Desa**
Modules:
- Musdesus
- Aparatur Desa
- Produk Hukum

---

## �🔧 **Backend Implementation**

### Step 1: Run Migration
```bash
cd dpmd-fahri-express/database-express
mysql -u root dpmd_db < migrations/20251227_create_activity_logs.sql
```

### Step 2: Create Bidang Routes & Controller

**File:** `src/controllers/bidang.controller.js`
```javascript
const ActivityLogger = require('../utils/activityLogger');
const prisma = require('../config/prisma');

class BidangController {
  // Get bidang dashboard with activity logs
  async getDashboard(req, res) {
    try {
      const { bidangId } = req.params;
      const user = req.user;

      // Check access
      if (user.role === 'pegawai' && user.bidang_id !== parseInt(bidangId)) {
        return res.status(403).json({ 
          success: false,
          message: 'Anda tidak memiliki akses ke bidang ini' 
        });
      }

      // Get bidang info
      const bidang = await prisma.bidangs.findUnique({ 
        where: { id: BigInt(bidangId) } 
      });

      if (!bidang) {
        return res.status(404).json({
          success: false,
          message: 'Bidang tidak ditemukan'
        });
      }

      // Get recent activities
      const activities = await ActivityLogger.getByBidang(bidangId, 20);

      // Get bidang stats (customize per bidang)
      const stats = await this.getBidangStats(bidangId);

      res.json({
        success: true,
        data: {
          bidang,
          stats,
          activities
        }
      });
    } catch (error) {
      console.error('Error getting bidang dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memuat dashboard bidang',
        error: error.message
      });
    }
  }

  // Get stats based on bidang type
  async getBidangStats(bidangId) {
    const bidangIdInt = parseInt(bidangId);
    
    try {
      switch (bidangIdInt) {
        case 2: // Sekretariat
          return {
            total_surat_masuk: await prisma.surat_masuk.count(),
            disposisi_pending: await prisma.disposisi.count({ 
              where: { status: 'pending' } 
            }),
            total_perjalanan_dinas: await prisma.perjalanan_dinas.count(),
            perjadin_bulan_ini: await prisma.perjalanan_dinas.count({
              where: {
                tanggal_mulai: {
                  gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
              }
            }),
            total_pegawai: await prisma.pegawai.count()
          };
          
        case 3: // Sarana Prasarana (Bankeu & BUMDes)
          const totalBumdes = await prisma.bumdes.count();
          const activeBumdes = await prisma.bumdes.count({ 
            where: { status: 'aktif' } 
          });
          
          return {
            total_bumdes: totalBumdes,
            active_bumdes: activeBumdes,
            inactive_bumdes: totalBumdes - activeBumdes,
            total_unit_usaha: (await prisma.bumdes.aggregate({ 
              _sum: { jumlah_unit_usaha: true } 
            }))?._sum?.jumlah_unit_usaha || 0,
            // Bankeu stats (dari JSON files)
            bankeu_tahap1_uploaded: true, // Check file existence
            bankeu_tahap2_uploaded: true
          };
          
        case 4: // Kekayaan Keuangan (ADD, DD, BHPRD)
          const totalDesa = await prisma.desas.count();
          
          return {
            total_desa: totalDesa,
            // ADD stats (dari JSON files)
            add_uploaded: true, // Check file existence
            // DD stats
            dd_uploaded: true,
            dd_earmarked_t1: true,
            dd_earmarked_t2: true,
            dd_nonearmarked_t1: true,
            dd_nonearmarked_t2: true,
            // BHPRD stats
            bhprd_uploaded: true,
            bhprd_t1: true,
            bhprd_t2: true,
            bhprd_t3: true,
            insentif_dd: true
          };
          
        case 5: // Pemberdayaan Masyarakat (Kelembagaan)
          return {
            total_rw: await prisma.rws.count(),
            total_rt: await prisma.rts.count(),
            total_posyandu: await prisma.posyandus.count(),
            total_karang_taruna: await prisma.karang_tarunas.count(),
            total_lpm: await prisma.lpms.count(),
            total_pkk: await prisma.pkks.count(),
            total_satlinmas: await prisma.satlinmas.count(),
            aktif_rw: await prisma.rws.count({ 
              where: { status_kelembagaan: 'aktif' } 
            }),
            aktif_rt: await prisma.rts.count({ 
              where: { status_kelembagaan: 'aktif' } 
            })
          };
          
        case 6: // Pemerintahan Desa
          return {
            total_musdesus: await prisma.musdesus.count(),
            musdesus_approved: await prisma.musdesus.count({ 
              where: { status: 'approved' } 
            }),
            musdesus_pending: await prisma.musdesus.count({ 
              where: { status: 'pending' } 
            }),
            total_aparatur: await prisma.aparatur_desa.count(),
            total_produk_hukum: await prisma.produk_hukums.count(),
            produk_hukum_berlaku: await prisma.produk_hukums.count({
              where: { status_peraturan: 'berlaku' }
            })
          };
          
        default:
          return {};
      }
    } catch (error) {
      console.error(`Error getting stats for bidang ${bidangId}:`, error);
      return {};
    }
  }
}

module.exports = new BidangController();
```

### Step 3: Add Activity Logging to Existing Controllers

**Example: Update BUMDes Controller**
```javascript
// In bumdesController.updateDesaBumdes()
const oldBumdes = await prisma.bumdes.findUnique({ where: { id: bumdesId } });

// ... perform update ...

const updatedBumdes = await prisma.bumdes.update({ ... });

// Log activity
await ActivityLogger.log({
  userId: req.user.id,
  userName: req.user.name,
  userRole: req.user.role,
  bidangId: 4, // Kekayaan Keuangan
  module: 'bumdes',
  action: 'update',
  entityType: 'bumdes',
  entityId: bumdesId,
  entityName: updatedBumdes.nama_bumdes,
  description: ActivityLogger.createDescription(
    'update',
    req.user.name,
    'BUMDes',
    updatedBumdes.nama_bumdes,
    { name: oldBumdes.nama_bumdes },
    { name: updatedBumdes.nama_bumdes }
  ),
  oldValue: oldBumdes,
  newValue: updatedBumdes,
  ipAddress: ActivityLogger.getIpFromRequest(req),
  userAgent: ActivityLogger.getUserAgentFromRequest(req)
});
```

---

## 🎨 **Frontend Implementation**

### Step 1: Add Navigation to PegawaiLayout

**File:** `dpmd-frontend/src/pages/pegawai/PegawaiLayout.jsx`
```jsx
const PegawaiLayout = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Determine bidang-specific navigation
  const getBidangNavigation = () => {
    const bidangRoutes = {
      2: { name: 'Sekretariat', path: '/bidang/sekretariat', icon: FiFileText },
      3: { name: 'Sarpras', path: '/bidang/sarpras', icon: FiTruck },
      4: { name: 'Kekayaan Desa', path: '/bidang/kekayaan', icon: FiDollarSign },
      5: { name: 'Pemberdayaan', path: '/bidang/pemberdayaan', icon: FiUsers },
      6: { name: 'Pemerintahan', path: '/bidang/pemerintahan', icon: FiBriefcase }
    };

    return user.bidang_id ? bidangRoutes[user.bidang_id] : null;
  };

  const bidangNav = getBidangNavigation();

  // Add to sidebar menu
  {bidangNav && (
    <button
      onClick={() => {
        setShowMenu(false);
        navigate(bidangNav.path);
      }}
      className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-orange-50 transition-colors text-left"
    >
      <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center">
        <bidangNav.icon className="h-6 w-6 text-orange-600" />
      </div>
      <div>
        <h4 className="font-semibold text-gray-800">Bidang {bidangNav.name}</h4>
        <p className="text-sm text-gray-500">Kelola data bidang</p>
      </div>
    </button>
  )}
};
```

### Step 2: Create Bidang Pages

**File:** `dpmd-frontend/src/pages/bidang/SarprasPage.jsx`
```jsx
import { useState, useEffect } from 'react';
import { Truck, Activity, TrendingUp, FileText } from 'lucide-react';
import api from '../../api';

export default function SarprasPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/bidang/3/dashboard');
      setDashboard(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-white mb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <Truck className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Bidang Sarana Prasarana</h1>
            <p className="text-blue-100">Kelola data ADD, DD, dan BHPRD</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Total Desa</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            {dashboard?.stats?.total_desa || 0}
          </p>
        </div>
        {/* More stat cards... */}
      </div>

      {/* Activity Logs */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Ringkasan Aktivitas</h2>
        </div>

        <div className="space-y-3">
          {dashboard?.activities?.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-800 font-medium">{activity.description}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(activity.created_at).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Step 3: Add Routes in App.jsx

```jsx
// Add to App.jsx
import SarprasPage from './pages/bidang/SarprasPage';
import KekayaanPage from './pages/bidang/KekayaanPage';
import PemberdayaanPage from './pages/bidang/PemberdayaanPage';
import PemerintahanPage from './pages/bidang/PemerintahanPage';

// In routes
<Route path="/bidang/sarpras" element={<SarprasPage />} />
<Route path="/bidang/kekayaan" element={<KekayaanPage />} />
<Route path="/bidang/pemberdayaan" element={<PemberdayaanPage />} />
<Route path="/bidang/pemerintahan" element={<PemerintahanPage />} />
```

---

## 🔐 **Access Control Implementation**

### Middleware: Check Bidang Access

**File:** `src/middlewares/bidangAccess.js`
```javascript
const checkBidangAccess = (requiredBidangId) => {
  return (req, res, next) => {
    const user = req.user;

    // Superadmin can access all
    if (user.role === 'superadmin' || user.role === 'kepala_dinas') {
      return next();
    }

    // Kepala Bidang can access their bidang
    if (user.role.includes('kabid') && user.bidang_id === requiredBidangId) {
      return next();
    }

    // Pegawai can only access their bidang
    if (user.role === 'pegawai' && user.bidang_id === requiredBidangId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Anda tidak memiliki akses ke bidang ini'
    });
  };
};

module.exports = { checkBidangAccess };
```

### Usage in Routes:
```javascript
router.get('/bidang/:bidangId/dashboard', 
  auth, 
  checkBidangAccess(req => req.params.bidangId),
  bidangController.getDashboard
);
```

---

## 🎯 **Integration Points**

### Modules that Need Activity Logging:

#### **Bidang 2: Sekretariat**
1. **Disposisi Surat**
   - Create, Update, Delete surat masuk
   - Create disposisi
   - Kirim ke Kepala Dinas/Bidang

2. **Perjalanan Dinas**
   - Create, Update, Delete kegiatan
   - Assign pegawai per bidang

3. **Manajemen Pegawai**
   - Create, Update, Delete pegawai
   - Assign bidang

#### **Bidang 3: Sarana Prasarana (SPKED)**
1. **Bankeu (Bantuan Keuangan)**
   - Upload bankeu data files
   - Update distributions

2. **BUMDes**
   - Create, Update, Delete BUMDes
   - Upload/Download documents
   - Update status

#### **Bidang 4: Kekayaan dan Keuangan Desa (KKD)**
1. **ADD (Alokasi Dana Desa)**
   - Upload ADD data files
   - Update distributions

2. **DD (Dana Desa)**
   - Upload DD data files (earmarked/non-earmarked)
   - Update distributions

3. **BHPRD**
   - Upload BHPRD data files
   - Update distributions per tahap

#### **Bidang 5: Pemberdayaan Masyarakat (PMD)**
1. **Kelembagaan**
   - Create, Update RW/RT
   - Update Posyandu, Karang Taruna, LPM, PKK, Satlinmas
   - Manage pengurus

#### **Bidang 6: Pemerintahan Desa (PEMDES)**
1. **Laporan Desa** (Read-only, menggunakan API Core Dashboard)
   - View Musdesus
   - View Aparatur Desa
   - View Produk Hukum

---

## 📱 **UI Components**

### Activity Timeline Component

```jsx
const ActivityTimeline = ({ activities }) => {
  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={activity.id} className="flex gap-4">
          {/* Timeline dot */}
          <div className="flex flex-col items-center">
            <div className={`h-3 w-3 rounded-full ${
              activity.action === 'create' ? 'bg-green-500' :
              activity.action === 'update' ? 'bg-blue-500' :
              activity.action === 'delete' ? 'bg-red-500' :
              'bg-gray-500'
            }`}></div>
            {index < activities.length - 1 && (
              <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
            )}
          </div>

          {/* Activity content */}
          <div className="flex-1 pb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-gray-800 font-medium">{activity.description}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>{activity.user_name}</span>
                <span>•</span>
                <span>{new Date(activity.created_at).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## ✅ **Testing Checklist**

- [ ] Run migration untuk create activity_logs table
- [ ] Test ActivityLogger.log() function
- [ ] Add logging ke minimal 1 controller (BUMDes)
- [ ] Create bidang dashboard endpoint
- [ ] Test bidang access control
- [ ] Create frontend SarprasPage
- [ ] Test navigation dari PegawaiLayout
- [ ] Test activity logs display
- [ ] Test different roles (pegawai, kabid, kepala_dinas)
- [ ] Test activity filtering by bidang

---

## 🚀 **Next Steps**

1. **Phase 1: Backend** (Prioritas Tinggi)
   - ✅ Create activity_logs table
   - ✅ Create ActivityLogger utility
   - ⏳ Create bidang.controller.js
   - ⏳ Add activity logging to existing controllers
   - ⏳ Create bidang routes

2. **Phase 2: Frontend** (Prioritas Medium)
   - ⏳ Update PegawaiLayout with bidang navigation
   - ⏳ Create SarprasPage
   - ⏳ Create KekayaanPage
   - ⏳ Create PemberdayaanPage
   - ⏳ Create PemerintahanPage
   - ⏳ Create ActivityTimeline component

3. **Phase 3: Integration** (Prioritas Medium)
   - ⏳ Add logging to BUMDes controller
   - ⏳ Add logging to Musdesus controller
   - ⏳ Add logging to Perjalanan Dinas controller
   - ⏳ Add logging to Kelembagaan controller

4. **Phase 4: Testing & Polish** (Prioritas Rendah)
   - ⏳ Test all access controls
   - ⏳ Test activity logging
   - ⏳ UI/UX improvements
   - ⏳ Documentation

---

## 📞 **Support**

Untuk pertanyaan atau bantuan implementasi, silakan hubungi tim development.

**Last Updated:** 27 Desember 2025
