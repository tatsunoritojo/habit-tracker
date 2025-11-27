// src/hooks/useCardLogs.ts
// 特定カードのログ一覧を取得するカスタムフック

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import type { Log } from '../types';

export function useCardLogs(cardId: string) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setLoading(false);
      setError(new Error('ユーザーが認証されていません'));
      return;
    }

    if (!cardId) {
      setLoading(false);
      setError(new Error('カードIDが指定されていません'));
      return;
    }

    // カードのログをリアルタイムで取得
    const logsQuery = query(
      collection(db, 'logs'),
      where('card_id', '==', cardId),
      where('owner_uid', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      logsQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const logsList = snapshot.docs
          .map((doc) => ({
            log_id: doc.id,
            ...doc.data(),
          } as Log))
          .sort((a, b) => b.logged_date.localeCompare(a.logged_date)); // 降順ソート

        setLogs(logsList);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('ログ取得エラー:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [cardId]);

  return { logs, loading, error };
}
