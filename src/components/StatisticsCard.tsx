import { LucideIcon } from 'lucide-react';

interface StatisticsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
    trend?: {
        value: number;
        isPositive: boolean;
    };
    loading?: boolean;
}

const colorClasses = {
    blue: {
        bg: 'bg-blue-50',
        icon: 'text-[var(--color-vet-primary)]',
        border: 'border-blue-200'
    },
    green: {
        bg: 'bg-green-50',
        icon: 'text-[var(--color-vet-secondary)]',
        border: 'border-green-200'
    },
    purple: {
        bg: 'bg-purple-50',
        icon: 'text-purple-600',
        border: 'border-purple-200'
    },
    orange: {
        bg: 'bg-orange-50',
        icon: 'text-[var(--color-vet-accent)]',
        border: 'border-orange-200'
    },
    red: {
        bg: 'bg-red-50',
        icon: 'text-red-600',
        border: 'border-red-200'
    }
};

const StatisticsCard = ({
    title,
    value,
    icon: Icon,
    color = 'blue',
    trend,
    loading = false
}: StatisticsCardProps) => {
    const colors = colorClasses[color];

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 animate-pulse">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className={`${colors.bg} w-14 h-14 rounded-full`}></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-xl shadow-sm p-6 border ${colors.border} hover:shadow-md transition duration-200`}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
                        {trend && (
                            <span className={`text-sm font-medium ${trend.isPositive ? 'text-[var(--color-vet-secondary)]' : 'text-red-600'}`}>
                                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                            </span>
                        )}
                    </div>
                </div>
                <div className={`${colors.bg} w-14 h-14 rounded-full flex items-center justify-center`}>
                    <Icon className={`w-7 h-7 ${colors.icon}`} />
                </div>
            </div>
        </div>
    );
};

export default StatisticsCard;
