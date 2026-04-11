@echo off
chcp 65001 >nul
title 🏥 إعداد نظام تشغيل موقع العيادة البيطرية
color 0A

echo ============================================
echo    🏥 إعداد نظام تشغيل موقع العيادة البيطرية
echo ============================================
echo.

set "SCRIPT_PATH=%~dp0"
set "PROJECT_PATH=%SCRIPT_PATH%"
set "SHORTCUT_NAME=موقع العيادة البيطرية"

:: التحقق من صلاحيات المسؤول
echo 🔍 التحقق من صلاحيات المسؤول...
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  يرجى تشغيل هذا الملف كمسؤول للحصول على أفضل أداء
    echo 💡 سيتم المتابعة بدون صلاحيات المسؤول
    echo.
)

:: إنشاء مجلد للسكريبتات
echo 📂 إنشاء مجلد السكريبتات...
if not exist "%PROJECT_PATH%\scripts" mkdir "%PROJECT_PATH%\scripts"

:: نسخ السكريبتات إلى مجلد السكريبتات
echo 📋 نسخ السكريبتات...
copy /y "%PROJECT_PATH%\start-website.bat" "%PROJECT_PATH%\scripts\" >nul
copy /y "%PROJECT_PATH%\start-full-website.bat" "%PROJECT_PATH%\scripts\" >nul
copy /y "%PROJECT_PATH%\open-site.bat" "%PROJECT_PATH%\scripts\" >nul

:: إنشاء اختصار على سطح المكتب
echo 📍 إنشاء اختصار على سطح المكتب...
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT_PATH=%DESKTOP%\%SHORTCUT_NAME%.lnk"

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = '%PROJECT_PATH%\scripts\start-website.bat'; $s.WorkingDirectory = '%PROJECT_PATH%'; $s.IconLocation = 'shell32.dll,21'; $s.Description = 'فتح موقع العيادة البيطرية بنقرة واحدة'; $s.Save()"

:: إنشاء اختصار في قائمة ابدأ (إذا كان لدى المسؤول)
if "%errorlevel%"=="0" (
    echo 📋 إنشاء اختصار في قائمة ابدأ...
    set "STARTMENU=%PROGRAMDATA%\Microsoft\Windows\Start Menu\Programs"
    if exist "%STARTMENU%" (
        powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%STARTMENU%\%SHORTCUT_NAME%.lnk'); $s.TargetPath = '%PROJECT_PATH%\scripts\start-website.bat'; $s.WorkingDirectory = '%PROJECT_PATH%'; $s.IconLocation = 'shell32.dll,21'; $s.Description = 'فتح موقع العيادة البيطرية بنقرة واحدة'; $s.Save()" >nul 2>&1
    )
)

:: إنشاء ملف تعريف للأوامر السريعة
echo 📝 إنشاء ملف تعريف الأوامر السريعة...
(
echo @echo off
echo :: أوامر سريعة لتشغيل الموقع
echo :: يمكنك حفظ هذا الملف في أي مكان وتشغيله
echo.
echo echo 🏥 موقع العيادة البيطرية - أوامر سريعة
echo echo ============================================
echo echo 💡 الأوامر المتاحة:
echo echo    1. فتح الموقع فقط
echo echo    2. فتح الموقع مع الخادم الخلفي
echo echo    3. فحص حالة الموقع
echo echo    4. إيقاف الموقع
echo echo ============================================
echo.
echo set /p choice="اختر رقم (1-4): "
echo.
echo if "%%choice%%"=="1" (
echo     start "" "%PROJECT_PATH%\scripts\start-website.bat"
echo ^) else if "%%choice%%"=="2" (
echo     start "" "%PROJECT_PATH%\scripts\start-full-website.bat"
echo ^) else if "%%choice%%"=="3" (
echo     powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:5173/' -UseBasicParsing -TimeoutSec 3 ^| Out-Null; Write-Host '✅ الموقع يعمل بنجاح!' -ForegroundColor Green } catch { Write-Host '❌ الموقع غير متاح' -ForegroundColor Red }"
echo     pause
echo ^) else if "%%choice%%"=="4" (
echo     taskkill /f /im node.exe ^>nul 2^>^&1
echo     taskkill /f /im cmd.exe ^>nul 2^>^&1
echo     echo ✅ تم إيقاف الموقع
echo     pause
echo ^) else (
echo     echo ❌ اختيار غير صحيح
echo     pause
echo ^)
echo exit /b 0
) > "%PROJECT_PATH%\quick-commands.bat"

echo.
echo ============================================
echo ✅ تم إكمال الإعداد بنجاح!
echo ============================================
echo 📍 تم إنشاء الاختصارات التالية:
echo    • سطح المكتب: %SHORTCUT_NAME%
echo    • مجلد السكريبتات: scripts\start-website.bat
echo    • أوامر سريعة: quick-commands.bat
echo.
echo 💡 للاستخدام:
echo    1. انقر نقراً مزدوجاً على اختصار سطح المكتب
echo    2. أو استخدم: scripts\start-website.bat
echo    3. أو استخدم: quick-commands.bat للخيارات المتقدمة
echo.
echo 🔗 سيتم فتح الموقع على: http://localhost:5173/
echo ============================================
echo.
pause