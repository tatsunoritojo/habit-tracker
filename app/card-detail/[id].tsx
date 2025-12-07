// app/card-detail/[id].tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { deleteDoc, doc, updateDoc, Timestamp, collection, getDocs, writeBatch, query, where } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { useCards } from '../../src/hooks/useCards';
import { useCardLogs } from '../../src/hooks/useCardLogs';
import { Calendar } from '../../src/components/Calendar';
import { DeleteCardDialog } from '../../src/components/DeleteCardDialog';
import { ArchiveCardDialog } from '../../src/components/ArchiveCardDialog';
import { getBadges, Badge } from '../../src/utils/gamification';

export default function CardDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cards, loading } = useCards();
  const { logs } = useCardLogs(id || '');

  // ダイアログ状態
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // カードIDで該当カードを取得
  const card = cards.find((c) => c.card_id === id);

  // ログ日付を配列に変換
  const loggedDates = logs.map((log) => log.date);

  // バッジ計算
  const [badges, setBadges] = useState<Badge[]>([]);
  React.useEffect(() => {
    if (cards.length > 0 && card) {
      setBadges(getBadges(card, logs));
    }
  }, [logs, card, cards]);

  const handleOpenMenu = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['キャンセル', '編集', 'アーカイブ', '削除'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleEdit();
          if (buttonIndex === 2) setShowArchiveDialog(true);
          if (buttonIndex === 3) setShowDeleteDialog(true);
        }
      );
    } else {
      setShowMenu(true);
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    // router.push({ pathname: '/edit-card', params: { id: card?.card_id } });
    Alert.alert('準備中', '編集機能は実装中です');
  };

  const handleArchive = async () => {
    if (!card) return;
    try {
      const cardRef = doc(db, 'cards', card.card_id);
      await updateDoc(cardRef, {
        status: 'archived',
        archived_at: Timestamp.now(),
      });
      setShowArchiveDialog(false);
      router.back();
      Alert.alert('完了', 'カードをアーカイブしました');
    } catch (error) {
      console.error(error);
      Alert.alert('エラー', 'アーカイブに失敗しました');
    }
  };

  const handleDelete = async () => {
    if (!card) return;
    try {
      // 実際はCloud Functionsでカスケード削除するが、クライアント側でもカード自体は消す（あるいはFunctionsに任せる）
      // Phase 9B-1: Client triggers delete, Cloud Functions cleans up logs/reactions.
      await deleteDoc(doc(db, 'cards', card.card_id));
      setShowDeleteDialog(false);
      router.back();
      Alert.alert('完了', 'カードを削除しました');
    } catch (error) {
      console.error(error);
      Alert.alert('エラー', '削除に失敗しました');
    }
  };

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

  if (!card) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>カードが見つかりません</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>カード詳細</Text>
        <TouchableOpacity style={styles.menuButton} onPress={handleOpenMenu}>
          <Text style={styles.menuButtonText}>︙</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* カード情報 */}
        <View style={styles.cardInfoSection}>
          <Text style={styles.cardIcon}>📝</Text>
          <Text style={styles.cardTitle}>{card.title}</Text>
          {card.status === 'archived' && (
            <View style={styles.archivedBadge}>
              <Text style={styles.archivedText}>📦 アーカイブ済み</Text>
            </View>
          )}
        </View>

        {/* バッジセクション */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>バッジ</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeList} contentContainerStyle={styles.badgeListContent}>
            {badges.map(badge => (
              <View key={badge.id} style={[styles.badgeCard, !badge.achieved && styles.badgeLocked]}>
                <Text style={styles.badgeIcon}>{badge.achieved ? badge.icon : '🔒'}</Text>
                <Text style={styles.badgeName}>{badge.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 統計情報 */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{card.current_streak}</Text>
            <Text style={styles.statLabel}>現在のストリーク</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{card.longest_streak}</Text>
            <Text style={styles.statLabel}>最長ストリーク</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{card.total_logs}</Text>
            <Text style={styles.statLabel}>総記録日数</Text>
          </View>
        </View>

        {/* カレンダーエリア */}
        <View style={styles.calendarSection}>
          <Text style={styles.sectionTitle}>記録カレンダー</Text>
          <Calendar loggedDates={loggedDates} />
        </View>
      </ScrollView>

      {/* Android/Custom Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
              <Text style={styles.menuItemText}>✏️ 編集</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); setShowArchiveDialog(true); }}>
              <Text style={styles.menuItemText}>📦 アーカイブ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItemDestructive} onPress={() => { setShowMenu(false); setShowDeleteDialog(true); }}>
              <Text style={styles.menuItemTextDestructive}>🗑️ 削除</Text>
            </TouchableOpacity>
            <View style={styles.menuSeparator} />
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowMenu(false)}>
              <Text style={styles.menuItemText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <DeleteCardDialog
        visible={showDeleteDialog}
        cardTitle={card.title}
        onClose={() => setShowDeleteDialog(false)}
        onDelete={handleDelete}
        onArchive={() => {
          setShowDeleteDialog(false);
          setShowArchiveDialog(true);
        }}
      />

      <ArchiveCardDialog
        visible={showArchiveDialog}
        cardTitle={card.title}
        onClose={() => setShowArchiveDialog(false)}
        onArchive={handleArchive}
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
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
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
  backButton: {
    fontSize: 28,
    color: '#333333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  menuButton: {
    padding: 8,
  },
  menuButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  cardInfoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cardIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
  },
  archivedBadge: {
    marginTop: 8,
    backgroundColor: '#EEEEEE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  archivedText: {
    fontSize: 12,
    color: '#666666',
  },
  statsSection: {
    flexDirection: 'row',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  calendarSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  calendarPlaceholder: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  placeholderText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  // Menu Modal Styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 40,
  },
  menuItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  menuItemDestructive: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  menuItemTextDestructive: {
    fontSize: 16,
    color: '#D32F2F',
    fontWeight: '600',
  },
  menuSeparator: {
    height: 8,
  },
  // Badge Styles
  sectionContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  badgeList: {
    marginTop: 12,
  },
  badgeListContent: {
    paddingRight: 16,
  },
  badgeCard: {
    backgroundColor: '#FFF9C4', // Gold-ish/Yellow-ish
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    width: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeLocked: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
});

