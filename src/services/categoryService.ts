import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Category, CATEGORY_L1_INFO, CategoryL1Id } from '../types';

export const categoryService = {
    /**
     * L1カテゴリ（大分類）を取得する
     * Firestoreから取得し、なければ定数からフォールバックする
     */
    getL1Categories: async (): Promise<Category[]> => {
        try {
            const q = query(
                collection(db, 'categories'),
                where('level', '==', 1),
                where('is_active', '==', true),
                orderBy('sort_order', 'asc')
            );

            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                return snapshot.docs.map(doc => doc.data() as Category);
            }

            // データがない場合は定数から生成（開発用・初期データ用）
            return Object.entries(CATEGORY_L1_INFO).map(([key, info], index) => {
                const id = key as CategoryL1Id;
                const iconMap: Record<CategoryL1Id, string> = {
                    health: '💪',
                    learning: '📚',
                    lifestyle: '🏠',
                    creative: '🎨',
                    mindfulness: '🧘',
                };

                const descriptionMap: Record<CategoryL1Id, string> = {
                    health: '運動・食事・睡眠',
                    learning: '語学・読書・スキル',
                    lifestyle: '朝活・整理・お金',
                    creative: '執筆・アート・音楽',
                    mindfulness: '瞑想・感謝・メンタル',
                };

                return {
                    category_id: id,
                    level: 1,
                    parent_id: null,
                    name_ja: info.name_ja,
                    name_en: info.name_en,
                    icon: iconMap[id] || '📁',
                    sort_order: (index + 1) * 10,
                    is_active: true,
                    description: descriptionMap[id] || '', // Description field added dynamically for UI convenience logic if needed, though strictly not in Category type. Better separate.
                } as unknown as Category;
            });
        } catch (error) {
            console.error('L1カテゴリ取得エラー:', error);
            throw error;
        }
    },

    /**
     * L2カテゴリ（中分類）を親ID指定で取得する
     */
    getL2Categories: async (parentId: string): Promise<Category[]> => {
        try {
            const q = query(
                collection(db, 'categories'),
                where('level', '==', 2),
                where('parent_id', '==', parentId),
                where('is_active', '==', true),
                orderBy('sort_order', 'asc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.data() as Category);
        } catch (error) {
            console.error('L2カテゴリ取得エラー:', error);
            return [];
        }
    }
};
