// src/services/__tests__/logService.test.ts
// ログ記録サービスのスモークテスト

import { recordLog } from '../logService';
import {
    collection,
    addDoc,
    updateDoc,
    getDocs,
} from 'firebase/firestore';

// Firestore関数のモック
jest.mock('firebase/firestore');

describe('logService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-11-30T12:00:00.000Z');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('recordLog', () => {
        it('should execute without errors', async () => {
            const cardId = 'test-card-1';
            const ownerUid = 'test-user-1';

            // ログが存在しない状態をモック
            (getDocs as jest.Mock).mockResolvedValue({
                docs: [],
            });

            (addDoc as jest.Mock).mockResolvedValue({ id: 'new-log-id' });
            (updateDoc as jest.Mock).mockResolvedValue(undefined);

            // エラーなく実行できることを確認（スモークテスト）
            await expect(recordLog(cardId, ownerUid)).resolves.not.toThrow();

            // 基本的な関数呼び出しを確認
            expect(addDoc).toHaveBeenCalled();
            expect(updateDoc).toHaveBeenCalled();
        });
    });
});
