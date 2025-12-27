import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase'; // Correct path
import { Category } from '../types';

export const useCategories = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // リアルタイムリスナーではなく、頻繁に変わらないのでgetDocsでも良いが
        // 管理画面等で即時反映したい場合はonSnapshot。ここではonSnapshotにしておく。
        const q = query(
            collection(db, 'categories'),
            where('is_active', '==', true),
            orderBy('sort_order', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cats: Category[] = [];
            snapshot.forEach((doc) => {
                cats.push(doc.data() as Category);
            });
            setCategories(cats);
            setLoading(false);
        }, (err) => {
            console.error("Failed to fetch categories:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Helpers - useCallback でメモ化して無限ループを防止
    const getL1Categories = useCallback(
        () => categories.filter(c => c.level === 1),
        [categories]
    );

    const getL2Categories = useCallback(
        (l1Id: string) => categories.filter(c => c.level === 2 && c.parent_id === l1Id),
        [categories]
    );

    // L3 returns specific L3s OR the :other L3
    const getL3Categories = useCallback(
        (l2Id: string) => categories.filter(c => c.level === 3 && c.parent_id === l2Id),
        [categories]
    );

    const getCategoryById = useCallback(
        (id: string) => categories.find(c => c.category_id === id),
        [categories]
    );

    return {
        categories,
        loading,
        error,
        getL1Categories,
        getL2Categories,
        getL3Categories,
        getCategoryById,
    };
};

