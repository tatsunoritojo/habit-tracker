// scripts/deleteOldCategories.ts
// 旧カテゴリ（health, learning, lifestyle, creative, mindfulness）をFirestoreから削除するスクリプト

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, query, where } from 'firebase/firestore';
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

// 削除対象の旧カテゴリID
const OLD_CATEGORY_IDS = [
    'health',
    'learning',
    'lifestyle',
    'creative',
    'mindfulness'
];

async function deleteOldCategories() {
    console.log('🗑️  Deleting old category documents...');

    const snap = await getDocs(collection(db, 'categories'));
    console.log(`Found ${snap.size} total category documents.`);

    let batch = writeBatch(db);
    let count = 0;
    let deletedCount = 0;

    for (const docSnap of snap.docs) {
        const categoryId = docSnap.id;

        // 旧カテゴリIDまたはその子カテゴリ（health_*, learning_* など）を削除
        const isOldCategory = OLD_CATEGORY_IDS.includes(categoryId) ||
            OLD_CATEGORY_IDS.some(oldId => categoryId.startsWith(oldId + '_'));

        if (isOldCategory) {
            console.log(`Deleting: ${categoryId}`);
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

    console.log(`✅ Cleanup complete. Deleted ${deletedCount} old category documents.`);
}

deleteOldCategories()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
