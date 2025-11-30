// src/services/__tests__/statsService.test.ts
// ユーザー統計計算サービスのスモークテスト

import { calculateUserStats } from '../statsService';
import { getDocs } from 'firebase/firestore';

// Firestore関数のモック
jest.mock('firebase/firestore');

describe('statsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('calculateUserStats', () => {
        it('should execute without errors and return stats object', async () => {
            const ownerUid = 'test-user-1';

            (getDocs as jest.Mock).mockResolvedValue({
                docs: [
                    { data: () => ({ date: '2025-11-30' }) },
                    { data: () => ({ date: '2025-11-29' }) },
                ],
            });

            // エラーなく実行できることを確認（スモークテスト）
            const result = await calculateUserStats(ownerUid);

            // 戻り値の構造を確認
            expect(result).toHaveProperty('weekDays');
            expect(result).toHaveProperty('monthDays');
            expect(typeof result.weekDays).toBe('number');
            expect(typeof result.monthDays).toBe('number');
        });

        it('should handle empty logs', async () => {
            const ownerUid = 'test-user-1';

            (getDocs as jest.Mock).mockResolvedValue({
                docs: [],
            });

            const result = await calculateUserStats(ownerUid);

            expect(result.weekDays).toBe(0);
            expect(result.monthDays).toBe(0);
        });
    });
});
