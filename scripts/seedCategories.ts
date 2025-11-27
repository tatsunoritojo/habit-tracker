// scripts/seedCategories.ts
// カテゴリマスタをFirestoreに登録するスクリプト

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
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

// カテゴリデータ（MVP仕様書に基づく）
const categories = [
  // ========================================
  // L1: health（健康）
  // ========================================
  {
    category_id: 'health',
    level: 1,
    parent_id: null,
    name_ja: '健康',
    name_en: 'Health',
    icon: '💪',
    sort_order: 1,
    is_active: true,
  },

  // L2: health > exercise（運動）
  {
    category_id: 'health_exercise',
    level: 2,
    parent_id: 'health',
    name_ja: '運動',
    name_en: 'Exercise',
    icon: '🏃',
    sort_order: 1,
    is_active: true,
  },
  // L3: health > exercise > *
  {
    category_id: 'health_exercise_muscle_training',
    level: 3,
    parent_id: 'health_exercise',
    name_ja: '筋トレ',
    name_en: 'Muscle Training',
    icon: '💪',
    sort_order: 1,
    is_active: true,
  },
  {
    category_id: 'health_exercise_running',
    level: 3,
    parent_id: 'health_exercise',
    name_ja: 'ランニング',
    name_en: 'Running',
    icon: '🏃',
    sort_order: 2,
    is_active: true,
  },
  {
    category_id: 'health_exercise_walking',
    level: 3,
    parent_id: 'health_exercise',
    name_ja: 'ウォーキング',
    name_en: 'Walking',
    icon: '🚶',
    sort_order: 3,
    is_active: true,
  },
  {
    category_id: 'health_exercise_stretching',
    level: 3,
    parent_id: 'health_exercise',
    name_ja: 'ストレッチ',
    name_en: 'Stretching',
    icon: '🧘',
    sort_order: 4,
    is_active: true,
  },
  {
    category_id: 'health_exercise_yoga',
    level: 3,
    parent_id: 'health_exercise',
    name_ja: 'ヨガ',
    name_en: 'Yoga',
    icon: '🧘',
    sort_order: 5,
    is_active: true,
  },

  // L2: health > diet（食事）
  {
    category_id: 'health_diet',
    level: 2,
    parent_id: 'health',
    name_ja: '食事',
    name_en: 'Diet',
    icon: '🍎',
    sort_order: 2,
    is_active: true,
  },
  // L3: health > diet > *
  {
    category_id: 'health_diet_healthy_eating',
    level: 3,
    parent_id: 'health_diet',
    name_ja: '健康的な食事',
    name_en: 'Healthy Eating',
    icon: '🥗',
    sort_order: 1,
    is_active: true,
  },
  {
    category_id: 'health_diet_water_intake',
    level: 3,
    parent_id: 'health_diet',
    name_ja: '水分摂取',
    name_en: 'Water Intake',
    icon: '💧',
    sort_order: 2,
    is_active: true,
  },

  // L2: health > sleep（睡眠）
  {
    category_id: 'health_sleep',
    level: 2,
    parent_id: 'health',
    name_ja: '睡眠',
    name_en: 'Sleep',
    icon: '😴',
    sort_order: 3,
    is_active: true,
  },
  // L3: health > sleep > *
  {
    category_id: 'health_sleep_early_sleep',
    level: 3,
    parent_id: 'health_sleep',
    name_ja: '早寝',
    name_en: 'Early Sleep',
    icon: '🌙',
    sort_order: 1,
    is_active: true,
  },
  {
    category_id: 'health_sleep_sleep_log',
    level: 3,
    parent_id: 'health_sleep',
    name_ja: '睡眠記録',
    name_en: 'Sleep Log',
    icon: '📊',
    sort_order: 2,
    is_active: true,
  },

  // ========================================
  // L1: learning（学習）
  // ========================================
  {
    category_id: 'learning',
    level: 1,
    parent_id: null,
    name_ja: '学習',
    name_en: 'Learning',
    icon: '📚',
    sort_order: 2,
    is_active: true,
  },

  // L2: learning > language（語学）
  {
    category_id: 'learning_language',
    level: 2,
    parent_id: 'learning',
    name_ja: '語学',
    name_en: 'Language',
    icon: '🗣️',
    sort_order: 1,
    is_active: true,
  },
  // L3: learning > language > *
  {
    category_id: 'learning_language_english',
    level: 3,
    parent_id: 'learning_language',
    name_ja: '英語',
    name_en: 'English',
    icon: '🇬🇧',
    sort_order: 1,
    is_active: true,
  },
  {
    category_id: 'learning_language_chinese',
    level: 3,
    parent_id: 'learning_language',
    name_ja: '中国語',
    name_en: 'Chinese',
    icon: '🇨🇳',
    sort_order: 2,
    is_active: true,
  },
  {
    category_id: 'learning_language_other',
    level: 3,
    parent_id: 'learning_language',
    name_ja: 'その他の言語',
    name_en: 'Other Language',
    icon: '🌍',
    sort_order: 3,
    is_active: true,
  },

  // L2: learning > reading（読書）
  {
    category_id: 'learning_reading',
    level: 2,
    parent_id: 'learning',
    name_ja: '読書',
    name_en: 'Reading',
    icon: '📖',
    sort_order: 2,
    is_active: true,
  },
  // L3: learning > reading > *
  {
    category_id: 'learning_reading_book',
    level: 3,
    parent_id: 'learning_reading',
    name_ja: '読書',
    name_en: 'Book Reading',
    icon: '📚',
    sort_order: 1,
    is_active: true,
  },
  {
    category_id: 'learning_reading_article',
    level: 3,
    parent_id: 'learning_reading',
    name_ja: '記事読み',
    name_en: 'Article Reading',
    icon: '📰',
    sort_order: 2,
    is_active: true,
  },

  // L2: learning > skill（スキル）
  {
    category_id: 'learning_skill',
    level: 2,
    parent_id: 'learning',
    name_ja: 'スキル',
    name_en: 'Skill',
    icon: '🛠️',
    sort_order: 3,
    is_active: true,
  },
  // L3: learning > skill > *
  {
    category_id: 'learning_skill_programming',
    level: 3,
    parent_id: 'learning_skill',
    name_ja: 'プログラミング',
    name_en: 'Programming',
    icon: '💻',
    sort_order: 1,
    is_active: true,
  },
  {
    category_id: 'learning_skill_certification',
    level: 3,
    parent_id: 'learning_skill',
    name_ja: '資格勉強',
    name_en: 'Certification',
    icon: '📜',
    sort_order: 2,
    is_active: true,
  },

  // ========================================
  // L1: lifestyle（生活習慣）
  // ========================================
  {
    category_id: 'lifestyle',
    level: 1,
    parent_id: null,
    name_ja: '生活習慣',
    name_en: 'Lifestyle',
    icon: '🏠',
    sort_order: 3,
    is_active: true,
  },

  // L2: lifestyle > morning（朝活）
  {
    category_id: 'lifestyle_morning',
    level: 2,
    parent_id: 'lifestyle',
    name_ja: '朝活',
    name_en: 'Morning',
    icon: '🌅',
    sort_order: 1,
    is_active: true,
  },
  // L3: lifestyle > morning > *
  {
    category_id: 'lifestyle_morning_early_wake',
    level: 3,
    parent_id: 'lifestyle_morning',
    name_ja: '早起き',
    name_en: 'Early Wake',
    icon: '⏰',
    sort_order: 1,
    is_active: true,
  },
  {
    category_id: 'lifestyle_morning_morning_routine',
    level: 3,
    parent_id: 'lifestyle_morning',
    name_ja: '朝のルーティン',
    name_en: 'Morning Routine',
    icon: '☕',
    sort_order: 2,
    is_active: true,
  },

  // L2: lifestyle > organization（整理整頓）
  {
    category_id: 'lifestyle_organization',
    level: 2,
    parent_id: 'lifestyle',
    name_ja: '整理整頓',
    name_en: 'Organization',
    icon: '🧹',
    sort_order: 2,
    is_active: true,
  },
  // L3: lifestyle > organization > *
  {
    category_id: 'lifestyle_organization_cleaning',
    level: 3,
    parent_id: 'lifestyle_organization',
    name_ja: '掃除',
    name_en: 'Cleaning',
    icon: '🧹',
    sort_order: 1,
    is_active: true,
  },
  {
    category_id: 'lifestyle_organization_declutter',
    level: 3,
    parent_id: 'lifestyle_organization',
    name_ja: '断捨離',
    name_en: 'Declutter',
    icon: '📦',
    sort_order: 2,
    is_active: true,
  },

  // L2: lifestyle > finance（お金）
  {
    category_id: 'lifestyle_finance',
    level: 2,
    parent_id: 'lifestyle',
    name_ja: 'お金',
    name_en: 'Finance',
    icon: '💰',
    sort_order: 3,
    is_active: true,
  },
  // L3: lifestyle > finance > *
  {
    category_id: 'lifestyle_finance_saving',
    level: 3,
    parent_id: 'lifestyle_finance',
    name_ja: '貯金',
    name_en: 'Saving',
    icon: '🐷',
    sort_order: 1,
    is_active: true,
  },
  {
    category_id: 'lifestyle_finance_expense_log',
    level: 3,
    parent_id: 'lifestyle_finance',
    name_ja: '支出記録',
    name_en: 'Expense Log',
    icon: '📝',
    sort_order: 2,
    is_active: true,
  },

  // ========================================
  // L1: creative（創作）
  // ========================================
  {
    category_id: 'creative',
    level: 1,
    parent_id: null,
    name_ja: '創作',
    name_en: 'Creative',
    icon: '🎨',
    sort_order: 4,
    is_active: true,
  },

  // L2: creative > writing（執筆）
  {
    category_id: 'creative_writing',
    level: 2,
    parent_id: 'creative',
    name_ja: '執筆',
    name_en: 'Writing',
    icon: '✍️',
    sort_order: 1,
    is_active: true,
  },
  // L3: creative > writing > *
  {
    category_id: 'creative_writing_journaling',
    level: 3,
    parent_id: 'creative_writing',
    name_ja: '日記',
    name_en: 'Journaling',
    icon: '📔',
    sort_order: 1,
    is_active: true,
  },
  {
    category_id: 'creative_writing_blog',
    level: 3,
    parent_id: 'creative_writing',
    name_ja: 'ブログ',
    name_en: 'Blog Writing',
    icon: '💻',
    sort_order: 2,
    is_active: true,
  },

  // L2: creative > art（アート）
  {
    category_id: 'creative_art',
    level: 2,
    parent_id: 'creative',
    name_ja: 'アート',
    name_en: 'Art',
    icon: '🎨',
    sort_order: 2,
    is_active: true,
  },
  // L3: creative > art > *
  {
    category_id: 'creative_art_drawing',
    level: 3,
    parent_id: 'creative_art',
    name_ja: '絵を描く',
    name_en: 'Drawing',
    icon: '🖌️',
    sort_order: 1,
    is_active: true,
  },
  {
    category_id: 'creative_art_photography',
    level: 3,
    parent_id: 'creative_art',
    name_ja: '写真',
    name_en: 'Photography',
    icon: '📷',
    sort_order: 2,
    is_active: true,
  },

  // L2: creative > music（音楽）
  {
    category_id: 'creative_music',
    level: 2,
    parent_id: 'creative',
    name_ja: '音楽',
    name_en: 'Music',
    icon: '🎵',
    sort_order: 3,
    is_active: true,
  },
  // L3: creative > music > *
  {
    category_id: 'creative_music_instrument',
    level: 3,
    parent_id: 'creative_music',
    name_ja: '楽器練習',
    name_en: 'Instrument Practice',
    icon: '🎸',
    sort_order: 1,
    is_active: true,
  },

  // ========================================
  // L1: mindfulness（マインドフルネス）
  // ========================================
  {
    category_id: 'mindfulness',
    level: 1,
    parent_id: null,
    name_ja: 'マインドフルネス',
    name_en: 'Mindfulness',
    icon: '🧘',
    sort_order: 5,
    is_active: true,
  },

  // L2: mindfulness > meditation（瞑想）
  {
    category_id: 'mindfulness_meditation',
    level: 2,
    parent_id: 'mindfulness',
    name_ja: '瞑想',
    name_en: 'Meditation',
    icon: '🧘',
    sort_order: 1,
    is_active: true,
  },
  // L3: mindfulness > meditation > *
  {
    category_id: 'mindfulness_meditation_daily',
    level: 3,
    parent_id: 'mindfulness_meditation',
    name_ja: '毎日の瞑想',
    name_en: 'Daily Meditation',
    icon: '🧘',
    sort_order: 1,
    is_active: true,
  },

  // L2: mindfulness > gratitude（感謝）
  {
    category_id: 'mindfulness_gratitude',
    level: 2,
    parent_id: 'mindfulness',
    name_ja: '感謝',
    name_en: 'Gratitude',
    icon: '🙏',
    sort_order: 2,
    is_active: true,
  },
  // L3: mindfulness > gratitude > *
  {
    category_id: 'mindfulness_gratitude_log',
    level: 3,
    parent_id: 'mindfulness_gratitude',
    name_ja: '感謝日記',
    name_en: 'Gratitude Log',
    icon: '📓',
    sort_order: 1,
    is_active: true,
  },

  // L2: mindfulness > mental_health（メンタルヘルス）
  {
    category_id: 'mindfulness_mental_health',
    level: 2,
    parent_id: 'mindfulness',
    name_ja: 'メンタルヘルス',
    name_en: 'Mental Health',
    icon: '💚',
    sort_order: 3,
    is_active: true,
  },
  // L3: mindfulness > mental_health > *
  {
    category_id: 'mindfulness_mental_health_mood_log',
    level: 3,
    parent_id: 'mindfulness_mental_health',
    name_ja: '気分記録',
    name_en: 'Mood Log',
    icon: '😊',
    sort_order: 1,
    is_active: true,
  },
];

async function seedCategories() {
  console.log('🌱 カテゴリマスタの登録を開始します...');
  console.log(`📊 登録するカテゴリ数: ${categories.length}`);

  let successCount = 0;
  let errorCount = 0;

  for (const category of categories) {
    try {
      const categoryRef = doc(db, 'categories', category.category_id);
      await setDoc(categoryRef, category);
      console.log(`✅ ${category.category_id} (${category.name_ja})`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${category.category_id} の登録に失敗:`, error);
      errorCount++;
    }
  }

  console.log('\n📊 登録結果:');
  console.log(`  成功: ${successCount}`);
  console.log(`  失敗: ${errorCount}`);
  console.log('✨ カテゴリマスタの登録が完了しました！');
}

// 実行
seedCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  });
