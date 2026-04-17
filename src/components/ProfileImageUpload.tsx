import { useState, useRef } from 'react';
import { Upload, X, Check, Loader } from 'lucide-react';
import axios from 'axios';
import { SafeImage } from './SafeImage';

interface ProfileImageUploadProps {
    currentImage?: string;
    onUploadSuccess: (imageUrl: string) => void;
}

const ProfileImageUpload = ({ currentImage, onUploadSuccess }: ProfileImageUploadProps) => {
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('يرجى اختيار صورة صحيحة');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('حجم الصورة يجب أن يكون أقل من 10 ميجابايت');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload image
        await uploadImage(file);
    };

    const uploadImage = async (file: File) => {
        setUploading(true);
        setError(null);
        setSuccess(false);

        try {
            const formData = new FormData();
            formData.append('image', file);

            const token = localStorage.getItem('token');
            const response = await axios.patch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:7860'}/api/auth/profile/image`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.avatarUrl) {
                setSuccess(true);
                onUploadSuccess(response.data.avatarUrl);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.response?.data?.message || 'فشل رفع الصورة');
        } finally {
            setUploading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const file = e.dataTransfer.files?.[0];
        if (file) {
            const fakeEvent = {
                target: { files: [file] }
            } as any;
            await handleFileSelect(fakeEvent);
        }
    };

    const clearImage = () => {
        setPreview(null);
        setError(null);
        setSuccess(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full">
            <div
                className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[var(--color-vet-primary)] transition cursor-pointer bg-gray-50"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {preview ? (
                    <div className="relative inline-block">
                        <SafeImage
                            src={preview}
                            alt="Preview"
                            className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
                        />
                        {!uploading && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    clearImage();
                                }}
                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        {success && (
                            <div className="absolute bottom-0 right-0 bg-[var(--color-vet-secondary)] text-white rounded-full p-1">
                                <Check className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                            <Upload className="w-8 h-8 text-[var(--color-vet-primary)]" />
                        </div>
                        <div>
                            <p className="text-gray-700 font-medium">اضغط أو اسحب صورة هنا</p>
                            <p className="text-gray-500 text-sm mt-1">PNG, JPG, GIF حتى 5MB</p>
                        </div>
                    </div>
                )}

                {uploading && (
                    <div className="absolute inset-0 bg-white bg-opacity-90 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                            <Loader className="w-8 h-8 text-[var(--color-vet-primary)] animate-spin mx-auto mb-2" />
                            <p className="text-gray-600">جاري الرفع...</p>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {success && (
                <div className="mt-4 bg-green-50 border border-green-200 text-[var(--color-vet-secondary)] px-4 py-3 rounded-lg">
                    تم رفع الصورة بنجاح! ✓
                </div>
            )}
        </div>
    );
};

export default ProfileImageUpload;
