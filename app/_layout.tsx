// app/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ensureAnonymousLoginAndUser } from '../src/lib/firebase';
import { initializeNotifications, setupNotificationListeners } from '../src/lib/notifications';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);
  const [userTapped, setUserTapped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  // Firebase準備完了後にタップヒントをすぐにフェードイン
  useEffect(() => {
    if (ready) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [ready]);

  if (!ready || !userTapped) {
    // Firebase 初期化中 or ユーザーがタップするまで待機
    // バックグラウンドでロード完了していればいつでもタップ可能
    const canProceed = ready;

    return (
      <SafeAreaProvider>
        <TouchableOpacity
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF',
          }}
          onPress={() => {
            if (canProceed) {
              setUserTapped(true);
            }
          }}
          activeOpacity={canProceed ? 0.7 : 1}
          disabled={!canProceed}
        >
          <LottieView
            source={require('../assets/Welcome.json')}
            autoPlay
            loop={false}
            style={{ width: 250, height: 250 }}
            resizeMode="contain"
            onAnimationFinish={() => setAnimationFinished(true)}
          />

          {canProceed && (
            <Animated.View
              style={{
                opacity: fadeAnim,
                position: 'absolute',
                bottom: 100,
                alignItems: 'center',
              }}
            >
              {/* ガイドテキスト - 上部に配置 */}
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#666666',
                  marginBottom: 16,
                  zIndex: 1,
                }}
              >
                タップして開始
              </Text>

              {/* Circle grow エフェクト */}
              <LottieView
                source={require('../assets/Circle grow.json')}
                autoPlay
                loop={true}
                style={{
                  width: 240,
                  height: 240,
                }}
                resizeMode="contain"
              />
            </Animated.View>
          )}
        </TouchableOpacity>
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

