import { toast } from 'sonner';

export class AppError extends Error {
    public code: string;
    public status: number;
    public isOperational: boolean;

    constructor(message: string, code: string = 'UNKNOWN_ERROR', status: number = 500, isOperational: boolean = true) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.status = status;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export const handleError = (error: unknown, context?: string) => {
    console.error(`Error in ${context || 'unknown context'}:`, error);

    if (error instanceof AppError) {
        if (error.isOperational) {
            toast.error(error.message);
        }
        // Non-operational errors might be logged to a service but not shown in detail to user
        return;
    }

    if (error instanceof Error) {
        // Check for common error patterns (e.g. timeout, network)
        if (error.message.includes('Network Error')) {
            toast.error('Network error. Please check your connection.');
            return;
        }
        toast.error(error.message || 'An unexpected error occurred.');
        return;
    }

    toast.error('An unexpected error occurred.');
};
