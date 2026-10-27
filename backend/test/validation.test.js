'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeType, reportInput, validReport, validWitness, isValidDateOnly } = require('../validation');

const valid = {
    type: 'hilang', name: 'Dompet hitam', category: 'Aksesori',
    description: 'Dompet hitam hilang di area kampus.', location: 'Gedung utama',
    date: '2026-10-25', characteristics: 'Ada kartu mahasiswa di dalam', photo: null
};

test('normalizeType accepts known aliases only', () => {
    assert.equal(normalizeType('Kehilangan'), 'hilang');
    assert.equal(normalizeType('Ditemukan'), 'temuan');
    assert.equal(normalizeType('barang random'), null);
});

test('reportInput maps the current frontend aliases', () => {
    const data = reportInput({ tipe: 'Hilang', nama_barang: ' Dompet ', kategori: ' Aksesori ', description: 'Barang hilang.', lokasi: ' Perpustakaan ', tanggal: '2026-10-25', ciri: 'Hitam', foto: null });
    assert.equal(data.type, 'hilang');
    assert.equal(data.name, 'Dompet');
    assert.equal(data.location, 'Perpustakaan');
    assert.equal(validReport(data), true);
});

test('validReport accepts valid report and optional category/photo/date', () => {
    assert.equal(validReport(valid), true);
    assert.equal(validReport({ ...valid, category: '', date: null, photo: null }), true);
});

test('validReport rejects invalid types, oversized fields, unsafe photo schemes and invalid dates', () => {
    assert.equal(validReport({ ...valid, type: 'admin' }), false);
    assert.equal(validReport({ ...valid, name: 'x' }), false);
    assert.equal(validReport({ ...valid, description: 'no' }), false);
    assert.equal(validReport({ ...valid, date: '2026-02-30' }), false);
    assert.equal(validReport({ ...valid, photo: 'javascript:alert(1)' }), false);
    assert.equal(validReport({ ...valid, photo: 'x'.repeat(2001) }), false);
});

test('date-only validator handles leap years correctly', () => {
    assert.equal(isValidDateOnly('2024-02-29'), true);
    assert.equal(isValidDateOnly('2025-02-29'), false);
    assert.equal(isValidDateOnly('2026-13-01'), false);
    assert.equal(isValidDateOnly(null), true);
});

test('witness validation checks required name and NIM', () => {
    assert.equal(validWitness({ name: 'Siti Aminah', nim: '12345678', phone: '' }), true);
    assert.equal(validWitness({ name: 'S', nim: 'x', phone: '' }), false);
});
