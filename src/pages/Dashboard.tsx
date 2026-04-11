import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MessageCircle, FileText, TrendingUp, Activity, ChevronRight, Check, Stethoscope, Bell, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { appointmentsAPI, recordsAPI, reviewsAPI } from '../services/api';

interface DashboardStats {
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  totalPets: number;
  recentAppointments: any[];
  upcomingAppointmentsList: any[];
  recentMessages: any[];
  pendingReviews: any[];
}

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [appointmentsRes, recordsRes, reviewsRes] = await Promise.all([
        appointmentsAPI.getAppointments(),
        recordsAPI.getRecords(),
        reviewsAPI.getMyReviews()
      ]);

      const appointments = appointmentsRes.data || [];
      const records = recordsRes.data?.records || [];
      const reviews = reviewsRes.data || [];

      const upcoming = appointments.filter((apt: any) =>
        apt.status === 'confirmed' && new Date(apt.date) >= new Date()
      ).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const recent = appointments
        .filter((apt: any) => apt.status === 'completed')
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      setStats({
        totalAppointments: appointments.length,
        upcomingAppointments: upcoming.length,
        completedAppointments: appointments.filter((apt: any) => apt.status === 'completed').length,
        totalPets: records.length,
        recentAppointments: recent,
        upcomingAppointmentsList: upcoming.slice(0, 3),
        recentMessages: [],
        pendingReviews: reviews.filter((review: any) => !review.rating)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US');
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }: any) => (
    <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center text-sm ${trend > 0 ? 'text-[var(--color-vet-secondary)]' : 'text-red-600'}`}>
            <TrendingUp className="w-4 h-4 mr-1" />
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-vet-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('dashboard.hello', { name: user?.email?.split('@')[0] || t('nav.member') })}
          </h1>
          <p className="text-gray-600">{t('dashboard.accountOverview')}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Calendar}
            title={t('dashboard.stats.totalAppointments')}
            value={stats?.totalAppointments || 0}
            color="bg-[var(--color-vet-primary)]"
            subtitle={`${stats?.completedAppointments || 0} ${t('dashboard.stats.completed')}`}
          />
          <StatCard
            icon={Clock}
            title={t('dashboard.stats.upcomingAppointments')}
            value={stats?.upcomingAppointments || 0}
            color="bg-[var(--color-vet-secondary)]"
            subtitle={t('dashboard.stats.within30Days')}
          />
          <StatCard
            icon={FileText}
            title={t('dashboard.stats.totalPets')}
            value={stats?.totalPets || 0}
            color="bg-purple-500"
            subtitle={t('dashboard.stats.registeredPets')}
          />
          <StatCard
            icon={MessageCircle}
            title={t('dashboard.messages')}
            value={stats?.recentMessages?.length || 0}
            color="bg-[var(--color-vet-accent)]"
            subtitle={t('dashboard.stats.unreadMessages')}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Appointments & Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Appointments */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.stats.upcomingAppointments')}</h2>
                  <button
                    onClick={() => navigate('/appointments')}
                    className="text-[var(--color-vet-primary)] hover:text-blue-800 text-sm font-medium flex items-center"
                  >
                    {t('dashboard.viewAll')}
                    <ChevronRight className={`w-4 h-4 ml-1 ${i18n.language === 'ar' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
              <div className="p-6">
                {stats?.upcomingAppointmentsList?.length ? (
                  <div className="space-y-4">
                    {stats.upcomingAppointmentsList.map((appointment) => (
                      <div key={appointment._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4 space-x-reverse">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Calendar className="w-5 h-5 text-[var(--color-vet-primary)]" />
                          </div>
                          <div className="mr-4">
                            <p className="font-medium text-gray-900">{appointment.vetName}</p>
                            <p className="text-sm text-gray-600">{appointment.specialization}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatDate(appointment.date)}</p>
                          <p className="text-sm text-gray-600">{appointment.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">{t('dashboard.noUpcomingAppointments')}</p>
                    <button
                      onClick={() => navigate('/appointments')}
                      className="bg-[var(--color-vet-primary)] text-white px-4 py-2 rounded-md hover:bg-[var(--color-vet-primary)] transition-colors"
                    >
                      {t('appointments.book')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.quickActions')}</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => navigate('/appointments')}
                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Calendar className="w-8 h-8 text-[var(--color-vet-primary)] mb-2" />
                    <span className="text-sm font-medium text-gray-900">{t('appointments.book')}</span>
                  </button>
                  <button
                    onClick={() => navigate('/services')}
                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Stethoscope className="w-8 h-8 text-[var(--color-vet-secondary)] mb-2" />
                    <span className="text-sm font-medium text-gray-900">{t('dashboard.consultation')}</span>
                  </button>
                  <button
                    onClick={() => navigate('/pet-records')}
                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FileText className="w-8 h-8 text-purple-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900">{t('petRecords.title')}</span>
                  </button>
                  <button
                    onClick={() => navigate('/emergency')}
                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Activity className="w-8 h-8 text-red-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900">{t('dashboard.emergency')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Recent Activity & Reviews */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.recentActivity')}</h2>
              </div>
              <div className="p-6">
                {stats?.recentAppointments?.length ? (
                  <div className="space-y-4">
                    {stats.recentAppointments.map((appointment, index) => (
                      <div key={index} className="flex items-start space-x-3 space-x-reverse">
                        <div className="p-2 bg-green-100 rounded-full">
                          <Check className="w-4 h-4 text-[var(--color-vet-secondary)]" />
                        </div>
                        <div className="mr-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {t('dashboard.appointmentWith', { name: appointment.vetName })}
                          </p>
                          <p className="text-xs text-gray-600">{formatDate(appointment.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{t('dashboard.noRecentActivity')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pending Reviews */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.pendingReviewsCount')}</h2>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">
                    {stats?.pendingReviews?.length || 0}
                  </span>
                </div>
              </div>
              <div className="p-6">
                {stats?.pendingReviews?.length ? (
                  <div className="space-y-4">
                    {stats.pendingReviews.map((review, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-900">{review.vetName}</p>
                          <p className="text-sm text-gray-600">{formatDate(review.date)}</p>
                        </div>
                        <div className="flex items-center mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-5 h-5 text-gray-300" />
                          ))}
                        </div>
                        <button
                          onClick={() => navigate('/reviews')}
                          className="w-full bg-[var(--color-vet-primary)] text-white py-2 px-4 rounded-md hover:bg-[var(--color-vet-primary)] transition-colors text-sm"
                        >
                          {t('reviews.writeReview')}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{t('dashboard.noPendingReviews')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.notifications')}</h2>
                  <Bell className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="w-2 h-2 bg-[var(--color-vet-primary)] rounded-full mt-2"></div>
                    <div className="mr-3 flex-1">
                      <p className="text-sm text-gray-900">{t('dashboard.reminders.appointment')}</p>
                      <p className="text-xs text-gray-600">{t('dashboard.reminders.appointmentDesc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="w-2 h-2 bg-[var(--color-vet-secondary)] rounded-full mt-2"></div>
                    <div className="mr-3 flex-1">
                      <p className="text-sm text-gray-900">{t('dashboard.reminders.vaccination')}</p>
                      <p className="text-xs text-gray-600">{t('dashboard.reminders.vaccinationDesc')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
