import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    SectionList,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../src/lib/firebase';
import { useCategories } from '../src/hooks/useCategories';
import { useTemplates } from '../src/hooks/useTemplates';
import { usePublicCards, PublicCardAsTemplate } from '../src/hooks/usePublicCards';
import { useUserDisplayName } from '../src/hooks/useUserDisplayName';
import { useCards } from '../src/hooks/useCards';
import { checkDuplicate } from '../src/utils/cardDuplicateChecker';
import { CreateCardConfirmDialog } from '../src/components/CreateCardConfirmDialog';
import type { Category, CardTemplate } from '../src/types';

// SectionList用データ型
type SectionData = {
    title: string; // L2 Category Name
    data: (CardTemplate | PublicCardAsTemplate)[];
    category: Category; // L2 Category Object
    expanded: boolean;
};

// ユーザー作成バッジコンポーネント（敬称略）
const UserCreatedBadge: React.FC<{ uid: string | null | undefined }> = ({ uid }) => {
    const displayName = useUserDisplayName(uid);
    return <Text style={styles.userCreatedBadge}>👥 {displayName}</Text>;
};

export default function SelectCardScreen() {
    const router = useRouter();
    const { l1, title } = useLocalSearchParams<{ l1: string; title: string }>();

    const { templates, loading: loadingTemplates } = useTemplates();
    const { publicCards, loading: loadingPublicCards } = usePublicCards();
    const { getL2Categories, loading: loadingCategories } = useCategories();

    const [sections, setSections] = useState<SectionData[]>([]);

    // ダイアログ状態
    const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | PublicCardAsTemplate | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [isPublicForCheers, setIsPublicForCheers] = useState(true);
    const [isPublicForTemplate, setIsPublicForTemplate] = useState(true);
    const { cards: userCards } = useCards();

    // L2カテゴリを取得（getL2Categories は useCallback でメモ化されている）
    const l2Categories = useMemo(() => {
        if (!l1 || loadingCategories) return [];
        return getL2Categories(l1);
    }, [l1, loadingCategories, getL2Categories]);

    // buildSections を useCallback でメモ化し、関数型アップデートで無限ループを防止
    const buildSections = useCallback(() => {
        if (l2Categories.length === 0) return;

        setSections((prevSections) => {
            return l2Categories.map(cat => {
                // このL2カテゴリに属するテンプレートと公開カードをフィルタリング
                const catTemplates = templates.filter(t => t.category_l2 === cat.category_id);
                const catPublicCards = publicCards.filter(c => c.category_l2 === cat.category_id);

                // テンプレートと公開カードを統合
                const allItems = [...catTemplates, ...catPublicCards];

                // 既存のexpanded状態を維持（あれば）
                const existing = prevSections.find(s => s.category.category_id === cat.category_id);

                return {
                    title: cat.name_ja,
                    data: allItems,
                    category: cat,
                    expanded: existing ? existing.expanded : true, // デフォルト展開
                };
            });
        });
    }, [l2Categories, templates, publicCards]);

    // テンプレート、公開カード、L2カテゴリが更新されたらセクションを再構築
    useEffect(() => {
        if (!loadingCategories && !loadingTemplates && !loadingPublicCards && l2Categories.length > 0) {
            buildSections();
        }
    }, [loadingCategories, loadingTemplates, loadingPublicCards, l2Categories, buildSections]);

    const toggleSection = (index: number) => {
        const newSections = [...sections];
        newSections[index].expanded = !newSections[index].expanded;
        setSections(newSections);
    };

    const handleTemplatePress = (template: CardTemplate | PublicCardAsTemplate) => {
        // 重複チェック
        const duplicateCheck = checkDuplicate(
            template.title_ja,
            template.category_l1,
            template.category_l2,
            template.category_l3,
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
                `「${duplicateCheck.duplicateCard?.title}」と似ています。\n追加しますか？`,
                [
                    { text: 'キャンセル', style: 'cancel' },
                    { text: '追加する', onPress: () => showDialog(template) }
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

        showDialog(template);
    };

    const showDialog = (template: CardTemplate | PublicCardAsTemplate) => {
        setSelectedTemplate(template);
        setIsPublicForCheers(true);
        setIsPublicForTemplate(true);
        setShowConfirmDialog(true);
    };

    const handleCreateCard = async () => {
        if (!selectedTemplate) return;

        const currentUser = auth.currentUser;
        if (!currentUser) {
            Alert.alert('エラー', 'ユーザーが認証されていません');
            return;
        }

        try {
            const now = Timestamp.now();
            const cardData = {
                owner_uid: currentUser.uid,
                category_l1: selectedTemplate.category_l1,
                category_l2: selectedTemplate.category_l2,
                category_l3: selectedTemplate.category_l3,
                title: selectedTemplate.title_ja.trim(),
                template_id: selectedTemplate.template_id,
                is_custom: false,
                is_public: false, // 後方互換性
                is_public_for_cheers: isPublicForCheers,
                is_public_for_template: isPublicForTemplate,
                current_streak: 0,
                longest_streak: 0,
                total_logs: 0,
                last_log_date: '',
                created_at: now,
                updated_at: now,
            };

            await addDoc(collection(db, 'cards'), cardData);

            setShowConfirmDialog(false);

            // MVPではホームへ戻す
            router.replace('/(tabs)/home');

            Alert.alert('成功', '新しい習慣を始めました！');
        } catch (error) {
            console.error('カード作成エラー:', error);
            Alert.alert('エラー', 'カードの作成に失敗しました');
        }
    };

    if (loadingCategories || loadingTemplates || loadingPublicCards) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* ヘッダー */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title || '詳細選択'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <Text style={styles.instruction}>習慣を選んでください</Text>

            <SectionList
                sections={sections}
                keyExtractor={(item) => item.template_id}
                renderItem={({ item, section }) => {
                    if (!section.expanded) return null;
                    const isUserCreated = 'is_user_created' in item && item.is_user_created;
                    const creatorUid = isUserCreated && 'owner_uid' in item ? (item as PublicCardAsTemplate).owner_uid : null;
                    return (
                        <TouchableOpacity
                            style={styles.templateItem}
                            onPress={() => handleTemplatePress(item)}
                        >
                            <Text style={styles.templateIcon}>{item.icon}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.templateTitle}>{item.title_ja}</Text>
                                {isUserCreated && <UserCreatedBadge uid={creatorUid} />}
                            </View>
                        </TouchableOpacity>
                    );
                }}
                renderSectionHeader={({ section }) => {
                    const index = sections.indexOf(section as unknown as SectionData);
                    return (
                        <TouchableOpacity
                            style={styles.sectionHeader}
                            onPress={() => toggleSection(index)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.sectionTitle}>{section.expanded ? '▼' : '▶'} {section.title}</Text>
                        </TouchableOpacity>
                    );
                }}
                stickySectionHeadersEnabled={false}
                contentContainerStyle={styles.listContent}
            />

            <CreateCardConfirmDialog
                visible={showConfirmDialog}
                template={selectedTemplate}
                isPublicForCheers={isPublicForCheers}
                isPublicForTemplate={isPublicForTemplate}
                onClose={() => setShowConfirmDialog(false)}
                onConfirm={handleCreateCard}
                onTogglePublicForCheers={setIsPublicForCheers}
                onTogglePublicForTemplate={setIsPublicForTemplate}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    instruction: {
        textAlign: 'center',
        paddingVertical: 16,
        color: '#666666',
        backgroundColor: '#F8F8F8',
    },
    listContent: {
        paddingBottom: 40,
    },
    sectionHeader: {
        backgroundColor: '#F0F7FF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        marginTop: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333333',
    },
    templateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        backgroundColor: '#FFFFFF',
    },
    templateIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    templateTitle: {
        fontSize: 16,
        color: '#333333',
    },
    userCreatedBadge: {
        fontSize: 12,
        color: '#666666',
        marginTop: 4,
    },
});
