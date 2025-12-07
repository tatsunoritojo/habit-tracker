// scripts/cleanupLegacyCards.ts
// 旧カテゴリ体系のカード（マイグレーション漏れなど）を削除するスクリプト

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .envファイルを読み込み
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 新L1カテゴリIDリスト
const VALID_L1_IDS = [
    "physical_health",
    "mental_health",
    "productivity_learning",
    "living_household",
    "finance",
    "relationships",
    "hobbies_creativity",
];

async function cleanupLegacyCards() {
    console.log('🧹 Cleaning up legacy cards...');

    // 全カード取得
    const snap = await getDocs(collection(db, "cards"));
    console.log(`Found ${snap.size} total cards.`);

    let batch = writeBatch(db);
    let count = 0;
    let deletedCount = 0;

    for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const l1 = data.category_l1;

        // 新L1リストに含まれていなければ削除対象
        // (undefinedの場合も削除)
        if (!l1 || !VALID_L1_IDS.includes(l1)) {
            console.log(`Deleting legacy card: ${docSnap.id} (L1: ${l1}, Title: ${data.title})`);
            batch.delete(docSnap.ref);
            count++;
            deletedCount++;
        }

        if (count >= 300) {
            await batch.commit();
            console.log(`Committed ${count} deletions...`);
            batch = writeBatch(db);
            count = 0;
        }
    }

    if (count > 0) {
        await batch.commit();
    }

    console.log(`✅ Cleanup complete. Deleted ${deletedCount} legacy cards.`);
}

cleanupLegacyCards()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
