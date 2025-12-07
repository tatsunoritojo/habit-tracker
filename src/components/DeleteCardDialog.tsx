import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type DeleteCardDialogProps = {
    visible: boolean;
    cardTitle: string;
    onClose: () => void;
    onDelete: () => void;
    onArchive?: () => void;
};

export const DeleteCardDialog = ({
    visible,
    cardTitle,
    onClose,
    onDelete,
    onArchive,
}: DeleteCardDialogProps) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.backdrop} onTouchEnd={onClose} />
                <View style={styles.modalView}>
                    <Text style={styles.emoji}>⚠️</Text>
                    <Text style={styles.modalTitle}>カードを削除しますか？</Text>

                    <Text style={styles.description}>
                        「{cardTitle}」を削除すると、以下のデータが
                        <Text style={styles.boldRed}>完全に消去</Text>されます：
                    </Text>

                    <View style={styles.warningBox}>
                        <Text style={styles.warningItem}>・これまでの記録履歴</Text>
                        <Text style={styles.warningItem}>・ストリークと統計情報</Text>
                        <Text style={styles.warningItem}>・受け取ったエール</Text>
                    </View>

                    <Text style={styles.subDescription}>
                        この操作は取り消せません。
                    </Text>

                    {onArchive && (
                        <View style={styles.suggestionBox}>
                            <Text style={styles.suggestionText}>
                                💡 一時停止したい場合は「アーカイブ」がおすすめです。データは残ります。
                            </Text>
                            <TouchableOpacity style={styles.archiveButton} onPress={onArchive}>
                                <Text style={styles.archiveButtonText}>代わりにアーカイブする</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>キャンセル</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                            <Text style={styles.deleteButtonText}>削除する</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    emoji: {
        fontSize: 40,
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333333',
    },
    description: {
        fontSize: 14,
        color: '#333333',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 20,
    },
    boldRed: {
        color: '#E53935',
        fontWeight: 'bold',
    },
    warningBox: {
        backgroundColor: '#FFEBEE',
        padding: 12,
        borderRadius: 8,
        width: '100%',
        marginBottom: 16,
    },
    warningItem: {
        fontSize: 13,
        color: '#C62828',
        marginBottom: 4,
    },
    subDescription: {
        fontSize: 12,
        color: '#666666',
        marginBottom: 20,
    },
    suggestionBox: {
        width: '100%',
        marginBottom: 24,
        padding: 12,
        backgroundColor: '#E3F2FD',
        borderRadius: 8,
        alignItems: 'center',
    },
    suggestionText: {
        fontSize: 12,
        color: '#1565C0',
        marginBottom: 8,
        textAlign: 'center',
    },
    archiveButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    archiveButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#666666',
        fontWeight: '600',
        fontSize: 16,
    },
    deleteButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#FFEBEE', // 薄い赤
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EF5350',
    },
    deleteButtonText: {
        color: '#D32F2F',
        fontWeight: '600',
        fontSize: 16,
    },
});
