import dotenv from 'dotenv';
dotenv.config();

import readline from 'readline';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question: string): Promise<string> =>
  new Promise((resolve) => rl.question(question, resolve));

async function main() {
  console.log('=== Create Admin ===\n');

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env');
    process.exit(1);
  }

  const email = await ask('Email: ');
  const username = await ask('Username: ');
  const password = await ask('Password (min 6 chars): ');

  if (!email || !username || password.length < 6) {
    console.error('Invalid input. Email, username and a password (6+ chars) are required.');
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 12);

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase
    .from('admins')
    .insert({ email, username, password_hash, role: 'superadmin' })
    .select()
    .single();

  if (error) {
    console.error('Failed to create admin:', error.message);
    process.exit(1);
  }

  console.log(`\nAdmin created successfully!`);
  console.log(`  Email: ${data.email}`);
  console.log(`  Username: ${data.username}`);
  console.log(`  Role: ${data.role}`);
  console.log('\nNow log in at http://localhost:5173');

  process.exit(0);
}

main();