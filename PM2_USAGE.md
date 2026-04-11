# استخدام PM2 لإدارة السيرفرات

## التثبيت

```bash
npm install -g pm2
```

## بدء التشغيل

### تشغيل جميع السيرفرات
```bash
pm2 start ecosystem.config.json
```

### تشغيل السيرفر الخلفي فقط
```bash
pm2 start ecosystem.config.json --only vet-backend
```

### تشغيل السيرفر الأمامي فقط
```bash
pm2 start ecosystem.config.json --only vet-frontend
```

## الأوامر الأساسية

### عرض حالة السيرفرات
```bash
pm2 status
```

### عرض السجلات (Logs)
```bash
pm2 logs
pm2 logs vet-backend
pm2 logs vet-frontend
```

### إعادة تشغيل السيرفرات
```bash
pm2 restart all
pm2 restart vet-backend
pm2 restart vet-frontend
```

### إيقاف السيرفرات
```bash
pm2 stop all
pm2 stop vet-backend
pm2 stop vet-frontend
```

### حذف السيرفرات من PM2
```bash
pm2 delete all
pm2 delete vet-backend
pm2 delete vet-frontend
```

### مراقبة الأداء
```bash
pm2 monit
```

## التشغيل التلقائي عند بدء النظام

### حفظ التكوين الحالي
```bash
pm2 save
```

### تفعيل التشغيل التلقائي
```bash
pm2 startup
```

سيعطيك PM2 أمر لتشغيله (قد يحتاج صلاحيات المسؤول).

## الميزات

- ✅ إعادة تشغيل تلقائية عند حدوث أخطاء
- ✅ حد أقصى 10 إعادات تشغيل
- ✅ تأخير 4 ثوان بين كل إعادة تشغيل
- ✅ حد أقصى للذاكرة (1GB للخلفي، 500MB للأمامي)
- ✅ سجلات منظمة في مجلد logs
- ✅ دمج السجلات (merge_logs)
- ✅ وقت تشغيل أدنى 10 ثوان

## الملفات

- `ecosystem.config.json` - ملف التكوين الرئيسي
- `server/logs/pm2-error.log` - سجل أخطاء السيرفر الخلفي
- `server/logs/pm2-out.log` - سجل مخرجات السيرفر الخلفي
- `logs/pm2-frontend-error.log` - سجل أخطاء السيرفر الأمامي
- `logs/pm2-frontend-out.log` - سجل مخرجات السيرفر الأمامي
