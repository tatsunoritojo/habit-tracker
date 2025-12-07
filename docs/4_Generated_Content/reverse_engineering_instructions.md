# リバースエンジニアリング指示書：仕様書更新のためのコード解析

## 基本情報

| 項目 | 内容 |
|------|------|
| ドキュメント種別 | エンジニア向け指示書 |
| 作成日 | 2025年12月7日 |
| 作成者 | プロジェクトマネージャー |
| 目的 | 現在のコードベースから実装現状を抽出し、仕様書更新に必要な情報を整理する |

---

## 1. 背景と目的

### 1.1 現状の課題

現在の仕様書（`mvp_specification.md`, `project_proposal.md`, `screen_design.md`, `README.md`）は**Phase 6完了時点**の内容で止まっています。

Phase 7〜9で実装された以下の機能が仕様書に反映されていません：

| Phase | 実装内容 |
|-------|----------|
| Phase 7 | AIエール機能（専属ボット、4パターンのエール送信） |
| Phase 8 | 人間エール機能（マッチング、エール提案画面） |
| Phase 9 | カード追加UX改善、アーカイブ、オンボーディング、バッジ等 |

### 1.2 作業の目的

ローカルのコードベースを解析し、**実装の現状**を正確に把握することで、仕様書との差分を特定し、最新の仕様書を作成する。

---

## 2. 抽出してほしい情報

### 2.1 データモデル（Firestoreコレクション構造）

以下のコレクションの**現在のフィールド構成**を抽出してください。

| コレクション | 確認ポイント |
|--------------|--------------|
| `users` | 全フィールド、特に `settings` の内容、`onboarding_completed` の有無 |
| `cards` | 全フィールド、特に `status`, `is_custom`, `reminder_*` 関連 |
| `logs` | 全フィールド |
| `categories` | 全フィールド |
| `card_templates` | 全フィールド |
| `matching_pools` | 構造全体（Phase 8で追加） |
| `reactions` | 全フィールド、特に `reason`, `message`, `from_uid` の使い分け |
| `cheer_send_state` | 構造全体（Phase 8で追加） |
| `pending_cheers` | 構造全体（Phase 7で追加、AIエール用） |

**出力形式例：**
```typescript
// users/{uid}
interface User {
  uid: string;
  created_at: Timestamp;
  last_login_at: Timestamp;
  onboarding_completed: boolean;
  settings: {
    cheer_frequency: 'high' | 'medium' | 'low' | 'off';
    push_enabled: boolean;
    timezone: string;
    notification_mode: 'realtime' | 'batch';
    // ...
  };
  stats: {
    // ...
  };
}
```

### 2.2 画面一覧と遷移フロー

**抽出対象ディレクトリ：** `app/` 配下

| 抽出項目 | 内容 |
|----------|------|
| 画面ファイル一覧 | `.tsx` ファイルの一覧と、各画面の役割 |
| 画面遷移 | `router.push()`, `router.replace()` の呼び出し箇所 |
| タブ構成 | `(tabs)` 配下の構成 |
| 動的ルート | `[id].tsx` 等のパラメータを受け取る画面 |

**出力形式例：**
```
app/
├── index.tsx           → スプラッシュ画面（初回起動判定）
├── onboarding.tsx      → オンボーディング（3画面スワイプ）
├── add-card.tsx        → カテゴリ選択（L1）
├── select-card.tsx     → サブカテゴリ・テンプレート選択
├── create-custom-card.tsx → オリジナルカード作成
├── (tabs)/
│   ├── home.tsx        → ホーム画面（カード一覧）
│   ├── cheers.tsx      → エール提案画面（S06）
│   ├── notifications.tsx → 通知一覧（S07）
│   └── settings.tsx    → 設定画面（S08）
├── card-detail/
│   └── [id].tsx        → カード詳細画面（S05）
├── edit-card.tsx       → カード編集
├── archive.tsx         → アーカイブ一覧
└── ...
```

### 2.3 Cloud Functions一覧

**抽出対象ディレクトリ：** `functions/` 配下

| 抽出項目 | 内容 |
|----------|------|
| 関数名 | `exports.functionName` |
| トリガー種別 | Firestore onCreate/onDelete, Cloud Scheduler, HTTP等 |
| 処理概要 | 各関数が何をしているか |

**出力形式例：**
```
| 関数名 | トリガー | 処理概要 |
|--------|----------|----------|
| onLogCreated | Firestore onCreate (logs) | ストリーク計算、AIエールスケジュール |
| sendDelayedCheer | Cloud Scheduler | 遅延エールの送信 |
| updateMatchingPools | Cloud Scheduler (30分ごと) | マッチングプール更新 |
| onHumanCheerSent | Firestore onCreate (reactions) | 人間エール送信時のFCM通知 |
| onCardDeleted | Firestore onDelete (cards) | カスケード削除（ログ、リアクション） |
| onUserDeleted | Firestore onDelete (users) | 全関連データクリーンアップ |
| sendReminders | Cloud Scheduler (15分ごと) | リマインダー通知送信 |
```

### 2.4 主要なビジネスロジック

**抽出対象ディレクトリ：** `src/services/`, `src/utils/`, `src/hooks/`

| ロジック | 確認ポイント |
|----------|--------------|
| ストリーク計算 | 現在のストリーク、最長ストリークの計算方法 |
| マッチングロジック | エール候補の選定基準、除外条件 |
| 送信制限 | 1日の上限、同一ペアの制限 |
| バッジ付与 | 条件と種類 |
| AIエール文言 | パターン数、選択ロジック |

### 2.5 外部依存

**抽出対象ファイル：** `package.json`, `app.json`

| 抽出項目 | 内容 |
|----------|------|
| 主要な npm packages | 名前とバージョン |
| Firebase設定 | 使用しているサービス（Auth, Firestore, Functions, FCM等） |
| Expo設定 | SDK バージョン、プラグイン |

### 2.6 コンポーネント一覧

**抽出対象ディレクトリ：** `src/components/`

| 抽出項目 | 内容 |
|----------|------|
| 共通コンポーネント | 名前と用途 |
| ダイアログ・モーダル | 削除確認、アーカイブ確認等 |

---

## 3. 出力フォーマット

以下の形式で「実装現状レポート」を作成してください。

```markdown
# 実装現状レポート

## 1. データモデル
（Firestoreコレクション構造をTypeScript interface形式で記載）

## 2. 画面一覧
（ファイル構成と各画面の役割）

## 3. 画面遷移図
（主要な遷移フローをASCII図またはリスト形式で記載）

## 4. Cloud Functions
（関数一覧表）

## 5. ビジネスロジック
（主要なロジックの概要）

## 6. コンポーネント
（共通コンポーネント一覧）

## 7. 外部依存
（package.json, app.jsonから抽出）

## 8. セキュリティルール
（firestore.rules の内容）

## 9. 特記事項
（実装中に気づいた仕様書との乖離、改善提案等）
```

---

## 4. 参考情報

### 4.1 Phase 7-9 完了レポートのサマリー

エンジニアから提出された完了レポートの主要ポイント：

**Phase 7（AIエール）：**
- 4パターンのエール送信（記録直後、翌日、長期離脱、ランダム）
- 68種類のエール文言
- 1日3件上限
- お休みモード対応

**Phase 8（人間エール）：**
- マッチングプール（カテゴリL3単位、30分更新）
- エール提案画面（S06）
- 送信制限（1日10件、同一ペア24時間に1回）
- アンドゥ機能

**Phase 9（アプリ完成）：**
- カード追加UX（3ステップ選択、オリジナルカード作成）
- アーカイブ機能
- オンボーディング（3画面）
- バッジ（5種類）
- Welcome Back演出
- アカウント削除

### 4.2 設計意図ドキュメント

別途作成した「設計意図・経緯ドキュメント」を参照してください。

このドキュメントには、各機能の「なぜそう設計したか」が記載されています。コードを読む際の参考にしてください。

---

## 5. 作業の進め方

### 5.1 推奨順序

1. `package.json`, `app.json` から外部依存を確認
2. `app/` 配下の画面構成を把握
3. `src/types/` からデータモデルの型定義を抽出
4. `functions/` からCloud Functions一覧を作成
5. `src/services/`, `src/utils/` からビジネスロジックを確認
6. `firestore.rules` からセキュリティルールを確認

### 5.2 注意点

- **型定義ファイルを優先的に確認**：`src/types/index.ts` 等に定義があるはず
- **コメントも記録**：意図が書かれている場合は転記
- **不明点は「？」で記録**：後でPMと確認

---

## 6. 成果物の提出

作成した「実装現状レポート」を提出してください。

PMがこのレポートと「設計意図ドキュメント」を統合し、最終的な仕様書を更新します。

---

## 改訂履歴

| バージョン | 日付 | 変更内容 |
|------------|------|----------|
| 1.0 | 2025-12-07 | 初版作成 |
