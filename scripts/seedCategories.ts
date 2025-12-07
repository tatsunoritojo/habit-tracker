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

// カテゴリデータ定義
const L1 = [
  {
    category_id: "physical_health",
    name_ja: "からだの健康",
    name_en: "Physical Health",
    icon: "💪",
    sort_order: 10,
  },
  {
    category_id: "mental_health",
    name_ja: "こころの健康",
    name_en: "Mental Health",
    icon: "🧠",
    sort_order: 20,
  },
  {
    category_id: "productivity_learning",
    name_ja: "生産性・キャリア・学び",
    name_en: "Productivity & Learning",
    icon: "📚",
    sort_order: 30,
  },
  {
    category_id: "living_household",
    name_ja: "生活環境・家事",
    name_en: "Living & Household",
    icon: "🏠",
    sort_order: 40,
  },
  {
    category_id: "finance",
    name_ja: "お金・ファイナンス",
    name_en: "Finance",
    icon: "💰",
    sort_order: 50,
  },
  {
    category_id: "relationships",
    name_ja: "人間関係・コミュニティ",
    name_en: "Relationships & Community",
    icon: "🤝",
    sort_order: 60,
  },
  {
    category_id: "hobbies_creativity",
    name_ja: "趣味・創作・余暇",
    name_en: "Hobbies & Creativity",
    icon: "🎨",
    sort_order: 70,
  },
];

const L2 = [
  // physical_health
  { id: "physical_health:aerobic", parent: "physical_health", name_ja: "有酸素運動", name_en: "Aerobic Exercise" },
  { id: "physical_health:muscle", parent: "physical_health", name_ja: "筋トレ", name_en: "Muscle Training" },
  { id: "physical_health:flexibility", parent: "physical_health", name_ja: "柔軟・コンディショニング", name_en: "Flexibility & Conditioning" },
  { id: "physical_health:nutrition", parent: "physical_health", name_ja: "食事・栄養", name_en: "Nutrition" },
  { id: "physical_health:sleep", parent: "physical_health", name_ja: "睡眠・休息", name_en: "Sleep & Rest" },
  { id: "physical_health:selfcare", parent: "physical_health", name_ja: "セルフケア・ボディケア", name_en: "Self-care & Body Care" },
  { id: "physical_health:checkup", parent: "physical_health", name_ja: "体調チェック・記録", name_en: "Health Checkup & Log" },

  // mental_health
  { id: "mental_health:mindfulness", parent: "mental_health", name_ja: "マインドフルネス・瞑想", name_en: "Mindfulness & Meditation" },
  { id: "mental_health:reflection", parent: "mental_health", name_ja: "ふりかえり・日記", name_en: "Reflection & Diary" },
  { id: "mental_health:stress_care", parent: "mental_health", name_ja: "ストレスケア・休息", name_en: "Stress Care & Rest" },
  { id: "mental_health:counseling", parent: "mental_health", name_ja: "相談・専門家サポート", name_en: "Counseling & Support" },
  { id: "mental_health:gratitude", parent: "mental_health", name_ja: "感謝・ポジティブ体験", name_en: "Gratitude & Positive Experience" },

  // productivity_learning
  { id: "productivity_learning:study", parent: "productivity_learning", name_ja: "勉強・資格・受験", name_en: "Study & Certification" },
  { id: "productivity_learning:work_product", parent: "productivity_learning", name_ja: "仕事の生産性", name_en: "Work Productivity" },
  { id: "productivity_learning:planning", parent: "productivity_learning", name_ja: "計画・タスク管理", name_en: "Planning & Task Management" },
  { id: "productivity_learning:review", parent: "productivity_learning", name_ja: "週次・月次レビュー", name_en: "Review" },
  { id: "productivity_learning:career_dev", parent: "productivity_learning", name_ja: "キャリア開発", name_en: "Career Development" },
  { id: "productivity_learning:digital_detox", parent: "productivity_learning", name_ja: "デジタルデトックス", name_en: "Digital Detox" },

  // living_household
  { id: "living_household:cleaning", parent: "living_household", name_ja: "掃除", name_en: "Cleaning" },
  { id: "living_household:declutter", parent: "living_household", name_ja: "片づけ・断捨離", name_en: "Decluttering" },
  { id: "living_household:laundry", parent: "living_household", name_ja: "洗濯", name_en: "Laundry" },
  { id: "living_household:cooking", parent: "living_household", name_ja: "料理・作り置き", name_en: "Cooking" },
  { id: "living_household:maintenance", parent: "living_household", name_ja: "家のメンテナンス", name_en: "Home Maintenance" },
  { id: "living_household:routine", parent: "living_household", name_ja: "朝・夜の生活ルーティン", name_en: "Daily Routine" },

  // finance
  { id: "finance:expense_log", parent: "finance", name_ja: "支出の記録", name_en: "Expense Log" },
  { id: "finance:budgeting", parent: "finance", name_ja: "家計管理・予算立て", name_en: "Budgeting" },
  { id: "finance:saving", parent: "finance", name_ja: "貯金・積立", name_en: "Saving" },
  { id: "finance:investment", parent: "finance", name_ja: "投資・資産運用", name_en: "Investment" },
  { id: "finance:money_study", parent: "finance", name_ja: "お金の勉強", name_en: "Financial Study" },

  // relationships
  { id: "relationships:family", parent: "relationships", name_ja: "家族との時間", name_en: "Family Time" },
  { id: "relationships:friends", parent: "relationships", name_ja: "友人との交流", name_en: "Friends" },
  { id: "relationships:partner", parent: "relationships", name_ja: "パートナーとの関係", name_en: "Partner" },
  { id: "relationships:workplace", parent: "relationships", name_ja: "職場・学校の人間関係", name_en: "Workplace & School" },
  { id: "relationships:community", parent: "relationships", name_ja: "コミュニティ・趣味仲間", name_en: "Community" },
  { id: "relationships:sns", parent: "relationships", name_ja: "SNS・オンラインでの関わり", name_en: "Social Media & Online" },

  // hobbies_creativity
  { id: "hobbies_creativity:input", parent: "hobbies_creativity", name_ja: "インプット（本・動画など）", name_en: "Input" },
  { id: "hobbies_creativity:creative", parent: "hobbies_creativity", name_ja: "創作・アウトプット", name_en: "Creative Output" },
  { id: "hobbies_creativity:games", parent: "hobbies_creativity", name_ja: "ゲーム・エンタメ", name_en: "Games & Entertainment" },
  { id: "hobbies_creativity:outdoor", parent: "hobbies_creativity", name_ja: "アウトドア・レジャー", name_en: "Outdoor & Leisure" },
  { id: "hobbies_creativity:skills", parent: "hobbies_creativity", name_ja: "趣味スキルの練習", name_en: "Skill Practice" },
  { id: "hobbies_creativity:collection", parent: "hobbies_creativity", name_ja: "コレクション・沼活", name_en: "Collection" },
];

const L3_OTHER = L2.map((l2) => ({
  category_id: `${l2.id}:other`,
  level: 3,
  parent_id: l2.id,
  name_ja: `${l2.name_ja}（その他）`,
  name_en: "Other",
  icon: "",
  sort_order: 100,
  is_active: true,
}));

// Firestore登録用データ生成
const categoriesToSeed = [
  ...L1.map(c => ({
    category_id: c.category_id,
    level: 1,
    parent_id: null,
    name_ja: c.name_ja,
    name_en: c.name_en,
    icon: c.icon,
    sort_order: c.sort_order,
    is_active: true,
  })),
  ...L2.map((c, index) => ({
    category_id: c.id,
    level: 2,
    parent_id: c.parent,
    name_ja: c.name_ja,
    name_en: c.name_en, // 暫定
    icon: "",
    sort_order: (index % 10) * 10 + 10, // 簡易的なソート順
    is_active: true,
  })),
  ...L3_OTHER,
];


async function seedCategories() {
  console.log('🌱 カテゴリマスタの登録を開始します...');
  console.log(`📊 登録するカテゴリ数: ${categoriesToSeed.length}`);

  let successCount = 0;
  let errorCount = 0;

  for (const category of categoriesToSeed) {
    try {
      // @ts-ignore
      const categoryRef = doc(db, 'categories', category.category_id);
      await setDoc(categoryRef, category);
      console.log(`✅ ${category.category_id} (${category.name_ja})`);
      successCount++;
    } catch (error) {
      // @ts-ignore
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
