# ドキュメント一覧

このディレクトリは、Habit Trackerプロジェクトに関するドキュメントを整理して格納するために再編成されました。
プロジェクトの企画から開発、分析、運用に至るまでの情報が体系的にまとめられています。

---

## 📚 ドキュメント構成の概要

| フォルダ名                   | 概要                                                       | 主要な内容                                               |
| :--------------------------- | :--------------------------------------------------------- | :------------------------------------------------------- |
| `1_Strategy_and_Design/`     | プロジェクトの目的、全体設計、UX/UI設計など、**長期的に変更が少ない重要な文書**を格納。 | 企画書、MVP仕様書、設計意図ドキュメント、画面設計書           |
| `2_Development_Lifecycle/`   | 各開発フェーズ（Phase 7〜9）における**指示書や完了報告書**、および**一般的な開発報告書**を格納。 | フェーズごとの開発指示書、完了報告書、開発報告書（日付入り） |
| `3_Analysis_and_Quality/`    | コードベースの分析レポート、テスト関連文書、AIによる**実装現状レポート**などを格納。 | 実装現状レポート、コード行数統計、テスト導入ログ、回帰テストチェックリスト |
| `4_Generated_Content/`       | AIエージェントへの指示（プロンプト）など、**AI関連のコンテンツ**を格納。 | AIへの調査指示プロンプト、追加調査依頼                    |
| `5_Project_Guides/`          | プロジェクトの基本的な情報、開発ワークフロー、テンプレートなど、**プロジェクト運用に関する文書**を格納。 | README、ワークフローガイド、ドキュメント目次（このファイル）、テンプレート |

---

## 📖 各フォルダと主要ドキュメント

### 1. `1_Strategy_and_Design/` (企画・設計)

プロジェクトの方向性を定める、基盤となるドキュメント群です。

*   `project_proposal.md`: プロジェクトの企画背景、目的、ターゲットユーザー、差別化ポイントなど。
*   `mvp_specification.md`: MVP（Minimum Viable Product）の具体的な機能範囲、データモデル、主要機能フローなど。
*   `design_intent_document.md`: 各機能が「なぜそのように設計されたか」という意図が詳細に記された、プロジェクト思想の核となる文書。
*   `screen_design.md`: アプリの画面遷移図と、主要な画面ごとのワイヤーフレーム。

### 2. `2_Development_Lifecycle/` (開発記録)

各開発フェーズの記録と進捗を追うためのドキュメントです。

*   `Phase_07/`、`Phase_08/`、`Phase_09/`、`Phase_9.5/`: 各フェーズの開発指示書と完了報告書。
    *   例: `Phase_07/request_developer_phase7_v1.1.md` (指示書)
    *   例: `Phase_07/phase7_completion_report.md` (完了報告書)
    *   **Phase 9.5**: ニックネーム機能、カード重複防止、公開設定細分化
*   `Development_Reports/`: 各日・期間ごとの全体的な開発報告書。
    *   例: `Development_Reports/development_report_251127.md`

### 3. `3_Analysis_and_Quality/` (分析と品質)

コードベースの現状分析、品質保証、テストに関するドキュメントです。

*   `implementation_status_report.md`: AIエージェントがコードベースをリバースエンジニアリングして作成した、アプリの実装現状詳細レポート。
*   `database_structure_guide.md`: **Phase 9.5追加** - Firestoreデータベース構造、カテゴリ階層、テンプレート表示ロジック、セキュリティルールの詳細ガイド。
*   `analysis_reports/`: コードの行数統計、開発リズム分析、スクリプトの役割定義など。
*   `dev_logs/`: テスト環境の構築、CI/CD導入の経緯、テスト実施ログなど。
*   `regression_checklist.md`: フェーズ完了時に実行される回帰テストのチェックリスト。

### 4. `4_Generated_Content/` (AI関連コンテンツ)

主にAIエージェントへの指示や、その結果に関する補足文書です。

*   `prompt_for_engineer.md`: AIエージェントに「実装現状レポート」作成を依頼した際のプロンプト。
*   `prompt_additional_investigation.md`: 実装現状レポートの不明点について、AIに追加調査を依頼した際のプロンプト。
*   `reverse_engineering_instructions.md`: AIエージェントがコードを解析する際の手順と要件を定めた指示書。

### 5. `5_Project_Guides/` (プロジェクト運用)

プロジェクトの開発・運用に関する基本的な情報とガイドラインです。

*   `README.md`: プロジェクト全体の概要、技術スタック、環境構築手順など。
*   `INDEX.md`: このファイル。ドキュメント構造と利用ガイド。
*   `workflow_guide.md`: 開発ワークフロー、報告プロセス、Git運用など。
*   `templates/`: 各種レポートやドキュメント作成用のテンプレート。
    *   例: `templates/report_template.md`

---

## 🎯 用途別ガイド (新しい構造での利用方法)

### 新規参加者の場合
1.  `5_Project_Guides/README.md` でプロジェクト概要を理解。
2.  `5_Project_Guides/workflow_guide.md` で開発プロセスを確認。
3.  `1_Strategy_and_Design/` フォルダ内の文書（`project_proposal.md`, `mvp_specification.md`, `design_intent_document.md`）でプロジェクトの思想と仕様を深く理解。

### 機能実装を行う場合
1.  `1_Strategy_and_Design/mvp_specification.md` や `screen_design.md` で実装する機能の全体仕様を確認。
2.  `2_Development_Lifecycle/` フォルダ内の関連フェーズの**開発指示書** (`request_developer_phaseX.md`) を参照し、詳細な要件を確認。
3.  `3_Analysis_and_Quality/implementation_status_report.md` で現在の実装状況を把握。

### 作業完了報告を行う場合
1.  `5_Project_Guides/workflow_guide.md` の報告プロセスを確認。
2.  `5_Project_Guides/templates/report_template.md` を使用して報告書を作成。
3.  作成した報告書を `2_Development_Lifecycle/Development_Reports/` または適切な `Phase_X/` フォルダに配置。

---

## ✅ ドキュメント管理のルール

### 必須ルール
1.  **`5_Project_Guides/README.md` と `5_Project_Guides/INDEX.md` は常に最新に保つ。**
2.  **作業完了時は必ず開発報告書を作成し、適切なフォルダに配置する。**
3.  **報告書は日付付きで保存し、既存ファイルを上書きしない。**
4.  **古いドキュメントは履歴として保持し、削除しない。**

### 推奨事項
*   ドキュメントは簡潔に記述し、図やコードサンプルを活用する。
*   意思決定の「なぜ」を記録し、技術的負債も隠さず記載する。

---

## 📞 質問・相談

ドキュメントに関する質問や改善提案は、PMまたはシニアエンジニアにご連絡ください。

---

**最終更新**: 2025年12月7日
**管理者**: Claude Code