// src/hooks/useUserProfile.ts
// 現在のユーザーのプロフィール情報を取得・更新するフック

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export const useUserProfile = () => {
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                setLoading(false);
                return;
            }

            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                setDisplayName(data.display_name || null);
            }

            setLoading(false);
        } catch (err) {
            console.error('プロフィール取得エラー:', err);
            setError(err as Error);
            setLoading(false);
        }
    };

    const updateDisplayName = async (newName: string): Promise<boolean> => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return false;

            // バリデーション
            if (newName.length < 1 || newName.length > 20) {
                throw new Error('ニックネームは1〜20文字で入力してください');
            }

            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                display_name: newName,
                updated_at: Timestamp.now(),
            });

            setDisplayName(newName);
            return true;
        } catch (err) {
            console.error('ニックネーム更新エラー:', err);
            setError(err as Error);
            return false;
        }
    };

    return {
        displayName,
        loading,
        error,
        updateDisplayName,
        refresh: loadProfile,
    };
};
