// scripts/seedTemplates.ts
// カードテンプレートをFirestoreに登録するスクリプト

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, Timestamp } from 'firebase/firestore';
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

// カードテンプレートデータ
// NOTE: L3はすべて {L2}:other に統一
const templates = [
  // ========================================
  // physical_health:aerobic (有酸素運動)
  // ========================================
  {
    template_id: 'template_health_exercise_walking_1', // Keep ID stable
    category_l1: 'physical_health',
    category_l2: 'physical_health:aerobic',
    category_l3: 'physical_health:aerobic:other',
    title_ja: 'ウォーキング10分',
    title_en: '10min Walking',
    description_ja: '毎日10分のウォーキング',
    icon: '🚶',
    sort_order: 10,
    is_official: true,
    is_active: true,
  },

  // ========================================
  // physical_health:muscle (筋トレ)
  // ========================================
  {
    template_id: 'template_health_exercise_muscle_training_1',
    category_l1: 'physical_health',
    category_l2: 'physical_health:muscle',
    category_l3: 'physical_health:muscle:other',
    title_ja: '毎日スクワット1回',
    title_en: 'Daily 1 Squat',
    description_ja: '1分で終わる習慣：スクワットを1回だけ',
    icon: '💪',
    sort_order: 10,
    is_official: true,
    is_active: true,
  },
  {
    template_id: 'template_health_exercise_muscle_training_2',
    category_l1: 'physical_health',
    category_l2: 'physical_health:muscle',
    category_l3: 'physical_health:muscle:other',
    title_ja: '腕立て伏せ10回',
    title_en: '10 Push-ups',
    description_ja: '毎日10回の腕立て伏せ',
    icon: '💪',
    sort_order: 20,
    is_official: true,
    is_active: true,
  },

  // ========================================
  // physical_health:flexibility (柔軟)
  // ========================================
  {
    template_id: 'template_health_exercise_stretching_1',
    category_l1: 'physical_health',
    category_l2: 'physical_health:flexibility',
    category_l3: 'physical_health:flexibility:other',
    title_ja: '毎朝ストレッチ',
    title_en: 'Morning Stretch',
    description_ja: '1分で終わる習慣：朝起きたらストレッチ',
    icon: '🧘',
    sort_order: 10,
    is_official: true,
    is_active: true,
  },

  // ========================================
  // physical_health:nutrition (食事・栄養)
  // ========================================
  {
    template_id: 'template_health_diet_water_1',
    category_l1: 'physical_health',
    category_l2: 'physical_health:nutrition',
    category_l3: 'physical_health:nutrition:other',
    title_ja: '水を1杯飲む',
    title_en: 'Drink 1 Glass of Water',
    description_ja: '1分で終わる習慣：起床後に水を1杯',
    icon: '💧',
    sort_order: 10,
    is_official: true,
    is_active: true,
  },
  {
    template_id: 'template_health_diet_healthy_1',
    category_l1: 'physical_health',
    category_l2: 'physical_health:nutrition',
    category_l3: 'physical_health:nutrition:other',
    title_ja: '野菜を食べる',
    title_en: 'Eat Vegetables',
    description_ja: '毎食野菜を食べる',
    icon: '🥗',
    sort_order: 20,
    is_official: true,
    is_active: true,
  },

  // ========================================
  // physical_health:sleep (睡眠)
  // ========================================
  {
    template_id: 'template_health_sleep_early_1',
    category_l1: 'physical_health',
    category_l2: 'physical_health:sleep',
    category_l3: 'physical_health:sleep:other',
    title_ja: '23時に寝る準備',
    title_en: 'Prepare for Bed at 11pm',
    description_ja: '23時に寝る準備を始める',
    icon: '🌙',
    sort_order: 10,
    is_official: true,
    is_active: true,
  },
  {
    template_id: 'template_lifestyle_morning_early_wake_1', // Moved to Sleep/Rest context (could also be Routine)
    category_l1: 'physical_health',
    category_l2: 'physical_health:sleep',
    category_l3: 'physical_health:sleep:other',
    title_ja: '6時に起きる',
    title_en: 'Wake up at 6am',
    description_ja: '毎朝6時に起床する',
    icon: '⏰',
    sort_order: 20,
    is_official: true,
    is_active: true,
  },

  // ========================================
  // productivity_learning:study (勉強)
  // ========================================
  {
    template_id: 'template_learning_language_english_1',
    category_l1: 'productivity_learning',
    category_l2: 'productivity_learning:study',
    category_l3: 'productivity_learning:study:other',
    title_ja: '英語アプリを開く',
    title_en: 'Open English App',
    description_ja: '1分で終わる習慣：英語学習アプリを開くだけ',
    icon: '🇬🇧',
    sort_order: 10,
    is_official: true,
    is_active: true,
  },
  {
    template_id: 'template_learning_language_english_2',
    category_l1: 'productivity_learning',
    category_l2: 'productivity_learning:study',
    category_l3: 'productivity_learning:study:other',
    title_ja: '英語学習',
    title_en: 'English Study',
    description_ja: '毎日英語を学習する',
    icon: '📚',
    sort_order: 20,
    is_official: true,
    is_active: true,
  },
  {
    template_id: 'template_learning_language_english_3',
    category_l1: 'productivity_learning',
    category_l2: 'productivity_learning:study',
    category_l3: 'productivity_learning:study:other',
    title_ja: '単語帳を1ページ',
    title_en: '1 Page of Vocabulary',
    description_ja: '1分で終わる習慣：単語帳を1ページだけ',
    icon: '📖',
    sort_order: 30,
    is_official: true,
    is_active: true,
  },

  // ========================================
  // hobbies_creativity:input (インプット)
  // ========================================
  {
    template_id: 'template_learning_reading_book_1',
    category_l1: 'hobbies_creativity',        // Moved to Hobbies/Input
    category_l2: 'hobbies_creativity:input',
    category_l3: 'hobbies_creativity:input:other',
    title_ja: '本を1ページ読む',
    title_en: 'Read 1 Page',
    description_ja: '1分で終わる習慣：本を1ページだけ読む',
    icon: '📚',
    sort_order: 10,
    is_official: true,
    is_active: true,
  },
  {
    template_id: 'template_learning_reading_book_2',
    category_l1: 'hobbies_creativity',
    category_l2: 'hobbies_creativity:input',
    category_l3: 'hobbies_creativity:input:other',
    title_ja: '読書10分',
    title_en: '10min Reading',
    description_ja: '毎日10分の読書',
    icon: '📖',
    sort_order: 20,
    is_official: true,
    is_active: true,
  },

  // ========================================
  // productivity_learning:career_dev (キャリア)
  // ========================================
  {
    template_id: 'template_learning_skill_programming_1',
    category_l1: 'productivity_learning',
    category_l2: 'productivity_learning:career_dev',
    category_l3: 'productivity_learning:career_dev:other',
    title_ja: 'プログラミング学習',
    title_en: 'Programming Study',
    description_ja: '毎日プログラミングを学習する',
    icon: '💻',
    sort_order: 10,
    is_official: true,
    is_active: true,
  },

  // ========================================
  // living_household:cleaning (掃除)
  // ========================================
  {
    template_id: 'template_lifestyle_organization_cleaning_1',
    category_l1: 'living_household',
    category_l2: 'living_household:cleaning',
    category_l3: 'living_household:cleaning:other',
    title_ja: '1箇所だけ掃除',
    title_en: 'Clean 1 Spot',
    description_ja: '1分で終わる習慣：1箇所だけ片付ける',
    icon: '🧹',
    sort_order: 10,
    is_official: true,
    is_active: true,
  },

  // ========================================
  // finance:expense_log (支出記録)
  // ========================================
  {
    template_id: 'template_lifestyle_finance_expense_1',
    category_l1: 'finance',
    category_l2: 'finance:expense_log',
    category_l3: 'finance:expense_log:other',
    title_ja: '支出を記録',
    title_en: 'Log Expenses',
    description_ja: '1分で終わる習慣：今日の支出を記録',
    icon: '📝',
    sort_order: 10,
    is_official: true,
    is_active: true,
  },

  // ========================================
  // mental_health:reflection (日記)
  // ========================================
  {
    template_id: 'template_creative_writing_journaling_1',
    category_l1: 'mental_health',
    category_l2: 'mental_health:reflection',
    category_l3: 'mental_health:reflection:other',
    title_ja: '日記を1行書く',
    title_en: 'Write 1 Line Journal',
    description_ja: '1分で終わる習慣：1行だけ日記を書く',
    icon: '📔',
    sort_order: 10,
    is_official: true,
    is_active: true,
  },
  {
    template_id: 'template_creative_writing_journaling_2',
    category_l1: 'mental_health',
    category_l2: 'mental_health:reflection',
    category_l3: 'mental_health:reflection:other',
    title_ja: '日記を書く',
    title_en: 'Write Journal',
    description_ja: '毎日日記を書く',
    icon: '📓',
    sort_order: 20,
    is_official: true,
    is_active: true,
  },

  // ========================================
  // hobbies_creativity:creative (創作)
  // ========================================
  {
    template_id: 'template_creative_art_drawing_1',
    category_l1: 'hobbies_creativity',
    category_l2: 'hobbies_creativity:creative',
    category_l3: 'hobbies_creativity:creative:other',
    title_ja: '1分スケッチ',
    title_en: '1min Sketch',
    description_ja: '1分で終わる習慣：簡単なスケッチ',
    icon: '🖌️',
    sort_order: 10,
    is_official: true,
    is_active: true,
  },

  // ========================================
  // mental_health:mindfulness (マインドフルネス)
  // ========================================
  {
    template_id: 'template_mindfulness_meditation_daily_1',
    category_l1: 'mental_health',
    category_l2: 'mental_health:mindfulness',
    category_l3: 'mental_health:mindfulness:other',
    title_ja: '1分瞑想',
    title_en: '1min Meditation',
    description_ja: '1分で終わる習慣：1分間の瞑想',
    icon: '🧘',
    sort_order: 10,
    is_official: true,
    is_active: true,
  },
  {
    template_id: 'template_mindfulness_meditation_daily_2',
    category_l1: 'mental_health',
    category_l2: 'mental_health:mindfulness',
    category_l3: 'mental_health:mindfulness:other',
    title_ja: '瞑想5分',
    title_en: '5min Meditation',
    description_ja: '毎日5分の瞑想',
    icon: '🧘',
    sort_order: 20,
    is_official: true,
    is_active: true,
  },

  // ========================================
  // mental_health:gratitude (感謝)
  // ========================================
  {
    template_id: 'template_mindfulness_gratitude_log_1',
    category_l1: 'mental_health',
    category_l2: 'mental_health:gratitude',
    category_l3: 'mental_health:gratitude:other',
    title_ja: '感謝を1つ書く',
    title_en: 'Write 1 Gratitude',
    description_ja: '1分で終わる習慣：感謝したことを1つ書く',
    icon: '🙏',
    sort_order: 10,
    is_official: true,
    is_active: true,
  },
];

async function seedTemplates() {
  console.log('🌱 カードテンプレートの登録を開始します...');
  console.log(`📊 登録するテンプレート数: ${templates.length}`);

  let successCount = 0;
  let errorCount = 0;

  const now = Timestamp.now();

  for (const template of templates) {
    try {
      const templateRef = doc(db, 'card_templates', template.template_id);
      await setDoc(templateRef, {
        ...template,
        created_at: now,
      });
      console.log(`✅ ${template.template_id} (${template.title_ja})`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${template.template_id} の登録に失敗:`, error);
      errorCount++;
    }
  }

  console.log('\n📊 登録結果:');
  console.log(`  成功: ${successCount}`);
  console.log(`  失敗: ${errorCount}`);
  console.log('✨ カードテンプレートの登録が完了しました！');
}

// 実行
seedTemplates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  });
