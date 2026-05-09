const prisma = require('../config/prisma');

class PushSubscription {
  /**
   * Simpan atau update push subscription
   * Hanya simpan 1 subscription per user (hapus semua subscription lama)
   */
  static async saveSubscription(userId, subscription) {
    try {
      // Delete ALL existing subscriptions for this user (keep only 1 subscription per user)
      await prisma.push_subscriptions.deleteMany({
        where: {
          user_id: BigInt(userId)
        }
      });

      // Create new subscription - store full subscription as JSON
      const result = await prisma.push_subscriptions.create({
        data: {
          user_id: BigInt(userId),
          endpoint: subscription.endpoint,
          subscription: subscription, // Store entire subscription object as JSON
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      return result;
    } catch (error) {
      console.error('Error saving push subscription:', error);
      throw error;
    }
  }

  /**
   * Get semua subscriptions untuk user tertentu
   */
  static async getSubscriptionsByUser(userId) {
    try {
      const subscriptions = await prisma.push_subscriptions.findMany({
        where: {
          user_id: BigInt(userId)
        },
        orderBy: {
          created_at: 'desc'
        },
        select: {
          id: true,
          endpoint: true,
          subscription: true,
          created_at: true
        }
      });

      // Parse subscription JSON properly
      return subscriptions.map(sub => {
        const subscriptionData = typeof sub.subscription === 'string' 
          ? JSON.parse(sub.subscription) 
          : sub.subscription;
        
        return {
          id: Number(sub.id),
          endpoint: subscriptionData.endpoint || sub.endpoint,
          keys: subscriptionData.keys || {},
          expirationTime: subscriptionData.expirationTime || null,
          created_at: sub.created_at
        };
      });
    } catch (error) {
      console.error('Error getting subscriptions:', error);
      throw error;
    }
  }

  /**
   * Get semua subscriptions untuk users tertentu (array of user IDs)
   */
  static async getSubscriptionsByUsers(userIds) {
    if (!userIds || userIds.length === 0) {
      return [];
    }

    try {
      // Convert to array of BigInt
      const userIdsBigInt = userIds.map(id => BigInt(id));
      
      const subscriptions = await prisma.push_subscriptions.findMany({
        where: {
          user_id: {
            in: userIdsBigInt
          }
        },
        select: {
          id: true,
          user_id: true,
          endpoint: true,
          subscription: true
        }
      });

      // Parse subscription JSON properly
      return subscriptions.map(sub => {
        const subscriptionData = typeof sub.subscription === 'string' 
          ? JSON.parse(sub.subscription) 
          : sub.subscription;
        
        return {
          id: Number(sub.id),
          userId: Number(sub.user_id),
          endpoint: subscriptionData.endpoint || sub.endpoint,
          keys: subscriptionData.keys || {},
          expirationTime: subscriptionData.expirationTime || null
        };
      });
    } catch (error) {
      console.error('Error getting subscriptions by users:', error);
      throw error;
    }
  }

  /**
   * Get semua active subscriptions
   */
  static async getAllSubscriptions() {
    try {
      const subscriptions = await prisma.push_subscriptions.findMany({
        orderBy: {
          created_at: 'desc'
        },
        select: {
          id: true,
          user_id: true,
          endpoint: true,
          subscription: true
        }
      });

      // Parse subscription JSON properly
      return subscriptions.map(sub => {
        const subscriptionData = typeof sub.subscription === 'string' 
          ? JSON.parse(sub.subscription) 
          : sub.subscription;
        
        return {
          id: Number(sub.id),
          userId: Number(sub.user_id),
          endpoint: subscriptionData.endpoint || sub.endpoint,
          keys: subscriptionData.keys || {},
          expirationTime: subscriptionData.expirationTime || null
        };
      });
    } catch (error) {
      console.error('Error getting all subscriptions:', error);
      throw error;
    }
  }

  /**
   * Hapus subscription
   */
  static async removeSubscription(userId, endpoint) {
    try {
      const result = await prisma.push_subscriptions.deleteMany({
        where: {
          user_id: BigInt(userId),
          endpoint: endpoint
        }
      });

      return result.count;
    } catch (error) {
      console.error('Error removing subscription:', error);
      throw error;
    }
  }

  /**
   * Hapus subscription yang invalid/expired
   */
  static async removeInvalidSubscription(subscriptionId) {
    try {
      const result = await prisma.push_subscriptions.delete({
        where: {
          id: BigInt(subscriptionId)
        }
      });

      return result;
    } catch (error) {
      console.error('Error removing invalid subscription:', error);
      throw error;
    }
  }
}

module.exports = PushSubscription;
