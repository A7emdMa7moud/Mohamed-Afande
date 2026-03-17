module.exports = {
  // عامة
  SUCCESS: "تمت العملية بنجاح",
  INVALID_ID: "الرقم اللي بعتّه مش صحيح",
  NOT_FOUND: "الطلب ده مش موجود",
  UNAUTHORIZED: "سجل دخول الأول لو سمحت",
  MISSING_FIELDS: "في بيانات ناقصة",
  SERVER_ERROR: "حصل مشكلة في السيرفر، حاول تاني بعد شوية",
  VALIDATION_FAILED: "البيانات اللي بعتها مش مظبوطة",

  // المصادقة
  LOGIN_FAILED: "الإيميل أو الباسورد مش صح",
  LOGIN_SUCCESS: "تم تسجيل الدخول بنجاح",
  REGISTER_SUCCESS: "تم إنشاء الحساب بنجاح",
  USER_ALREADY_EXISTS: "في مستخدم بالإيميل ده قبل كده",
  TOKEN_EXPIRED: "الجلسة انتهت، سجل دخول تاني",
  TOKEN_INVALID: "الجلسة انتهت، سجل دخول تاني",
  NOT_AUTHORIZED: "سجل دخول الأول لو سمحت",
  USER_NOT_FOUND: "المستخدم ده مش موجود",
  FORBIDDEN: "مش عندك صلاحية تعمل كده",

  // الحد من الطلبات
  TOO_MANY_REQUESTS: "طلبات كتير أوي، حاول تاني بعد شوية",
  TOO_MANY_LOGIN_ATTEMPTS: "محاولات دخول كتير، حاول تاني بعد شوية",

  // فئات ونماذج ومنتجات
  CATEGORY_NOT_FOUND: "التصنيف ده مش موجود",
  MODEL_NOT_FOUND: "الموديل ده مش موجود",
  PRODUCT_NOT_FOUND: "المنتج ده مش موجود",
  CATEGORY_CREATED: "التصنيف اتضاف بنجاح",
  CATEGORY_UPDATED: "تم تعديل التصنيف",
  CATEGORY_DELETED: "التصنيف اتحذف",
  MODEL_CREATED: "الموديل اتضاف بنجاح",
  MODEL_DELETED: "الموديل اتحذف",
  PRODUCT_CREATED: "المنتج اتضاف بنجاح",
  PRODUCT_UPDATED: "تم تعديل بيانات المنتج",
  PRODUCT_DELETED: "المنتج اتحذف",

  // المخزون
  STOCK_MOVEMENT_NOT_FOUND: "حركة المخزون دي مش موجودة",
  STOCK_ADDED: "الكمية اتضافت للمخزن",
  STOCK_ADJUSTED: "تم تعديل الكمية في المخزن",
  INSUFFICIENT_STOCK: "الكمية في المخزن مش كفاية",
  insufficientStockWithQty: (available) =>
    `الكمية في المخزن مش كفاية. المتاح: ${available}`,
  insufficientStockForProduct: (name, available, requested) =>
    `الكمية في المخزن مش كفاية لـ ${name}. المتاح: ${available}، المطلوب: ${requested}`,

  // الفواتير
  INVOICE_NOT_FOUND: "الفاتورة دي مش موجودة",
  INVOICE_CREATED: "الفاتورة اتعملت بنجاح",
  INVOICE_DELETED: "الفاتورة اتحذفت",
  INVOICE_MUST_HAVE_ITEMS: "الفاتورة لازم يكون فيها منتج واحد على الأقل",
  productNotFoundInInvoice: (productId) =>
    `المنتج ${productId} مش موجود`,

  // التقارير والداشبورد
  INVALID_YEAR_MONTH: "السنة أو الشهر مش صح",
  NO_DATA_AVAILABLE: "مفيش بيانات لعرضها",
  DASHBOARD_LOADED: "تم تحميل بيانات لوحة التحكم",
};
