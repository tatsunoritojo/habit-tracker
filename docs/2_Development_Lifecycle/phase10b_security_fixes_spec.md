# Phase 10-B: セキュリティ修正 実装指示書

## 基本情報

| 項目 | 内容 |
|------|------|
| フェーズ | 10-B |
| 機能名 | セキュリティ修正 |
| 目的 | 内部テスト前のセキュリティ強化 |
| 作成日 | 2025-12-08 |
| 作成者 | PM |
| 前提 | Phase 10-A 完了 |

---

## 1. 背景

### 1.1 Phase 10-A で発生した課題

Phase 10-A の実装中に、Firestoreセキュリティルールを緩和しました：

| コレクション | 変更内容 | リスク |
|-------------|----------|--------|
| users | 認証済み全員がread可能 | 他ユーザーの設定情報が閲覧可能 |
| cards | 認証済み全員がread可能 | 非公開カードも閲覧可能 |
| reactions | 認証済み全員がcreate可能 | from_uid="system" の偽装が可能 |

### 1.2 MVP仕様書に記載の懸念事項

> **セキュリティ懸念（Phase 10で対応予定）**:
> - `reactions` の `create` で `from_uid="system"` をクライアントから偽装可能
> - 対策: Cloud Functionsからの書き込みのみ許可する仕組みを導入

---

## 2. 対応方針

### 2.1 アプローチの選択肢

| アプローチ | 概要 | メリット | デメリット |
|-----------|------|----------|------------|
| A. ルール厳格化 | セキュリティルールで制限 | シンプル、即時適用 | 複雑な条件は書きにくい |
| B. Cloud Functions経由 | 全書き込みをFunctions経由に | 完全な制御 | 実装コスト高 |
| C. 段階的対応 | 重要な箇所のみ修正 | バランス良い | 完璧ではない |

**採用: C. 段階的対応**

内部テスト（仲間内）の段階では完璧なセキュリティは不要。重要な箇所のみ対応し、本番リリース前に再評価します。

---

## 3. 修正内容

### 3.1 reactions: from_uid="system" 偽装防止

**現状の問題**:
```javascript
// 現在のルール
allow create: if request.auth != null;
// → クライアントから from_uid="system" で書き込み可能
```

**修正方針**:
- クライアントからの `create` は `from_uid == request.auth.uid` を強制
- `from_uid="system"` は Cloud Functions のみ（Admin SDK使用）

**修正後のルール**:
```javascript
match /reactions/{reactionId} {
  // クライアントからの作成: from_uid は自分自身のみ
  allow create: if request.auth != null 
    && request.resource.data.from_uid == request.auth.uid;
  
  // 受信者は読み取り・更新可能
  allow read, update: if request.auth != null 
    && resource.data.to_uid == request.auth.uid;
  
  // 送信者も自分の送信履歴を読み取り可能（アンドゥ用）
  allow read: if request.auth != null 
    && resource.data.from_uid == request.auth.uid;
}
```

**Cloud Functions側**:
- Admin SDK を使用しているため、セキュリティルールをバイパス
- 変更不要

### 3.2 users: 必要なフィールドのみ公開

**現状の問題**:
```javascript
// 現在のルール
allow read: if request.auth != null;
// → 他ユーザーの settings（通知設定など）も閲覧可能
```

**修正方針**:
- 他ユーザーから必要な情報は `display_name` のみ
- セキュリティルールでフィールド単位の制限は困難
- → **許容**: 内部テスト段階では現状維持

**将来の対応案**（本番リリース前）:
- `public_profiles/{uid}` サブコレクションを作成
- `display_name` のみを格納
- エール提案時はこちらを参照

### 3.3 cards: 非公開カードの保護

**現状の問題**:
```javascript
// 現在のルール
allow read: if request.auth != null;
// → 非公開カード（is_public=false）も閲覧可能
```

**修正後のルール**:
```javascript
match /cards/{cardId} {
  // 読み取り: 本人 OR 公開カード
  allow read: if request.auth != null && (
    resource.data.owner_uid == request.auth.uid ||
    resource.data.is_public == true ||
    resource.data.is_public_for_cheers == true
  );
  
  // 作成: 本人のみ
  allow create: if request.auth != null 
    && request.resource.data.owner_uid == request.auth.uid;
  
  // 更新・削除: 本人のみ
  allow update, delete: if request.auth != null 
    && resource.data.owner_uid == request.auth.uid;
}
```

### 3.4 favorites: 現状維持

Phase 10-A で適切に設定済み。変更不要。

```javascript
match /favorites/{docId} {
  allow create: if request.auth != null 
    && request.resource.data.owner_uid == request.auth.uid;
  allow read, delete: if request.auth != null 
    && resource.data.owner_uid == request.auth.uid;
  allow update: if false;
}
```

---

## 4. 修正後の完全なセキュリティルール

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ========================================
    // users: ユーザー情報
    // ========================================
    match /users/{uid} {
      // 読み取り: 認証済み全員（display_name取得のため）
      // TODO: 本番前に public_profiles サブコレクション化を検討
      allow read: if request.auth != null;
      
      // 書き込み: 本人のみ
      allow write: if request.auth != null && request.auth.uid == uid;
    }

    // ========================================
    // cards: 習慣カード
    // ========================================
    match /cards/{cardId} {
      // 読み取り: 本人 OR 公開カード
      allow read: if request.auth != null && (
        resource.data.owner_uid == request.auth.uid ||
        resource.data.is_public == true ||
        resource.data.is_public_for_cheers == true
      );
      
      // 作成: 本人のみ
      allow create: if request.auth != null 
        && request.resource.data.owner_uid == request.auth.uid;
      
      // 更新・削除: 本人のみ
      allow update, delete: if request.auth != null 
        && resource.data.owner_uid == request.auth.uid;
    }

    // ========================================
    // logs: 達成ログ
    // ========================================
    match /logs/{logId} {
      // 読み取り: 本人のみ
      allow read: if request.auth != null 
        && resource.data.owner_uid == request.auth.uid;
      
      // 作成: 本人のみ
      allow create: if request.auth != null 
        && request.resource.data.owner_uid == request.auth.uid;
      
      // 更新・削除: 本人のみ
      allow update, delete: if request.auth != null 
        && resource.data.owner_uid == request.auth.uid;
    }

    // ========================================
    // categories, card_templates: マスタデータ
    // ========================================
    match /categories/{doc} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    
    match /card_templates/{doc} {
      allow read: if request.auth != null;
      allow write: if false;
    }

    // ========================================
    // matching_pools: マッチングプール
    // ========================================
    match /matching_pools/{doc} {
      allow read: if request.auth != null;
      allow write: if false;  // Cloud Functionsのみ
    }

    // ========================================
    // reactions: エール（リアクション）
    // ========================================
    match /reactions/{reactionId} {
      // 作成: 認証済み、かつ from_uid は自分自身
      // ※ from_uid="system" は Cloud Functions (Admin SDK) のみ
      allow create: if request.auth != null 
        && request.resource.data.from_uid == request.auth.uid;
      
      // 読み取り: 送信者 OR 受信者
      allow read: if request.auth != null && (
        resource.data.from_uid == request.auth.uid ||
        resource.data.to_uid == request.auth.uid
      );
      
      // 更新: 受信者のみ（is_read更新用）
      allow update: if request.auth != null 
        && resource.data.to_uid == request.auth.uid;
      
      // 削除: 送信者のみ（アンドゥ用）
      allow delete: if request.auth != null 
        && resource.data.from_uid == request.auth.uid;
    }

    // ========================================
    // cheer_state: AIエール状態管理
    // ========================================
    match /cheer_state/{docId} {
      allow read: if request.auth != null && docId == request.auth.uid;
      allow write: if false;  // Cloud Functionsのみ
    }

    // ========================================
    // cheer_send_state: 人間エール送信制限
    // ========================================
    match /cheer_send_state/{docId} {
      allow read, write: if request.auth != null && docId == request.auth.uid;
    }

    // ========================================
    // favorites: お気に入り
    // ========================================
    match /favorites/{docId} {
      allow create: if request.auth != null 
        && request.resource.data.owner_uid == request.auth.uid;
      allow read, delete: if request.auth != null 
        && resource.data.owner_uid == request.auth.uid;
      allow update: if false;
    }
  }
}
```

---

## 5. 実装タスク

| # | タスク | 優先度 | 備考 |
|---|--------|--------|------|
| 1 | firestore.rules を上記内容に更新 | 高 | |
| 2 | Firebase Console でルールをデプロイ | 高 | |
| 3 | 動作検証: 人間エール送信 | 高 | from_uid チェック |
| 4 | 動作検証: AIエール受信 | 高 | Cloud Functions経由 |
| 5 | 動作検証: 非公開カードの非表示 | 中 | |
| 6 | 動作検証: お気に入り機能 | 中 | 既存機能の継続確認 |

---

## 6. テスト観点

### 6.1 セキュリティテスト

| # | テストケース | 期待結果 |
|---|-------------|----------|
| 1 | クライアントから from_uid="system" でreaction作成 | **拒否される** |
| 2 | クライアントから from_uid=自分のUID でreaction作成 | 成功 |
| 3 | 他ユーザーの非公開カードを取得 | **拒否される** |
| 4 | 他ユーザーの公開カードを取得 | 成功 |
| 5 | 他ユーザーのfavoritesを取得 | **拒否される** |

### 6.2 機能継続テスト

| # | テストケース | 期待結果 |
|---|-------------|----------|
| 1 | 端末A → 端末B エール送信 | 成功（変更なし） |
| 2 | AIエール受信 | 成功（Cloud Functions経由） |
| 3 | お気に入り登録/解除 | 成功（変更なし） |
| 4 | エール提案画面表示 | 成功（公開カードのみ表示） |

---

## 7. ロールバック手順

万が一、ルール変更で問題が発生した場合：

1. Firebase Console → Firestore → ルール
2. 履歴から前のバージョンを選択
3. 「公開」をクリック

---

## 8. 将来の改善案（本番リリース前）

| 項目 | 内容 | 優先度 |
|------|------|--------|
| public_profiles | display_name のみを格納するサブコレクション | 中 |
| rate limiting | Cloud Functions で送信レート制限 | 低 |
| 監査ログ | 不正アクセス検知 | 低 |

---

## 9. 成果物チェックリスト

- [ ] firestore.rules 更新
- [ ] Firebase Console でデプロイ
- [ ] セキュリティテスト完了
- [ ] 機能継続テスト完了
- [ ] ドキュメント更新（mvp_specification.md）

---

## 10. 注意事項

### 10.1 Cloud Functions との関係

- Cloud Functions は Admin SDK を使用
- Admin SDK はセキュリティルールをバイパス
- したがって、AIエール（from_uid="system"）は影響を受けない

### 10.2 既存データへの影響

- ルール変更は即座に適用される
- 既存データの構造は変更しない
- 既存の reactions（from_uid="system"）は読み取り可能

---

## 改訂履歴

| バージョン | 日付 | 変更内容 |
|------------|------|----------|
| 1.0 | 2025-12-08 | 初版作成 |
