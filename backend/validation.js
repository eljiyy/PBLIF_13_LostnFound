'use strict';

function normalizeType(value) {
    if (typeof value !== 'string') return null;
    const type = value.trim().toLowerCase();
    if (['hilang', 'kehilangan'].includes(type)) return 'hilang';
    if (['temuan', 'ditemukan', 'barang ditemukan'].includes(type)) return 'temuan';
    return null;
}

function firstDefined(...values) {
    return values.find(value => value !== undefined && value !== null);
}

function text(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function reportInput(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new TypeError('Format data laporan tidak valid.');
    }

    const rawDate = firstDefined(body.incident_date, body.tanggal, null);
    const rawPhoto = firstDefined(body.item_photo, body.foto, null);

    return {
        type: normalizeType(firstDefined(body.report_type, body.tipe)),
        name: text(firstDefined(body.item_name, body.nama_barang)),
        category: text(firstDefined(body.category, body.kategori)),
        description: text(body.description),
        location: text(firstDefined(body.location, body.lokasi)),
        date: rawDate === null || rawDate === ''
            ? null
            : typeof rawDate === 'string' ? rawDate.trim() : rawDate,
        characteristics: text(firstDefined(body.characteristics, body.ciri)),
        photo: rawPhoto === null || rawPhoto === ''
            ? null
            : typeof rawPhoto === 'string' ? rawPhoto.trim() : rawPhoto
    };
}

function isValidDateOnly(value) {
    if (value === null || value === undefined || value === '') return true;
    if (typeof value !== 'string') return false;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (year < 1 || month < 1 || month > 12 || day < 1) return false;
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return day <= days[month - 1];
}

function isSafePhotoReference(value) {
    if (value === null || value === undefined || value === '') return true;
    if (typeof value !== 'string' || value.length > 2000) return false;
    if (/[\u0000-\u001F\u007F]/.test(value)) return false;
    const trimmed = value.trim();
    if (/^(javascript|data|vbscript):/i.test(trimmed)) return false;
    // Existing deployments may store a remote URL or a relative upload/static path.
    if (/^https?:\/\//i.test(trimmed)) {
        try {
            const url = new URL(trimmed);
            return Boolean(url.hostname);
        } catch {
            return false;
        }
    }
    return /^(\/?[A-Za-z0-9._~!$&'()*+,;=:@%/-]+)$/.test(trimmed) && !trimmed.startsWith('//');
}

function validReport(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
    if (!['hilang', 'temuan'].includes(data.type)) return false;

    const stringFields = ['name', 'category', 'description', 'location', 'characteristics'];
    if (!stringFields.every(key => typeof data[key] === 'string')) return false;

    if (data.name.trim().length < 2 || data.name.length > 150) return false;
    // Category is optional in the current database and UI contract.
    if (data.category.length > 80) return false;
    if (data.description.trim().length < 5 || data.description.length > 5000) return false;
    if (data.location.trim().length < 2 || data.location.length > 200) return false;
    if (data.characteristics.length > 3000) return false;
    if (!isValidDateOnly(data.date)) return false;
    if (!isSafePhotoReference(data.photo)) return false;
    return true;
}

function validWitness(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
    const name = input.name;
    const nim = input.nim;
    const phone = input.phone ?? '';
    return typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 120 &&
        typeof nim === 'string' && /^[A-Za-z0-9.-]{3,30}$/.test(nim.trim()) &&
        typeof phone === 'string' && phone.trim().length <= 25;
}

module.exports = { normalizeType, reportInput, validReport, validWitness, isValidDateOnly };
