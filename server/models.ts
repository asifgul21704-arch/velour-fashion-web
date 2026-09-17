import mongoose, { Schema, Document } from 'mongoose';

// 1. USER SCHEMA
export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  googleId?: string;
  role: 'user' | 'admin';
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, default: '' },
    avatar: { type: String },
    googleId: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    country: { type: String },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// 2. PRODUCT SCHEMA
export interface IProduct extends Document {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  images: string[];
  category: string;
  subCategory?: string;
  gender: 'women' | 'men' | 'unisex';
  sizes: string[];
  colors: string[];
  stock: number;
  lowStockThreshold: number;
  sku: string;
  brand: string;
  featured: boolean;
  newArrival: boolean;
  isActive: boolean;
  tags: string[];
  weight?: string;
  createdAt: string;
  updatedAt: string;
}

export const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    shortDescription: { type: String },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    images: [{ type: String }],
    category: { type: String, required: true, index: true },
    subCategory: { type: String },
    gender: { type: String, enum: ['women', 'men', 'unisex'], required: true, index: true },
    sizes: [{ type: String }],
    colors: [{ type: String }],
    stock: { type: Number, required: true, default: 0, min: 0, index: true },
    lowStockThreshold: { type: Number, default: 5 },
    sku: { type: String, required: true, unique: true, index: true },
    brand: { type: String, default: 'VELOUR Atelier' },
    featured: { type: Boolean, default: false, index: true },
    newArrival: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    tags: [{ type: String }],
    weight: { type: String },
  },
  { timestamps: true }
);

// 3. CATEGORY SCHEMA
export interface ICategory extends Document {
  id: string;
  name: string;
  slug: string;
  image: string;
  gender: 'women' | 'men' | 'unisex';
  description?: string;
  order: number;
  isActive: boolean;
}

export const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    image: { type: String, required: true },
    gender: { type: String, enum: ['women', 'men', 'unisex'], required: true },
    description: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 4. ORDER SCHEMA
export interface IOrder extends Document {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    image: string;
    size: string;
    color: string;
    quantity: number;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: 'Cash on Delivery' | 'Credit Card' | 'Stripe' | 'Bank Transfer';
  paymentStatus: 'Pending' | 'Processing' | 'Paid' | 'Failed' | 'Refunded';
  orderStatus:
    | 'Pending'
    | 'Confirmed'
    | 'Processing'
    | 'Shipped'
    | 'Out for Delivery'
    | 'Delivered'
    | 'Cancelled'
    | 'Refunded';
  subtotal: number;
  shipping: number;
  discount: number;
  discountCode?: string;
  tax: number;
  total: number;
  notes?: string;
  timeline: Array<{
    status: string;
    note: string;
    timestamp: string;
    updatedBy?: string;
  }>;
  refundAmount?: number;
  refundReason?: string;
  refundDate?: string;
  createdAt: string;
  updatedAt: string;
}

export const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    items: [
      {
        productId: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        image: { type: String },
        size: { type: String },
        color: { type: String },
        quantity: { type: Number, required: true },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ['Cash on Delivery', 'Credit Card', 'Stripe', 'Bank Transfer'],
      default: 'Cash on Delivery',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Processing', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
      index: true,
    },
    orderStatus: {
      type: String,
      enum: [
        'Pending',
        'Confirmed',
        'Processing',
        'Shipped',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
        'Refunded',
      ],
      default: 'Confirmed',
      index: true,
    },
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discountCode: { type: String },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    notes: { type: String },
    timeline: [
      {
        status: { type: String, required: true },
        note: { type: String, required: true },
        timestamp: { type: String, required: true },
        updatedBy: { type: String },
      },
    ],
    refundAmount: { type: Number },
    refundReason: { type: String },
    refundDate: { type: String },
  },
  { timestamps: true }
);

// 5. COUPON SCHEMA
export interface ICoupon extends Document {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrder: number;
  maximumDiscount?: number;
  usageLimit: number;
  usedCount: number;
  expiryDate: string;
  active: boolean;
}

export const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true },
    minimumOrder: { type: Number, default: 0 },
    maximumDiscount: { type: Number },
    usageLimit: { type: Number, default: 100 },
    usedCount: { type: Number, default: 0 },
    expiryDate: { type: String, required: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// 6. REVIEW SCHEMA
export interface IReview extends Document {
  id: string;
  productId: string;
  productName: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const ReviewSchema = new Schema<IReview>(
  {
    productId: { type: String, required: true, index: true },
    productName: { type: String, required: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  },
  { timestamps: true }
);

// 7. INVENTORY TRANSACTION SCHEMA
export interface IInventoryTransaction extends Document {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'received' | 'sold' | 'damaged' | 'returned' | 'adjusted';
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  recordedBy?: string;
  createdAt: string;
}

export const InventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    productId: { type: String, required: true, index: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    type: {
      type: String,
      enum: ['received', 'sold', 'damaged', 'returned', 'adjusted'],
      required: true,
      index: true,
    },
    quantityChange: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    reason: { type: String },
    recordedBy: { type: String },
  },
  { timestamps: true }
);

// 8. PAYMENT RECORD SCHEMA
export interface IPaymentRecord extends Document {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  provider: string;
  status: 'Pending' | 'Processing' | 'Paid' | 'Failed' | 'Refunded';
  transactionRef: string;
  refundAmount?: number;
  refundDate?: string;
  refundReason?: string;
}

export const PaymentRecordSchema = new Schema<IPaymentRecord>(
  {
    orderId: { type: String, required: true, index: true },
    orderNumber: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    provider: { type: String, default: 'Cash on Delivery' },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
      index: true,
    },
    transactionRef: { type: String, required: true },
    refundAmount: { type: Number },
    refundDate: { type: String },
    refundReason: { type: String },
  },
  { timestamps: true }
);

// 9. BANNER SCHEMA
export interface IBanner extends Document {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  buttonText: string;
  buttonUrl: string;
  order: number;
  isActive: boolean;
}

export const BannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    image: { type: String, required: true },
    buttonText: { type: String, default: 'Shop Now' },
    buttonUrl: { type: String, default: '/women' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 10. CONTACT MESSAGE SCHEMA
export interface IContactMessage extends Document {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  replyNotes?: string;
}

export const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: String, required: true },
    status: { type: String, enum: ['new', 'read', 'replied', 'archived'], default: 'new', index: true },
    replyNotes: { type: String },
  },
  { timestamps: true }
);

// 11. ADMIN NOTIFICATION SCHEMA
export interface IAdminNotification extends Document {
  id: string;
  type: 'order' | 'stock' | 'customer' | 'review' | 'payment' | 'message';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export const AdminNotificationSchema = new Schema<IAdminNotification>(
  {
    type: {
      type: String,
      enum: ['order', 'stock', 'customer', 'review', 'payment', 'message'],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
    link: { type: String },
  },
  { timestamps: true }
);

// 12. STORE SETTINGS SCHEMA
export interface IStoreSettings extends Document {
  storeName: string;
  storeLogo?: string;
  storeEmail: string;
  supportEmail: string;
  phone: string;
  whatsapp?: string;
  currency: string;
  timezone: string;
  lowStockThreshold: number;
  standardShippingFee: number;
  freeShippingThreshold: number;
  taxRate: number;
  socialInstagram?: string;
  socialTwitter?: string;
  socialFacebook?: string;
  announcementText?: string;
}

export const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    storeName: { type: String, default: 'VELOUR Fashion' },
    storeLogo: { type: String },
    storeEmail: { type: String, default: 'concierge@velour.com' },
    supportEmail: { type: String, default: 'support@velour.com' },
    phone: { type: String, default: '+1 (800) 835-6871' },
    whatsapp: { type: String, default: '+1 (800) 835-6871' },
    currency: { type: String, default: 'USD' },
    timezone: { type: String, default: 'America/New_York' },
    lowStockThreshold: { type: Number, default: 5 },
    standardShippingFee: { type: Number, default: 25 },
    freeShippingThreshold: { type: Number, default: 250 },
    taxRate: { type: Number, default: 0.08 },
    socialInstagram: { type: String, default: 'https://instagram.com/velour' },
    socialTwitter: { type: String, default: 'https://twitter.com/velour' },
    socialFacebook: { type: String, default: 'https://facebook.com/velour' },
    announcementText: { type: String, default: 'Complimentary white-glove courier shipping on orders over $250' },
  },
  { timestamps: true }
);

// 13. AUDIT LOG SCHEMA
export interface IAuditLog extends Document {
  id: string;
  adminId: string;
  adminEmail: string;
  adminName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  timestamp: string;
  ip?: string;
}

export const AuditLogSchema = new Schema<IAuditLog>(
  {
    adminId: { type: String, required: true },
    adminEmail: { type: String, required: true },
    adminName: { type: String, required: true },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true, index: true },
    resourceId: { type: String },
    details: { type: String },
    timestamp: { type: String, required: true },
    ip: { type: String },
  },
  { timestamps: true }
);

// Models
export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const ProductModel = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
export const CategoryModel = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
export const OrderModel = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export const CouponModel = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
export const ReviewModel = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
export const InventoryTransactionModel =
  mongoose.models.InventoryTransaction ||
  mongoose.model<IInventoryTransaction>('InventoryTransaction', InventoryTransactionSchema);
export const PaymentRecordModel =
  mongoose.models.PaymentRecord || mongoose.model<IPaymentRecord>('PaymentRecord', PaymentRecordSchema);
export const BannerModel = mongoose.models.Banner || mongoose.model<IBanner>('Banner', BannerSchema);
export const ContactMessageModel =
  mongoose.models.ContactMessage || mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema);
export const AdminNotificationModel =
  mongoose.models.AdminNotification ||
  mongoose.model<IAdminNotification>('AdminNotification', AdminNotificationSchema);
export const StoreSettingsModel =
  mongoose.models.StoreSettings || mongoose.model<IStoreSettings>('StoreSettings', StoreSettingsSchema);
export const AuditLogModel = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
