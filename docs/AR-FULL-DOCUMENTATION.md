# CarsFintech (LENS-IQ) — التوثيق الكامل

> 20 يونيو 2026 — التحديث الثالث

---

## 📋 المستندات ذات الصلة

| المستند | الوصف | الرابط |
|---------|-------|--------|
| `AR-ANALYSIS-REPORT.md` | تقرير التحليل الفني الكامل بالعربية — العوائق، الخطة، الأولويات | [افتح](./AR-ANALYSIS-REPORT.md) |
| `AR-BLOCKERS-CHECKLIST.md` | قائمة العوائق والمهام المعلقة مع تتبع الحالة | [افتح](./AR-BLOCKERS-CHECKLIST.md) |

> **ملخص سريع:** المشروع في حالة **65/100**. المحرك المالي كامل، جميع الـ endpoints تعمل، لكن هناك **7 عوائق حرجة** تمنع الإطلاق المباشر — أبرزها: لا RBAC، JWT في localStorage، لا refresh token. تحتاج **10 أيام عمل** لإغلاق جميع العوائق والوصول إلى **95/100**.

---

## فهرس المحتويات

1. [نظرة عامة عن النظام](#1-نظرة-عامة-عن-النظام)
2. [هيكلة المشروع (Monorepo)](#2-هيكلة-المشروع-monorepo)
3. [تشغيل السيرفر محليًا](#3-تشغيل-السيرفر-محليًا)
4. [أنواع المصادقة (Authentication)](#4-أنواع-المصادقة-authentication)
5. [خريطة الـ Endpoints](#5-خريطة-الـ-endpoints)
6. [شكل الردود](#6-شكل-الردود)
7. [محرك التقييم (Engine)](#7-محرك-التقييم-engine)
8. [دليل Flutter API Client](#8-دليل-flutter-api-client)
9. [قواعد دومين حرجة](#9-قواعد-دومين-حرجة)
10. [تشيك لست أول يوم](#10-تشيك-لست-أول-يوم)

---

## 1. نظرة عامة عن النظام

**CarsFintech** (الاسم الرمزي: **LENS-IQ**) هو نظام متكامل لتقييم وتمويل السيارات. يتكون من:

- **Backend**: Fastify 5 (TypeScript, ESM) مع PostgreSQL
- **Frontend**: React 19 + Vite 8 + MUI 9 + TailwindCSS 4
- **Database ORM**: Prisma (للهيكلة فقط) + raw `pg` (لاستعلامات التشغيل)
- **Widget**: تطبيق iframe مدمج لأنظمة CRM

### الميزات الرئيسية
- محرك تقييم تمويل متكامل (scoring, rules, pricing, offers)
- لوحة تحكم كاملة (Banks, Programs, Rules, Customers, Vehicles, Applications)
- نظام تقييم الاحتمالية (Approval Probability 0-99%)
- مُحسّن العروض (Offer Optimizer)
- واجهة عامة لتقديم الطلبات (Public Apply)
- نظام مصادقة JWT + API Key

---

## 2. هيكلة المشروع (Monorepo)

```
car1-fintech/
├── apps/
│   ├── api/                    # Fastify 5 API
│   │   └── src/
│   │       ├── admin/          # CRUD: banks, programs, rules, customers, vehicles, applications
│   │       ├── auth/           # JWT + API Key middleware, routes, service
│   │       ├── cli/            # CLI fixtures + runner
│   │       ├── db/             # PostgreSQL Pool (raw pg)
│   │       ├── engine/         # Lending engine
│   │       │   ├── evaluation/ # eligibility, policyEngine
│   │       │   ├── offers/     # Ranking, compareOffers, offerGenerator
│   │       │   ├── pricing/    # loanCalculator
│   │       │   ├── rules/      # operators, ruleEvaluator
│   │       │   ├── scoring/    # affordability, dti, riskScore, scoring
│   │       │   └── builders/   # result.builder
│   │       ├── mappers/        # applicationToInput, bank.mapper, program.mapper
│   │       ├── routes/         # evaluate, optimize, public.apply
│   │       ├── services/       # getApplication, getPrograms, getRules
│   │       ├── shared/         # env, response, types
│   │       └── server.ts       # Fastify entry point
│   ├── admin-dashboard/        # React 19 + Vite 8 admin SPA
│   └── widget/                 # Embeddable iframe app
├── packages/
│   ├── config/                 # Runtime config (@lens/config)
│   ├── db/                     # Prisma schema + client + seed (@lens/db)
│   ├── shared-types/           # Re-export layer (dead weight)
│   ├── types/                  # Shared TS interfaces (@lens/types)
│   ├── ui/                     # Scaffolded (empty)
│   └── utils/                  # cn, clamp, format (@lens/utils)
├── Dockerfile                  # Multi-stage build
├── railway.json                # Railway deployment config
├── turbo.json                  # Turborepo config
└── package.json                # npm workspaces root
```

---

## 3. تشغيل السيرفر محليًا

### 3.1. PostgreSQL (يدوي أو Docker)
```powershell
docker run -d --name pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
```

### 3.2. تشغيل Backend
```powershell
npm run dev:api
```
- البورت: `3000` (قابل للتغيير عبر `PORT` في `.env`)
- الـ URL: `http://localhost:3000`
- الفحص: `http://localhost:3000/health`

### 3.3. تشغيل Frontend
```powershell
npm run dev:fe
```
- البورت: `5173` (Vite default)
- الـ URL: `http://localhost:5173`

### 3.4. المتغيرات البيئية (`apps/api/.env` أو `.env.example`)
```env
DATABASE_URL=postgresql://user:password@host:5432/db
JWT_SECRET=change-me-to-a-random-64-char-hex-string
PORT=3000
NODE_ENV=development
HOST=0.0.0.0
LOG_LEVEL=info
CORS_ORIGINS=http://localhost:5173
VITE_API_URL=http://localhost:3000
```

### 3.5. إعداد قاعدة البيانات أول مرة
```powershell
npm install
npx prisma db push
npx prisma db seed
```

---

## 4. أنواع المصادقة (Authentication)

النظام يدعم طريقتين للمصادقة:

| النوع | الطريقة | الوصف |
|-------|---------|-------|
| **JWT** | `Authorization: Bearer <token>` | للمستخدمين — صلاحية 7 أيام |
| **API Key** | `x-api-key: <key>` | للـ Widget والتكاملات الخارجية |

### Middleware (`apps/api/src/auth/auth.middleware.ts`)
- يتحقق من `Bearer <token>` في `Authorization` header أو `x-api-key`
- يستخرج `tenantId` ويضيفه إلى `request`
- لا يوجد RBAC حاليًا — أي مستخدم موثّق له صلاحية كاملة
- ليس هناك Refresh Token حاليًا

### Endpoints الخاصة بالمصادقة
| الطريقة | المسار | المصادقة | الوصف |
|---------|--------|----------|-------|
| POST | `/auth/register` | عام | تسجيل تاجر جديد |
| POST | `/auth/login` | عام | تسجيل دخول وإرجاع JWT |
| GET | `/auth/profile` | مطلوبة | بيانات التاجر |
| PATCH | `/auth/profile` | مطلوبة | تعديل الاسم |
| PATCH | `/auth/password` | مطلوبة | تغيير كلمة المرور |
| POST | `/auth/regenerate-key` | مطلوبة | إعادة توليد API Key |

---

## 5. خريطة الـ Endpoints

### 5.1. Admin — البنوك (`/admin/banks`)
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/admin/banks` | قائمة البنوك |
| POST | `/admin/banks` | إضافة بنك |
| PATCH | `/admin/banks/:id` | تعديل بنك |
| DELETE | `/admin/banks/:id` | حذف بنك |

### 5.2. Admin — البرامج (`/admin/programs`)
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/admin/programs` | قائمة برامج التمويل |
| POST | `/admin/programs` | إضافة برنامج |
| PATCH | `/admin/programs/:id` | تعديل برنامج |
| DELETE | `/admin/programs/:id` | حذف برنامج |

### 5.3. Admin — القواعد (`/admin/rules`)
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/admin/rules/:programId` | قواعد برنامج معين |
| POST | `/admin/rules` | إضافة قاعدة |
| PATCH | `/admin/rules/:id` | تعديل قاعدة |
| DELETE | `/admin/rules/:id` | حذف قاعدة |

### 5.4. Admin — العملاء (`/admin/customers`)
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/admin/customers` | قائمة العملاء |
| GET | `/admin/customers/:id` | عميل واحد |
| POST | `/admin/customers` | إضافة عميل |
| PATCH | `/admin/customers/:id` | تعديل عميل |
| DELETE | `/admin/customers/:id` | حذف عميل |

### 5.5. Admin — المركبات (`/admin/vehicles`)
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/admin/vehicles` | قائمة المركبات |
| GET | `/admin/vehicles/:id` | مركبة واحدة |
| POST | `/admin/vehicles` | إضافة مركبة |
| PATCH | `/admin/vehicles/:id` | تعديل مركبة |
| DELETE | `/admin/vehicles/:id` | حذف مركبة |

### 5.6. Admin — الطلبات (`/admin/applications`)
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/admin/applications` | قائمة الطلبات |
| POST | `/admin/applications` | إضافة طلب |
| PATCH | `/admin/applications/:id/status` | تغيير حالة الطلب |

### 5.7. التقييم والعروض
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| POST | `/evaluate` | تقييم طلب (محرك العروض) |
| POST | `/optimize` | تحسين احتمالية الموافقة |
| GET | `/health` | فحص صحة السيرفر |

### 5.8. الـ Public API
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/public/vehicles/:code` | مركبات التاجر (عن طريق API Key) |
| POST | `/public/apply` | تقديم طلب تمويل من نموذج عام |

---

## 6. شكل الردود

### نجاح (مع بيانات):
```json
{
  "success": true,
  "data": { ... }
}
```

### نجاح (بدون بيانات):
```json
{
  "success": true
}
```

### خطأ:
```json
{
  "success": false,
  "message": "وصف الخطأ"
}
```

### أخطاء شائعة
| كود HTTP | المعنى |
|----------|--------|
| 200 | نجاح |
| 201 | تم الإنشاء |
| 400 | خطأ في الإدخال (Validation) |
| 401 | غير مصرح (Unauthorized) |
| 404 | غير موجود |
| 429 | تم تجاوز حد الطلبات (Rate Limited) |
| 500 | خطأ داخلي في السيرفر |

---

## 7. محرك التقييم (Engine)

### 7.1. خط سير التقييم
```
POST /evaluate { application_id }
  ↓
getApplication() ← يجلب الطلب + العميل + المركبة
  ↓
applicationToInput() ← يشتق المدخلات (age, salary, dti, etc.)
  ↓
getPrograms() ← يجلب برامج التمويل النشطة
  ↓
compareOffers(application, programs)
  ├── لكل برنامج:
  │   ├── policyEngine(program, input) ← يتأكد من الأهلية
  │   ├── loanCalculator() ← يحسب القسط والفائدة
  │   ├── scoring() ← يحسب riskScore, affordabilityScore
  │   ├── eligibility() ← يحسب approvalProbability
  │   └── ruleEvaluator() ← يطبق القواعد المخصصة
  │
  └── rankOffers() ← يرتب العروض حسب الأفضلية
  ↓
يُرجع bestOffer + all offers
```

### 7.2. الـ Optimizer
`POST /optimize` يأخذ بارامترات التمويل ويُجرب:
- **زيادة الدفعة الأولى** (25%, 30%, 35%, 40%, 50%)
- **تمديد المدة** (60, 72, 84 شهر)
- **برنامج تمويل مختلف**
ثم يرجع الاقتراحات مرتبة حسب التأثير (HIGH/MEDIUM)

---

## 8. دليل Flutter API Client

### 8.1. المصادقة — تسجيل الدخول

```dart
class AuthService {
  final String baseUrl = 'http://localhost:3000';

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body)['data'];
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Login failed');
    }
  }
}
```

### 8.2. التخزين الآمن للتوكين

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenManager {
  final _storage = FlutterSecureStorage();

  Future<void> saveToken(String token) async {
    await _storage.write(key: 'access_token', value: token);
  }

  Future<String?> getAccessToken() async {
    return await _storage.read(key: 'access_token');
  }

  Future<void> clearToken() async {
    await _storage.deleteAll();
  }
}
```

### 8.3. HTTP Client مع إعادة المحاولة

```dart
class ApiClient {
  final http.Client _client = http.Client();
  final TokenManager _tokenManager = TokenManager();
  final String baseUrl = 'http://localhost:3000';
  int _retryCount = 0;
  static const int maxRetries = 1;

  Future<Map<String, dynamic>> get(String path) async {
    return _request('GET', path);
  }

  Future<Map<String, dynamic>> post(String path,
      {Map<String, dynamic>? body}) async {
    return _request('POST', path, body: body);
  }

  Future<Map<String, dynamic>> patch(String path,
      {Map<String, dynamic>? body}) async {
    return _request('PATCH', path, body: body);
  }

  Future<Map<String, dynamic>> delete(String path) async {
    return _request('DELETE', path);
  }

  Future<Map<String, dynamic>> _request(String method, String path,
      {Map<String, dynamic>? body}) async {
    final token = await _tokenManager.getAccessToken();
    final uri = Uri.parse('$baseUrl$path');

    http.Response response;

    if (method == 'GET') {
      response = await _client.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );
    } else {
      response = await _client.send(
        http.Request(method, uri)
          ..headers['Content-Type'] = 'application/json'
          ..headers['Authorization'] = 'Bearer $token'
          ..body = body != null ? jsonEncode(body) : '',
      ).then((r) => http.Response.fromStream(r));
    }

    if (response.statusCode == 401 && _retryCount < maxRetries) {
      _retryCount++;
      await _tokenManager.clearToken();
      throw Exception('Session expired — please login again');
    }

    _retryCount = 0;
    final decoded = jsonDecode(response.body);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return decoded;
    } else {
      throw ApiException(
        statusCode: response.statusCode,
        message: decoded['message'] ?? 'Unknown error',
      );
    }
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;
  ApiException({required this.statusCode, required this.message});
  @override
  String toString() => 'ApiException($statusCode): $message';
}
```

### 8.4. مثال — جلب البنوك

```dart
class BankService {
  final ApiClient _client = ApiClient();

  Future<List<Bank>> getBanks() async {
    final response = await _client.get('/admin/banks');
    final items = response['data'] as List;
    return items.map((item) => Bank.fromJson(item)).toList();
  }
}

class Bank {
  final int id;
  final String name;
  final String code;
  final bool active;

  Bank({required this.id, required this.name, required this.code, required this.active});

  factory Bank.fromJson(Map<String, dynamic> json) {
    return Bank(
      id: json['id'],
      name: json['name'],
      code: json['code'],
      active: json['active'] ?? true,
    );
  }
}
```

### 8.5. مثال — تقييم طلب

```dart
Future<EvaluationResult> evaluateApplication(int applicationId) async {
  final response = await _client.post('/evaluate', body: {
    'application_id': applicationId,
  });
  return EvaluationResult.fromJson(response['data']);
}

class EvaluationResult {
  final Offer bestOffer;
  final List<Offer> offers;

  EvaluationResult({required this.bestOffer, required this.offers});

  factory EvaluationResult.fromJson(Map<String, dynamic> json) {
    return EvaluationResult(
      bestOffer: Offer.fromJson(json['bestOffer']),
      offers: (json['offers'] as List).map((e) => Offer.fromJson(e)).toList(),
    );
  }
}

class Offer {
  final int programId;
  final String programName;
  final String status;
  final double installment;
  final double totalPayment;
  final double interestRate;
  final int months;
  final int approvalProbability;

  Offer.fromJson(Map<String, dynamic> json)
      : programId = json['programId'],
        programName = json['programName'],
        status = json['status'],
        installment = (json['installment'] as num).toDouble(),
        totalPayment = (json['totalPayment'] as num).toDouble(),
        interestRate = (json['interestRate'] as num).toDouble(),
        months = json['months'],
        approvalProbability = json['approvalProbability'];
}
```

---

## 9. قواعد دومين حرجة

### 9.1. نماذج قاعدة البيانات (Prisma Schema)

| النموذج | الجدول | الحقول الرئيسية |
|---------|--------|----------------|
| Tenant | `tenants` | id, name, email, password_hash, api_key, active |
| Bank | `banks` | id, tenant_id, name, code, logo_url, active |
| Program | `programs` | id, tenant_id, bank_id, name, financing_type, calculation_method, interest_rate, min_salary, max_customer_age, min/max_months, min_down_payment_percent |
| Rule | `rules` | id, tenant_id, program_id, field, operator, value, action |
| Customer | `customers` | id, tenant_id, name, national_id, phone, salary, job_type, current_liabilities |
| Vehicle | `vehicles` | id, tenant_id, brand, model, manufacturing_year, condition, price, category |
| Application | `applications` | id, tenant_id, customer_id, vehicle_id, requested_down_payment, requested_months, payment_method, status |
| Offer | `offers` | id, tenant_id, application_id, program_id, bank_id, installment, total_payment, dti, risk_score, risk_level, affordability_score, reasons (JSON) |

### 9.2. العلاقات الأساسية
```
Tenant (1) ──< Bank (Many)
Tenant (1) ──< Program (Many)
Tenant (1) ──< Customer (Many)
Tenant (1) ──< Vehicle (Many)
Tenant (1) ──< Application (Many)
Bank (1) ──< Program (Many)
Bank (1) ──< Offer (Many)
Program (1) ──< Rule (Many)
Program (1) ──< Offer (Many)
Customer (1) ──< Application (Many)
Vehicle (1) ──< Application (Many)
Application (1) ──< Offer (Many)
```

### 9.3. قيود الحذف
- **لا يمكن حذف Bank إذا مرتبطة بـ Program أو Offer**
- **لا يمكن حذف Program إذا مرتبطة بـ Rule أو Offer**
- **لا يمكن حذف Customer إذا مرتبطة بـ Application**
- **لا يمكن حذف Vehicle إذا مرتبطة بـ Application**

### 9.4. قواعد التخزين
- **كلمات المرور تُخزن مشفرة** (bcrypt, salt rounds = 10)
- **API keys تُخزن مشفرة** في `tenants.api_key`
- **جميع استعلامات قاعدة البيانات** تستخدم parameterized queries (آمنة من SQL injection)
- **معلومات الدفع لا تُخزن** — تُمرر لبوابة الدفع مباشرة (غير مطبق حاليًا)
- **لا يوجد Redis أو MongoDB** حاليًا — كل شيء في PostgreSQL

---

## 10. تشيك لست أول يوم

### 🔴 Emergency — لو السيرفر مش شغال
- [ ] `docker run -d --name pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16` — قاعدة البيانات
- [ ] `npm install` — تأكد من وجود `node_modules`
- [ ] `npx prisma db push` — إنشاء الجداول
- [ ] `npm run dev:api` — شغل الباك
- [ ] اختبر `http://localhost:3000/health` في المتصفح

### 🔵 التأكد من الإعدادات
- [ ] `.env.example` نُسخ إلى `apps/api/.env` ومكتمل
- [ ] `DATABASE_URL` يشير إلى PostgreSQL المحلي
- [ ] `JWT_SECRET` قوي وغير `change-me-to-...`
- [ ] ميناء 3000 مش مأخوذ

### 🟢 فحص الـ Endpoints الأساسية
- [ ] `GET /health` ← `{ "status": "ok", "db": "connected" }`
- [ ] `POST /auth/login` ← توكين JWT
- [ ] `GET /admin/banks` مع التوكين ← قائمة
- [ ] `GET /admin/programs` مع التوكين ← قائمة
- [ ] `GET /admin/customers` مع التوكين ← قائمة

### 🟡 أدوات مفيدة
- **DB Browser**: `npx prisma studio`
- **API Testing**: Postman, `curl`, أو `http://localhost:3000` مباشرة
- **Frontend**: `http://localhost:5173`
