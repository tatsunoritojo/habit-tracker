import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CardTemplate } from '../types';

type CreateCardConfirmDialogProps = {
    visible: boolean;
    template: CardTemplate | null;
    isPublicForCheers: boolean;
    isPublicForTemplate: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onTogglePublicForCheers: (value: boolean) => void;
    onTogglePublicForTemplate: (value: boolean) => void;
};

export const CreateCardConfirmDialog = ({
    visible,
    template,
    isPublicForCheers,
    isPublicForTemplate,
    onClose,
    onConfirm,
    onTogglePublicForCheers,
    onTogglePublicForTemplate,
}: CreateCardConfirmDialogProps) => {
    if (!template) return null;

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
                    <Text style={styles.modalTitle}>この習慣を始めますか？</Text>

                    <View style={styles.cardPreview}>
                        <Text style={styles.cardIcon}>{template.icon}</Text>
                        <Text style={styles.cardTitle}>{template.title_ja}</Text>
                    </View>

                    <View style={styles.separator} />

                    {/* 公開設定: エールを受け取る */}
                    <TouchableOpacity
                        style={styles.publicToggle}
                        onPress={() => onTogglePublicForCheers(!isPublicForCheers)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkbox, isPublicForCheers && styles.checkboxChecked]}>
                            {isPublicForCheers && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <View style={styles.publicToggleText}>
                            <Text style={styles.publicToggleLabel}>エールを受け取る</Text>
                            <Text style={styles.publicToggleDescription}>
                                他の人からエールをもらえます
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* 公開設定: テンプレートとして公開 */}
                    <TouchableOpacity
                        style={styles.publicToggle}
                        onPress={() => onTogglePublicForTemplate(!isPublicForTemplate)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkbox, isPublicForTemplate && styles.checkboxChecked]}>
                            {isPublicForTemplate && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <View style={styles.publicToggleText}>
                            <Text style={styles.publicToggleLabel}>テンプレートとして公開</Text>
                            <Text style={styles.publicToggleDescription}>
                                他の人がこの習慣を選択できます
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>キャンセル</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
                            <Text style={styles.confirmButtonText}>始める</Text>
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
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333333',
    },
    cardPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        padding: 16,
        borderRadius: 12,
        width: '100%',
        marginBottom: 20,
    },
    cardIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
        flex: 1,
    },
    separator: {
        height: 1,
        width: '100%',
        backgroundColor: '#E0E0E0',
        marginBottom: 20,
    },
    publicToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
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
    publicToggleText: {
        flex: 1,
    },
    publicToggleLabel: {
        fontSize: 16,
        color: '#333333',
        fontWeight: '500',
    },
    publicToggleDescription: {
        fontSize: 12,
        color: '#666666',
        marginTop: 2,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 8,
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
    confirmButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#4A90E2',
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
});
