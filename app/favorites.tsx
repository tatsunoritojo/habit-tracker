// app/favorites.tsx
// S11: お気に入り一覧画面（Phase 10-A）

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFavorites } from '../src/hooks/useFavorites';
import { useUserDisplayName } from '../src/hooks/useUserDisplayName';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { useEffect } from 'react';
import { Card } from '../src/types';

// お気に入りカード表示用のデータ型
type FavoriteCardData = {
    docId: string;
    targetUid: string;
    targetCardId: string;
    categoryL3: string;
    displayName: string;
    cardTitle: string;
    currentStreak: number;
};

// お気に入りアイテムコンポーネント
const FavoriteItem: React.FC<{
    favorite: FavoriteCardData;
    onRemove: () => void;
}> = ({ favorite, onRemove }) => {
    const handleRemove = () => {
        Alert.alert(
            'お気に入りを解除',
            `${favorite.displayName} をお気に入りから解除しますか？`,
            [
                { text: 'キャンセル', style: 'cancel' },
                { text: '解除する', style: 'destructive', onPress: onRemove },
            ]
        );
    };

    return (
        <View style={styles.favoriteItem}>
            <View style={styles.favoriteInfo}>
                <Text style={styles.favoriteName}>★ {favorite.displayName}</Text>
                <Text style={styles.favoriteDetails}>
                    {favorite.cardTitle} / 連続 {favorite.currentStreak}日
                </Text>
            </View>
            <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
                <Text style={styles.removeButtonText}>解除</Text>
            </TouchableOpacity>
        </View>
    );
};

export default function FavoritesScreen() {
    const { favorites, loading, removeFavorite, refresh } = useFavorites();
    const [favoriteCards, setFavoriteCards] = useState<FavoriteCardData[]>([]);
    const [loadingCards, setLoadingCards] = useState(true);

    // お気に入りごとにカード情報とユーザー情報を取得
    useEffect(() => {
        const loadFavoriteDetails = async () => {
            if (loading) return;

            setLoadingCards(true);
            const cardDataPromises = favorites.map(async (fav) => {
                try {
                    // カード情報取得
                    const cardRef = doc(db, 'cards', fav.target_card_id);
                    const cardSnap = await getDoc(cardRef);
                    let cardTitle = '習慣カード';
                    let currentStreak = 0;

                    if (cardSnap.exists()) {
                        const cardData = cardSnap.data() as Card;
                        cardTitle = cardData.title;
                        currentStreak = cardData.current_streak || 0;
                    }

                    // ユーザー情報取得
                    const userRef = doc(db, 'users', fav.target_uid);
                    const userSnap = await getDoc(userRef);
                    let displayName = `#${fav.target_uid.substring(0, 4).toLowerCase()}`;

                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        if (userData.display_name) {
                            displayName = userData.display_name;
                        }
                    }

                    return {
                        docId: fav.doc_id,
                        targetUid: fav.target_uid,
                        targetCardId: fav.target_card_id,
                        categoryL3: fav.category_l3,
                        displayName,
                        cardTitle,
                        currentStreak,
                    };
                } catch (error) {
                    console.error('Failed to load favorite details:', error);
                    return {
                        docId: fav.doc_id,
                        targetUid: fav.target_uid,
                        targetCardId: fav.target_card_id,
                        categoryL3: fav.category_l3,
                        displayName: `#${fav.target_uid.substring(0, 4).toLowerCase()}`,
                        cardTitle: '習慣カード',
                        currentStreak: 0,
                    };
                }
            });

            const results = await Promise.all(cardDataPromises);
            setFavoriteCards(results);
            setLoadingCards(false);
        };

        loadFavoriteDetails();
    }, [favorites, loading]);

    const handleRemove = async (targetCardId: string) => {
        const result = await removeFavorite(targetCardId);
        if (!result.success) {
            Alert.alert('エラー', '解除に失敗しました');
        }
    };

    if (loading || loadingCards) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>お気に入りの仲間</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>読み込み中...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* ヘッダー */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>お気に入りの仲間</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content}>
                {favoriteCards.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>☆</Text>
                        <Text style={styles.emptyTitle}>お気に入りの仲間は{'\n'}まだいません</Text>
                        <Text style={styles.emptyText}>
                            エール提案画面で{'\n'}☆をタップして追加
                        </Text>
                    </View>
                ) : (
                    <>
                        {favoriteCards.map((fav) => (
                            <FavoriteItem
                                key={fav.docId}
                                favorite={fav}
                                onRemove={() => handleRemove(fav.targetCardId)}
                            />
                        ))}
                    </>
                )}

                {/* 説明テキスト */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoEmoji}>💡</Text>
                    <Text style={styles.infoText}>
                        お気に入りの仲間は{'\n'}エール提案で優先的に{'\n'}表示されます
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    backButton: {
        width: 40,
    },
    backButtonText: {
        fontSize: 28,
        color: '#4A90E2',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#8E8E93',
        fontSize: 16,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 80,
        paddingHorizontal: 32,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 16,
        color: '#C7C7CC',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333333',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 26,
    },
    emptyText: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 20,
    },
    favoriteItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    favoriteInfo: {
        flex: 1,
        marginRight: 12,
    },
    favoriteName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 4,
    },
    favoriteDetails: {
        fontSize: 13,
        color: '#8E8E93',
    },
    removeButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#F2F2F7',
        borderRadius: 8,
    },
    removeButtonText: {
        fontSize: 14,
        color: '#FF3B30',
        fontWeight: '500',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9E6',
        borderRadius: 12,
        padding: 16,
        marginTop: 24,
        marginBottom: 32,
    },
    infoEmoji: {
        fontSize: 24,
        marginRight: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#666666',
        lineHeight: 20,
    },
});
