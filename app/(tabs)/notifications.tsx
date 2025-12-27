// app/(tabs)/notifications.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReactions, markReactionAsRead } from '../../src/hooks/useReactions';
import { REACTIONS } from '../../src/types';
import { CheerSender } from '../../src/components/CheerSender';

export default function NotificationsScreen() {
  const { reactions, loading } = useReactions();

  // エールをタップして既読にする
  const handleReactionPress = async (reactionId: string, isRead: boolean) => {
    if (!isRead) {
      await markReactionAsRead(reactionId);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      </SafeAreaView>
    );
  }

  if (reactions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emoji}>🔔</Text>
          <Text style={styles.emptyTitle}>エールはまだありません</Text>
          <Text style={styles.emptyDescription}>
            習慣を記録すると、仲間からエールが届きます
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>通知一覧</Text>
      </View>
      <FlatList
        data={reactions}
        keyExtractor={(item) => item.reaction_id}
        renderItem={({ item }) => {
          const reactionInfo = REACTIONS[item.type];
          const cardTitle = item.card_title || '習慣カード';

          // Icon logic: Use reaction icon instead of generic placeholder
          const icon = reactionInfo.icon;

          return (
            <TouchableOpacity
              style={[styles.reactionItem, !item.is_read && styles.reactionItemUnread]}
              onPress={() => handleReactionPress(item.reaction_id, item.is_read)}
            >
              <View style={styles.reactionHeader}>
                <View style={styles.senderRow}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{icon}</Text>
                  </View>
                  <Text style={styles.senderName}>
                    <CheerSender uid={item.from_uid} />
                  </Text>
                </View>
                <Text style={styles.reactionTime}>
                  {item.created_at ? formatTime(item.created_at.toDate()) : ''}
                </Text>
              </View>
              <View style={styles.reactionContent}>
                <View style={styles.reactionText}>
                  <Text style={styles.reactionMessage}>
                    {item.message || reactionInfo.label}
                  </Text>
                  <Text style={styles.cardTitle}>「{cardTitle}」にエールが届きました</Text>
                </View>
              </View>
              {!item.is_read && <View style={styles.unreadBadge} />}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

// 時刻フォーマット (Unified format: Relative for <7 days, Absolute date for others)
function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'たった今';
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingVertical: 8,
  },
  reactionItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 6,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reactionItemUnread: {
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  reactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 20,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  reactionTime: {
    fontSize: 12,
    color: '#999999',
  },
  reactionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: 40, // Indent content to align with text, not avatar
  },
  reactionText: {
    flex: 1,
  },
  reactionMessage: {
    fontSize: 15,
    color: '#333333',
    marginBottom: 4,
    lineHeight: 22,
  },
  cardTitle: {
    fontSize: 13,
    color: '#999999',
  },
  unreadBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A90E2',
  },
});
