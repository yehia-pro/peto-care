import { useState } from 'react';
import { Filter, X, MapPin, Star, DollarSign } from 'lucide-react';

interface SearchFiltersProps {
    onFilterChange: (filters: FilterValues) => void;
    type: 'vets' | 'stores';
}

export interface FilterValues {
    location?: string;
    specialty?: string;
    category?: string;
    minRating?: number;
    sortBy?: string;
}

const governorates = [
    'Cairo', 'Giza', 'Alexandria', 'Dakahlia', 'Red Sea', 'Beheira', 'Fayoum',
    'Gharbiya', 'Ismailia', 'Menofia', 'Minya', 'Qaliubiya', 'New Valley',
    'Suez', 'Aswan', 'Assiut', 'Beni Suef', 'Port Said', 'Damietta', 'Sharkia',
    'South Sinai', 'Kafr Al Sheikh', 'Matrouh', 'Luxor', 'Qena', 'North Sinai', 'Sohag'
];

const vetSpecialties = [
    'General', 'Surgery', 'Dentistry', 'Dermatology', 'Cardiology',
    'Ophthalmology', 'Orthopedics', 'Emergency'
];

const storeCategories = [
    'طعام', 'ألعاب', 'مستلزمات', 'أدوية', 'ملابس', 'أقفاص'
];

const SearchFilters = ({ onFilterChange, type }: SearchFiltersProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState<FilterValues>({
        location: '',
        specialty: '',
        category: '',
        minRating: undefined,
        sortBy: 'rating'
    });

    const handleFilterChange = (key: keyof FilterValues, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        const emptyFilters: FilterValues = {
            location: '',
            specialty: '',
            category: '',
            minRating: undefined,
            sortBy: 'rating'
        };
        setFilters(emptyFilters);
        onFilterChange(emptyFilters);
    };

    const activeFiltersCount = Object.values(filters).filter(v => v && v !== '').length - 1; // Exclude sortBy

    return (
        <div className="relative">
            {/* Filter Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
                <Filter className="w-5 h-5" />
                <span>الفلاتر</span>
                {activeFiltersCount > 0 && (
                    <span className="bg-[var(--color-vet-primary)] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {activeFiltersCount}
                    </span>
                )}
            </button>

            {/* Filters Panel */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-6 w-80 z-50" dir="rtl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">الفلاتر</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Location Filter */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <MapPin className="w-4 h-4" />
                                الموقع
                            </label>
                            <select
                                value={filters.location}
                                onChange={(e) => handleFilterChange('location', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-[var(--color-vet-primary)]"
                            >
                                <option value="">جميع المحافظات</option>
                                {governorates.map(gov => (
                                    <option key={gov} value={gov}>{gov}</option>
                                ))}
                            </select>
                        </div>

                        {/* Specialty/Category Filter */}
                        {type === 'vets' ? (
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                    التخصص
                                </label>
                                <select
                                    value={filters.specialty}
                                    onChange={(e) => handleFilterChange('specialty', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-[var(--color-vet-primary)]"
                                >
                                    <option value="">جميع التخصصات</option>
                                    {vetSpecialties.map(spec => (
                                        <option key={spec} value={spec}>{spec}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                    الفئة
                                </label>
                                <select
                                    value={filters.category}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-[var(--color-vet-primary)]"
                                >
                                    <option value="">جميع الفئات</option>
                                    {storeCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Rating Filter */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Star className="w-4 h-4" />
                                الحد الأدنى للتقييم
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(rating => (
                                    <button
                                        key={rating}
                                        onClick={() => handleFilterChange('minRating', rating)}
                                        className={`flex-1 py-2 rounded-lg border transition ${filters.minRating === rating
                                                ? 'bg-[var(--color-vet-primary)] text-white border-[var(--color-vet-primary)]'
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-[var(--color-vet-primary)]'
                                            }`}
                                    >
                                        {rating}★
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sort By */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                الترتيب حسب
                            </label>
                            <select
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-[var(--color-vet-primary)]"
                            >
                                <option value="rating">التقييم</option>
                                {type === 'vets' && <option value="experience">الخبرة</option>}
                                {type === 'stores' && <option value="products">عدد المنتجات</option>}
                            </select>
                        </div>

                        {/* Clear Filters Button */}
                        <button
                            onClick={clearFilters}
                            className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                            مسح الفلاتر
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchFilters;
