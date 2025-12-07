# 開発者向け指示書：Phase 8 人間エール機能実装

## 基本情報

| 項目 | 内容 |
|------|------|
| ドキュメント種別 | 開発指示書 |
| バージョン | 1.0 |
| 作成日 | 2025年11月28日 |
| 作成者 | プロジェクトマネージャー |
| 前提 | Phase 7（AIエール機能）完了済み |

---

## 1. 概要

### 1.1 目的

Phase 7で実装したAIエール（専属ボット）に加えて、**人間ユーザー同士のエール送受信機能**を実装します。

### 1.2 コンセプト

```
【Phase 8 完成後のエール体験】

ユーザーA ←→ ユーザーB（人間エール：カテゴリベースマッチング）
    ↑           ↑
    └─ 同じカテゴリL3で自動マッチング ─┘
         +
ユーザーA ← 専属ボット（AIエール：Phase 7で実装済み）
ユーザーB ← 専属ボット（AIエール：Phase 7で実装済み）
```

### 1.3 設計方針

| 項目 | 方針 |
|------|------|
| 匿名性 | カテゴリ表示（「筋トレの仲間」）、個人は特定不可 |
| AI/人間の区別 | ユーザーには意識させない（両方「ハビット仲間」） |
| AIエールの頻度 | 現状維持（人間エールが増えても変更なし） |

---

## 2. データモデル

### 2.1 matching_pools コレクション（新規）

```javascript
matching_pools/{categoryL3Id}
{
  category_l3: string,           // 例: "muscle_training"
  category_l3_name_ja: string,   // 例: "筋トレ"（表示用）
  
  active_cards: [
    {
      card_id: string,
      owner_uid: string,
      title: string,             // カード名（内部参照用）
      current_streak: number,
      last_log_date: string,     // "YYYY-MM-DD"
      total_logs: number,
      is_comeback: boolean       // 3日以上空いて再開したユーザー
    }
  ],
  
  updated_at: timestamp
}
```

**インデックス：** 不要（ドキュメントID直接アクセス）

### 2.2 reactions コレクション（拡張確認）

Phase 7で実装済みのスキーマをそのまま使用：

```javascript
reactions/{reactionId}
{
  reaction_id: string,
  
  from_uid: string,             // "system"（AI）or ユーザーUID（人間）
  to_uid: string,
  to_card_id: string,
  
  type: string,                 // "cheer" | "amazing" | "support"
  reason: string,               // AI: "record" | "streak_break" | "long_absence" | "random"
                                // 人間: "manual"
  message: string | null,       // AIのみ使用、人間はnull
  
  created_at: timestamp,
  scheduled_for: timestamp | null,
  delivered: boolean,
  is_read: boolean
}
```

**人間エールの場合：**
- `from_uid`: 送信者のUID
- `reason`: `"manual"`
- `message`: `null`

### 2.3 cheer_send_state コレクション（新規）

人間エールの送信制限を管理：

```javascript
cheer_send_state/{odId}
{
  user_uid: string,
  
  // 1日あたりの送信カウント
  daily_send_count: number,
  daily_send_date: string,      // "YYYY-MM-DD"
  
  // 送信済みペア（24時間以内）
  sent_pairs: [
    {
      to_card_id: string,
      sent_at: timestamp
    }
  ],
  
  updated_at: timestamp
}
```

---

## 3. Cloud Functions

### 3.1 updateMatchingPools（新規）

**トリガー：** Cloud Scheduler（30分ごと）

**スケジュール：** `*/30 * * * *`

**処理フロー：**

```javascript
async function updateMatchingPools() {
  // 1. 全カテゴリL3を取得
  const categories = await getActiveL3Categories();
  
  for (const category of categories) {
    // 2. 該当カテゴリの公開カードを取得
    const cards = await db.collection('cards')
      .where('category_l3', '==', category.category_id)
      .where('is_public', '==', true)
      .get();
    
    // 3. 直近7日以内に記録があるものをフィルタ
    const sevenDaysAgo = getDateString(-7);
    const activeCards = cards.docs
      .map(doc => doc.data())
      .filter(card => card.last_log_date >= sevenDaysAgo);
    
    // 4. 再開フラグを設定（3日以上空いて記録）
    const enrichedCards = activeCards.map(card => ({
      card_id: card.card_id,
      owner_uid: card.owner_uid,
      title: card.title,
      current_streak: card.current_streak,
      last_log_date: card.last_log_date,
      total_logs: card.total_logs,
      is_comeback: checkIsComeback(card)  // 直前の記録間隔が3日以上
    }));
    
    // 5. ランダムシャッフル
    const shuffled = shuffleArray(enrichedCards);
    
    // 6. matching_poolsに保存
    await db.collection('matching_pools').doc(category.category_id).set({
      category_l3: category.category_id,
      category_l3_name_ja: category.name_ja,
      active_cards: shuffled,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}
```

### 3.2 onHumanCheerSent（新規）

**トリガー：** Firestore onCreate (reactions) で `from_uid !== "system"`

**処理フロー：**

```javascript
exports.onHumanCheerSent = functions.firestore
  .document('reactions/{reactionId}')
  .onCreate(async (snap, context) => {
    const reaction = snap.data();
    
    // AIエールは別処理（Phase 7で実装済み）
    if (reaction.from_uid === 'system') {
      return null;
    }
    
    // 1. 受信者の情報を取得
    const toUser = await db.collection('users').doc(reaction.to_uid).get();
    const toUserData = toUser.data();
    
    // 2. お休みモード判定
    if (isQuietHours(toUserData)) {
      // scheduled_forを設定して後で配信
      await snap.ref.update({
        scheduled_for: getNextDeliveryTime(toUserData),
        delivered: false
      });
      return null;
    }
    
    // 3. 通知モード判定
    if (toUserData.settings.notification_mode === 'batch') {
      // まとめて通知に追加
      await snap.ref.update({
        scheduled_for: getNextBatchTime(toUserData),
        delivered: false
      });
      return null;
    }
    
    // 4. リアルタイム通知送信
    await sendPushNotification(toUserData, reaction);
    
    // 5. 配信済みフラグ更新
    await snap.ref.update({
      delivered: true
    });
  });
```

### 3.3 スケジューラー設定

```javascript
// updateMatchingPools: 30分ごと
schedule: "*/30 * * * *"
timezone: "Asia/Tokyo"
```

---

## 4. API エンドポイント（クライアント側実装）

### 4.1 エール提案取得

**処理フロー（クライアント側）：**

```javascript
async function getCheerSuggestions(userId) {
  // 1. ユーザーの公開カードを取得
  const userCards = await db.collection('cards')
    .where('owner_uid', '==', userId)
    .where('is_public', '==', true)
    .get();
  
  // 2. カテゴリL3を抽出（重複排除）
  const categoryL3s = [...new Set(userCards.docs.map(d => d.data().category_l3))];
  
  // 3. 各カテゴリのマッチングプールを取得
  const suggestions = [];
  
  for (const categoryL3 of categoryL3s) {
    const pool = await db.collection('matching_pools').doc(categoryL3).get();
    if (!pool.exists) continue;
    
    const poolData = pool.data();
    
    // 4. 自分自身を除外
    const candidates = poolData.active_cards.filter(c => c.owner_uid !== userId);
    
    // 5. 過去24時間以内にエール済みを除外
    const sendState = await getCheerSendState(userId);
    const recentlySent = sendState.sent_pairs
      .filter(p => isWithin24Hours(p.sent_at))
      .map(p => p.to_card_id);
    
    const available = candidates.filter(c => !recentlySent.includes(c.card_id));
    
    // 6. 候補を追加（カテゴリ名付き）
    available.forEach(card => {
      suggestions.push({
        ...card,
        category_l3: categoryL3,
        category_name_ja: poolData.category_l3_name_ja
      });
    });
  }
  
  // 7. シャッフルして上位3件を返す
  return shuffleArray(suggestions).slice(0, 3);
}
```

### 4.2 エール送信

**処理フロー（クライアント側）：**

```javascript
async function sendCheer(fromUid, toCardId, toUid, type) {
  // 1. 送信制限チェック
  const sendState = await getOrCreateCheerSendState(fromUid);
  
  // 1日10件上限チェック
  if (sendState.daily_send_date === getTodayString() && 
      sendState.daily_send_count >= 10) {
    throw new Error('DAILY_LIMIT_REACHED');
  }
  
  // 同一ペア24時間制限チェック
  const recentlySent = sendState.sent_pairs.find(
    p => p.to_card_id === toCardId && isWithin24Hours(p.sent_at)
  );
  if (recentlySent) {
    throw new Error('ALREADY_SENT_TODAY');
  }
  
  // 2. reaction作成
  const reactionRef = db.collection('reactions').doc();
  await reactionRef.set({
    reaction_id: reactionRef.id,
    from_uid: fromUid,
    to_uid: toUid,
    to_card_id: toCardId,
    type: type,                  // "cheer" | "amazing" | "support"
    reason: 'manual',
    message: null,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    scheduled_for: null,
    delivered: false,
    is_read: false
  });
  
  // 3. 送信状態更新
  await updateCheerSendState(fromUid, toCardId);
  
  return reactionRef.id;
}
```

---

## 5. 画面実装

### 5.1 S06 エール提案画面（新規）

**ファイル：** `app/(tabs)/cheers.tsx`（既存ファイルを更新）

**レイアウト：**

```
┌────────────────────────────┐
│ ←              エールを送る │
├────────────────────────────┤
│                            │
│  同じ習慣をがんばる仲間に     │
│  エールを送りませんか？       │
│                            │
├────────────────────────────┤
│                            │
│  ┌────────────────────┐    │
│  │ 筋トレ の仲間         │    │  ← カテゴリ名表示
│  │ 連続 12日 / 今週 5回   │    │
│  │                    │    │
│  │ 💪継続  ⭐すごい  🤝一緒 │    │  ← 3ボタン横並び
│  └────────────────────┘    │
│                            │
│  ┌────────────────────┐    │
│  │ 英語学習 の仲間        │    │
│  │ 連続 3日 / 今週 3回    │    │
│  │                    │    │
│  │ 💪継続  ⭐すごい  🤝一緒 │    │
│  └────────────────────┘    │
│                            │
│  ┌────────────────────┐    │
│  │ 読書 の仲間（再開！）   │    │  ← is_comeback: true
│  │ 4日ぶりに再開          │    │
│  │                    │    │
│  │ 💪継続  ⭐すごい  🤝一緒 │    │
│  └────────────────────┘    │
│                            │
│  [今日はスキップ]            │
│                            │
├────────────────────────────┤
│ 🏠     💬     🔔     ⚙    │
└────────────────────────────┘
```

**状態管理：**

```javascript
const [suggestions, setSuggestions] = useState([]);
const [loading, setLoading] = useState(true);
const [sentCards, setSentCards] = useState(new Set()); // 送信済みカードID

// 送信後の状態
// sentCardsに追加 → ボタンをグレーアウト + 「送信済み ✔」表示
```

**空状態（候補なし）：**

```
┌────────────────────────────┐
│                            │
│      😊                    │
│                            │
│  今日はエールを送れる仲間が   │
│  見つかりませんでした        │
│                            │
│  カードを公開設定にすると     │
│  仲間とつながれます          │
│                            │
│  [ホームに戻る]              │
│                            │
└────────────────────────────┘
```

### 5.2 アンドゥスナックバー

**送信直後の表示：**

```
┌────────────────────────────────────┐
│ 💪 ナイス継続 を送信しました [取り消す] │
└────────────────────────────────────┘
```

**仕様：**
- 画面下部に表示
- 2〜3秒で自動消去
- 「取り消す」タップで reaction を削除

### 5.3 ホーム画面バナー（新規）

**表示条件：**
- 1日1回、エール提案がある場合
- 既にその日エールを送信していない場合

**レイアウト：**

```
┌────────────────────────────┐
│ 💬 仲間にエールを送ってみませんか？ │
│                    [送る →] │
└────────────────────────────┘
```

**タップ時：** S06 エール提案画面へ遷移

### 5.4 通知一覧画面（S07）の更新

**表示形式（AI/人間共通）：**

```
────────────────────────────
[アイコン] ハビット仲間

💪 ナイス継続
「筋トレ」の仲間からエールが届きました
（10:23）
────────────────────────────
```

**表示ロジック：**
- `from_uid === "system"` → 「ハビット仲間からエール」
- `from_uid !== "system"` → 「{カテゴリ名}の仲間からエール」

---

## 6. 制約・上限

| 項目 | 値 | 実装箇所 |
|------|-----|----------|
| 同一ペア（from → to_card）のエール | 24時間に1回まで | クライアント側チェック |
| 1日あたりの送信上限 | 10件/ユーザー | クライアント側チェック |
| エール提案の候補数 | 最大3件 | getCheerSuggestions |
| マッチング対象 | 直近7日以内に記録があるユーザー | updateMatchingPools |
| マッチングプール更新頻度 | 30分ごと | Cloud Scheduler |

---

## 7. Firestoreセキュリティルール

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 既存ルール（Phase 7まで）は維持
    
    // matching_pools: 認証済みユーザーは読み取りのみ
    match /matching_pools/{poolId} {
      allow read: if request.auth != null;
      allow write: if false;  // Cloud Functionsからのみ書き込み
    }
    
    // cheer_send_state: 本人のみ読み書き
    match /cheer_send_state/{odId} {
      allow read, write: if request.auth != null && 
        resource.data.user_uid == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.user_uid == request.auth.uid;
    }
    
    // reactions: 人間エールの作成を許可（from_uidが自分自身の場合）
    match /reactions/{reactionId} {
      allow create: if request.auth != null && 
        request.resource.data.from_uid == request.auth.uid;
      // 読み取り・更新は既存ルール（to_uidが自分の場合）
      allow read, update: if request.auth != null && 
        resource.data.to_uid == request.auth.uid;
    }
  }
}
```

---

## 8. テスト要件

### 8.1 必須テスト項目

| シナリオ | 確認内容 |
|----------|----------|
| マッチングプール更新 | 30分ごとに更新される |
| エール提案表示 | 同じカテゴリの仲間が表示される |
| 自分自身の除外 | 自分のカードは提案に含まれない |
| エール送信 | 3種類のリアクションが送信できる |
| 送信制限（24時間） | 同じカードに2回目は送信できない |
| 送信制限（1日10件） | 11件目はエラーになる |
| 通知一覧表示 | 人間エールが「{カテゴリ}の仲間から」と表示 |
| アンドゥ | 送信後2秒以内にキャンセルできる |

### 8.2 推奨テスト項目

| シナリオ | 確認内容 |
|----------|----------|
| 空状態 | 公開カードがない場合の表示 |
| 候補なし | マッチングプールが空の場合の表示 |
| 再開ラベル | is_comeback: true のカードにラベル表示 |
| お休みモード | 深夜のエールが翌朝に届く |
| バナー表示 | ホーム画面のバナーが1日1回表示される |

---

## 9. 実装タスク

### 9.1 Phase 8a：バックエンド実装（3〜4日目安）

| タスクID | 内容 | 優先度 |
|----------|------|--------|
| 8a-1 | matching_pools コレクション作成 | 高 |
| 8a-2 | updateMatchingPools Cloud Function実装 | 高 |
| 8a-3 | cheer_send_state コレクション作成 | 高 |
| 8a-4 | onHumanCheerSent Cloud Function実装 | 高 |
| 8a-5 | Firestoreセキュリティルール更新 | 高 |

### 9.2 Phase 8b：フロントエンド実装（3〜4日目安）

| タスクID | 内容 | 優先度 |
|----------|------|--------|
| 8b-1 | S06 エール提案画面 UI実装 | 高 |
| 8b-2 | エール提案取得ロジック実装 | 高 |
| 8b-3 | エール送信ロジック実装 | 高 |
| 8b-4 | アンドゥスナックバー実装 | 高 |
| 8b-5 | 送信制限チェック実装 | 高 |
| 8b-6 | 通知一覧画面の人間エール対応 | 中 |
| 8b-7 | ホーム画面バナー実装 | 中 |

### 9.3 Phase 8c：統合テスト（1〜2日目安）

| タスクID | 内容 | 優先度 |
|----------|------|--------|
| 8c-1 | エンドツーエンドテスト | 高 |
| 8c-2 | 制限ロジックテスト | 高 |
| 8c-3 | 通知フローテスト | 中 |

---

## 10. 注意事項

### 10.1 匿名性の維持

- **絶対にユーザーIDを表示しない**
- カードタイトルも表示しない（カテゴリ名のみ）
- 「誰から」ではなく「どの習慣の仲間から」を伝える

### 10.2 AIエールとの共存

- 通知一覧では AI/人間 の区別を明示しない
- 両方「ハビット仲間」として自然に混在
- 受信者は「誰かが応援してくれている」と感じればOK

### 10.3 パフォーマンス

- matching_pools のドキュメントサイズに注意（1MBまで）
- active_cards の配列が大きくなりすぎたら、上位100件に制限する

---

## 11. 将来の拡張（参考）

Phase 8では実装しないが、将来的に検討可能な機能：

| 機能 | 内容 |
|------|------|
| エールへの返信 | 受け取ったエールにリアクションで返す |
| エール履歴 | 自分が送ったエールの一覧 |
| マッチング精度向上 | 記録時間帯・頻度での重み付け |
| お気に入り登録 | 特定の仲間をブックマーク（匿名のまま） |

---

## 改訂履歴

| バージョン | 日付 | 変更内容 |
|------------|------|----------|
| 1.0 | 2025-11-28 | 初版作成 |
