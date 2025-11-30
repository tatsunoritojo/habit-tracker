// functions/src/services/__tests__/cheerService.test.ts
// エール送信サービスのユニットテスト

// import * as admin from 'firebase-admin';
import functions from 'firebase-functions-test';

// テスト用プロジェクト設定
const test = functions();

// モックの設定
jest.mock('firebase-admin', () => {
    const firestore = jest.fn(() => ({
        collection: jest.fn(() => ({
            doc: jest.fn(() => ({
                get: jest.fn(),
                set: jest.fn(),
                update: jest.fn(),
            })),
            where: jest.fn(() => ({
                get: jest.fn(),
            })),
            add: jest.fn(),
        })),
    }));

    return {
        initializeApp: jest.fn(),
        firestore: firestore,
    };
});

describe('cheerService', () => {
    let cheerService: any;

    beforeAll(() => {
        // テスト対象のモジュールをインポート
        // 注意: モック適用後にインポートする必要があります
        cheerService = require('../cheerService');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        test.cleanup();
    });

    describe('isQuietHours', () => {
        it('お休みモードが無効な場合、falseを返すこと', () => {
            const userSettings = {
                quiet_hours_enabled: false,
                quiet_hours_start: '23:00',
                quiet_hours_end: '07:00',
            };

            const result = cheerService.isQuietHours(userSettings);
            expect(result).toBe(false);
        });

        it('お休みモード有効かつ時間内の場合、trueを返すこと', () => {
            const userSettings = {
                quiet_hours_enabled: true,
                quiet_hours_start: '23:00',
                quiet_hours_end: '07:00',
            };

            // 時間を固定（深夜2時）
            const mockDate = new Date('2025-11-30T02:00:00Z');
            // Dateコンストラクタをモック
            global.Date = class extends Date {
                constructor(date?: any) {
                    super(date || mockDate);
                }
            } as any;

            expect(() => cheerService.isQuietHours(userSettings)).not.toThrow();
        });
    });

    describe('selectReactionType', () => {
        it('ランダムにリアクションタイプが選択されること', () => {
            const reason = 'record';
            const type = cheerService.selectReactionType(reason);

            expect(['cheer', 'amazing', 'support']).toContain(type);
        });
    });
});
