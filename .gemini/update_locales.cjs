const fs = require('fs');
const enPath = 'src/locales/en.json';
const arPath = 'src/locales/ar.json';

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

const dbEn = {
  hello: 'Hello {{name}}',
  accountOverview: 'Account Overview',
  messages: 'Messages',
  viewAll: 'View All',
  quickActions: 'Quick Actions',
  consultation: 'Medical Consultation',
  emergency: 'Emergency',
  recentActivity: 'Recent Activity',
  appointmentWith: 'Appointment with {{name}}',
  noRecentActivity: 'No recent activity',
  pendingReviewsCount: 'Pending Reviews',
  noPendingReviews: 'No pending reviews',
  notifications: 'Notifications',
  noUpcomingAppointments: 'You have no upcoming appointments',
  stats: {
    totalAppointments: 'Total Appointments',
    completed: 'Completed',
    upcomingAppointments: 'Upcoming Appointments',
    within30Days: 'Within 30 days',
    totalPets: 'Total Pets',
    registeredPets: 'Registered Pets',
    unreadMessages: 'Unread format'
  },
  reminders: {
    appointment: 'Appointment Reminder',
    appointmentDesc: 'You have an appointment coming up.',
    vaccination: 'Vaccination Reminder',
    vaccinationDesc: "It's time for your pet's checkup."
  }
};

const dbAr = {
  hello: 'أهلاً بك {{name}}',
  accountOverview: 'نظرة عامة على حسابك',
  messages: 'الرسائل',
  viewAll: 'عرض الكل',
  quickActions: 'إجراءات سريعة',
  consultation: 'استشارة طبية',
  emergency: 'طوارئ',
  recentActivity: 'النشاط الأخير',
  appointmentWith: 'موعد مع {{name}}',
  noRecentActivity: 'لا يوجد نشاط أخير',
  pendingReviewsCount: 'المراجعات المعلقة',
  noPendingReviews: 'لا توجد مراجعات معلقة',
  notifications: 'الإشعارات',
  noUpcomingAppointments: 'ليس لديك مواعيد قادمة',
  stats: {
    totalAppointments: 'إجمالي المواعيد',
    completed: 'مكتملة',
    upcomingAppointments: 'المواعيد القادمة',
    within30Days: 'خلال 30 يوماً',
    totalPets: 'إجمالي الحيوانات',
    registeredPets: 'حيوانات مسجلة',
    unreadMessages: 'رسائل غير مقروءة'
  },
  reminders: {
    appointment: 'تذكير بموعد',
    appointmentDesc: 'لديك موعد طبي قريب.',
    vaccination: 'تذكير بالتطعيم',
    vaccinationDesc: 'حان موعد تطعيم حيوانك الأليف.'
  }
};

en.dashboard = dbEn;
ar.dashboard = dbAr;

fs.writeFileSync(enPath, JSON.stringify(en, null, 4));
fs.writeFileSync(arPath, JSON.stringify(ar, null, 4));

console.log('Updated JSON files successfully!');
