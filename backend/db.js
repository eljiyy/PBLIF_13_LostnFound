'use strict';

require('dotenv').config();
const { Pool } = require('pg');

const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missing = required.filter(key => !process.env[key]);
if (missing.length) {
    throw new Error(`Konfigurasi database belum lengkap: ${missing.join(', ')}`);
}

const poolOptions = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    application_name: 'findit-portal-api'
};

if (process.env.DB_SSL === 'true') {
    poolOptions.ssl = { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' };
}

const pool = new Pool(poolOptions);
pool.on('error', err => {
    console.error('Unexpected PostgreSQL pool error:', err.message);
});

module.exports = pool;
