// app/today-cheers.tsx
// S09: 今日のエール画面（まとめて通知タップ時の遷移先）

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useReactions } from '../src/hooks/useReactions';
import { useCards } from '../src/hooks/useCards';

export default function TodayCheersScreen() {
  const { reactions, loading } = useReactions();
  const { cards } = useCards();

  // 今日のエールをフィルタリング
  const todayCheers = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return reactions.filter((reaction) => {
      if (!reaction.created_at) return false;
      const createdDate = reaction.created_at.toDate().toISOString().split('T')[0];
      return createdDate === today;
    });
  }, [reactions]);

  // ハイライト: リアクション種別でグループ化
  const highlights = useMemo(() => {
    const grouped: Record<string, { icon: string; message: string; cardTitle: string }[]> = {
      amazing: [],
      cheer: [],
      support: [],
    };

    todayCheers.forEach((reaction) => {
      const card = cards.find((c) => c.card_id === reaction.to_card_id);
      const cardTitle = card?.title || '習慣カード';

      const icon = reaction.type === 'amazing' ? '⭐' : reaction.type === 'cheer' ? '💪' : '🤝';

      grouped[reaction.type]?.push({
        icon,
        message: reaction.message,
        cardTitle,
      });
    });

    return grouped;
  }, [todayCheers, cards]);

  // 時刻順の一覧
  const cheersList = useMemo(() => {
    return todayCheers.map((reaction) => {
      const card = cards.find((c) => c.card_id === reaction.to_card_id);
      const cardTitle = card?.title || '習慣カード';
      const time = reaction.created_at?.toDate();
      const timeStr = time ? `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}` : '--:--';
      const icon = reaction.type === 'amazing' ? '⭐' : reaction.type === 'cheer' ? '💪' : '🤝';

      return {
        time: timeStr,
        icon,
        message: reaction.message,
        cardTitle,
        timestamp: time?.getTime() || 0,
      };
    }).sort((a, b) => b.timestamp - a.timestamp); // 新しい順
  }, [todayCheers, cards]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>読み込み中...</Text>
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
        <Text style={styles.headerTitle}>今日のエール ({todayCheers.length})</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {todayCheers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyText}>今日のエールはまだありません</Text>
          </View>
        ) : (
          <>
            {/* 今日のハイライト */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>今日のハイライト</Text>
              <View style={styles.highlightsContainer}>
                {highlights.amazing.length > 0 && (
                  <View style={styles.highlightItem}>
                    <Text style={styles.highlightIcon}>⭐</Text>
                    <Text style={styles.highlightText}>
                      「{highlights.amazing[0].cardTitle}」{highlights.amazing[0].message}
                    </Text>
                  </View>
                )}
                {highlights.cheer.length > 0 && (
                  <View style={styles.highlightItem}>
                    <Text style={styles.highlightIcon}>💪</Text>
                    <Text style={styles.highlightText}>
                      「{highlights.cheer[0].cardTitle}」{highlights.cheer[0].message}
                    </Text>
                  </View>
                )}
                {highlights.support.length > 0 && (
                  <View style={styles.highlightItem}>
                    <Text style={styles.highlightIcon}>🤝</Text>
                    <Text style={styles.highlightText}>
                      「{highlights.support[0].cardTitle}」{highlights.support[0].message}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* 一覧 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>一覧</Text>
              {cheersList.map((cheer, index) => (
                <View key={index} style={styles.cheerItem}>
                  <Text style={styles.cheerTime}>{cheer.time}</Text>
                  <View style={styles.cheerContent}>
                    <Text style={styles.cheerMessage}>
                      {cheer.icon} {cheer.message}
                    </Text>
                    <Text style={styles.cheerCardTitle}>「{cheer.cardTitle}」</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
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
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6E6E73',
    marginBottom: 12,
  },
  highlightsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  highlightIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  highlightText: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    lineHeight: 22,
  },
  cheerItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
  },
  cheerTime: {
    fontSize: 13,
    color: '#8E8E93',
    width: 50,
    marginRight: 12,
  },
  cheerContent: {
    flex: 1,
  },
  cheerMessage: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
    marginBottom: 4,
  },
  cheerCardTitle: {
    fontSize: 13,
    color: '#6E6E73',
  },
});
