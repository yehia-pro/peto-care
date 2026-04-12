import React, { useState, useEffect } from 'react';
import { Plus, FileText, Stethoscope, Pill, Camera, Trash2, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import api, { recordsAPI, uploadAPI } from '../services/api';
import { toast } from 'sonner';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { SafeImage } from '../components/SafeImage';

interface PetRecord {
  _id: string;
  userId: string;
  petName: string;
  petType: string;
  breed?: string;
  petImage?: string;
  summary: string;
  history: string;
  medications: string;
  createdAt: string;
}

const PetRecords = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const [records, setRecords] = useState<PetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PetRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<PetRecord | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    recordId: string | null;
  }>({ isOpen: false, recordId: null });

  // Form states
  const [formData, setFormData] = useState({
    petName: '',
    petType: '',
    breed: '',
    petImage: '',
    summary: '',
    history: '',
    medications: '',
  });

  useEffect(() => {
    fetchRecords();
    document.title = t('petRecords.title') + ' - ' + (t('brand.name') || 'Pet Care');
  }, [t]);

  const fetchRecords = async (retries = 3) => {
    try {
      setError(null);
      setLoading(true);

      // Try fetching records directly — health check was causing false negatives on cold-start
      const response = await recordsAPI.getRecords();
      const recordsData = response.data?.records;
      setRecords(Array.isArray(recordsData) ? recordsData : []);
    } catch (error: any) {
      console.error('Error fetching pet records:', error);

      // Retry on connection issues (Hugging Face cold start can take up to 60s)
      if (retries > 0 && (error?.message === 'Network Error' || error?.code === 'ECONNREFUSED' || error?.code === 'ERR_NETWORK')) {
        console.log(`Retrying... attempts left: ${retries}`);
        setTimeout(() => fetchRecords(retries - 1), 3000);
        return;
      }

      const errorMessage = error?.response?.data?.error || t('petRecords.errors.fetchFailed');
      setError(errorMessage);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const response = await uploadAPI.uploadImage(file);
      const imageUrl = response.data.url || response.data.path;
      setFormData(prev => ({ ...prev, petImage: imageUrl }));
      toast.success(t('petRecords.messages.uploadSuccess'));
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('petRecords.errors.uploadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await recordsAPI.createRecord(formData);
      toast.success(t('petRecords.messages.addSuccess'));
      setShowAddModal(false);
      resetForm();
      fetchRecords();
    } catch (error) {
      console.error('Error adding pet record:', error);
      toast.error(t('petRecords.errors.addFailed'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      petName: '',
      petType: '',
      breed: '',
      petImage: '',
      summary: '',
      history: '',
      medications: '',
    });
    setEditingRecord(null);
  };

  const handleEdit = (record: PetRecord) => {
    setEditingRecord(record);
    setFormData({
      petName: record.petName,
      petType: record.petType,
      breed: record.breed || '',
      petImage: record.petImage || '',
      summary: record.summary,
      history: record.history,
      medications: record.medications,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setLoading(true);

    try {
      await recordsAPI.updateRecord(editingRecord._id, formData);
      toast.success(t('petRecords.messages.updateSuccess'));
      setShowEditModal(false);
      resetForm();
      fetchRecords();
    } catch (error) {
      console.error('Error updating pet record:', error);
      toast.error(t('petRecords.errors.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (recordId: string) => {
    setConfirmDialog({ isOpen: true, recordId });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDialog.recordId) return;

    try {
      await recordsAPI.deleteRecord(confirmDialog.recordId);
      toast.success(t('petRecords.messages.deleteSuccess'));
      setConfirmDialog({ isOpen: false, recordId: null });
      fetchRecords();
    } catch (error) {
      console.error('Error deleting pet record:', error);
      toast.error(t('petRecords.errors.deleteFailed'));
    }
  };

  const getSpeciesIcon = (petType: string) => {
    if (!petType) return '🐾';
    const type = petType.toLowerCase();
    if (type.includes('كلب') || type.includes('dog')) return '🐕';
    if (type.includes('قط') || type.includes('cat')) return '🐈';
    if (type.includes('طائر') || type.includes('bird')) return '🐦';
    if (type.includes('أرنب') || type.includes('rabbit')) return '🐰';
    if (type.includes('سمك') || type.includes('fish')) return '🐠';
    return '🐾';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : 'en-US');
  };

  if (loading && records.length === 0 && !showAddModal && !showEditModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-vet-primary)]"></div>
      </div>
    );
  }

  if (error && records.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-red-600 text-center mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold mb-2">{t('petRecords.errors.connectionError')}</h2>
            <p className="text-gray-600 mb-4">{error}</p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4 text-right">
              <p className="text-sm font-bold text-yellow-800 mb-2">
                {t('petRecords.troubleshoot.title')}
              </p>
              <ul className="text-xs text-[var(--color-vet-accent)] space-y-1 list-disc list-inside text-right">
                <li>{t('petRecords.troubleshoot.tip1')}</li>
                <li>{t('petRecords.troubleshoot.tip2')}</li>
                <li>{t('petRecords.troubleshoot.tip3')}</li>
                <li>{t('petRecords.troubleshoot.tip4')}</li>
              </ul>
            </div>
          </div>
          <button
            onClick={() => fetchRecords()}
            className="w-full bg-[var(--color-vet-primary)] text-white px-4 py-2 rounded-md hover:bg-[var(--color-vet-primary)] transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('petRecords.buttons.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('petRecords.title')}</h1>
            <p className="text-gray-600">{t('petRecords.subtitle')}</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[var(--color-vet-primary)] text-white px-4 py-2 rounded-md hover:bg-[var(--color-vet-primary)] transition-colors flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-5 h-5" />
            <span>{t('petRecords.addNew')}</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="w-6 h-6 text-[var(--color-vet-primary)]" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">{t('petRecords.stats.total')}</p>
                <p className="text-2xl font-bold text-gray-900">{records.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <Stethoscope className="w-6 h-6 text-[var(--color-vet-secondary)]" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">{t('petRecords.stats.recent')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {records.filter(r => {
                    const daysSinceCreation = Math.floor((Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                    return daysSinceCreation <= 30
                  }).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <Pill className="w-6 h-6 text-purple-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">{t('petRecords.stats.registered')}</p>
                <p className="text-2xl font-bold text-gray-900">{records.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pet Records List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('petRecords.myPets')}</h2>

            {records.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {records.map((record) => (
                  <div
                    key={record._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <div className="flex items-center mb-3">
                      <div className="text-2xl ml-3">{getSpeciesIcon(record.petType)}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{record.petName}</h3>
                        <p className="text-sm text-gray-600">{record.petType}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm flex-grow">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('petRecords.summary')}:</span>
                        <span className="font-medium text-right max-w-[60%] truncate">{record.summary || '-'}</span>
                      </div>
                      {record.breed && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t('petRecords.breed')}:</span>
                          <span className="font-medium">{record.breed}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        <span>{t('petRecords.createdAt')}: {formatDate(record.createdAt)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(record);
                          }}
                          className="text-[var(--color-vet-primary)] hover:text-[var(--color-vet-primary)] hover:bg-blue-50 p-2 rounded-lg transition-colors"
                          title={t('petRecords.editTooltip')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(record._id);
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title={t('petRecords.deleteTooltip')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">{t('petRecords.noRecords')}</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-[var(--color-vet-primary)] text-white px-4 py-2 rounded-md hover:bg-[var(--color-vet-primary)] transition-colors"
                >
                  {t('petRecords.addFirst')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Add Pet Record Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{t('petRecords.modals.addTitle')}</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('petRecords.form.petName')}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.petName}
                        onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                        placeholder={t('petRecords.placeholders.petName')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('petRecords.form.petType')}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.petType}
                        onChange={(e) => setFormData({ ...formData, petType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                        placeholder={t('petRecords.placeholders.petType')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('petRecords.form.breed')}
                      </label>
                      <input
                        type="text"
                        value={formData.breed}
                        onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                        placeholder={t('petRecords.placeholders.breed')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('petRecords.form.petImage')}
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-300 flex items-center justify-center">
                        {formData.petImage ? (
                          <SafeImage src={formData.petImage} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="block w-full text-sm text-gray-500
                             file:mr-4 file:py-2 file:px-4
                             file:rounded-full file:border-0
                             file:text-sm file:font-semibold
                             file:bg-blue-50 file:text-[var(--color-vet-primary)]
                             hover:file:bg-blue-100
                           "
                        />
                        <p className="mt-1 text-xs text-gray-500">{t('petRecords.form.imageNote')}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('petRecords.form.summary')}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                      placeholder={t('petRecords.placeholders.summary')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('petRecords.form.history')}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.history}
                      onChange={(e) => setFormData({ ...formData, history: e.target.value })}
                      placeholder={t('petRecords.placeholders.history')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('petRecords.form.medications')}
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={formData.medications}
                      onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                      placeholder={t('petRecords.placeholders.medications')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 space-x-reverse">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-[var(--color-vet-primary)] text-white rounded-md hover:bg-[var(--color-vet-primary)] disabled:bg-[var(--color-vet-primary)] transition-colors flex items-center"
                    >
                      {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                      {loading ? t('petRecords.buttons.saving') : t('petRecords.buttons.save')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Pet Record Details Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <div className="text-3xl ml-4">{getSpeciesIcon(selectedRecord.petType)}</div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedRecord.petName}</h2>
                      <p className="text-gray-600">{selectedRecord.petType}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('petRecords.details.summary')}</h3>
                    <p className="text-gray-700">{selectedRecord.summary}</p>
                  </div>

                  {/* Medical History */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('petRecords.details.history')}</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedRecord.history}</p>
                  </div>

                  {/* Medications */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('petRecords.details.medications')}</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedRecord.medications}</p>
                  </div>

                  {/* Metadata */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('petRecords.details.additionalInfo')}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('petRecords.createdAt')}:</span>
                        <span className="font-medium">{formatDateTime(selectedRecord.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('petRecords.details.recordId')}:</span>
                        <span className="font-medium font-mono text-xs">{selectedRecord._id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Pet Record Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{t('petRecords.modals.editTitle')}</h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('petRecords.form.petName')}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.petName}
                        onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('petRecords.form.petType')}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.petType}
                        onChange={(e) => setFormData({ ...formData, petType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('petRecords.form.breed')}
                      </label>
                      <input
                        type="text"
                        value={formData.breed}
                        onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('petRecords.form.petImage')}
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-300 flex items-center justify-center">
                        {formData.petImage ? (
                          <SafeImage src={formData.petImage} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="block w-full text-sm text-gray-500
                           file:mr-4 file:py-2 file:px-4
                           file:rounded-full file:border-0
                           file:text-sm file:font-semibold
                           file:bg-blue-50 file:text-[var(--color-vet-primary)]
                           hover:file:bg-blue-100
                         "
                        />
                        <p className="mt-1 text-xs text-gray-500">{t('petRecords.form.imageNote')}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('petRecords.form.summary')}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('petRecords.form.history')}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.history}
                      onChange={(e) => setFormData({ ...formData, history: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('petRecords.form.medications')}
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={formData.medications}
                      onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 space-x-reverse">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-[var(--color-vet-primary)] text-white rounded-md hover:bg-[var(--color-vet-primary)] disabled:bg-[var(--color-vet-primary)] transition-colors flex items-center"
                    >
                      {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                      {loading ? t('petRecords.buttons.updating') : t('petRecords.buttons.update')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog({ isOpen: false, recordId: null })}
          onConfirm={handleDeleteConfirm}
          title={t('petRecords.deleteConfirm.title')}
          message={t('petRecords.deleteConfirm.message')}
          confirmText={t('petRecords.delete')}
          cancelText={t('common.cancel')}
          type="danger"
        />
      </div>
    </div>
  );
};

export default PetRecords;
