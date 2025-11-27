// src/types/index.ts
// MVP仕様書に基づいたデータ型定義

import { Timestamp } from 'firebase/firestore';

// ========================================
// User（ユーザー）
// ========================================
export type User = {
  uid: string;
  created_at: Timestamp;
  last_login_at: Timestamp;
  settings: UserSettings;
  stats: UserStats;
};

export type UserSettings = {
  cheer_frequency: 'high' | 'medium' | 'low' | 'off';
  push_enabled: boolean;
  timezone: string; // "Asia/Tokyo"
};

export type UserStats = {
  total_cards: number;
  total_logs: number;
  current_streak_max: number;
  cheers_received: number;
  cheers_sent: number;
};

// ========================================
// Card（習慣カード）
// ========================================
export type Card = {
  card_id: string;
  owner_uid: string;

  // カテゴリ（3階層）
  category_l1: string; // 例: "health"
  category_l2: string; // 例: "exercise"
  category_l3: string; // 例: "muscle_training"

  // カード情報
  title: string;
  template_id: string;
  is_custom: boolean; // MVP: 常にfalse

  // 公開設定
  is_public: boolean;

  // 統計（非正規化）
  current_streak: number;
  longest_streak: number;
  total_logs: number;
  last_log_date: string; // "YYYY-MM-DD"

  created_at: Timestamp;
  updated_at: Timestamp;
};

// ========================================
// Log（達成ログ）
// ========================================
export type Log = {
  log_id: string;
  card_id: string;
  owner_uid: string;

  date: string; // "YYYY-MM-DD"
  logged_at: Timestamp;
};

// ========================================
// Category（カテゴリマスタ）
// ========================================
export type Category = {
  category_id: string;
  level: 1 | 2 | 3;
  parent_id: string | null;

  name_ja: string;
  name_en: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
};

// ========================================
// CardTemplate（カードテンプレート）
// ========================================
export type CardTemplate = {
  template_id: string;

  category_l1: string;
  category_l2: string;
  category_l3: string;

  title_ja: string;
  title_en: string;
  description_ja: string | null;

  icon: string;
  sort_order: number;
  is_official: boolean; // MVP: 常にtrue
  is_active: boolean;
  created_at: Timestamp;
};

// ========================================
// MatchingPool（マッチングプール）
// ========================================
export type MatchingPool = {
  category_l3: string;
  active_cards: MatchingPoolCard[];
  updated_at: Timestamp;
};

export type MatchingPoolCard = {
  card_id: string;
  owner_uid: string;
  current_streak: number;
  last_log_date: string;
};

// ========================================
// Reaction（エール）
// ========================================
export type Reaction = {
  reaction_id: string;

  from_uid: string;
  to_uid: string;
  to_card_id: string;

  type: ReactionType;

  created_at: Timestamp;
  is_read: boolean;
};

export type ReactionType = 'cheer' | 'amazing' | 'support';

// リアクション表示情報
export type ReactionInfo = {
  type: ReactionType;
  label: string;
  icon: string;
  description: string;
};

// リアクションマスタ
export const REACTIONS: Record<ReactionType, ReactionInfo> = {
  cheer: {
    type: 'cheer',
    label: 'ナイス継続',
    icon: '💪',
    description: '継続そのものへの励まし。基礎リアクション。',
  },
  amazing: {
    type: 'amazing',
    label: 'すごい！',
    icon: '⭐',
    description: '節目・成長へのお祝い。ハイライト時に。',
  },
  support: {
    type: 'support',
    label: '一緒にがんばろ',
    icon: '🤝',
    description: '伴走感・仲間感。同じカテゴリで頑張っている共感。',
  },
};

// ========================================
// カテゴリL1マスタ
// ========================================
export type CategoryL1Id = 'health' | 'learning' | 'lifestyle' | 'creative' | 'mindfulness';

export const CATEGORY_L1_INFO: Record<CategoryL1Id, { name_ja: string; name_en: string }> = {
  health: { name_ja: '健康', name_en: 'Health' },
  learning: { name_ja: '学習', name_en: 'Learning' },
  lifestyle: { name_ja: '生活習慣', name_en: 'Lifestyle' },
  creative: { name_ja: '創作', name_en: 'Creative' },
  mindfulness: { name_ja: 'マインドフルネス', name_en: 'Mindfulness' },
};
