import React from 'react'
import { TrendingUp, Users, Calendar, DollarSign } from 'lucide-react'

interface StatsCardProps {
    title: string
    value: string | number
    icon: React.ReactNode
    trend?: string
    color: 'blue' | 'green' | 'purple' | 'yellow'
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend, color }) => {
    const colors = {
        blue: 'from-[var(--color-vet-primary)] to-[var(--color-vet-primary)]',
        green: 'from-[var(--color-vet-secondary)] to-[var(--color-vet-secondary)]',
        purple: 'from-purple-500 to-purple-600',
        yellow: 'from-[var(--color-vet-accent)] to-[var(--color-vet-accent)]'
    }

    return (
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                    {trend && (
                        <div className="flex items-center mt-2">
                            <TrendingUp className="w-4 h-4 text-[var(--color-vet-secondary)] mr-1" />
                            <span className="text-sm text-[var(--color-vet-secondary)]">{trend}</span>
                        </div>
                    )}
                </div>
                <div className={`p-4 rounded-full bg-gradient-to-br ${colors[color]}`}>
                    {icon}
                </div>
            </div>
        </div>
    )
}

interface DashboardStatsProps {
    stats: {
        totalAppointments?: number
        totalCustomers?: number
        totalRevenue?: number
        pendingAppointments?: number
    }
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
                title="إجمالي المواعيد"
                value={stats.totalAppointments || 0}
                icon={<Calendar className="w-6 h-6 text-white" />}
                color="blue"
                trend="+12% من الشهر الماضي"
            />
            <StatsCard
                title="العملاء"
                value={stats.totalCustomers || 0}
                icon={<Users className="w-6 h-6 text-white" />}
                color="green"
                trend="+8% من الشهر الماضي"
            />
            <StatsCard
                title="الإيرادات"
                value={`${stats.totalRevenue || 0} ج.م`}
                icon={<DollarSign className="w-6 h-6 text-white" />}
                color="purple"
                trend="+15% من الشهر الماضي"
            />
            <StatsCard
                title="مواعيد معلقة"
                value={stats.pendingAppointments || 0}
                icon={<Calendar className="w-6 h-6 text-white" />}
                color="yellow"
            />
        </div>
    )
}

export default DashboardStats
