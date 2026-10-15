const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Database Sementara (Disimpan di Memori RAM Server)
let dbLaporan = [
    { id: 1, tipe: 'Hilang', nama_barang: 'Dompet Hitam Kulit', kategori: 'Aksesoris', lokasi: 'Kantin Gedung Utama', tanggal: '2026-10-01', ciri: 'Bahan Kulit', status: 'Aktif', pelapor: 'Sistem' },
    { id: 2, tipe: 'Ditemukan', nama_barang: 'Kunci Motor Honda', kategori: 'Lainnya', lokasi: 'Parkiran Depan', tanggal: '2026-09-29', ciri: 'Gantungan helm kecil', status: 'Aktif', pelapor: 'Sistem' }
];

// Endpoint Login
app.post('/api/login', (req, res) => {
    const { nim, password } = req.body;
    if (nim === 'admin' && password === 'admin') {
        return res.json({ success: true, user: { nama: 'Admin Kampus', role: 'admin' } });
    } else if (nim && password) {
        return res.json({ success: true, user: { nama: nim, role: 'mahasiswa' } });
    }
    return res.status(400).json({ success: false, message: 'NIM atau Password salah!' });
});

// Endpoint Ambil Data Laporan
app.get('/api/laporan', (req, res) => res.json(dbLaporan));

// Endpoint Tambah Laporan
app.post('/api/laporan', (req, res) => {
    const newLaporan = { id: Date.now(), status: 'Aktif', ...req.body };
    dbLaporan.unshift(newLaporan);
    res.status(201).json({ success: true, data: newLaporan });
});

// Endpoint Ubah Status (Selesai)
app.put('/api/laporan/:id', (req, res) => {
    const item = dbLaporan.find(i => i.id == req.params.id);
    if (item) {
        item.status = req.body.status;
        return res.json({ success: true });
    }
    res.status(404).json({ success: false });
});

// Endpoint Hapus Laporan
app.delete('/api/laporan/:id', (req, res) => {
    dbLaporan = dbLaporan.filter(i => i.id != req.params.id);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`🚀 Server Backend berjalan di http://localhost:${PORT}`);
});