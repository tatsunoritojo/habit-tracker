import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CategoryCard } from '../src/components/CategoryCard';
import { useCategories } from '../src/hooks/useCategories';
import { Category } from '../src/types';

export default function AddCardScreen() {
  const router = useRouter();
  const { getL1Categories, loading, error } = useCategories();

  // L1カテゴリ取得
  const categories = getL1Categories();

  const handleSelectCategory = (category: Category) => {
    router.push({
      pathname: '/select-card',
      params: { l1: category.category_id, title: category.name_ja },
    });
  };

  const handleCreateCustom = () => {
    router.push('/create-custom-card');
  };

  // カテゴリごとの説明文マッピング
  const getCategoryDescription = (id: string) => {
    const map: Record<string, string> = {
      physical_health: '運動・食事・睡眠',
      mental_health: 'メンタルケア・マインドフルネス',
      productivity_learning: '仕事・学習・キャリア',
      living_household: '家事・生活習慣',
      finance: '家計・資産運用',
      relationships: '家族・友人・パートナー',
      hobbies_creativity: '趣味・創作・余暇',
    };
    return map[id] || '';
  };

  // アイコンはDBから取得したものを使用（フォールバック不要だが一応）
  const getCategoryIcon = (id: string, dbIcon: string) => {
    return dbIcon || '📁';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>⚠️ {error.message}</Text>
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
        <Text style={styles.headerTitle}>習慣を選ぶ</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.category_id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.instructionArea}>
            <Text style={styles.instructionTitle}>カテゴリを選んでください</Text>
            <Text style={styles.instructionText}>
              続けたい習慣はどの分野ですか？
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <CategoryCard
            icon={getCategoryIcon(item.category_id, item.icon)}
            name={item.name_ja}
            description={getCategoryDescription(item.category_id)}
            onPress={() => handleSelectCategory(item)}
          />
        )}
        ListFooterComponent={
          <View style={styles.footerArea}>
            <TouchableOpacity
              style={styles.customButton}
              onPress={handleCreateCustom}
              activeOpacity={0.7}
            >
              <Text style={styles.customButtonIcon}>✨</Text>
              <Text style={styles.customButtonText}>オリジナルを作成</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  instructionArea: {
    marginBottom: 24,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666666',
  },
  footerArea: {
    marginTop: 24,
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderStyle: 'dashed',
  },
  customButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  customButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

