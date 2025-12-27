// scripts/cleanupOldTemplates.ts
// 旧テンプレートを削除するスクリプト

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

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

// 旧テンプレートID（削除対象）
const oldTemplateIds = [
    'template_health_exercise_walking_1',
    'template_health_exercise_muscle_training_1',
    'template_health_exercise_muscle_training_2',
    'template_health_exercise_stretching_1',
    'template_health_diet_water_1',
    'template_health_diet_healthy_1',
    'template_health_sleep_early_1',
    'template_lifestyle_morning_early_wake_1',
    'template_learning_language_english_1',
    'template_learning_language_english_2',
    'template_learning_language_english_3',
    'template_learning_reading_book_1',
    'template_learning_reading_book_2',
    'template_learning_skill_programming_1',
    'template_lifestyle_organization_cleaning_1',
    'template_lifestyle_finance_expense_1',
    'template_creative_writing_journaling_1',
    'template_creative_writing_journaling_2',
    'template_creative_art_drawing_1',
    'template_mindfulness_meditation_daily_1',
    'template_mindfulness_meditation_daily_2',
    'template_mindfulness_gratitude_log_1',
];

async function cleanupOldTemplates() {
    console.log('🧹 旧テンプレートの削除を開始します...');
    console.log(`📊 削除対象: ${oldTemplateIds.length}件`);

    let successCount = 0;
    let errorCount = 0;

    for (const templateId of oldTemplateIds) {
        try {
            await deleteDoc(doc(db, 'card_templates', templateId));
            console.log(`✅ 削除: ${templateId}`);
            successCount++;
        } catch (error) {
            console.error(`❌ ${templateId} の削除に失敗:`, error);
            errorCount++;
        }
    }

    console.log('\n📊 削除結果:');
    console.log(`  成功: ${successCount}`);
    console.log(`  失敗: ${errorCount}`);
    console.log('✨ クリーンアップ完了！');
}

cleanupOldTemplates()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ エラー:', error);
        process.exit(1);
    });
