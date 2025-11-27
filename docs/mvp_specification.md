# MVP仕様書：習慣継続×軽量SNSアプリ

## 基本情報

| 項目 | 内容 |
|------|------|
| ドキュメント種別 | MVP仕様書 |
| バージョン | 0.2 |
| 作成日 | 2025年11月26日 |
| 最終更新 | 2025年11月26日 |
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
| カード作成（カスタム） | ❌ | ✅ |
| 1タップ記録 | ✅ | - |
| カレンダー振り返り | ✅ | ヒートマップ追加 |
| 公開/非公開設定 | ✅ | - |
| カテゴリベースマッチング | ✅ | アルゴリズム精緻化 |
| リアクション送受信 | ✅ | バリエーション追加 |
| 匿名認証 | ✅ | アカウント昇格 |
| プッシュ通知 | ✅ | - |
| エール頻度設定（手動） | ✅ | 自動調整 |
| ユーザー作成カード共有 | ❌ | ✅ |
| 掲示板機能 | ❌ | 検討 |

---

## 2. 技術スタック

| レイヤー | 技術 | 備考 |
|----------|------|------|
| フロントエンド | React Native + Expo (TypeScript) | Android優先 |
| 認証 | Firebase Anonymous Auth | 匿名認証 |
| データベース | Cloud Firestore | NoSQL、リアルタイム同期 |
| サーバーロジック | Cloud Functions | マッチングバッチ等 |
| プッシュ通知 | Firebase Cloud Messaging | |
| カレンダーUI | react-native-calendars | |

---

## 3. データモデル

### 3.1 コレクション一覧

| コレクション | 説明 |
|--------------|------|
| users | ユーザー情報 |
| cards | 習慣カード |
| logs | 達成ログ |
| categories | カテゴリマスタ |
| card_templates | カードテンプレート |
| matching_pools | マッチングプール |
| reactions | リアクション（エール） |

### 3.2 users

```javascript
users/{uid}
{
  uid: string,                    // Firebase Auth UID
  created_at: timestamp,
  last_login_at: timestamp,
  settings: {
    cheer_frequency: string,      // "high" | "medium" | "low" | "off"
    push_enabled: boolean,
    timezone: string              // "Asia/Tokyo"
  },
  stats: {
    total_cards: number,
    total_logs: number,
    current_streak_max: number,
    cheers_received: number,
    cheers_sent: number
  }
}
```

### 3.3 cards

```javascript
cards/{cardId}
{
  card_id: string,
  owner_uid: string,
  
  // カテゴリ（3階層）
  category_l1: string,            // 例: "health"
  category_l2: string,            // 例: "exercise"
  category_l3: string,            // 例: "muscle_training"
  
  // カード情報
  title: string,
  template_id: string,
  is_custom: boolean,             // MVP: 常にfalse
  
  // 公開設定
  is_public: boolean,
  
  // 統計（非正規化）
  current_streak: number,
  longest_streak: number,
  total_logs: number,
  last_log_date: string,          // "YYYY-MM-DD"
  
  created_at: timestamp,
  updated_at: timestamp
}
```

### 3.4 logs

```javascript
logs/{logId}
{
  log_id: string,
  card_id: string,
  owner_uid: string,
  
  date: string,                   // "YYYY-MM-DD"
  logged_at: timestamp
}
```

### 3.5 categories

```javascript
categories/{categoryId}
{
  category_id: string,
  level: number,                  // 1 | 2 | 3
  parent_id: string | null,
  
  name_ja: string,
  name_en: string,
  icon: string,
  sort_order: number,
  is_active: boolean
}
```

### 3.6 card_templates

```javascript
card_templates/{templateId}
{
  template_id: string,
  
  category_l1: string,
  category_l2: string,
  category_l3: string,
  
  title_ja: string,
  title_en: string,
  description_ja: string | null,
  
  icon: string,
  sort_order: number,
  is_official: boolean,           // MVP: 常にtrue
  is_active: boolean,
  created_at: timestamp
}
```

### 3.7 matching_pools

```javascript
matching_pools/{categoryL3Id}
{
  category_l3: string,
  
  active_cards: [
    {
      card_id: string,
      owner_uid: string,
      current_streak: number,
      last_log_date: string
    }
  ],
  
  updated_at: timestamp
}
```

### 3.8 reactions

```javascript
reactions/{reactionId}
{
  reaction_id: string,
  
  from_uid: string,
  to_uid: string,
  to_card_id: string,
  
  type: string,                   // "cheer" | "amazing" | "support"
  
  created_at: timestamp,
  is_read: boolean
}
```

---

## 4. カテゴリ構造（MVP初期）

### 4.1 L1カテゴリ

| ID | 名称（日本語） | 名称（英語） |
|----|----------------|--------------|
| health | 健康 | Health |
| learning | 学習 | Learning |
| lifestyle | 生活習慣 | Lifestyle |
| creative | 創作 | Creative |
| mindfulness | マインドフルネス | Mindfulness |

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

### 5.1 MVP採用（3種）

| type | 表示名 | アイコン | 意味・使う場面 |
|------|--------|----------|----------------|
| cheer | ナイス継続 | 💪 | 継続そのものへの励まし。基礎リアクション。 |
| amazing | すごい！ | ⭐ | 節目・成長へのお祝い。ハイライト時に。 |
| support | 一緒にがんばろ | 🤝 | 伴走感・仲間感。同じカテゴリで頑張っている共感。 |

### 5.2 将来追加候補

| type | 表示名 | アイコン | 備考 |
|------|--------|----------|------|
| spark | いい刺激！ | 🔥 | 継続安定ユーザー向けに解放検討。競争要素は慎重に。 |

### 5.3 設計根拠

- **3種に絞った理由**: 認知負荷を下げ「迷わず選べる」ことを優先
- **respect（尊敬）不採用**: 日常の小さな習慣には重すぎる
- **compete（負けないぞ）不採用**: 攻撃的に受け取られるリスク、完璧主義ユーザーへのプレッシャー懸念

---

## 6. 画面一覧（MVP）

### 6.1 画面構成

| 画面ID | 画面名 | 説明 |
|--------|--------|------|
| S01 | スプラッシュ | 起動画面 |
| S02 | オンボーディング | 初回起動時の説明（2〜3画面） |
| S03 | ホーム | カード一覧、今日の記録状況 |
| S04 | カード追加 | テンプレートからカードを選択 |
| S05 | カード詳細 | カレンダー表示、統計 |
| S06 | エール提案 | 他ユーザーの記録を見てリアクション |
| S07 | 通知一覧 | 受け取ったエール一覧 |
| S08 | 設定 | エール頻度、通知設定 |

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
| おかえり演出 | 3日以上空いて記録時に「おかえり、○日ぶりに再開！」+ アニメーション |
| 復活ストリーク | 再開後の連続日数を別カウント（将来検討） |

### 6.3 画面遷移（概要）

```
[スプラッシュ S01]
    ↓
[オンボーディング S02]（初回のみ）
    ↓
[ホーム S03] ←──────────────────┐
    │                           │
    ├─→ [カード追加 S04] ───────┤
    │                           │
    ├─→ [カード詳細 S05] ───────┤
    │                           │
    ├─→ [エール提案 S06] ───────┤
    │                           │
    ├─→ [通知一覧 S07] ─────────┤
    │                           │
    └─→ [設定 S08] ─────────────┘
```

---

## 7. 主要機能フロー

### 7.1 初回起動フロー

```
1. アプリ起動
2. Firebase Anonymous Auth で匿名UID発行
3. users ドキュメント作成
4. オンボーディング表示
5. 最初のカード作成を促す
6. ホーム画面へ
```

### 7.2 習慣記録フロー

```
1. ホーム画面でカードをタップ
2. 確認ダイアログ（省略可オプション）
3. logs にレコード作成
4. cards の統計更新（current_streak, last_log_date等）
5. UI更新（チェックマーク表示、アニメーション）
6. 公開カードの場合、matching_pool更新対象に
```

### 7.3 エール送信フロー

```
1. ログイン時（または一定間隔で）エール提案をチェック
2. cheer_frequency設定に基づき提案判定（デフォルト: medium、1日1〜2回）
3. matching_pool から同カテゴリのアクティブカードを取得
4. エール提案画面表示（他ユーザーの記録サマリー）
   - カード内に3つのリアクションボタン横並び表示
   - 表示: 💪継続 / ⭐すごい / 🤝一緒に
5. リアクション選択（3種から1つ、1タップで送信）
6. 即時アニメーション + スナックバー型アンドゥ表示
   - 「💪 ナイス継続 を送信しました [取り消す]」
   - 2〜3秒以内に取り消し可能
7. reactions にレコード作成
8. 相手にプッシュ通知送信（1日2〜3件上限）
```

### 7.3.1 エール送信制限

- 同一ペア（from_uid → to_card_id）は1日1エールまで
- 送信済みボタンはグレーアウト（連打防止）

### 7.4 エール受信フロー

```
1. reactions に新規レコード作成（from_uid → to_uid）
2. FCM でプッシュ通知送信
3. 受信者がアプリを開く
4. 通知一覧画面 or ホーム画面でエール表示
5. is_read を true に更新
```

---

## 8. マッチングロジック

### 8.1 概要

- **方式**: バッチ処理（Cloud Scheduler + Cloud Functions）
- **頻度**: 30分ごと
- **単位**: カテゴリL3（最下層）

### 8.2 バッチ処理フロー

```
1. Cloud Scheduler がトリガー（30分ごと）
2. Cloud Functions 起動
3. 全カテゴリL3に対してループ:
   a. cards から該当カテゴリ + is_public=true を取得
   b. 直近7日以内に last_log_date があるものをフィルタ
   c. ランダムシャッフル
   d. matching_pools/{categoryL3} に保存
4. 完了
```

### 8.3 エール対象選択ロジック

```
1. ユーザーの公開カードからカテゴリL3を取得
2. matching_pools/{categoryL3} から候補リスト取得
3. 自分自身を除外
4. 過去24時間以内にエール済みのユーザーを除外
5. 上位N件（例: 3件）を提案
```

---

## 9. 通知設計

### 9.1 通知種別

| 種別 | トリガー | 内容 |
|------|----------|------|
| エール受信 | reactions作成時 | 「〇〇カテゴリの仲間からエールが届きました」 |
| リマインダー | 設定時刻 | 「今日の〇〇、1タップで記録できます」 |
| 継続祝い | streak達成時 | 「7日間で5日達成！すごい！」 |

### 9.2 MVP対象

| 種別 | MVP | 備考 |
|------|-----|------|
| エール受信 | ✅ | 1日2〜3件上限 |
| リマインダー | ✅ | 1日1回、ユーザー設定時刻 |
| 継続祝い | ❌ | 将来追加 |

### 9.3 通知文言ガイドライン

#### 9.3.1 NGワード（使用禁止）

- 「まだ」「サボり」「やっていません」など罪悪感を喚起する表現
- 「〜しなさい」「〜すべき」など命令形
- 「ストリークが失われます」など脅迫的表現

#### 9.3.2 推奨トーン

- 優しく誘う：「〜してみませんか？」
- 選択を尊重：「1タップで記録できます」
- ポジティブ：「今日も一緒にがんばろう」

### 9.4 通知文言例

| シナリオ | 文言 |
|----------|------|
| リマインダー（通常） | 「今日の『毎朝ストレッチ』、1タップで記録できます」 |
| エール受信（通常） | 「『筋トレ』の仲間からエールが届きました 💪」 |
| エール受信（連続達成時） | 「7日連続『英語学習』、仲間から『すごい！』が届きました ⭐」 |
| エール受信（再開時） | 「また『読書』を再開したあなたに、仲間から『一緒にがんばろ』が届きました 🤝」 |

---

## 10. ゲーミフィケーション設計

### 10.1 設計方針

- **軽さ最優先**: Habiticaのような重いRPG化は避ける
- **競争より共走**: ランキング・比較要素は非採用
- **失敗を責めない**: 再開・復活を称える設計

### 10.2 MVP採用要素

#### 10.2.1 バッジ（3種）

| バッジ名 | 条件 | 意図 |
|----------|------|------|
| はじめの一歩 | 初めて3日達成 | スタートの称賛 |
| 1週間チャレンジ | 7日間で5日達成 | 完璧でなくてもOKという文化 |
| 復活の一歩 | 中断後に3日再開 | 再開を称える |

#### 10.2.2 ストリーク表示

| 表示場所 | 内容 |
|----------|------|
| ホーム（S03） | 「今週○日」「今月○日」をメイン表示 |
| カード詳細（S05） | 「現在の連続日数」「過去最長」をサブ表示 |

#### 10.2.3 エールカウント

- カード単位で「もらったエール累計」をバッジ表示
- 例：「エール 24」

### 10.3 非採用要素

| 要素 | 理由 |
|------|------|
| レベル/経験値 | 軽さを損なう、UIが重くなる |
| ランキング | 競争・比較を煽り、SNS疲れと相性悪い |
| 連続日数リセット強調 | 完璧主義を助長、離脱リスク |

---

## 11. オンボーディング設計

### 11.1 設計方針

- **「まず1つだけ」を強く推奨**: 複数習慣の同時立ち上げは失敗しやすい
- **「小さく始める」を促す**: テンプレートは「1分で終わる」レベルを推奨
- **初週でエール体験を完了**: 送受信両方を体験させる

### 11.2 Day 0（インストール〜初回起動）

```
1. スプラッシュ表示
2. オンボーディング画面（2〜3枚）
   - 「1タップで記録」
   - 「テキストなしのエール」
   - 「繋がりすぎない繋がり」
3. 匿名アカウント発行（裏で自動処理）
4. カード作成画面へ誘導
   - 「まずは1つだけ、小さく始めましょう」
   - 「慣れてきたら、2つ目を追加できます」
5. テンプレート選択
   - 「1分で終わる習慣」タグを優先表示
6. カード作成完了 → お試しタップを促す
7. ホーム画面へ
```

### 11.3 1週間の体験設計

| Day | 体験 | アプリの働きかけ |
|-----|------|------------------|
| 0 | 初回起動、1カード作成、お試しタップ | 「まず1つだけ」を強調 |
| 1-2 | リマインダー受信、記録継続 | 初回エール受信体験（マッチング優先度UP） |
| 3-4 | エール送信体験 | ホームにバナー「仲間にエールを送ってみませんか？」 |
| 5-6 | 途中経過の振り返り | 「この1週間で○日タップしました」表示 |
| 7 | 1週間の節目 | 演出 + 2枚目カード提案（任意） |

### 11.4 初回エール体験の優先配信

- 新規ユーザーのカードが公開設定の場合、マッチングバッチで優先度を上げる
- Day 1-2 で最低1件のエール受信を目指す

---

## 12. セキュリティ

### 12.1 Firestore セキュリティルール

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
      allow read, write: if request.auth != null && resource.data.owner_uid == request.auth.uid;
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
    }
    
    // reactions: 送信者は作成、受信者は読み取り・更新
    match /reactions/{reactionId} {
      allow create: if request.auth != null && request.resource.data.from_uid == request.auth.uid;
      allow read, update: if request.auth != null && resource.data.to_uid == request.auth.uid;
    }
  }
}
```

### 12.2 プライバシー対応

| 項目 | 対応 |
|------|------|
| 匿名認証 | Firebase Anonymous Auth |
| 取得情報 | UID、行動ログのみ（氏名・メール不要） |
| データ削除 | 設定画面から「アカウント削除」可能 |
| プライバシーポリシー | リリース前に作成・公開 |

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

| 項目 | ステータス | 担当 |
|------|------------|------|
| Google Play Developerアカウント | 未取得 | PO |
| Firebase プロジェクト作成 | 未着手 | 開発 |
| プライバシーポリシー作成 | 未着手 | PM |
| ストア掲載情報準備 | 未着手 | PM/デザイナー |

### 14.2 リリースチェックリスト

- [ ] 全画面の実装完了
- [ ] Firestore セキュリティルール適用
- [ ] プッシュ通知動作確認
- [ ] オフライン動作確認
- [ ] プライバシーポリシー公開
- [ ] ストア掲載情報入力
- [ ] 内部テスト配布
- [ ] クラッシュ・バグ修正
- [ ] 本番リリース

---

## 改訂履歴

| バージョン | 日付 | 変更内容 |
|------------|------|----------|
| 0.1 | 2025-11-26 | 初版作成 |
| 0.2 | 2025-11-26 | UXデザイナー・行動心理学アドバイザーのレポートを反映。リアクション設計、カレンダー表示、オンボーディング、ゲーミフィケーション、通知設計を追加・更新 |
