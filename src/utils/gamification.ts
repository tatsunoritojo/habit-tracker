import { Log, Card } from '../types';

export type Badge = {
    id: string;
    name: string;
    icon: string;
    description: string;
    achieved: boolean;
    condition_value: number;
};

export const BADGE_DEFINITIONS: Omit<Badge, 'achieved'>[] = [
    { id: 'bronze', name: '3日継続', icon: '🥉', description: '3日連続で達成しました！', condition_value: 3 },
    { id: 'silver', name: '7日継続', icon: '🥈', description: '7日連続で達成しました！', condition_value: 7 },
    { id: 'gold', name: '21日継続', icon: '🥇', description: '21日連続で達成しました！習慣化の達人です！', condition_value: 21 },
    { id: 'resume', name: '復活の一歩', icon: '❤️‍🔥', description: '中断を乗り越えて3日連続達成！おかえりなさい！', condition_value: 3 },
    { id: 'diamond', name: '100回記録', icon: '💎', description: '累計100回記録しました！素晴らしい継続力です！', condition_value: 100 },
];

export function getBadges(card: Card, logs: Log[]): Badge[] {
    const badges = BADGE_DEFINITIONS.map(def => ({ ...def, achieved: false }));

    // Streak logic
    const currentStreak = calculateCurrentStreak(logs);

    if (currentStreak >= 3) badges.find(b => b.id === 'bronze')!.achieved = true;
    if (currentStreak >= 7) badges.find(b => b.id === 'silver')!.achieved = true;
    if (currentStreak >= 21) badges.find(b => b.id === 'gold')!.achieved = true;

    // Resume logic (Gap + 3 days streak)
    // If unique log days > current streak, it means there are logs before the current streak (implies a gap)
    const uniqueDates = new Set(logs.map(l => l.date)).size;
    if (currentStreak >= 3 && uniqueDates > currentStreak) {
        badges.find(b => b.id === 'resume')!.achieved = true;
    }

    // Total logs logic
    const totalLogs = logs.length;
    if (totalLogs >= 100) badges.find(b => b.id === 'diamond')!.achieved = true;

    return badges;
}

function calculateCurrentStreak(logs: Log[]): number {
    if (!logs || logs.length === 0) return 0;

    // Sort logs by date descending
    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Get unique dates
    const uniqueDates = Array.from(new Set(sortedLogs.map(l => l.date)));

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if streak is active (logged today or yesterday)
    const lastLogDate = uniqueDates[0];
    if (lastLogDate !== todayStr && lastLogDate !== yesterdayStr) {
        return 0; // Streak broken
    }

    // Count streak
    // We need to check consecutive days back from lastLogDate
    let currentDateToCheck = new Date(lastLogDate);

    for (const logDate of uniqueDates) {
        const checkDateStr = currentDateToCheck.toISOString().split('T')[0];
        if (logDate === checkDateStr) {
            streak++;
            currentDateToCheck.setDate(currentDateToCheck.getDate() - 1); // Go to previous day
        } else {
            break; // Gap found
        }
    }

    return streak;
}
