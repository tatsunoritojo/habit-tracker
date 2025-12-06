// src/services/__tests__/cheerSendService.test.ts
import { getCheerSuggestions, sendCheer, undoCheer, getOrCreateCheerSendState, CheerSuggestion } from '../cheerSendService';
import { db } from '../../lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';

// Firestoreのモック
jest.mock('../../lib/firebase', () => ({
    db: {},
}));

jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    setDoc: jest.fn(),
    writeBatch: jest.fn(),
    serverTimestamp: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    Timestamp: {
        now: jest.fn(),
        fromDate: jest.fn(),
    },
}));

describe('cheerSendService', () => {
    const mockUserId = 'user123';
    const mockBatch = {
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        commit: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (writeBatch as jest.Mock).mockReturnValue(mockBatch);
    });

    describe('getCheerSuggestions', () => {
        it('returns empty array if user has no cards', async () => {
            (getDocs as jest.Mock).mockResolvedValue({ forEach: jest.fn() });
            const result = await getCheerSuggestions(mockUserId);
            expect(result).toEqual([]);
        });

        // より複雑なケースはモックが大変なので省略
    });

    describe('sendCheer', () => {
        it('throws error if daily limit reached', async () => {
            (getDoc as jest.Mock).mockResolvedValue({
                exists: () => true,
                data: () => ({
                    user_uid: mockUserId,
                    daily_send_count: 10,
                    daily_send_date: '2023-01-01', // 今日の日付と一致させる必要があるため、テスト内でDateをモックするか、ロジックをinjectableにする必要がある
                    sent_pairs: [],
                }),
            });

            // Dateをモック
            const mockDate = new Date('2023-01-01T12:00:00Z');
            const originalDate = global.Date;
            global.Date = class extends originalDate {
                constructor() {
                    super();
                    return mockDate;
                }
                getDate() { return 1; }
                getMonth() { return 0; }
                getFullYear() { return 2023; }
            } as any;

            await expect(sendCheer(mockUserId, 'cardXYZ', 'userABC', 'cheer'))
                .rejects.toThrow('DAILY_LIMIT_REACHED');

            global.Date = originalDate;
        });

        it('sends cheer if limit not reached', async () => {
            (getDoc as jest.Mock).mockResolvedValue({
                exists: () => true,
                data: () => ({
                    user_uid: mockUserId,
                    daily_send_count: 5,
                    daily_send_date: '2023-01-01',
                    sent_pairs: [],
                }),
            });

            // Dateをモック
            const mockDate = new Date('2023-01-01T12:00:00Z');
            const originalDate = global.Date;
            global.Date = class extends originalDate {
                constructor() {
                    super();
                    return mockDate;
                }
                getDate() { return 1; }
                getMonth() { return 0; }
                getFullYear() { return 2023; }
            } as any;

            (Timestamp.fromDate as jest.Mock).mockReturnValue('mock-timestamp');

            await sendCheer(mockUserId, 'cardXYZ', 'userABC', 'cheer');

            expect(mockBatch.set).toHaveBeenCalledTimes(2); // reaction, cheer_send_state
            expect(mockBatch.commit).toHaveBeenCalled();

            global.Date = originalDate;
        });
    });

    describe('undoCheer', () => {
        it('deletes reaction and updates send state', async () => {
            (getDoc as jest.Mock).mockResolvedValue({
                exists: () => true,
                data: () => ({
                    user_uid: mockUserId,
                    daily_send_count: 5,
                    daily_send_date: '2023-01-01',
                    sent_pairs: [{ to_card_id: 'cardXYZ', sent_at: { toDate: () => new Date() } }],
                }),
            });

            await undoCheer('reaction123', mockUserId, 'cardXYZ');

            expect(mockBatch.delete).toHaveBeenCalled();
            expect(mockBatch.update).toHaveBeenCalled();
            expect(mockBatch.commit).toHaveBeenCalled();
        });
    });
});
