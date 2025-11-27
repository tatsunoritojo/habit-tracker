// src/services/statsService.ts
// ユーザー統計計算サービス

import {
  collection,
  query,
  where,
  getDocs,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Log } from '../types';

export interface UserStats {
  weekDays: number;  // 今週の達成日数
  monthDays: number; // 今月の達成日数
}

/**
 * ユーザーの統計を計算
 * @param ownerUid ユーザーUID
 * @returns 今週・今月の達成日数
 */
export async function calculateUserStats(ownerUid: string): Promise<UserStats> {
  try {
    // 今週の開始日（月曜日）を取得
    const weekStart = getWeekStart();
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // 今月の開始日を取得
    const monthStart = getMonthStart();
    const monthStartStr = monthStart.toISOString().split('T')[0];

    // ユーザーの全ログを取得
    const logsQuery = query(
      collection(db, 'logs'),
      where('owner_uid', '==', ownerUid)
    );

    const logsSnapshot: QuerySnapshot<DocumentData> = await getDocs(logsQuery);
    const logs = logsSnapshot.docs.map((doc) => doc.data() as Log);

    // 今週のログをフィルタ
    const weekLogs = logs.filter((log) => log.logged_date >= weekStartStr);

    // 今月のログをフィルタ
    const monthLogs = logs.filter((log) => log.logged_date >= monthStartStr);

    // ユニークな日付をカウント（複数のカードで同じ日に記録しても1日とカウント）
    const weekDays = new Set(weekLogs.map((log) => log.logged_date)).size;
    const monthDays = new Set(monthLogs.map((log) => log.logged_date)).size;

    return {
      weekDays,
      monthDays,
    };
  } catch (error) {
    console.error('統計計算エラー:', error);
    throw error;
  }
}

/**
 * 今週の開始日（月曜日）を取得
 */
function getWeekStart(): Date {
  const today = new Date();
  const day = today.getDay(); // 0 (日曜) - 6 (土曜)
  const diff = day === 0 ? -6 : 1 - day; // 月曜日を週の始まりとする

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);

  return weekStart;
}

/**
 * 今月の開始日（1日）を取得
 */
function getMonthStart(): Date {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  return monthStart;
}
