// app/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ensureAnonymousLoginAndUser } from '../src/lib/firebase';
import { initializeNotifications, setupNotificationListeners } from '../src/lib/notifications';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        console.log('[RootLayout] init start');
        await ensureAnonymousLoginAndUser();
        console.log('[RootLayout] firebase done');

        // Phase 7: プッシュ通知の初期化
        await initializeNotifications();
        console.log('[RootLayout] notifications done');
      } catch (e) {
        console.error('Firebase init error', e);
        setError(e instanceof Error ? e.message : 'Firebase初期化に失敗しました');
      } finally {
        console.log('[RootLayout] setReady(true)');
        setReady(true);
      }
    };

    run();

    // Phase 7: 通知リスナーのセットアップ
    const cleanupNotificationListeners = setupNotificationListeners();

    return () => {
      cleanupNotificationListeners();
    };
  }, []);

  if (!ready) {
    // Firebase 初期化中は簡単なローディングを出す
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF',
          }}
        >
          <ActivityIndicator />
          <Text style={{ marginTop: 10, color: '#666' }}>読み込み中...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // エラーが発生した場合はエラー画面を表示
  if (error) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            backgroundColor: '#FFFFFF',
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FF0000', marginBottom: 10 }}>
            エラーが発生しました
          </Text>
          <Text style={{ fontSize: 14, color: '#333333', textAlign: 'center' }}>
            {error}
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // SafeAreaProviderで全画面をラップし、各画面でSafeAreaViewを使用可能にする
  // 各画面は react-native-safe-area-context の SafeAreaView を個別に使用する
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}

