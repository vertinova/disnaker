# Push Notification - Jadwal Kegiatan

**Dokumentasi Alur Push Notification untuk Jadwal Kegiatan**  
**Tanggal**: 28 Desember 2024  
**Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Tujuan

Memberikan **reminder notification** kepada pengguna tentang jadwal kegiatan yang akan datang:
1. ✅ **Reminder kegiatan hari ini** (pagi jam 07:00)
2. ✅ **Reminder kegiatan besok** (malam jam 21:00)
3. ✅ **Alert 1 jam sebelum** kegiatan dimulai

**TIDAK ADA** push notification untuk:
- ❌ Create jadwal baru
- ❌ Update jadwal existing

**Alasan**: Semua user sudah memiliki akses real-time ke halaman jadwal kegiatan untuk melihat semua jadwal.  
Push notification hanya untuk **reminder** agar kegiatan tidak terlewat.

---

## 📊 Arsitektur Push Notification

```
┌─────────────────────────────────────────────────────────────────┐
│                     PUSH NOTIFICATION FLOW                       │
└─────────────────────────────────────────────────────────────────┘

1️⃣ USER SUBSCRIPTION (Frontend)
   ┌──────────────────────────────────────────────┐
   │ User allows notification                     │
   │ ↓                                            │
   │ Service Worker requests permission           │
   │ ↓                                            │
   │ Get Push Subscription from Browser           │
   │ ↓                                            │
   │ POST /api/push-notifications/subscribe       │
   │ ↓                                            │
   │ Save to database (push_subscriptions table)  │
   └──────────────────────────────────────────────┘

2️⃣ TRIGGER NOTIFICATION (Backend)
   ┌──────────────────────────────────────────────┐
   │ Event occurs:                                │
   │ • Jadwal created                             │
   │ • Jadwal updated                             │
   │ • Cron job triggered                         │
   │ ↓                                            │
   │ Call pushNotificationService method          │
   │ ↓                                            │
   │ Query users with push_subscriptions          │
   │ ↓                                            │
   │ Loop through each subscription               │
   │ ↓                                            │
   │ webpush.sendNotification()                   │
   └──────────────────────────────────────────────┘

3️⃣ RECEIVE NOTIFICATION (Frontend)
   ┌──────────────────────────────────────────────┐
   │ Service Worker receives push event           │
   │ ↓                                            │
   │ Show notification to user                    │
   │ ↓                                            │
   │ User clicks notification                     │
   │ ↓                                            │
   │ Navigate to specific page                    │
   └──────────────────────────────────────────────┘
```

---

## 🔔 Jenis Notifikasi Jadwal Kegiatan

> **NOTE**: Create dan Update jadwal **TIDAK** mengirim push notification.  
> Alasan: Semua user sudah bisa lihat jadwal secara real-time di halaman jadwal kegiatan.

---

### 1. **Today's Schedule Reminder** 🌅
**Trigger**: Cron job (setiap pagi jam 07:00 WIB)  
**Target**: Semua role  
**Method**: `pushNotificationService.sendTodayScheduleReminder()`

**Payload**:
```javascript
{
  title: '🌅 Jadwal Kegiatan Hari Ini',
  body: 'Anda memiliki 3 kegiatan hari ini',
  icon: '/logo-192.png',
  badge: '/logo-96.png',
  data: {
    url: '/jadwal-kegiatan',
    type: 'today_schedule',
    count: 3
  },
  actions: [
    { action: 'view', title: 'Lihat Jadwal' },
    { action: 'close', title: 'Tutup' }
  ]
}
```

**Detail Kegiatan** (di body notification):
```
1. 09:00 - Rapat Koordinasi (Kantor DPMD)
2. 13:00 - Monitoring Desa X (Desa X)
3. 15:00 - Evaluasi Program (Ruang Rapat)
```

**Kapan dikirim**:
- Setiap hari pagi jam 07:00 WIB
- Hanya dikirim jika ada jadwal hari ini
- Automated via cron scheduler

---

### 2. **Tomorrow's Schedule Reminder** 🌙
**Trigger**: Cron job (setiap malam jam 21:00 WIB)  
**Target**: Semua role  
**Method**: `pushNotificationService.sendTomorrowScheduleReminder()`

**Payload**:
```javascript
{
  title: '🌙 Jadwal Kegiatan Besok',
  body: 'Persiapan untuk 2 kegiatan besok',
  icon: '/logo-192.png',
  badge: '/logo-96.png',
  data: {
    url: '/jadwal-kegiatan',
    type: 'tomorrow_schedule',
    count: 2
  },
  actions: [
    { action: 'view', title: 'Lihat Jadwal' },
    { action: 'close', title: 'Tutup' }
  ]
}
```

**Kapan dikirim**:
- Setiap malam jam 21:00 WIB
- Hanya dikirim jika ada jadwal besok
- Automated via cron scheduler

---

### 3. **Upcoming Event Alert** ⏰
**Trigger**: Cron job (check setiap 15 menit)  
**Target**: Semua role  
**Method**: `pushNotificationService.notifyUpcomingJadwal(jadwal)`

**Payload**:
```javascript
{
  title: '⏰ Kegiatan Akan Segera Dimulai',
  body: 'Rapat Koordinasi akan dimulai dalam 1 jam di Kantor DPMD',
  icon: '/logo-192.png',
  badge: '/logo-96.png',
  data: {
    url: '/jadwal-kegiatan',
    type: 'upcoming_jadwal',
    jadwal_id: 123,
    prioritas: 'tinggi'
  },
  actions: [
    { action: 'view', title: 'Lihat Detail' },
    { action: 'close', title: 'Tutup' }
  ],
  requireInteraction: true // Keep notification visible
}
```

**Kapan dikirim**:
- 1 jam sebelum kegiatan dimulai
- Contoh: Kegiatan jam 10:00, notif dikirim jam 09:00
- Automated via cron scheduler (check every 15 minutes)

---

## 🔧 Implementasi Backend

### 1. Service Layer (`pushNotification.service.js`)

> **NOTE**: Method `notifyNewJadwalKegiatan()` dan `notifyJadwalKegiatanUpdate()` sudah tersedia di service,  
> tetapi **TIDAK DIGUNAKAN** karena tidak perlu push notification untuk create/update.

#### Core Method: `sendToRoles(roles, notification)`
```javascript
async sendToRoles(roles, notification) {
  // 1. Query users dengan role tertentu yang punya push subscription
  const users = await prisma.users.findMany({
    where: {
      role: { in: roles },
      is_active: true,
      push_subscriptions: { some: {} }
    },
    include: { push_subscriptions: true }
  });

  // 2. Loop setiap user dan subscription
  for (const user of users) {
    for (const subscription of user.push_subscriptions) {
      const pushSubscription = JSON.parse(subscription.subscription);
      
      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon,
        badge: notification.badge,
        data: notification.data,
        actions: notification.actions
      });

      // 3. Kirim notifikasi via web-push
      await webpush.sendNotification(pushSubscription, payload)
        .catch((error) => {
          // Handle invalid subscription (410, 404)
          if (error.statusCode === 410 || error.statusCode === 404) {
            // Delete invalid subscription from database
            prisma.push_subscriptions.delete({ where: { id: subscription.id } });
          }
        });
    }
  }
}
```

#### Method Jadwal Kegiatan:

**A. `sendTodayScheduleReminder()` - Morning Reminder 🌅**
```javascript
async sendTodayScheduleReminder() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get today's jadwal
  const jadwals = await prisma.jadwal_kegiatan.findMany({
    where: {
      tanggal_mulai: { gte: today, lt: tomorrow },
      status: { in: ['scheduled', 'ongoing'] }
    },
    orderBy: { tanggal_mulai: 'asc' }
  });

  if (jadwals.length === 0) {
    return { success: true, message: 'No schedules today' };
  }

  // Format jadwal list
  const scheduleList = jadwals.map((j, index) => {
    const time = new Date(j.tanggal_mulai).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `${index + 1}. ${time} - ${j.judul} (${j.lokasi || 'TBA'})`;
  }).join('\n');

  const notification = {
    title: '🌅 Jadwal Kegiatan Hari Ini',
    body: `Anda memiliki ${jadwals.length} kegiatan hari ini:\n${scheduleList}`,
    icon: '/logo-192.png',
    data: { url: '/jadwal-kegiatan', type: 'today_schedule' }
  };

  const roles = ['kepala_dinas', 'sekretaris_dinas', 'kepala_bidang', 'ketua_tim', 'pegawai'];
  return await this.sendToRoles(roles, notification);
}
```

**B. `sendTomorrowScheduleReminder()` - Evening Reminder 🌙**
```javascript
// Similar to sendTodayScheduleReminder() but for tomorrow's jadwal
async sendTomorrowScheduleReminder() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  // Get tomorrow's jadwal
  const jadwals = await prisma.jadwal_kegiatan.findMany({
    where: {
      tanggal_mulai: { gte: tomorrow, lt: dayAfterTomorrow },
      status: { in: ['scheduled', 'ongoing'] }
    },
    orderBy: { tanggal_mulai: 'asc' }
  });

  // ... similar format and send logic
}
```

**C. `notifyUpcomingJadwal(jadwal)` - 1 Hour Before Alert ⏰**
```javascript
async notifyUpcomingJadwal(jadwal) {
  const notification = {
    title: '⏰ Kegiatan Akan Segera Dimulai',
    body: `${jadwal.judul} akan dimulai dalam 1 jam di ${jadwal.lokasi || 'lokasi belum ditentukan'}`,
    icon: '/logo-192.png',
    badge: '/logo-96.png',
    data: {
      url: '/jadwal-kegiatan',
      type: 'upcoming_jadwal',
      jadwal_id: jadwal.id,
      prioritas: jadwal.prioritas
    },
    actions: [
      { action: 'view', title: 'Lihat Detail' },
      { action: 'close', title: 'Tutup' }
    ],
    requireInteraction: true // Keep notification visible
  };

  const roles = ['kepala_dinas', 'sekretaris_dinas', 'kepala_bidang', 'ketua_tim', 'pegawai'];
  return await this.sendToRoles(roles, notification);
}
```

---

### 2. Controller Integration (`jadwalKegiatan.controller.js`)

> **NO INTEGRATION NEEDED** - Create dan Update jadwal TIDAK trigger push notification.  
> Push notification hanya via cron scheduler untuk reminder.

---

### 3. Cron Scheduler (`cronScheduler.service.js`)

```javascript
class CronSchedulerService {
  init() {
    // Morning reminder: 7:00 AM (Today's schedule)
    this.jobs.morningReminder = cron.schedule('0 7 * * *', async () => {
      console.log('⏰ Running morning schedule reminder (7:00 AM)...');
      const result = await pushNotificationService.sendTodayScheduleReminder();
      console.log('✅ Morning reminder completed:', result);
    }, {
      scheduled: true,
      timezone: 'Asia/Jakarta'
    });

    // Evening reminder: 9:00 PM (Tomorrow's schedule)
    this.jobs.eveningReminder = cron.schedule('0 21 * * *', async () => {
      console.log('⏰ Running evening schedule reminder (9:00 PM)...');
      const result = await pushNotificationService.sendTomorrowScheduleReminder();
      console.log('✅ Evening reminder completed:', result);
    }, {
      scheduled: true,
      timezone: 'Asia/Jakarta'
    });

    // Upcoming event check: Every 15 minutes
    this.jobs.upcomingCheck = cron.schedule('*/15 * * * *', async () => {
      console.log('⏰ Checking for upcoming events...');
      
      // Get jadwal yang akan dimulai dalam 1 jam
      const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);
      const oneHourFifteenMinutesLater = new Date(Date.now() + 75 * 60 * 1000);
      
      const upcomingJadwals = await prisma.jadwal_kegiatan.findMany({
        where: {
          tanggal_mulai: {
            gte: oneHourLater,
            lt: oneHourFifteenMinutesLater
          },
          status: 'scheduled'
        }
      });

      // Send notification for each upcoming jadwal
      for (const jadwal of upcomingJadwals) {
        await pushNotificationService.notifyUpcomingJadwal(jadwal);
      }
      
      console.log(`✅ Checked upcoming events: ${upcomingJadwals.length} notifications sent`);
    }, {
      scheduled: true,
      timezone: 'Asia/Jakarta'
    });
  }
}
```

---

## 🎨 Frontend Implementation

### 1. Service Worker (`public/sw.js`)

```javascript
// Handle push event
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: data.icon || '/logo-192.png',
    badge: data.badge || '/logo-96.png',
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200],
    tag: data.data?.type || 'default'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window or open new
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
```

### 2. Subscribe to Push (Frontend Component)

```javascript
// Subscribe user to push notifications
async function subscribeToPush() {
  try {
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // Send subscription to backend
    await api.post('/push-notifications/subscribe', {
      subscription: JSON.stringify(subscription)
    });

    console.log('✅ Push notification subscribed');
  } catch (error) {
    console.error('Push subscription failed:', error);
  }
}

// Helper function
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
```

---

## 🧪 Testing Flow

### 1. Manual Test via Test Script

**File**: `test-jadwal-notification.js`

```javascript
const pushNotificationService = require('./src/services/pushNotification.service');

async function testJadwalNotifications() {
  // Test 1: Today's Schedule
  console.log('\n📧 TEST 1: Today\'s Schedule Reminder');
  await pushNotificationService.sendTodayScheduleReminder();

  // Test 2: Tomorrow's Schedule
  console.log('\n📧 TEST 2: Tomorrow\'s Schedule Reminder');
  await pushNotificationService.sendTomorrowScheduleReminder();

  // Test 3: Upcoming Jadwal (1 hour before)
  console.log('\n📧 TEST 3: Upcoming Jadwal Alert');
  const upcomingJadwal = {
    id: 1,
    judul: 'Test Rapat Koordinasi',
    tanggal_mulai: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    lokasi: 'Kantor DPMD',
    prioritas: 'tinggi'
  };
  await pushNotificationService.notifyUpcomingJadwal(upcomingJadwal);
}

testJadwalNotifications()
  .then(() => console.log('\n✅ All tests completed'))
  .catch(err => console.error('\n❌ Test failed:', err));
```

**Run**:
```bash
node test-jadwal-notification.js
```

---

### 2. Test via API

#### A. Test New Jadwal (Create)
```bash
POST /api/jadwal-kegiatan
Headers: Authorization: Bearer <token>
Body: {
  "judul": "Test Rapat Koordinasi",
  "tanggal_mulai": "2024-12-30T09:00:00",
  "tanggal_selesai": "2024-12-30T11:00:00",
  "lokasi": "Kantor DPMD"
}
```
**Expected**: Notification dikirim ke semua user

#### B. Test Update Jadwal
```bash
PUT /api/jadwal-kegiatan/:id
Headers: Authorization: Bearer <token>
Body: {
  "lokasi": "Ruang Rapat Baru",
  "tanggal_mulai": "2024-12-30T10:00:00"
}
```
**Expected**: Notification update dikirim ke semua user

#### C. Test Cron Manually
```bash
GET /api/cron/test-morning-reminder
```
**Expected**: Today's schedule notification sent

```bash
GET /api/cron/test-evening-reminder
```
**Expected**: Tomorrow's schedule notification sent

---

## 📊 Database Schema

### `push_subscriptions` Table
```sql
CREATE TABLE push_subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  subscription TEXT NOT NULL,  -- JSON string of push subscription
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Example subscription data**:
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BNcRd...",
    "auth": "tBHI..."
  }
}
```

---

## ⚙️ Configuration

### Environment Variables (`.env`)

```env
# VAPID Keys for Web Push
# Generate using: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=BKxxx...
VAPID_PRIVATE_KEY=xxx...
VAPID_SUBJECT=mailto:dpmd@bogor.go.id
```

### Generate VAPID Keys
```bash
npx web-push generate-vapid-keys
```

Output:
```
Public Key: BKxxx...
Private Key: xxx...
```

Copy to `.env` file.

---

## 🚀 Deployment Checklist

- [ ] Install `web-push` package: `npm install web-push`
- [ ] Generate VAPID keys and add to `.env`
- [ ] Create `push_subscriptions` table in database
- [ ] Implement service worker in frontend (`public/sw.js`)
- [ ] Add push subscription logic in frontend
- [ ] Test notification with single user
- [ ] Test cron jobs manually
- [ ] Deploy backend with cron scheduler running
- [ ] Monitor notification delivery logs

---

## 📈 Monitoring & Logs

### Backend Logs
```
✅ New jadwal kegiatan notification sent: Rapat Koordinasi
✅ Jadwal kegiatan update notification sent: Rapat Koordinasi
⏰ Running morning schedule reminder (7:00 AM)...
✅ Morning reminder completed: { success: true, sentTo: 25 }
⏰ Checking for upcoming events...
✅ Checked upcoming events: 3 notifications sent
```

### Error Handling
- **410 Gone**: Subscription expired → Delete from database
- **404 Not Found**: Invalid subscription → Delete from database
- **500 Server Error**: Retry or log for investigation

---

## 🎯 Summary

### ✅ Implemented
- ✅ Push notification service structure
- ✅ Core methods: `sendToRoles()`, `notifyNewJadwalKegiatan()`, etc.
- ✅ Cron scheduler for daily reminders
- ✅ Service worker for receiving notifications

### ⏳ To Implement
- [ ] Add cron job for 1-hour-before alerts (check every 15 minutes)
- [ ] Test with real users
- [ ] Add notification preferences (user can opt-in/out specific types)

### ❌ NOT Implemented (By Design)
- ❌ Create jadwal notification - Users can see new jadwal in real-time on page
- ❌ Update jadwal notification - Users can see changes in real-time on page

**Rationale**: Semua user sudah memiliki akses langsung ke halaman jadwal kegiatan untuk melihat  
semua jadwal secara real-time. Push notification hanya untuk reminder agar tidak terlewat.

### 🔮 Future Enhancements
- User-specific notification settings
- Notification history/logs
- Priority-based notification (only urgent to certain roles)
- Email fallback if push fails
- SMS integration for critical alerts

