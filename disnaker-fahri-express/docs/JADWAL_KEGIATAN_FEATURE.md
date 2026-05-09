# Jadwal Kegiatan Feature - Complete Documentation

## 📋 Overview
Fitur Jadwal Kegiatan adalah sistem manajemen jadwal kegiatan DPMD yang terintegrasi dengan push notification otomatis. Fitur ini memiliki tampilan kalender seperti Google Calendar dan notifikasi push otomatis.

## ✨ Features Implemented

### 1. **Field Asal Kegiatan**
- **Field baru**: `asal_kegiatan` (VARCHAR 255, nullable)
- **Purpose**: Menyimpan informasi sumber/asal kegiatan
- **Contoh nilai**: "SETDA", "Kementerian PUPR", "DPMD", "Gubernur", dll
- **Location**: 
  - Database: `jadwal_kegiatan.asal_kegiatan`
  - Backend: `jadwalKegiatan.controller.js`
  - Frontend: `JadwalKegiatanModal.jsx`

### 2. **Calendar View (Google Calendar Style)**
- **Component**: `JadwalKalenderView.jsx`
- **Features**:
  - Monthly calendar grid view
  - Event display per day with color coding
  - Priority badges (urgent, tinggi, sedang, rendah)
  - Status indicators (approved, pending, draft, rejected, completed, cancelled)
  - Click event to view/edit details
  - Navigation: Previous/Next month, Today button
  - Legend for status colors
  - Multi-day event support
  - Responsive design

### 3. **View Toggle (Grid ↔ Calendar)**
- **Location**: `JadwalKegiatanPage.jsx`
- **Icons**: 
  - `LuGrid` - Grid view
  - `LuCalendarDays` - Calendar view
- **State**: `viewMode` ('grid' | 'calendar')
- **Switching**: Toggle buttons with active state styling

### 4. **Automated Push Notifications**

#### **Morning Reminder (7:00 AM WIB)**
- **Schedule**: Every day at 07:00 WIB
- **Target**: `kepala_dinas`, `sekretaris_dinas`, `kepala_bidang`, `ketua_tim`, `pegawai`
- **Message**: "📅 Jadwal Kegiatan Hari Ini - Ada X kegiatan hari ini. Tap untuk melihat detail."
- **Query**: Get schedules where `tanggal_mulai` is today and status is `approved` or `pending`

#### **Evening Reminder (9:00 PM WIB)**
- **Schedule**: Every day at 21:00 WIB
- **Target**: `kepala_dinas`, `sekretaris_dinas`, `kepala_bidang`, `ketua_tim`, `pegawai`
- **Message**: "📅 Jadwal Kegiatan Besok - Ada X kegiatan besok. Tap untuk melihat detail."
- **Query**: Get schedules where `tanggal_mulai` is tomorrow and status is `approved` or `pending`

## 🗄️ Database Changes

### Migration: `031_add_asal_kegiatan_to_jadwal_kegiatan.sql`
```sql
ALTER TABLE `jadwal_kegiatan` 
ADD COLUMN `asal_kegiatan` VARCHAR(255) NULL AFTER `lokasi`;
```

### Prisma Schema Update
```prisma
model jadwal_kegiatan {
  // ... existing fields
  lokasi          String?   @db.VarChar(255)
  asal_kegiatan   String?   @db.VarChar(255)  // ✨ NEW FIELD
  pic_name        String?   @db.VarChar(255)
  // ... rest of fields
}
```

## 🔧 Backend Implementation

### Files Modified/Created:

#### 1. **jadwalKegiatan.controller.js** (Modified)
- Added `asal_kegiatan` to create operation
- Added `asal_kegiatan` to update operation
- Added `asal_kegiatan` to search filter

```javascript
// Create operation
const {
  judul, deskripsi, bidang_id, tanggal_mulai, tanggal_selesai,
  lokasi, asal_kegiatan, pic_name, pic_contact, prioritas, kategori, anggaran
} = req.body;

// Insert with asal_kegiatan
INSERT INTO jadwal_kegiatan (
  judul, deskripsi, bidang_id, tanggal_mulai, tanggal_selesai,
  lokasi, asal_kegiatan, pic_name, pic_contact, ...
)
```

#### 2. **pushNotification.service.js** (Created)
- `sendToRoles(roles, notification)` - Send to specific user roles
- `sendTodayScheduleReminder()` - Morning notification at 7 AM
- `sendTomorrowScheduleReminder()` - Evening notification at 9 PM
- `sendTestNotification(userId)` - Test functionality

**Key Features**:
- Uses `web-push` library for push notifications
- Queries `push_subscriptions` table for user subscriptions
- Removes invalid/expired subscriptions (410, 404 errors)
- Uses existing VAPID keys from environment variables

#### 3. **cronScheduler.service.js** (Created)
- Uses `node-cron` for scheduling
- Two scheduled jobs:
  - `0 7 * * *` - Morning reminder (7 AM)
  - `0 21 * * *` - Evening reminder (9 PM)
- Timezone: `Asia/Jakarta` (WIB)
- Methods:
  - `init()` - Initialize all cron jobs
  - `stopAll()` - Stop all jobs
  - `startAll()` - Start all jobs
  - `getStatus()` - Get job status
  - `testMorningReminder()` - Manual test
  - `testEveningReminder()` - Manual test

#### 4. **server.js** (Modified)
```javascript
const cronScheduler = require('./services/cronScheduler.service');

app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  // ... other logs
  
  // Initialize cron scheduler
  cronScheduler.init(); // ✨ NEW
});
```

## 🎨 Frontend Implementation

### Files Modified/Created:

#### 1. **JadwalKegiatanModal.jsx** (Modified)
- Added "Asal Kegiatan" input field
- Field positioned after "Tempat Kegiatan"
- Optional field with placeholder: "Contoh: SETDA, Kementerian, DPMD"

```jsx
{/* Asal Kegiatan */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Asal Kegiatan
  </label>
  <input
    type="text"
    name="asal_kegiatan"
    value={formData.asal_kegiatan}
    onChange={onChange}
    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl..."
    placeholder="Contoh: SETDA, Kementerian, DPMD"
  />
</div>
```

#### 2. **JadwalKalenderView.jsx** (Created)
Complete calendar component with:
- Monthly grid layout (7 days × 5-6 weeks)
- Event cards with priority & status colors
- Interactive event click handlers
- Month navigation
- Today button
- Color-coded status legend
- Responsive design
- Multi-day event spanning

**Color Schemes**:
- **Priority Colors**:
  - Urgent: `bg-red-500`
  - Tinggi: `bg-orange-500`
  - Sedang: `bg-blue-500`
  - Rendah: `bg-gray-400`

- **Status Border Colors**:
  - Approved: `border-l-green-500`
  - Pending: `border-l-yellow-500`
  - Draft: `border-l-gray-400`
  - Rejected: `border-l-red-500`
  - Completed: `border-l-purple-500`
  - Cancelled: `border-l-gray-600`

#### 3. **JadwalKegiatanPage.jsx** (Modified)
- Added imports: `LuGrid`, `LuCalendarDays`, `JadwalKalenderView`
- Added state: `viewMode` (default: 'grid')
- Added View Toggle UI
- Conditional rendering for Grid/Calendar views
- Updated `formData` state to include `asal_kegiatan`

```jsx
// View Mode Toggle
<div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
  <button onClick={() => setViewMode('grid')} ...>
    <LuGrid /> Grid
  </button>
  <button onClick={() => setViewMode('calendar')} ...>
    <LuCalendarDays /> Kalender
  </button>
</div>

// Conditional Rendering
{viewMode === 'calendar' ? (
  <JadwalKalenderView jadwals={jadwals} onEventClick={handleEdit} />
) : (
  // Grid view...
)}
```

## 📦 Dependencies Added

### Backend
```json
{
  "node-cron": "^3.x.x"
}
```

### Notes:
- `web-push` already exists in the project (used for existing push notification features)
- No frontend dependencies added

## 🔑 Environment Variables Required

Add to `.env` file (backend):
```env
# Already exists (for existing push features)
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:dpmd@bogor.go.id
```

**Generate VAPID Keys**:
```bash
npx web-push generate-vapid-keys
```

## 🚀 Usage Guide

### For End Users:

#### **1. Adding Schedule with Source**
1. Navigate to "Jadwal Kegiatan" page
2. Click "Tambah Jadwal"
3. Fill in 8 required fields:
   - Judul Kegiatan
   - Tempat Kegiatan (Lokasi)
   - **Asal Kegiatan** (NEW - e.g., "SETDA", "Kementerian")
   - Bidang
   - Kategori
   - Prioritas
   - Tanggal Mulai
   - Tanggal Selesai
4. Click "Simpan"

#### **2. Viewing Calendar**
1. Go to "Jadwal Kegiatan" page
2. Click "Kalender" toggle button (top right)
3. View events organized by date
4. Click any event card to view/edit details
5. Navigate months using arrow buttons or "Hari Ini" button

#### **3. Receiving Notifications**
- **Morning (7 AM)**: Get notification about today's schedules
- **Evening (9 PM)**: Get notification about tomorrow's schedules
- Notifications only sent if:
  - User has push subscription active
  - User role is: kepala_dinas, sekretaris_dinas, kepala_bidang, ketua_tim, or pegawai
  - There are schedules with status `approved` or `pending`

### For Developers:

#### **Testing Cron Jobs Manually**
```javascript
// In Node.js console or test script
const cronScheduler = require('./src/services/cronScheduler.service');

// Test morning reminder
await cronScheduler.testMorningReminder();

// Test evening reminder
await cronScheduler.testEveningReminder();

// Check cron status
const status = cronScheduler.getStatus();
console.log(status);
```

#### **Testing Push Notifications**
```javascript
const pushService = require('./src/services/pushNotification.service');

// Test notification to specific user
await pushService.sendTestNotification(userId);

// Send to specific roles
await pushService.sendToRoles(
  ['kepala_dinas', 'sekretaris_dinas'],
  {
    title: 'Test Title',
    body: 'Test message',
    data: { url: '/jadwal-kegiatan' }
  }
);
```

## 🐛 Troubleshooting

### Issue 1: Cron jobs not running
**Solution**: Check server logs for initialization message:
```
🕐 Initializing cron scheduler...
✅ Cron jobs initialized:
   - Morning reminder (Today's schedule): Every day at 07:00 WIB
   - Evening reminder (Tomorrow's schedule): Every day at 21:00 WIB
```

### Issue 2: Notifications not received
**Checklist**:
- ✅ User has active push subscription (check `push_subscriptions` table)
- ✅ VAPID keys are set in `.env`
- ✅ User role is in target list
- ✅ User `is_active = true`
- ✅ There are schedules for target date

### Issue 3: Calendar view not loading
**Check**:
- ✅ `JadwalKalenderView.jsx` imported correctly
- ✅ No icon import errors (removed `LuAlertCircle`)
- ✅ `jadwals` prop passed correctly
- ✅ `onEventClick` handler exists

## 📊 Database Queries

### Get today's schedules for notification:
```sql
SELECT * FROM jadwal_kegiatan 
WHERE DATE(tanggal_mulai) = CURDATE()
  AND status IN ('approved', 'pending')
ORDER BY tanggal_mulai ASC;
```

### Get tomorrow's schedules for notification:
```sql
SELECT * FROM jadwal_kegiatan 
WHERE DATE(tanggal_mulai) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
  AND status IN ('approved', 'pending')
ORDER BY tanggal_mulai ASC;
```

### Get users for push notification:
```sql
SELECT u.*, ps.subscription 
FROM users u
INNER JOIN push_subscriptions ps ON u.id = ps.user_id
WHERE u.role IN ('kepala_dinas', 'sekretaris_dinas', 'kepala_bidang', 'ketua_tim', 'pegawai')
  AND u.is_active = 1;
```

## 📈 Performance Considerations

1. **Cron Job Timing**:
   - Runs only twice per day (7 AM & 9 PM)
   - Minimal server load
   - Query optimization with date indexes

2. **Push Notifications**:
   - Batch processing with `Promise.all()`
   - Automatic cleanup of invalid subscriptions
   - Error handling per subscription

3. **Calendar View**:
   - Uses `useMemo` for calendar calculations
   - Efficient date grouping
   - Limited to 3 events shown per day (with "+X more" indicator)

## 🔐 Security Notes

1. **VAPID Keys**: Store in environment variables, never commit to Git
2. **Push Subscriptions**: Automatically removed if invalid (410/404 errors)
3. **Role-based Access**: Only authorized roles receive notifications
4. **Active Users Only**: Inactive users (`is_active = false`) excluded

## 🎯 Future Enhancements (Potential)

1. **Notification Customization**:
   - Per-user notification preferences
   - Custom notification times
   - Sound/vibration settings

2. **Calendar Features**:
   - Week view
   - Day view
   - Drag & drop event rescheduling
   - Event color customization per bidang

3. **Advanced Filtering**:
   - Filter calendar by bidang
   - Filter by asal_kegiatan
   - Multi-select status filter

4. **Export Features**:
   - Export to iCal/Google Calendar
   - PDF report generation
   - Excel export

## 📝 Summary

✅ **Completed Tasks**:
1. ✅ Added `asal_kegiatan` field to database & Prisma schema
2. ✅ Updated backend controller to handle `asal_kegiatan`
3. ✅ Updated frontend form with 8th field
4. ✅ Created Google Calendar-style view component
5. ✅ Integrated calendar view with toggle switcher
6. ✅ Installed `node-cron` package
7. ✅ Created push notification service
8. ✅ Created cron scheduler service
9. ✅ Integrated scheduler into server startup
10. ✅ Configured morning (7 AM) notification
11. ✅ Configured evening (9 PM) notification

**Total Lines of Code**: ~800+ lines
**Files Created**: 3
**Files Modified**: 5
**Database Changes**: 1 migration

---

**Last Updated**: December 28, 2024
**Version**: 1.0.0
**Status**: ✅ Production Ready
