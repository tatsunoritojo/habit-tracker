# Habit Tracker

習慣トラッキングアプリ - React Native (Expo) + Firebase

---

## ⚠️ このドキュメントについて

**このREADMEは常に最新の状態を保つ必要があります。**

新機能の追加、設定の変更、依存関係の更新を行った際は、必ずこのファイルを更新してください。

**最終更新日**: 2025-11-27
**最終更新者**: Claude Code (Phase 6完了時点)

---

## 📋 目次

- [プロジェクト概要](#プロジェクト概要)
- [技術スタック](#技術スタック)
- [環境構築](#環境構築)
- [開発の始め方](#開発の始め方)
- [プロジェクト構造](#プロジェクト構造)
- [トラブルシューティング](#トラブルシューティング)
- [開発ワークフロー](#開発ワークフロー)

---

## プロジェクト概要

Habit Tracker は、ユーザーが日々の習慣を記録・管理できるモバイルアプリケーションです。

### 主な機能

**✅ 実装済み (Phase 1-6)**

- **ユーザー認証**: Firebase 匿名認証によるユーザー管理
- **カード管理**:
  - 22種類の習慣テンプレートから選択してカード作成
  - 公開/非公開設定
  - カードアイコン表示
- **ログ記録**:
  - ワンタップで習慣の記録
  - リアルタイム同期
  - 記録日のカレンダー表示
- **ストリーク計算**:
  - 現在のストリーク（連続日数）
  - 最長ストリーク
  - 総記録日数
- **統計表示**:
  - 今週の達成日数
  - 今月の達成日数
- **カード詳細画面**:
  - カレンダービュー（月切り替え可能）
  - 記録日のマーク表示
  - 統計情報の可視化

**🔜 今後実装予定**

- エール機能（同じ習慣を実践する仲間との交流）
- 通知機能
- 設定画面

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
4. Web アプリを追加して、設定情報を `.env` に記入

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
3. アプリが起動し、"Hello World" が表示されれば成功

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
```

---

## プロジェクト構造

```
habit-tracker/
├── app/                          # Expo Router によるルーティング
│   ├── (tabs)/                   # タブナビゲーション
│   │   ├── _layout.tsx           # タブレイアウト
│   │   ├── home.tsx              # ホーム画面（カード一覧）
│   │   ├── cheers.tsx            # エール画面（未実装）
│   │   ├── notifications.tsx    # 通知画面（未実装）
│   │   └── settings.tsx          # 設定画面（未実装）
│   ├── card-detail/
│   │   └── [id].tsx              # カード詳細画面（動的ルート）
│   ├── add-card.tsx              # カード追加画面
│   └── _layout.tsx               # ルートレイアウト（Firebase初期化）
│
├── src/                          # ソースコード
│   ├── components/               # 再利用可能なコンポーネント
│   │   └── Calendar.tsx          # カレンダーコンポーネント
│   ├── hooks/                    # カスタムフック
│   │   ├── useCards.ts           # カード一覧取得
│   │   ├── useCardLogs.ts        # カードログ取得
│   │   ├── useStats.ts           # 統計取得
│   │   └── useTemplates.ts       # テンプレート取得
│   ├── lib/
│   │   └── firebase.ts           # Firebase 設定・認証ロジック
│   ├── services/                 # ビジネスロジック
│   │   ├── logService.ts         # ログ記録・ストリーク計算
│   │   └── statsService.ts       # 統計計算
│   └── types/
│       └── index.ts              # TypeScript型定義
│
├── scripts/                      # データシード用スクリプト
│   ├── seedCategories.ts         # カテゴリデータ投入
│   └── seedTemplates.ts          # テンプレートデータ投入
│
├── docs/                         # ドキュメント
│   ├── README.md                 # このファイル
│   ├── mvp_specification.md      # MVP仕様書
│   ├── project_proposal.md       # プロジェクト提案書
│   └── screen_design.md          # 画面設計書
│
├── screenshots/                  # スクリーンショット
│
├── assets/                       # 画像・アイコン等のアセット
│
├── .env                          # 環境変数（gitignore済み）
├── .env.example                  # 環境変数のテンプレート
├── app.json                      # Expo 設定
├── package.json                  # 依存関係
└── tsconfig.json                 # TypeScript 設定
```

### 主要ファイルの説明

#### データフロー関連

**`src/types/index.ts`**
- アプリ全体で使用する TypeScript 型定義
- Card, Log, CardTemplate, Category, User 等の型を定義

**`src/lib/firebase.ts`**
- Firebase の初期化と認証設定
- AsyncStorage による認証状態の永続化
- ユーザードキュメントの自動作成・更新

#### カスタムフック

**`src/hooks/useCards.ts`**
- ユーザーのカード一覧をリアルタイム取得
- Firestoreの変更を自動監視

**`src/hooks/useCardLogs.ts`**
- 特定カードのログ履歴を取得
- カレンダー表示用

**`src/hooks/useStats.ts`**
- ユーザーの統計情報（週/月の達成日数）を計算
- ログの変更をリアルタイム監視

**`src/hooks/useTemplates.ts`**
- カードテンプレート一覧を取得

#### サービス層

**`src/services/logService.ts`**
- ログ記録機能
- ストリーク計算アルゴリズム（現在・最長）
- カード統計の更新

**`src/services/statsService.ts`**
- 週次・月次の達成日数計算
- ユニーク日付のカウント

#### 画面コンポーネント

**`app/(tabs)/home.tsx`**
- メインのホーム画面
- カード一覧表示、ログ記録、統計表示

**`app/card-detail/[id].tsx`**
- カード詳細画面（動的ルート）
- カレンダー表示、統計情報

**`app/add-card.tsx`**
- カード追加画面
- テンプレート選択、公開設定

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

### AsyncStorage の警告

**原因**: Firebase が古いバージョンの AsyncStorage を期待している

**影響**: 警告のみで、動作には影響なし

---

## 開発ワークフロー

### ブランチ戦略

（プロジェクトのブランチ戦略をここに記載してください）

### コードスタイル

- TypeScript strict モード有効
- （コーディング規約をここに追加してください）

### コミット時の注意

- `.env` ファイルは絶対にコミットしない
- 機能追加・変更時は**必ずこのREADMEを更新**する

---

## 📝 ドキュメント更新のお願い

**新しいエンジニアへ**: このプロジェクトで作業を行った際は、以下を更新してください：

- [ ] 新機能を追加した → [プロジェクト概要](#プロジェクト概要) を更新
- [ ] 依存関係を追加/更新した → [技術スタック](#技術スタック) を更新
- [ ] セットアップ手順が変わった → [環境構築](#環境構築) を更新
- [ ] 新しいファイルを追加した → [プロジェクト構造](#プロジェクト構造) を更新
- [ ] 問題を解決した → [トラブルシューティング](#トラブルシューティング) に追加

**最終更新日を必ず更新してください！**

---

## ライセンス

（ライセンス情報をここに記載してください）

## 連絡先

（プロジェクト管理者の連絡先をここに記載してください）
