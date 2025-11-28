// app/(tabs)/settings.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, Switch, TouchableOpacity, Linking, Alert } from 'react-native';
import { useSettings } from '../../src/hooks/useSettings';
import { auth } from '../../src/lib/firebase';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const { settings, loading, updateSettings } = useSettings();

  const handleNotificationToggle = async (value: boolean) => {
    try {
      await updateSettings({ push_enabled: value });
    } catch (error) {
      Alert.alert('エラー', '設定の更新に失敗しました');
    }
  };

  const handleSignOut = async () => {
    // 匿名認証なのでログアウトは慎重に（データが消える可能性があるため警告を出すなど）
    // 今回は簡易的に実装
    Alert.alert('ログアウト', 'ログアウト機能は現在実装中です');
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('エラー', 'リンクを開けませんでした');
    });
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>設定</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* 通知設定セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>通知</Text>
          <View style={styles.row}>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>エール通知</Text>
              <Text style={styles.rowSubtitle}>応援メッセージの通知を受け取る</Text>
            </View>
            <Switch
              value={settings.push_enabled}
              onValueChange={(value) => handleNotificationToggle(value)}
              trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
              thumbColor={'#FFFFFF'}
              disabled={loading}
            />
          </View>

          {settings.push_enabled && (
            <>
              <View style={styles.row}>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>お休みモード</Text>
                  <Text style={styles.rowSubtitle}>
                    {settings.quiet_hours_start || '23:00'} 〜 {settings.quiet_hours_end || '07:00'} の間は通知を停止
                  </Text>
                </View>
                <Switch
                  value={settings.quiet_hours_enabled ?? true}
                  onValueChange={(value) => updateSettings({ quiet_hours_enabled: value })}
                  trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                  thumbColor={'#FFFFFF'}
                  disabled={loading}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>エール頻度</Text>
                  <Text style={styles.rowSubtitle}>通知を受け取る頻度を設定</Text>
                </View>
                <View style={styles.frequencyContainer}>
                  {(['low', 'medium', 'high'] as const).map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.frequencyButton,
                        settings.cheer_frequency === freq && styles.frequencyButtonActive
                      ]}
                      onPress={() => updateSettings({ cheer_frequency: freq })}
                    >
                      <Text style={[
                        styles.frequencyText,
                        settings.cheer_frequency === freq && styles.frequencyTextActive
                      ]}>
                        {freq === 'low' ? '少なめ' : freq === 'medium' ? '普通' : '多め'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}
        </View>

        {/* アカウントセクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アカウント</Text>
          <View style={styles.row}>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>ユーザーID</Text>
              <Text style={styles.rowSubtitle}>{auth.currentUser?.uid || '未認証'}</Text>
            </View>
          </View>
          {/* 
          <TouchableOpacity style={styles.row} onPress={handleSignOut}>
            <Text style={[styles.rowTitle, { color: '#FF3B30' }]}>ログアウト</Text>
          </TouchableOpacity>
           */}
        </View>

        {/* アプリについてセクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アプリについて</Text>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>バージョン</Text>
            <Text style={styles.rowValue}>{appVersion}</Text>
          </View>
          <TouchableOpacity style={styles.row} onPress={() => openLink('https://example.com/terms')}>
            <Text style={styles.rowTitle}>利用規約</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => openLink('https://example.com/privacy')}>
            <Text style={styles.rowTitle}>プライバシーポリシー</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // iOS設定画面風の背景色
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6E6E73',
    marginLeft: 16,
    marginBottom: 8,
    marginTop: -24, // セクションヘッダーをリストの外側に配置するような見た目調整
    paddingTop: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  rowContent: {
    flex: 1,
    marginRight: 16,
  },
  rowTitle: {
    fontSize: 17,
    color: '#000000',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  rowValue: {
    fontSize: 17,
    color: '#8E8E93',
  },
  chevron: {
    fontSize: 20,
    color: '#C7C7CC',
    fontWeight: '600',
  },
  frequencyContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 2,
  },
  frequencyButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  frequencyButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  frequencyText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  frequencyTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
});
