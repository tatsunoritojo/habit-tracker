# 追加調査レポート

## 作成情報
- 作成日: 2025-12-07
- 作成者: Claude（エンジニアエージェント）
- 目的: 実装現状レポートの不明点を詳細調査

---

## 1. 不明ファイルの確認

### ファイル: app/today-cheers.tsx

**役割**: まとめて通知タップ時の遷移先画面（S09: 今日のエール画面）

**機能概要**:
- その日に受け取ったエール（AIエール＋人間エール）を時系列で表示
- ハイライトセクション: リアクション種別ごとに代表的なエールを表示
- 一覧セクション: 時刻順にすべてのエールを表示

**実装詳細**:
```typescript
// コメントより
// S09: 今日のエール画面（まとめて通知タップ時の遷移先）

// 主要機能:
1. 今日のエールをフィルタリング（created_at の日付が今日のもの）
2. リアクション種別でグループ化（amazing, cheer, support）
3. 時刻順の一覧表示（新しい順）
```

**使用状況**: **使用中**

**判断**: **残す必要あり**

**理由**:
1. Phase 7完了レポートで明記されている（`docs/phase7_completion_report.md:58`）
2. まとめて通知モードの必須画面として設計されている
3. 実装コードは完成しており、エラーもない
4. 「S09」という画面IDが割り当てられている（仕様書の画面一覧に含めるべき）

**推奨事項**:
- 仕様書の画面一覧に追加
- ルーティング設定を確認（プッシュ通知からのDeep Link対応）

---

## 2. AIエール文言の詳細

### 文言総数: **67種類**

（※実装現状レポートでは「68種類」と記載しましたが、実際のコードを精査した結果、67種類でした）

### パターン別内訳

| パターン | reason | 文言数 | 合計 |
|----------|--------|--------|------|
| ① 記録直後 | `record` | cheer:6, amazing:6, support:6 | 18 |
| ② 継続途切れ翌日 | `streak_break` | cheer:6, amazing:6, support:6 | 18 |
| ③ 長期離脱 | `long_absence` | cheer:6, amazing:1, support:6 | 13 |
| ④ ランダム | `random` | cheer:6, amazing:6, support:6 | 18 |

**合計**: 18 + 18 + 13 + 18 = **67種類**

### パターン①: 記録直後 (reason: 'record')

| reactionType | 文言リスト |
|--------------|------------|
| cheer (💪) | ① 今日もナイス継続<br>② いい流れきてます<br>③ その一歩すてき<br>④ 積み重ねが光ってる<br>⑤ ペース、いい感じ<br>⑥ 今日の一歩も上々 |
| amazing (⭐) | ① すごくいいペース<br>② 今日もキレてる<br>③ 続け方がうまいね<br>④ いいリズム出てる<br>⑤ 流れつかんでるね<br>⑥ 伸び方がすてき |
| support (🤝) | ① 一緒にがんばってるよ<br>② こっちも今やってる<br>③ 同じ空気で進んでる<br>④ 仲間も今やってるよ<br>⑤ 今日も並んで歩こう<br>⑥ となりで走ってる感 |

### パターン②: 継続途切れ翌日 (reason: 'streak_break')

| reactionType | 文言リスト |
|--------------|------------|
| cheer (💪) | ① 今日からまた一歩どう？<br>② ゆっくり戻ってこよ<br>③ 今日の一歩からでOK<br>④ 思い出したら一歩だけ<br>⑤ できる日にやればOK<br>⑥ 軽く一歩踏み出そ |
| amazing (⭐) | ① またすごい日が来そう<br>② 積み重ね直前って感じ<br>③ 次の一歩が楽しみ<br>④ ここからが面白いね<br>⑤ また伸びていきそう<br>⑥ 未来の自分が楽しみ |
| support (🤝) | ① 少し休んでOK また一緒に<br>② ここからまた並走しよ<br>③ いつでも隣で歩けるよ<br>④ ペース戻すとき寄ってね<br>⑤ 今日は一緒にどう？<br>⑥ また並んで進もうか |

### パターン③: 長期離脱 (reason: 'long_absence')

| reactionType | 文言リスト |
|--------------|------------|
| cheer (💪) | ① 思い出したら一歩だけ<br>② またいつでも再開OK<br>③ 久しぶりの一歩どう？<br>④ 一歩目はいつでも軽く<br>⑤ 小さく再開してみよ<br>⑥ 気が向いたらタップだけ |
| amazing (⭐) | ① またすごい日が来そう<br>**※1種類のみ** |
| support (🤝) | ① いつでもここで待ってる<br>② また一緒に始めよ<br>③ 離れてても仲間だよ<br>④ 戻る場所はここだよ<br>⑤ 思い出したら会おう<br>⑥ ふらっと戻っておいで |

**注**: パターン③の `amazing` は意図的に1種類のみ（長期離脱時は「称賛」より「寄り添い」を重視する設計）

### パターン④: ランダム (reason: 'random')

| reactionType | 文言リスト |
|--------------|------------|
| cheer (💪) | ① そのペースすごくいい<br>② 積み重ねが効いてる<br>③ 日々の一歩が光ってる<br>④ マイペースが一番いい<br>⑤ 地味にすごいことしてる<br>⑥ 今日もいいリズムだね |
| amazing (⭐) | ① コツコツがすごい力に<br>② 最近の記録とてもいい<br>③ やり方がほんと上手<br>④ 積み重ねが尊敬レベル<br>⑤ その継続、普通にすごい<br>⑥ じわじわ伸びてるね |
| support (🤝) | ① 遠くで一緒にやってるよ<br>② 同じカードの仲間です<br>③ みんなで少しずつ前へ<br>④ どこかで並走してます<br>⑤ 今日も仲間がそばにいる<br>⑥ 同じ方向向いてるよ |

---

## 3. リアクション種別選択の重み付け

エール文言の前に、まずリアクション種別（cheer/amazing/support）が確率的に選択されます。

### 重み付けテーブル（確率%）

| reason | cheer (💪) | amazing (⭐) | support (🤝) |
|--------|-----------|-------------|-------------|
| record | 65% | 20% | 15% |
| streak_break | 30% | 10% | 60% |
| long_absence | 15% | 5% | 80% |
| random | 33% | 33% | 34% |

**設計意図**:
- **record（記録直後）**: 継続を励ます「cheer」を多めに
- **streak_break（途切れ翌日）**: 寄り添う「support」を多めに
- **long_absence（長期離脱）**: さらに寄り添う「support」を圧倒的に多く
- **random（ランダム）**: 均等配分

---

## 4. 文言選択のロジック

### 選択アルゴリズム

1. **直近5件のエール文言を取得**
   - ユーザーの `reactions` コレクションから `from_uid="system"` を降順で5件取得

2. **重複回避フィルタリング**
   - 直近5件に含まれていない文言のみを候補とする

3. **候補が0件の場合**
   - 全文言リストから選択（6回連続同じパターンの場合に発生）

4. **ランダム選択**
   - 候補リストからランダムに1つ選択

**実装コード**（抜粋）:
```typescript
// 直近5件のエール文言を取得
const recentReactions = await db
  .collection('reactions')
  .where('to_uid', '==', userId)
  .where('from_uid', '==', 'system')
  .orderBy('created_at', 'desc')
  .limit(5)
  .get();

const recentMessages = recentReactions.docs
  .map((doc) => doc.data().message)
  .filter((msg) => msg != null);

// 重複していない文言のみを抽出
const available = candidates.filter((msg) => !recentMessages.includes(msg));

// 利用可能な文言がない場合は全候補からランダム選択
const messagePool = available.length > 0 ? available : candidates;

// ランダム選択
return messagePool[Math.floor(Math.random() * messagePool.length)];
```

**メリット**:
- 同じ文言が短期間に繰り返されるのを防ぐ
- ユーザーに「毎回違うメッセージ」という新鮮さを提供

---

## 5. マッチングプール更新ロジックの詳細

**実装ファイル**: `functions/src/services/updateMatchingPools.ts`

### 処理フロー

```
[30分ごと実行]
    ↓
1. 全カテゴリL3を取得（categoriesコレクションから）
    ↓
2. 各カテゴリについて以下を実行:
    ↓
    2-1. 該当カテゴリの公開カードを取得
         条件: category_l3 == カテゴリID AND is_public == true
    ↓
    2-2. 直近7日以内に記録があるカードをフィルタ
         条件: last_log_date >= 7日前の日付
    ↓
    2-3. 各カードの is_comeback フラグを判定
         ロジック: 直近2件のログを取得し、差分が4日以上なら true
    ↓
    2-4. MatchingCard オブジェクトを生成
    ↓
    2-5. 配列をシャッフル（Fisher-Yates shuffle）
    ↓
    2-6. 上位100件に制限（Firestoreドキュメントサイズ制限対策）
    ↓
    2-7. matching_pools/{category_l3} に保存
    ↓
3. 完了
```

### 対象カードの条件

| 条件 | 説明 |
|------|------|
| `category_l3 == カテゴリID` | 該当カテゴリのカードのみ |
| `is_public == true` | 公開カードのみ |
| `last_log_date` が存在 | 一度も記録がないカードは除外 |
| `last_log_date >= 7日前` | 直近7日以内に記録があるカード |

### 除外条件

| 除外条件 | 説明 |
|----------|------|
| `is_public == false` | 非公開カード |
| `last_log_date` なし | 記録が一度もない新規カード |
| `last_log_date < 7日前` | 非アクティブユーザー |
| `status == 'archived'` | アーカイブ済みカード（※型定義にあるが、クエリには未実装。要確認） |

### is_comeback 判定ロジック

**判定条件**: 「直近2件のログの差分が4日以上」

**実装**:
```typescript
async function checkIsComeback(db, cardId, lastLogDate): Promise<boolean> {
  // 直近2件のログを取得
  const logsSnap = await db.collection('logs')
    .where('card_id', '==', cardId)
    .orderBy('logged_at', 'desc')
    .limit(2)
    .get();

  if (logsSnap.size < 2) {
    return false; // ログが不足している場合は判定不可
  }

  const logs = logsSnap.docs;
  const latestLogDate = logs[0].data().logged_at.toDate();
  const previousLogDate = logs[1].data().logged_at.toDate();

  // 差分（日数）
  const diffTime = Math.abs(latestLogDate.getTime() - previousLogDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // 4日差（中3日）以上を「久しぶり」とする
  return diffDays >= 4;
}
```

**例**:
- 1日に実施 → 次が5日（2,3,4日休み）: 差分4日 → `is_comeback = true`
- 1日に実施 → 次が4日（2,3日休み）: 差分3日 → `is_comeback = false`

**パフォーマンス考慮**:
- 各カードごとにログを2件取得するため、Firestore読み取りコストが発生
- カテゴリあたり数百カード想定のため許容範囲
- ログインデックス: `card_id, logged_at desc` が必要

### プール更新の具体的な処理

**保存データ構造**:
```typescript
{
  category_l3: "muscle_training",
  category_l3_name_ja: "筋トレ",
  active_cards: [
    {
      card_id: "abc123",
      owner_uid: "user_xyz",
      title: "腕立て伏せ",
      current_streak: 5,
      last_log_date: "2025-12-07",
      total_logs: 30,
      is_comeback: false
    },
    // ... 最大100件
  ],
  updated_at: Timestamp
}
```

**シャッフル理由**:
- エール提案画面で同じユーザーが常に上位に表示されるのを防ぐ
- 公平性の確保

**100件制限理由**:
- Firestoreドキュメントサイズ上限: 1MB
- MatchingCard 1件あたり約0.5KB と仮定 → 100件で約50KB（余裕あり）

---

## 6. ユーザー統計更新

### cheers_received

**更新タイミング**: **未実装**

**現状**:
- 型定義には存在（`src/types/index.ts:37`）
- 初期値0で作成（`src/lib/firebase.ts:86`）
- 更新処理が存在しない

**更新箇所**: なし

### cheers_sent

**更新タイミング**: **未実装**

**現状**:
- 型定義には存在（`src/types/index.ts:38`）
- 初期値0で作成（`src/lib/firebase.ts:87`）
- 更新処理が存在しない

**更新箇所**: なし

---

## 7. 未実装の場合の分析

### 未実装の理由（推測）

1. **MVP範囲外**
   - Phase 9までの実装で優先度が低かった
   - 統計表示画面が未実装のため、表示場所がない

2. **代替手段の存在**
   - リアルタイムカウントではなく、`reactions` コレクションをクエリすれば取得可能
   - フロントエンドで動的に計算できる

3. **パフォーマンス最適化の後回し**
   - 統計更新には Cloud Functions でのトリガー実装が必要
   - 集計バッチ処理の検討が必要

### 実装する場合の方針

**方法1: リアルタイム更新（Cloud Functions トリガー）**

```typescript
// functions/src/index.ts に追加

// onHumanCheerSent 内で受信者の統計を更新
export const onHumanCheerSent = functions.firestore
  .document('reactions/{reactionId}')
  .onCreate(async (snapshot, context) => {
    const reaction = snapshot.data();

    if (reaction.from_uid !== 'system') {
      // 送信者の統計を更新
      await db.collection('users').doc(reaction.from_uid).update({
        'stats.cheers_sent': admin.firestore.FieldValue.increment(1)
      });

      // 受信者の統計を更新
      await db.collection('users').doc(reaction.to_uid).update({
        'stats.cheers_received': admin.firestore.FieldValue.increment(1)
      });
    }
  });
```

**方法2: 定期集計バッチ（日次実行）**

```typescript
export const updateUserStats = functions.pubsub
  .schedule('0 0 * * *') // 毎日0時
  .onRun(async () => {
    // 全ユーザーの統計を再計算
    const users = await db.collection('users').get();

    for (const userDoc of users.docs) {
      const uid = userDoc.id;

      // 受信エール数
      const received = await db.collection('reactions')
        .where('to_uid', '==', uid)
        .count()
        .get();

      // 送信エール数
      const sent = await db.collection('reactions')
        .where('from_uid', '==', uid)
        .count()
        .get();

      await db.collection('users').doc(uid).update({
        'stats.cheers_received': received.data().count,
        'stats.cheers_sent': sent.data().count
      });
    }
  });
```

**方法3: フロントエンドで動的計算（現在の代替手段）**

```typescript
// src/hooks/useStats.ts で計算
export function useStats() {
  const { reactions } = useReactions();
  const user = auth.currentUser;

  const cheersReceived = reactions.filter(r => r.to_uid === user?.uid).length;
  const cheersSent = reactions.filter(r => r.from_uid === user?.uid).length;

  return { cheersReceived, cheersSent };
}
```

### 推奨実装方針

**Phase 10以降で実装を検討**

1. **短期（Phase 10）**: フロントエンドで動的計算（コスト0、実装簡単）
2. **中期（Phase 11）**: リアルタイム更新（正確、Cloud Functions コスト増）
3. **長期（Phase 12+）**: 定期集計バッチ（負荷分散、集計精度向上）

**現状の対応**:
- 型定義は維持（将来実装のため）
- 初期値0は問題なし
- 仕様書には「未実装（Phase 10以降で検討）」と明記

---

## 8. 調査結果サマリー

| 項目 | 結果 | 優先度 |
|------|------|--------|
| 1. today-cheers.tsx | 使用中、残す必要あり | 高 |
| 2. AIエール文言 | 67種類、詳細リスト作成完了 | 高 |
| 3. マッチングロジック | 詳細フロー確認完了 | 中 |
| 4. ユーザー統計 | 未実装、Phase 10以降で検討 | 低 |

---

## 9. 仕様書更新への反映推奨事項

### 追加すべき情報

1. **画面一覧に追加**
   - `app/today-cheers.tsx`: S09 今日のエール画面

2. **AIエール文言の全リスト**
   - 67種類の詳細リストを仕様書に含める
   - 重み付けテーブルも記載

3. **マッチングプール更新ロジックの詳細**
   - 対象条件・除外条件の明記
   - is_comeback 判定ロジックの説明

4. **未実装機能の明記**
   - `users.stats.cheers_received`, `cheers_sent` は未実装
   - Phase 10以降で検討と明記

### 修正すべき情報

- 「68種類」→「67種類」に訂正

---

以上で追加調査を完了します。
