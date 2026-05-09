const { webpush } = require('../config/push-notification');
const PushSubscription = require('../models/pushSubscription');
const logger = require('../utils/logger');
const prisma = require('../config/prisma');

class PushNotificationService {

  /**
   * Store notification records in DB for target users
   * @param {Array<number>} userIds 
   * @param {Object} payload - { title, body, data }
   * @param {number|null} sentBy - user ID who triggered
   */
  static async storeNotifications(userIds, payload, sentBy = null) {
    try {
      if (!userIds || userIds.length === 0) return;

      const type = payload.data?.type || payload.tag || 'general';
      const records = userIds.map(userId => ({
        user_id: BigInt(userId),
        title: payload.title || 'Notifikasi',
        message: payload.body || payload.message || null,
        type: type,
        is_read: false,
        data: payload.data ? JSON.stringify(payload.data) : null,
        sent_by: sentBy ? BigInt(sentBy) : null,
        created_at: new Date(),
      }));

      await prisma.notifications.createMany({ data: records });
      logger.info(`📝 Stored ${records.length} notification records in DB`);
    } catch (error) {
      // Don't fail the push send if DB storage fails
      logger.error('Error storing notifications in DB:', error);
    }
  }
  /**
   * Send push notification ke user tertentu
   * Hanya kirim ke 1 subscription terbaru untuk menghindari duplikat
   */
  static async sendToUser(userId, payload) {
    try {
      const subscriptions = await PushSubscription.getSubscriptionsByUser(userId);
      
      if (subscriptions.length === 0) {
        logger.warn(`No push subscriptions found for user ${userId}`);
        return { success: false, message: 'No subscriptions found' };
      }

      // Only use the first (latest) subscription to avoid duplicate notifications
      const latestSubscription = subscriptions[0];
      
      try {
        await this.sendNotification(latestSubscription, payload);
        logger.info(`Push notification sent to user ${userId}: 1 successful`);
        return {
          success: true,
          sent: 1,
          failed: 0,
          total: 1
        };
      } catch (error) {
        logger.error(`Failed to send push to user ${userId}:`, error);
        return {
          success: false,
          sent: 0,
          failed: 1,
          total: 1
        };
      }
    } catch (error) {
      logger.error('Error sending push to user:', error);
      throw error;
    }
  }

  /**
   * Send push notification ke multiple users
   * Hanya kirim 1 notifikasi per user untuk menghindari duplikat
   */
  static async sendToMultipleUsers(userIds, payload) {
    try {
      console.log('📤 [PUSH] Sending to multiple users:', {
        userIds: userIds,
        payloadType: payload.data?.type,
        title: payload.title
      });

      const allSubscriptions = await PushSubscription.getSubscriptionsByUsers(userIds);
      
      // Deduplicate: keep only the latest subscription per user
      const userSubscriptionMap = new Map();
      for (const sub of allSubscriptions) {
        const userId = sub.userId;
        if (!userSubscriptionMap.has(userId)) {
          userSubscriptionMap.set(userId, sub);
        }
        // Since getSubscriptionsByUsers doesn't guarantee order, 
        // we rely on the model to return newest first or we keep the first one we see
      }
      const subscriptions = Array.from(userSubscriptionMap.values());
      
      console.log('📋 [PUSH] Found subscriptions (deduplicated):', {
        originalCount: allSubscriptions.length,
        deduplicatedCount: subscriptions.length,
        userIds: userIds
      });

      if (subscriptions.length === 0) {
        logger.warn(`No push subscriptions found for users: ${userIds.join(', ')}`);
        return { success: false, message: 'No subscriptions found' };
      }

      const results = await Promise.allSettled(
        subscriptions.map(sub => this.sendNotification(sub, payload))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log('✅ [PUSH] Send results:', {
        successful,
        failed,
        total: subscriptions.length
      });

      logger.info(`Push notification sent to ${userIds.length} users: ${successful} successful, ${failed} failed`);

      return {
        success: true,
        sent: successful,
        failed: failed,
        total: subscriptions.length
      };
    } catch (error) {
      console.error('❌ [PUSH] Error sending to multiple users:', error);
      logger.error('Error sending push to multiple users:', error);
      throw error;
    }
  }

  /**
   * Send push notification ke semua users
   * Hanya kirim 1 notifikasi per user untuk menghindari duplikat
   */
  static async sendToAll(payload) {
    try {
      const allSubscriptions = await PushSubscription.getAllSubscriptions();
      
      if (allSubscriptions.length === 0) {
        logger.warn('No push subscriptions found');
        return { success: false, message: 'No subscriptions found' };
      }

      // Deduplicate: keep only one subscription per user
      const userSubscriptionMap = new Map();
      for (const sub of allSubscriptions) {
        const userId = sub.userId;
        if (!userSubscriptionMap.has(userId)) {
          userSubscriptionMap.set(userId, sub);
        }
      }
      const subscriptions = Array.from(userSubscriptionMap.values());

      const results = await Promise.allSettled(
        subscriptions.map(sub => this.sendNotification(sub, payload))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      logger.info(`Broadcast push notification: ${successful} successful, ${failed} failed (${allSubscriptions.length} total subscriptions deduplicated to ${subscriptions.length})`);

      return {
        success: true,
        sent: successful,
        failed: failed,
        total: subscriptions.length
      };
    } catch (error) {
      logger.error('Error broadcasting push notification:', error);
      throw error;
    }
  }

  /**
   * Send notification ke satu subscription
   */
  static async sendNotification(subscription, payload) {
    try {
      console.log('🚀 [PUSH] Sending to subscription:', {
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        hasKeys: !!subscription.keys,
        keysP256dh: subscription.keys?.p256dh?.substring(0, 20) + '...',
        keysAuth: subscription.keys?.auth?.substring(0, 20) + '...'
      });

      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      };

      const notificationPayload = JSON.stringify(payload);

      await webpush.sendNotification(pushSubscription, notificationPayload);
      
      console.log('✅ [PUSH] Notification sent successfully to:', subscription.endpoint.substring(0, 50) + '...');
      
      return { success: true };
    } catch (error) {
      console.error('❌ [PUSH] Send error:', {
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        statusCode: error.statusCode,
        message: error.message
      });

      // Handle expired/invalid subscriptions
      if (error.statusCode === 404 || error.statusCode === 410) {
        logger.warn(`Subscription expired/invalid, removing: ${subscription.id}`);
        await PushSubscription.removeInvalidSubscription(subscription.id);
      }
      
      throw error;
    }
  }

  /**
   * Trigger push notification untuk disposisi baru
   * WhatsApp-style: Pop-up di layar HP bahkan saat locked/minimize
   */
  static async notifyNewDisposisi(disposisiData, targetUserIds) {
    const payload = {
      title: '📨 Disposisi Baru - DPMD',
      body: `${disposisiData.dari_user}: ${disposisiData.perihal || 'Disposisi baru telah diterima'}`,
      icon: '/logo-192.png',
      badge: '/logo-96.png',
      vibrate: [300, 100, 300, 100, 300, 100, 300], // WhatsApp vibration pattern
      tag: `disposisi-${disposisiData.id}`,
      requireInteraction: true, // Stay on screen until clicked
      renotify: true, // Alert even if previous notification exists
      silent: false, // MUST make sound
      urgency: 'high', // High priority for Android
      timestamp: Date.now(),
      data: {
        type: 'new_disposisi',
        disposisi_id: disposisiData.id,
        url: '/disposisi',
        timestamp: Date.now(),
        perihal: disposisiData.perihal,
        dari_user: disposisiData.dari_user,
        nomor_surat: disposisiData.nomor_surat
      },
      actions: [
        { action: 'open', title: '📖 Buka Disposisi', icon: '/logo-96.png' },
        { action: 'later', title: '⏰ Nanti', icon: '/logo-96.png' }
      ]
    };

    await this.storeNotifications(targetUserIds, payload);
    return await this.sendToMultipleUsers(targetUserIds, payload);
  }

  /**
   * Trigger push notification untuk update disposisi
   */
  static async notifyDisposisiUpdate(disposisiData, targetUserIds) {
    const payload = {
      title: '🔔 Update Disposisi',
      body: `Disposisi "${disposisiData.perihal}" telah diupdate`,
      icon: '/logo-192.png',
      badge: '/logo-96.png',
      tag: `disposisi-update-${disposisiData.id}`,
      data: {
        type: 'disposisi_update',
        disposisi_id: disposisiData.id,
        url: '/disposisi',
        timestamp: Date.now()
      },
      vibrate: [100, 50, 100]
    };

    await this.storeNotifications(targetUserIds, payload);
    return await this.sendToMultipleUsers(targetUserIds, payload);
  }

  /**
   * Trigger push notification untuk berita baru
   */
  static async notifyNewBerita(beritaData) {
    const payload = {
      title: '📰 Berita Baru',
      body: beritaData.judul,
      icon: '/logo-192.png',
      badge: '/logo-96.png',
      image: beritaData.gambar || undefined,
      tag: `berita-${beritaData.id}`,
      data: {
        type: 'new_berita',
        berita_id: beritaData.id,
        url: `/berita/${beritaData.slug}`,
        timestamp: Date.now()
      }
    };

    return await this.sendToAll(payload);
  }

  /**
   * Trigger push notification untuk kegiatan/perjadin baru
   */
  static async notifyNewKegiatan(kegiatanData, targetUserIds) {
    const payload = {
      title: '📅 Kegiatan Baru',
      body: kegiatanData.nama_kegiatan,
      icon: '/logo-192.png',
      badge: '/logo-96.png',
      tag: `kegiatan-${kegiatanData.id}`,
      data: {
        type: 'new_kegiatan',
        kegiatan_id: kegiatanData.id,
        url: '/perjadin',
        timestamp: Date.now()
      }
    };

    await this.storeNotifications(targetUserIds, payload);
    return await this.sendToMultipleUsers(targetUserIds, payload);
  }

  /**
   * Alias method untuk backward compatibility
   * @deprecated Use sendToUser instead
   */
  static async sendNotificationToUser(userId, payload) {
    return await this.sendToUser(userId, payload);
  }

  /**
   * Send test notification ke user
   */
  static async sendTestNotification(userId) {
    const payload = {
      title: '🎉 Test Notification',
      body: 'Push notification berhasil! Sistem bekerja dengan baik.',
      icon: '/logo-192.png',
      badge: '/logo-96.png',
      tag: 'test-notification',
      data: {
        type: 'test',
        timestamp: Date.now(),
        url: '/'
      },
      vibrate: [200, 100, 200],
      requireInteraction: false
    };

    return await this.sendToUser(userId, payload);
  }
}

module.exports = PushNotificationService;
