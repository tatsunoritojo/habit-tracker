// app/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { ensureAnonymousLoginAndUser } from '../src/lib/firebase';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        console.log('RootLayout: init start');
        await ensureAnonymousLoginAndUser();
        console.log('RootLayout: init done');
      } catch (e) {
        console.error('Firebase init error', e);
        setError(e instanceof Error ? e.message : 'Firebase初期化に失敗しました');
      } finally {
        setReady(true);
      }
    };

    run();
  }, []);

  if (!ready) {
    // Firebase 初期化中は簡単なローディングを出す
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  // エラーが発生した場合はエラー画面を表示
  if (error) {
    return (
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
    );
  }

  // ここから先で通常の画面（index.tsx など）が表示される
  return <Stack />;
}
