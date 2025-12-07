// src/utils/habitSimilarity.ts
// 習慣の類似度を判定するユーティリティ

/**
 * キーワード類義語マッピング
 * 各配列内の単語は同じ意味として扱われる
 */
const KEYWORD_SYNONYMS: string[][] = [
    // アルコール関連
    ['酒', 'お酒', 'アルコール', '飲酒', '酒類'],

    // 運動関連
    ['運動', 'エクササイズ', 'トレーニング', '筋トレ', 'ワークアウト'],
    ['走る', 'ランニング', 'ジョギング', 'ラン'],
    ['歩く', 'ウォーキング', '散歩'],

    // 食事関連
    ['食事', '食べる', 'ごはん', '食'],
    ['野菜', 'ベジタブル', '青菜'],
    ['水', 'お水', 'ウォーター', '水分'],

    // 睡眠関連
    ['睡眠', '寝る', '眠る', '就寝'],
    ['早寝', '早く寝る'],
    ['早起き', '早く起きる'],

    // 勉強関連
    ['勉強', '学習', '学ぶ', '勉', 'スタディ'],
    ['読書', '本を読む', '読む'],

    // 健康・セルフケア
    ['瞑想', 'メディテーション', 'マインドフルネス'],
    ['ストレッチ', '柔軟'],
    ['ヨガ'],

    // 家事関連
    ['掃除', '片付け', '整理'],
    ['洗濯'],
    ['料理', 'クッキング'],

    // 禁止・やめる系
    ['禁', 'やめる', '止める', '控える', '断つ', '絶つ'],
    ['減らす', '少なくする'],
];

/**
 * 否定的な表現のキーワード
 */
const NEGATIVE_KEYWORDS = [
    'やめる', '止める', '禁', '控える', '断つ', '絶つ',
    'しない', '飲まない', '食べない', 'ない',
    '減らす', '少なくする',
];

/**
 * テキストを正規化（ひらがな・カタカナを統一）
 */
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[ァ-ヶ]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0x60))
        .trim();
}

/**
 * テキストからキーワードを抽出
 */
function extractKeywords(text: string): Set<string> {
    const normalized = normalizeText(text);
    const keywords = new Set<string>();

    // 類義語マッピングから検出
    for (const synonymGroup of KEYWORD_SYNONYMS) {
        for (const synonym of synonymGroup) {
            const normalizedSynonym = normalizeText(synonym);
            if (normalized.includes(normalizedSynonym)) {
                // このグループの全ての同義語をキーワードとして追加
                synonymGroup.forEach(s => keywords.add(normalizeText(s)));
            }
        }
    }

    // 否定キーワードを検出
    let hasNegative = false;
    for (const negKeyword of NEGATIVE_KEYWORDS) {
        if (normalized.includes(normalizeText(negKeyword))) {
            hasNegative = true;
            keywords.add('__NEGATIVE__');
            break;
        }
    }

    return keywords;
}

/**
 * 2つのテキストの類似度を計算（0.0〜1.0）
 */
export function calculateSimilarity(text1: string, text2: string): number {
    const keywords1 = extractKeywords(text1);
    const keywords2 = extractKeywords(text2);

    if (keywords1.size === 0 || keywords2.size === 0) {
        // キーワードが抽出できない場合は部分一致で判定
        const normalized1 = normalizeText(text1);
        const normalized2 = normalizeText(text2);
        if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
            return 0.5;
        }
        return 0.0;
    }

    // Jaccard係数（共通キーワード数 / 全キーワード数）
    const intersection = new Set([...keywords1].filter(k => keywords2.has(k)));
    const union = new Set([...keywords1, ...keywords2]);

    return intersection.size / union.size;
}

/**
 * テキストが類似しているかを判定
 */
export function isSimilar(text1: string, text2: string, threshold: number = 0.3): boolean {
    return calculateSimilarity(text1, text2) >= threshold;
}
