// src/components/FavoriteButton.tsx
// お気に入り切り替えボタン（Phase 10-A）

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

type FavoriteButtonProps = {
    isFavorite: boolean;
    onToggle: () => void;
    disabled?: boolean;
    size?: 'small' | 'medium' | 'large';
};

export function FavoriteButton({
    isFavorite,
    onToggle,
    disabled = false,
    size = 'medium',
}: FavoriteButtonProps) {
    const iconSize = size === 'small' ? 20 : size === 'large' ? 32 : 24;

    return (
        <TouchableOpacity
            style={[
                styles.button,
                disabled && styles.disabled,
            ]}
            onPress={onToggle}
            disabled={disabled}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
            <Text style={[styles.icon, { fontSize: iconSize }]}>
                {isFavorite ? '★' : '☆'}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabled: {
        opacity: 0.5,
    },
    icon: {
        color: '#FFD700', // Gold color for star
    },
});
