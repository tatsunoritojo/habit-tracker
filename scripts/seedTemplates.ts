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

// カードテンプレートデータ（100件）
const templates = [
  // ========================================
  // physical_health（からだの健康）- 20件
  // ========================================
  { template_id: 'ph_aerobic_01', category_l1: 'physical_health', category_l2: 'physical_health:aerobic', category_l3: 'physical_health:aerobic:other', title_ja: '10分ウォーキングする', title_en: '10min Walking', description_ja: null, icon: '🚶', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'ph_aerobic_02', category_l1: 'physical_health', category_l2: 'physical_health:aerobic', category_l3: 'physical_health:aerobic:other', title_ja: 'ラジオ体操をする', title_en: 'Radio Calisthenics', description_ja: null, icon: '🤸', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'ph_aerobic_03', category_l1: 'physical_health', category_l2: 'physical_health:aerobic', category_l3: 'physical_health:aerobic:other', title_ja: '階段を使う', title_en: 'Use Stairs', description_ja: null, icon: '🪜', sort_order: 30, is_official: true, is_active: true },
  { template_id: 'ph_muscle_01', category_l1: 'physical_health', category_l2: 'physical_health:muscle', category_l3: 'physical_health:muscle:other', title_ja: 'スクワットを1回する', title_en: '1 Squat', description_ja: null, icon: '💪', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'ph_muscle_02', category_l1: 'physical_health', category_l2: 'physical_health:muscle', category_l3: 'physical_health:muscle:other', title_ja: '腕立て伏せを10回する', title_en: '10 Push-ups', description_ja: null, icon: '💪', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'ph_muscle_03', category_l1: 'physical_health', category_l2: 'physical_health:muscle', category_l3: 'physical_health:muscle:other', title_ja: 'プランクを30秒する', title_en: '30sec Plank', description_ja: null, icon: '🏋️', sort_order: 30, is_official: true, is_active: true },
  { template_id: 'ph_muscle_04', category_l1: 'physical_health', category_l2: 'physical_health:muscle', category_l3: 'physical_health:muscle:other', title_ja: '腹筋を10回する', title_en: '10 Sit-ups', description_ja: null, icon: '💪', sort_order: 40, is_official: true, is_active: true },
  { template_id: 'ph_flex_01', category_l1: 'physical_health', category_l2: 'physical_health:flexibility', category_l3: 'physical_health:flexibility:other', title_ja: 'ストレッチをする', title_en: 'Stretch', description_ja: null, icon: '🧘', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'ph_flex_02', category_l1: 'physical_health', category_l2: 'physical_health:flexibility', category_l3: 'physical_health:flexibility:other', title_ja: '肩回しストレッチをする', title_en: 'Shoulder Stretch', description_ja: null, icon: '🔄', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'ph_flex_03', category_l1: 'physical_health', category_l2: 'physical_health:flexibility', category_l3: 'physical_health:flexibility:other', title_ja: '開脚ストレッチをする', title_en: 'Leg Stretch', description_ja: null, icon: '🦵', sort_order: 30, is_official: true, is_active: true },
  { template_id: 'ph_nutr_01', category_l1: 'physical_health', category_l2: 'physical_health:nutrition', category_l3: 'physical_health:nutrition:other', title_ja: '水を1杯飲む', title_en: 'Drink Water', description_ja: null, icon: '💧', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'ph_nutr_02', category_l1: 'physical_health', category_l2: 'physical_health:nutrition', category_l3: 'physical_health:nutrition:other', title_ja: '野菜を食べる', title_en: 'Eat Vegetables', description_ja: null, icon: '🥗', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'ph_nutr_03', category_l1: 'physical_health', category_l2: 'physical_health:nutrition', category_l3: 'physical_health:nutrition:other', title_ja: '朝食を食べる', title_en: 'Eat Breakfast', description_ja: null, icon: '🍳', sort_order: 30, is_official: true, is_active: true },
  { template_id: 'ph_nutr_04', category_l1: 'physical_health', category_l2: 'physical_health:nutrition', category_l3: 'physical_health:nutrition:other', title_ja: 'お菓子を控える', title_en: 'Avoid Snacks', description_ja: null, icon: '🍬', sort_order: 40, is_official: true, is_active: true },
  { template_id: 'ph_sleep_01', category_l1: 'physical_health', category_l2: 'physical_health:sleep', category_l3: 'physical_health:sleep:other', title_ja: '23時に寝る準備をする', title_en: 'Prepare for Bed', description_ja: null, icon: '🌙', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'ph_sleep_02', category_l1: 'physical_health', category_l2: 'physical_health:sleep', category_l3: 'physical_health:sleep:other', title_ja: '6時に起きる', title_en: 'Wake at 6am', description_ja: null, icon: '⏰', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'ph_sleep_03', category_l1: 'physical_health', category_l2: 'physical_health:sleep', category_l3: 'physical_health:sleep:other', title_ja: 'スマホを寝室に持ち込まない', title_en: 'No Phone in Bedroom', description_ja: null, icon: '📵', sort_order: 30, is_official: true, is_active: true },
  { template_id: 'ph_self_01', category_l1: 'physical_health', category_l2: 'physical_health:selfcare', category_l3: 'physical_health:selfcare:other', title_ja: '歯をフロスする', title_en: 'Floss Teeth', description_ja: null, icon: '🦷', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'ph_self_02', category_l1: 'physical_health', category_l2: 'physical_health:selfcare', category_l3: 'physical_health:selfcare:other', title_ja: '日焼け止めを塗る', title_en: 'Apply Sunscreen', description_ja: null, icon: '☀️', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'ph_check_01', category_l1: 'physical_health', category_l2: 'physical_health:checkup', category_l3: 'physical_health:checkup:other', title_ja: '体重を記録する', title_en: 'Log Weight', description_ja: null, icon: '⚖️', sort_order: 10, is_official: true, is_active: true },

  // ========================================
  // mental_health（こころの健康）- 15件
  // ========================================
  { template_id: 'mh_mind_01', category_l1: 'mental_health', category_l2: 'mental_health:mindfulness', category_l3: 'mental_health:mindfulness:other', title_ja: '1分瞑想する', title_en: '1min Meditation', description_ja: null, icon: '🧘', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'mh_mind_02', category_l1: 'mental_health', category_l2: 'mental_health:mindfulness', category_l3: 'mental_health:mindfulness:other', title_ja: '5分瞑想する', title_en: '5min Meditation', description_ja: null, icon: '🧘', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'mh_mind_03', category_l1: 'mental_health', category_l2: 'mental_health:mindfulness', category_l3: 'mental_health:mindfulness:other', title_ja: '深呼吸を3回する', title_en: '3 Deep Breaths', description_ja: null, icon: '🌬️', sort_order: 30, is_official: true, is_active: true },
  { template_id: 'mh_mind_04', category_l1: 'mental_health', category_l2: 'mental_health:mindfulness', category_l3: 'mental_health:mindfulness:other', title_ja: '5分だけ何もしない', title_en: 'Do Nothing 5min', description_ja: null, icon: '🧘', sort_order: 40, is_official: true, is_active: true },
  { template_id: 'mh_ref_01', category_l1: 'mental_health', category_l2: 'mental_health:reflection', category_l3: 'mental_health:reflection:other', title_ja: '日記を1行書く', title_en: 'Write 1 Line Journal', description_ja: null, icon: '📔', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'mh_ref_02', category_l1: 'mental_health', category_l2: 'mental_health:reflection', category_l3: 'mental_health:reflection:other', title_ja: '日記を書く', title_en: 'Write Journal', description_ja: null, icon: '📓', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'mh_ref_03', category_l1: 'mental_health', category_l2: 'mental_health:reflection', category_l3: 'mental_health:reflection:other', title_ja: '今日の気分を記録する', title_en: 'Log Mood', description_ja: null, icon: '😊', sort_order: 30, is_official: true, is_active: true },
  { template_id: 'mh_ref_04', category_l1: 'mental_health', category_l2: 'mental_health:reflection', category_l3: 'mental_health:reflection:other', title_ja: '良かったことを3つ書く', title_en: 'Write 3 Good Things', description_ja: null, icon: '✨', sort_order: 40, is_official: true, is_active: true },
  { template_id: 'mh_grat_01', category_l1: 'mental_health', category_l2: 'mental_health:gratitude', category_l3: 'mental_health:gratitude:other', title_ja: '感謝を1つ書く', title_en: 'Write 1 Gratitude', description_ja: null, icon: '🙏', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'mh_grat_02', category_l1: 'mental_health', category_l2: 'mental_health:gratitude', category_l3: 'mental_health:gratitude:other', title_ja: '自分を褒める', title_en: 'Praise Yourself', description_ja: null, icon: '👏', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'mh_grat_03', category_l1: 'mental_health', category_l2: 'mental_health:gratitude', category_l3: 'mental_health:gratitude:other', title_ja: '笑顔を作る', title_en: 'Smile', description_ja: null, icon: '😄', sort_order: 30, is_official: true, is_active: true },
  { template_id: 'mh_stress_01', category_l1: 'mental_health', category_l2: 'mental_health:stress_care', category_l3: 'mental_health:stress_care:other', title_ja: '好きな音楽を聴く', title_en: 'Listen to Music', description_ja: null, icon: '🎵', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'mh_stress_02', category_l1: 'mental_health', category_l2: 'mental_health:stress_care', category_l3: 'mental_health:stress_care:other', title_ja: '外の空気を吸う', title_en: 'Get Fresh Air', description_ja: null, icon: '🍃', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'mh_stress_03', category_l1: 'mental_health', category_l2: 'mental_health:stress_care', category_l3: 'mental_health:stress_care:other', title_ja: 'ペットと過ごす', title_en: 'Spend Time with Pet', description_ja: null, icon: '🐕', sort_order: 30, is_official: true, is_active: true },
  { template_id: 'mh_stress_04', category_l1: 'mental_health', category_l2: 'mental_health:stress_care', category_l3: 'mental_health:stress_care:other', title_ja: 'アロマを焚く', title_en: 'Light Aromatherapy', description_ja: null, icon: '🕯️', sort_order: 40, is_official: true, is_active: true },

  // ========================================
  // productivity_learning（生産性・学び）- 18件
  // ========================================
  { template_id: 'pl_study_01', category_l1: 'productivity_learning', category_l2: 'productivity_learning:study', category_l3: 'productivity_learning:study:other', title_ja: '英語アプリを開く', title_en: 'Open English App', description_ja: null, icon: '🇬🇧', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'pl_study_02', category_l1: 'productivity_learning', category_l2: 'productivity_learning:study', category_l3: 'productivity_learning:study:other', title_ja: '英語を学習する', title_en: 'Study English', description_ja: null, icon: '📚', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'pl_study_03', category_l1: 'productivity_learning', category_l2: 'productivity_learning:study', category_l3: 'productivity_learning:study:other', title_ja: '単語帳を1ページ読む', title_en: 'Read 1 Page Vocab', description_ja: null, icon: '📖', sort_order: 30, is_official: true, is_active: true },
  { template_id: 'pl_study_04', category_l1: 'productivity_learning', category_l2: 'productivity_learning:study', category_l3: 'productivity_learning:study:other', title_ja: '資格の勉強を15分する', title_en: '15min Certification Study', description_ja: null, icon: '📝', sort_order: 40, is_official: true, is_active: true },
  { template_id: 'pl_study_05', category_l1: 'productivity_learning', category_l2: 'productivity_learning:study', category_l3: 'productivity_learning:study:other', title_ja: 'ニュースを1本読む', title_en: 'Read 1 News Article', description_ja: null, icon: '📰', sort_order: 50, is_official: true, is_active: true },
  { template_id: 'pl_study_06', category_l1: 'productivity_learning', category_l2: 'productivity_learning:study', category_l3: 'productivity_learning:study:other', title_ja: 'ポッドキャストを聴く', title_en: 'Listen to Podcast', description_ja: null, icon: '🎧', sort_order: 60, is_official: true, is_active: true },
  { template_id: 'pl_plan_01', category_l1: 'productivity_learning', category_l2: 'productivity_learning:planning', category_l3: 'productivity_learning:planning:other', title_ja: '今日のタスクを3つ書く', title_en: 'Write 3 Tasks', description_ja: null, icon: '✅', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'pl_plan_02', category_l1: 'productivity_learning', category_l2: 'productivity_learning:planning', category_l3: 'productivity_learning:planning:other', title_ja: '明日の予定を確認する', title_en: 'Check Tomorrow Plan', description_ja: null, icon: '📅', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'pl_work_01', category_l1: 'productivity_learning', category_l2: 'productivity_learning:work_product', category_l3: 'productivity_learning:work_product:other', title_ja: 'メールを整理する', title_en: 'Organize Email', description_ja: null, icon: '📧', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'pl_work_02', category_l1: 'productivity_learning', category_l2: 'productivity_learning:work_product', category_l3: 'productivity_learning:work_product:other', title_ja: 'デスクを片付ける', title_en: 'Clean Desk', description_ja: null, icon: '🗂️', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'pl_work_03', category_l1: 'productivity_learning', category_l2: 'productivity_learning:work_product', category_l3: 'productivity_learning:work_product:other', title_ja: 'タスクを1つ完了する', title_en: 'Complete 1 Task', description_ja: null, icon: '✔️', sort_order: 30, is_official: true, is_active: true },
  { template_id: 'pl_rev_01', category_l1: 'productivity_learning', category_l2: 'productivity_learning:review', category_l3: 'productivity_learning:review:other', title_ja: '週次レビューをする', title_en: 'Weekly Review', description_ja: null, icon: '📊', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'pl_rev_02', category_l1: 'productivity_learning', category_l2: 'productivity_learning:review', category_l3: 'productivity_learning:review:other', title_ja: '月次レビューをする', title_en: 'Monthly Review', description_ja: null, icon: '📈', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'pl_car_01', category_l1: 'productivity_learning', category_l2: 'productivity_learning:career_dev', category_l3: 'productivity_learning:career_dev:other', title_ja: 'プログラミングを学習する', title_en: 'Study Programming', description_ja: null, icon: '💻', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'pl_car_02', category_l1: 'productivity_learning', category_l2: 'productivity_learning:career_dev', category_l3: 'productivity_learning:career_dev:other', title_ja: '業界ニュースをチェックする', title_en: 'Check Industry News', description_ja: null, icon: '💼', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'pl_car_03', category_l1: 'productivity_learning', category_l2: 'productivity_learning:career_dev', category_l3: 'productivity_learning:career_dev:other', title_ja: 'LinkedInを更新する', title_en: 'Update LinkedIn', description_ja: null, icon: '🔗', sort_order: 30, is_official: true, is_active: true },
  { template_id: 'pl_det_01', category_l1: 'productivity_learning', category_l2: 'productivity_learning:digital_detox', category_l3: 'productivity_learning:digital_detox:other', title_ja: 'スマホの通知をオフにする', title_en: 'Turn Off Notifications', description_ja: null, icon: '🔕', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'pl_det_02', category_l1: 'productivity_learning', category_l2: 'productivity_learning:digital_detox', category_l3: 'productivity_learning:digital_detox:other', title_ja: 'SNSを見ない時間を作る', title_en: 'No SNS Time', description_ja: null, icon: '📴', sort_order: 20, is_official: true, is_active: true },

  // ========================================
  // living_household（生活環境・家事）- 15件
  // ========================================
  { template_id: 'lh_clean_01', category_l1: 'living_household', category_l2: 'living_household:cleaning', category_l3: 'living_household:cleaning:other', title_ja: '1箇所だけ掃除する', title_en: 'Clean 1 Spot', description_ja: null, icon: '🧹', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'lh_clean_02', category_l1: 'living_household', category_l2: 'living_household:cleaning', category_l3: 'living_household:cleaning:other', title_ja: 'トイレを掃除する', title_en: 'Clean Toilet', description_ja: null, icon: '🚽', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'lh_clean_03', category_l1: 'living_household', category_l2: 'living_household:cleaning', category_l3: 'living_household:cleaning:other', title_ja: '床を拭く', title_en: 'Wipe Floor', description_ja: null, icon: '🧽', sort_order: 30, is_official: true, is_active: true },
  { template_id: 'lh_dec_01', category_l1: 'living_household', category_l2: 'living_household:declutter', category_l3: 'living_household:declutter:other', title_ja: '物を1つ捨てる', title_en: 'Discard 1 Item', description_ja: null, icon: '🗑️', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'lh_dec_02', category_l1: 'living_household', category_l2: 'living_household:declutter', category_l3: 'living_household:declutter:other', title_ja: '引き出しを整理する', title_en: 'Organize Drawer', description_ja: null, icon: '📦', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'lh_laun_01', category_l1: 'living_household', category_l2: 'living_household:laundry', category_l3: 'living_household:laundry:other', title_ja: '洗濯物をたたむ', title_en: 'Fold Laundry', description_ja: null, icon: '👕', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'lh_laun_02', category_l1: 'living_household', category_l2: 'living_household:laundry', category_l3: 'living_household:laundry:other', title_ja: '洗濯機を回す', title_en: 'Run Laundry', description_ja: null, icon: '🧺', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'lh_cook_01', category_l1: 'living_household', category_l2: 'living_household:cooking', category_l3: 'living_household:cooking:other', title_ja: '作り置きおかずを作る', title_en: 'Meal Prep', description_ja: null, icon: '🍱', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'lh_cook_02', category_l1: 'living_household', category_l2: 'living_household:cooking', category_l3: 'living_household:cooking:other', title_ja: 'お弁当を作る', title_en: 'Make Lunch Box', description_ja: null, icon: '🍙', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'lh_cook_03', category_l1: 'living_household', category_l2: 'living_household:cooking', category_l3: 'living_household:cooking:other', title_ja: '冷蔵庫の中を確認する', title_en: 'Check Fridge', description_ja: null, icon: '🧊', sort_order: 30, is_official: true, is_active: true },
  { template_id: 'lh_maint_01', category_l1: 'living_household', category_l2: 'living_household:maintenance', category_l3: 'living_household:maintenance:other', title_ja: '植物に水をやる', title_en: 'Water Plants', description_ja: null, icon: '🌱', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'lh_maint_02', category_l1: 'living_household', category_l2: 'living_household:maintenance', category_l3: 'living_household:maintenance:other', title_ja: '換気をする', title_en: 'Ventilate Room', description_ja: null, icon: '🪟', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'lh_rout_01', category_l1: 'living_household', category_l2: 'living_household:routine', category_l3: 'living_household:routine:other', title_ja: '朝のルーティンを完了する', title_en: 'Complete Morning Routine', description_ja: null, icon: '☀️', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'lh_rout_02', category_l1: 'living_household', category_l2: 'living_household:routine', category_l3: 'living_household:routine:other', title_ja: '夜のルーティンを完了する', title_en: 'Complete Night Routine', description_ja: null, icon: '🌙', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'lh_rout_03', category_l1: 'living_household', category_l2: 'living_household:routine', category_l3: 'living_household:routine:other', title_ja: 'ベッドメイキングをする', title_en: 'Make Bed', description_ja: null, icon: '🛏️', sort_order: 30, is_official: true, is_active: true },

  // ========================================
  // finance（お金）- 10件
  // ========================================
  { template_id: 'fi_exp_01', category_l1: 'finance', category_l2: 'finance:expense_log', category_l3: 'finance:expense_log:other', title_ja: '支出を記録する', title_en: 'Log Expenses', description_ja: null, icon: '📝', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'fi_exp_02', category_l1: 'finance', category_l2: 'finance:expense_log', category_l3: 'finance:expense_log:other', title_ja: 'レシートを写真に撮る', title_en: 'Photo Receipt', description_ja: null, icon: '🧾', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'fi_exp_03', category_l1: 'finance', category_l2: 'finance:expense_log', category_l3: 'finance:expense_log:other', title_ja: '家計簿アプリを開く', title_en: 'Open Budget App', description_ja: null, icon: '📱', sort_order: 30, is_official: true, is_active: true },
  { template_id: 'fi_bud_01', category_l1: 'finance', category_l2: 'finance:budgeting', category_l3: 'finance:budgeting:other', title_ja: '予算を確認する', title_en: 'Check Budget', description_ja: null, icon: '💵', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'fi_bud_02', category_l1: 'finance', category_l2: 'finance:budgeting', category_l3: 'finance:budgeting:other', title_ja: '無駄遣いをしない', title_en: 'No Impulse Buy', description_ja: null, icon: '🙅', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'fi_sav_01', category_l1: 'finance', category_l2: 'finance:saving', category_l3: 'finance:saving:other', title_ja: '小銭を貯金箱に入れる', title_en: 'Save Coins', description_ja: null, icon: '🐷', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'fi_sav_02', category_l1: 'finance', category_l2: 'finance:saving', category_l3: 'finance:saving:other', title_ja: '積立額を確認する', title_en: 'Check Savings', description_ja: null, icon: '📊', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'fi_inv_01', category_l1: 'finance', category_l2: 'finance:investment', category_l3: 'finance:investment:other', title_ja: '投資ニュースをチェックする', title_en: 'Check Investment News', description_ja: null, icon: '📈', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'fi_inv_02', category_l1: 'finance', category_l2: 'finance:investment', category_l3: 'finance:investment:other', title_ja: '資産状況を確認する', title_en: 'Check Assets', description_ja: null, icon: '💰', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'fi_stu_01', category_l1: 'finance', category_l2: 'finance:money_study', category_l3: 'finance:money_study:other', title_ja: 'お金の本を読む', title_en: 'Read Finance Book', description_ja: null, icon: '📖', sort_order: 10, is_official: true, is_active: true },

  // ========================================
  // relationships（人間関係）- 10件
  // ========================================
  { template_id: 're_fam_01', category_l1: 'relationships', category_l2: 'relationships:family', category_l3: 'relationships:family:other', title_ja: '家族と話す時間を作る', title_en: 'Talk with Family', description_ja: null, icon: '👨‍👩‍👧', sort_order: 10, is_official: true, is_active: true },
  { template_id: 're_fam_02', category_l1: 'relationships', category_l2: 'relationships:family', category_l3: 'relationships:family:other', title_ja: '家族に「ありがとう」を言う', title_en: 'Thank Family', description_ja: null, icon: '💕', sort_order: 20, is_official: true, is_active: true },
  { template_id: 're_fri_01', category_l1: 'relationships', category_l2: 'relationships:friends', category_l3: 'relationships:friends:other', title_ja: '友人にLINEを送る', title_en: 'Message Friend', description_ja: null, icon: '💬', sort_order: 10, is_official: true, is_active: true },
  { template_id: 're_fri_02', category_l1: 'relationships', category_l2: 'relationships:friends', category_l3: 'relationships:friends:other', title_ja: '友人と予定を立てる', title_en: 'Plan with Friend', description_ja: null, icon: '📆', sort_order: 20, is_official: true, is_active: true },
  { template_id: 're_par_01', category_l1: 'relationships', category_l2: 'relationships:partner', category_l3: 'relationships:partner:other', title_ja: 'パートナーに感謝を伝える', title_en: 'Thank Partner', description_ja: null, icon: '❤️', sort_order: 10, is_official: true, is_active: true },
  { template_id: 're_par_02', category_l1: 'relationships', category_l2: 'relationships:partner', category_l3: 'relationships:partner:other', title_ja: '一緒にご飯を食べる', title_en: 'Eat Together', description_ja: null, icon: '🍽️', sort_order: 20, is_official: true, is_active: true },
  { template_id: 're_work_01', category_l1: 'relationships', category_l2: 'relationships:workplace', category_l3: 'relationships:workplace:other', title_ja: '同僚にお礼を言う', title_en: 'Thank Colleague', description_ja: null, icon: '🤝', sort_order: 10, is_official: true, is_active: true },
  { template_id: 're_work_02', category_l1: 'relationships', category_l2: 'relationships:workplace', category_l3: 'relationships:workplace:other', title_ja: '挨拶をしっかりする', title_en: 'Greet Properly', description_ja: null, icon: '👋', sort_order: 20, is_official: true, is_active: true },
  { template_id: 're_com_01', category_l1: 'relationships', category_l2: 'relationships:community', category_l3: 'relationships:community:other', title_ja: 'コミュニティに参加する', title_en: 'Join Community', description_ja: null, icon: '🏘️', sort_order: 10, is_official: true, is_active: true },
  { template_id: 're_sns_01', category_l1: 'relationships', category_l2: 'relationships:sns', category_l3: 'relationships:sns:other', title_ja: 'オンラインで交流する', title_en: 'Connect Online', description_ja: null, icon: '💻', sort_order: 10, is_official: true, is_active: true },

  // ========================================
  // hobbies_creativity（趣味・創作）- 12件
  // ========================================
  { template_id: 'hc_inp_01', category_l1: 'hobbies_creativity', category_l2: 'hobbies_creativity:input', category_l3: 'hobbies_creativity:input:other', title_ja: '本を1ページ読む', title_en: 'Read 1 Page', description_ja: null, icon: '📚', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'hc_inp_02', category_l1: 'hobbies_creativity', category_l2: 'hobbies_creativity:input', category_l3: 'hobbies_creativity:input:other', title_ja: '10分読書する', title_en: '10min Reading', description_ja: null, icon: '📖', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'hc_inp_03', category_l1: 'hobbies_creativity', category_l2: 'hobbies_creativity:input', category_l3: 'hobbies_creativity:input:other', title_ja: 'YouTube動画を1本見る', title_en: 'Watch 1 Video', description_ja: null, icon: '📺', sort_order: 30, is_official: true, is_active: true },
  { template_id: 'hc_inp_04', category_l1: 'hobbies_creativity', category_l2: 'hobbies_creativity:input', category_l3: 'hobbies_creativity:input:other', title_ja: '映画・ドラマを見る', title_en: 'Watch Movie/Drama', description_ja: null, icon: '🎬', sort_order: 40, is_official: true, is_active: true },
  { template_id: 'hc_cre_01', category_l1: 'hobbies_creativity', category_l2: 'hobbies_creativity:creative', category_l3: 'hobbies_creativity:creative:other', title_ja: '1分スケッチする', title_en: '1min Sketch', description_ja: null, icon: '🖌️', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'hc_cre_02', category_l1: 'hobbies_creativity', category_l2: 'hobbies_creativity:creative', category_l3: 'hobbies_creativity:creative:other', title_ja: '写真を撮る', title_en: 'Take Photo', description_ja: null, icon: '📷', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'hc_cre_03', category_l1: 'hobbies_creativity', category_l2: 'hobbies_creativity:creative', category_l3: 'hobbies_creativity:creative:other', title_ja: 'ブログを書く', title_en: 'Write Blog', description_ja: null, icon: '✍️', sort_order: 30, is_official: true, is_active: true },
  { template_id: 'hc_game_01', category_l1: 'hobbies_creativity', category_l2: 'hobbies_creativity:games', category_l3: 'hobbies_creativity:games:other', title_ja: 'ゲームを楽しむ', title_en: 'Play Game', description_ja: null, icon: '🎮', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'hc_game_02', category_l1: 'hobbies_creativity', category_l2: 'hobbies_creativity:games', category_l3: 'hobbies_creativity:games:other', title_ja: '音楽を聴く', title_en: 'Listen to Music', description_ja: null, icon: '🎵', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'hc_out_01', category_l1: 'hobbies_creativity', category_l2: 'hobbies_creativity:outdoor', category_l3: 'hobbies_creativity:outdoor:other', title_ja: '散歩に出かける', title_en: 'Go for Walk', description_ja: null, icon: '🚶', sort_order: 10, is_official: true, is_active: true },
  { template_id: 'hc_out_02', category_l1: 'hobbies_creativity', category_l2: 'hobbies_creativity:outdoor', category_l3: 'hobbies_creativity:outdoor:other', title_ja: '自然の中で過ごす', title_en: 'Spend Time in Nature', description_ja: null, icon: '🌳', sort_order: 20, is_official: true, is_active: true },
  { template_id: 'hc_skill_01', category_l1: 'hobbies_creativity', category_l2: 'hobbies_creativity:skills', category_l3: 'hobbies_creativity:skills:other', title_ja: '楽器を練習する', title_en: 'Practice Instrument', description_ja: null, icon: '🎸', sort_order: 10, is_official: true, is_active: true },
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
