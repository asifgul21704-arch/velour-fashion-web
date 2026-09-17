import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import cors from 'cors';
import { db, DbUser, DbOrder } from './server/db.js';

dotenv.config();

const app = express();
const PORT = 3000;
const AUTH_SECRET = process.env.AUTH_SECRET || 'velour-super-secret-jwt-key-change-in-production';
const COOKIE_NAME = 'velour_token';

// Extend Express Request to carry authenticated user
export interface AuthRequest extends Request {
  user?: DbUser;
}

// Configurable CORS handling for local dev, Vercel deployments, and custom frontends
const customFrontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '');
const customAppUrl = process.env.APP_URL?.replace(/\/$/, '');

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, curl, server-to-server) or same-origin
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      customFrontendUrl,
      customAppUrl,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5000'
    ].filter(Boolean) as string[];

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Automatically allow Vercel production and preview domains (*.vercel.app)
    if (/^https:\/\/[a-zA-Z0-9-_.]+\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    // If FRONTEND_URL is not set or in dev, allow origin
    if (!customFrontendUrl || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    store: 'VELOUR Fashion',
    database: process.env.MONGODB_URI ? 'MongoDB (Mongoose)' : 'Local File JSON (Resilient Engine)',
    timestamp: new Date().toISOString()
  });
});

// Security & isolation auth token extraction
function extractUserFromReq(req: AuthRequest): DbUser | null {
  const token = req.cookies?.[COOKIE_NAME] || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, AUTH_SECRET) as { userId: string };
    const user = db.findUserById(decoded.userId);
    if (!user || !user.isActive) return null;
    return user;
  } catch (err) {
    return null;
  }
}

// Global user attachment middleware
app.use((req: AuthRequest, _res: Response, next: NextFunction) => {
  req.user = extractUserFromReq(req) || undefined;
  next();
});

// Guard middleware
function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  next();
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access forbidden. Administrator credentials required.' });
  }
  next();
}

// Helper: generate session cookie
function sendAuthCookie(res: Response, user: DbUser) {
  const token = jwt.sign({ userId: user.id, role: user.role }, AUTH_SECRET, { expiresIn: '7d' });
  try {
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  } catch (e) {
    // Non-blocking cookie set
  }
  return token;
}

// Helper to determine cart & session identity
function getClientIdentifier(req: AuthRequest): string {
  if (req.user?.id) {
    return req.user.id;
  }
  const sessionHeader = req.headers['x-session-id'] as string;
  const sessionCookie = req.cookies?.['velour_session_id'];
  const sid = sessionHeader || sessionCookie || 'default_visitor';
  return sid.startsWith('guest_') ? sid : `guest_${sid}`;
}

// Helper: safe user serializer
function serializeUser(user: DbUser) {
  const { passwordHash, ...safe } = user;
  return safe;
}

// Helper: log audit entries
function audit(
  req: AuthRequest,
  action: string,
  resource: string,
  resourceId?: string,
  details?: string
) {
  if (!req.user) return;
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
  db.logAudit(req.user.id, req.user.email, req.user.name, action, resource, resourceId, details, ip);
}

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// Current logged in user check
app.get('/api/auth/me', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.json({ user: null });
  }
  res.json({ user: serializeUser(req.user) });
});

// Signup
app.post('/api/auth/signup', (req: Request, res: Response) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  const existing = db.findUserByEmail(cleanEmail);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser = db.createUser({
    name: name.trim(),
    email: cleanEmail,
    passwordHash,
    role: 'user',
    isActive: true
  });

  const token = sendAuthCookie(res, newUser);
  res.status(201).json({ user: serializeUser(newUser), token });
});

// Signin
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db.findUserByEmail(cleanEmail);

  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'This account has been deactivated. Please contact support.' });
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = sendAuthCookie(res, user);
  res.json({ user: serializeUser(user), token });
});

// Admin-specific Login endpoint
app.post('/api/auth/admin-login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db.findUserByEmail(cleanEmail);

  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: 'Invalid administrator credentials.' });
  }

  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Account is not an authorized administrator.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'This administrator account has been disabled.' });
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid administrator credentials.' });
  }

  const token = sendAuthCookie(res, user);
  res.json({ user: serializeUser(user), token });
});

// Signout
app.post('/api/auth/logout', (_req: Request, res: Response) => {
  try {
    res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: true, sameSite: 'none' });
  } catch (e) {
    // Non-blocking
  }
  res.json({ success: true });
});

// Google OAuth config
app.get('/api/auth/google/config', (_req: Request, res: Response) => {
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
  const configured = Boolean(clientId);
  const baseAppUrl = (process.env.APP_URL || process.env.FRONTEND_URL || '').replace(/\/$/, '');
  res.json({
    configured,
    clientId,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || (baseAppUrl ? `${baseAppUrl}/api/auth/google/callback` : '/api/auth/google/callback')
  });
});

// Google Sign-In handler
app.post('/api/auth/google', (req: Request, res: Response) => {
  const { googleId, email, name, avatar, credential } = req.body;

  let verifiedEmail = email;
  let verifiedName = name;
  let verifiedGoogleId = googleId;
  let verifiedAvatar = avatar;

  if (credential) {
    try {
      const parts = credential.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        verifiedEmail = payload.email;
        verifiedName = payload.name;
        verifiedGoogleId = payload.sub;
        verifiedAvatar = payload.picture;
      }
    } catch (e) {
      console.warn('Failed to parse Google credential JWT', e);
    }
  }

  if (!verifiedEmail) {
    return res.status(400).json({ error: 'Could not obtain email from Google Sign-In.' });
  }

  const cleanEmail = verifiedEmail.toLowerCase().trim();
  let user = db.findUserByEmail(cleanEmail);

  if (user) {
    if (!user.googleId) {
      db.updateUser(user.id, { googleId: verifiedGoogleId, avatar: verifiedAvatar || user.avatar });
      user = db.findUserById(user.id)!;
    }
  } else {
    user = db.createUser({
      name: verifiedName || 'Google Fashion Enthusiast',
      email: cleanEmail,
      passwordHash: '',
      googleId: verifiedGoogleId,
      avatar: verifiedAvatar,
      role: 'user',
      isActive: true
    });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'This account has been deactivated.' });
  }

  const token = sendAuthCookie(res, user);
  res.json({ user: serializeUser(user), token });
});

// ==========================================
// 2. PRODUCT CATALOG ENDPOINTS (Storefront)
// ==========================================

app.get('/api/products', (req: Request, res: Response) => {
  try {
    const { gender, category, q, minPrice, maxPrice, size, color, sort, featured, newArrival, inStock } = req.query;

    const result = db.getProducts({
      gender: gender as any,
      category: category as string,
      search: q as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      size: size as string,
      color: color as string,
      featured: featured === 'true',
      newArrival: newArrival === 'true',
      inStockOnly: inStock === 'true',
      sort: sort as any
    });

    res.json({ products: result.products, count: result.total });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching products' });
  }
});

app.get('/api/products/:id', (req: Request, res: Response) => {
  const product = db.getProductById(req.params.id);
  if (!product || !product.isActive) {
    return res.status(404).json({ error: 'Product not found or unavailable' });
  }
  res.json({ product });
});

app.get('/api/categories', (_req: Request, res: Response) => {
  res.json({ categories: db.getCategories() });
});

app.get('/api/banners', (_req: Request, res: Response) => {
  res.json({ banners: db.getBanners(false) });
});

app.get('/api/settings', (_req: Request, res: Response) => {
  res.json({ settings: db.getStoreSettings() });
});

// ==========================================
// 3. CART ENDPOINTS
// ==========================================

app.get('/api/cart', (req: AuthRequest, res: Response) => {
  const ownerId = getClientIdentifier(req);
  const cart = db.getCart(ownerId);
  res.json({ cart });
});

app.post('/api/cart/add', (req: AuthRequest, res: Response) => {
  const { productId, size, color, quantity = 1 } = req.body;

  if (!productId || !size || !color) {
    return res.status(400).json({ error: 'Please select both a size and color before adding to cart.' });
  }

  try {
    const ownerId = getClientIdentifier(req);
    const cart = db.addToCart(ownerId, {
      productId,
      size,
      color,
      quantity: Math.max(1, Number(quantity))
    });
    res.json({ cart, success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Could not add to cart' });
  }
});

app.patch('/api/cart/update', (req: AuthRequest, res: Response) => {
  const { productId, size, color, quantity } = req.body;

  if (!productId || !size || !color || quantity === undefined) {
    return res.status(400).json({ error: 'Invalid cart update parameters' });
  }

  try {
    const ownerId = getClientIdentifier(req);
    const cart = db.updateCartItem(ownerId, productId, size, color, Number(quantity));
    res.json({ cart, success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Could not update cart item' });
  }
});

app.delete('/api/cart/remove', (req: AuthRequest, res: Response) => {
  const { productId, size, color } = req.body;

  if (!productId || !size || !color) {
    return res.status(400).json({ error: 'Item identifiers are required' });
  }

  const ownerId = getClientIdentifier(req);
  const cart = db.removeFromCart(ownerId, productId, size, color);
  res.json({ cart, success: true });
});

app.delete('/api/cart/clear', (req: AuthRequest, res: Response) => {
  const ownerId = getClientIdentifier(req);
  db.clearCart(ownerId);
  res.json({ success: true, cart: { userId: ownerId, items: [] } });
});

app.post('/api/cart/merge', requireAuth, (req: AuthRequest, res: Response) => {
  const { guestItems = [] } = req.body;
  if (Array.isArray(guestItems) && guestItems.length > 0) {
    const cart = db.mergeCart(req.user!.id, guestItems);
    return res.json({ cart, success: true });
  }
  const cart = db.getCart(req.user!.id);
  res.json({ cart, success: true });
});

// ==========================================
// 4. WISHLIST ENDPOINTS
// ==========================================

app.get('/api/wishlist', (req: AuthRequest, res: Response) => {
  const ownerId = getClientIdentifier(req);
  const productIds = db.getWishlist(ownerId);
  const products = productIds
    .map(id => db.getProductById(id))
    .filter((p): p is NonNullable<typeof p> => !!p && p.isActive);
  res.json({ productIds, products });
});

app.post('/api/wishlist/toggle', (req: AuthRequest, res: Response) => {
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ error: 'productId is required' });
  }

  const ownerId = getClientIdentifier(req);
  const result = db.toggleWishlist(ownerId, productId);
  res.json(result);
});

// ==========================================
// 5. CHECKOUT, ORDERS & COUPONS (Storefront)
// ==========================================

// Validate Coupon
app.post('/api/coupons/validate', (req: Request, res: Response) => {
  const { code, subtotal } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Voucher code is required' });
  }
  const result = db.validateCoupon(code, Number(subtotal || 0));
  res.json(result);
});

// Place Order
app.post('/api/orders', (req: AuthRequest, res: Response) => {
  const { shippingAddress, paymentMethod, discountCode, guestItems, notes } = req.body;

  if (!shippingAddress) {
    return res.status(400).json({ error: 'Shipping address is required.' });
  }

  const requiredFields = ['fullName', 'phone', 'email', 'address', 'city', 'postalCode', 'country'];
  for (const field of requiredFields) {
    if (!shippingAddress[field]?.trim()) {
      return res.status(400).json({ error: `Shipping field "${field}" is required.` });
    }
  }

  try {
    const ownerId = getClientIdentifier(req);

    if (Array.isArray(guestItems) && guestItems.length > 0) {
      db.mergeCart(ownerId, guestItems);
    }

    const order = db.createOrder({
      userId: req.user ? req.user.id : ownerId,
      userName: req.user ? req.user.name : shippingAddress.fullName.trim(),
      userEmail: req.user ? req.user.email : shippingAddress.email.trim(),
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        phone: shippingAddress.phone.trim(),
        email: shippingAddress.email.trim(),
        address: shippingAddress.address.trim(),
        city: shippingAddress.city.trim(),
        postalCode: shippingAddress.postalCode.trim(),
        country: shippingAddress.country.trim()
      },
      paymentMethod,
      discountCode,
      notes
    });

    res.status(201).json({ order, success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Could not place order.' });
  }
});

const getUserOrders = (req: AuthRequest, res: Response) => {
  const ownerId = getClientIdentifier(req);
  const targetId = req.user ? req.user.id : ownerId;
  const orders = db.getOrdersByUserId(targetId);
  res.json({ orders });
};

app.get('/api/orders/my-orders', requireAuth, getUserOrders);
app.get('/api/orders', requireAuth, getUserOrders);

app.get('/api/orders/:id', (req: AuthRequest, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  const ownerId = getClientIdentifier(req);
  const isOwner =
    (req.user && order.userId === req.user.id) ||
    order.userId === ownerId ||
    order.userId.startsWith('guest_') ||
    order.userEmail.toLowerCase() === req.user?.email.toLowerCase();
  const isAdmin = req.user?.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Access denied to this order.' });
  }

  res.json({ order });
});

// ==========================================
// 6. REVIEWS & CONTACT (Storefront)
// ==========================================

app.get('/api/reviews/product/:productId', (req: Request, res: Response) => {
  const reviews = db.getProductApprovedReviews(req.params.productId);
  res.json({ reviews });
});

app.post('/api/reviews', (req: AuthRequest, res: Response) => {
  const { productId, rating, comment, customerName, customerEmail } = req.body;

  if (!productId || !rating || !comment?.trim()) {
    return res.status(400).json({ error: 'Product ID, rating, and comment are required.' });
  }

  const name = req.user ? req.user.name : customerName?.trim();
  const email = req.user ? req.user.email : customerEmail?.trim();

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required to submit a review.' });
  }

  const review = db.createReview({
    productId,
    productName: '',
    customerId: req.user ? req.user.id : 'guest',
    customerName: name,
    customerEmail: email,
    rating: Math.min(5, Math.max(1, Number(rating))),
    comment: comment.trim()
  });

  res.status(201).json({
    review,
    message: 'Thank you. Your review has been submitted for atelier moderation.'
  });
});

app.post('/api/contact', (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;
  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const contact = db.createContactMessage({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    subject: subject.trim(),
    message: message.trim()
  });

  res.status(201).json({
    success: true,
    message: 'Your inquiry has been received by the VELOUR concierge.',
    contact
  });
});

// ==========================================
// 7. USER PROFILE & NEWSLETTER
// ==========================================

app.get('/api/profile', requireAuth, (req: AuthRequest, res: Response) => {
  res.json({ profile: serializeUser(req.user!) });
});

app.patch('/api/profile', requireAuth, (req: AuthRequest, res: Response) => {
  const { name, phone, address, city, country } = req.body;

  const updates: Partial<DbUser> = {};
  if (name !== undefined) updates.name = name.trim();
  if (phone !== undefined) updates.phone = phone.trim();
  if (address !== undefined) updates.address = address.trim();
  if (city !== undefined) updates.city = city.trim();
  if (country !== undefined) updates.country = country.trim();

  const updatedUser = db.updateUser(req.user!.id, updates);
  if (!updatedUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user: serializeUser(updatedUser), success: true });
});

app.post('/api/newsletter', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const added = db.addNewsletterSubscriber(email);
  if (!added) {
    return res.json({ success: true, message: 'You are already subscribed to the Velour dispatch.' });
  }

  res.json({ success: true, message: 'Thank you for subscribing to Velour Atelier dispatches.' });
});

// ==========================================
// 8. ADMIN DASHBOARD & MANAGEMENT (Protected: role === 'admin')
// ==========================================

// Global admin search
app.get('/api/admin/search', requireAdmin, (req: AuthRequest, res: Response) => {
  const query = (req.query.q as string) || '';
  const results = db.searchAdmin(query);
  res.json(results);
});

// Admin stats
app.get('/api/admin/stats', requireAdmin, (_req: AuthRequest, res: Response) => {
  const stats = db.getAdminDashboardStats();
  res.json({ stats });
});

// Admin real analytics
app.get('/api/admin/analytics', requireAdmin, (req: AuthRequest, res: Response) => {
  const range = (req.query.range as any) || '30d';
  const analytics = db.getAnalytics(range);
  res.json({ analytics });
});

// Admin audit logs
app.get('/api/admin/audit-logs', requireAdmin, (req: AuthRequest, res: Response) => {
  const { page, limit } = req.query;
  const result = db.getAuditLogs({ page: Number(page), limit: Number(limit) });
  res.json(result);
});

// --- ADMIN PRODUCTS ---
app.get('/api/admin/products', requireAdmin, (req: AuthRequest, res: Response) => {
  const { search, category, gender, stockStatus, page, limit } = req.query;
  const result = db.getProducts({
    includeInactive: true,
    search: search as string,
    category: category as string,
    gender: gender as any,
    stockStatus: stockStatus as any,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined
  });
  res.json(result);
});

app.post('/api/admin/products', requireAdmin, (req: AuthRequest, res: Response) => {
  const {
    name,
    slug,
    description,
    shortDescription,
    price,
    salePrice,
    images,
    category,
    subCategory,
    gender,
    sizes,
    colors,
    stock,
    lowStockThreshold,
    sku,
    brand,
    featured,
    newArrival,
    isActive,
    tags,
    weight
  } = req.body;

  if (!name?.trim() || !category || !gender || price === undefined) {
    return res.status(400).json({ error: 'Name, category, gender, and price are required.' });
  }

  try {
    const generatedSlug =
      slug?.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const newProduct = db.createProduct(
      {
        name: name.trim(),
        slug: generatedSlug,
        description: description || '',
        shortDescription: shortDescription || '',
        price: Number(price),
        salePrice: salePrice ? Number(salePrice) : undefined,
        images:
          Array.isArray(images) && images.length
            ? images
            : ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=85'],
        category,
        subCategory,
        gender,
        sizes: Array.isArray(sizes) && sizes.length ? sizes : ['S', 'M', 'L'],
        colors: Array.isArray(colors) && colors.length ? colors : ['Black'],
        stock: Number(stock ?? 10),
        lowStockThreshold: Number(lowStockThreshold ?? 5),
        sku: sku?.trim() || `VEL-${gender === 'women' ? 'W' : 'M'}-${Math.floor(1000 + Math.random() * 9000)}`,
        brand: brand?.trim() || 'VELOUR Atelier',
        featured: Boolean(featured),
        newArrival: Boolean(newArrival),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        tags: Array.isArray(tags) ? tags : [],
        weight
      },
      req.user!.name
    );

    audit(req, 'CREATE_PRODUCT', 'products', newProduct.id, `Created product "${newProduct.name}"`);
    res.status(201).json({ product: newProduct, success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Could not create product' });
  }
});

app.put('/api/admin/products/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = db.updateProduct(req.params.id, req.body, req.user!.name);
  if (!updated) {
    return res.status(404).json({ error: 'Product not found' });
  }
  audit(req, 'UPDATE_PRODUCT', 'products', updated.id, `Updated product "${updated.name}"`);
  res.json({ product: updated, success: true });
});

app.delete('/api/admin/products/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const prod = db.getProductById(req.params.id);
  const deleted = db.deleteProduct(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Product not found' });
  }
  audit(req, 'DELETE_PRODUCT', 'products', req.params.id, `Deleted product "${prod?.name || req.params.id}"`);
  res.json({ success: true });
});

app.post('/api/admin/products/:id/duplicate', requireAdmin, (req: AuthRequest, res: Response) => {
  const duplicated = db.duplicateProduct(req.params.id, req.user!.name);
  if (!duplicated) {
    return res.status(404).json({ error: 'Product not found' });
  }
  audit(req, 'DUPLICATE_PRODUCT', 'products', duplicated.id, `Duplicated to "${duplicated.name}"`);
  res.status(201).json({ product: duplicated, success: true });
});

app.post('/api/admin/products/bulk', requireAdmin, (req: AuthRequest, res: Response) => {
  const { ids, action } = req.body;
  if (!Array.isArray(ids) || !action) {
    return res.status(400).json({ error: 'IDs array and action required.' });
  }
  const affected = db.bulkUpdateProducts(ids, action);
  audit(req, `BULK_${action.toUpperCase()}_PRODUCTS`, 'products', undefined, `Bulk ${action} for ${affected} products`);
  res.json({ affected, success: true });
});

// --- ADMIN CATEGORIES ---
app.get('/api/admin/categories', requireAdmin, (_req: AuthRequest, res: Response) => {
  res.json({ categories: db.getCategories(true) });
});

app.post('/api/admin/categories', requireAdmin, (req: AuthRequest, res: Response) => {
  const { name, slug, image, gender, description, order, isActive } = req.body;
  if (!name?.trim() || !image?.trim() || !gender) {
    return res.status(400).json({ error: 'Category name, image, and gender are required.' });
  }
  const cleanSlug = slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const cat = db.createCategory({
    name: name.trim(),
    slug: cleanSlug,
    image: image.trim(),
    gender,
    description: description?.trim(),
    order: Number(order || 0),
    isActive: isActive !== undefined ? Boolean(isActive) : true
  });
  audit(req, 'CREATE_CATEGORY', 'categories', cat.id, `Created category "${cat.name}"`);
  res.status(201).json({ category: cat, success: true });
});

app.put('/api/admin/categories/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = db.updateCategory(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Category not found' });
  }
  audit(req, 'UPDATE_CATEGORY', 'categories', updated.id, `Updated category "${updated.name}"`);
  res.json({ category: updated, success: true });
});

app.delete('/api/admin/categories/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const deleted = db.deleteCategory(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Category not found' });
  }
  audit(req, 'DELETE_CATEGORY', 'categories', req.params.id, `Deleted category ${req.params.id}`);
  res.json({ success: true });
});

app.patch('/api/admin/categories/:id/toggle', requireAdmin, (req: AuthRequest, res: Response) => {
  const toggled = db.toggleCategoryActive(req.params.id);
  if (!toggled) {
    return res.status(404).json({ error: 'Category not found' });
  }
  audit(req, 'TOGGLE_CATEGORY', 'categories', toggled.id, `Toggled active state to ${toggled.isActive}`);
  res.json({ category: toggled, success: true });
});

// --- ADMIN INVENTORY ---
app.get('/api/admin/inventory', requireAdmin, (req: AuthRequest, res: Response) => {
  const { search, status, page, limit } = req.query;
  const result = db.getInventory({
    search: search as string,
    status: status as any,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined
  });
  res.json(result);
});

app.post('/api/admin/inventory/adjust', requireAdmin, (req: AuthRequest, res: Response) => {
  const { productId, quantityChange, type, reason } = req.body;
  if (!productId || quantityChange === undefined || !type) {
    return res.status(400).json({ error: 'Product ID, quantityChange, and type are required.' });
  }
  try {
    const result = db.adjustInventory(
      productId,
      Number(quantityChange),
      type,
      reason || 'Manual administrative stock update',
      req.user!.name
    );
    audit(
      req,
      'ADJUST_INVENTORY',
      'inventory',
      productId,
      `Adjusted stock for ${result.product.name} by ${quantityChange} (${type})`
    );
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Could not adjust inventory' });
  }
});

app.get('/api/admin/inventory/transactions', requireAdmin, (req: AuthRequest, res: Response) => {
  const { productId, limit } = req.query;
  const transactions = db.getInventoryTransactions(
    productId as string,
    limit ? Number(limit) : 50
  );
  res.json({ transactions });
});

// --- ADMIN ORDERS ---
app.get('/api/admin/orders', requireAdmin, (req: AuthRequest, res: Response) => {
  const { status, search, page, limit } = req.query;
  const result = db.getAllOrders({
    status: status as string,
    search: search as string,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined
  });
  res.json(result);
});

app.get('/api/admin/orders/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json({ order });
});

const updateOrderStatusHandler = (req: AuthRequest, res: Response) => {
  const { status, orderStatus, paymentStatus, note } = req.body;
  const targetStatus = status || orderStatus;
  const updatedOrder = db.updateOrderStatus(
    req.params.id,
    targetStatus,
    paymentStatus,
    note,
    req.user!.name
  );
  if (!updatedOrder) {
    return res.status(404).json({ error: 'Order not found' });
  }
  audit(
    req,
    'UPDATE_ORDER_STATUS',
    'orders',
    updatedOrder.id,
    `Order #${updatedOrder.orderNumber} status changed to ${targetStatus || updatedOrder.orderStatus}`
  );
  res.json({ order: updatedOrder, success: true });
};

app.patch('/api/admin/orders/:id/status', requireAdmin, updateOrderStatusHandler);
app.put('/api/admin/orders/:id/status', requireAdmin, updateOrderStatusHandler);

app.post('/api/admin/orders/:id/refund', requireAdmin, (req: AuthRequest, res: Response) => {
  const { amount, reason } = req.body;
  const refunded = db.refundOrder(req.params.id, Number(amount), reason || 'Customer requested refund', req.user!.name);
  if (!refunded) {
    return res.status(404).json({ error: 'Order not found' });
  }
  audit(req, 'REFUND_ORDER', 'orders', refunded.id, `Issued refund of $${amount} on order #${refunded.orderNumber}`);
  res.json({ order: refunded, success: true });
});

app.post('/api/admin/orders/bulk-status', requireAdmin, (req: AuthRequest, res: Response) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || !status) {
    return res.status(400).json({ error: 'IDs array and status required' });
  }
  const affected = db.bulkUpdateOrdersStatus(ids, status, req.user!.name);
  audit(req, 'BULK_UPDATE_ORDERS', 'orders', undefined, `Updated status to ${status} for ${affected} orders`);
  res.json({ affected, success: true });
});

// --- ADMIN CUSTOMERS ---
app.get('/api/admin/customers', requireAdmin, (req: AuthRequest, res: Response) => {
  const { search, page, limit } = req.query;
  const result = db.getCustomers({
    search: search as string,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined
  });
  res.json(result);
});

app.get('/api/admin/customers/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const details = db.getCustomerDetails(req.params.id);
  if (!details) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  res.json(details);
});

app.patch('/api/admin/customers/:id/toggle', requireAdmin, (req: AuthRequest, res: Response) => {
  const targetUser = db.findUserById(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  if (targetUser.id === req.user!.id) {
    return res.status(400).json({ error: 'Cannot deactivate your own administrator account.' });
  }

  const updated = db.toggleUserActive(req.params.id);
  audit(req, 'TOGGLE_CUSTOMER', 'users', targetUser.id, `Set customer active to ${updated?.isActive}`);
  res.json({ user: serializeUser(updated!), success: true });
});

// --- ADMIN COUPONS ---
app.get('/api/admin/coupons', requireAdmin, (_req: AuthRequest, res: Response) => {
  res.json({ coupons: db.getCoupons() });
});

app.post('/api/admin/coupons', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const coupon = db.createCoupon(req.body);
    audit(req, 'CREATE_COUPON', 'coupons', coupon.id, `Created coupon "${coupon.code}"`);
    res.status(201).json({ coupon, success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Could not create coupon' });
  }
});

app.put('/api/admin/coupons/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = db.updateCoupon(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Coupon not found' });
  }
  audit(req, 'UPDATE_COUPON', 'coupons', updated.id, `Updated coupon "${updated.code}"`);
  res.json({ coupon: updated, success: true });
});

app.delete('/api/admin/coupons/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const deleted = db.deleteCoupon(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Coupon not found' });
  }
  audit(req, 'DELETE_COUPON', 'coupons', req.params.id, `Deleted coupon ${req.params.id}`);
  res.json({ success: true });
});

app.patch('/api/admin/coupons/:id/toggle', requireAdmin, (req: AuthRequest, res: Response) => {
  const coupon = db.toggleCoupon(req.params.id);
  if (!coupon) {
    return res.status(404).json({ error: 'Coupon not found' });
  }
  audit(req, 'TOGGLE_COUPON', 'coupons', coupon.id, `Toggled coupon "${coupon.code}" active to ${coupon.active}`);
  res.json({ coupon, success: true });
});

// --- ADMIN REVIEWS ---
app.get('/api/admin/reviews', requireAdmin, (req: AuthRequest, res: Response) => {
  const { status, productId, search, page, limit } = req.query;
  const result = db.getReviews({
    status: status as any,
    productId: productId as string,
    search: search as string,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined
  });
  res.json(result);
});

app.patch('/api/admin/reviews/:id/status', requireAdmin, (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Valid status required' });
  }
  const rev = db.updateReviewStatus(req.params.id, status);
  if (!rev) {
    return res.status(404).json({ error: 'Review not found' });
  }
  audit(req, 'UPDATE_REVIEW_STATUS', 'reviews', rev.id, `Review status updated to ${status}`);
  res.json({ review: rev, success: true });
});

app.delete('/api/admin/reviews/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const deleted = db.deleteReview(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Review not found' });
  }
  audit(req, 'DELETE_REVIEW', 'reviews', req.params.id, `Deleted review ${req.params.id}`);
  res.json({ success: true });
});

app.post('/api/admin/reviews/bulk', requireAdmin, (req: AuthRequest, res: Response) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || !status) {
    return res.status(400).json({ error: 'IDs array and status required' });
  }
  const affected = db.bulkUpdateReviewsStatus(ids, status);
  audit(req, 'BULK_REVIEW_STATUS', 'reviews', undefined, `Updated ${affected} reviews to ${status}`);
  res.json({ affected, success: true });
});

// --- ADMIN WISHLIST ANALYTICS ---
app.get('/api/admin/wishlist/analytics', requireAdmin, (_req: AuthRequest, res: Response) => {
  const analytics = db.getWishlistAnalytics();
  res.json(analytics);
});

// --- ADMIN PAYMENTS & REFUNDS ---
app.get('/api/admin/payments', requireAdmin, (req: AuthRequest, res: Response) => {
  const { status, provider, search, page, limit } = req.query;
  const result = db.getPayments({
    status: status as string,
    provider: provider as string,
    search: search as string,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined
  });
  res.json(result);
});

app.post('/api/admin/payments/:id/refund', requireAdmin, (req: AuthRequest, res: Response) => {
  const { amount, reason } = req.body;
  const payment = db.processPaymentRefund(
    req.params.id,
    Number(amount),
    reason || 'Administrative refund processed',
    req.user!.name
  );
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  audit(
    req,
    'REFUND_PAYMENT',
    'payments',
    payment.id,
    `Refunded payment ${payment.id} for $${amount}. Ref: ${payment.transactionRef}`
  );
  res.json({ payment, success: true });
});

// --- ADMIN BANNERS ---
app.get('/api/admin/banners', requireAdmin, (_req: AuthRequest, res: Response) => {
  res.json({ banners: db.getBanners(true) });
});

app.post('/api/admin/banners', requireAdmin, (req: AuthRequest, res: Response) => {
  const { title, subtitle, image, buttonText, buttonUrl, order, isActive } = req.body;
  if (!title?.trim() || !image?.trim()) {
    return res.status(400).json({ error: 'Title and image are required.' });
  }
  const banner = db.createBanner({
    title: title.trim(),
    subtitle: subtitle?.trim() || '',
    image: image.trim(),
    buttonText: buttonText?.trim() || 'Discover',
    buttonUrl: buttonUrl?.trim() || '/women',
    order: Number(order || 1),
    isActive: isActive !== undefined ? Boolean(isActive) : true
  });
  audit(req, 'CREATE_BANNER', 'banners', banner.id, `Created banner "${banner.title}"`);
  res.status(201).json({ banner, success: true });
});

app.put('/api/admin/banners/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = db.updateBanner(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Banner not found' });
  }
  audit(req, 'UPDATE_BANNER', 'banners', updated.id, `Updated banner "${updated.title}"`);
  res.json({ banner: updated, success: true });
});

app.delete('/api/admin/banners/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const deleted = db.deleteBanner(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Banner not found' });
  }
  audit(req, 'DELETE_BANNER', 'banners', req.params.id, `Deleted banner ${req.params.id}`);
  res.json({ success: true });
});

app.patch('/api/admin/banners/:id/toggle', requireAdmin, (req: AuthRequest, res: Response) => {
  const banner = db.toggleBanner(req.params.id);
  if (!banner) {
    return res.status(404).json({ error: 'Banner not found' });
  }
  audit(req, 'TOGGLE_BANNER', 'banners', banner.id, `Toggled banner active to ${banner.isActive}`);
  res.json({ banner, success: true });
});

// --- ADMIN CONTACT MESSAGES ---
app.get('/api/admin/contact-messages', requireAdmin, (req: AuthRequest, res: Response) => {
  const { status, search, page, limit } = req.query;
  const result = db.getContactMessages({
    status: status as string,
    search: search as string,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined
  });
  res.json(result);
});

app.patch('/api/admin/contact-messages/:id/status', requireAdmin, (req: AuthRequest, res: Response) => {
  const { status, replyNotes } = req.body;
  const msg = db.updateContactMessageStatus(req.params.id, status, replyNotes);
  if (!msg) {
    return res.status(404).json({ error: 'Message not found' });
  }
  audit(req, 'UPDATE_MESSAGE_STATUS', 'contactMessages', msg.id, `Message status updated to ${status}`);
  res.json({ message: msg, success: true });
});

app.delete('/api/admin/contact-messages/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const deleted = db.deleteContactMessage(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Message not found' });
  }
  audit(req, 'DELETE_MESSAGE', 'contactMessages', req.params.id, `Deleted message ${req.params.id}`);
  res.json({ success: true });
});

// --- ADMIN NOTIFICATIONS ---
app.get('/api/admin/notifications', requireAdmin, (req: AuthRequest, res: Response) => {
  const unreadOnly = req.query.unreadOnly === 'true';
  const result = db.getNotifications(unreadOnly);
  res.json(result);
});

app.patch('/api/admin/notifications/:id/read', requireAdmin, (req: AuthRequest, res: Response) => {
  const success = db.markNotificationRead(req.params.id);
  res.json({ success });
});

app.post('/api/admin/notifications/read-all', requireAdmin, (_req: AuthRequest, res: Response) => {
  db.markAllNotificationsRead();
  res.json({ success: true });
});

// --- ADMIN STORE SETTINGS ---
app.get('/api/admin/settings', requireAdmin, (_req: AuthRequest, res: Response) => {
  res.json({ settings: db.getStoreSettings() });
});

app.put('/api/admin/settings', requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = db.updateStoreSettings(req.body);
  audit(req, 'UPDATE_STORE_SETTINGS', 'settings', undefined, `Updated store configuration`);
  res.json({ settings: updated, success: true });
});

// --- ADMIN SUBSCRIBERS ---
app.get('/api/admin/subscribers', requireAdmin, (_req: AuthRequest, res: Response) => {
  res.json({ subscribers: db.getNewsletterSubscribers() });
});

// ==========================================
// VITE MIDDLEWARE & STATIC SERVING
// ==========================================

async function startServer() {
  app.use(express.static(path.join(process.cwd(), 'public')));

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VELOUR Fashion Server] Running on http://0.0.0.0:${PORT}`);
  });
}

// In standard server environments (Cloud Run, Docker, VPS, local dev), start server
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
if (!isServerless) {
  startServer();
}

export default app;
