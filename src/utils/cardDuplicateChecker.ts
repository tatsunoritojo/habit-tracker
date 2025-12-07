// src/utils/cardDuplicateChecker.ts
// カードの重複チェック用ユーティリティ

import { Card } from '../types';
import { calculateSimilarity } from './habitSimilarity';

export interface DuplicateCheckResult {
    isDuplicate: boolean;
    duplicateType: 'exact' | 'similar' | 'none';
    duplicateCard?: Card;
    similarity?: number;
}

/**
 * 既存カードとの重複をチェック
 * @param title 新しいカードのタイトル
 * @param categoryL1 L1カテゴリ
 * @param categoryL2 L2カテゴリ  
 * @param categoryL3 L3カテゴリ
 * @param existingCards 既存のカードリスト
 * @returns 重複チェック結果
 */
export function checkDuplicate(
    title: string,
    categoryL1: string,
    categoryL2: string,
    categoryL3: string,
    existingCards: Card[]
): DuplicateCheckResult {
    const normalizedTitle = title.toLowerCase().trim();

    for (const card of existingCards) {
        // アーカイブ済みは除外
        if (card.status === 'archived') continue;

        const cardTitle = card.title.toLowerCase().trim();

        // 完全一致チェック
        if (
            cardTitle === normalizedTitle &&
            card.category_l1 === categoryL1 &&
            card.category_l2 === categoryL2 &&
            card.category_l3 === categoryL3
        ) {
            return {
                isDuplicate: true,
                duplicateType: 'exact',
                duplicateCard: card,
            };
        }

        // 類似度チェック（同じカテゴリL2内）
        if (card.category_l2 === categoryL2) {
            // キーワードベースの類似度
            const keywordSimilarity = calculateSimilarity(normalizedTitle, cardTitle);
            // 文字列ベースの類似度（Levenshtein）
            const stringSimilarity = calculateStringSimilarity(normalizedTitle, cardTitle);
            // 高い方を採用
            const similarity = Math.max(keywordSimilarity, stringSimilarity);

            // しきい値0.5で検出（より緩やかに）
            if (similarity > 0.5) {
                return {
                    isDuplicate: true,
                    duplicateType: 'similar',
                    duplicateCard: card,
                    similarity,
                };
            }
        }
    }

    return {
        isDuplicate: false,
        duplicateType: 'none',
    };
}

/**
 * Levenshtein距離に基づく文字列類似度計算
 */
function calculateStringSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0 && len2 === 0) return 1;
    if (len1 === 0 || len2 === 0) return 0;

    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return 1 - distance / maxLen;
}
