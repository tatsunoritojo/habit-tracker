import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../src/lib/firebase';
import { useTemplates } from '../src/hooks/useTemplates';
import { useCategories } from '../src/hooks/useCategories';
import { usePublicCards } from '../src/hooks/usePublicCards';
import { useCards } from '../src/hooks/useCards';
import { Category, CardTemplate } from '../src/types';
import { calculateSimilarity } from '../src/utils/habitSimilarity';
import { checkDuplicate } from '../src/utils/cardDuplicateChecker';

// Step定義
type Step = 1 | 2 | 3;

export default function CreateCustomCardScreen() {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);

    // Step 1: 習慣名
    const [habitName, setHabitName] = useState('');

    // Step 2: 類似検索結果
    const { templates } = useTemplates();
    const { publicCards } = usePublicCards();
    const [similarTemplates, setSimilarTemplates] = useState<CardTemplate[]>([]);

    // Step 3: カテゴリ選択
    const { getL1Categories, getL2Categories, getL3Categories, loading: loadingCategories } = useCategories();
    const [l1Categories, setL1Categories] = useState<Category[]>([]);
    const [l2Categories, setL2Categories] = useState<Category[]>([]);
    const [l3Categories, setL3Categories] = useState<Category[]>([]);

    const [selectedL1, setSelectedL1] = useState<string | null>(null);
    const [selectedL2, setSelectedL2] = useState<string | null>(null);
    const [selectedL3, setSelectedL3] = useState<string | null>(null);

    // 最終確認 - 公開設定を2つに分割
    const [isPublicForCheers, setIsPublicForCheers] = useState(true);
    const [isPublicForTemplate, setIsPublicForTemplate] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { cards: userCards } = useCards();

    // Step 1 -> 2: 検索実行
    const handleSearch = () => {
        if (!habitName.trim()) {
            Alert.alert('エラー', '習慣の名前を入力してください');
            return;
        }

        // 全テンプレートと公開カードを合わせて類似度検索
        const allCandidates = [...templates, ...publicCards];
        const scored = allCandidates.map(t => ({
            template: t,
            score: calculateSimilarity(habitName, t.title_ja),
        }));

        // スコアが0.3以上のものを類似とみなす
        const filtered = scored.filter(s => s.score > 0.3);
        filtered.sort((a, b) => b.score - a.score);
        const top5 = filtered.slice(0, 5).map(s => s.template);

        setSimilarTemplates(top5);
        setStep(2);
    };

    // Step 2: テンプレートを使用
    const handleUseTemplate = (template: CardTemplate) => {
        router.push({
            pathname: '/select-card',
            params: { l1: template.category_l1 }
        });
    };

    // Step 2 -> 3: オリジナル作成へ
    const handleProceedToCreate = () => {
        const l1 = getL1Categories();
        setL1Categories(l1);
        setStep(3);
    };

    // Step 3: カテゴリ選択ロジック
    const handleSelectL1 = (id: string) => {
        setSelectedL1(id);
        setSelectedL2(null);
        setSelectedL3(null);
        const l2 = getL2Categories(id);
        setL2Categories(l2);
        setL3Categories([]);
    };

    const handleSelectL2 = (id: string) => {
        setSelectedL2(id);
        // L3を自動的に :other に設定
        const autoL3 = `${id}:other`;
        setSelectedL3(autoL3);
        const l3 = getL3Categories(id);
        setL3Categories(l3);
    };

    const handleSelectL3 = (id: string) => {
        setSelectedL3(id);
    };

    // 最終作成
    const handleCreateCustom = async () => {
        if (!selectedL1 || !selectedL2) {
            Alert.alert('エラー', 'カテゴリを選択してください');
            return;
        }

        // タイトルの正規化（前後の空白を削除）
        const normalizedTitle = habitName.trim();
        if (!normalizedTitle) {
            Alert.alert('エラー', '習慣の名前を入力してください');
            return;
        }

        // L3が未設定の場合は自動設定
        const finalL3 = selectedL3 || `${selectedL2}:other`;

        // 重複チェック
        const duplicateCheck = checkDuplicate(
            normalizedTitle,
            selectedL1,
            selectedL2,
            finalL3,
            userCards
        );

        if (duplicateCheck.duplicateType === 'exact') {
            Alert.alert(
                '既に存在します',
                `「${duplicateCheck.duplicateCard?.title}」は既に追加されています。`,
                [{ text: 'OK' }]
            );
            return;
        }

        if (duplicateCheck.duplicateType === 'similar') {
            Alert.alert(
                '似た習慣があります',
                `「${duplicateCheck.duplicateCard?.title}」と似ています。\nそれでも追加しますか？`,
                [
                    { text: 'キャンセル', style: 'cancel' },
                    { text: '追加する', onPress: () => performCreate(normalizedTitle, finalL3) }
                ]
            );
            return;
        }

        // カード作成上限チェック（50枚）
        const activeCards = userCards.filter(c => c.status === 'active');
        if (activeCards.length >= 50) {
            Alert.alert(
                'カード上限',
                'カードは最大50枚まで作成できます。\n不要なカードをアーカイブしてください。',
                [{ text: 'OK' }]
            );
            return;
        }

        await performCreate(normalizedTitle, finalL3);
    };

    const performCreate = async (title: string, categoryL3: string) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        try {
            setSubmitting(true);
            const now = Timestamp.now();
            await addDoc(collection(db, 'cards'), {
                owner_uid: currentUser.uid,
                category_l1: selectedL1,
                category_l2: selectedL2,
                category_l3: categoryL3,
                title,
                template_id: 'custom',
                is_custom: true,
                is_public: false, // 後方互換性
                is_public_for_cheers: isPublicForCheers,
                is_public_for_template: isPublicForTemplate,
                current_streak: 0,
                longest_streak: 0,
                total_logs: 0,
                last_log_date: '',
                status: 'active',
                archived_at: null,
                reminder_enabled: false,
                reminder_time: null,
                created_at: now,
                updated_at: now,
            });
            router.replace('/(tabs)/home');
            Alert.alert('成功', 'オリジナル習慣を作成しました！');
        } catch (e) {
            console.error(e);
            Alert.alert('エラー', '作成に失敗しました');
        } finally {
            setSubmitting(false);
        }
    };

    // --- UI Components for Steps ---

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.questionText}>どんな習慣を続けたいですか？</Text>
            <TextInput
                style={styles.input}
                placeholder="例: プログラミング学習、毎朝のヨガ"
                value={habitName}
                onChangeText={setHabitName}
                autoFocus
            />
            <TouchableOpacity style={styles.primaryButton} onPress={handleSearch}>
                <Text style={styles.primaryButtonText}>次へ（類似を検索）</Text>
            </TouchableOpacity>
            <View style={styles.hintBox}>
                <Text style={styles.hintTitle}>💡 ヒント</Text>
                <Text style={styles.hintText}>
                    似た習慣がすでにあれば、同じカテゴリの仲間とつながりやすくなります。
                </Text>
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.questionText}>似ている習慣が見つかりました</Text>
            <Text style={styles.subText}>「{habitName}」での検索結果</Text>

            {similarTemplates.length > 0 ? (
                <ScrollView style={styles.resultList}>
                    {similarTemplates.map(item => (
                        <View key={item.template_id} style={styles.resultItem}>
                            <View style={styles.resultInfo}>
                                <Text style={styles.resultIcon}>{item.icon}</Text>
                                <View>
                                    <Text style={styles.resultTitle}>{item.title_ja}</Text>
                                    <Text style={styles.resultCategory}>{item.category_l1}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.useButton} onPress={() => handleUseTemplate(item)}>
                                <Text style={styles.useButtonText}>これを使う</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <View style={styles.noResult}>
                    <Text style={styles.noResultText}>類似する習慣は見つかりませんでした</Text>
                </View>
            )}

            <View style={styles.divider} />

            <TouchableOpacity style={styles.secondaryButton} onPress={handleProceedToCreate}>
                <Text style={styles.secondaryButtonText}>
                    {similarTemplates.length > 0 ? '見つからないので新しく作成' : '新しく作成する'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderStep3 = () => (
        <ScrollView style={styles.stepContainer}>
            <Text style={styles.questionText}>カテゴリを選択してください</Text>
            <Text style={styles.subText}>「{habitName}」の分類</Text>

            <Text style={styles.label}>大カテゴリ（必須）</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                {l1Categories.map(cat => (
                    <TouchableOpacity
                        key={cat.category_id}
                        style={[styles.chip, selectedL1 === cat.category_id && styles.chipSelected]}
                        onPress={() => handleSelectL1(cat.category_id)}
                    >
                        <Text style={[styles.chipText, selectedL1 === cat.category_id && styles.chipTextSelected]}>
                            {cat.icon} {cat.name_ja}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {selectedL1 && (
                <>
                    <Text style={styles.label}>中カテゴリ（必須）</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                        {l2Categories.map(cat => (
                            <TouchableOpacity
                                key={cat.category_id}
                                style={[styles.chip, selectedL2 === cat.category_id && styles.chipSelected]}
                                onPress={() => handleSelectL2(cat.category_id)}
                            >
                                <Text style={[styles.chipText, selectedL2 === cat.category_id && styles.chipTextSelected]}>
                                    {cat.name_ja}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </>
            )}

            {selectedL2 && (
                <View style={styles.finalSection}>
                    {/* 公開設定: エールを受け取る */}
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => setIsPublicForCheers(!isPublicForCheers)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkbox, isPublicForCheers && styles.checkboxChecked]}>
                            {isPublicForCheers && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <View style={styles.rowText}>
                            <Text style={styles.rowLabel}>エールを受け取る</Text>
                            <Text style={styles.rowSubtext}>他の人からエールをもらえます</Text>
                        </View>
                    </TouchableOpacity>

                    {/* 公開設定: テンプレートとして公開 */}
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => setIsPublicForTemplate(!isPublicForTemplate)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkbox, isPublicForTemplate && styles.checkboxChecked]}>
                            {isPublicForTemplate && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <View style={styles.rowText}>
                            <Text style={styles.rowLabel}>テンプレートとして公開</Text>
                            <Text style={styles.rowSubtext}>他の人がこの習慣を選択できます</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.primaryButton, submitting && styles.disabledButton]}
                        onPress={handleCreateCustom}
                        disabled={submitting}
                    >
                        <Text style={styles.primaryButtonText}>この習慣を始める</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => {
                    if (step > 1) setStep((s) => s - 1 as Step);
                    else router.back();
                }}>
                    <Text style={styles.backButton}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>オリジナルを作成</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        fontSize: 28,
        color: '#333333',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333333',
    },
    stepContainer: {
        flex: 1,
        padding: 24,
    },
    questionText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 24,
        textAlign: 'center',
    },
    subText: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 24,
    },
    input: {
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    primaryButton: {
        backgroundColor: '#4A90E2',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    hintBox: {
        backgroundColor: '#F0F7FF',
        padding: 16,
        borderRadius: 12,
        marginTop: 24,
    },
    hintTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4A90E2',
        marginBottom: 8,
    },
    hintText: {
        fontSize: 14,
        color: '#4A90E2',
        lineHeight: 20,
    },
    // Step 2 Styles
    resultList: {
        maxHeight: '60%',
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    resultInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    resultIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
    },
    resultCategory: {
        fontSize: 12,
        color: '#999999',
        marginTop: 2,
    },
    useButton: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    useButtonText: {
        color: '#4CAF50',
        fontWeight: '600',
        fontSize: 12,
    },
    noResult: {
        padding: 24,
        alignItems: 'center',
    },
    noResultText: {
        color: '#999999',
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 24,
    },
    secondaryButton: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#666666',
        fontSize: 16,
        textDecorationLine: 'underline',
    },
    // Step 3 Styles
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        marginTop: 12,
        color: '#333333',
    },
    chipContainer: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    chipSelected: {
        backgroundColor: '#E3F2FD',
        borderColor: '#4A90E2',
    },
    chipText: {
        color: '#666666',
    },
    chipTextSelected: {
        color: '#4A90E2',
        fontWeight: '600',
    },
    finalSection: {
        marginTop: 24,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkboxChecked: {
        backgroundColor: '#4A90E2',
    },
    checkmark: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    rowText: {
        flex: 1,
    },
    rowLabel: {
        fontSize: 16,
        color: '#333333',
        fontWeight: '500',
    },
    rowSubtext: {
        fontSize: 12,
        color: '#666666',
        marginTop: 2,
    },
    disabledButton: {
        opacity: 0.5,
    },
});
