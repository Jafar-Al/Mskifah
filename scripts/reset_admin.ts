
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resetAdmin() {
    const db = await open({
        filename: path.join(__dirname, '../server/database.sqlite'),
        driver: sqlite3.Database
    });

    const email = 'admin@kifahbiology.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if admin exists
    const existing = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (existing) {
        console.log('Updating existing admin password and role...');
        await db.run('UPDATE users SET password_hash = ?, role = ? WHERE email = ?', [hashedPassword, 'admin', email]);
    } else {
        console.log('Creating new admin user...');
        await db.run(
            'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
            [crypto.randomUUID(), 'Admin User', email, hashedPassword, 'admin']
        );
    }

    console.log('✅ Admin credentials set to:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
}

resetAdmin().catch(console.error);
