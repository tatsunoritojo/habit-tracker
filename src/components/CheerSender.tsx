import React from 'react';
import { useUserDisplayName } from '../hooks/useUserDisplayName';

interface CheerSenderProps {
    uid: string | null;
}

export const CheerSender: React.FC<CheerSenderProps> = ({ uid }) => {
    const displayName = useUserDisplayName(uid);
    return <>{displayName}</>;
};
