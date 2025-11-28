import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface UserSettings {
    push_enabled: boolean;
    cheer_frequency?: 'high' | 'medium' | 'low';
    quiet_hours_enabled?: boolean;
    quiet_hours_start?: string;
    quiet_hours_end?: string;
}

const DEFAULT_SETTINGS: UserSettings = {
    push_enabled: true,
};

export function useSettings() {
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setLoading(false);
            return;
        }

        const userRef = doc(db, 'users', user.uid);

        const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                // settingsフィールドが存在しない場合はデフォルト値を使用
                setSettings({
                    ...DEFAULT_SETTINGS,
                    ...(userData.settings || {}),
                });
            } else {
                // ユーザードキュメント自体が存在しない場合
                setSettings(DEFAULT_SETTINGS);
            }
            setLoading(false);
        }, (error) => {
            console.error('Error fetching settings:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const updateSettings = async (newSettings: Partial<UserSettings>) => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const userRef = doc(db, 'users', user.uid);
            const updates: Record<string, any> = {};
            Object.entries(newSettings).forEach(([key, value]) => {
                updates[`settings.${key}`] = value;
            });

            await updateDoc(userRef, updates);
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    };

    return {
        settings,
        loading,
        updateSettings,
    };
}
