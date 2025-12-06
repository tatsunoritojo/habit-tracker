// functions/src/index.ts
// Cloud Functions エントリーポイント

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import {
  selectReactionType,
  selectMessage,
  checkDailyLimit,
  incrementDailyCount,
  isQuietHours,
} from './services/cheerService';
import { updateMatchingPoolsLogic } from './services/updateMatchingPools';
import { onHumanCheerSentLogic } from './services/humanCheerService';

// Firebase Admin初期化
admin.initializeApp();

const db = admin.firestore();

// ========================================
// 1. onLogCreated - ログ作成時のトリガー
// パターン①：記録直後エール（5〜45分後にスケジュール）
// ========================================
export const onLogCreated = functions.firestore
  .document('logs/{logId}')
  .onCreate(async (snapshot, context) => {
    const logData = snapshot.data();
    const { card_id, owner_uid } = logData;

    try {
      console.log(`onLogCreated: card_id=${card_id}, owner_uid=${owner_uid}`);

      // 1日の上限チェック
      const canSend = await checkDailyLimit(owner_uid);
      if (!canSend) {
        console.log('onLogCreated: 1日の上限に達しているためスキップ');
        return;
      }

      // カード情報を取得
      const cardSnap = await db.collection('cards').doc(card_id).get();
      if (!cardSnap.exists) {
        console.log('onLogCreated: カードが存在しません');
        return;
      }

      const cardData = cardSnap.data();
      if (!cardData) return;

      // 5〜45分後のランダムな時刻を計算
      const delayMinutes = Math.floor(Math.random() * 41) + 5; // 5〜45分
      const scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);

      // リアクション種別を選択
      const reactionType = selectReactionType('record');

      // エール文言を選択
      const message = await selectMessage(owner_uid, 'record', reactionType);

      // Reactionを作成（scheduled_for付き、delivered=false）
      await db.collection('reactions').add({
        from_uid: 'system',
        to_uid: owner_uid,
        to_card_id: card_id,
        type: reactionType,
        reason: 'record',
        message,
        scheduled_for: admin.firestore.Timestamp.fromDate(scheduledAt),
        delivered: false,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        is_read: false,
      });

      console.log(`onLogCreated: エールをスケジュール scheduled_for=${scheduledAt.toISOString()}`);
    } catch (error) {
      console.error('onLogCreated error:', error);
    }
  });

// ========================================
// 2. sendDelayedCheer - スケジュール済みエールの送信
// 1分ごとに実行、scheduled_for が現在時刻を過ぎているエールを配信
// ========================================
export const sendDelayedCheer = functions.pubsub
  .schedule('* * * * *') // 1分ごと
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    try {
      const now = admin.firestore.Timestamp.now();

      // scheduled_for が現在時刻以前で、delivered=false のエールを取得
      const pendingCheersSnapshot = await db
        .collection('reactions')
        .where('from_uid', '==', 'system')
        .where('delivered', '==', false)
        .where('scheduled_for', '<=', now)
        .limit(50) // バッチ処理の上限
        .get();

      console.log(`sendDelayedCheer: ${pendingCheersSnapshot.size}件の配信予定エールを処理`);

      const batch = db.batch();
      const notifications: Array<{ uid: string; cardTitle: string; message: string }> = [];

      for (const doc of pendingCheersSnapshot.docs) {
        const data = doc.data();
        const { to_uid, to_card_id, message } = data;

        // ユーザー設定を取得
        const userSnap = await db.collection('users').doc(to_uid).get();
        if (!userSnap.exists) continue;

        const userData = userSnap.data();
        if (!userData) continue;

        // お休みモードチェック
        if (isQuietHours(userData.settings)) {
          console.log(`sendDelayedCheer: お休みモード中のためスキップ uid=${to_uid}`);
          continue;
        }

        // カード情報を取得
        const cardSnap = await db.collection('cards').doc(to_card_id).get();
        const cardData = cardSnap.exists ? cardSnap.data() : null;
        const cardTitle = cardData?.title || '習慣カード';

        // deliveredフラグを更新
        batch.update(doc.ref, {
          delivered: true,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 1日のカウントをインクリメント
        await incrementDailyCount(to_uid);

        // 通知リストに追加
        notifications.push({ uid: to_uid, cardTitle, message });
      }

      // バッチコミット
      await batch.commit();

      // FCMプッシュ通知送信（後で実装）
      for (const notif of notifications) {
        await sendPushNotification(notif.uid, notif.cardTitle, notif.message);
      }

      console.log(`sendDelayedCheer: ${notifications.length}件のエールを配信しました`);
    } catch (error) {
      console.error('sendDelayedCheer error:', error);
    }
  });

// ========================================
// 3. checkStreakBreak - パターン②③の判定・送信
// 毎朝9時に実行
// ========================================
export const checkStreakBreak = functions.pubsub
  .schedule('0 9 * * *') // 毎朝9時（JST）
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    try {
      console.log('checkStreakBreak: 開始');

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // 全ユーザーを取得
      const usersSnapshot = await db.collection('users').get();

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        // 1日の上限チェック
        const canSend = await checkDailyLimit(userId);
        if (!canSend) continue;

        // ユーザーのカードを取得
        const cardsSnapshot = await db
          .collection('cards')
          .where('owner_uid', '==', userId)
          .where('is_public', '==', true)
          .get();

        for (const cardDoc of cardsSnapshot.docs) {
          const cardData = cardDoc.data();
          const cardId = cardDoc.id;
          const lastLogDate = cardData.last_log_date;

          // 最終記録日を取得
          if (!lastLogDate) continue; // 一度も記録がない場合はスキップ

          // 最終記録日からの経過日数を計算
          const lastLog = new Date(lastLogDate);
          const daysSinceLastLog = Math.floor((today.getTime() - lastLog.getTime()) / (1000 * 60 * 60 * 24));

          // パターン③：長期離脱（7日/21日/35日）
          if (daysSinceLastLog === 7 || daysSinceLastLog === 21 || daysSinceLastLog === 35) {
            const cheerState = await db.collection('cheer_state').doc(userId).get();
            const stateData = cheerState.exists ? cheerState.data() : null;

            if (stateData) {
              const longAbsenceCheers = stateData.long_absence_cheers || {};
              const cardCheers = longAbsenceCheers[cardId] || { count: 0 };

              // 最大3回まで
              if (cardCheers.count >= 3) {
                console.log(`checkStreakBreak: パターン③の上限に達しているためスキップ uid=${userId} card=${cardId}`);
                continue;
              }
            }

            // エール送信
            const reactionType = selectReactionType('long_absence');
            const message = await selectMessage(userId, 'long_absence', reactionType);

            await db.collection('reactions').add({
              from_uid: 'system',
              to_uid: userId,
              to_card_id: cardId,
              type: reactionType,
              reason: 'long_absence',
              message,
              scheduled_for: null,
              delivered: true,
              created_at: admin.firestore.FieldValue.serverTimestamp(),
              is_read: false,
            });

            // カウント更新
            await incrementDailyCount(userId);

            // 長期離脱エールのカウントを更新
            await db.collection('cheer_state').doc(userId).set({
              [`long_absence_cheers.${cardId}`]: {
                count: admin.firestore.FieldValue.increment(1),
                last_sent_at: admin.firestore.FieldValue.serverTimestamp(),
              },
              updated_at: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            // FCM送信
            const cardTitle = cardData.title || '習慣カード';
            await sendPushNotification(userId, cardTitle, message);

            console.log(`checkStreakBreak: パターン③送信 (${daysSinceLastLog}日) uid=${userId} card=${cardId}`);
            continue; // パターン③を送信したらパターン②はスキップ
          }

          // 前日に未記録かチェック（パターン②用）
          if (lastLogDate === yesterdayStr) continue; // 前日に記録あり

          // パターン②：継続途切れ翌日（週2回まで）
          const cheerState = await db.collection('cheer_state').doc(userId).get();
          const stateData = cheerState.exists ? cheerState.data() : null;

          if (stateData) {
            // 週のリセット判定（月曜日に週がリセット）
            const weekStart = getWeekStart(today);
            const weekStartStr = weekStart.toISOString().split('T')[0];

            if (stateData.weekly_streak_break_reset_date !== weekStartStr) {
              // 週が変わっているのでリセット
              await db.collection('cheer_state').doc(userId).update({
                weekly_streak_break_count: 0,
                weekly_streak_break_reset_date: weekStartStr,
              });
            }

            // 週2回まで
            if (stateData.weekly_streak_break_count >= 2) {
              console.log(`checkStreakBreak: 週の上限に達しているためスキップ uid=${userId}`);
              continue;
            }
          }

          // エール送信
          const reactionType = selectReactionType('streak_break');
          const message = await selectMessage(userId, 'streak_break', reactionType);

          await db.collection('reactions').add({
            from_uid: 'system',
            to_uid: userId,
            to_card_id: cardId,
            type: reactionType,
            reason: 'streak_break',
            message,
            scheduled_for: null,
            delivered: true, // 即時配信
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            is_read: false,
          });

          // カウント更新
          await incrementDailyCount(userId);
          await db.collection('cheer_state').doc(userId).update({
            weekly_streak_break_count: admin.firestore.FieldValue.increment(1),
          });

          // FCM送信
          const cardTitle = cardData.title || '習慣カード';
          await sendPushNotification(userId, cardTitle, message);

          console.log(`checkStreakBreak: パターン②送信 uid=${userId} card=${cardId}`);
        }
      }

      console.log('checkStreakBreak: 完了');
    } catch (error) {
      console.error('checkStreakBreak error:', error);
    }
  });

// ========================================
// 4. sendRandomCheer - パターン④のランダムエール
// 6時間ごとに実行
// ========================================
export const sendRandomCheer = functions.pubsub
  .schedule('0 */6 * * *') // 6時間ごと
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    try {
      console.log('sendRandomCheer: 開始');

      // ランダムに数名のユーザーを選択
      const usersSnapshot = await db.collection('users').limit(100).get();

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        // 1日の上限チェック
        const canSend = await checkDailyLimit(userId);
        if (!canSend) continue;

        // 直近1週間で1回以上記録があるかチェック
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentLogsSnapshot = await db
          .collection('logs')
          .where('owner_uid', '==', userId)
          .where('logged_at', '>=', admin.firestore.Timestamp.fromDate(sevenDaysAgo))
          .limit(1)
          .get();

        if (recentLogsSnapshot.empty) {
          console.log(`sendRandomCheer: 直近1週間記録なしのためスキップ uid=${userId}`);
          continue;
        }

        // ランダムに33%の確率で送信
        if (Math.random() > 0.33) continue;

        // ユーザーの公開カードをランダムに1つ選択
        const cardsSnapshot = await db
          .collection('cards')
          .where('owner_uid', '==', userId)
          .where('is_public', '==', true)
          .get();

        if (cardsSnapshot.empty) continue;

        const cards = cardsSnapshot.docs;
        const randomCard = cards[Math.floor(Math.random() * cards.length)];
        const cardId = randomCard.id;
        const cardData = randomCard.data();

        // エール送信
        const reactionType = selectReactionType('random');
        const message = await selectMessage(userId, 'random', reactionType);

        await db.collection('reactions').add({
          from_uid: 'system',
          to_uid: userId,
          to_card_id: cardId,
          type: reactionType,
          reason: 'random',
          message,
          scheduled_for: null,
          delivered: true,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          is_read: false,
        });

        // カウント更新
        await incrementDailyCount(userId);

        // FCM送信
        const cardTitle = cardData.title || '習慣カード';
        await sendPushNotification(userId, cardTitle, message);

        console.log(`sendRandomCheer: パターン④送信 uid=${userId} card=${cardId}`);
      }

      console.log('sendRandomCheer: 完了');
    } catch (error) {
      console.error('sendRandomCheer error:', error);
    }
  });

// ========================================
// ヘルパー関数
// ========================================

/**
 * 週の開始日（月曜日）を取得
 */
function getWeekStart(date: Date): Date {
  const day = date.getDay(); // 0=日曜, 1=月曜, ...
  const diff = day === 0 ? -6 : 1 - day; // 月曜日を週の開始とする
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

// ========================================
// 5. deliverBatchNotifications - まとめて通知の配信
// 毎時0分に実行
// ========================================
export const deliverBatchNotifications = functions.pubsub
  .schedule('0 * * * *') // 毎時0分
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    try {
      console.log('deliverBatchNotifications: 開始');

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // notification_mode が 'batch' のユーザーを取得
      const usersSnapshot = await db.collection('users').get();

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const settings = userData.settings;

        // まとめて通知モードでない場合はスキップ
        if (settings?.notification_mode !== 'batch') continue;

        // batch_times の設定時刻に一致するかチェック
        const batchTimes = settings.batch_times || [];
        const shouldSend = batchTimes.some((time: string) => {
          // 時刻を比較（分単位で15分の許容範囲を持たせる）
          const [hour, minute] = time.split(':').map(Number);
          return hour === currentHour && Math.abs(minute - currentMinute) <= 15;
        });

        if (!shouldSend) continue;

        // 今日の未読エールを取得
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const reactionsSnapshot = await db
          .collection('reactions')
          .where('to_uid', '==', userId)
          .where('from_uid', '==', 'system')
          .where('is_read', '==', false)
          .where('delivered', '==', true)
          .where('created_at', '>=', admin.firestore.Timestamp.fromDate(today))
          .get();

        const unreadCount = reactionsSnapshot.size;

        if (unreadCount === 0) {
          console.log(`deliverBatchNotifications: 未読エールなし uid=${userId}`);
          continue;
        }

        // まとめて通知を送信
        await sendBatchNotification(userId, unreadCount);

        console.log(`deliverBatchNotifications: まとめて通知送信 uid=${userId} count=${unreadCount}`);
      }

      console.log('deliverBatchNotifications: 完了');
    } catch (error) {
      console.error('deliverBatchNotifications error:', error);
    }
  });

// ========================================
// ヘルパー関数
// ========================================

/**
 * FCMプッシュ通知送信（個別エール）
 */
async function sendPushNotification(userId: string, cardTitle: string, message: string): Promise<void> {
  try {
    // ユーザーのFCMトークンを取得
    const userSnap = await db.collection('users').doc(userId).get();
    if (!userSnap.exists) return;

    const userData = userSnap.data();
    if (!userData) return;

    const fcmToken = userData.settings?.fcm_token;
    if (!fcmToken) {
      console.log(`sendPushNotification: FCMトークンなし uid=${userId}`);
      return;
    }

    // プッシュ通知を送信
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: '💪 ハビット仲間からエール！',
        body: `「${cardTitle}」${message}`,
      },
      data: {
        type: 'cheer',
        card_id: '', // 必要に応じて設定
      },
    });

    console.log(`sendPushNotification: 送信成功 uid=${userId}`);
  } catch (error) {
    console.error('sendPushNotification error:', error);
    // FCM送信失敗はスキップ（エール自体は保存済み）
  }
}

/**
 * FCMまとめて通知送信
 */
async function sendBatchNotification(userId: string, count: number): Promise<void> {
  try {
    // ユーザーのFCMトークンを取得
    const userSnap = await db.collection('users').doc(userId).get();
    if (!userSnap.exists) return;

    const userData = userSnap.data();
    if (!userData) return;

    const fcmToken = userData.settings?.fcm_token;
    if (!fcmToken) {
      console.log(`sendBatchNotification: FCMトークンなし uid=${userId}`);
      return;
    }

    // プッシュ通知を送信
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: `🎉 今日のエールが届いています（${count}件）`,
        body: 'ハビット仲間からの応援をチェックしてみましょう',
      },
      data: {
        type: 'batch_cheer',
        count: count.toString(),
      },
    });

    console.log(`sendBatchNotification: 送信成功 uid=${userId} count=${count}`);
  } catch (error) {
    console.error('sendBatchNotification error:', error);
  }
}

// ========================================
// 6. updateMatchingPools - マッチングプール更新
// 30分ごとに実行
// ========================================
export const updateMatchingPools = functions.pubsub
  .schedule('*/30 * * * *')
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    await updateMatchingPoolsLogic();
  });

// ========================================
// 7. onHumanCheerSent - 人間エール送信時のトリガー
// reactionsドキュメント作成時に発火
// ========================================
export const onHumanCheerSent = functions.firestore
  .document('reactions/{reactionId}')
  .onCreate(async (snapshot, context) => {
    await onHumanCheerSentLogic(snapshot, context);
  });
