import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ArchiveCardDialogProps = {
    visible: boolean;
    cardTitle: string;
    onClose: () => void;
    onArchive: () => void;
};

export const ArchiveCardDialog = ({
    visible,
    cardTitle,
    onClose,
    onArchive,
}: ArchiveCardDialogProps) => {
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
                    <Text style={styles.emoji}>📦</Text>
                    <Text style={styles.modalTitle}>アーカイブしますか？</Text>

                    <Text style={styles.description}>
                        「{cardTitle}」をアーカイブすると、ホーム画面から非表示になりますが、データは保持されます。
                    </Text>

                    <Text style={styles.subDescription}>
                        アーカイブ一覧からいつでも復元できます。
                    </Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>キャンセル</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.archiveButton} onPress={onArchive}>
                            <Text style={styles.archiveButtonText}>アーカイブ</Text>
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
        width: '80%',
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
        marginBottom: 8,
        lineHeight: 20,
    },
    subDescription: {
        fontSize: 12,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 24,
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
    archiveButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#4A90E2',
        alignItems: 'center',
    },
    archiveButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
});
