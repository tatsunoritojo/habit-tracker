# MVP仕様書：習慣継続×軽量SNSアプリ

## 基本情報

| 項目 | 内容 |
|------|------|
| ドキュメント種別 | MVP仕様書 |
| バージョン | 1.0 |
| 作成日 | 2025年11月26日 |
| 最終更新 | 2025年12月7日 |
| 作成者 | プロジェクトマネージャー |

---

## 1. MVP概要

### 1.1 MVPの目的

- コアコンセプト「繋がりすぎない繋がり」の検証
- 1タップ記録 + 軽量ソーシャルの組み合わせがユーザーに受け入れられるか確認
- クローズドβで仲間内からフィードバックを収集

### 1.2 MVPスコープ

| 機能 | MVP | 将来 |
|------|-----|------|
| カード作成（テンプレート） | ✅ | - |
| カード作成（オリジナル） | ✅ | 共有機能追加 |
| 1タップ記録 | ✅ | - |
| カレンダー振り返り | ✅ | ヒートマップ追加 |
| 公開/非公開設定 | ✅ | - |
| カテゴリベースマッチング | ✅ | アルゴリズム精緻化 |
| AIエール送受信 | ✅ | 文言追加 |
| 人間エール送受信 | ✅ | バリエーション追加 |
| 匿名認証 | ✅ | アカウント昇格 |
| プッシュ通知 | ✅ | - |
| エール頻度設定（手動） | ✅ | 自動調整 |
| リマインダー通知 | ✅ | - |
| バッジ機能 | ✅ | 種類追加 |
| アーカイブ機能 | ✅ | - |
| オンボーディング | ✅ | - |
| ユーザー作成カード共有 | ❌ | ✅ |
| 掲示板機能 | ❌ | 検討 |

---

## 2. 技術スタック

| レイヤー | 技術 | バージョン | 備考 |
|----------|------|------------|------|
| フロントエンド | React Native + Expo | 54.0.25 | Android優先 |
| ルーティング | Expo Router | 6.0.15 | ファイルベース |
| 言語 | TypeScript | 5.9.2 | |
| 認証 | Firebase Anonymous Auth | 12.6.0 | 匿名認証 |
| データベース | Cloud Firestore | 12.6.0 | NoSQL、リアルタイム同期 |
| サーバーロジック | Cloud Functions | - | マッチング、エール送信等 |
| プッシュ通知 | Firebase Cloud Messaging | - | |
| ローカルストレージ | AsyncStorage | 2.2.0 | 認証状態永続化 |

---

## 3. データモデル

### 3.1 コレクション一覧

| コレクション | 説明 | 追加Phase |
|--------------|------|-----------|
| users | ユーザー情報 | - |
| cards | 習慣カード | - |
| logs | 達成ログ | - |
| categories | カテゴリマスタ | - |
| card_templates | カードテンプレート | - |
| matching_pools | マッチングプール | Phase 8 |
| reactions | リアクション（エール） | Phase 7で拡張 |
| cheer_state | AIエール状態管理 | Phase 7 |
| cheer_send_state | 人間エール送信制限 | Phase 8 |

### 3.2 users

```typescript
users/{uid}
{
  uid: string;                      // Firebase Auth UID
  created_at: Timestamp;
  last_login_at: Timestamp;
  
  settings: {
    cheer_frequency: 'high' | 'medium' | 'low' | 'off';
    push_enabled: boolean;
    timezone: string;               // "Asia/Tokyo"
    
    // Phase 7: エール通知設定
    notification_mode: 'realtime' | 'batch';
    batch_times: string[];          // ["12:00", "18:00", "22:00"]
    quiet_hours_enabled: boolean;   // デフォルト: true
    quiet_hours_start: string;      // デフォルト: "23:00"
    quiet_hours_end: string;        // デフォルト: "07:00"
    
    fcm_token?: string | null;
  };
  
  stats: {
    total_cards: number;
    total_logs: number;
    current_streak_max: number;
    cheers_received: number;        // 未実装（Phase 10以降）
    cheers_sent: number;            // 未実装（Phase 10以降）
  };
}
```

### 3.3 cards

```typescript
cards/{cardId}
{
  card_id: string;
  owner_uid: string;
  
  // カテゴリ（3階層）
  category_l1: string;              // 例: "health"
  category_l2: string;              // 例: "exercise"
  category_l3: string;              // 例: "muscle_training"
  
  // カード情報
  title: string;
  template_id: string | null;       // オリジナルの場合はnull
  is_custom: boolean;               // オリジナルカード判定
  
  // 公開設定
  is_public: boolean;
  
  // 統計（非正規化）
  current_streak: number;
  longest_streak: number;
  total_logs: number;
  last_log_date: string;            // "YYYY-MM-DD"
  
  // Phase 9: ステータス管理
  status: 'active' | 'archived';
  archived_at?: Timestamp | null;
  
  // Phase 9: リマインダー設定
  reminder_enabled?: boolean;
  reminder_time?: string | null;    // "HH:mm"
  
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### 3.4 logs

```typescript
logs/{logId}
{
  log_id: string;
  card_id: string;
  owner_uid: string;
  
  date: string;                     // "YYYY-MM-DD"
  logged_at: Timestamp;
}
```

### 3.5 categories

```typescript
categories/{categoryId}
{
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

### 3.6 card_templates

```typescript
card_templates/{templateId}
{
  template_id: string;
  
  category_l1: string;
  category_l2: string;
  category_l3: string;
  
  title_ja: string;
  title_en: string;
  description_ja: string | null;
  
  icon: string;
  sort_order: number;
  is_official: boolean;             // MVP: 常にtrue
  is_active: boolean;
  created_at: Timestamp;
}
```

### 3.7 matching_pools（Phase 8追加）

```typescript
matching_pools/{categoryL3Id}
{
  category_l3: string;
  category_l3_name_ja: string;
  
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
  is_comeback?: boolean;            // 直近2ログの差分≧4日
}
```

### 3.8 reactions（Phase 7/8で拡張）

```typescript
reactions/{reactionId}
{
  reaction_id: string;
  
  from_uid: string;                 // "system" or ユーザーUID
  to_uid: string;
  to_card_id: string;
  
  type: 'cheer' | 'amazing' | 'support';
  
  // Phase 7: AIエール拡張
  reason?: 'record' | 'streak_break' | 'long_absence' | 'random';
  message?: string;                 // AIエール文言
  scheduled_for?: Timestamp | null;
  delivered?: boolean;
  
  // Phase 9: 非正規化（通知画面用）
  card_title?: string;
  card_category_name?: string;
  
  created_at: Timestamp;
  is_read: boolean;
}
```

### 3.9 cheer_state（Phase 7追加）

```typescript
cheer_state/{user_uid}
{
  user_uid: string;
  
  daily_count: number;
  daily_count_date: string;         // "YYYY-MM-DD"
  
  weekly_streak_break_count: number;
  weekly_streak_break_reset_date: string;
  
  last_random_cheer_at: Timestamp | null;
  
  long_absence_cheers: {
    [card_id: string]: {
      count: number;                // 最大3
      last_sent_at: Timestamp;
    };
  };
  
  primary_recording_hour: number | null;
  
  updated_at: Timestamp;
}
```

### 3.10 cheer_send_state（Phase 8追加）

```typescript
cheer_send_state/{user_uid}
{
  user_uid: string;
  daily_send_count: number;
  daily_send_date: string;          // "YYYY-MM-DD"
  sent_pairs: SentPair[];
  updated_at: Timestamp;
}

interface SentPair {
  to_card_id: string;
  sent_at: Timestamp;
}
```

---

## 4. カテゴリ構造（MVP初期）

### 4.1 L1カテゴリ

| ID | 名称（日本語） | 名称（英語） | アイコン |
|----|----------------|--------------|----------|
| health | 健康 | Health | 💪 |
| learning | 学習 | Learning | 📚 |
| lifestyle | 生活習慣 | Lifestyle | 🏠 |
| creative | 創作 | Creative | 🎨 |
| mindfulness | マインドフルネス | Mindfulness | 🧘 |

### 4.2 カテゴリ階層例

```
health（健康）
├── exercise（運動）
│   ├── muscle_training（筋トレ）
│   ├── running（ランニング）
│   ├── walking（ウォーキング）
│   ├── stretching（ストレッチ）
│   └── yoga（ヨガ）
├── diet（食事）
│   ├── healthy_eating（健康的な食事）
│   └── water_intake（水分摂取）
└── sleep（睡眠）
    ├── early_sleep（早寝）
    └── sleep_log（睡眠記録）

learning（学習）
├── language（語学）
│   ├── english（英語）
│   ├── chinese（中国語）
│   └── other_language（その他の言語）
├── reading（読書）
│   ├── book_reading（読書）
│   └── article_reading（記事読み）
└── skill（スキル）
    ├── programming（プログラミング）
    └── certification（資格勉強）

lifestyle（生活習慣）
├── morning（朝活）
│   ├── early_wake（早起き）
│   └── morning_routine（朝のルーティン）
├── organization（整理整頓）
│   ├── cleaning（掃除）
│   └── declutter（断捨離）
└── finance（お金）
    ├── saving（貯金）
    └── expense_log（支出記録）

creative（創作）
├── writing（執筆）
│   ├── journaling（日記）
│   └── blog_writing（ブログ）
├── art（アート）
│   ├── drawing（絵を描く）
│   └── photography（写真）
└── music（音楽）
    └── instrument_practice（楽器練習）

mindfulness（マインドフルネス）
├── meditation（瞑想）
│   └── daily_meditation（毎日の瞑想）
├── gratitude（感謝）
│   └── gratitude_log（感謝日記）
└── mental_health（メンタルヘルス）
    └── mood_log（気分記録）
```

---

## 5. リアクション種別

### 5.1 採用リアクション（3種）

| type | 表示名 | アイコン | 意味・使う場面 |
|------|--------|----------|----------------|
| cheer | ナイス継続 | 💪 | 継続そのものへの励まし。基礎リアクション。 |
| amazing | すごい！ | ⭐ | 節目・成長へのお祝い。ハイライト時に。 |
| support | 一緒にがんばろ | 🤝 | 伴走感・仲間感。同じカテゴリで頑張っている共感。 |

### 5.2 設計根拠

- **3種に絞った理由**: 認知負荷を下げ「迷わず選べる」ことを優先
- **respect（尊敬）不採用**: 日常の小さな習慣には重すぎる
- **compete（負けないぞ）不採用**: 攻撃的に受け取られるリスク、完璧主義ユーザーへのプレッシャー懸念

---

## 6. 画面一覧（MVP）

### 6.1 画面構成

| 画面ID | 画面名 | ファイル | 説明 |
|--------|--------|----------|------|
| S01 | スプラッシュ | app/index.tsx | 起動画面、初回判定 |
| S02 | オンボーディング | app/onboarding.tsx | 初回起動時の説明（3画面） |
| S03 | ホーム | app/(tabs)/home.tsx | カード一覧、今日の記録状況 |
| S04 | カード追加（L1選択） | app/add-card.tsx | カテゴリL1選択 |
| S04-2 | カード追加（L2/テンプレート） | app/select-card.tsx | サブカテゴリ・テンプレート選択 |
| S04-3 | オリジナルカード作成 | app/create-custom-card.tsx | カスタムカード作成 |
| S05 | カード詳細 | app/card-detail/[id].tsx | カレンダー表示、統計、バッジ |
| S05-2 | カード編集 | app/edit-card.tsx | タイトル・公開設定・リマインダー編集 |
| S06 | エール提案 | app/(tabs)/cheers.tsx | 他ユーザーへのエール送信 |
| S07 | 通知一覧 | app/(tabs)/notifications.tsx | 受け取ったエール一覧 |
| S08 | 設定 | app/(tabs)/settings.tsx | エール頻度、通知設定 |
| S08-2 | アカウント削除 | app/settings/account-deletion.tsx | 退会機能 |
| S09 | 今日のエール | app/today-cheers.tsx | まとめて通知タップ時の遷移先 |
| S10 | アーカイブ一覧 | app/archived-cards.tsx | アーカイブしたカードの管理 |

### 6.2 カレンダー・統計表示設計

#### 6.2.1 表示方針（行動心理学に基づく）

| 項目 | 設計 | 理由 |
|------|------|------|
| 達成日 | アクセントカラーで表示 | 達成を視覚的に強調 |
| 未達成日 | 無色 or 薄グレー | 「穴」を主張させない、失敗感を軽減 |
| メイン指標 | 「今週○日」「今月○日」 | 累積・増分指標で前向きに |
| ストリーク | カード詳細画面でサブ表示 | 途切れのダメージを軽減 |

#### 6.2.2 再開ケア

| 機能 | 内容 |
|------|------|
| おかえり演出 | 3日以上空いて記録時に「おかえり」モーダル + 紙吹雪アニメーション |
| 復活バッジ | 中断後に3日再開で「復活の一歩」バッジ獲得 |

### 6.3 画面遷移

```
[スプラッシュ S01]
    │
    ├─(初回)→ [オンボーディング S02] → [ホーム S03]
    │
    └─(2回目以降)→ [ホーム S03]
                      │
                      ├→ [カード詳細 S05]
                      │    └→ [カード編集 S05-2]
                      │         ├→ [削除ダイアログ]
                      │         └→ [アーカイブダイアログ]
                      │
                      ├→ [カード追加 S04]
                      │    └→ [L2/テンプレート選択 S04-2]
                      │         ├→ [確認ダイアログ] → [ホーム]
                      │         └→ [オリジナル作成 S04-3] → [ホーム]
                      │
                      ├→ [エール提案 S06] ← タブ
                      │
                      ├→ [通知一覧 S07] ← タブ
                      │    └→ [今日のエール S09]
                      │
                      ├→ [設定 S08] ← タブ
                      │    └→ [アカウント削除 S08-2]
                      │
                      └→ [アーカイブ一覧 S10]
                           └→ 復元 → [ホーム]
```

---

## 7. エール機能

### 7.1 AIエール（Phase 7）

#### 7.1.1 送信パターン

| パターン | reason | トリガー | 送信頻度 | タイミング |
|----------|--------|----------|----------|------------|
| ① 記録直後 | record | ログ作成時 | 記録ごと | 5〜45分後（ランダム） |
| ② 継続途切れ翌日 | streak_break | 毎朝9時バッチ | 週2回まで | 前日未記録のカード |
| ③ 長期離脱 | long_absence | 毎朝9時バッチ | カードごと3回まで | 7日/21日/35日離脱時 |
| ④ ランダム | random | 6時間ごと | 33%の確率 | アクティブユーザー対象 |

**1日の上限**: 3件（全パターン合計）

#### 7.1.2 リアクション種別選択の重み付け

| reason | cheer (💪) | amazing (⭐) | support (🤝) |
|--------|-----------|-------------|-------------|
| record | 65% | 20% | 15% |
| streak_break | 30% | 10% | 60% |
| long_absence | 15% | 5% | 80% |
| random | 33% | 33% | 34% |

**設計意図**:
- **record**: 継続を励ます「cheer」を多めに
- **streak_break**: 寄り添う「support」を多めに
- **long_absence**: さらに寄り添う「support」を圧倒的に多く
- **random**: 均等配分

#### 7.1.3 AIエール文言（67種類）

**パターン①: 記録直後 (record)**

| reactionType | 文言 |
|--------------|------|
| cheer (💪) | 今日もナイス継続 / いい流れきてます / その一歩すてき / 積み重ねが光ってる / ペース、いい感じ / 今日の一歩も上々 |
| amazing (⭐) | すごくいいペース / 今日もキレてる / 続け方がうまいね / いいリズム出てる / 流れつかんでるね / 伸び方がすてき |
| support (🤝) | 一緒にがんばってるよ / こっちも今やってる / 同じ空気で進んでる / 仲間も今やってるよ / 今日も並んで歩こう / となりで走ってる感 |

**パターン②: 継続途切れ翌日 (streak_break)**

| reactionType | 文言 |
|--------------|------|
| cheer (💪) | 今日からまた一歩どう？ / ゆっくり戻ってこよ / 今日の一歩からでOK / 思い出したら一歩だけ / できる日にやればOK / 軽く一歩踏み出そ |
| amazing (⭐) | またすごい日が来そう / 積み重ね直前って感じ / 次の一歩が楽しみ / ここからが面白いね / また伸びていきそう / 未来の自分が楽しみ |
| support (🤝) | 少し休んでOK また一緒に / ここからまた並走しよ / いつでも隣で歩けるよ / ペース戻すとき寄ってね / 今日は一緒にどう？ / また並んで進もうか |

**パターン③: 長期離脱 (long_absence)**

| reactionType | 文言 |
|--------------|------|
| cheer (💪) | 思い出したら一歩だけ / またいつでも再開OK / 久しぶりの一歩どう？ / 一歩目はいつでも軽く / 小さく再開してみよ / 気が向いたらタップだけ |
| amazing (⭐) | またすごい日が来そう（※1種類のみ） |
| support (🤝) | いつでもここで待ってる / また一緒に始めよ / 離れてても仲間だよ / 戻る場所はここだよ / 思い出したら会おう / ふらっと戻っておいで |

**パターン④: ランダム (random)**

| reactionType | 文言 |
|--------------|------|
| cheer (💪) | そのペースすごくいい / 積み重ねが効いてる / 日々の一歩が光ってる / マイペースが一番いい / 地味にすごいことしてる / 今日もいいリズムだね |
| amazing (⭐) | コツコツがすごい力に / 最近の記録とてもいい / やり方がほんと上手 / 積み重ねが尊敬レベル / その継続、普通にすごい / じわじわ伸びてるね |
| support (🤝) | 遠くで一緒にやってるよ / 同じカードの仲間です / みんなで少しずつ前へ / どこかで並走してます / 今日も仲間がそばにいる / 同じ方向向いてるよ |

#### 7.1.4 文言選択ロジック

1. 直近5件のAIエール文言を取得
2. 重複回避フィルタリング
3. 候補が0件なら全文言から選択
4. ランダムに1つ選択

### 7.2 人間エール（Phase 8）

#### 7.2.1 マッチングロジック

**処理フロー（30分ごと実行）**:

1. 全カテゴリL3を取得
2. 各カテゴリで以下を実行:
   - 公開カード取得 (`is_public=true`)
   - 7日以内に記録あり (`last_log_date >= 7日前`)
   - is_comeback判定 (直近2ログの差分≧4日)
   - シャッフル
   - 上位100件に制限
   - `matching_pools` に保存

**対象条件**:
- `category_l3` が一致
- `is_public == true`
- `last_log_date` が7日以内

**除外条件**:
- 非公開カード
- 記録が一度もない新規カード
- 非アクティブユーザー（7日以上記録なし）

**is_comeback判定**:
- 直近2件のログ差分が4日以上 → `true`

#### 7.2.2 送信制限

| 制限 | 値 |
|------|-----|
| 1日の送信上限 | 10件/ユーザー |
| 同一ペアへの送信 | 24時間に1回 |

#### 7.2.3 アンドゥ機能

- 送信直後3秒間、取り消し可能
- スナックバーで「取り消す」ボタン表示

---

## 8. 通知設計

### 8.1 通知種別

| 種別 | トリガー | 内容 |
|------|----------|------|
| エール受信（リアルタイム） | reactions作成時 | 「{カテゴリ}の仲間からエールが届きました」 |
| エール受信（まとめて） | 設定時刻 | 「今日○件のエールが届いています」 |
| リマインダー | 設定時刻（15分ごと確認） | 「今日の〇〇、1タップで記録できます」 |

### 8.2 通知モード

| モード | 説明 |
|--------|------|
| realtime | エール受信時に即座に通知 |
| batch | 設定時刻にまとめて通知（デフォルト: 12:00, 18:00, 22:00） |

### 8.3 お休みモード

| 設定 | デフォルト |
|------|------------|
| quiet_hours_enabled | true |
| quiet_hours_start | "23:00" |
| quiet_hours_end | "07:00" |

### 8.4 通知文言ガイドライン

**NGワード（使用禁止）**:
- 「まだ」「サボり」「やっていません」など罪悪感を喚起する表現
- 「〜しなさい」「〜すべき」など命令形
- 「ストリークが失われます」など脅迫的表現

**推奨トーン**:
- 優しく誘う：「〜してみませんか？」
- 選択を尊重：「1タップで記録できます」
- ポジティブ：「今日も一緒にがんばろう」

---

## 9. ゲーミフィケーション設計

### 9.1 設計方針

- **軽さ最優先**: Habiticaのような重いRPG化は避ける
- **競争より共走**: ランキング・比較要素は非採用
- **失敗を責めない**: 再開・復活を称える設計

### 9.2 バッジ（5種）

| バッジ名 | アイコン | 条件 | 意図 |
|----------|----------|------|------|
| 3日継続 | 🥉 | 連続3日達成 | スタートの称賛 |
| 7日継続 | 🥈 | 連続7日達成 | 1週間の節目 |
| 21日継続 | 🥇 | 連続21日達成 | 習慣化の達人 |
| 復活の一歩 | ❤️‍🔥 | 中断後に3日連続再開 | 再開を称える |
| 100回記録 | 💎 | 累計100回達成 | 長期継続の称賛 |

**復活の一歩の判定ロジック**:
- 現在のストリークが3日以上
- かつ全ログ数がストリークよりも多い（= 過去にギャップがあった）

### 9.3 非採用要素

| 要素 | 理由 |
|------|------|
| レベル/経験値 | 軽さを損なう、UIが重くなる |
| ランキング | 競争・比較を煽り、SNS疲れと相性悪い |
| 連続日数リセット強調 | 完璧主義を助長、離脱リスク |

---

## 10. オンボーディング設計

### 10.1 設計方針

- **「まず1つだけ」を強く推奨**: 複数習慣の同時立ち上げは失敗しやすい
- **「小さく始める」を促す**: テンプレートは「1分で終わる」レベルを推奨
- **初週でエール体験を完了**: 送受信両方を体験させる

### 10.2 オンボーディング画面（3画面）

| 画面 | タイトル | 内容 |
|------|----------|------|
| 1 | 小さな一歩 | 「1タップで記録」の説明 |
| 2 | 仲間からのエール | 「💪⭐🤝 文字を打たなくても気持ちは伝わる」 |
| 3 | さあ、始めましょう | 「同じ習慣を続ける仲間とゆるく繋がる」 |

### 10.3 初回起動判定

- AsyncStorageで `onboarding_completed` フラグを管理
- 未完了 → オンボーディング表示
- 完了済み → ホーム画面へ

---

## 11. Cloud Functions

### 11.1 関数一覧

| 関数名 | トリガー | 処理概要 |
|--------|----------|----------|
| onLogCreated | Firestore onCreate (logs) | ストリーク計算、AIエールスケジュール |
| sendDelayedCheer | Cloud Scheduler (1分ごと) | 遅延AIエールの配信 |
| checkStreakBreak | Cloud Scheduler (毎朝9時) | 継続途切れ・長期離脱エール送信 |
| sendRandomCheer | Cloud Scheduler (6時間ごと) | ランダムエール送信 |
| deliverBatchNotifications | Cloud Scheduler (毎時0分) | まとめて通知配信 |
| updateMatchingPools | Cloud Scheduler (30分ごと) | マッチングプール更新 |
| onHumanCheerSent | Firestore onCreate (reactions) | 人間エール送信時のFCM通知 |
| onCardDeleted | Firestore onDelete (cards) | カスケード削除（logs, reactions） |
| onUserDeleted | Auth onDelete | 全関連データクリーンアップ |
| sendReminders | Cloud Scheduler (15分ごと) | リマインダー通知送信 |

---

## 12. Firestoreセキュリティルール

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

    // matching_pools: 読み取りのみ
    match /matching_pools/{doc} {
      allow read: if request.auth != null;
      allow write: if false;  // Cloud Functionsのみ
    }

    // reactions: 送信者は作成、受信者は読み取り・更新
    match /reactions/{reactionId} {
      allow create: if request.auth != null &&
        (request.resource.data.from_uid == request.auth.uid || request.resource.data.from_uid == "system");
      allow read, update: if request.auth != null && resource.data.to_uid == request.auth.uid;
    }

    // cheer_state: Cloud Functionsのみ
    match /cheer_state/{docId} {
      allow read: if request.auth != null && docId == request.auth.uid;
      allow write: if false;
    }

    // cheer_send_state: 本人のみ
    match /cheer_send_state/{docId} {
      allow read, write: if request.auth != null && docId == request.auth.uid;
    }
  }
}
```

**セキュリティ懸念（Phase 10で対応予定）**:
- `reactions` の `create` で `from_uid="system"` をクライアントから偽装可能
- 対策: Cloud Functionsからの書き込みのみ許可する仕組みを導入

---

## 13. 非機能要件

### 13.1 パフォーマンス

| 項目 | 目標 |
|------|------|
| アプリ起動時間 | 3秒以内 |
| 記録操作レスポンス | 1秒以内（体感即時） |
| 画面遷移 | 0.5秒以内 |

### 13.2 可用性

| 項目 | 目標 |
|------|------|
| サービス稼働率 | 99%以上（Firebase SLA準拠） |
| オフライン対応 | 記録操作はオフラインでも可能 |

---

## 14. 開発・リリース準備

### 14.1 必要な準備

| 項目 | ステータス |
|------|------------|
| Google Play Developerアカウント | 未取得 |
| Firebase プロジェクト作成 | ✅ 完了 |
| プライバシーポリシー作成 | 未着手 |
| ストア掲載情報準備 | 未着手 |

### 14.2 リリースチェックリスト

- [x] 全画面の実装完了
- [x] Firestore セキュリティルール適用
- [x] プッシュ通知動作確認（※Expo Go制限あり）
- [ ] オフライン動作確認
- [ ] プライバシーポリシー公開
- [ ] ストア掲載情報入力
- [ ] 本番ビルド（EAS Build）
- [ ] 内部テスト配布
- [ ] クラッシュ・バグ修正
- [ ] 本番リリース

---

## 15. 未実装機能（Phase 10以降で検討）

| 機能 | 説明 | 優先度 |
|------|------|--------|
| users.stats更新 | cheers_received/sent のリアルタイム更新 | 中 |
| セキュリティ強化 | reactions.from_uid偽装防止 | 高 |
| パフォーマンス最適化 | sendReminders の全カードスキャン改善 | 低 |

---

## 改訂履歴

| バージョン | 日付 | 変更内容 |
|------------|------|----------|
| 0.1 | 2025-11-26 | 初版作成 |
| 0.2 | 2025-11-26 | UXデザイナー・行動心理学アドバイザーのレポートを反映 |
| 1.0 | 2025-12-07 | Phase 7〜9の実装内容を反映。データモデル拡張、AIエール機能、人間エール機能、オンボーディング、バッジ、アーカイブ機能を追加。Cloud Functions一覧を更新。 |
