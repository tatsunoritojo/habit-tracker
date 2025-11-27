// src/hooks/useTemplates.ts
// カードテンプレート一覧を取得するカスタムフック

import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CardTemplate } from '../types';

export function useTemplates() {
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const templatesSnapshot: QuerySnapshot<DocumentData> = await getDocs(
        collection(db, 'card_templates')
      );

      const templatesList = templatesSnapshot.docs.map((doc) => ({
        ...doc.data(),
      } as CardTemplate));

      // アクティブなテンプレートのみ、sort_orderでソート
      const activeTemplates = templatesList
        .filter((t) => t.is_active)
        .sort((a, b) => a.sort_order - b.sort_order);

      setTemplates(activeTemplates);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('テンプレート取得エラー:', err);
      setError(err as Error);
      setLoading(false);
    }
  };

  return { templates, loading, error, refresh: loadTemplates };
}
