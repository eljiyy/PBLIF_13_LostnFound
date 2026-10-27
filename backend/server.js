'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const { normalizeType, reportInput, validReport, validWitness } = require('./validation');

const app = express();
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_ISSUER = 'findit-portal';

if (!JWT_SECRET || Buffer.byteLength(JWT_SECRET, 'utf8') < 32) {
    console.error('JWT_SECRET belum diatur atau kurang dari 32 byte. Isi .env sebelum menjalankan server.');
    process.exit(1);
}
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    console.error('PORT tidak valid.');
    process.exit(1);
}

app.disable('x-powered-by');
app.use(helmet());

const configuredOrigins = (process.env.CORS_ORIGINS || '')
    .split(',').map(value => value.trim()).filter(Boolean);
const localOrigins = [
    'http://localhost:3000', 'http://127.0.0.1:3000',
    'http://localhost:5173', 'http://127.0.0.1:5173',
    'http://localhost:5500', 'http://127.0.0.1:5500',
    'http://localhost:5501', 'http://127.0.0.1:5501',
    'http://localhost:8080', 'http://127.0.0.1:8080'
];
const allowedOrigins = new Set([...localOrigins, ...configuredOrigins]);
const isLocalOrigin = origin => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
app.use(cors({
    origin(origin, callback) {
        // Requests from curl/server-to-server have no Origin header.
        if (!origin || allowedOrigins.has(origin) || isLocalOrigin(origin)) return callback(null, true);
        return callback(new Error('Origin tidak diizinkan oleh konfigurasi CORS.'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600
}));
app.use(express.json({ limit: '1mb', strict: true }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, message: 'Terlalu banyak percobaan. Coba lagi dalam beberapa menit.' }
});
const writeLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, message: 'Terlalu banyak permintaan. Coba lagi sebentar.' }
});

function sendError(res, status, message) {
    return res.status(status).json({ success: false, message });
}

function createToken(user) {
    return jwt.sign(
        { sub: String(user.id) },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '2h', issuer: TOKEN_ISSUER, audience: 'findit-portal-client' }
    );
}

function readToken(req) {
    const header = req.get('authorization') || '';
    if (!header.startsWith('Bearer ')) return null;
    const token = header.slice(7).trim();
    return token || null;
}

// Role dan status akun dibaca ulang dari database agar perubahan role/nonaktif akun
// berlaku meskipun token lama belum kedaluwarsa.
async function authenticate(req, res, next) {
    const token = readToken(req);
    if (!token) return sendError(res, 401, 'Silakan login terlebih dahulu.');

    try {
        const payload = jwt.verify(token, JWT_SECRET, {
            issuer: TOKEN_ISSUER,
            audience: 'findit-portal-client',
            algorithms: ['HS256']
        });
        const id = Number(payload.sub);
        if (!Number.isSafeInteger(id) || id <= 0) return sendError(res, 401, 'Sesi tidak valid.');

        const result = await pool.query(
            'SELECT id, nim, full_name, role FROM users WHERE id = $1 LIMIT 1',
            [id]
        );
        if (!result.rowCount || !['mahasiswa', 'admin'].includes(result.rows[0].role)) {
            return sendError(res, 401, 'Akun tidak ditemukan atau tidak memiliki akses.');
        }
        req.auth = {
            id: Number(result.rows[0].id),
            nim: result.rows[0].nim,
            name: result.rows[0].full_name,
            role: result.rows[0].role
        };
        return next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' || error.name === 'NotBeforeError') {
            return sendError(res, 401, 'Sesi tidak valid atau sudah kedaluwarsa.');
        }
        console.error('Autentikasi gagal:', error.message);
        return sendError(res, 500, 'Autentikasi tidak dapat diproses.');
    }
}

function optionalAuthenticate(req, res, next) {
    const token = readToken(req);
    if (!token) {
        req.auth = null;
        return next();
    }
    return authenticate(req, res, next);
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.auth || req.auth.role !== role) {
            return sendError(res, 403, 'Kamu tidak memiliki izin untuk tindakan ini.');
        }
        return next();
    };
}

function safeRollback(client) {
    return client.query('ROLLBACK').catch(() => {});
}

function validNim(value) {
    return typeof value === 'string' && /^[A-Za-z0-9.-]{3,30}$/.test(value.trim());
}
function validPhone(value, required = false) {
    if (typeof value !== 'string') return false;
    const phone = value.trim();
    if (!phone) return !required;
    return phone.length <= 25 && /^[+0-9() .-]{6,25}$/.test(phone);
}
function validEmail(value) {
    if (value === null || value === undefined || value === '') return true;
    return typeof value === 'string' && value.length <= 150 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function validPassword(value, minimum = 10) {
    return typeof value === 'string' && value.length >= minimum && Buffer.byteLength(value, 'utf8') <= 72;
}

app.get('/', (req, res) => {
    res.json({ success: true, name: 'FindIt Portal API', status: 'running', health: '/api/health' });
});

app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        return res.json({ success: true, server: 'FindIt Portal', database: 'connected' });
    } catch (error) {
        console.error('Health check database gagal:', error.message);
        return sendError(res, 503, 'Database tidak tersedia.');
    }
});

app.post('/api/register', authLimiter, async (req, res) => {
    try {
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
            return sendError(res, 400, 'Format data registrasi tidak valid.');
        }
        const { nim, nama, full_name, email, phone, password } = req.body;
        const studentNim = typeof nim === 'string' ? nim.trim() : '';
        const name = typeof (full_name ?? nama) === 'string' ? (full_name ?? nama).trim() : '';
        const studentEmail = typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;
        const studentPhone = typeof phone === 'string' ? phone.trim() : '';

        if (!validNim(studentNim) || name.length < 2 || name.length > 120 ||
            !validPhone(studentPhone, true) || !validEmail(studentEmail) || !validPassword(password, 10)) {
            return sendError(res, 400, 'Periksa NIM, nama, email, dan nomor telepon. Password harus minimal 10 karakter dan maksimal 72 byte.');
        }

        const hash = await bcrypt.hash(password, 12);
        const result = await pool.query(
            `INSERT INTO users (nim, full_name, email, phone, password_hash, role)
             VALUES ($1, $2, $3, $4, $5, 'mahasiswa')
             RETURNING id, nim, full_name, role`,
            [studentNim, name, studentEmail, studentPhone, hash]
        );
        return res.status(201).json({
            success: true,
            message: 'Registrasi mahasiswa berhasil.',
            user: { id: result.rows[0].id, nim: result.rows[0].nim, nama: result.rows[0].full_name, role: result.rows[0].role }
        });
    } catch (error) {
        if (error.code === '23505') return sendError(res, 409, 'NIM atau email sudah terdaftar.');
        console.error('Registrasi gagal:', error.message);
        return sendError(res, 500, 'Registrasi gagal diproses.');
    }
});

app.post('/api/login', authLimiter, async (req, res) => {
    try {
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
            return sendError(res, 400, 'Format login tidak valid.');
        }
        const nim = typeof req.body.nim === 'string' ? req.body.nim.trim() : '';
        const password = req.body.password;
        if (!nim || nim.length > 100 || typeof password !== 'string' || Buffer.byteLength(password, 'utf8') > 72) {
            return sendError(res, 400, 'NIM/ID dan password wajib diisi dengan format yang benar.');
        }

        const result = await pool.query(
            'SELECT id, nim, full_name, role, password_hash FROM users WHERE nim = $1 LIMIT 1',
            [nim]
        );
        const user = result.rows[0];
        const passwordOk = user && typeof user.password_hash === 'string'
            ? await bcrypt.compare(password, user.password_hash)
            : false;
        if (!user || !['mahasiswa', 'admin'].includes(user.role) || !passwordOk) {
            return sendError(res, 401, 'NIM/ID atau password salah.');
        }

        return res.json({
            success: true,
            token: createToken(user),
            user: { id: user.id, nim: user.nim, nama: user.full_name, role: user.role }
        });
    } catch (error) {
        console.error('Login gagal:', error.message);
        return sendError(res, 500, 'Login tidak dapat diproses.');
    }
});

app.get('/api/me', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, nim, full_name, email, phone, profile_photo, role, created_at
             FROM users WHERE id = $1 LIMIT 1`,
            [req.auth.id]
        );
        if (!result.rowCount) return sendError(res, 404, 'Akun tidak ditemukan.');
        const user = result.rows[0];
        return res.json({ success: true, user: {
            id: user.id, nim: user.nim, nama: user.full_name, email: user.email,
            phone: user.phone, profile_photo: user.profile_photo, role: user.role, created_at: user.created_at
        }});
    } catch (error) {
        console.error('Pengambilan profil gagal:', error.message);
        return sendError(res, 500, 'Profil gagal dimuat.');
    }
});

// Publik melihat laporan yang sudah dipublikasikan; mahasiswa juga melihat miliknya;
// admin dapat melihat semua laporan beserta data saksi.
app.get('/api/laporan', optionalAuthenticate, async (req, res) => {
    try {
        let result;
        if (req.auth?.role === 'admin') {
            result = await pool.query(
                `SELECT r.*, u.full_name AS reporter_name, u.nim AS reporter_nim,
                        u.phone AS reporter_phone,
                        COALESCE(w.items, '[]'::json) AS witnesses
                 FROM reports r
                 JOIN users u ON u.id = r.reporter_id
                 LEFT JOIN LATERAL (
                     SELECT json_agg(json_build_object('name', rw.witness_name, 'nim', rw.witness_nim, 'phone', rw.witness_phone)) AS items
                     FROM report_witnesses rw WHERE rw.report_id = r.id
                 ) w ON TRUE
                 ORDER BY r.created_at DESC`
            );
        } else if (req.auth?.role === 'mahasiswa') {
            result = await pool.query(
                `SELECT r.id, r.report_type, r.item_name, r.category,
                        r.description, r.location, r.incident_date, r.characteristics,
                        r.item_photo, r.status,
                        CASE WHEN r.reporter_id = $1 THEN r.admin_notes ELSE NULL END AS admin_notes,
                        r.published_at, r.created_at, r.updated_at,
                        CASE WHEN r.reporter_id = $1 THEN u.full_name ELSE 'Mahasiswa' END AS reporter_name
                 FROM reports r JOIN users u ON u.id = r.reporter_id
                 WHERE r.status IN ('terverifikasi', 'selesai') OR r.reporter_id = $1
                 ORDER BY r.created_at DESC`,
                [req.auth.id]
            );
        } else {
            result = await pool.query(
                `SELECT r.id, r.report_type, r.item_name, r.category, r.description,
                        r.location, r.incident_date, r.characteristics, r.item_photo,
                        r.status, r.published_at, r.created_at, 'Mahasiswa' AS reporter_name
                 FROM reports r
                 WHERE r.status IN ('terverifikasi', 'selesai')
                 ORDER BY r.created_at DESC`
            );
        }

        const data = result.rows.map(row => ({
            ...row,
            tipe: row.report_type === 'hilang' ? 'Hilang' : 'Ditemukan',
            nama_barang: row.item_name,
            kategori: row.category,
            lokasi: row.location,
            tanggal: row.incident_date,
            ciri: row.characteristics,
            pelapor: row.reporter_name
        }));
        return res.json(data);
    } catch (error) {
        console.error('Pengambilan laporan gagal:', error.message);
        return sendError(res, 500, 'Laporan gagal dimuat.');
    }
});

app.post('/api/laporan', authenticate, requireRole('mahasiswa'), writeLimiter, async (req, res) => {
    let client;
    let transactionStarted = false;
    try {
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
            return sendError(res, 400, 'Format data laporan tidak valid.');
        }
        const data = reportInput(req.body);
        if (!validReport(data)) return sendError(res, 400, 'Data laporan belum lengkap atau formatnya tidak valid.');

        const body = req.body;
        const rawWitness = body.witness && typeof body.witness === 'object' && !Array.isArray(body.witness)
            ? body.witness : {};
        const witness = {
            name: rawWitness.name ?? body.witness_name ?? body.nama_saksi,
            nim: rawWitness.nim ?? body.witness_nim ?? body.nim_saksi,
            phone: rawWitness.phone ?? body.witness_phone ?? ''
        };
        if (typeof witness.name !== 'string' || typeof witness.nim !== 'string' || typeof witness.phone !== 'string') {
            return sendError(res, 400, 'Data saksi tidak valid.');
        }
        witness.name = witness.name.trim(); witness.nim = witness.nim.trim(); witness.phone = witness.phone.trim();
        if (!validWitness(witness) || (witness.phone && !validPhone(witness.phone))) {
            return sendError(res, 400, 'Nama dan NIM satu orang saksi wajib diisi dengan benar; nomor telepon jika diisi harus valid.');
        }

        client = await pool.connect();
        await client.query('BEGIN');
        transactionStarted = true;
        const account = await client.query('SELECT phone FROM users WHERE id = $1 FOR UPDATE', [req.auth.id]);
        if (!account.rowCount || !account.rows[0].phone) {
            await client.query('ROLLBACK'); transactionStarted = false;
            return sendError(res, 400, 'Lengkapi nomor telepon di profil sebelum membuat laporan.');
        }

        const inserted = await client.query(
            `INSERT INTO reports
                (reporter_id, report_type, item_name, category, description, location,
                 incident_date, characteristics, item_photo, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'menunggu_verifikasi')
             RETURNING *`,
            [req.auth.id, data.type, data.name, data.category || null, data.description,
                data.location, data.date, data.characteristics || null, data.photo]
        );
        const report = inserted.rows[0];
        await client.query(
            `INSERT INTO report_witnesses (report_id, witness_name, witness_nim, witness_phone)
             VALUES ($1, $2, $3, $4)`,
            [report.id, witness.name, witness.nim, witness.phone || null]
        );
        await client.query(
            `INSERT INTO report_history (report_id, action, details)
             VALUES ($1, $2, $3)`,
            [report.id, 'laporan_dibuat', 'Laporan dikirim oleh mahasiswa.']
        );
        await client.query(
            `INSERT INTO notifications (user_id, title, message)
             SELECT id, 'Laporan baru masuk', 'Ada laporan baru yang menunggu verifikasi.'
             FROM users WHERE role = 'admin'`
        );
        await client.query('COMMIT'); transactionStarted = false;
        return res.status(201).json({ success: true, message: 'Laporan berhasil dikirim dan menunggu verifikasi admin.', data: report });
    } catch (error) {
        if (client && transactionStarted) await safeRollback(client);
        console.error('Pembuatan laporan gagal:', error.message);
        return sendError(res, 500, 'Laporan gagal disimpan. Periksa struktur tabel database dan log server.');
    } finally {
        if (client) client.release();
    }
});

app.put('/api/laporan/:id', authenticate, requireRole('admin'), writeLimiter, async (req, res) => {
    let client;
    let transactionStarted = false;
    try {
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id <= 0) return sendError(res, 400, 'ID laporan tidak valid.');
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return sendError(res, 400, 'Format pembaruan tidak valid.');

        client = await pool.connect();
        await client.query('BEGIN'); transactionStarted = true;
        const found = await client.query('SELECT * FROM reports WHERE id = $1 FOR UPDATE', [id]);
        if (!found.rowCount) {
            await client.query('ROLLBACK'); transactionStarted = false;
            return sendError(res, 404, 'Laporan tidak ditemukan.');
        }
        const old = found.rows[0];
        const input = reportInput(req.body);
        const has = (...keys) => keys.some(key => Object.prototype.hasOwnProperty.call(req.body, key));
        const candidate = {
            type: has('report_type', 'tipe') ? input.type : normalizeType(old.report_type),
            name: has('item_name', 'nama_barang') ? input.name : old.item_name,
            category: has('category', 'kategori') ? input.category : (old.category || ''),
            description: has('description') ? input.description : old.description,
            location: has('location', 'lokasi') ? input.location : old.location,
            date: has('incident_date', 'tanggal') ? input.date : (old.incident_date ? String(old.incident_date).slice(0, 10) : null),
            characteristics: has('characteristics', 'ciri') ? input.characteristics : (old.characteristics || ''),
            photo: has('item_photo', 'foto') ? input.photo : old.item_photo
        };
        const statuses = ['menunggu_verifikasi', 'perlu_perbaikan', 'terverifikasi', 'ditolak', 'selesai'];
        const status = req.body.status === undefined ? old.status : req.body.status;
        const adminNotes = req.body.admin_notes === undefined ? (old.admin_notes || '') : req.body.admin_notes;
        if (!validReport(candidate) || !statuses.includes(status) || typeof adminNotes !== 'string' || adminNotes.length > 3000) {
            await client.query('ROLLBACK'); transactionStarted = false;
            return sendError(res, 400, 'Data atau status laporan tidak valid. Catatan admin maksimal 3000 karakter.');
        }

        const updated = await client.query(
            `UPDATE reports SET report_type = $1, item_name = $2, category = $3,
                description = $4, location = $5, incident_date = $6, characteristics = $7,
                item_photo = $8, status = $9, admin_notes = $10,
                published_at = CASE WHEN $9 = 'terverifikasi' THEN COALESCE(published_at, NOW())
                                    WHEN $9 = 'selesai' THEN COALESCE(published_at, NOW()) ELSE NULL END,
                updated_at = NOW()
             WHERE id = $11 RETURNING *`,
            [candidate.type, candidate.name, candidate.category || null, candidate.description,
                candidate.location, candidate.date, candidate.characteristics || null,
                candidate.photo, status, adminNotes.trim(), id]
        );
        const report = updated.rows[0];
        await client.query(
            `INSERT INTO report_history (report_id, admin_id, action, details)
             VALUES ($1, $2, $3, $4)`,
            [id, req.auth.id, 'laporan_diperbarui', JSON.stringify({ status_sebelum: old.status, status_sesudah: status })]
        );
        const messages = {
            terverifikasi: 'Kabar baik! Laporan kamu sudah diverifikasi dan dipublikasikan.',
            perlu_perbaikan: 'Laporan kamu perlu diperbaiki. Periksa catatan admin.',
            ditolak: 'Laporan kamu ditolak. Periksa catatan admin.',
            selesai: 'Status laporan kamu sudah selesai.'
        };
        await client.query(
            'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
            [report.reporter_id, 'Pembaruan status laporan', messages[status] || 'Laporan diperbarui oleh admin.']
        );
        await client.query('COMMIT'); transactionStarted = false;
        return res.json({ success: true, message: 'Laporan berhasil diperbarui.', data: report });
    } catch (error) {
        if (client && transactionStarted) await safeRollback(client);
        console.error('Pembaruan laporan gagal:', error.message);
        return sendError(res, 500, 'Laporan gagal diperbarui.');
    } finally {
        if (client) client.release();
    }
});

app.delete('/api/laporan/:id', authenticate, requireRole('admin'), writeLimiter, async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id <= 0) return sendError(res, 400, 'ID laporan tidak valid.');
        const result = await pool.query('DELETE FROM reports WHERE id = $1 RETURNING id', [id]);
        if (!result.rowCount) return sendError(res, 404, 'Laporan tidak ditemukan.');
        return res.json({ success: true, message: 'Laporan berhasil dihapus.' });
    } catch (error) {
        console.error('Penghapusan laporan gagal:', error.message);
        return sendError(res, 500, 'Laporan gagal dihapus.');
    }
});

// Error middleware: parser errors and disallowed CORS origins receive safe responses.
app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    if (err && err.type === 'entity.too.large') return sendError(res, 413, 'Ukuran permintaan terlalu besar.');
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) return sendError(res, 400, 'JSON yang dikirim tidak valid.');
    if (err && /Origin tidak diizinkan/.test(err.message)) return sendError(res, 403, 'Origin frontend tidak diizinkan oleh konfigurasi CORS.');
    console.error('Request gagal:', err?.message || 'Unknown error');
    return sendError(res, 500, 'Terjadi kesalahan pada server.');
});

const server = app.listen(PORT, () => {
    console.log(`FindIt Portal API berjalan di http://localhost:${PORT}`);
});

let shuttingDown = false;
async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} diterima; menutup server...`);
    server.close(async () => {
        try { await pool.end(); }
        catch (error) { console.error('Gagal menutup koneksi database:', error.message); }
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
