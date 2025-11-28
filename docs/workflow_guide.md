# 開発ワークフローガイド

**目的**: プロジェクトの一貫した開発・報告プロセスを確立する

---

## 📋 開発プロセス

### 1. 作業開始前

```bash
# リポジトリのクローン
git clone https://github.com/tatsunoritojo/habit-tracker.git
cd habit-tracker

# 依存関係のインストール
npm install --legacy-peer-deps

# 環境変数の設定
cp .env.example .env
# .envファイルを編集してFirebase設定を記入
```

### 2. 開発中

```bash
# 開発サーバー起動
npx expo start --clear

# 作業ブランチ作成（推奨）
git checkout -b feature/phase-N-description
```

**開発時の注意事項**:
- Phase単位で作業を分割
- こまめにコミット
- README.mdを適宜更新

### 3. 作業完了時

#### 3-1. README更新
`docs/README.md` の以下を更新：
- [ ] 実装済み機能リストに追加
- [ ] プロジェクト構造（新規ファイル追加時）
- [ ] よく使うコマンド（新規スクリプト追加時）
- [ ] 最終更新日と更新者

#### 3-2. スクリーンショット整理
```bash
# 作業内容に応じたディレクトリ作成
mkdir -p screenshots/YYMMDD_XX_feature_name

# スクリーンショットを番号付きで整理
# 例: 01_screen_name.jpg, 02_screen_name.jpg
```

#### 3-3. Gitコミット
```bash
# 変更をステージング
git add .

# コミット（明確なメッセージで）
git commit -m "feat: Phase X - 機能名

実装内容の簡潔な説明

🤖 Generated with Claude Code"

# プッシュ
git push origin main
```

---

## 📝 シニアエンジニアへの報告プロセス

### 必須手順

#### 1. 開発報告書の作成

**ファイル名**: `docs/development_report_YYMMDD.md`

**テンプレート**: `docs/templates/report_template.md` を使用

**必須項目**:
```markdown
# [プロジェクト名] 開発報告書

**報告日**: YYYY年MM月DD日
**報告者**: [名前]
**対象**: シニアエンジニア
**作業期間**: YYYY-MM-DD 〜 YYYY-MM-DD

## エグゼクティブサマリー
[完了した作業の概要を3-5行で]

## 実装完了機能
[Phase X: 機能名]
- 実装内容
- 技術的決定事項

## 技術的な課題と解決
[発生した問題と解決策]

## 次のステップ
[推奨される次の作業]

## 連絡事項
- GitHubリポジトリ: [URL]
- ブランチ: [ブランチ名]
- コミットハッシュ: [hash]
```

#### 2. ドキュメント配置

```
docs/
├── README.md                        # プロジェクト全体のドキュメント
├── workflow_guide.md                # このファイル（ワークフロー）
├── development_report_YYMMDD.md     # 開発報告書（日付付き）
└── templates/                       # テンプレート集
    └── report_template.md           # 報告書テンプレート
```

#### 3. 報告の提出

1. 報告書を `docs/` に配置
2. PMに口頭またはチャットで報告
3. 必要に応じてレビューミーティングを設定

---

## 🗂️ docsディレクトリ構成

```
docs/
├── README.md                        # プロジェクト全体のドキュメント（常に最新化）
├── workflow_guide.md                # 開発ワークフローガイド（このファイル）
├── mvp_specification.md             # MVP仕様書（参照用）
├── project_proposal.md              # プロジェクト提案書（参照用）
├── screen_design.md                 # 画面設計書（参照用）
├── development_report_251127.md     # 開発報告書（日付付き、履歴保存）
└── templates/                       # テンプレート集
    └── report_template.md
```

---

## ✅ チェックリスト

作業完了時、以下を確認：

### コード品質
- [ ] TypeScriptエラーなし
- [ ] console.logの削除（デバッグ用は削除）
- [ ] 未使用のimport削除
- [ ] .envファイルがコミットされていないことを確認

### ドキュメント
- [ ] `docs/README.md` 更新
- [ ] 開発報告書作成（`development_report_YYMMDD.md`）
- [ ] スクリーンショット整理

### Git
- [ ] 意味のあるコミットメッセージ
- [ ] プッシュ完了
- [ ] .gitignoreが適切に設定されている

### 報告
- [ ] シニアエンジニアに報告書提出
- [ ] PMに作業完了を連絡

---

## 🚨 注意事項

### 絶対にコミットしてはいけないもの
- `.env` ファイル（環境変数）
- `node_modules/`
- 個人情報を含むスクリーンショット
- APIキーやシークレット

### 報告時の注意
- **技術的な詳細を含める**: 実装方法、設計判断
- **課題を隠さない**: 技術的負債、懸念事項も記載
- **次のステップを提案**: 次の作業者が迷わないように

---

## 📞 困った時の連絡先

- **PM**: [連絡先]
- **シニアエンジニア**: [連絡先]
- **GitHubリポジトリ**: https://github.com/tatsunoritojo/habit-tracker

---

**最終更新**: 2025年11月27日
**作成者**: Claude Code
