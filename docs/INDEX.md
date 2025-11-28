# ドキュメント一覧

このディレクトリには、Habit Trackerプロジェクトに関する全てのドキュメントが格納されています。

---

## 📚 ドキュメント構成

### 必読ドキュメント

#### 1. [README.md](./README.md)
**用途**: プロジェクト全体のドキュメント
**対象**: 全ての開発者
**内容**:
- プロジェクト概要と主な機能
- 技術スタック
- 環境構築手順
- プロジェクト構造
- トラブルシューティング

**更新タイミング**: 機能追加、依存関係変更、セットアップ手順変更時

---

#### 2. [workflow_guide.md](./workflow_guide.md)
**用途**: 開発ワークフローガイド
**対象**: 全ての開発者（特に新規参加者）
**内容**:
- 開発プロセス（開始前、開発中、完了時）
- シニアエンジニアへの報告プロセス
- docsディレクトリ構成
- チェックリスト

**更新タイミング**: プロセス変更時

---

### 仕様書・設計書（参照用）

#### 3. [mvp_specification.md](./mvp_specification.md)
**用途**: MVP仕様書
**対象**: 機能実装を行う開発者
**内容**:
- データモデル定義
- 機能仕様
- API設計
- 画面遷移

**更新タイミング**: 仕様変更時

---

#### 4. [project_proposal.md](./project_proposal.md)
**用途**: プロジェクト提案書
**対象**: ビジネス要件を理解したい開発者、PM
**内容**:
- ビジネス背景
- 目標とKPI
- ターゲットユーザー
- 競合分析

**更新タイミング**: ビジネス要件変更時

---

#### 5. [screen_design.md](./screen_design.md)
**用途**: 画面設計書
**対象**: UI/UX実装を行う開発者
**内容**:
- ワイヤーフレーム
- 画面仕様
- UI/UXガイドライン

**更新タイミング**: 画面設計変更時

---

### 開発報告書（履歴保存）

#### 6. development_report_YYMMDD.md
**用途**: 開発作業の報告
**対象**: シニアエンジニア、PM
**内容**:
- 実装完了機能の詳細
- 技術的決定事項
- 課題と解決策
- 次のステップ提案

**命名規則**: `development_report_YYMMDD.md`
**作成タイミング**: 作業完了時（Phase完了時）

**既存の報告書**:
- [development_report_251127.md](./development_report_251127.md) - Phase 1-6完了報告

---

### テンプレート

#### 7. [templates/report_template.md](./templates/report_template.md)
**用途**: 開発報告書のテンプレート
**対象**: 報告書を作成する全ての開発者
**使い方**:
1. このテンプレートをコピー
2. `development_report_YYMMDD.md` として保存
3. 必要項目を埋める
4. `docs/` ディレクトリに配置

---

## 🔄 ドキュメント更新フロー

```
開発作業完了
    ↓
① README.md 更新（機能リスト、構造）
    ↓
② テンプレートから報告書作成
    ↓
③ development_report_YYMMDD.md を作成
    ↓
④ シニアエンジニアに提出
```

---

## 📁 ディレクトリ構造

```
docs/
├── INDEX.md                         # このファイル
├── README.md                        # プロジェクト全体のドキュメント
├── workflow_guide.md                # ワークフローガイド
├── mvp_specification.md             # MVP仕様書
├── project_proposal.md              # プロジェクト提案書
├── screen_design.md                 # 画面設計書
├── development_report_251127.md     # 開発報告書（Phase 1-6）
└── templates/                       # テンプレート集
    └── report_template.md           # 報告書テンプレート
```

---

## 🎯 用途別ガイド

### 新規参加者の場合
1. [README.md](./README.md) - プロジェクト概要を理解
2. [workflow_guide.md](./workflow_guide.md) - 開発プロセスを確認
3. [mvp_specification.md](./mvp_specification.md) - 仕様を理解

### 機能実装を行う場合
1. [mvp_specification.md](./mvp_specification.md) - 実装する機能の仕様確認
2. [screen_design.md](./screen_design.md) - UI仕様確認
3. [README.md](./README.md) - プロジェクト構造確認

### 作業完了報告を行う場合
1. [workflow_guide.md](./workflow_guide.md) - 報告プロセス確認
2. [templates/report_template.md](./templates/report_template.md) - テンプレート使用
3. 報告書を `docs/` に配置して提出

---

## ✅ ドキュメント管理のルール

### 必須ルール
1. **機能追加時は必ずREADME.md更新**
2. **作業完了時は必ず報告書作成**
3. **報告書は日付付きで保存**（上書きしない）
4. **古い報告書は削除しない**（履歴として保持）

### 推奨事項
- ドキュメントは簡潔に
- 図やコードサンプルを活用
- 「なぜ」その決定をしたかを記録
- 技術的負債は隠さず記載

---

## 📞 質問・相談

ドキュメントに関する質問や改善提案は、PMまたはシニアエンジニアにご連絡ください。

---

**最終更新**: 2025年11月27日
**管理者**: Claude Code
