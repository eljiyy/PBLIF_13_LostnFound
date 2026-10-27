'use strict';
require('dotenv').config();
const pool = require('./db');

async function testConnection() {
    try {
        const result = await pool.query('SELECT current_database() AS database, current_user AS db_user, NOW() AS checked_at');
        console.log('Koneksi PostgreSQL berhasil.');
        console.log('Database:', result.rows[0].database);
        console.log('DB user:', result.rows[0].db_user);
        console.log('Waktu cek:', result.rows[0].checked_at);
    } catch (error) {
        console.error('Koneksi gagal:', error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

testConnection();
