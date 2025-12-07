// src/hooks/useUserDisplayName.ts
// UIDから表示名を取得するフック（他ユーザーの名前取得用）

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * UIDから表示名を取得
 * @param uid - ユーザーID
 * @returns 表示名（display_nameまたはデフォルト名）
 */
export const useUserDisplayName = (uid: string | null | undefined): string => {
    const [displayName, setDisplayName] = useState<string>('');

    useEffect(() => {
        if (!uid) {
            setDisplayName('ユーザー');
            return;
        }

        loadDisplayName(uid);
    }, [uid]);

    const loadDisplayName = async (userId: string) => {
        try {
            // システムユーザー
            if (userId === 'system') {
                setDisplayName('ハビットシステム');
                return;
            }

            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                const name = data.display_name;

                if (name) {
                    setDisplayName(name);
                } else {
                    // display_nameがnullの場合はデフォルト表示
                    setDisplayName(`ユーザー${userId.substring(0, 4)}`);
                }
            } else {
                // ユーザードキュメントが存在しない場合
                setDisplayName(`ユーザー${userId.substring(0, 4)}`);
            }
        } catch (err) {
            console.error('表示名取得エラー:', err);
            setDisplayName(`ユーザー${userId.substring(0, 4)}`);
        }
    };

    return displayName;
};
