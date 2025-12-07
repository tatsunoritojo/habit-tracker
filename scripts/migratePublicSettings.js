// scripts/migratePublicSettings.js
// 既存のis_publicフィールドを新しい2つのフラグに変換するマイグレーションスクリプト
// Firebase Admin SDKを使用（認証付き）

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Firebase Admin初期化
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migratePublicSettings() {
    console.log('=== 公開設定マイグレーション ===');
    console.log('Project ID:', serviceAccount.project_id);
    console.log('');

    try {
        const cardsSnapshot = await db.collection('cards').get();
        let migratedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        console.log(`合計 ${cardsSnapshot.size} 件のカードを処理します...\n`);

        for (const docSnap of cardsSnapshot.docs) {
            try {
                const data = docSnap.data();

                // すでに移行済みならスキップ
                if ('is_public_for_cheers' in data && 'is_public_for_template' in data) {
                    skippedCount++;
                    continue;
                }

                const isPublic = data.is_public || false;

                await docSnap.ref.update({
                    is_public_for_cheers: isPublic,
                    is_public_for_template: isPublic,
                    updated_at: admin.firestore.FieldValue.serverTimestamp(),
                });

                migratedCount++;
                console.log(`✓ [${migratedCount}] ${docSnap.id.substring(0, 8)}... : is_public=${isPublic} → cheers=${isPublic}, template=${isPublic}`);
            } catch (error) {
                errorCount++;
                console.error(`✗ Error updating ${docSnap.id}:`, error.message);
            }
        }

        console.log('\n=== マイグレーション完了 ===');
        console.log(`✓ 移行済み: ${migratedCount}件`);
        console.log(`⊘ スキップ: ${skippedCount}件`);
        if (errorCount > 0) {
            console.log(`✗ エラー: ${errorCount}件`);
        }
        console.log(`━ 合計: ${cardsSnapshot.size}件`);
    } catch (error) {
        console.error('マイグレーションエラー:', error);
        throw error;
    }
}

// スクリプト実行
migratePublicSettings()
    .then(() => {
        console.log('\n✓ マイグレーションが正常に完了しました');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n✗ マイグレーションに失敗しました:', error);
        process.exit(1);
    });
