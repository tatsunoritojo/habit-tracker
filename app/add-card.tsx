// app/add-card.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../src/lib/firebase';
import { useTemplates } from '../src/hooks/useTemplates';
import type { CardTemplate } from '../src/types';

export default function AddCardScreen() {
  const router = useRouter();
  const { templates, loading, error } = useTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null);
  const [isPublic, setIsPublic] = useState(true);

  // カード作成
  const handleCreateCard = async () => {
    if (!selectedTemplate) {
      Alert.alert('エラー', 'テンプレートを選択してください');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('エラー', 'ユーザーが認証されていません');
      return;
    }

    try {
      const now = Timestamp.now();

      // カードデータ
      const cardData = {
        owner_uid: currentUser.uid,
        category_l1: selectedTemplate.category_l1,
        category_l2: selectedTemplate.category_l2,
        category_l3: selectedTemplate.category_l3,
        title: selectedTemplate.title_ja,
        template_id: selectedTemplate.template_id,
        is_custom: false,
        is_public: isPublic,
        current_streak: 0,
        longest_streak: 0,
        total_logs: 0,
        last_log_date: '',
        created_at: now,
        updated_at: now,
      };

      await addDoc(collection(db, 'cards'), cardData);

      Alert.alert('成功', 'カードを作成しました！', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('カード作成エラー:', error);
      Alert.alert('エラー', 'カードの作成に失敗しました');
    }
  };

  // テンプレート選択
  const handleSelectTemplate = (template: CardTemplate) => {
    setSelectedTemplate(template);
  };

  // テンプレートアイテム
  const renderTemplate = ({ item }: { item: CardTemplate }) => {
    const isSelected = selectedTemplate?.template_id === item.template_id;

    return (
      <TouchableOpacity
        style={[styles.templateItem, isSelected && styles.templateItemSelected]}
        onPress={() => handleSelectTemplate(item)}
        activeOpacity={0.7}
      >
        <View style={styles.templateHeader}>
          <Text style={styles.templateIcon}>{item.icon}</Text>
          <Text style={styles.templateTitle}>{item.title_ja}</Text>
        </View>
        {item.description_ja && (
          <Text style={styles.templateDescription}>{item.description_ja}</Text>
        )}
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>✓ 選択中</Text>
          </View>
        )}
      </TouchableOpacity>
    );
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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>カードを追加</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 説明 */}
      <View style={styles.instructionArea}>
        <Text style={styles.instructionText}>
          まずは1つだけ、小さく始めましょう。
        </Text>
      </View>

      {/* テンプレート一覧 */}
      <FlatList
        data={templates}
        renderItem={renderTemplate}
        keyExtractor={(item) => item.template_id}
        contentContainerStyle={styles.templateList}
      />

      {/* 下部エリア */}
      {selectedTemplate && (
        <View style={styles.bottomArea}>
          {/* 公開設定 */}
          <TouchableOpacity
            style={styles.publicToggle}
            onPress={() => setIsPublic(!isPublic)}
            activeOpacity={0.7}
          >
            <View style={styles.checkbox}>
              {isPublic && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.publicToggleText}>
              <Text style={styles.publicToggleLabel}>公開する</Text>
              <Text style={styles.publicToggleDescription}>
                （同じ習慣の仲間とエールを送り合える）
              </Text>
            </View>
          </TouchableOpacity>

          {/* 作成ボタン */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateCard}
            activeOpacity={0.7}
          >
            <Text style={styles.createButtonText}>始める</Text>
          </TouchableOpacity>
        </View>
      )}
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
  backButton: {
    fontSize: 28,
    color: '#333333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  instructionArea: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8F8F8',
  },
  instructionText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  templateList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 200,
  },
  templateItem: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  templateItemSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#F0F7FF',
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  templateIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  templateDescription: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
  },
  selectedBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  selectedBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  publicToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkmark: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  publicToggleText: {
    flex: 1,
  },
  publicToggleLabel: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  publicToggleDescription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  createButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
