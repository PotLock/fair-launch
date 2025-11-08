import { TransactionStatus } from '@/types/api';

export const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
        case TransactionStatus.SUCCESS: return 'text-green-600';
        case TransactionStatus.PENDING: return 'text-yellow-600';
        case TransactionStatus.FAILED: return 'text-red-600';
        default: return 'text-gray-600';
    }
};

export const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
        case TransactionStatus.SUCCESS: return '✅';
        case TransactionStatus.PENDING: return '⏳';
        case TransactionStatus.FAILED: return '❌';
        default: return '•';
    }
};
