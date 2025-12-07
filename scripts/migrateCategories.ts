// scripts/migrateCategories.ts
// 既存の cards, card_templates を新カテゴリ体系に移行し、matching_pools を再生成するスクリプト

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc, Timestamp, query, where, serverTimestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .envファイルを読み込み
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Firebase設定
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// マッピング定義（旧カテゴリ -> 新カテゴリ）
// L1マッピング
const L1_MAP: Record<string, string> = {
    health: "physical_health",
    learning: "productivity_learning",
    lifestyle: "living_household",
    creative: "hobbies_creativity",
    mindfulness: "mental_health",
};

// L2マッピング (旧L2 -> 新L2)
const L2_MAP: Record<string, string> = {
    // health
    "health_exercise": "physical_health:aerobic", // 暫定で有酸素へ（下流のL3マッピングで補正）
    "health_diet": "physical_health:nutrition",
    "health_sleep": "physical_health:sleep",

    // learning
    "learning_language": "productivity_learning:study",
    "learning_reading": "hobbies_creativity:input", // 読書は趣味インプットへ
    "learning_skill": "productivity_learning:career_dev",

    // lifestyle
    "lifestyle_morning": "living_household:routine", // 朝活は生活ルーティンへ（あるいは早寝ならsleep）
    "lifestyle_organization": "living_household:cleaning", // 掃除
    "lifestyle_finance": "finance:expense_log", // 家計簿

    // creative
    "creative_writing": "mental_health:reflection", // 日記系はメンタルヘルスへ（ブログなどの創作は別だが、現状テンプレートは日記寄り）
    "creative_art": "hobbies_creativity:creative",
    "creative_music": "hobbies_creativity:skills",

    // mindfulness
    "mindfulness_meditation": "mental_health:mindfulness",
    "mindfulness_gratitude": "mental_health:gratitude",
    "mindfulness_mental_health": "mental_health:stress_care",
};

// L3マッピング（旧L3 -> 新L2）... 新L3は ${新L2}:other になる
// 特殊な変換が必要なものはここでL2を上書き定義
const L3_TO_L2_OVERRIDE: Record<string, string> = {
    "health_exercise_muscle_training": "physical_health:muscle",
    "health_exercise_stretching": "physical_health:flexibility",

    // 朝活：早起き は sleepContextでもいいが、routineContextでもいい。指示書のテンプレートマッピングでは Sleepだった
    "lifestyle_morning_early_wake": "physical_health:sleep",

    // 読書：スキルアップ系なら study だが、hobby input に寄せる
};

async function migrateCollection(colName: "cards" | "card_templates") {
    console.log(`\n🔄 Migrating ${colName}...`);
    const snap = await getDocs(collection(db, colName));
    console.log(`${colName}: ${snap.size} docs found`);

    const batchSize = 300;
    let batch = writeBatch(db);
    let opCount = 0;
    let updatedCount = 0;

    for (const docSnap of snap.docs) {
        const data = docSnap.data();

        // 既に新体系（または無効データ）ならスキップ（コロンが含まれていれば新IDとみなす簡易判定）
        if (data.category_l1 && (
            data.category_l1 === "physical_health" ||
            data.category_l1 === "mental_health" ||
            data.category_l1 === "productivity_learning" ||
            data.category_l1 === "living_household" ||
            data.category_l1 === "finance" ||
            data.category_l1 === "relationships" ||
            data.category_l1 === "hobbies_creativity"
        )) {
            // 既に移行済みとみなす
            // console.log(`Skipping ${docSnap.id} (already migrated)`);
            continue;
        }

        const oldL1 = data.category_l1;
        const oldL2 = data.category_l2;
        const oldL3 = data.category_l3;

        if (!oldL1) continue;

        let newL1 = L1_MAP[oldL1];
        let newL2 = L3_TO_L2_OVERRIDE[oldL3] || L2_MAP[oldL2];

        // データ不整合などでのフォールバック
        if (!newL1) {
            console.warn(`[WARN] Unknown L1: ${oldL1} (doc ${docSnap.id})`);
            continue;
        }

        // L2が決まらない場合のフォールバック（例：L1がマッピングできたがL2がない）
        if (!newL2) {
            // 暫定：新L1に対応する適当なL2を割り当てるか、警告を出してスキップ
            console.warn(`[WARN] No L2 mapping for ${oldL2} (doc ${docSnap.id})`);
            continue;
        }

        // L1の整合性再確認（L2 overrideでL1も変わるケースは稀だが、念のためL2のprefixからL1を逆算も可能）
        // 今回の仕様では L2 ID = "L1:suffix" なので、L2が決まればL1も自明。
        const derivedL1 = newL2.split(':')[0];
        if (derivedL1 !== newL1) {
            // マッピング表の不整合補正：L1もL2に合わせて修正
            // console.log(`Correction: L1 ${newL1} -> ${derivedL1} for ${newL2}`);
            newL1 = derivedL1;
        }

        const newL3 = `${newL2}:other`;

        batch.update(docSnap.ref, {
            category_l1: newL1,
            category_l2: newL2,
            category_l3: newL3,
        });

        opCount++;
        updatedCount++;

        if (opCount % batchSize === 0) {
            await batch.commit();
            batch = writeBatch(db);
            console.log(`Committed ${opCount} updates...`);
        }
    }

    if (opCount % batchSize !== 0) {
        await batch.commit();
    }

    console.log(`✅ Finished migrating ${colName}: ${updatedCount} docs updated`);
}


type MatchingPoolCard = {
    card_id: string;
    owner_uid: string;
    title?: string;
    current_streak: number;
    last_log_date: string;
    total_logs?: number;
    is_comeback?: boolean;
};

async function rebuildMatchingPools() {
    console.log('\n🔄 Rebuilding matching_pools...');

    // 1. アクティブなカードを全取得（新カテゴリ適用済みであることを前提）
    // is_archived フラグがないドキュメントも考慮（undefined なら active 扱いなど）
    // 念のため全件取得してJS側でフィルタ
    const cardsSnap = await getDocs(collection(db, "cards"));

    const pools: Record<string, MatchingPoolCard[]> = {};

    for (const docSnap of cardsSnap.docs) {
        const data = docSnap.data();

        // アーカイブ済みは除外
        if (data.status === 'archived' || data.is_active === false) continue;

        const l3 = data.category_l3; // 新カテゴリID
        if (!l3) continue;

        if (!pools[l3]) pools[l3] = [];

        pools[l3].push({
            card_id: data.card_id || "unknown_card",
            owner_uid: data.owner_uid || "unknown_owner",
            title: data.title || "", // undefined対策済
            current_streak: data.current_streak ?? 0,
            last_log_date: data.last_log_date || "",
            total_logs: data.total_logs ?? 0,
            is_comeback: false // 簡易的にfalse
        });
    }

    // 2. 既存プールの削除
    const poolSnap = await getDocs(collection(db, "matching_pools"));
    const delBatch = writeBatch(db);
    poolSnap.docs.forEach(d => delBatch.delete(d.ref));
    await delBatch.commit();
    console.log('🗑️  Existing matching_pools deleted.');

    // 3. 新プールの作成
    const batch = writeBatch(db);
    let batchCount = 0;

    for (const [l3, cards] of Object.entries(pools)) {
        const ref = doc(db, "matching_pools", l3);

        // NOTE: categoriesから日本語名を取得して入れるのがベストだが、ここでは省略
        batch.set(ref, {
            category_l3: l3,
            category_l3_name_ja: "Other", // 暫定
            active_cards: cards,
            updated_at: serverTimestamp(),
        });

        batchCount++;
        if (batchCount >= 400) { // Firestore batch limit safety
            await batch.commit();
            batchCount = 0;
        }
    }

    if (batchCount > 0) {
        await batch.commit();
    }

    console.log(`✅ Rebuilt matching_pools per category.`);
}

async function main() {
    // 1. カテゴリマスタ移行（これは seedCategories.ts でやるのでスキップ）

    // 2. テンプレート移行（seedTemplates.ts で上書きするのでスキップ推奨だが、
    //    もし既存のテンプレートIDを維持しつつ内容を変えたいなら migrateCollection('card_templates') を実行）
    //    今回は instructions に「seedデータ更新」とあるので、seed実行で十分。
    //    ただし念のため card_templates のマイグレーションも実装しておく（既存環境維持のため）
    await migrateCollection("card_templates");

    // 3. ユーザーカード移行
    await migrateCollection("cards");

    // 4. マッチングプール再生成
    await rebuildMatchingPools();

    console.log('\n✨ All migrations completed successfully.');
    process.exit(0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
