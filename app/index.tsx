// app/index.tsx
import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const [hasLaunched, setHasLaunched] = useState<boolean | null>(null);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const value = await AsyncStorage.getItem('has_launched');
      setHasLaunched(value === 'true');
    } catch (e) {
      console.error('First launch check error:', e);
      setHasLaunched(false); // エラー時はオンボーディングを表示しない、あるいは表示する（安全側に倒して表示するか？）
      // ここでは安全のため home へ（既存ユーザーへの影響を避ける）
      // setHasLaunched(true);
      // いや、新規フラグがないならオンボーディング出すべき。
      setHasLaunched(false);
    }
  };

  if (hasLaunched === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (!hasLaunched) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
