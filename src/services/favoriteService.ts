// src/services/favoriteService.ts
// お気に入り機能のCRUD操作（Phase 10-A）

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Favorite } from '../types';

// お気に入り上限
const FAVORITE_LIMIT = 10;

/**
 * 表示名を取得（ニックネーム or #xxxx形式）
 */
export function getDisplayName(user: { uid: string; display_name?: string | null }): string {
    if (user.display_name && user.display_name.trim() !== '') {
        return user.display_name;
    }
    return `#${user.uid.substring(0, 4).toLowerCase()}`;
}

/**
 * お気に入り登録数を取得
 */
export async function getFavoriteCount(ownerUid: string): Promise<number> {
    const favoritesRef = collection(db, 'favorites');
    const q = query(favoritesRef, where('owner_uid', '==', ownerUid));
    const snapshot = await getDocs(q);
    return snapshot.size;
}

/**
 * お気に入り一覧を取得
 */
export async function getFavorites(ownerUid: string): Promise<Favorite[]> {
    const favoritesRef = collection(db, 'favorites');
    const q = query(
        favoritesRef,
        where('owner_uid', '==', ownerUid),
        orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        doc_id: doc.id,
        ...doc.data(),
    })) as Favorite[];
}

/**
 * カテゴリ別にお気に入りを取得（エール提案用）
 */
export async function getFavoritesByCategory(
    ownerUid: string,
    categoryL3: string
): Promise<Favorite[]> {
    const favoritesRef = collection(db, 'favorites');
    const q = query(
        favoritesRef,
        where('owner_uid', '==', ownerUid),
        where('category_l3', '==', categoryL3)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        doc_id: doc.id,
        ...doc.data(),
    })) as Favorite[];
}

/**
 * カードIDでお気に入り登録済みかチェック
 */
export async function isFavoriteByCardId(
    ownerUid: string,
    targetCardId: string
): Promise<boolean> {
    const favoritesRef = collection(db, 'favorites');
    const q = query(
        favoritesRef,
        where('owner_uid', '==', ownerUid),
        where('target_card_id', '==', targetCardId)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
}

/**
 * お気に入りドキュメントを取得（削除用）
 */
async function findFavoriteDoc(
    ownerUid: string,
    targetCardId: string
): Promise<string | null> {
    const favoritesRef = collection(db, 'favorites');
    const q = query(
        favoritesRef,
        where('owner_uid', '==', ownerUid),
        where('target_card_id', '==', targetCardId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }
    return snapshot.docs[0].id;
}

/**
 * お気に入り登録
 */
export async function addFavorite(
    ownerUid: string,
    targetUid: string,
    targetCardId: string,
    categoryL3: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. 上限チェック
        const currentCount = await getFavoriteCount(ownerUid);
        if (currentCount >= FAVORITE_LIMIT) {
            return { success: false, error: 'LIMIT_REACHED' };
        }

        // 2. 重複チェック
        const existing = await isFavoriteByCardId(ownerUid, targetCardId);
        if (existing) {
            return { success: false, error: 'ALREADY_EXISTS' };
        }

        // 3. 登録
        await addDoc(collection(db, 'favorites'), {
            owner_uid: ownerUid,
            target_uid: targetUid,
            target_card_id: targetCardId,
            category_l3: categoryL3,
            created_at: serverTimestamp(),
        });

        return { success: true };
    } catch (error) {
        console.error('addFavorite error:', error);
        return { success: false, error: 'UNKNOWN_ERROR' };
    }
}

/**
 * お気に入り解除
 */
export async function removeFavorite(
    ownerUid: string,
    targetCardId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const docId = await findFavoriteDoc(ownerUid, targetCardId);
        if (!docId) {
            return { success: false, error: 'NOT_FOUND' };
        }

        await deleteDoc(doc(db, 'favorites', docId));
        return { success: true };
    } catch (error) {
        console.error('removeFavorite error:', error);
        return { success: false, error: 'UNKNOWN_ERROR' };
    }
}

/**
 * お気に入りカードIDのセットを取得（高速チェック用）
 */
export async function getFavoriteCardIds(ownerUid: string): Promise<Set<string>> {
    const favorites = await getFavorites(ownerUid);
    return new Set(favorites.map((f) => f.target_card_id));
}
