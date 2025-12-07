import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

// 公開カードをCardTemplate形式に変換する型
export interface PublicCardAsTemplate {
    template_id: string; // card_idを使用
    title_ja: string;
    title_en: string;
    description_ja: string | null;
    category_l1: string;
    category_l2: string;
    category_l3: string;
    icon: string;
    sort_order: number;
    is_active: boolean;
    is_official: false; // ユーザー作成カードは公式ではない
    created_at: any; // Timestamp型
    is_user_created?: boolean; // ユーザー作成フラグ
    owner_uid?: string; // 作成者UID
}

export const usePublicCards = () => {
    const [publicCards, setPublicCards] = useState<PublicCardAsTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        loadPublicCards();
    }, []);

    const loadPublicCards = async () => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                setPublicCards([]);
                setLoading(false);
                return;
            }

            // テンプレートとして公開されているカードを取得
            const q = query(
                collection(db, 'cards'),
                where('is_public_for_template', '==', true),
                where('is_custom', '==', true)
            );

            const snapshot = await getDocs(q);
            const allCards: PublicCardAsTemplate[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data();

                // アーカイブ済みは除外
                if (data.status === 'archived') return;

                allCards.push({
                    template_id: doc.id,
                    title_ja: data.title || '',
                    title_en: data.title || '',
                    description_ja: null,
                    category_l1: data.category_l1,
                    category_l2: data.category_l2,
                    category_l3: data.category_l3,
                    icon: '👥',
                    sort_order: 9999,
                    is_active: true,
                    is_official: false,
                    created_at: data.created_at,
                    is_user_created: true,
                    owner_uid: data.owner_uid,
                });
            });

            // 類似カードの重複排除
            const deduplicated = deduplicateSimilarCards(allCards);

            setPublicCards(deduplicated);
            setLoading(false);
        } catch (err) {
            console.error('公開カード取得エラー:', err);
            setError(err as Error);
            setLoading(false);
        }
    };

    return { publicCards, loading, error, refresh: loadPublicCards };
};

/**
 * 類似カードの重複排除
 * 類似度90%以上のカードをグループ化し、最も古いものを代表として選択
 */
function deduplicateSimilarCards(cards: PublicCardAsTemplate[]): PublicCardAsTemplate[] {
    if (cards.length === 0) return [];

    const groups: PublicCardAsTemplate[][] = [];

    cards.forEach(card => {
        const normalizedTitle = card.title_ja.toLowerCase().trim();
        let foundGroup = false;

        for (const group of groups) {
            const groupTitle = group[0].title_ja.toLowerCase().trim();

            // 完全一致または非常に類似している場合（80%以上）
            if (normalizedTitle === groupTitle ||
                calculateSimpleSimilarity(normalizedTitle, groupTitle) > 0.8) {
                group.push(card);
                foundGroup = true;
                break;
            }
        }

        if (!foundGroup) {
            groups.push([card]);
        }
    });

    // 各グループから最も古いカードを選択
    return groups.map(group => {
        return group.sort((a, b) => {
            const aTime = a.created_at?.toDate?.().getTime() || 0;
            const bTime = b.created_at?.toDate?.().getTime() || 0;
            return aTime - bTime;
        })[0];
    });
}

/**
 * 簡易類似度計算（Levenshtein距離ベース）
 */
function calculateSimpleSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
}

/**
 * Levenshtein距離計算
 */
function levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}
