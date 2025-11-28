# コード行数（LOC）統計レポート

## 概要

このドキュメントは、`habit-tracker` アプリケーションの主要なスクリプトファイル（`.tsx`, `.ts`）のコード行数（Lines of Code, LOC）を計測し、その統計情報を提供します。
LOCは、空行やコメントも含む単純な物理行数です。

**総コード行数: 4,524行**

---

## 1. モジュール別統計

| モジュール | 説明 | LOC | 割合 |
| :--- | :--- | :--- | :--- |
| `app` | 画面コンポーネント (UI) | 2,386 | 52.7% |
| `src` | フロントエンドコアロジック | 1,294 | 28.6% |
| `functions` | バックエンド (Cloud Functions) | 844 | 18.7% |
| **合計** | | **4,524** | **100%** |

### `src` モジュール内訳

| サブモジュール | 説明 | LOC | `src`内割合 | 全体割合 |
| :--- | :--- | :--- | :--- | :--- |
| `hooks` | カスタムフック | 380 | 29.4% | 8.4% |
| `services` | ビジネスロジック | 247 | 19.1% | 5.5% |
| `lib` | 初期化処理 | 236 | 18.2% | 5.2% |
| `components` | 再利用UI部品 | 218 | 16.8% | 4.8% |
| `types` | 型定義 | 213 | 16.5% | 4.7% |
| **合計** | | **1,294** | **100%** | **28.6%** |

---

## 2. ファイル別LOC詳細

### フロントエンド (`app` & `src`)

#### 2.1. 画面コンポーネント (`app/**/*.tsx`) - 計 2,386行

| ファイルパス | LOC | 役割 |
| :--- | :--- | :--- |
| `app/(tabs)/settings.tsx` | 720 | 設定画面 |
| `app/(tabs)/home.tsx` | 384 | ホーム画面 |
| `app/add-card.tsx` | 359 | カード追加画面 |
| `app/(tabs)/notifications.tsx`| 266 | 通知一覧画面 |
| `app/today-cheers.tsx` | 255 | 今日のエール画面 |
| `app/card-detail/[id].tsx`| 210 | カード詳細画面 |
| `app/_layout.tsx` | 76 | ルートレイアウト |
| `app/(tabs)/_layout.tsx` | 64 | タブレイアウト |
| `app/(tabs)/cheers.tsx` | 46 | エール提案画面 (未実装) |
| `app/index.tsx` | 6 | エントリポイント |

#### 2.2. 再利用コンポーネント (`src/components/**/*.tsx`) - 計 218行

| ファイルパス | LOC | 役割 |
| :--- | :--- | :--- |
| `src/components/Calendar.tsx` | 218 | カレンダーコンポーネント |

#### 2.3. フロントエンドコアロジック (`src/**/*.ts`) - 計 1,076行

| ファイルパス | LOC | 役割 |
| :--- | :--- | :--- |
| `src/types/index.ts` | 213 | 型定義 |
| `src/services/logService.ts` | 166 | ログ記録サービス |
| `src/lib/notifications.ts`| 134 | プッシュ通知初期化 |
| `src/lib/firebase.ts` | 102 | Firebase初期化 |
| `src/hooks/useSettings.ts` | 81 | ユーザー設定フック |
| `src/services/statsService.ts` | 81 | 統計計算サービス |
| `src/hooks/useReactions.ts`| 67 | エール受信フック |
| `src/hooks/useCardLogs.ts` | 66 | カードログ取得フック |
| `src/hooks/useCards.ts` | 64 | カード一覧取得フック |
| `src/hooks/useStats.ts` | 54 | ユーザー統計フック |
| `src/hooks/useTemplates.ts`| 48 | テンプレート取得フック |

---

### バックエンド (`functions/src/**/*.ts`) - 計 844行

| ファイルパス | LOC | 役割 |
| :--- | :--- | :--- |
| `functions/src/index.ts`| 524 | Cloud Functionsエントリーポイント |
| `functions/src/services/cheerService.ts` | 320 | エール送信サービス |

---
