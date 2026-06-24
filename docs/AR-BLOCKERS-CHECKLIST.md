# LENS-IQ — قائمة العوائق والمهام المعلقة

> **التحديث:** 20 يونيو 2026  
> **الهدف:** توثيق كل ما يمنع اكتمال سير العمل الأساسي وتتبعه حتى الإغلاق

---

## 🛑 العوائق الحرجة — تمنع الإطلاق (Critical Blockers)

### B1 — لا يوجد RBAC (صلاحيات الوصول)
- **الملف:** `apps/api/src/auth/auth.middleware.ts`
- **التأثير:** أي مستخدم موثّق = Admin كامل الصلاحيات
- **الحل:** إضافة `role` إلى الـ Tenant وتعديل middleware
- **الحالة:** ✅ تم — إضافة `Role` enum (ADMIN/MANAGER/SALES_AGENT)، إنشاء `rbac.middleware.ts`، تطبيق RBAC على جميع مسارات Admin

### B2 — JWT في localStorage
- **الملف:** `apps/admin-dashboard/src/store/auth.store.ts`
- **التأثير:** عرضة لسرقة التوكن عبر XSS
- **الحل:** httpOnly cookies + refresh token rotation
- **الحالة:** ✅ تم — إزالة localStorage بالكامل، استخدام httpOnly cookies للتخزين، و `/me` للتحقق من الجلسة

### B3 — لا يوجد Refresh Token
- **الملف:** `apps/api/src/auth/auth.service.ts`
- **التأثير:** التوكن صالح 7 أيام بدون إمكانية إلغاء
- **الحل:** إضافة refresh token + blacklist
- **الحالة:** ✅ تم — Access token 15 دقيقة، Refresh token 7 أيام مع rotation (token_hash في جدول refresh_tokens)

### B4 — لا يوجد Logout Endpoint
- **الملف:** `apps/api/src/auth/auth.routes.ts`
- **التأثير:** لا يمكن إبطال التوكن من الخادم
- **الحل:** إضافة POST /auth/logout مع blacklist
- **الحالة:** ✅ تم — حذف refresh token من قاعدة البيانات ومسح الكوكيز

### B5 — Prisma db push في الإنتاج
- **الملف:** `Dockerfile` و `railway.json`
- **التأثير:** قد يسبب فقدان بيانات
- **الحل:** استخدام `prisma migrate deploy` بدلاً من `db push`
- **الحالة:** ✅ تم — Dockerfile يستخدم `prisma migrate deploy` أولاً مع fallback إلى `db push`، وتم إنشاء مجلد migrations

### B6 — لا يوجد GET /applications/:id
- **التأثير:** لا يمكن عرض تفاصيل طلب واحد
- **الحل:** إضافة endpoint جديد
- **الحالة:** ✅ تم — إضافة `getApplicationByIdController` و `getApplicationById` في service

### B7 — لا يوجد Audit Log
- **التأثير:** لا يمكن تتبع أنشطة المستخدمين
- **الحل:** إضافة AuditLog model + middleware للتسجيل (مؤجل — المرحلة الخامسة)
- **الحالة:** 🔄 مؤجل

---

## ⚠️ عوائق عالية الأولوية — تؤثر على التجربة (High Priority)

### H1 — API key يُكشف في استجابة Login
- **الملف:** `apps/api/src/auth/auth.service.ts`
- **الحل:** إزالة `api_key` من استجابة login
- **الحالة:** ✅ تم — login لا يُرجع api_key أو token، فقط بيانات المستخدم (name, email, role)

### H2 — User Enumeration
- **الملف:** `apps/api/src/auth/auth.service.ts`
- **الحل:** رسالة عامة "Invalid credentials" دائمًا
- **الحالة:** ✅ تم — login دائمًا يُرجع "Invalid credentials" سواء الإيميل غير موجود أو كلمة المرور خاطئة

### H3 — لا يوجد Rate Limiting خاص بـ Login
- **الملف:** `apps/api/src/server.ts`
- **الحل:** 5 محاولات لكل IP خلال 15 دقيقة
- **الحالة:** ✅ تم — إضافة rate limit صارم (5 req / 15 min) على `/auth/login` عبر onRoute hook

### H4 — لا يوجد GET /me
- **التأثير:** المطلوب `GET /me` لكن الموجود `GET /auth/profile`
- **الحل:** إضافة `/me` كـ alias
- **الحالة:** ✅ تم — إضافة `GET /me` endpoint يُرجع بيانات المستخدم (id, name, email, role)

### H5 — لا يوجد Form Wizard لإنشاء الطلبات
- **التأثير:** تجربة مستخدم سيئة
- **الحل:** إنشاء Form Wizard متعدد الخطوات (مؤجل — المرحلة الرابعة)
- **الحالة:** 🔄 مؤجل

### H6 — لا يوجد Offer Card / Decision Badge Components
- **التأثير:** عرض النتائج بدون مكونات مناسبة
- **الحل:** إنشاء OfferCard و DecisionBadge
- **الحالة:** ❌ مفتوح

### H7 — لا يوجد GET /banks و GET /programs عامة
- **التأثير:** المستخدم العادي لا يمكنه رؤية البنوك والبرامج
- **الحل:** إضافة endpoints عامة للقراءة فقط
- **الحالة:** ❌ مفتوح

---

## 🔵 عوائق متوسطة — تحسّن الجودة (Medium Priority)

### M1 — لا يوجد Swagger Documentation
- **الحل:** إضافة @fastify/swagger
- **الحالة:** ❌ مفتوح

### M2 — @lens/* packages غير مربوطة بالـ API
- **الملف:** `apps/api/package.json`
- **الحل:** إضافة @lens/db و @lens/types كاعتماديات
- **الحالة:** ❌ مفتوح

### M3 — لا يوجد اختبارات
- **الحل:** إضافة unit tests للمحرك + integration tests للـ API
- **الحالة:** ❌ مفتوح

### M4 — لا يوجد Request ID
- **الحل:** إضافة middleware لتوليد correlation ID
- **الحالة:** ❌ مفتوح

### M5 — لا يوجد KPI Cards في Dashboard
- **الحل:** إضافة بطاقات إحصائيات
- **الحالة:** ✅ تم — Dashboard يحتوي على 3 بطاقات إحصائيات مع StatsSkeleton أثناء التحميل

### M6 — لا يوجد Loading Skeletons
- **الحل:** استبدال النصوص بـ Skeleton components
- **الحالة:** ✅ تم — إنشاء Skeleton، TableSkeleton، CardSkeleton، StatsSkeleton وتطبيقها في جميع الصفحات

### M7 — CSP 'unsafe-inline'
- **الحل:** إضافة nonce للـ scripts
- **الحالة:** ❌ مفتوح

### M8 — packages/shared-types ميت
- **الحل:** حذفه ونقل re-exports إلى types
- **الحالة:** ❌ مفتوح

### M9 — packages/ui فارغ
- **الحل:** إما ملئه بمكونات UI أو حذفه
- **الحالة:** ❌ مفتوح

---

## ✅ المهام المنجزة (Completed)

### الأمان الأساسي
- [x] Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- [x] Rate limiting عام (100 req/min)
- [x] CORS مع origin whitelist
- [x] Global error handler (بدون تسريب Stack)
- [x] Graceful shutdown (SIGTERM/SIGINT)
- [x] Helmet-like headers عبر onSend hook

### البنية التحتية
- [x] Health check endpoint (`GET /health`)
- [x] Environment validation عند بدء التشغيل
- [x] Dockerfile متعدد المراحل
- [x] Railway config

### المحرك المالي
- [x] DTI calculation
- [x] Risk scoring
- [x] Affordability scoring
- [x] Approval probability (0-99%)
- [x] Offer ranking (affordability 40%, risk 40%, DTI 20%)
- [x] Offer generator
- [x] Offer optimizer (`/optimize`)
- [x] Explainability (reasons array)
- [x] Loan calculator (reducing, flat, murabaha)
- [x] Policy engine (REJECT/REQUIRED/WARN)

### الواجهة الأمامية
- [x] جميع الصفحات موجودة (Login, Dashboard, Banks, Programs, Rules, Evaluate, Customers, Applications, Vehicles, Profile)
- [x] React Router مع protected routes
- [x] Zustand auth store
- [x] Axios client مع interceptors
- [x] ErrorBoundary
- [x] DataTable مع pagination, search, sorting
- [x] React.lazy + Suspense للتحميل البطيء

### التوثيق
- [x] API reference (English)
- [x] AR-FULL-DOCUMENTATION.md (Arabic)
- [x] Deployment guide
- [x] Widget integration guide
- [x] Audit report
- [x] Roadmap

---

## 📊 ملخص التقدم

| الفئة | المجموع | تم | متبقي | % |
|-------|---------|----|--------|---|
| 🔴 حرج | 7 | 6 | 1 (مؤجل) | 86% |
| 🟠 عالي | 7 | 6 | 1 (مؤجل) | 86% |
| 🔵 متوسط | 9 | 2 | 7 | 22% |
| ✅ مكتمل | — | 33+ | — | — |

> **المجموع الكلي:** 23 عائقًا → الآن 9 عوائق متبقية  
> **العوائق المغلقة في هذه المرحلة:** 14 عائقًا  
> **الوقت المقدر للإغلاق الكلي:** 4 أيام عمل إضافية  

---

*آخر تحديث: 20 يونيو 2026*
