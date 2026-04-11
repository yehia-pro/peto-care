import React, { Component, ErrorInfo, ReactNode } from 'react';
import { handleError } from '../utils/errorHandler';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        handleError(error, 'ErrorBoundary');
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-red-50 rounded-lg m-4" dir="rtl">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">عذراً، حدث خطأ ما 😔</h2>
                    <p className="text-gray-600 mb-6">نعتذر عن هذا الخلل الفني. يرجى محاولة إعادة تحميل الصفحة.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold shadow-sm"
                    >
                        إعادة تحميل الصفحة ↻
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
