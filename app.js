import express from 'express';
import cors from 'cors';

const app = express();

// إصلاح CORS - السماح لجميع البورتات
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

// بيانات وهمية للاختبار
app.get('/api/customer/dashboard', (req, res) => {
  res.json({
    stats: {
      totalPets: 3,
      upcomingAppointments: 1,
      completedAppointments: 5,
      totalVetsVisited: 2
    }
  });
});

app.get('/api/records/my-pets', (req, res) => {
  res.json({
    pets: [
      {
        id: '1',
        petName: 'لونا',
        species: 'قطة',
        breed: 'شيرازي',
        age: 2,
        weight: 4,
        gender: 'female',
        color: 'أبيض'
      },
      {
        id: '2', 
        petName: 'ماكس',
        species: 'كلب',
        breed: 'جولدن ريتريفر',
        age: 3,
        weight: 25,
        gender: 'male',
        color: 'ذهبي'
      }
    ]
  });
});

// مواعيد المستخدم
app.get('/api/appointments/my-appointments', (req, res) => {
  res.json({
    appointments: [
      {
        id: 'a1',
        title: 'فحص دوري',
        description: 'فحص عام للحيوان الأليف',
        scheduledTime: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        status: 'confirmed',
        vetName: 'د. أحمد',
        vetSpecialization: 'رعاية عامة',
        price: 150,
        createdAt: new Date().toISOString()
      }
    ]
  });
});

// بدء الخادم
const PORT = process.env.PORT || 7860;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});
 