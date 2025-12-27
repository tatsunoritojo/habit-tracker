// src/hooks/useFavorites.ts
// お気に入り管理フック（Phase 10-A）

import { useState, useEffect, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import {
    getFavorites,
    getFavoriteCardIds,
    addFavorite as addFavoriteService,
    removeFavorite as removeFavoriteService,
} from '../services/favoriteService';
import { Favorite } from '../types';

export function useFavorites() {
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [favoriteCardIds, setFavoriteCardIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchFavorites = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                // Only update if not already empty to avoid infinite re-renders
                setFavorites((prev) => (prev.length === 0 ? prev : []));
                setFavoriteCardIds((prev) => (prev.size === 0 ? prev : new Set()));
                return;
            }

            const data = await getFavorites(user.uid);
            setFavorites(data);
            setFavoriteCardIds(new Set(data.map((f) => f.target_card_id)));
        } catch (err) {
            console.error('Failed to fetch favorites:', err);
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, []);

    // 初回マウント時に取得
    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    // お気に入り登録
    const addFavorite = useCallback(
        async (
            targetUid: string,
            targetCardId: string,
            categoryL3: string
        ): Promise<{ success: boolean; error?: string }> => {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                return { success: false, error: 'NOT_AUTHENTICATED' };
            }

            const result = await addFavoriteService(
                user.uid,
                targetUid,
                targetCardId,
                categoryL3
            );

            if (result.success) {
                // ローカル状態を更新
                setFavoriteCardIds((prev) => new Set([...prev, targetCardId]));
                // 完全なリフレッシュ
                await fetchFavorites();
            }

            return result;
        },
        [fetchFavorites]
    );

    // お気に入り解除
    const removeFavorite = useCallback(
        async (targetCardId: string): Promise<{ success: boolean; error?: string }> => {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                return { success: false, error: 'NOT_AUTHENTICATED' };
            }

            const result = await removeFavoriteService(user.uid, targetCardId);

            if (result.success) {
                // ローカル状態を更新
                setFavoriteCardIds((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(targetCardId);
                    return newSet;
                });
                setFavorites((prev) =>
                    prev.filter((f) => f.target_card_id !== targetCardId)
                );
            }

            return result;
        },
        []
    );

    // カードIDでお気に入りチェック
    const isFavorite = useCallback(
        (cardId: string): boolean => {
            return favoriteCardIds.has(cardId);
        },
        [favoriteCardIds]
    );

    return {
        favorites,
        loading,
        error,
        favoriteCount: favorites.length,
        addFavorite,
        removeFavorite,
        isFavorite,
        refresh: fetchFavorites,
    };
}
