# 実装現状レポート

## 作成情報
- 作成日: 2025-12-07
- 作成者: Claude（エンジニアエージェント）
- 対象: habit-tracker コードベース
- レポート目的: Phase 7〜9の実装内容を仕様書に反映するための現状整理

---

## 1. データモデル（Firestoreコレクション）

### 1.1 users/{uid}

```typescript
interface User {
  uid: string;
  display_name?: string; // Phase 9.5: ニックネーム（任意）
  created_at: Timestamp;
  last_login_at: Timestamp;
  settings: UserSettings;
  stats: UserStats;
}

interface UserSettings {
  cheer_frequency: 'high' | 'medium' | 'low' | 'off';
  push_enabled: boolean;
  timezone: string; // "Asia/Tokyo"

  // Phase 7: エール通知設定
  notification_mode: 'realtime' | 'batch'; // リアルタイム or まとめて通知
  batch_times: string[]; // まとめて通知の配信時刻 例: ["12:00", "18:00", "22:00"]
  quiet_hours_enabled: boolean; // お休みモード（デフォルト: true）
  quiet_hours_start: string; // お休み開始時刻（デフォルト: "23:00"）
  quiet_hours_end: string; // お休み終了時刻（デフォルト: "07:00"）

  // FCMトークン
  fcm_token?: string | null; // デバイストークン
}

interface UserStats {
  total_cards: number;
  total_logs: number;
  current_streak_max: number;
  cheers_received: number;
  cheers_sent: number;
}
```

### 1.2 cards/{card_id}

```typescript
interface Card {
  card_id: string;
  owner_uid: string;

  // カテゴリ（3階層）
  category_l1: string; // 例: "health"
  category_l2: string; // 例: "exercise"
  category_l3: string; // 例: "muscle_training"

  // カード情報
  title: string;
  template_id: string;
  is_custom: boolean; // オリジナルカード判定

  // 公開設定
  is_public: boolean; // deprecated in Phase 9.5

  // Phase 9.5: 公開設定の細分化
  is_public_for_cheers?: boolean; // エールを受け取る
  is_public_for_template?: boolean; // テンプレートとして公開

  // 統計（非正規化）
  current_streak: number;
  longest_streak: number;
  total_logs: number;
  last_log_date: string; // "YYYY-MM-DD"

  // Phase 9: ステータス管理と通知
  status: 'active' | 'archived';
  archived_at?: Timestamp | null;
  reminder_enabled?: boolean;
  reminder_time?: string | null; // "HH:mm"

  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### 1.3 logs/{log_id}

```typescript
interface Log {
  log_id: string;
  card_id: string;
  owner_uid: string;

  date: string; // "YYYY-MM-DD"
  logged_at: Timestamp;
}
```

### 1.4 categories/{category_id}

```typescript
interface Category {
  category_id: string;
  level: 1 | 2 | 3;
  parent_id: string | null;

  name_ja: string;
  name_en: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}
```

### 1.5 card_templates/{template_id}

```typescript
interface CardTemplate {
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
}
```

### 1.6 matching_pools/{category_l3} - Phase 8追加

```typescript
interface MatchingPool {
  category_l3: string;
  active_cards: MatchingPoolCard[];
  updated_at: Timestamp;
}

interface MatchingPoolCard {
  card_id: string;
  owner_uid: string;
  title?: string;
  current_streak: number;
  last_log_date: string;
  total_logs?: number;
  is_comeback?: boolean;
}
```

**用途**: カテゴリL3単位でアクティブユーザーのカード情報をプール化。30分ごとに更新され、エール提案画面で利用される。

### 1.7 reactions/{reaction_id} - Phase 7/8で拡張

```typescript
interface Reaction {
  reaction_id: string;

  from_uid: string; // システムエール: "system", 人間エール: ユーザーUID
  to_uid: string;
  to_card_id: string;

  type: 'cheer' | 'amazing' | 'support';

  // Phase 7: システムエール拡張
  reason?: 'record' | 'streak_break' | 'long_absence' | 'random'; // エール送信理由（システムエールのみ）
  message?: string; // エール文言（システムエールのみ）
  scheduled_for?: Timestamp | null; // まとめて通知用の配信予定時刻
  delivered?: boolean; // 配信済みフラグ

  // Phase 9: カード情報の非正規化（通知画面用）
  card_title?: string; // カードタイトル
  card_category_name?: string; // カテゴリ名（日本語）

  created_at: Timestamp;
  is_read: boolean;
}
```

**3種類のリアクション**:
- `cheer` (💪 ナイス継続): 基礎的な応援
- `amazing` (⭐ すごい！): 節目・成長の称賛
- `support` (🤝 一緒にがんばろ): 伴走感・仲間感

### 1.8 cheer_state/{user_uid} - Phase 7追加

```typescript
interface CheerState {
  user_uid: string;

  // 1日あたりの送信カウント
  daily_count: number;
  daily_count_date: string; // "YYYY-MM-DD"

  // パターン②用：週あたりの送信カウント
  weekly_streak_break_count: number;
  weekly_streak_break_reset_date: string; // 週の開始日 "YYYY-MM-DD"

  // パターン④用：最終ランダムエール日時
  last_random_cheer_at: Timestamp | null;

  // パターン③用：カード別の長期離脱エール送信履歴
  long_absence_cheers: {
    [card_id: string]: {
      count: number; // 送信回数（最大3）
      last_sent_at: Timestamp;
    };
  };

  // ユーザーの主要記録時間帯（学習結果）
  primary_recording_hour: number | null; // 0-23、nullはデータ不足

  updated_at: Timestamp;
}
```

**用途**: AIエール送信のための状態管理（Cloud Functionsが更新）

### 1.9 cheer_send_state/{user_uid} - Phase 8追加

```typescript
interface CheerSendState {
  user_uid: string;
  daily_send_count: number;
  daily_send_date: string; // "YYYY-MM-DD"
  sent_pairs: SentPair[];
  updated_at: Timestamp;
}

interface SentPair {
  to_card_id: string;
  sent_at: Timestamp;
}
```

**用途**: 人間エール送信の制限管理
- 1日の送信上限: 10件
- 同一ペアへの送信制限: 24時間に1回

---

## 2. 画面一覧

### 2.1 ファイル構成

```
app/
├── index.tsx                           # スプラッシュ画面（初回起動判定）
├── onboarding.tsx                      # オンボーディング（3画面スワイプ）
├── add-card.tsx                        # カテゴリL1選択画面
├── select-card.tsx                     # カテゴリL2/テンプレート選択
├── create-custom-card.tsx              # オリジナルカード作成（Phase 9）
├── edit-card.tsx                       # カード編集画面（Phase 9）
├── archived-cards.tsx                  # アーカイブ一覧（Phase 9）
├── (tabs)/
│   ├── _layout.tsx                     # タブナビゲーション定義
│   ├── home.tsx                        # ホーム画面（カード一覧）
│   ├── cheers.tsx                      # エール提案画面（Phase 8）
│   ├── notifications.tsx               # 通知一覧
│   └── settings.tsx                    # 設定画面
├── card-detail/
│   └── [id].tsx                        # カード詳細画面（動的ルート）
├── settings/
│   └── account-deletion.tsx            # アカウント削除画面（Phase 9）
└── today-cheers.tsx                    # ?（用途不明、削除予定？）
```

### 2.2 画面別詳細

| ファイルパス | 画面名 | 役割 |
|-------------|--------|------|
| app/index.tsx | スプラッシュ | AsyncStorageで初回起動判定 → オンボーディング or ホーム |
| app/onboarding.tsx | オンボーディング | 3画面スワイプ（「小さな一歩」「仲間からのエール」「さあ、始めましょう」） |
| app/add-card.tsx | カテゴリL1選択 | 健康・学習・生活習慣・創作・マインドフルネスから選択 |
| app/select-card.tsx | L2/テンプレート選択 | サブカテゴリ選択 → テンプレート選択 → 「オリジナル作成」ボタン |
| app/create-custom-card.tsx | オリジナルカード作成 | カテゴリL3とタイトル入力、確認ダイアログ表示 |
| app/edit-card.tsx | カード編集 | タイトル編集、リマインダー設定、公開/非公開切替、削除/アーカイブ |
| app/archived-cards.tsx | アーカイブ一覧 | アーカイブ済みカードの一覧、統計表示、復元機能 |
| app/(tabs)/home.tsx | ホーム | カード一覧、記録ボタン、エール表示、「＋カード追加」ボタン |
| app/(tabs)/cheers.tsx | エール提案 | 最大3件の候補表示、3種のリアクション送信、アンドゥ機能 |
| app/(tabs)/notifications.tsx | 通知一覧 | 受信エール一覧、既読管理 |
| app/(tabs)/settings.tsx | 設定 | エール頻度、通知設定、アカウント削除リンク |
| app/card-detail/[id].tsx | カード詳細 | カレンダー、統計、バッジ、ログ一覧 |
| app/settings/account-deletion.tsx | アカウント削除 | 警告表示、削除実行 |

---

## 3. 画面遷移図

```
[スプラッシュ (index.tsx)]
    │
    ├─(初回)→ [オンボーディング] → [ホーム]
    │
    └─(2回目以降)→ [ホーム]
                      │
                      ├→ [カード詳細]
                      │    └→ [カード編集]
                      │         ├→ [削除ダイアログ]
                      │         └→ [アーカイブダイアログ]
                      │
                      ├→ [カード追加 (L1選択)]
                      │    └→ [L2/テンプレート選択]
                      │         ├→ [確認ダイアログ] → [ホーム]
                      │         └→ [オリジナル作成]
                      │              └→ [確認ダイアログ] → [ホーム]
                      │
                      ├→ [エール提案] ← タブ
                      │    └→ 送信成功 → アンドゥスナックバー
                      │
                      ├→ [通知一覧] ← タブ
                      │
                      ├→ [設定] ← タブ
                      │    └→ [アカウント削除]
                      │
                      └→ [アーカイブ一覧]
                           └→ 復元 → [ホーム]
```

**特記事項**:
- Phase 9で「Welcome Back Modal」追加（3日以上ログインしていない場合に表示）
- タブナビゲーション: ホーム / エール提案 / 通知 / 設定
- オンボーディングは初回のみ（AsyncStorageフラグ管理）

---

## 4. Cloud Functions

| 関数名 | トリガー | 処理概要 |
|--------|----------|----------|
| onLogCreated | Firestore onCreate (logs) | ログ作成時に5〜45分後のAIエールをスケジュール |
| sendDelayedCheer | Cloud Scheduler (1分ごと) | scheduled_for を過ぎたAIエールを配信 |
| checkStreakBreak | Cloud Scheduler (毎朝9時) | パターン②継続途切れ翌日、パターン③長期離脱（7/21/35日）エール送信 |
| sendRandomCheer | Cloud Scheduler (6時間ごと) | パターン④ランダムエール（33%の確率で送信） |
| deliverBatchNotifications | Cloud Scheduler (毎時0分) | まとめて通知モードのユーザーに未読エールをFCM送信 |
| updateMatchingPools | Cloud Scheduler (30分ごと) | カテゴリL3単位でマッチングプールを更新 |
| onHumanCheerSent | Firestore onCreate (reactions) | 人間エール送信時のFCM通知 |
| onCardDeleted | Firestore onDelete (cards) | カスケード削除（logs, reactions, matching_poolsから削除） |
| onUserDeleted | Auth onDelete | ユーザー削除時の全関連データクリーンアップ |
| sendReminders | Cloud Scheduler (15分ごと) | リマインダー設定されたカードの通知送信 |

### 4.1 AIエール送信パターン（Phase 7）

| パターン | トリガー | 送信頻度 | 送信タイミング |
|----------|----------|----------|--------------|
| ① 記録直後 | ログ作成時 | 記録ごと | 5〜45分後（ランダム） |
| ② 継続途切れ翌日 | 毎朝9時バッチ | 週2回まで | 前日未記録のカード |
| ③ 長期離脱 | 毎朝9時バッチ | カードごと3回まで | 7日/21日/35日離脱時 |
| ④ ランダム | 6時間ごと | 33%の確率 | アクティブユーザー対象 |

**1日の上限**: 3件（全パターン合計）

**AIエール文言**: 68種類（reason × reactionTypeの組み合わせで選択）

---

## 5. ビジネスロジック

### 5.1 ストリーク計算 (src/services/logService.ts)

**ロジック概要**:
1. ログ記録時に全ログを取得
2. 日付降順（新しい順）でソート
3. 今日から遡って連続している日数をカウント → `current_streak`
4. 全期間で最も長かった連続日数をカウント → `longest_streak`
5. カードドキュメントに統計を更新

**関数**:
- `recordLog(cardId, ownerUid)`: ログ作成 + 統計更新
- `calculateCardStats()`: 全ログから統計計算
- `calculateCurrentStreak()`: 今日から遡った連続日数
- `calculateLongestStreak()`: 全期間の最長連続日数

### 5.2 マッチングロジック (functions/src/services/updateMatchingPools.ts)

**ロジック概要**（推測、ファイル未読だが型定義から）:
1. 全カテゴリL3を取得
2. 各カテゴリで直近7日以内に記録があるカードを抽出
3. `active_cards` 配列に保存（owner_uid, card_id, current_streak, last_log_date等）
4. 30分ごとに更新

**エール提案の選定基準**:
- 自分が公開しているカテゴリL3のマッチングプールから取得
- 自分自身のカードを除外
- 24時間以内に送信済みのカードを除外
- シャッフルして上位3件を提案

### 5.3 送信制限 (src/services/cheerSendService.ts)

**制限ルール**:
- 1日の上限: 10件（`daily_send_count`）
- 同一ペア制限: 24時間に1回（`sent_pairs` で管理）

**エラー**:
- `DAILY_LIMIT_REACHED`: 1日の上限到達
- `ALREADY_SENT_TODAY`: 同一カードへの24時間以内送信

**アンドゥ機能**:
- 送信直後（3秒間表示）にアンドゥ可能
- `reactions` ドキュメント削除 + `sent_pairs` から削除 + カウント戻す

### 5.4 バッジ付与 (src/utils/gamification.ts)

**バッジ一覧**:

| バッジ | 条件 | アイコン | 説明 |
|--------|------|----------|------|
| 3日継続 | 連続3日 | 🥉 | 3日連続で達成しました！ |
| 7日継続 | 連続7日 | 🥈 | 7日連続で達成しました！ |
| 21日継続 | 連続21日 | 🥇 | 21日連続で達成しました！習慣化の達人です！ |
| 復活の一歩 | 中断後3日再開 | ❤️‍🔥 | 中断を乗り越えて3日連続達成！おかえりなさい！ |
| 100回記録 | 累計100回 | 💎 | 累計100回記録しました！素晴らしい継続力です！ |

**復活の一歩の判定ロジック**:
- 現在のストリークが3日以上
- かつ全ログ数がストリークよりも多い（= 過去にギャップがあった）

### 5.5 AIエール文言選択 (functions/src/services/cheerService.ts)

**文言データ構造**（推測、ファイル未読）:
- `reason` × `reactionType` の組み合わせで68種類
- ランダムに選択（重複を避けるためユーザー状態を保存？）

---

## 6. コンポーネント一覧

| コンポーネント | ファイル | 用途 |
|----------------|----------|------|
| Calendar | src/components/Calendar.tsx | カレンダー表示（月次、達成日をハイライト） |
| CategoryCard | src/components/CategoryCard.tsx | カテゴリL1選択カード |
| DeleteCardDialog | src/components/DeleteCardDialog.tsx | カード削除確認ダイアログ |
| ArchiveCardDialog | src/components/ArchiveCardDialog.tsx | アーカイブ確認ダイアログ（Phase 9） |
| CreateCardConfirmDialog | src/components/CreateCardConfirmDialog.tsx | カード作成確認ダイアログ |
| WelcomeBackModal | src/components/WelcomeBackModal.tsx | 3日以上ログインしていない場合の復帰演出（Phase 9） |

---

## 7. 外部依存

### 7.1 主要パッケージ

| パッケージ | バージョン | 用途 |
|------------|------------|------|
| expo | ~54.0.25 | React Native開発フレームワーク |
| react-native | 0.81.5 | モバイルアプリフレームワーク |
| react | 19.1.0 | UIライブラリ |
| firebase | ^12.6.0 | バックエンド（Auth, Firestore, Functions, FCM） |
| expo-router | ~6.0.15 | ファイルベースルーティング |
| expo-notifications | ^0.32.13 | プッシュ通知 |
| @react-native-async-storage/async-storage | ^2.2.0 | ローカルストレージ |
| @react-native-community/datetimepicker | 8.4.4 | 日時選択UI |

### 7.2 Firebase設定

**使用サービス**:
- Firebase Authentication（匿名認証）
- Cloud Firestore（データベース）
- Cloud Functions（バックエンドロジック）
- Firebase Cloud Messaging（プッシュ通知）

**Expoプラグイン**:
- `expo-router`
- `expo-notifications`

---

## 8. Firestoreセキュリティルール

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // users: 本人のみ
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // cards: 本人は全操作、他者は公開のみ読み取り
    match /cards/{cardId} {
      allow read: if request.auth != null &&
        (resource.data.owner_uid == request.auth.uid || resource.data.is_public == true);
      allow create: if request.auth != null && request.resource.data.owner_uid == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.owner_uid == request.auth.uid;
    }

    // logs: 本人のみ
    match /logs/{logId} {
      allow read: if request.auth != null && resource.data.owner_uid == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.owner_uid == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.owner_uid == request.auth.uid;
    }

    // categories, card_templates: 全員読み取り
    match /categories/{doc} {
      allow read: if request.auth != null;
    }
    match /card_templates/{doc} {
      allow read: if request.auth != null;
    }

    // matching_pools: 読み取りのみ（認証済みユーザー）
    match /matching_pools/{doc} {
      allow read: if request.auth != null;
      allow write: if false; // Cloud Functions のみが書き込み可能
    }

    // reactions: 送信者は作成、受信者は読み取り・更新
    // Phase 7: システムエール（from_uid="system"）を許可
    // Phase 8: 人間エール（from_uid=自分）を許可
    match /reactions/{reactionId} {
      allow create: if request.auth != null &&
        (request.resource.data.from_uid == request.auth.uid || request.resource.data.from_uid == "system");
      allow read, update: if request.auth != null && resource.data.to_uid == request.auth.uid;
    }

    // cheer_state: Cloud Functions のみ（管理者権限で操作）
    match /cheer_state/{docId} {
      allow read: if request.auth != null && docId == request.auth.uid;
      allow write: if false; // Cloud Functions のみが書き込み可能
    }

    // cheer_send_state: 本人のみ読み書き（Phase 8）
    match /cheer_send_state/{docId} {
      allow read, write: if request.auth != null && docId == request.auth.uid;
    }
  }
}
```

---

## 9. 特記事項

### 9.1 仕様書との乖離（Phase 7〜9で追加された機能）

以下の機能が仕様書に未反映です：

**Phase 7（AIエール機能）**:
- 4パターンのAIエール送信ロジック（記録直後、継続途切れ、長期離脱、ランダム）
- 68種類のエール文言
- お休みモード（quiet_hours）
- まとめて通知モード（batch notification）
- 1日3件の送信上限
- `cheer_state` コレクション

**Phase 8（人間エール機能）**:
- マッチングプール（カテゴリL3単位）
- エール提案画面（app/(tabs)/cheers.tsx）
- 送信制限（1日10件、同一ペア24時間に1回）
- アンドゥ機能
- `matching_pools` コレクション
- `cheer_send_state` コレクション

**Phase 9（アプリ完成）**:
- オンボーディング3画面（app/onboarding.tsx）
- カード追加UX改善（3ステップ選択）
- オリジナルカード作成（app/create-custom-card.tsx）
- カード編集画面（app/edit-card.tsx）
- アーカイブ機能（app/archived-cards.tsx）
- バッジシステム（5種類、src/utils/gamification.ts）
- Welcome Back演出（WelcomeBackModal）
- アカウント削除機能（app/settings/account-deletion.tsx）
- リマインダー通知（reminder_enabled, reminder_time）
- カードステータス管理（active / archived）

**Phase 9.5（カード管理強化＆ニックネーム機能）**:
- ニックネーム機能（User.display_name）
- カード重複防止（完全一致＆類似度チェック）
- カード作成上限（50枚）
- タイトル正規化（前後空白削除）
- 公開設定細分化（`is_public_for_cheers`, `is_public_for_template`）
- 類似公開カード重複排除（90%類似度でグループ化）
- Firebase Admin SDK設定（マイグレーション用）
- `useUserProfile` フック（ニックネーム管理）
- `useUserDisplayName` フック（他ユーザー名取得）
- `cardDuplicateChecker` ユーティリティ（重複検出）

### 9.2 改善提案

**型定義の改善**:
- `MatchingPool` 型に `category_l3_name_ja` フィールドがない（実装では使用している箇所あり）
- `CheerSendState` の `reason` フィールドに `'manual'` が含まれていない

**コードの整理**:
- `app/today-cheers.tsx` の用途が不明（削除候補？）
- 一部のコンポーネントで型定義が `@ts-ignore` で回避されている

**セキュリティ**:
- `reactions` の `create` 許可が緩い（`from_uid="system"` をクライアントから偽装可能）
  → Cloud Functionsからの書き込みであることを検証する仕組みが必要（Admin SDKのみ許可）

**パフォーマンス**:
- `sendReminders` 関数で全カードをスキャンしている（将来的にインデックス最適化が必要）

### 9.3 不明点

1. **AIエール文言の68種類の内容**: `functions/src/services/cheerService.ts` の実装詳細が未読のため、文言リストを確認できず
2. **マッチングプール更新ロジックの詳細**: `functions/src/services/updateMatchingPools.ts` が未読のため、正確なフィルタリング条件を確認できず
3. **`today-cheers.tsx` の用途**: このファイルの役割が不明（削除予定？）
4. **ユーザー統計の更新タイミング**: `users.stats` の `cheers_received`, `cheers_sent` がいつ更新されるか不明（トリガーが見当たらない）

---

## 10. 追加調査が必要なファイル

以下のファイルを詳細に読めば、さらに正確なレポートが作成できます：

- `functions/src/services/cheerService.ts` - AIエール文言選択ロジック
- `functions/src/services/updateMatchingPools.ts` - マッチングプール更新の詳細
- `functions/src/services/humanCheerService.ts` - 人間エール送信時の処理
- `src/hooks/useCheerSuggestions.ts` - エール提案取得のフロントエンド実装
- `src/hooks/useReactions.ts` - リアクション取得のリアルタイム購読

---

## 11. まとめ

本アプリは、Phase 7でAIエール機能、Phase 8で人間エール機能、Phase 9でUX改善とアーカイブ機能を実装し、習慣継続×軽量SNSアプリとして完成しています。

**コアコンセプト「繋がりすぎない繋がり」を実現する主要機能**:
- テキストコミュニケーション完全排除（リアクションのみ）
- 匿名性の維持（「{カテゴリ名}の仲間」として表示）
- アプリ主導のマッチング（ユーザーは選ぶだけ）
- AIと人間エールの自然な混在

**技術スタック**:
- React Native + Expo（クロスプラットフォーム）
- Firebase（Auth, Firestore, Functions, FCM）
- Cloud Scheduler（定期実行）

**次のステップ**:
このレポートと「設計意図ドキュメント」を統合し、Phase 7〜9の内容を反映した仕様書を作成してください。
