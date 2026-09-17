export type Role = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  googleId?: string;
  role: Role;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  ordersCount?: number;
  totalSpent?: number;
}

export type Gender = 'women' | 'men' | 'unisex';

export interface Product {
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
  gender: Gender;
  sizes: string[];
  colors: string[];
  stock: number;
  lowStockThreshold?: number;
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

export interface CartItem {
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

export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  salePrice?: number;
  image: string;
  category: string;
  gender: Gender;
  stock: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Refunded';

export type PaymentStatus = 'Pending' | 'Processing' | 'Paid' | 'Failed' | 'Refunded';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
}

export interface OrderTimelineItem {
  status: string;
  note: string;
  timestamp: string;
  updatedBy?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: 'Cash on Delivery' | 'Credit Card' | 'Stripe' | 'Bank Transfer';
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  status?: OrderStatus;
  subtotal: number;
  shipping: number;
  discount: number;
  discountCode?: string;
  tax?: number;
  total: number;
  notes?: string;
  timeline?: OrderTimelineItem[];
  refundAmount?: number;
  refundReason?: string;
  refundDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  gender: Gender;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrder: number;
  minOrderValue?: number;
  maximumDiscount?: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  expiryDate: string;
  validUntil?: string;
  active: boolean;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  customerId: string;
  customerName: string;
  userName?: string;
  customerEmail: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
}

export interface InventoryTransaction {
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

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  provider: string;
  status: PaymentStatus;
  transactionRef: string;
  createdAt: string;
  refundAmount?: number;
  refundDate?: string;
  refundReason?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  buttonText: string;
  ctaText?: string;
  buttonUrl: string;
  link?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  status: 'new' | 'unread' | 'read' | 'replied' | 'archived';
  replyNotes?: string;
  createdAt: string;
}

export interface AdminNotification {
  id: string;
  type: 'order' | 'stock' | 'customer' | 'review' | 'payment' | 'message';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline?: string;
  storeLogo?: string;
  storeEmail?: string;
  supportEmail?: string;
  contactEmail?: string;
  contactPhone?: string;
  phone?: string;
  whatsapp?: string;
  currency: string;
  currencySymbol?: string;
  timezone?: string;
  lowStockThreshold?: number;
  standardShippingFee?: number;
  flatShippingRate?: number;
  freeShippingThreshold: number;
  taxRate: number;
  socialInstagram?: string;
  socialTwitter?: string;
  socialFacebook?: string;
  announcementText?: string;
  announcementActive?: boolean;
  maintenanceMode?: boolean;
  updatedAt?: string;
}

export interface AuditLog {
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

export interface AdminStats {
  totalSales: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  totalCustomers: number;
  newCustomers: number;
  totalProducts: number;
  activeProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  totalReviews: number;
  pendingReviews: number;
  successfulPayments: number;
  failedPayments: number;
  refundsCount: number;
}

