// app/(tabs)/home.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCards } from '../../src/hooks/useCards';
import { useStats } from '../../src/hooks/useStats';
import { useReactions } from '../../src/hooks/useReactions';
import { useCheerSuggestions } from '../../src/hooks/useCheerSuggestions';
import { recordLog } from '../../src/services/logService';
import { auth } from '../../src/lib/firebase';

export default function HomeScreen() {
  const router = useRouter();
  const { cards, loading, error } = useCards();
  const { stats } = useStats();
  const { reactions } = useReactions();
  const { suggestions } = useCheerSuggestions(); // エール提案を取得
  const [recording, setRecording] = useState(false);
  const notificationCount = 0; // 将来実装

  // 今日の日付（YYYY-MM-DD形式）
  const today = new Date().toISOString().split('T')[0];

  // カードごとの最新エールを取得
  const latestCheersByCard = useMemo(() => {
    const cheerMap: Record<string, { icons: string; from: string }> = {};

    cards.forEach((card) => {
      const cardCheers = reactions
        .filter((r) => r.to_card_id === card.card_id)
        .sort((a, b) => {
          const aTime = a.created_at?.toDate().getTime() || 0;
          const bTime = b.created_at?.toDate().getTime() || 0;
          return bTime - aTime;
        })
        .slice(0, 2); // 最新2件

      if (cardCheers.length > 0) {
        const icons = cardCheers
          .map((c) => (c.type === 'amazing' ? '⭐' : c.type === 'cheer' ? '💪' : '🤝'))
          .join('');
        cheerMap[card.card_id] = { icons, from: 'ハビット仲間' };
      }
    });

    return cheerMap;
  }, [cards, reactions]);

  // カードタップハンドラ
  const handleCardPress = (card: any) => {
    // 今日のログがあるか確認
    const isLoggedToday = card.last_log_date === today;

    if (!isLoggedToday) {
      // 未記録の場合：記録確認ダイアログ
      Alert.alert(
        card.title,
        '今日の記録をつけますか？',
        [
          {
            text: 'キャンセル',
            style: 'cancel',
          },
          {
            text: '記録する',
            onPress: async () => {
              const currentUser = auth.currentUser;
              if (!currentUser) {
                Alert.alert('エラー', 'ユーザーが認証されていません');
                return;
              }

              setRecording(true);
              try {
                await recordLog(card.card_id, currentUser.uid);
                Alert.alert('成功', '記録しました！');
              } catch (err) {
                console.error('ログ記録エラー:', err);
                Alert.alert('エラー', 'ログの記録に失敗しました');
              } finally {
                setRecording(false);
              }
            },
          },
        ]
      );
    } else {
      // 記録済みの場合：詳細画面へ遷移
      router.push(`/card-detail/${card.card_id}`);
    }
  };

  // カードコンポーネント
  const renderCard = ({ item }: { item: any }) => {
    const isLoggedToday = item.last_log_date === today;
    const cheer = latestCheersByCard[item.card_id];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>📝</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
        <View style={styles.cardStats}>
          <Text style={styles.cardStatText}>
            今日: {isLoggedToday ? '✔' : '□'}  連続: {item.current_streak}日
          </Text>
        </View>
        {cheer && (
          <View style={styles.cardCheer}>
            <Text style={styles.cardCheerText}>
              エール: {cheer.icons}  from {cheer.from}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // 「+ カードを追加」ボタン
  const renderAddCardButton = () => (
    <TouchableOpacity
      style={styles.addCardButton}
      onPress={() => router.push('/add-card')}
      activeOpacity={0.7}
    >
      <Text style={styles.addCardText}>+ カードを追加</Text>
    </TouchableOpacity>
  );

  // 空の状態
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>📝</Text>
      <Text style={styles.emptyTitle}>まだカードがありません</Text>
      <Text style={styles.emptyDescription}>
        「+ カードを追加」から習慣を始めましょう
      </Text>
    </View>
  );

  // ローディング中
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // エラー表示
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>エラーが発生しました</Text>
          <Text style={styles.errorDetail}>{error.message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => console.log('menu pressed')}>
          <Text style={styles.menuIcon}>≡</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => console.log('notification pressed')}>
          <View style={styles.notificationContainer}>
            <Text style={styles.notificationIcon}>🔔</Text>
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* 統計エリア */}
      <View style={styles.statsArea}>
        <Text style={styles.statsText}>
          今週 {stats.weekDays}日 / 今月 {stats.monthDays}日
        </Text>
      </View>

      {/* エール提案バナー (Phase 8) */}
      {suggestions.length > 0 && (
        <TouchableOpacity
          style={styles.banner}
          onPress={() => router.push('/cheers')}
          activeOpacity={0.8}
        >
          <View style={styles.bannerContent}>
            <Text style={styles.bannerEmoji}>📢</Text>
            <View>
              <Text style={styles.bannerTitle}>エールを送ろう</Text>
              <Text style={styles.bannerText}>
                {suggestions.length}人の仲間が頑張っています！
              </Text>
            </View>
          </View>
          <Text style={styles.bannerArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* カードリスト */}
      <FlatList
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item) => item.card_id}
        contentContainerStyle={styles.cardList}
        ListFooterComponent={renderAddCardButton}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuIcon: {
    fontSize: 28,
    color: '#333333',
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationIcon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsArea: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statsText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  statsSubText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  banner: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  bannerText: {
    fontSize: 12,
    color: '#666666',
  },
  bannerArrow: {
    fontSize: 24,
    color: '#CCCCCC',
    fontWeight: '300',
  },
  cardList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  cardStats: {
    marginBottom: 8,
  },
  cardStatText: {
    fontSize: 14,
    color: '#666666',
  },
  cardCheer: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cardCheerText: {
    fontSize: 13,
    color: '#4A90E2',
    fontWeight: '500',
  },
  addCardButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addCardText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});
