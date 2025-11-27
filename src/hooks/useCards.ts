// src/hooks/useCards.ts
// ユーザーのカード一覧を取得するカスタムフック

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import type { Card } from '../types';

export function useCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setLoading(false);
      setError(new Error('ユーザーが認証されていません'));
      return;
    }

    // Firestoreクエリ：現在のユーザーのカードを取得
    // 注：orderByを削除してインデックス不要に（開発初期）
    const cardsQuery = query(
      collection(db, 'cards'),
      where('owner_uid', '==', currentUser.uid)
    );

    // リアルタイムリスナー
    const unsubscribe = onSnapshot(
      cardsQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const cardsList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            card_id: doc.id,
            ...data,
          } as Card;
        });

        setCards(cardsList);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('カード取得エラー:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    // クリーンアップ
    return () => unsubscribe();
  }, []);

  return { cards, loading, error };
}
