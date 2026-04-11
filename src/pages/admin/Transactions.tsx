import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { toast } from 'sonner';
import {
    DollarSign,
    Calendar,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownLeft,
    Loader2,
    Download,
    FileText
} from 'lucide-react';

interface Transaction {
    _id: string;
    userId: {
        _id: string;
        fullName: string;
        email: string;
    };
    type: 'appointment' | 'order' | 'subscription' | 'payment';
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    paymentMethod: string;
    description: string;
    createdAt: string;
}

export default function Transactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchTransactions();
    }, [page, statusFilter]);

    const fetchTransactions = async () => {
        try {
            setIsLoading(true);
            // NOTE: We need to ensure adminAPI has getTransactions method. 
            // If not, we'll need to add it to src/services/api.ts
            const { data } = await adminAPI.getTransactions(page, 20, statusFilter !== 'all' ? statusFilter : undefined);
            setTransactions(data.transactions);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
            toast.error('فشل تحميل المعاملات المالية');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-[var(--color-vet-secondary)] border-green-200';
            case 'pending': return 'bg-yellow-100 text-[var(--color-vet-accent)] border-yellow-200';
            case 'failed': return 'bg-red-100 text-red-700 border-red-200';
            case 'refunded': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'payment': return <ArrowDownLeft className="w-4 h-4 text-[var(--color-vet-secondary)]" />;
            case 'refunded': return <ArrowUpRight className="w-4 h-4 text-red-600" />;
            default: return <DollarSign className="w-4 h-4 text-primary-600" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10" dir="rtl">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">المعاملات المالية 💰</h1>
                        <p className="text-gray-500 mt-1">سجل كامل بجميع عمليات الدفع والحجز في المنصة</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                            <Download size={18} />
                            <span>تصدير CSV</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards (Placeholder for Phase 4 enhancement) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">إجمالي الإيرادات</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">0 ج.م</h3>
                            </div>
                            <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-primary-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-[var(--color-vet-secondary)] font-medium">
                            <ArrowUpRight size={14} className="mr-1" />
                            <span>+0%</span>
                            <span className="text-gray-400 mr-1">مقارنة بالشهر الماضي</span>
                        </div>
                    </div>
                    {/* Add more cards as needed */}
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 flex-1 max-w-md">
                        <Search size={18} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder="بحث برقم المعاملة أو اسم المستخدم..."
                            className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">تصفية:</span>
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">جميع الحالات</option>
                            <option value="completed">مكتملة</option>
                            <option value="pending">قيد الانتظار</option>
                            <option value="failed">فاشلة</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
                            <p className="text-gray-500">جاري تحميل البيانات...</p>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">لا توجد معاملات</h3>
                            <p className="text-gray-500 mt-1 max-w-sm">لم يتم تسجيل أي عمليات دفع أو حجز حتى الآن.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-sm font-medium text-gray-500">المعاملة</th>
                                        <th className="px-6 py-4 text-sm font-medium text-gray-500">المستخدم</th>
                                        <th className="px-6 py-4 text-sm font-medium text-gray-500">المبلغ</th>
                                        <th className="px-6 py-4 text-sm font-medium text-gray-500">الحالة</th>
                                        <th className="px-6 py-4 text-sm font-medium text-gray-500">التاريخ</th>
                                        <th className="px-6 py-4 text-sm font-medium text-gray-500">...</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {transactions.map((tx) => (
                                        <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
                                                        }`}>
                                                        {getTypeIcon(tx.type)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{tx.description}</div>
                                                        <div className="text-xs text-gray-500">#{tx._id.slice(-6)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {tx.userId ? (
                                                    <div>
                                                        <div className="font-medium text-gray-900">{tx.userId.fullName}</div>
                                                        <div className="text-xs text-gray-500">{tx.userId.email}</div>
                                                    </div>
                                                ) : <span className="text-gray-400">مستخدم محذوف</span>}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-gray-900">
                                                {tx.amount} {tx.currency.toUpperCase()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(tx.status)}`}>
                                                    {tx.status === 'completed' ? 'ناجحة' : tx.status === 'pending' ? 'معلقة' : 'فاشلة'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500" dir="ltr">
                                                {new Date(tx.createdAt).toLocaleDateString('en-GB')}
                                                <span className="block text-xs text-gray-400">
                                                    {new Date(tx.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="text-gray-400 hover:text-primary-600 transition-colors">
                                                    <ArrowUpRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-6">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                        >
                            السابق
                        </button>
                        <span className="text-sm text-gray-600">صفحة {page} من {totalPages}</span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                        >
                            التالي
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
