import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { db } from './db.js';

dotenv.config();

function seedAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@velour.com').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';

  console.log(`[Seed Admin] Checking admin account for: ${adminEmail}`);

  const existing = db.findUserByEmail(adminEmail);
  if (existing) {
    if (existing.role !== 'admin') {
      console.log(`[Seed Admin] User exists with role '${existing.role}'. Promoting to 'admin'...`);
      db.updateUser(existing.id, {});
    } else {
      console.log(`[Seed Admin] Admin account already exists. Email: ${adminEmail}`);
    }
  } else {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(adminPassword, salt);

    const newAdmin = db.createUser({
      name: 'Velour Administrator',
      email: adminEmail,
      passwordHash,
      role: 'admin',
      isActive: true
    });

    console.log(`[Seed Admin] Successfully created new administrator:`);
    console.log(`  ID:    ${newAdmin.id}`);
    console.log(`  Email: ${newAdmin.email}`);
    console.log(`  Role:  ${newAdmin.role}`);
  }

  // Seed demo customer
  const customerEmail = 'customer@velour.com';
  if (!db.findUserByEmail(customerEmail)) {
    const custSalt = bcrypt.genSaltSync(10);
    db.createUser({
      name: 'Eleanor Vance',
      email: customerEmail,
      passwordHash: bcrypt.hashSync('CustomerPassword123!', custSalt),
      role: 'user',
      phone: '+1 (555) 234-5678',
      address: '450 Park Avenue, Apt 12B',
      city: 'New York',
      country: 'USA',
      isActive: true
    });
    console.log(`[Seed Admin] Seeded demo customer: ${customerEmail}`);
  }
}

seedAdmin();
