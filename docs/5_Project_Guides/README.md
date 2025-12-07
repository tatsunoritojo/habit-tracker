# Habit Tracker

習慣トラッキングアプリ - React Native (Expo) + Firebase

---

## ⚠️ このドキュメントについて

**このREADMEは常に最新の状態を保つ必要があります。**

新機能の追加、設定の変更、依存関係の更新を行った際は、必ずこのファイルを更新してください。

**最終更新日**: 2025-12-07
**最終更新者**: プロジェクトマネージャー (Phase 9完了時点)

---

## 📋 目次

- [プロジェクト概要](#プロジェクト概要)
- [技術スタック](#技術スタック)
- [環境構築](#環境構築)
- [開発の始め方](#開発の始め方)
- [プロジェクト構造](#プロジェクト構造)
- [機能一覧](#機能一覧)
- [トラブルシューティング](#トラブルシューティング)
- [開発ワークフロー](#開発ワークフロー)

---

## プロジェクト概要

Habit Tracker は、「繋がりすぎない繋がり」をコンセプトにした習慣継続×軽量SNSアプリです。

テキストコミュニケーションを排除し、リアクション（エール）のみで仲間の存在を感じながら習慣を継続できます。

### 主な機能

**✅ 実装済み (Phase 1-9)**

**コア機能**
- **ユーザー認証**: Firebase 匿名認証によるユーザー管理
- **カード管理**:
  - テンプレートからカード作成（22種類）
  - オリジナルカード作成
  - 公開/非公開設定
  - カード編集（タイトル、リマインダー、公開設定）
  - アーカイブ機能
- **ログ記録**:
  - ワンタップで習慣の記録
  - リアルタイム同期
  - 記録日のカレンダー表示
- **統計**:
  - 現在のストリーク（連続日数）
  - 最長ストリーク
  - 今週・今月の達成日数

**エール機能（Phase 7-8）**
- **AIエール**: 4パターン、67種類の文言で自動応援
  - 記録直後（5〜45分後）
  - 継続途切れ翌日
  - 長期離脱時（7/21/35日）
  - ランダム（6時間ごと）
- **人間エール**: 同じ習慣の仲間と1タップでエール交換
  - マッチングプール（カテゴリL3単位、30分更新）
  - 3種類のリアクション（💪💪⭐🤝）
  - アンドゥ機能（3秒以内）
  - 送信制限（1日10件、同一ペア24時間に1回）

**UX改善（Phase 9）**
- **オンボーディング**: 3画面のスワイプ説明
- **Welcome Back演出**: 3日以上空いた場合に紙吹雪アニメーション
- **バッジシステム**: 5種類（🥉3日 / 🥈7日 / 🥇21日 / ❤️‍🔥復活 / 💎100回）
- **アカウント削除**: GDPR対応

**通知機能**
- リマインダー通知（15分ごと確認）
- エール受信通知（リアルタイム or まとめて）
- お休みモード（23:00-07:00）

**🔜 今後実装予定 (Phase 10)**

- セキュリティ強化（reactions.from_uid偽装防止）
- ユーザー統計のリアルタイム更新
- 本番ビルド・ストア申請

---

## 技術スタック

| カテゴリ | 技術 | バージョン |
|---------|------|-----------|
| Framework | Expo | 54.0.25 |
| Router | Expo Router | 6.0.15 |
| UI | React Native | 0.81.5 |
| UI Library | React | 19.1.0 |
| 言語 | TypeScript | 5.9.2 |
| Backend | Firebase | 12.6.0 |
| Storage | AsyncStorage | 2.2.0 |
| Notifications | expo-notifications | 0.32.13 |

---

## 環境構築

### 必要な環境

- **Node.js**: 20.19.4 以上
- **npm**: 最新版
- **Expo Go アプリ**: iOS/Android 実機にインストール

### セットアップ手順

#### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd habit-tracker
```

#### 2. 依存関係のインストール

```bash
npm install --legacy-peer-deps
```

> **注意**: `--legacy-peer-deps` フラグが必要です。React 19 と一部のパッケージの peer dependency の競合を回避するため。

#### 3. 環境変数の設定

`.env.example` をコピーして `.env` を作成：

```bash
cp .env.example .env
```

`.env` に Firebase の設定を記入：

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

> **重要**: `.env` ファイルは Git にコミットしないでください。

#### 4. Firebase プロジェクトの設定

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. Authentication で匿名認証を有効化
3. Firestore Database を作成
4. Cloud Functions をデプロイ
5. Web アプリを追加して、設定情報を `.env` に記入

---

## 開発の始め方

### 開発サーバーの起動

```bash
npx expo start --clear
```

`--clear` フラグでキャッシュをクリアして起動します。

### 実機での確認

1. iOS/Android 実機に Expo Go アプリをインストール
2. ターミナルに表示される QR コードをスキャン
3. アプリが起動します

### よく使うコマンド

```bash
# 開発サーバー起動
npm start

# Android エミュレータで起動
npm run android

# iOS シミュレータで起動（Mac のみ）
npm run ios

# Web ブラウザで起動
npm run web

# Firestore に初期データを投入
npm run seed:categories   # カテゴリデータ（50件）
npm run seed:templates    # テンプレートデータ（22件）

# Cloud Functions デプロイ
cd functions && npm run deploy
```

---

## プロジェクト構造

```
habit-tracker/
├── app/                          # Expo Router によるルーティング
│   ├── (tabs)/                   # タブナビゲーション
│   │   ├── _layout.tsx           # タブレイアウト
│   │   ├── home.tsx              # ホーム画面（カード一覧）
│   │   ├── cheers.tsx            # エール提案画面
│   │   ├── notifications.tsx     # 通知一覧
│   │   └── settings.tsx          # 設定画面
│   ├── card-detail/
│   │   └── [id].tsx              # カード詳細画面（動的ルート）
│   ├── settings/
│   │   └── account-deletion.tsx  # アカウント削除画面
│   ├── index.tsx                 # スプラッシュ画面
│   ├── onboarding.tsx            # オンボーディング
│   ├── add-card.tsx              # カード追加（L1選択）
│   ├── select-card.tsx           # カード追加（L2/テンプレート）
│   ├── create-custom-card.tsx    # オリジナルカード作成
│   ├── edit-card.tsx             # カード編集
│   ├── archived-cards.tsx        # アーカイブ一覧
│   ├── today-cheers.tsx          # 今日のエール
│   └── _layout.tsx               # ルートレイアウト
│
├── src/                          # ソースコード
│   ├── components/               # 再利用可能なコンポーネント
│   │   ├── Calendar.tsx          # カレンダー
│   │   ├── CategoryCard.tsx      # カテゴリカード
│   │   ├── DeleteCardDialog.tsx  # 削除確認ダイアログ
│   │   ├── ArchiveCardDialog.tsx # アーカイブダイアログ
│   │   ├── CreateCardConfirmDialog.tsx
│   │   └── WelcomeBackModal.tsx  # Welcome Back演出
│   ├── hooks/                    # カスタムフック
│   │   ├── useCards.ts           # カード一覧取得
│   │   ├── useCardLogs.ts        # カードログ取得
│   │   ├── useStats.ts           # 統計取得
│   │   ├── useTemplates.ts       # テンプレート取得
│   │   ├── useCheerSuggestions.ts # エール提案取得
│   │   └── useReactions.ts       # リアクション取得
│   ├── lib/
│   │   └── firebase.ts           # Firebase 設定・認証
│   ├── services/                 # ビジネスロジック
│   │   ├── logService.ts         # ログ記録・ストリーク計算
│   │   ├── statsService.ts       # 統計計算
│   │   └── cheerSendService.ts   # エール送信
│   ├── utils/
│   │   └── gamification.ts       # バッジ判定
│   └── types/
│       └── index.ts              # TypeScript型定義
│
├── functions/                    # Cloud Functions
│   └── src/
│       ├── index.ts              # エントリーポイント
│       └── services/
│           ├── cheerService.ts   # AIエール送信
│           ├── updateMatchingPools.ts
│           └── humanCheerService.ts
│
├── scripts/                      # データシード用スクリプト
│   ├── seedCategories.ts
│   └── seedTemplates.ts
│
├── docs/                         # ドキュメント
│   ├── mvp_specification.md      # MVP仕様書
│   ├── project_proposal.md       # プロジェクト企画書
│   ├── screen_design.md          # 画面設計書
│   ├── design_intent_document.md # 設計意図ドキュメント
│   └── implementation_status_report.md
│
├── .env                          # 環境変数（gitignore済み）
├── .env.example                  # 環境変数のテンプレート
├── app.json                      # Expo 設定
├── package.json                  # 依存関係
├── firestore.rules               # Firestoreセキュリティルール
└── tsconfig.json                 # TypeScript 設定
```

---

## 機能一覧

### 画面一覧

| 画面 | ファイル | 説明 |
|------|----------|------|
| スプラッシュ | app/index.tsx | 起動画面、初回判定 |
| オンボーディング | app/onboarding.tsx | 初回説明（3画面） |
| ホーム | app/(tabs)/home.tsx | カード一覧 |
| カード追加 | app/add-card.tsx | L1カテゴリ選択 |
| テンプレート選択 | app/select-card.tsx | L2/テンプレート選択 |
| オリジナル作成 | app/create-custom-card.tsx | カスタムカード |
| カード詳細 | app/card-detail/[id].tsx | カレンダー、統計 |
| カード編集 | app/edit-card.tsx | 編集、削除、アーカイブ |
| エール提案 | app/(tabs)/cheers.tsx | 人間エール送信 |
| 通知一覧 | app/(tabs)/notifications.tsx | エール受信 |
| 今日のエール | app/today-cheers.tsx | まとめて通知用 |
| 設定 | app/(tabs)/settings.tsx | 各種設定 |
| アカウント削除 | app/settings/account-deletion.tsx | 退会 |
| アーカイブ | app/archived-cards.tsx | アーカイブ管理 |

### Cloud Functions

| 関数 | トリガー | 説明 |
|------|----------|------|
| onLogCreated | Firestore onCreate | AIエールスケジュール |
| sendDelayedCheer | Scheduler (1分) | 遅延AIエール配信 |
| checkStreakBreak | Scheduler (9時) | 継続途切れ・長期離脱 |
| sendRandomCheer | Scheduler (6時間) | ランダムエール |
| updateMatchingPools | Scheduler (30分) | マッチングプール更新 |
| onHumanCheerSent | Firestore onCreate | 人間エール通知 |
| onCardDeleted | Firestore onDelete | カスケード削除 |
| onUserDeleted | Auth onDelete | ユーザーデータ削除 |
| sendReminders | Scheduler (15分) | リマインダー通知 |
| deliverBatchNotifications | Scheduler (毎時) | まとめて通知 |

---

## トラブルシューティング

### エラー: "Unable to resolve module"

**原因**: 依存関係が不足している

**解決策**:
```bash
rm -rf node_modules
npm install --legacy-peer-deps
npx expo start --clear
```

### エラー: "java.lang.String cannot be cast to java.lang.Boolean"

**原因**: Expo Go のキャッシュの問題

**解決策**:
1. 実機で Expo Go のアプリデータとキャッシュをクリア
2. PC 側で `npx expo start --clear` を実行

### Firebase の環境変数が読み込まれない

**原因**: `.env` ファイルが作成されていない、または環境変数名が間違っている

**解決策**:
- `.env.example` を参照して `.env` を作成
- 環境変数名は必ず `EXPO_PUBLIC_` プレフィックスが必要

### プッシュ通知が届かない

**原因**: Expo Go ではプッシュ通知に制限がある

**解決策**:
- 本番ビルド（EAS Build）で確認

---

## 開発ワークフロー

### フェーズ進行

| Phase | 内容 | 状態 |
|-------|------|------|
| 1-6 | MVPコア機能 | ✅ 完了 |
| 7 | AIエール機能 | ✅ 完了 |
| 8 | 人間エール機能 | ✅ 完了 |
| 9 | アプリ完成（UX改善） | ✅ 完了 |
| 10 | リリース準備 | ⏳ 次のフェーズ |

### コミット時の注意

- `.env` ファイルは絶対にコミットしない
- 機能追加・変更時は**必ずこのREADMEを更新**する
- 仕様書も同時に更新する

---

## 📝 ドキュメント更新のお願い

**新しいエンジニアへ**: このプロジェクトで作業を行った際は、以下を更新してください：

- [ ] 新機能を追加した → [機能一覧](#機能一覧) を更新
- [ ] 依存関係を追加/更新した → [技術スタック](#技術スタック) を更新
- [ ] セットアップ手順が変わった → [環境構築](#環境構築) を更新
- [ ] 新しいファイルを追加した → [プロジェクト構造](#プロジェクト構造) を更新
- [ ] 問題を解決した → [トラブルシューティング](#トラブルシューティング) に追加

**最終更新日を必ず更新してください！**

---

## ライセンス

（ライセンス情報をここに記載してください）

## 連絡先

- プロジェクトオーナー: Tatsunori
- プロジェクトマネージャー: Claude (PM)
