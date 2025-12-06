// src/hooks/useCheerSuggestions.ts
import { useState, useEffect, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { getCheerSuggestions, CheerSuggestion } from '../services/cheerSendService';

export function useCheerSuggestions() {
    const [suggestions, setSuggestions] = useState<CheerSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchSuggestions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                setSuggestions([]);
                return;
            }

            const data = await getCheerSuggestions(user.uid);
            setSuggestions(data);
        } catch (err) {
            console.error('Failed to fetch cheer suggestions:', err);
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, []);

    // 初回マウント時に取得
    useEffect(() => {
        fetchSuggestions();
    }, [fetchSuggestions]);

    // 送信後にリストから削除するヘルパー
    const removeSuggestion = useCallback((cardId: string) => {
        setSuggestions((prev) => prev.filter((s) => s.card_id !== cardId));
    }, []);

    return {
        suggestions,
        loading,
        error,
        refresh: fetchSuggestions,
        removeSuggestion,
    };
}
