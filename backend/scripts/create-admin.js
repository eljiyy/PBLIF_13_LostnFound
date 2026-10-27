'use strict';
require('dotenv').config();
const readline = require('node:readline');
const bcrypt = require('bcryptjs');
const pool = require('../db');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function ask(question) {
    return new Promise(resolve => rl.question(question, answer => resolve(answer.trim())));
}
function askHidden(question) {
    return new Promise((resolve, reject) => {
        const input = process.stdin;
        if (!input.isTTY || typeof input.setRawMode !== 'function') {
            reject(new Error('Jalankan script dari terminal interaktif agar password tidak ditampilkan.'));
            return;
        }
        process.stdout.write(question);
        let value = '';
        const previousRaw = input.isRaw;
        input.setRawMode(true);
        input.resume();
        const finish = answer => {
            input.removeListener('data', onData);
            input.setRawMode(previousRaw || false);
            process.stdout.write('\n');
            resolve(answer);
        };
        const onData = chunk => {
            for (const char of chunk.toString('utf8')) {
                if (char === '\u0003') {
                    input.removeListener('data', onData);
                    input.setRawMode(previousRaw || false);
                    process.stdout.write('\nDibatalkan.\n');
                    reject(new Error('Dibatalkan pengguna.'));
                    return;
                }
                if (char === '\r' || char === '\n') return finish(value);
                if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
                else if (char >= ' ') value += char;
            }
        };
        input.on('data', onData);
    });
}

async function main() {
    try {
        console.log('=== Setup akun admin FindIt Portal ===');
        const nim = await ask('NIM/ID admin: ');
        const name = await ask('Nama admin: ');
        const password = await askHidden('Password admin (min. 12 karakter): ');
        if (!/^[A-Za-z0-9.-]{3,30}$/.test(nim) || name.length < 2 || name.length > 120 ||
            password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
            throw new Error('NIM/ID, nama, atau panjang password tidak memenuhi aturan.');
        }
        const confirm = (await ask(`Akun dengan NIM/ID "${nim}" akan dibuat atau dipromosikan menjadi admin. Ketik YA untuk melanjutkan: `)).toUpperCase();
        if (confirm !== 'YA') {
            console.log('Tidak ada perubahan.');
            return;
        }
        const existing = await pool.query('SELECT id, role FROM users WHERE nim = $1 LIMIT 1', [nim]);
        const hash = await bcrypt.hash(password, 12);
        if (existing.rowCount) {
            await pool.query('UPDATE users SET full_name = $1, password_hash = $2, role = $3 WHERE id = $4', [name, hash, 'admin', existing.rows[0].id]);
            console.log('Akun yang ada berhasil diatur sebagai admin.');
        } else {
            await pool.query(
                `INSERT INTO users (nim, full_name, email, phone, password_hash, role)
                 VALUES ($1, $2, NULL, NULL, $3, 'admin')`,
                [nim, name, hash]
            );
            console.log('Akun admin berhasil dibuat.');
        }
    } finally {
        rl.close();
        await pool.end();
    }
}

main().catch(error => {
    console.error('Setup admin gagal:', error.message);
    process.exitCode = 1;
});
