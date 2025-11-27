// src/components/Calendar.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface CalendarProps {
  loggedDates: string[]; // YYYY-MM-DD形式の日付配列
}

export function Calendar({ loggedDates }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 月の初日と最終日を取得
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // カレンダーグリッドを生成
  const generateCalendar = () => {
    const days: (number | null)[] = [];
    const startDayOfWeek = firstDay.getDay(); // 0 (日曜) - 6 (土曜)

    // 月の最初の週の空白を追加
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // 月の日数を追加
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(day);
    }

    return days;
  };

  // 日付が記録されているかチェック
  const isLogged = (day: number | null): boolean => {
    if (day === null) return false;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return loggedDates.includes(dateStr);
  };

  // 今日かチェック
  const isToday = (day: number | null): boolean => {
    if (day === null) return false;
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  // 前月へ
  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // 次月へ
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const days = generateCalendar();
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <View style={styles.container}>
      {/* 月切り替えヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={previousMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {year}年 {month + 1}月
        </Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>→</Text>
        </TouchableOpacity>
      </View>

      {/* 曜日ヘッダー */}
      <View style={styles.weekDaysRow}>
        {weekDays.map((day, index) => (
          <View key={index} style={styles.weekDayCell}>
            <Text
              style={[
                styles.weekDayText,
                index === 0 && styles.sundayText,
                index === 6 && styles.saturdayText,
              ]}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* カレンダーグリッド */}
      <View style={styles.daysGrid}>
        {days.map((day, index) => {
          const logged = isLogged(day);
          const today = isToday(day);

          return (
            <View key={index} style={styles.dayCell}>
              {day !== null && (
                <View
                  style={[
                    styles.dayContent,
                    logged && styles.loggedDay,
                    today && styles.todayDay,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      logged && styles.loggedDayText,
                      today && styles.todayDayText,
                    ]}
                  >
                    {day}
                  </Text>
                  {logged && <View style={styles.loggedDot} />}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  navButtonText: {
    fontSize: 20,
    color: '#4A90E2',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  sundayText: {
    color: '#FF4444',
  },
  saturdayText: {
    color: '#4A90E2',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 7分の1
    aspectRatio: 1,
    padding: 2,
  },
  dayContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  dayText: {
    fontSize: 14,
    color: '#333333',
  },
  loggedDay: {
    backgroundColor: '#E3F2FD',
  },
  loggedDayText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  todayDay: {
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  todayDayText: {
    fontWeight: 'bold',
  },
  loggedDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4A90E2',
  },
});
