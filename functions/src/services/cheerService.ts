// functions/src/services/cheerService.ts
// エール送信のビジネスロジック

import * as admin from 'firebase-admin';

// エール送信理由
export type CheerReason = 'record' | 'streak_break' | 'long_absence' | 'random';

// リアクション種別
export type ReactionType = 'cheer' | 'amazing' | 'support';

// リアクション重み付け（確率%）
const REACTION_WEIGHTS: Record<CheerReason, Record<ReactionType, number>> = {
  record: { cheer: 65, amazing: 20, support: 15 },
  streak_break: { cheer: 30, amazing: 10, support: 60 },
  long_absence: { cheer: 15, amazing: 5, support: 80 },
  random: { cheer: 33, amazing: 33, support: 34 },
};

// エール文言リスト
const CHEER_MESSAGES: Record<CheerReason, Record<ReactionType, string[]>> = {
  // パターン①：記録直後（5〜45分後）
  record: {
    cheer: [
      '今日もナイス継続',
      'いい流れきてます',
      'その一歩すてき',
      '積み重ねが光ってる',
      'ペース、いい感じ',
      '今日の一歩も上々',
    ],
    amazing: [
      'すごくいいペース',
      '今日もキレてる',
      '続け方がうまいね',
      'いいリズム出てる',
      '流れつかんでるね',
      '伸び方がすてき',
    ],
    support: [
      '一緒にがんばってるよ',
      'こっちも今やってる',
      '同じ空気で進んでる',
      '仲間も今やってるよ',
      '今日も並んで歩こう',
      'となりで走ってる感',
    ],
  },

  // パターン②：継続途切れ翌日
  streak_break: {
    cheer: [
      '今日からまた一歩どう？',
      'ゆっくり戻ってこよ',
      '今日の一歩からでOK',
      '思い出したら一歩だけ',
      'できる日にやればOK',
      '軽く一歩踏み出そ',
    ],
    amazing: [
      'またすごい日が来そう',
      '積み重ね直前って感じ',
      '次の一歩が楽しみ',
      'ここからが面白いね',
      'また伸びていきそう',
      '未来の自分が楽しみ',
    ],
    support: [
      '少し休んでOK また一緒に',
      'ここからまた並走しよ',
      'いつでも隣で歩けるよ',
      'ペース戻すとき寄ってね',
      '今日は一緒にどう？',
      'また並んで進もうか',
    ],
  },

  // パターン③：長期離脱（7日/21日）
  long_absence: {
    cheer: [
      '思い出したら一歩だけ',
      'またいつでも再開OK',
      '久しぶりの一歩どう？',
      '一歩目はいつでも軽く',
      '小さく再開してみよ',
      '気が向いたらタップだけ',
    ],
    amazing: ['またすごい日が来そう'],
    support: [
      'いつでもここで待ってる',
      'また一緒に始めよ',
      '離れてても仲間だよ',
      '戻る場所はここだよ',
      '思い出したら会おう',
      'ふらっと戻っておいで',
    ],
  },

  // パターン④：ランダム（2〜3日に1回）
  random: {
    cheer: [
      'そのペースすごくいい',
      '積み重ねが効いてる',
      '日々の一歩が光ってる',
      'マイペースが一番いい',
      '地味にすごいことしてる',
      '今日もいいリズムだね',
    ],
    amazing: [
      'コツコツがすごい力に',
      '最近の記録とてもいい',
      'やり方がほんと上手',
      '積み重ねが尊敬レベル',
      'その継続、普通にすごい',
      'じわじわ伸びてるね',
    ],
    support: [
      '遠くで一緒にやってるよ',
      '同じカードの仲間です',
      'みんなで少しずつ前へ',
      'どこかで並走してます',
      '今日も仲間がそばにいる',
      '同じ方向向いてるよ',
    ],
  },
};

/**
 * 重み付けに基づいてリアクション種別を選択
 */
export function selectReactionType(reason: CheerReason): ReactionType {
  const weights = REACTION_WEIGHTS[reason];
  const rand = Math.random() * 100;

  let cumulative = 0;
  for (const [type, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (rand < cumulative) {
      return type as ReactionType;
    }
  }

  // フォールバック
  return 'cheer';
}

/**
 * エール文言をランダムに選択（直近N件と重複しない）
 */
export async function selectMessage(
  userId: string,
  reason: CheerReason,
  type: ReactionType
): Promise<string> {
  const db = admin.firestore();

  try {
    // 直近5件のエール文言を取得
    const recentReactions = await db
      .collection('reactions')
      .where('to_uid', '==', userId)
      .where('from_uid', '==', 'system')
      .orderBy('created_at', 'desc')
      .limit(5)
      .get();

    const recentMessages = recentReactions.docs
      .map((doc) => doc.data().message)
      .filter((msg) => msg != null);

    // 候補文言リスト
    const candidates = CHEER_MESSAGES[reason][type];

    // 重複していない文言のみを抽出
    const available = candidates.filter((msg) => !recentMessages.includes(msg));

    // 利用可能な文言がない場合は全候補からランダム選択
    const messagePool = available.length > 0 ? available : candidates;

    // ランダム選択
    return messagePool[Math.floor(Math.random() * messagePool.length)];
  } catch (error) {
    console.error('エール文言選択エラー:', error);
    // エラー時はフォールバック
    const candidates = CHEER_MESSAGES[reason][type];
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
}

/**
 * CheerStateを取得（存在しない場合は初期化）
 */
export async function getOrCreateCheerState(userId: string) {
  const db = admin.firestore();
  const cheerStateRef = db.collection('cheer_state').doc(userId);
  const snap = await cheerStateRef.get();

  if (!snap.exists) {
    const today = new Date().toISOString().split('T')[0];
    const initialState = {
      user_uid: userId,
      daily_count: 0,
      daily_count_date: today,
      weekly_streak_break_count: 0,
      weekly_streak_break_reset_date: today,
      last_random_cheer_at: null,
      long_absence_cheers: {},
      primary_recording_hour: null,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    await cheerStateRef.set(initialState);
    return initialState;
  }

  return snap.data();
}

/**
 * 1日のエール上限チェック（3件/日）
 */
export async function checkDailyLimit(userId: string): Promise<boolean> {
  const cheerState = await getOrCreateCheerState(userId);
  if (!cheerState) return false;

  const today = new Date().toISOString().split('T')[0];

  // 日付が変わっていればカウントリセット
  if (cheerState.daily_count_date !== today) {
    return true; // 新しい日なので送信可能
  }

  // 1日3件まで
  return cheerState.daily_count < 3;
}

/**
 * 1日のエールカウントをインクリメント
 */
export async function incrementDailyCount(userId: string): Promise<void> {
  const db = admin.firestore();
  const cheerStateRef = db.collection('cheer_state').doc(userId);
  const today = new Date().toISOString().split('T')[0];

  const cheerState = await getOrCreateCheerState(userId);
  if (!cheerState) return;

  if (cheerState.daily_count_date !== today) {
    // 日付が変わっている場合はリセット
    await cheerStateRef.update({
      daily_count: 1,
      daily_count_date: today,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    // 同じ日の場合はインクリメント
    await cheerStateRef.update({
      daily_count: admin.firestore.FieldValue.increment(1),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

/**
 * ユーザーの主要記録時間帯を取得（過去のログから学習）
 */
export async function getPrimaryRecordingHour(userId: string): Promise<{ start: number; end: number }> {
  const db = admin.firestore();

  try {
    // ユーザーの過去30日分のログを取得
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logsSnapshot = await db
      .collection('logs')
      .where('owner_uid', '==', userId)
      .where('logged_at', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .get();

    if (logsSnapshot.size < 5) {
      // データ不足の場合はデフォルト: 19:00〜21:00
      return { start: 19, end: 21 };
    }

    // 時間帯別の記録数をカウント
    const hourCounts: Record<number, number> = {};
    logsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const logTime = data.logged_at.toDate();
      const hour = logTime.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // 最頻出の時間帯を取得
    let maxCount = 0;
    let maxHour = 19; // デフォルト
    for (const [hour, count] of Object.entries(hourCounts)) {
      if (count > maxCount) {
        maxCount = count;
        maxHour = parseInt(hour);
      }
    }

    // 最頻出時間の前後1時間を範囲とする
    return {
      start: Math.max(0, maxHour - 1),
      end: Math.min(23, maxHour + 1),
    };
  } catch (error) {
    console.error('主要記録時間帯取得エラー:', error);
    return { start: 19, end: 21 };
  }
}

/**
 * お休みモード判定
 */
export function isQuietHours(userSettings: any): boolean {
  if (!userSettings.quiet_hours_enabled) {
    return false;
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  // 開始時刻と終了時刻をパース
  const [startHour, startMinute] = userSettings.quiet_hours_start.split(':').map(Number);
  const [endHour, endMinute] = userSettings.quiet_hours_end.split(':').map(Number);
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;

  // 日をまたぐ場合の処理
  if (startTime > endTime) {
    // 例: 23:00 〜 07:00
    return currentTime >= startTime || currentTime < endTime;
  } else {
    // 例: 08:00 〜 10:00
    return currentTime >= startTime && currentTime < endTime;
  }
}
