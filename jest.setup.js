// Jest setup file

// Mock Firebase modules
jest.mock('./src/lib/firebase', () => ({
    db: {},
    auth: {},
    initializeAuth: jest.fn(),
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    addDoc: jest.fn(),
    doc: jest.fn(),
    updateDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    getDocs: jest.fn(),
    Timestamp: {
        now: jest.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
        fromDate: jest.fn((date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 })),
    },
}));

// Suppress console warnings in tests
global.console = {
    ...console,
    warn: jest.fn(),
    error: jest.fn(),
};
