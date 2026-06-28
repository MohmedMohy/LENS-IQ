import type { FastifyInstance } from "fastify";
import { db } from "../db/db.js";
import { authMiddleware } from "../auth/auth.middleware.js";

export async function applicationFormRoutes(fastify: FastifyInstance) {
    fastify.get(
        "/application/:id/form",
        { preHandler: authMiddleware },
        async (req, reply) => {
            try {
                const tenantId = req.tenantId;
                const { id } = req.params as { id: string };
                const applicationId = Number(id);

                const result = await db.query(
                    `SELECT a.*,
                     c.name AS customer_name, c.national_id, c.phone, c.birth_date,
                     c.salary, c.job_type, c.current_liabilities, c.additional_income,
                     c.employer_name, c.employment_tenure_months, c.insurance_number,
                     c.club_membership, c.marital_status, c.owns_property, c.owns_car,
                     c.salary_transfer, c.tax_card, c.commercial_registry,
                     v.brand, v.model, v.manufacturing_year, v.condition, v.price, v.category,
                     b.name AS bank_name
                     FROM applications a
                     JOIN customers c ON a.customer_id = c.id
                     JOIN vehicles v ON a.vehicle_id = v.id
                     LEFT JOIN LATERAL (
                       SELECT fs.bank_name AS name FROM financier_submissions fs
                       WHERE fs.application_id = a.id AND fs.tenant_id = a.tenant_id
                       ORDER BY fs.id DESC LIMIT 1
                     ) b ON true
                     WHERE a.id = $1 AND a.tenant_id = $2`,
                    [applicationId, tenantId]
                );

                const row = result.rows[0];
                if (!row) {
                    return reply.status(404).send({ success: false, message: "Application not found" });
                }

                const downPct = row.price > 0 ? Math.round((row.requested_down_payment / row.price) * 100) : 0;
                const financeAmount = row.price - row.requested_down_payment;
                const monthlyInstallment = financeAmount > 0 && row.requested_months > 0
                    ? (financeAmount / row.requested_months) * 1.1
                    : 0;

                const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>نموذج طلب تمويل - ${row.customer_name}</title>
<style>
  @page { margin: 1.5cm; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Arial', 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; direction: rtl; padding: 20px; color: #222; }
  .form-container { max-width: 210mm; margin: 0 auto; background: #fff; padding: 30px 35px; box-shadow: 0 2px 15px rgba(0,0,0,0.1); border-radius: 4px; }
  .header { text-align: center; border-bottom: 3px double #1a365d; padding-bottom: 20px; margin-bottom: 25px; }
  .header h1 { font-size: 22px; color: #1a365d; margin-bottom: 5px; letter-spacing: 1px; }
  .header h2 { font-size: 16px; color: #2d3748; font-weight: normal; }
  .header .form-number { font-size: 12px; color: #718096; margin-top: 8px; }
  .section { margin-bottom: 22px; }
  .section-title { background: #1a365d; color: #fff; padding: 7px 14px; font-size: 14px; font-weight: bold; border-radius: 3px; margin-bottom: 12px; }
  .field-group { display: flex; flex-wrap: wrap; gap: 10px 25px; margin-bottom: 8px; padding: 8px 0; border-bottom: 1px dotted #e2e8f0; }
  .field { flex: 1 1 200px; }
  .field label { display: block; font-size: 11px; color: #718096; margin-bottom: 2px; font-weight: bold; }
  .field .value { font-size: 14px; color: #1a202c; font-weight: 600; }
  .field .value.rtl { text-align: right; }
  .field .value.ltr { direction: ltr; text-align: left; }
  .two-col { display: flex; flex-wrap: wrap; gap: 10px; }
  .two-col .field { flex: 1 1 45%; }
  .declaration { background: #f7fafc; border: 1px solid #e2e8f0; border-right: 4px solid #1a365d; padding: 16px; border-radius: 3px; margin-bottom: 20px; font-size: 13px; line-height: 1.8; }
  .declaration p { margin-bottom: 8px; }
  .signature-section { display: flex; flex-wrap: wrap; gap: 30px; margin-top: 25px; padding-top: 20px; border-top: 2px solid #e2e8f0; }
  .signature-box { flex: 1; min-width: 200px; }
  .signature-box h4 { font-size: 13px; color: #4a5568; margin-bottom: 8px; }
  .signature-line { border-bottom: 1px solid #a0aec0; height: 40px; margin-bottom: 5px; }
  .signature-box p { font-size: 11px; color: #a0aec0; }
  .bank-use { background: #fffbeb; border: 1px solid #f6e05e; border-right: 4px solid #d69e2e; padding: 16px; margin-top: 20px; border-radius: 3px; }
  .bank-use h4 { font-size: 13px; color: #744210; margin-bottom: 8px; }
  .bank-use p { font-size: 12px; color: #744210; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
  .badge-approved { background: #c6f6d5; color: #22543d; }
  .badge-pending { background: #fefcbf; color: #744210; }
  .badge-rejected { background: #fed7d7; color: #742a2a; }
  .footer-note { text-align: center; font-size: 10px; color: #a0aec0; margin-top: 25px; padding-top: 12px; border-top: 1px solid #e2e8f0; }
  @media print {
    body { background: #fff; padding: 0; }
    .form-container { box-shadow: none; padding: 20px 25px; }
    .no-print { display: none; }
  }
  .no-print { text-align: center; margin-bottom: 15px; }
  .no-print button { background: #1a365d; color: #fff; border: none; padding: 10px 30px; font-size: 14px; border-radius: 4px; cursor: pointer; }
  .no-print button:hover { background: #2a4a7f; }
</style>
</head>
<body>
<div class="no-print">
  <button onclick="window.print()">طباعة / حفظ PDF</button>
</div>

<div class="form-container" id="form-to-print">
  <div class="header">
    <h1>نموذج طلب تمويل</h1>
    <h2>Financing Application Form</h2>
    <p class="form-number">رقم الطلب: #${String(applicationId).padStart(6, "0")} | تاريخ التقديم: ${new Date(row.created_at || row.updated_at).toLocaleDateString("ar-EG")}</p>
  </div>

  <div class="section">
    <div class="section-title">أولاً: بيانات العميل / Customer Data</div>
    <div class="two-col">
      <div class="field"><label>الاسم الرباعي</label><div class="value">${row.customer_name || "—"}</div></div>
      <div class="field"><label>الرقم القومي</label><div class="value ltr">${row.national_id || "—"}</div></div>
    </div>
    <div class="two-col">
      <div class="field"><label>رقم الهاتف</label><div class="value ltr">${row.phone || "—"}</div></div>
      <div class="field"><label>تاريخ الميلاد</label><div class="value">${row.birth_date ? new Date(row.birth_date).toLocaleDateString("ar-EG") : "—"}</div></div>
    </div>
    <div class="two-col">
      <div class="field"><label>الحالة الاجتماعية</label><div class="value">${row.marital_status === "married" ? "متزوج" : row.marital_status === "single" ? "أعزب" : row.marital_status === "divorced" ? "مطلق" : row.marital_status === "widowed" ? "أرمل" : "—"}</div></div>
      <div class="field"><label>جهة العمل</label><div class="value">${row.employer_name || "—"}</div></div>
    </div>
    <div class="two-col">
      <div class="field"><label>نوع الوظيفة</label><div class="value">${row.job_type === "government" ? "حكومي" : row.job_type === "private" ? "قطاع خاص" : row.job_type === "corporate" ? "شركات" : row.job_type === "freelancer" ? "عمل حر" : row.job_type === "retired" ? "متقاعد" : row.job_type || "—"}</div></div>
      <div class="field"><label>مدة الخدمة (شهر)</label><div class="value">${row.employment_tenure_months ? row.employment_tenure_months + " شهر" : "—"}</div></div>
    </div>
    <div class="two-col">
      <div class="field"><label>صافي الدخل الشهري</label><div class="value">${Number(row.salary).toLocaleString("en-EG", { maximumFractionDigits: 2 })} ج.م</div></div>
      <div class="field"><label>الالتزامات الشهرية</label><div class="value">${Number(row.current_liabilities || 0).toLocaleString("en-EG", { maximumFractionDigits: 2 })} ج.م</div></div>
    </div>
    <div class="two-col">
      <div class="field"><label>دخل إضافي</label><div class="value">${Number(row.additional_income || 0).toLocaleString("en-EG", { maximumFractionDigits: 2 })} ج.م</div></div>
      <div class="field"><label>تحويل الراتب</label><div class="value">${row.salary_transfer ? "نعم" : "لا"}</div></div>
    </div>
    <div class="two-col">
      <div class="field"><label>يملك عقار</label><div class="value">${row.owns_property ? "نعم" : "لا"}</div></div>
      <div class="field"><label>يملك سيارة</label><div class="value">${row.owns_car ? "نعم" : "لا"}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">ثانياً: بيانات المركبة / Vehicle Data</div>
    <div class="two-col">
      <div class="field"><label>الماركة</label><div class="value">${row.brand || "—"}</div></div>
      <div class="field"><label>الموديل</label><div class="value">${row.model || "—"}</div></div>
    </div>
    <div class="two-col">
      <div class="field"><label>سنة الصنع</label><div class="value">${row.manufacturing_year || "—"}</div></div>
      <div class="field"><label>الفئة</label><div class="value">${row.category === "sedan" ? "سيدان" : row.category === "suv" ? "SUV" : row.category === "truck" ? "نقل" : row.category === "van" ? "فان" : row.category === "microbus" ? "ميكروباص" : "—"}</div></div>
    </div>
    <div class="two-col">
      <div class="field"><label>الحالة</label><div class="value">${row.condition === "new" ? "جديد" : "مستعمل"}</div></div>
      <div class="field"><label>السعر الإجمالي</label><div class="value">${Number(row.price).toLocaleString("en-EG", { maximumFractionDigits: 2 })} ج.م</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">ثالثاً: بيانات التمويل / Financing Data</div>
    <div class="two-col">
      <div class="field"><label>الدفعة المقدمة</label><div class="value">${Number(row.requested_down_payment).toLocaleString("en-EG", { maximumFractionDigits: 2 })} ج.م</div></div>
      <div class="field"><label>نسبة الدفعة المقدمة</label><div class="value">${downPct}%</div></div>
    </div>
    <div class="two-col">
      <div class="field"><label>مبلغ التمويل المطلوب</label><div class="value" style="color:#1a365d;font-weight:700;">${Math.round(financeAmount).toLocaleString("en-EG")} ج.م</div></div>
      <div class="field"><label>المدة المطلوبة</label><div class="value">${row.requested_months || "—"} شهر</div></div>
    </div>
    <div class="two-col">
      <div class="field"><label>القسط الشهري التقريبي</label><div class="value" style="color:#2d3748;">${Math.round(monthlyInstallment).toLocaleString("en-EG")} ج.م</div></div>
      <div class="field"><label>طريقة السداد</label><div class="value">${row.payment_method === "salary_transfer" ? "تحويل راتب" : row.payment_method === "bank_account" ? "حساب بنكي" : "إثبات دخل"}</div></div>
    </div>
    ${row.bank_name ? `<div class="two-col"><div class="field"><label>البنك</label><div class="value">${row.bank_name}</div></div></div>` : ""}
  </div>

  <div class="declaration">
    <p><strong>التعهد والإقرار:</strong></p>
    <p>أقر أنا الموقع أدناه بأن جميع البيانات الواردة في هذا النموذج صحيحة وكاملة، وأتحمل المسؤولية القانونية عن أي بيانات غير صحيحة. كما أفوض الجهة الممولة بالاستعلام عن بياناتي الائتمانية من مكتب الاستعلام الائتماني (I-Score) والجهات المعنية الأخرى.</p>
    <p>أتعهد بسداد الأقساط الشهرية في مواعيدها المحددة، وأوافق على الشروط والأحكام الخاصة ببرنامج التمويل.</p>
  </div>

  <div class="signature-section">
    <div class="signature-box">
      <h4>توقيع العميل</h4>
      <div class="signature-line"></div>
      <p>الاسم: ${row.customer_name || "______________"}</p>
      <p>التاريخ: ___ / ___ / _________</p>
    </div>
    <div class="signature-box">
      <h4>توقيع مندوب المبيعات</h4>
      <div class="signature-line"></div>
      <p>الاسم: ______________</p>
      <p>التاريخ: ___ / ___ / _________</p>
    </div>
    <div class="signature-box">
      <h4>خاتم المعرض</h4>
      <div class="signature-line"></div>
      <p>&nbsp;</p>
    </div>
  </div>

  <div class="bank-use">
    <h4>📋 لاستخدام البنك / Bank Use Only</h4>
    <table style="width:100%;font-size:12px;border-collapse:collapse;margin-top:8px;">
      <tr><td style="padding:4px 0;width:50%;">قرار البنك: □ موافقة □ رفض □ مشروط</td><td style="padding:4px 0;">المبلغ المعتمد: __________ ج.م</td></tr>
      <tr><td style="padding:4px 0;">المدة: ______ شهر</td><td style="padding:4px 0;">نسبة الفائدة: ______%</td></tr>
      <tr><td style="padding:4px 0;" colspan="2">ملاحظات: ________________________________</td></tr>
      <tr><td style="padding:4px 0;" colspan="2">توقيع البنك: __________________ التاريخ: ___ / ___ / _________</td></tr>
    </table>
  </div>

  <div class="footer-note">
    <p>نموذج طلب تمويل — Lens IQ | تم إنشاؤه في ${new Date().toLocaleDateString("ar-EG")} الساعة ${new Date().toLocaleTimeString("ar-EG")}</p>
  </div>
</div>

<script>
  setTimeout(() => { window.print(); }, 500);
</script>
</body>
</html>`;

                return reply.type("text/html; charset=utf-8").send(html);
            } catch (err) {
                fastify.log.error(err);
                return reply.status(500).send({ success: false, message: "Internal Server Error" });
            }
        }
    );
}
