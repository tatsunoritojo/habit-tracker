// scripts/migratePublicSettings.ts
// 既存のis_publicフィールドを新しい2つのフラグに変換するマイグレーションスクリプト

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';

// Firebase設定（環境変数から読み込み）
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

async function migratePublicSettings() {
    console.log('公開設定のマイグレーションを開始します...');

    try {
        const cardsSnapshot = await getDocs(collection(db, 'cards'));
        let migratedCount = 0;
        let skippedCount = 0;

        for (const docSnap of cardsSnapshot.docs) {
            const data = docSnap.data();

            // すでに移行済みならスキップ
            if ('is_public_for_cheers' in data && 'is_public_for_template' in data) {
                skippedCount++;
                continue;
            }

            const isPublic = data.is_public || false;

            await updateDoc(doc(db, 'cards', docSnap.id), {
                is_public_for_cheers: isPublic,
                is_public_for_template: isPublic,
                updated_at: Timestamp.now(),
            });

            migratedCount++;
            console.log(`✓ Card ${docSnap.id}: is_public=${isPublic} → cheers=${isPublic}, template=${isPublic}`);
        }

        console.log('\n=== マイグレーション完了 ===');
        console.log(`移行済み: ${migratedCount}件`);
        console.log(`スキップ: ${skippedCount}件`);
        console.log(`合計: ${cardsSnapshot.docs.length}件`);
    } catch (error) {
        console.error('マイグレーションエラー:', error);
        throw error;
    }
}

// スクリプト実行
migratePublicSettings()
    .then(() => {
        console.log('✓ マイグレーションが正常に完了しました');
        process.exit(0);
    })
    .catch((error) => {
        console.error('✗ マイグレーションに失敗しました:', error);
        process.exit(1);
    });
