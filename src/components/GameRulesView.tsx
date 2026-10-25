import React from 'react';
import { ShieldCheck, Smartphone, Trophy, Coins, CheckCircle, FileText } from 'lucide-react';

export const GameRulesView: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 text-neutral-100">
      {/* Title Hero */}
      <div className="bg-neutral-900 border border-amber-900/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>نظام الضمان والرهان النزيه</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            كيف تعمل غرف دومينو كاش عبر فودافون كاش؟
          </h2>
          <p className="text-xs text-neutral-300 leading-relaxed max-w-2xl">
            منظومة متكاملة لربط الأصدقاء في مباريات دومينو حقيقية تنافسية، حيث يقوم المنظم بدور الوسيط الضامن للمبلغ المالي، ويتولى تحويل الجائزة للفائز فور انتهاء المباراة.
          </p>
        </div>
      </div>

      {/* 4 Step Process Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1 */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center font-mono text-sm">
              01
            </span>
            <h3 className="font-bold text-base text-white">
              إنشاء الغرفة وتحديد المحفظة
            </h3>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            يقوم صاحب الغرفة (المنظم) بإدخال رقم محفظة فودافون كاش الخاصة به التي ستستقبل التحويلات، وتحديد قيمة الرهان المتفق عليها لكل لاعب، وتعيين رقم سري للمباراة.
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center font-mono text-sm">
              02
            </span>
            <h3 className="font-bold text-base text-white">
              تسجيل اللاعبين بالرقم السري
            </h3>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            يشارك المنظم الرابط مع صديقه. عند النقر على الرابط، يكتب الزميل الرقم السري ويسجل اسمه ورقم هاتفه المسجل على فودافون كاش لاستلام الأرباح.
          </p>
        </div>

        {/* Step 3 */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 font-bold flex items-center justify-center font-mono text-sm">
              03
            </span>
            <h3 className="font-bold text-base text-white">
              التحويل والاعتماد قبل اللعب
            </h3>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            يقوم الطرفان بتحويل رسوم الرهان عبر كود فودافون كاش المباشر للمنظم. تظل طاولة الدومينو مقفلة وتفتح تلقائياً فور اعتماد صاحب الغرفة للاستلام لضمان النزاهة.
          </p>
        </div>

        {/* Step 4 */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center font-mono text-sm">
              04
            </span>
            <h3 className="font-bold text-base text-white">
              حسم الفائز وتحويل الجائزة
            </h3>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            يتابع المنظم المباراة مباشرة عبر لوحة التحكم. فور إعلان الفائز بالدومينو، يظهر رقم محفظة الفائز مع كود تحويل سريع، ليقوم المنظم بتحويل كامل الجائزة فوراً.
          </p>
        </div>
      </div>

      {/* Domino Rules Box */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <FileText className="w-4 h-4 text-amber-400" />
          <span>قواعد لعبة الدومينو المصرية المعتمدة في المنصة:</span>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-neutral-300">
          <li className="flex items-start gap-2 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/80">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>28 قطعة عظم:</strong> من الدبل صفر (البلاطة) إلى الدبل ستة (الدوك)، 7 قطع لكل لاعب و14 بالشكارة.</span>
          </li>
          <li className="flex items-start gap-2 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/80">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>البداية:</strong> صاحب أعلى قطعة دبل يبدأ أولاً بإنزالها على الطاولة كافتتاح للمباراة.</span>
          </li>
          <li className="flex items-start gap-2 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/80">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>السحب والباص:</strong> إذا لم يتوفر رقم مطابق لأطراف الطاولة، يسحب اللاعب من الشكارة حتى يجد، أو يقول "باص" إذا فرغت الشكارة.</span>
          </li>
          <li className="flex items-start gap-2 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/80">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>القفلة والسد:</strong> عند انسداد الطاولة بدون حركات للطرفين، تحسب نقاط القطع المتبقية، واللاعب صاحب أقل مجموع نقاط يكسب الجولة.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
