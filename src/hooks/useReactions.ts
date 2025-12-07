// src/hooks/useReactions.ts
// エール（Reaction）取得用のカスタムフック

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import type { Reaction } from '../types';

/**
 * ユーザーが受け取ったエール一覧を取得
 */
export function useReactions() {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // エールをリアルタイム監視
    const q = query(
      collection(db, 'reactions'),
      where('to_uid', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          reaction_id: doc.id,
          from_uid: docData.from_uid,
          to_uid: docData.to_uid,
          to_card_id: docData.to_card_id,
          type: docData.type,
          reason: docData.reason,
          message: docData.message,
          scheduled_for: docData.scheduled_for,
          delivered: docData.delivered,
          card_title: docData.card_title,
          card_category_name: docData.card_category_name,
          created_at: docData.created_at,
          is_read: docData.is_read,
        } as Reaction;
      });
      setReactions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { reactions, loading };
}

/**
 * エールを既読にする
 */
export async function markReactionAsRead(reactionId: string): Promise<void> {
  try {
    const reactionRef = doc(db, 'reactions', reactionId);
    await updateDoc(reactionRef, {
      is_read: true,
    });
  } catch (error) {
    console.error('エールの既読更新エラー:', error);
  }
}
