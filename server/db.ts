import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import {
  UserModel,
  ProductModel,
  CategoryModel,
  OrderModel,
  CouponModel,
  ReviewModel,
  InventoryTransactionModel,
  PaymentRecordModel,
  BannerModel,
  ContactMessageModel,
  AdminNotificationModel,
  StoreSettingsModel,
  AuditLogModel,
} from './models.js';

// ==========================================
// INTERFACES & SCHEMAS
// ==========================================

export interface DbUser {
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

export interface DbProduct {
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
  tags?: string[];
  weight?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbCartItem {
  productId: string;
  name: string;
  price: number;
  salePrice?: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  stock: number;
}

export interface DbCart {
  userId: string;
  items: DbCartItem[];
  updatedAt: string;
}

export interface DbWishlistItem {
  productId: string;
  addedAt: string;
}

export interface DbWishlist {
  userId: string;
  items: DbWishlistItem[];
  updatedAt: string;
}

export interface DbOrderItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
}

export interface DbOrderTimelineItem {
  status: string;
  note: string;
  timestamp: string;
  updatedBy?: string;
}

export interface DbOrder {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: DbOrderItem[];
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
  timeline: DbOrderTimelineItem[];
  refundAmount?: number;
  refundReason?: string;
  refundDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  image: string;
  gender: 'women' | 'men' | 'unisex';
  description?: string;
  order: number;
  isActive: boolean;
}

export interface DbCoupon {
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
  createdAt: string;
  updatedAt: string;
}

export interface DbReview {
  id: string;
  productId: string;
  productName: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface DbInventoryTransaction {
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

export interface DbPaymentRecord {
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
  createdAt: string;
  refundAmount?: number;
  refundDate?: string;
  refundReason?: string;
}

export interface DbBanner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  buttonText: string;
  buttonUrl: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DbContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  replyNotes?: string;
  createdAt: string;
}

export interface DbAdminNotification {
  id: string;
  type: 'order' | 'stock' | 'customer' | 'review' | 'payment' | 'message';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface DbStoreSettings {
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
  updatedAt?: string;
}

export interface DbAuditLog {
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

export interface DbNewsletter {
  id: string;
  email: string;
  subscribedAt: string;
}

export interface DatabaseSchema {
  users: DbUser[];
  products: DbProduct[];
  carts: DbCart[];
  wishlists: DbWishlist[];
  orders: DbOrder[];
  categories: DbCategory[];
  newsletter: DbNewsletter[];
  coupons: DbCoupon[];
  reviews: DbReview[];
  inventoryTransactions: DbInventoryTransaction[];
  payments: DbPaymentRecord[];
  banners: DbBanner[];
  contactMessages: DbContactMessage[];
  notifications: DbAdminNotification[];
  storeSettings: DbStoreSettings;
  auditLogs: DbAuditLog[];
}

// Detect serverless environment (e.g. Vercel, AWS Lambda) where process.cwd() is read-only
const isServerlessEnv = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isServerlessEnv ? path.join('/tmp', 'velour-data') : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'velour-store.json');
const SEED_FILE = path.join(process.cwd(), 'data', 'velour-store.json');

// Ensure data folder exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  // Non-fatal if filesystem is restricted
}

// Default Categories
const DEFAULT_CATEGORIES: DbCategory[] = [
  { id: 'cat-1', name: 'Dresses', slug: 'dresses', gender: 'women', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80', description: 'Architectural silhouettes, silk bias gowns and tailored evening wear.', order: 1, isActive: true },
  { id: 'cat-2', name: 'Coats & Jackets', slug: 'jackets', gender: 'women', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80', description: 'Cashmere trenches, sculptural blazers and virgin wool wraps.', order: 2, isActive: true },
  { id: 'cat-3', name: 'Tops & Knitwear', slug: 'tops', gender: 'women', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80', description: 'Fine-gauge merino, gossamer silk organza and heavyweight cotton.', order: 3, isActive: true },
  { id: 'cat-4', name: 'Trousers & Skirts', slug: 'trousers', gender: 'women', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80', description: 'Pleated wide-leg tailoring, accordion midi skirts and selvedge denim.', order: 4, isActive: true },
  { id: 'cat-5', name: 'Suits & Tailoring', slug: 'jackets', gender: 'men', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80', description: 'Deconstructed Italian wool blazers, tuxedo jackets and relaxed suits.', order: 5, isActive: true },
  { id: 'cat-6', name: 'Shirts', slug: 'shirts', gender: 'men', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80', description: 'Two-ply Egyptian Giza poplin shirts and washed French linen.', order: 6, isActive: true },
  { id: 'cat-7', name: 'Knitwear & Sweaters', slug: 'hoodies', gender: 'men', image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&q=80', description: 'Grade-A Mongolian cashmere sweaters and heavyweight French Terry.', order: 7, isActive: true },
  { id: 'cat-8', name: 'Trousers & Denim', slug: 'jeans', gender: 'men', image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=800&q=80', description: 'Okayama selvedge denim, pleated tapered trousers and wool slacks.', order: 8, isActive: true },
  { id: 'cat-9', name: 'Accessories', slug: 'accessories', gender: 'unisex', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80', description: 'Florentine leather totes, calfskin Chelsea boots and silk scarves.', order: 9, isActive: true },
];

// Initial products
const INITIAL_PRODUCTS: DbProduct[] = [
  {
    id: 'prod-w-01',
    name: 'Sateen Bias-Cut Evening Gown',
    slug: 'sateen-bias-cut-evening-gown',
    description: 'An architectural evening silhouette cut on the bias from double-faced silk sateen. Features a graceful cowl neckline, fluid drape, and clean invisible finish.',
    shortDescription: 'Double-faced silk sateen gown with cowl drape neckline.',
    price: 340,
    salePrice: 290,
    images: [
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1200&q=85',
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1200&q=85'
    ],
    category: 'Dresses',
    gender: 'women',
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Noir Black', 'Champagne', 'Bordeaux'],
    stock: 14,
    lowStockThreshold: 5,
    sku: 'VEL-W-DRS-01',
    brand: 'VELOUR Atelier',
    featured: true,
    newArrival: true,
    isActive: true,
    tags: ['evening', 'silk', 'gown'],
    weight: '0.6 kg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-w-02',
    name: 'Double-Breasted Cashmere Trench',
    slug: 'double-breasted-cashmere-trench',
    description: 'Crafted from ultra-soft brushed Italian cashmere blend. Hand-finished horn buttons, raglan sleeve drape, storm flap detailing, and a detachable cinched waist belt.',
    shortDescription: 'Brushed Italian cashmere trench coat with horn buttons.',
    price: 580,
    images: [
      'https://images.unsplash.com/photo-1544441893-675973e31985?w=1200&q=85',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1200&q=85'
    ],
    category: 'Jackets',
    gender: 'women',
    sizes: ['S', 'M', 'L'],
    colors: ['Camel', 'Charcoal', 'Ecru'],
    stock: 8,
    lowStockThreshold: 5,
    sku: 'VEL-W-COT-02',
    brand: 'VELOUR Atelier',
    featured: true,
    newArrival: false,
    isActive: true,
    tags: ['coat', 'cashmere', 'outerwear'],
    weight: '1.4 kg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-w-03',
    name: 'Fine Gauge Merino Turtleneck',
    slug: 'fine-gauge-merino-turtleneck',
    description: 'Spun from extra-fine 19.5-micron Australian merino wool. Designed with a close second-skin fit, ribbed cuffs, and an elongated collar that can be folded or slouched.',
    shortDescription: 'Second-skin fit 19.5-micron merino wool turtleneck.',
    price: 165,
    salePrice: 145,
    images: [
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1200&q=85',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1200&q=85'
    ],
    category: 'Tops',
    gender: 'women',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Ivory', 'Midnight', 'Olive'],
    stock: 22,
    lowStockThreshold: 5,
    sku: 'VEL-W-TOP-03',
    brand: 'VELOUR Studio',
    featured: false,
    newArrival: true,
    isActive: true,
    tags: ['knitwear', 'wool', 'essential'],
    weight: '0.4 kg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-w-04',
    name: 'Pleated Wide-Leg Wool Trousers',
    slug: 'pleated-wide-leg-wool-trousers',
    description: 'High-waisted tailored trousers featuring deep front double pleats, angled side pockets, and an elongated wide-leg silhouette that pairs effortlessly with tailoring or knitwear.',
    shortDescription: 'High-waisted double pleated wide-leg wool trousers.',
    price: 240,
    images: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=85',
      'https://images.unsplash.com/photo-1551803091-e20673f15770?w=1200&q=85'
    ],
    category: 'Trousers',
    gender: 'women',
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Stone Grey', 'Black', 'Parchment'],
    stock: 18,
    lowStockThreshold: 5,
    sku: 'VEL-W-TRS-04',
    brand: 'VELOUR Studio',
    featured: true,
    newArrival: false,
    isActive: true,
    tags: ['tailoring', 'wool', 'trousers'],
    weight: '0.5 kg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-m-01',
    name: 'Deconstructed Italian Wool Blazer',
    slug: 'deconstructed-italian-wool-blazer',
    description: 'Unstructured tailoring crafted from lightweight Super 130s wool from Biella, Italy. Soft, natural shoulders, patch pockets, and unlined interior for effortless elegance.',
    shortDescription: 'Unstructured Super 130s wool blazer tailored in Italy.',
    price: 440,
    salePrice: 385,
    images: [
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=85',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200&q=85'
    ],
    category: 'Jackets',
    gender: 'men',
    sizes: ['38R', '40R', '42R', '44R'],
    colors: ['Charcoal Heather', 'Deep Navy', 'Warm Khaki'],
    stock: 11,
    lowStockThreshold: 5,
    sku: 'VEL-M-BLZ-01',
    brand: 'VELOUR Sartorial',
    featured: true,
    newArrival: true,
    isActive: true,
    tags: ['blazer', 'tailoring', 'wool'],
    weight: '0.9 kg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-m-02',
    name: 'Poplin French Cuff Dress Shirt',
    slug: 'poplin-french-cuff-dress-shirt',
    description: 'Woven from 120/2 two-ply Egyptian Giza cotton with an exceptionally smooth, crisp handfeel. Semi-spread collar with removable brass stays and Mother of Pearl buttons.',
    shortDescription: 'Two-ply Egyptian Giza cotton dress shirt with French cuffs.',
    price: 150,
    images: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1200&q=85',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200&q=85'
    ],
    category: 'Shirts',
    gender: 'men',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Crisp White', 'Sky Blue', 'Stripe'],
    stock: 25,
    lowStockThreshold: 5,
    sku: 'VEL-M-SHT-02',
    brand: 'VELOUR Sartorial',
    featured: true,
    newArrival: false,
    isActive: true,
    tags: ['shirt', 'cotton', 'formal'],
    weight: '0.3 kg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-m-03',
    name: 'Chunky Ribbed Cashmere Sweater',
    slug: 'chunky-ribbed-cashmere-sweater',
    description: 'A substantial 7-gauge knit made from 100% Grade-A Mongolian cashmere. Features fisherman rib stitch, saddle shoulders, and thick crew neckline.',
    shortDescription: '7-gauge fisherman rib knit in pure Grade-A Mongolian cashmere.',
    price: 360,
    salePrice: 310,
    images: [
      'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=1200&q=85',
      'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=1200&q=85'
    ],
    category: 'Hoodies',
    gender: 'men',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Sandstone', 'Dark Olive', 'Charcoal'],
    stock: 14,
    lowStockThreshold: 5,
    sku: 'VEL-M-SWT-03',
    brand: 'VELOUR Studio',
    featured: true,
    newArrival: true,
    isActive: true,
    tags: ['sweater', 'cashmere', 'knitwear'],
    weight: '0.7 kg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-m-05',
    name: 'Minimalist Lambskin Leather Jacket',
    slug: 'minimalist-lambskin-leather-jacket',
    description: 'Supple full-grain Italian lambskin leather with satin interior lining. Clean café-racer collar, two-way RiRi antique silver zipper, and hidden interior chest pocket.',
    shortDescription: 'Full-grain Italian lambskin leather jacket with café-racer collar.',
    price: 690,
    images: [
      'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=1200&q=85',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&q=85'
    ],
    category: 'Jackets',
    gender: 'men',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Matte Black', 'Dark Espresso'],
    stock: 4, // Intentionally low stock to demonstrate alert
    lowStockThreshold: 5,
    sku: 'VEL-M-JKT-05',
    brand: 'VELOUR Leather Goods',
    featured: true,
    newArrival: true,
    isActive: true,
    tags: ['leather', 'jacket', 'outerwear'],
    weight: '1.2 kg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Default Initial Coupons
const DEFAULT_COUPONS: DbCoupon[] = [
  {
    id: 'cpn-01',
    code: 'VELOUR10',
    discountType: 'percentage',
    discountValue: 10,
    minimumOrder: 100,
    maximumDiscount: 150,
    usageLimit: 500,
    usedCount: 28,
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cpn-02',
    code: 'VIP20',
    discountType: 'percentage',
    discountValue: 20,
    minimumOrder: 250,
    maximumDiscount: 300,
    usageLimit: 100,
    usedCount: 14,
    expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cpn-03',
    code: 'WELCOME50',
    discountType: 'fixed',
    discountValue: 50,
    minimumOrder: 300,
    usageLimit: 200,
    usedCount: 42,
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Default Store Settings
const DEFAULT_STORE_SETTINGS: DbStoreSettings = {
  storeName: 'VELOUR Fashion',
  storeLogo: '',
  storeEmail: 'concierge@velour.com',
  supportEmail: 'support@velour.com',
  phone: '+1 (800) 835-6871',
  whatsapp: '+1 (800) 835-6871',
  currency: 'USD',
  timezone: 'America/New_York',
  lowStockThreshold: 5,
  standardShippingFee: 25,
  freeShippingThreshold: 250,
  taxRate: 0.08,
  socialInstagram: 'https://instagram.com/velour',
  socialTwitter: 'https://twitter.com/velour',
  socialFacebook: 'https://facebook.com/velour',
  announcementText: 'Complimentary white-glove courier shipping on all orders over $250',
  updatedAt: new Date().toISOString()
};

// Default Banners
const DEFAULT_BANNERS: DbBanner[] = [
  {
    id: 'ban-01',
    title: 'The Autumn / Winter Atelier 2026',
    subtitle: 'Sculptural wool outerwear, bias-cut double silk sateen, and Florentine leather craft.',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=85',
    buttonText: 'Discover Collection',
    buttonUrl: '/women',
    order: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ban-02',
    title: 'Modern Tailoring for Him',
    subtitle: 'Biella Super 130s unlined blazers and handcrafted Italian calfskin footwear.',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1920&q=85',
    buttonText: 'Explore Sartorial',
    buttonUrl: '/men',
    order: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Default Initial Reviews
const DEFAULT_REVIEWS: DbReview[] = [
  {
    id: 'rev-01',
    productId: 'prod-w-01',
    productName: 'Sateen Bias-Cut Evening Gown',
    customerId: 'usr-demo-01',
    customerName: 'Eleanor Vance',
    customerEmail: 'eleanor.v@example.com',
    rating: 5,
    comment: 'The drape and weight of the double-faced sateen is exquisite. Pairs with minimal jewelry for gala evenings.',
    status: 'approved',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rev-02',
    productId: 'prod-w-02',
    productName: 'Double-Breasted Cashmere Trench',
    customerId: 'usr-demo-02',
    customerName: 'Camille Laurent',
    customerEmail: 'camille@atelier.fr',
    rating: 5,
    comment: 'Sublime craftsmanship. The brushed cashmere keeps its structured form while remaining buttery soft.',
    status: 'approved',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rev-03',
    productId: 'prod-m-01',
    productName: 'Deconstructed Italian Wool Blazer',
    customerId: 'usr-demo-03',
    customerName: 'Julian Sterling',
    customerEmail: 'julian.sterling@example.com',
    rating: 5,
    comment: 'The Biella wool feels practically weightless. Perfect for cross-continental travel and dinner meetings.',
    status: 'approved',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Default Notifications
const DEFAULT_NOTIFICATIONS: DbAdminNotification[] = [
  {
    id: 'notif-01',
    type: 'stock',
    title: 'Low Stock Alert',
    message: 'Minimalist Lambskin Leather Jacket (SKU: VEL-M-JKT-05) has reached 4 units in stock.',
    isRead: false,
    link: '/admin/inventory',
    createdAt: new Date().toISOString()
  },
  {
    id: 'notif-02',
    type: 'order',
    title: 'Atelier Order Received',
    message: 'New order #VEL-882194 placed for $630.00 by Eleanor Vance.',
    isRead: false,
    link: '/admin/orders',
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString()
  }
];

class VelourDatabase {
  private data: DatabaseSchema;
  private isMongoConnected: boolean = false;

  constructor() {
    this.data = this.loadData();
    this.ensureSchemaIntegrity();
    this.ensureAdminUser();
    this.initMongoIfConfigured();
  }

  private async initMongoIfConfigured() {
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri && mongoUri.trim()) {
      try {
        console.log('[MongoDB] Connecting to cluster via Mongoose...');
        await mongoose.connect(mongoUri.trim(), {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 10000,
        });
        this.isMongoConnected = true;
        console.log('[MongoDB] Connected successfully! MongoDB is active as persistence engine.');
      } catch (err: any) {
        console.warn('[MongoDB] Connection error (running in resilient local storage mode):', err.message);
      }
    } else {
      console.log('[Database] MONGODB_URI not set. Running in local JSON storage mode with full MongoDB-compatible repository.');
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content);
      }
      if (isServerlessEnv && fs.existsSync(SEED_FILE)) {
        const content = fs.readFileSync(SEED_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        try {
          fs.writeFileSync(DB_FILE, content, 'utf-8');
        } catch {}
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load database file, creating fresh store', e);
    }

    const initialData: DatabaseSchema = {
      users: [],
      products: INITIAL_PRODUCTS,
      carts: [],
      wishlists: [],
      orders: [],
      categories: DEFAULT_CATEGORIES,
      newsletter: [],
      coupons: DEFAULT_COUPONS,
      reviews: DEFAULT_REVIEWS,
      inventoryTransactions: [],
      payments: [],
      banners: DEFAULT_BANNERS,
      contactMessages: [],
      notifications: DEFAULT_NOTIFICATIONS,
      storeSettings: DEFAULT_STORE_SETTINGS,
      auditLogs: []
    };
    this.saveData(initialData);
    return initialData;
  }

  private saveData(data: DatabaseSchema): void {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.warn('[Database] Local file write skipped (running in-memory or read-only container):', (err as any)?.message || err);
    }
  }

  public save(): void {
    this.saveData(this.data);
  }

  private ensureSchemaIntegrity(): void {
    let changed = false;
    if (!Array.isArray(this.data.users)) { this.data.users = []; changed = true; }
    if (!Array.isArray(this.data.products) || this.data.products.length === 0) {
      this.data.products = INITIAL_PRODUCTS;
      changed = true;
    }
    if (!Array.isArray(this.data.categories) || this.data.categories.length === 0) {
      this.data.categories = DEFAULT_CATEGORIES;
      changed = true;
    }
    if (!Array.isArray(this.data.carts)) { this.data.carts = []; changed = true; }
    if (!Array.isArray(this.data.wishlists)) { this.data.wishlists = []; changed = true; }
    if (!Array.isArray(this.data.orders)) { this.data.orders = []; changed = true; }
    if (!Array.isArray(this.data.newsletter)) { this.data.newsletter = []; changed = true; }
    if (!Array.isArray(this.data.coupons)) { this.data.coupons = DEFAULT_COUPONS; changed = true; }
    if (!Array.isArray(this.data.reviews)) { this.data.reviews = DEFAULT_REVIEWS; changed = true; }
    if (!Array.isArray(this.data.inventoryTransactions)) {
      this.data.inventoryTransactions = this.data.products.map(p => ({
        id: `txn-init-${p.id}`,
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        type: 'received',
        quantityChange: p.stock,
        previousStock: 0,
        newStock: p.stock,
        reason: 'Initial atelier warehouse intake',
        recordedBy: 'VELOUR Logistics',
        createdAt: p.createdAt
      }));
      changed = true;
    }
    if (!Array.isArray(this.data.payments)) {
      this.data.payments = this.data.orders.map(o => ({
        id: `pay-${o.id}`,
        orderId: o.id,
        orderNumber: o.orderNumber,
        customerName: o.userName,
        customerEmail: o.userEmail,
        amount: o.total,
        currency: 'USD',
        provider: o.paymentMethod || 'Cash on Delivery',
        status: o.paymentStatus || 'Pending',
        transactionRef: `TXN-${o.orderNumber.replace(/[^0-9]/g, '')}`,
        createdAt: o.createdAt
      }));
      changed = true;
    }
    if (!Array.isArray(this.data.banners)) { this.data.banners = DEFAULT_BANNERS; changed = true; }
    if (!Array.isArray(this.data.contactMessages)) { this.data.contactMessages = []; changed = true; }
    if (!Array.isArray(this.data.notifications)) { this.data.notifications = DEFAULT_NOTIFICATIONS; changed = true; }
    if (!this.data.storeSettings) { this.data.storeSettings = DEFAULT_STORE_SETTINGS; changed = true; }
    if (!Array.isArray(this.data.auditLogs)) { this.data.auditLogs = []; changed = true; }

    // Ensure all products have lowStockThreshold, tags, sku
    this.data.products.forEach(p => {
      if (p.lowStockThreshold === undefined) { p.lowStockThreshold = 5; changed = true; }
      if (!p.sku) { p.sku = `VEL-${p.gender === 'women' ? 'W' : 'M'}-${p.category.substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`; changed = true; }
    });

    // Ensure all orders have timeline and proper payment/order statuses
    this.data.orders.forEach(o => {
      if (!o.timeline || o.timeline.length === 0) {
        o.timeline = [
          { status: o.orderStatus || 'Confirmed', note: 'Order placed by customer', timestamp: o.createdAt, updatedBy: 'System' }
        ];
        changed = true;
      }
      if (!o.paymentMethod) { o.paymentMethod = 'Cash on Delivery'; changed = true; }
      if (!o.paymentStatus) { o.paymentStatus = 'Pending'; changed = true; }
    });

    if (changed) {
      this.save();
    }
  }

  private ensureAdminUser(): void {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@velour.com';
    const existingAdmin = this.data.users.find(
      u => u.email.toLowerCase() === adminEmail.toLowerCase() && u.role === 'admin'
    );

    if (!existingAdmin) {
      const plainPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(plainPassword, salt);

      const adminUser: DbUser = {
        id: 'usr-admin-01',
        name: 'Velour Administrator',
        email: adminEmail.toLowerCase(),
        passwordHash,
        role: 'admin',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.data.users.push(adminUser);
      this.save();
      console.log(`[Database] Initial admin bootstrapped: ${adminEmail}`);
    }
  }

  // ==========================================
  // USERS & CUSTOMERS
  // ==========================================

  public findUserById(id: string): DbUser | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByEmail(email: string): DbUser | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserByGoogleId(googleId: string): DbUser | undefined {
    return this.data.users.find(u => u.googleId === googleId);
  }

  public getAllUsers(): DbUser[] {
    return this.data.users;
  }

  public createUser(user: Omit<DbUser, 'id' | 'createdAt' | 'updatedAt'>): DbUser {
    const newUser: DbUser = {
      ...user,
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.save();

    // Trigger notification
    this.createNotification(
      'customer',
      'New Client Registered',
      `${newUser.name} (${newUser.email}) just created an atelier account.`,
      `/admin/customers`
    );

    return newUser;
  }

  public updateUser(id: string, updates: Partial<Omit<DbUser, 'id' | 'role'>>): DbUser | null {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    this.data.users[index] = {
      ...this.data.users[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.users[index];
  }

  public toggleUserActive(id: string): DbUser | null {
    const user = this.findUserById(id);
    if (!user) return null;
    user.isActive = !user.isActive;
    user.updatedAt = new Date().toISOString();
    this.save();
    return user;
  }

  public getCustomers(filter?: { search?: string; page?: number; limit?: number }) {
    let customers = this.data.users
      .filter(u => u.role === 'user')
      .map(u => {
        const userOrders = this.data.orders.filter(o => o.userId === u.id || o.userEmail.toLowerCase() === u.email.toLowerCase());
        const totalSpent = userOrders.reduce((sum, o) => sum + (o.paymentStatus === 'Paid' ? o.total : o.total), 0);
        const lastOrder = userOrders.length > 0 ? userOrders[0].createdAt : undefined;
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          address: u.address,
          city: u.city,
          country: u.country,
          isActive: u.isActive,
          createdAt: u.createdAt,
          ordersCount: userOrders.length,
          totalSpent,
          lastOrder
        };
      });

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      customers = customers.filter(
        c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
      );
    }

    const page = Math.max(1, Number(filter?.page || 1));
    const limit = Math.max(1, Number(filter?.limit || 20));
    const total = customers.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = customers.slice((page - 1) * limit, page * limit);

    return {
      customers: paginated,
      total,
      page,
      limit,
      totalPages
    };
  }

  public getCustomerDetails(id: string) {
    const user = this.findUserById(id);
    if (!user) return null;

    const orders = this.data.orders.filter(o => o.userId === user.id || o.userEmail.toLowerCase() === user.email.toLowerCase());
    const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = orders.length > 0 ? Math.round(totalSpent / orders.length) : 0;
    const wishlist = this.data.wishlists.find(w => w.userId === user.id);
    const wishlistCount = wishlist ? wishlist.items.length : 0;
    const reviews = this.data.reviews.filter(r => r.customerId === user.id || r.customerEmail.toLowerCase() === user.email.toLowerCase());

    const { passwordHash, ...safeUser } = user;
    return {
      customer: safeUser,
      orders,
      totalOrders: orders.length,
      totalSpent,
      avgOrderValue,
      wishlistCount,
      reviews
    };
  }

  // ==========================================
  // PRODUCTS
  // ==========================================

  public getProducts(filter?: {
    gender?: 'women' | 'men' | 'unisex';
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    size?: string;
    color?: string;
    featured?: boolean;
    newArrival?: boolean;
    inStockOnly?: boolean;
    stockStatus?: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
    sort?: 'featured' | 'newest' | 'price-low' | 'price-high';
    includeInactive?: boolean;
    page?: number;
    limit?: number;
  }): { products: DbProduct[]; total: number; page: number; limit: number; totalPages: number } {
    let result = [...this.data.products];

    if (!filter?.includeInactive) {
      result = result.filter(p => p.isActive !== false);
    }

    if (filter?.gender && filter.gender !== 'unisex') {
      result = result.filter(p => p.gender === filter.gender || p.gender === 'unisex');
    }

    if (filter?.category && filter.category !== 'all') {
      result = result.filter(p => p.category.toLowerCase() === filter.category!.toLowerCase());
    }

    if (filter?.featured) {
      result = result.filter(p => p.featured === true);
    }

    if (filter?.newArrival) {
      result = result.filter(p => p.newArrival === true);
    }

    if (filter?.inStockOnly) {
      result = result.filter(p => p.stock > 0);
    }

    if (filter?.stockStatus) {
      if (filter.stockStatus === 'out-of-stock') {
        result = result.filter(p => p.stock === 0);
      } else if (filter.stockStatus === 'low-stock') {
        result = result.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5));
      } else if (filter.stockStatus === 'in-stock') {
        result = result.filter(p => p.stock > (p.lowStockThreshold || 5));
      }
    }

    if (filter?.size) {
      result = result.filter(p => p.sizes.some(s => s.toLowerCase() === filter.size!.toLowerCase()));
    }

    if (filter?.color) {
      result = result.filter(p => p.colors.some(c => c.toLowerCase().includes(filter.color!.toLowerCase())));
    }

    if (filter?.minPrice !== undefined) {
      result = result.filter(p => (p.salePrice ?? p.price) >= filter.minPrice!);
    }

    if (filter?.maxPrice !== undefined) {
      result = result.filter(p => (p.salePrice ?? p.price) <= filter.maxPrice!);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (filter?.sort === 'price-low') {
      result.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
    } else if (filter?.sort === 'price-high') {
      result.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
    } else if (filter?.sort === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    const total = result.length;
    const page = Math.max(1, Number(filter?.page || 1));
    const limit = filter?.limit ? Math.max(1, Number(filter.limit)) : total;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = result.slice((page - 1) * limit, page * limit);

    return {
      products: paginated,
      total,
      page,
      limit,
      totalPages
    };
  }

  public getProductById(id: string): DbProduct | undefined {
    return this.data.products.find(p => p.id === id || p.slug === id);
  }

  public createProduct(product: Omit<DbProduct, 'id' | 'createdAt' | 'updatedAt'>, adminName?: string): DbProduct {
    const id = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newProduct: DbProduct = {
      ...product,
      id,
      lowStockThreshold: product.lowStockThreshold || 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.products.unshift(newProduct);

    // Record initial inventory transaction
    this.data.inventoryTransactions.unshift({
      id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: newProduct.id,
      productName: newProduct.name,
      sku: newProduct.sku,
      type: 'received',
      quantityChange: newProduct.stock,
      previousStock: 0,
      newStock: newProduct.stock,
      reason: 'Product catalogue creation intake',
      recordedBy: adminName || 'Admin',
      createdAt: new Date().toISOString()
    });

    this.save();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<DbProduct>, adminName?: string): DbProduct | null {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const oldStock = this.data.products[idx].stock;
    const newStock = updates.stock !== undefined ? Number(updates.stock) : oldStock;

    if (updates.stock !== undefined && newStock !== oldStock) {
      const diff = newStock - oldStock;
      this.data.inventoryTransactions.unshift({
        id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: id,
        productName: updates.name || this.data.products[idx].name,
        sku: updates.sku || this.data.products[idx].sku,
        type: diff > 0 ? 'received' : 'adjusted',
        quantityChange: diff,
        previousStock: oldStock,
        newStock: newStock,
        reason: 'Manual stock adjustment from product editor',
        recordedBy: adminName || 'Admin',
        createdAt: new Date().toISOString()
      });
    }

    this.data.products[idx] = {
      ...this.data.products[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Check low stock alert
    const threshold = this.data.products[idx].lowStockThreshold || 5;
    if (newStock <= threshold) {
      this.createNotification(
        'stock',
        newStock === 0 ? 'Out of Stock Alert' : 'Low Stock Warning',
        `${this.data.products[idx].name} has ${newStock} units left (threshold: ${threshold}).`,
        '/admin/inventory'
      );
    }

    this.save();
    return this.data.products[idx];
  }

  public deleteProduct(id: string): boolean {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => p.id !== id);
    const deleted = this.data.products.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  public duplicateProduct(id: string, adminName?: string): DbProduct | null {
    const source = this.getProductById(id);
    if (!source) return null;

    const newName = `${source.name} (Copy)`;
    const newSlug = `${source.slug}-copy-${Date.now().toString(36)}`;
    const newSku = `${source.sku}-CPY`;

    return this.createProduct(
      {
        ...source,
        name: newName,
        slug: newSlug,
        sku: newSku,
        stock: 10,
        featured: false,
        isActive: false
      },
      adminName
    );
  }

  public bulkUpdateProducts(ids: string[], action: 'activate' | 'deactivate' | 'delete'): number {
    let affected = 0;
    if (action === 'delete') {
      const before = this.data.products.length;
      this.data.products = this.data.products.filter(p => !ids.includes(p.id));
      affected = before - this.data.products.length;
    } else {
      const activeState = action === 'activate';
      this.data.products.forEach(p => {
        if (ids.includes(p.id)) {
          p.isActive = activeState;
          p.updatedAt = new Date().toISOString();
          affected++;
        }
      });
    }
    if (affected > 0) this.save();
    return affected;
  }

  // ==========================================
  // INVENTORY
  // ==========================================

  public getInventory(filter?: {
    search?: string;
    status?: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
    page?: number;
    limit?: number;
  }) {
    let items = this.data.products.map(p => {
      const lowStockThresh = p.lowStockThreshold || this.data.storeSettings.lowStockThreshold || 5;
      let status: 'in-stock' | 'low-stock' | 'out-of-stock' = 'in-stock';
      if (p.stock === 0) status = 'out-of-stock';
      else if (p.stock <= lowStockThresh) status = 'low-stock';

      return {
        id: p.id,
        productId: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        image: p.images[0] || '',
        price: p.price,
        stock: p.stock,
        reserved: 0,
        available: p.stock,
        lowStockThreshold: lowStockThresh,
        status
      };
    });

    if (filter?.status && filter.status !== 'all') {
      items = items.filter(i => i.status === filter.status);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }

    const total = items.length;
    const page = Math.max(1, Number(filter?.page || 1));
    const limit = Math.max(1, Number(filter?.limit || 20));
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = items.slice((page - 1) * limit, page * limit);

    return {
      items: paginated,
      total,
      page,
      limit,
      totalPages,
      lowStockCount: items.filter(i => i.status === 'low-stock').length,
      outOfStockCount: items.filter(i => i.status === 'out-of-stock').length
    };
  }

  public adjustInventory(
    productId: string,
    quantityChange: number,
    type: 'received' | 'sold' | 'damaged' | 'returned' | 'adjusted',
    reason: string,
    recordedBy?: string
  ): { product: DbProduct; transaction: DbInventoryTransaction } {
    const prod = this.getProductById(productId);
    if (!prod) throw new Error('Product not found');

    const prevStock = prod.stock;
    const newStock = Math.max(0, prevStock + quantityChange);

    prod.stock = newStock;
    prod.updatedAt = new Date().toISOString();

    const transaction: DbInventoryTransaction = {
      id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      type,
      quantityChange,
      previousStock: prevStock,
      newStock,
      reason,
      recordedBy: recordedBy || 'Admin',
      createdAt: new Date().toISOString()
    };

    this.data.inventoryTransactions.unshift(transaction);

    // Trigger notification if low/out of stock
    const thresh = prod.lowStockThreshold || 5;
    if (newStock <= thresh) {
      this.createNotification(
        'stock',
        newStock === 0 ? 'Out of Stock Alert' : 'Low Stock Alert',
        `${prod.name} (SKU: ${prod.sku}) stock changed to ${newStock}.`,
        '/admin/inventory'
      );
    }

    this.save();
    return { product: prod, transaction };
  }

  public getInventoryTransactions(productId?: string, limit: number = 50): DbInventoryTransaction[] {
    let list = this.data.inventoryTransactions;
    if (productId) {
      list = list.filter(t => t.productId === productId);
    }
    return list.slice(0, limit);
  }

  // ==========================================
  // CATEGORIES
  // ==========================================

  public getCategories(includeInactive: boolean = false): DbCategory[] {
    let cats = this.data.categories;
    if (!includeInactive) {
      cats = cats.filter(c => c.isActive !== false);
    }
    return cats.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  public getCategoryById(id: string): DbCategory | undefined {
    return this.data.categories.find(c => c.id === id || c.slug === id);
  }

  public createCategory(cat: Omit<DbCategory, 'id'>): DbCategory {
    const newCat: DbCategory = {
      ...cat,
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      isActive: cat.isActive !== undefined ? cat.isActive : true,
      order: cat.order || (this.data.categories.length + 1)
    };
    this.data.categories.push(newCat);
    this.save();
    return newCat;
  }

  public updateCategory(id: string, updates: Partial<DbCategory>): DbCategory | null {
    const idx = this.data.categories.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.categories[idx] = { ...this.data.categories[idx], ...updates };
    this.save();
    return this.data.categories[idx];
  }

  public deleteCategory(id: string): boolean {
    const initialLen = this.data.categories.length;
    this.data.categories = this.data.categories.filter(c => c.id !== id);
    const deleted = this.data.categories.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  public toggleCategoryActive(id: string): DbCategory | null {
    const cat = this.getCategoryById(id);
    if (!cat) return null;
    cat.isActive = !cat.isActive;
    this.save();
    return cat;
  }

  // ==========================================
  // CART
  // ==========================================

  public getCart(userId: string): DbCart {
    let cart = this.data.carts.find(c => c.userId === userId);
    if (!cart) {
      cart = { userId, items: [], updatedAt: new Date().toISOString() };
      this.data.carts.push(cart);
      this.save();
    }
    return cart;
  }

  public addToCart(userId: string, item: { productId: string; size: string; color: string; quantity: number }): DbCart {
    const cart = this.getCart(userId);
    const product = this.getProductById(item.productId);
    if (!product || !product.isActive) {
      throw new Error('Product not found or currently unavailable');
    }

    const availableStock = product.stock;
    const existingIndex = cart.items.findIndex(
      i => i.productId === item.productId && i.size === item.size && i.color === item.color
    );

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + item.quantity;
      if (newQty > availableStock) {
        throw new Error(`Only ${availableStock} items in stock`);
      }
      cart.items[existingIndex].quantity = newQty;
      cart.items[existingIndex].price = product.price;
      cart.items[existingIndex].salePrice = product.salePrice;
      cart.items[existingIndex].stock = availableStock;
    } else {
      if (item.quantity > availableStock) {
        throw new Error(`Only ${availableStock} items in stock`);
      }
      cart.items.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        salePrice: product.salePrice,
        image: product.images[0] || '',
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        stock: availableStock
      });
    }

    cart.updatedAt = new Date().toISOString();
    this.save();
    return cart;
  }

  public updateCartItem(userId: string, productId: string, size: string, color: string, quantity: number): DbCart {
    const cart = this.getCart(userId);
    const itemIdx = cart.items.findIndex(i => i.productId === productId && i.size === size && i.color === color);
    if (itemIdx === -1) return cart;

    if (quantity <= 0) {
      cart.items.splice(itemIdx, 1);
    } else {
      const product = this.getProductById(productId);
      const stock = product ? product.stock : cart.items[itemIdx].stock;
      if (quantity > stock) {
        throw new Error(`Requested quantity exceeds available stock (${stock})`);
      }
      cart.items[itemIdx].quantity = quantity;
    }

    cart.updatedAt = new Date().toISOString();
    this.save();
    return cart;
  }

  public removeFromCart(userId: string, productId: string, size: string, color: string): DbCart {
    const cart = this.getCart(userId);
    cart.items = cart.items.filter(i => !(i.productId === productId && i.size === size && i.color === color));
    cart.updatedAt = new Date().toISOString();
    this.save();
    return cart;
  }

  public clearCart(userId: string): void {
    const cart = this.getCart(userId);
    cart.items = [];
    cart.updatedAt = new Date().toISOString();
    this.save();
  }

  public mergeCart(userId: string, guestItems: DbCartItem[]): DbCart {
    const cart = this.getCart(userId);
    for (const gItem of guestItems) {
      const prod = this.getProductById(gItem.productId);
      if (!prod || !prod.isActive) continue;

      const existing = cart.items.find(
        i => i.productId === gItem.productId && i.size === gItem.size && i.color === gItem.color
      );
      if (existing) {
        existing.quantity = Math.min(prod.stock, existing.quantity + gItem.quantity);
      } else {
        cart.items.push({
          productId: prod.id,
          name: prod.name,
          price: prod.price,
          salePrice: prod.salePrice,
          image: prod.images[0] || '',
          size: gItem.size,
          color: gItem.color,
          quantity: Math.min(prod.stock, gItem.quantity),
          stock: prod.stock
        });
      }
    }
    cart.updatedAt = new Date().toISOString();
    this.save();
    return cart;
  }

  // ==========================================
  // WISHLIST
  // ==========================================

  public getWishlist(userId: string): string[] {
    const wl = this.data.wishlists.find(w => w.userId === userId);
    return wl ? wl.items.map(i => i.productId) : [];
  }

  public toggleWishlist(userId: string, productId: string): { isInWishlist: boolean; productIds: string[] } {
    let wl = this.data.wishlists.find(w => w.userId === userId);
    if (!wl) {
      wl = { userId, items: [], updatedAt: new Date().toISOString() };
      this.data.wishlists.push(wl);
    }

    const idx = wl.items.findIndex(i => i.productId === productId);
    let isInWishlist: boolean;
    if (idx > -1) {
      wl.items.splice(idx, 1);
      isInWishlist = false;
    } else {
      wl.items.push({ productId, addedAt: new Date().toISOString() });
      isInWishlist = true;
    }
    wl.updatedAt = new Date().toISOString();
    this.save();
    return { isInWishlist, productIds: wl.items.map(i => i.productId) };
  }

  public getWishlistAnalytics() {
    const productWishlistCounts: Record<string, number> = {};
    this.data.wishlists.forEach(wl => {
      wl.items.forEach(item => {
        productWishlistCounts[item.productId] = (productWishlistCounts[item.productId] || 0) + 1;
      });
    });

    const productSalesCounts: Record<string, number> = {};
    this.data.orders.forEach(ord => {
      ord.items.forEach(item => {
        productSalesCounts[item.productId] = (productSalesCounts[item.productId] || 0) + item.quantity;
      });
    });

    const mostWishlisted = Object.entries(productWishlistCounts)
      .map(([productId, count]) => {
        const prod = this.getProductById(productId);
        const sales = productSalesCounts[productId] || 0;
        return {
          productId,
          name: prod ? prod.name : 'Unknown Item',
          sku: prod ? prod.sku : '',
          category: prod ? prod.category : '',
          image: prod?.images[0] || '',
          price: prod?.salePrice ?? prod?.price ?? 0,
          wishlistCount: count,
          unitsSold: sales,
          stock: prod?.stock || 0,
          opportunityIndex: count > 1 && sales === 0 ? 'High Interest / Zero Sales' : 'Balanced'
        };
      })
      .sort((a, b) => b.wishlistCount - a.wishlistCount);

    return {
      totalWishlistItems: Object.values(productWishlistCounts).reduce((a, b) => a + b, 0),
      mostWishlisted
    };
  }

  // ==========================================
  // ORDERS
  // ==========================================

  public createOrder(data: {
    userId: string;
    userName: string;
    userEmail: string;
    shippingAddress: DbOrder['shippingAddress'];
    paymentMethod?: DbOrder['paymentMethod'];
    discountCode?: string;
    notes?: string;
  }): DbOrder {
    const cart = this.getCart(data.userId);
    if (!cart.items.length) {
      throw new Error('Cannot place order: Cart is empty');
    }

    // Validate each item server-side and calculate true server prices
    let subtotal = 0;
    const orderItems: DbOrderItem[] = [];

    for (const item of cart.items) {
      const product = this.getProductById(item.productId);
      if (!product || !product.isActive) {
        throw new Error(`Product "${item.name}" is no longer available`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}`);
      }

      const itemPrice = product.salePrice ?? product.price;
      subtotal += itemPrice * item.quantity;

      orderItems.push({
        productId: product.id,
        name: product.name,
        price: itemPrice,
        image: product.images[0] || '',
        size: item.size,
        color: item.color,
        quantity: item.quantity
      });
    }

    // Shipping & discount logic based on Store Settings
    const settings = this.getStoreSettings();
    const freeThreshold = settings.freeShippingThreshold || 250;
    const standardShipping = settings.standardShippingFee || 25;
    const shipping = subtotal >= freeThreshold ? 0 : standardShipping;

    let discount = 0;
    if (data.discountCode) {
      const couponValidation = this.validateCoupon(data.discountCode, subtotal);
      if (couponValidation.valid && couponValidation.coupon) {
        discount = couponValidation.discount;
        // Increment coupon count
        couponValidation.coupon.usedCount += 1;
      }
    }

    const taxRate = settings.taxRate || 0.08;
    const tax = Math.round(subtotal * taxRate);
    const total = Math.max(0, subtotal + shipping + tax - discount);
    const orderNumber = `VEL-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder: DbOrder = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderNumber,
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      items: orderItems,
      shippingAddress: data.shippingAddress,
      paymentMethod: data.paymentMethod || 'Cash on Delivery',
      paymentStatus: 'Pending',
      orderStatus: 'Confirmed',
      subtotal,
      shipping,
      discount,
      discountCode: data.discountCode,
      tax,
      total,
      notes: data.notes,
      timeline: [
        {
          status: 'Confirmed',
          note: `Order placed via ${data.paymentMethod || 'Cash on Delivery'}.`,
          timestamp: new Date().toISOString(),
          updatedBy: 'Customer'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Deduct stock safely and record inventory transactions
    for (const item of orderItems) {
      const prod = this.getProductById(item.productId);
      if (prod) {
        const prevStock = prod.stock;
        prod.stock = Math.max(0, prod.stock - item.quantity);
        prod.updatedAt = new Date().toISOString();

        this.data.inventoryTransactions.unshift({
          id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          type: 'sold',
          quantityChange: -item.quantity,
          previousStock: prevStock,
          newStock: prod.stock,
          reason: `Order #${newOrder.orderNumber}`,
          recordedBy: 'Storefront Checkout',
          createdAt: new Date().toISOString()
        });

        if (prod.stock <= (prod.lowStockThreshold || 5)) {
          this.createNotification(
            'stock',
            prod.stock === 0 ? 'Out of Stock Alert' : 'Low Stock Warning',
            `${prod.name} stock has reduced to ${prod.stock} after Order #${newOrder.orderNumber}.`,
            '/admin/inventory'
          );
        }
      }
    }

    // Create Payment Record
    const paymentRecord: DbPaymentRecord = {
      id: `pay-${newOrder.id}`,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      customerName: newOrder.userName,
      customerEmail: newOrder.userEmail,
      amount: newOrder.total,
      currency: settings.currency || 'USD',
      provider: newOrder.paymentMethod,
      status: 'Pending',
      transactionRef: `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      createdAt: newOrder.createdAt
    };
    this.data.payments.unshift(paymentRecord);

    // Create Admin Notification
    this.createNotification(
      'order',
      'New Order Received',
      `Order #${newOrder.orderNumber} for $${newOrder.total} placed by ${newOrder.userName}.`,
      `/admin/orders`
    );

    // Clear user cart
    this.clearCart(data.userId);

    this.data.orders.unshift(newOrder);
    this.save();
    return newOrder;
  }

  public getOrdersByUserId(userId: string): DbOrder[] {
    return this.data.orders.filter(o => o.userId === userId);
  }

  public getOrderById(id: string): DbOrder | undefined {
    return this.data.orders.find(o => o.id === id || o.orderNumber === id);
  }

  public getAllOrders(filter?: {
    status?: string;
    search?: string;
    dateRange?: string;
    page?: number;
    limit?: number;
  }): { orders: DbOrder[]; total: number; page: number; limit: number; totalPages: number } {
    let list = [...this.data.orders];

    if (filter?.status && filter.status !== 'all') {
      list = list.filter(o => o.orderStatus.toLowerCase() === filter.status!.toLowerCase());
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        o =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.userName.toLowerCase().includes(q) ||
          o.userEmail.toLowerCase().includes(q) ||
          o.shippingAddress.phone.includes(q)
      );
    }

    const total = list.length;
    const page = Math.max(1, Number(filter?.page || 1));
    const limit = Math.max(1, Number(filter?.limit || 20));
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      orders: paginated,
      total,
      page,
      limit,
      totalPages
    };
  }

  public updateOrderStatus(
    id: string,
    orderStatus?: DbOrder['orderStatus'],
    paymentStatus?: DbOrder['paymentStatus'],
    note?: string,
    adminName?: string
  ): DbOrder | null {
    const order = this.getOrderById(id);
    if (!order) return null;

    if (orderStatus && order.orderStatus !== orderStatus) {
      order.orderStatus = orderStatus;
      order.timeline.unshift({
        status: orderStatus,
        note: note || `Status updated to ${orderStatus}`,
        timestamp: new Date().toISOString(),
        updatedBy: adminName || 'Admin'
      });
    }

    if (paymentStatus && order.paymentStatus !== paymentStatus) {
      order.paymentStatus = paymentStatus;
      // Also sync payment record
      const payRecord = this.data.payments.find(p => p.orderId === order.id || p.orderNumber === order.orderNumber);
      if (payRecord) {
        payRecord.status = paymentStatus;
      }
    }

    order.updatedAt = new Date().toISOString();
    this.save();
    return order;
  }

  public refundOrder(id: string, refundAmount: number, reason: string, adminName?: string): DbOrder | null {
    const order = this.getOrderById(id);
    if (!order) return null;

    order.orderStatus = 'Refunded';
    order.paymentStatus = 'Refunded';
    order.refundAmount = refundAmount;
    order.refundReason = reason;
    order.refundDate = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    order.timeline.unshift({
      status: 'Refunded',
      note: `Refund of $${refundAmount} issued. Reason: ${reason}`,
      timestamp: new Date().toISOString(),
      updatedBy: adminName || 'Admin'
    });

    // Update payment record
    const payRecord = this.data.payments.find(p => p.orderId === order.id || p.orderNumber === order.orderNumber);
    if (payRecord) {
      payRecord.status = 'Refunded';
      payRecord.refundAmount = refundAmount;
      payRecord.refundReason = reason;
      payRecord.refundDate = order.refundDate;
    }

    this.save();
    return order;
  }

  public bulkUpdateOrdersStatus(ids: string[], status: DbOrder['orderStatus'], adminName?: string): number {
    let count = 0;
    this.data.orders.forEach(o => {
      if (ids.includes(o.id) || ids.includes(o.orderNumber)) {
        o.orderStatus = status;
        o.timeline.unshift({
          status,
          note: `Bulk updated status to ${status}`,
          timestamp: new Date().toISOString(),
          updatedBy: adminName || 'Admin'
        });
        o.updatedAt = new Date().toISOString();
        count++;
      }
    });
    if (count > 0) this.save();
    return count;
  }

  // ==========================================
  // PAYMENTS & REFUNDS
  // ==========================================

  public getPayments(filter?: { status?: string; provider?: string; search?: string; page?: number; limit?: number }) {
    let list = [...this.data.payments];

    if (filter?.status && filter.status !== 'all') {
      list = list.filter(p => p.status.toLowerCase() === filter.status!.toLowerCase());
    }

    if (filter?.provider && filter.provider !== 'all') {
      list = list.filter(p => p.provider.toLowerCase() === filter.provider!.toLowerCase());
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        p =>
          p.orderNumber.toLowerCase().includes(q) ||
          p.customerName.toLowerCase().includes(q) ||
          p.customerEmail.toLowerCase().includes(q) ||
          p.transactionRef.toLowerCase().includes(q)
      );
    }

    const total = list.length;
    const page = Math.max(1, Number(filter?.page || 1));
    const limit = Math.max(1, Number(filter?.limit || 20));
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      payments: paginated,
      total,
      page,
      limit,
      totalPages
    };
  }

  public processPaymentRefund(paymentId: string, amount: number, reason: string, adminName?: string): DbPaymentRecord | null {
    const pay = this.data.payments.find(p => p.id === paymentId);
    if (!pay) return null;

    pay.status = 'Refunded';
    pay.refundAmount = amount;
    pay.refundReason = reason;
    pay.refundDate = new Date().toISOString();

    // Sync order
    const order = this.getOrderById(pay.orderId);
    if (order) {
      this.refundOrder(order.id, amount, reason, adminName);
    }

    this.save();
    return pay;
  }

  // ==========================================
  // COUPONS
  // ==========================================

  public getCoupons(): DbCoupon[] {
    return this.data.coupons;
  }

  public getCouponById(id: string): DbCoupon | undefined {
    return this.data.coupons.find(c => c.id === id || c.code.toUpperCase() === id.toUpperCase());
  }

  public createCoupon(coupon: Omit<DbCoupon, 'id' | 'createdAt' | 'updatedAt' | 'usedCount'>): DbCoupon {
    const cleanCode = coupon.code.trim().toUpperCase();
    if (this.data.coupons.some(c => c.code.toUpperCase() === cleanCode)) {
      throw new Error(`Coupon with code "${cleanCode}" already exists.`);
    }

    const newCoupon: DbCoupon = {
      ...coupon,
      id: `cpn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: cleanCode,
      usedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.coupons.unshift(newCoupon);
    this.save();
    return newCoupon;
  }

  public updateCoupon(id: string, updates: Partial<DbCoupon>): DbCoupon | null {
    const idx = this.data.coupons.findIndex(c => c.id === id);
    if (idx === -1) return null;

    if (updates.code) {
      updates.code = updates.code.trim().toUpperCase();
    }

    this.data.coupons[idx] = {
      ...this.data.coupons[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.coupons[idx];
  }

  public deleteCoupon(id: string): boolean {
    const before = this.data.coupons.length;
    this.data.coupons = this.data.coupons.filter(c => c.id !== id);
    const deleted = this.data.coupons.length < before;
    if (deleted) this.save();
    return deleted;
  }

  public toggleCoupon(id: string): DbCoupon | null {
    const coupon = this.getCouponById(id);
    if (!coupon) return null;
    coupon.active = !coupon.active;
    coupon.updatedAt = new Date().toISOString();
    this.save();
    return coupon;
  }

  public validateCoupon(
    code: string,
    subtotal: number
  ): { valid: boolean; discount: number; coupon?: DbCoupon; message: string } {
    const clean = code.trim().toUpperCase();
    const coupon = this.data.coupons.find(c => c.code.toUpperCase() === clean);

    if (!coupon) {
      return { valid: false, discount: 0, message: 'Invalid coupon code.' };
    }
    if (!coupon.active) {
      return { valid: false, discount: 0, message: 'This coupon is currently inactive.' };
    }
    if (new Date(coupon.expiryDate).getTime() < Date.now()) {
      return { valid: false, discount: 0, message: 'This promotional voucher has expired.' };
    }
    if (coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, discount: 0, message: 'Coupon usage limit has been reached.' };
    }
    if (subtotal < coupon.minimumOrder) {
      return {
        valid: false,
        discount: 0,
        message: `Minimum order of $${coupon.minimumOrder} required for this code.`
      };
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
        discount = coupon.maximumDiscount;
      }
    } else {
      discount = Math.min(coupon.discountValue, subtotal);
    }

    return {
      valid: true,
      discount,
      coupon,
      message: `Coupon "${coupon.code}" applied: -$${discount}`
    };
  }

  // ==========================================
  // REVIEWS & MODERATION
  // ==========================================

  public getReviews(filter?: {
    status?: 'all' | 'pending' | 'approved' | 'rejected';
    productId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    let list = [...this.data.reviews];

    if (filter?.status && filter.status !== 'all') {
      list = list.filter(r => r.status === filter.status);
    }

    if (filter?.productId) {
      list = list.filter(r => r.productId === filter.productId);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        r =>
          r.productName.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.comment.toLowerCase().includes(q)
      );
    }

    const total = list.length;
    const page = Math.max(1, Number(filter?.page || 1));
    const limit = Math.max(1, Number(filter?.limit || 20));
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      reviews: paginated,
      total,
      page,
      limit,
      totalPages,
      pendingCount: this.data.reviews.filter(r => r.status === 'pending').length
    };
  }

  public getProductApprovedReviews(productId: string): DbReview[] {
    return this.data.reviews.filter(r => r.productId === productId && r.status === 'approved');
  }

  public createReview(data: Omit<DbReview, 'id' | 'createdAt' | 'updatedAt' | 'status'>): DbReview {
    const product = this.getProductById(data.productId);
    const newReview: DbReview = {
      ...data,
      productName: product ? product.name : data.productName,
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.reviews.unshift(newReview);

    // Notify admin
    this.createNotification(
      'review',
      'New Customer Review',
      `${newReview.customerName} submitted a ${newReview.rating}-star review for ${newReview.productName}.`,
      '/admin/reviews'
    );

    this.save();
    return newReview;
  }

  public updateReviewStatus(id: string, status: 'approved' | 'rejected'): DbReview | null {
    const rev = this.data.reviews.find(r => r.id === id);
    if (!rev) return null;
    rev.status = status;
    rev.updatedAt = new Date().toISOString();
    this.save();
    return rev;
  }

  public deleteReview(id: string): boolean {
    const before = this.data.reviews.length;
    this.data.reviews = this.data.reviews.filter(r => r.id !== id);
    const deleted = this.data.reviews.length < before;
    if (deleted) this.save();
    return deleted;
  }

  public bulkUpdateReviewsStatus(ids: string[], status: 'approved' | 'rejected'): number {
    let count = 0;
    this.data.reviews.forEach(r => {
      if (ids.includes(r.id)) {
        r.status = status;
        r.updatedAt = new Date().toISOString();
        count++;
      }
    });
    if (count > 0) this.save();
    return count;
  }

  // ==========================================
  // BANNERS
  // ==========================================

  public getBanners(includeInactive: boolean = false): DbBanner[] {
    let list = this.data.banners;
    if (!includeInactive) {
      list = list.filter(b => b.isActive !== false);
    }
    return list.sort((a, b) => a.order - b.order);
  }

  public createBanner(banner: Omit<DbBanner, 'id' | 'createdAt' | 'updatedAt'>): DbBanner {
    const newBanner: DbBanner = {
      ...banner,
      id: `ban-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.banners.push(newBanner);
    this.save();
    return newBanner;
  }

  public updateBanner(id: string, updates: Partial<DbBanner>): DbBanner | null {
    const idx = this.data.banners.findIndex(b => b.id === id);
    if (idx === -1) return null;
    this.data.banners[idx] = {
      ...this.data.banners[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.banners[idx];
  }

  public deleteBanner(id: string): boolean {
    const before = this.data.banners.length;
    this.data.banners = this.data.banners.filter(b => b.id !== id);
    const deleted = this.data.banners.length < before;
    if (deleted) this.save();
    return deleted;
  }

  public toggleBanner(id: string): DbBanner | null {
    const b = this.data.banners.find(x => x.id === id);
    if (!b) return null;
    b.isActive = !b.isActive;
    b.updatedAt = new Date().toISOString();
    this.save();
    return b;
  }

  // ==========================================
  // CONTACT MESSAGES
  // ==========================================

  public getContactMessages(filter?: { status?: string; search?: string; page?: number; limit?: number }) {
    let list = [...this.data.contactMessages];

    if (filter?.status && filter.status !== 'all') {
      list = list.filter(m => m.status === filter.status);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        m =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.subject.toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q)
      );
    }

    const total = list.length;
    const page = Math.max(1, Number(filter?.page || 1));
    const limit = Math.max(1, Number(filter?.limit || 20));
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      messages: paginated,
      total,
      page,
      limit,
      totalPages,
      unreadCount: this.data.contactMessages.filter(m => m.status === 'new').length
    };
  }

  public createContactMessage(data: Omit<DbContactMessage, 'id' | 'date' | 'status' | 'createdAt'>): DbContactMessage {
    const newMsg: DbContactMessage = {
      ...data,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString(),
      status: 'new',
      createdAt: new Date().toISOString()
    };
    this.data.contactMessages.unshift(newMsg);

    this.createNotification(
      'message',
      'New Client Inquiry',
      `${newMsg.name} sent message: "${newMsg.subject}"`,
      '/admin/contact-messages'
    );

    this.save();
    return newMsg;
  }

  public updateContactMessageStatus(
    id: string,
    status: DbContactMessage['status'],
    replyNotes?: string
  ): DbContactMessage | null {
    const msg = this.data.contactMessages.find(m => m.id === id);
    if (!msg) return null;
    msg.status = status;
    if (replyNotes !== undefined) msg.replyNotes = replyNotes;
    this.save();
    return msg;
  }

  public deleteContactMessage(id: string): boolean {
    const before = this.data.contactMessages.length;
    this.data.contactMessages = this.data.contactMessages.filter(m => m.id !== id);
    const deleted = this.data.contactMessages.length < before;
    if (deleted) this.save();
    return deleted;
  }

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  public getNotifications(unreadOnly: boolean = false): { notifications: DbAdminNotification[]; unreadCount: number } {
    let list = this.data.notifications;
    const unreadCount = list.filter(n => !n.isRead).length;
    if (unreadOnly) {
      list = list.filter(n => !n.isRead);
    }
    return { notifications: list.slice(0, 30), unreadCount };
  }

  public createNotification(
    type: DbAdminNotification['type'],
    title: string,
    message: string,
    link?: string
  ): DbAdminNotification {
    const notif: DbAdminNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      title,
      message,
      isRead: false,
      link,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(notif);
    // Keep max 100 notifications
    if (this.data.notifications.length > 100) {
      this.data.notifications = this.data.notifications.slice(0, 100);
    }
    this.save();
    return notif;
  }

  public markNotificationRead(id: string): boolean {
    const n = this.data.notifications.find(x => x.id === id);
    if (n) {
      n.isRead = true;
      this.save();
      return true;
    }
    return false;
  }

  public markAllNotificationsRead(): void {
    this.data.notifications.forEach(n => (n.isRead = true));
    this.save();
  }

  // ==========================================
  // STORE SETTINGS
  // ==========================================

  public getStoreSettings(): DbStoreSettings {
    return this.data.storeSettings;
  }

  public updateStoreSettings(updates: Partial<DbStoreSettings>): DbStoreSettings {
    this.data.storeSettings = {
      ...this.data.storeSettings,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.storeSettings;
  }

  // ==========================================
  // AUDIT LOG
  // ==========================================

  public logAudit(
    adminId: string,
    adminEmail: string,
    adminName: string,
    action: string,
    resource: string,
    resourceId?: string,
    details?: string,
    ip?: string
  ): DbAuditLog {
    const entry: DbAuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      adminId,
      adminEmail,
      adminName,
      action,
      resource,
      resourceId,
      details,
      timestamp: new Date().toISOString(),
      ip
    };
    this.data.auditLogs.unshift(entry);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.save();
    return entry;
  }

  public getAuditLogs(filter?: { page?: number; limit?: number }) {
    const total = this.data.auditLogs.length;
    const page = Math.max(1, Number(filter?.page || 1));
    const limit = Math.max(1, Number(filter?.limit || 25));
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = this.data.auditLogs.slice((page - 1) * limit, page * limit);

    return {
      logs: paginated,
      total,
      page,
      limit,
      totalPages
    };
  }

  // ==========================================
  // GLOBAL SEARCH ACROSS ADMIN ENTITIES
  // ==========================================

  public searchAdmin(query: string) {
    const q = query.toLowerCase().trim();
    if (!q) return { products: [], orders: [], customers: [], coupons: [] };

    const products = this.data.products
      .filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
      .slice(0, 5)
      .map(p => ({ id: p.id, name: p.name, sku: p.sku, price: p.price, stock: p.stock, image: p.images[0] || '' }));

    const orders = this.data.orders
      .filter(o => o.orderNumber.toLowerCase().includes(q) || o.userName.toLowerCase().includes(q) || o.userEmail.toLowerCase().includes(q))
      .slice(0, 5)
      .map(o => ({ id: o.id, orderNumber: o.orderNumber, userName: o.userName, total: o.total, status: o.orderStatus }));

    const customers = this.data.users
      .filter(u => u.role === 'user' && (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)))
      .slice(0, 5)
      .map(u => ({ id: u.id, name: u.name, email: u.email, isActive: u.isActive }));

    const coupons = this.data.coupons
      .filter(c => c.code.toLowerCase().includes(q))
      .slice(0, 5)
      .map(c => ({ id: c.id, code: c.code, discountValue: c.discountValue, active: c.active }));

    return { products, orders, customers, coupons };
  }

  // ==========================================
  // DASHBOARD STATS & REAL ANALYTICS
  // ==========================================

  public getAdminDashboardStats() {
    const nonCancelledOrders = this.data.orders.filter(o => o.orderStatus !== 'Cancelled');
    const totalSales = nonCancelledOrders.reduce((sum, o) => sum + o.total, 0);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
    const monthStart = todayStart - 30 * 24 * 60 * 60 * 1000;

    let todayRevenue = 0;
    let weekRevenue = 0;
    let monthRevenue = 0;

    nonCancelledOrders.forEach(o => {
      const orderTime = new Date(o.createdAt).getTime();
      if (orderTime >= todayStart) todayRevenue += o.total;
      if (orderTime >= weekStart) weekRevenue += o.total;
      if (orderTime >= monthStart) monthRevenue += o.total;
    });

    const totalOrders = this.data.orders.length;
    const pendingOrders = this.data.orders.filter(o => o.orderStatus === 'Pending' || o.orderStatus === 'Confirmed').length;
    const processingOrders = this.data.orders.filter(o => o.orderStatus === 'Processing').length;
    const shippedOrders = this.data.orders.filter(o => o.orderStatus === 'Shipped' || o.orderStatus === 'Out for Delivery').length;
    const deliveredOrders = this.data.orders.filter(o => o.orderStatus === 'Delivered').length;
    const cancelledOrders = this.data.orders.filter(o => o.orderStatus === 'Cancelled').length;
    const refundedOrders = this.data.orders.filter(o => o.orderStatus === 'Refunded').length;

    const customers = this.data.users.filter(u => u.role === 'user');
    const totalCustomers = customers.length;
    const newCustomers = customers.filter(u => new Date(u.createdAt).getTime() >= monthStart).length;

    const totalProducts = this.data.products.length;
    const activeProducts = this.data.products.filter(p => p.isActive).length;
    const outOfStockProducts = this.data.products.filter(p => p.stock === 0).length;
    const lowStockProducts = this.data.products.filter(
      p => p.stock > 0 && p.stock <= (p.lowStockThreshold || this.data.storeSettings.lowStockThreshold || 5)
    ).length;

    const totalReviews = this.data.reviews.length;
    const pendingReviews = this.data.reviews.filter(r => r.status === 'pending').length;

    const successfulPayments = this.data.payments.filter(p => p.status === 'Paid').length;
    const failedPayments = this.data.payments.filter(p => p.status === 'Failed').length;
    const refundsCount = this.data.payments.filter(p => p.status === 'Refunded').length;

    return {
      totalSales,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      refundedOrders,
      totalCustomers,
      newCustomers,
      totalProducts,
      activeProducts,
      outOfStockProducts,
      lowStockProducts,
      totalReviews,
      pendingReviews,
      successfulPayments,
      failedPayments,
      refundsCount
    };
  }

  public getAnalytics(range: 'today' | '7d' | '30d' | '3m' | '6m' | '1y' = '30d') {
    const now = new Date();
    let days = 30;
    if (range === 'today') days = 1;
    else if (range === '7d') days = 7;
    else if (range === '30d') days = 30;
    else if (range === '3m') days = 90;
    else if (range === '6m') days = 180;
    else if (range === '1y') days = 365;

    const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

    // Time-series breakdown
    const dayBuckets: Record<string, { date: string; revenue: number; orders: number }> = {};

    // Pre-populate empty days
    const numBuckets = Math.min(days, 30);
    const step = Math.max(1, Math.floor(days / numBuckets));
    for (let i = numBuckets - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * step * 24 * 60 * 60 * 1000);
      const label = d.toISOString().split('T')[0];
      dayBuckets[label] = { date: label, revenue: 0, orders: 0 };
    }

    this.data.orders.forEach(o => {
      const oTime = new Date(o.createdAt).getTime();
      if (oTime >= startTime && o.orderStatus !== 'Cancelled') {
        const label = o.createdAt.split('T')[0];
        if (!dayBuckets[label]) {
          dayBuckets[label] = { date: label, revenue: 0, orders: 0 };
        }
        dayBuckets[label].revenue += o.total;
        dayBuckets[label].orders += 1;
      }
    });

    const timeline = Object.values(dayBuckets).sort((a, b) => a.date.localeCompare(b.date));

    // Top Selling Products
    const productSalesMap: Record<string, { unitsSold: number; revenue: number }> = {};
    this.data.orders.forEach(o => {
      if (o.orderStatus !== 'Cancelled') {
        o.items.forEach(item => {
          if (!productSalesMap[item.productId]) {
            productSalesMap[item.productId] = { unitsSold: 0, revenue: 0 };
          }
          productSalesMap[item.productId].unitsSold += item.quantity;
          productSalesMap[item.productId].revenue += item.price * item.quantity;
        });
      }
    });

    const topProducts = Object.entries(productSalesMap)
      .map(([productId, stats]) => {
        const prod = this.getProductById(productId);
        return {
          productId,
          name: prod ? prod.name : 'Unknown Product',
          sku: prod ? prod.sku : '',
          category: prod ? prod.category : '',
          stock: prod ? prod.stock : 0,
          image: prod?.images[0] || '',
          unitsSold: stats.unitsSold,
          revenue: stats.revenue
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Customer growth
    const newCustomersCount = this.data.users.filter(
      u => u.role === 'user' && new Date(u.createdAt).getTime() >= startTime
    ).length;

    // Payment statuses
    const paymentsByStatus = {
      paid: this.data.payments.filter(p => p.status === 'Paid').length,
      pending: this.data.payments.filter(p => p.status === 'Pending').length,
      failed: this.data.payments.filter(p => p.status === 'Failed').length,
      refunded: this.data.payments.filter(p => p.status === 'Refunded').length
    };

    return {
      range,
      days,
      timeline,
      topProducts,
      newCustomersCount,
      paymentsByStatus
    };
  }

  // ==========================================
  // NEWSLETTER
  // ==========================================

  public getNewsletterSubscribers() {
    return this.data.newsletter.map(n => ({
      email: n.email,
      createdAt: n.subscribedAt,
      subscribedAt: n.subscribedAt
    }));
  }

  public addNewsletterSubscriber(email: string): boolean {
    const cleanEmail = email.toLowerCase().trim();
    if (this.data.newsletter.some(n => n.email === cleanEmail)) {
      return false;
    }
    this.data.newsletter.push({
      id: `sub-${Date.now()}`,
      email: cleanEmail,
      subscribedAt: new Date().toISOString()
    });
    this.save();
    return true;
  }
}

export const db = new VelourDatabase();
