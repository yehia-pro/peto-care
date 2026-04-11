import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: 'danger' | 'warning' | 'info'
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'تأكيد',
    cancelText = 'إلغاء',
    type = 'warning'
}) => {
    if (!isOpen) return null

    const colors = {
        danger: 'bg-red-100 text-red-600',
        warning: 'bg-yellow-100 text-[var(--color-vet-accent)]',
        info: 'bg-blue-100 text-[var(--color-vet-primary)]'
    }

    const buttonColors = {
        danger: 'bg-red-600 hover:bg-red-700',
        warning: 'bg-[var(--color-vet-accent)] hover:bg-[var(--color-vet-accent)]',
        info: 'bg-[var(--color-vet-primary)] hover:bg-[var(--color-vet-primary)]'
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4">
            <div
                className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all"
                style={{
                    backdropFilter: 'blur(10px)',
                    background: 'rgba(255, 255, 255, 0.95)'
                }}
            >
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-full ${colors[type]}`}>
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <p className="text-gray-600 mb-6 pr-12">{message}</p>

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm()
                                onClose()
                            }}
                            className={`px-4 py-2 text-white rounded-lg transition-colors font-medium ${buttonColors[type]}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ConfirmDialog
