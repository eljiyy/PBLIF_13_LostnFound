// ==========================================
// 1. MANAJEMEN DATABASE LOKAL (LocalStorage)
// ==========================================
function getLaporanDB() {
    return JSON.parse(localStorage.getItem('lostFoundLaporan')) || [];
}
function saveLaporanDB(data) {
    localStorage.setItem('lostFoundLaporan', JSON.stringify(data));
}
function getNotifDB() {
    return JSON.parse(localStorage.getItem('lostFoundNotif')) || [];
}
function saveNotifDB(data) {
    localStorage.setItem('lostFoundNotif', JSON.stringify(data));
}

// ==========================================
// 2. FUNGSI KIRIM LAPORAN OLEH MAHASISWA
// ==========================================
function prosesKirimLaporan(e) {
    e.preventDefault(); // Mencegah reload halaman secara paksa
    
    const user = JSON.parse(sessionStorage.getItem('activeUser'));
    if (!user || user.role !== 'mahasiswa') {
        alert('Sesi tidak valid! Silakan login kembali.');
        window.location.href = 'login.html';
        return;
    }

    // Mengambil nilai input
    const form = e.target;
    const tipe = form.querySelector('[name="tipe"]').value;
    const nama_barang = form.querySelector('[name="nama_barang"]').value;
    const kategori = form.querySelector('[name="kategori"]').value;
    const tanggal = form.querySelector('[name="tanggal"]').value;
    const lokasi = form.querySelector('[name="lokasi"]').value;
    const ciri = form.querySelector('[name="ciri"]').value;
    
    const fileInput = form.querySelector('input[type="file"]');
    const file = (fileInput && fileInput.files.length > 0) ? fileInput.files[0].name : 'Tidak_ada_bukti.jpg';

    const laporanBaru = {
        id: Date.now(),
        pelapor: user.nama,
        nim: user.nim,
        tipe: tipe,
        nama_barang: nama_barang,
        kategori: kategori,
        tanggal: tanggal,
        lokasi: lokasi,
        ciri: ciri,
        buktiFile: file,
        status: 'Pending',
        tanggalDibuat: new Date().toLocaleDateString('id-ID')
    };

    // Eksekusi Simpan
    const database = getLaporanDB();
    database.push(laporanBaru);
    saveLaporanDB(database);

    alert('✅ Laporan berhasil dikirim! Silakan tunggu verifikasi Admin.');
    window.location.href = 'PBL.html';
}

// ==========================================
// 3. FUNGSI ADMIN (RENDER, FILTER, HAPUS)
// ==========================================
window.renderTabelAdmin = function(filterStatus = 'Semua', searchQuery = '') {
    const tbody = document.getElementById('tabelVerifikasiAdmin');
    if (!tbody) return; 

    let database = getLaporanDB();
    
    // Terapkan Filter
    if (filterStatus !== 'Semua') {
        database = database.filter(item => item.status === filterStatus);
    }
    // Terapkan Pencarian
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        database = database.filter(item => 
            item.nama_barang.toLowerCase().includes(q) || 
            item.pelapor.toLowerCase().includes(q) || 
            item.nim.toLowerCase().includes(q)
        );
    }

    tbody.innerHTML = '';
    if (database.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-gray-500 font-bold">Tidak ada data ditemukan.</td></tr>`;
        return;
    }

    database.slice().reverse().forEach(item => {
        const isPending = item.status === 'Pending';
        const statusBg = isPending ? 'bg-amber-100 text-amber-700' : (item.status === 'Valid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700');

        tbody.innerHTML += `
            <tr class="border-b hover:bg-slate-50 transition">
                <td class="p-4"><b>${item.pelapor}</b><br><span class="text-xs text-gray-500">NIM: ${item.nim}</span></td>
                <td class="p-4"><b>${item.nama_barang}</b><br><span class="text-xs font-bold text-gray-400">${item.tipe} - ${item.kategori}</span></td>
                <td class="p-4">${item.lokasi}<br><span class="text-xs text-gray-400">${item.tanggal}</span></td>
                <td class="p-4"><span class="text-xs bg-slate-200 px-2 py-1 rounded text-gray-700">📷 ${item.buktiFile}</span></td>
                <td class="p-4"><span class="px-2.5 py-1 rounded-full text-xs font-bold ${statusBg}">${item.status}</span></td>
                <td class="p-4 text-center">
                    ${isPending ? `
                        <div class="flex gap-2 justify-center mb-1">
                            <button onclick="verifikasiAdmin(${item.id}, true)" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-bold">Setuju</button>
                            <button onclick="tolakDenganAlasan(${item.id})" class="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded text-xs font-bold">Tolak</button>
                        </div>
                    ` : ''}
                    <button onclick="hapusLaporan(${item.id})" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-bold w-full mt-1">Hapus Data</button>
                </td>
            </tr>
        `;
    });

    renderStatistikAdmin();
};

window.renderStatistikAdmin = function() {
    const db = getLaporanDB();
    if(document.getElementById('statTotal')) document.getElementById('statTotal').innerText = db.length;
    if(document.getElementById('statPending')) document.getElementById('statPending').innerText = db.filter(d => d.status === 'Pending').length;
    if(document.getElementById('statValid')) document.getElementById('statValid').innerText = db.filter(d => d.status === 'Valid').length;
}

window.verifikasiAdmin = function(id, statusValid, alasan = '') {
    const database = getLaporanDB();
    const index = database.findIndex(l => l.id === id);
    if (index !== -1) {
        database[index].status = statusValid ? 'Valid' : 'Tidak Valid';
        saveLaporanDB(database);

        const listNotif = getNotifDB();
        listNotif.push({
            id: Date.now(), nim: database[index].nim, status: database[index].status,
            pesan: statusValid ? `Laporan '${database[index].nama_barang}' dipublikasikan.` : `Laporan '${database[index].nama_barang}' ditolak. Alasan: ${alasan}`,
            waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        });
        saveNotifDB(listNotif);
        renderTabelAdmin();
    }
};

window.tolakDenganAlasan = function(id) {
    const alasan = prompt('Masukkan alasan penolakan:');
    if (alasan) window.verifikasiAdmin(id, false, alasan);
};

window.hapusLaporan = function(id) {
    if(confirm('Yakin ingin menghapus laporan ini secara permanen?')) {
        let database = getLaporanDB();
        database = database.filter(l => l.id !== id);
        saveLaporanDB(database);
        renderTabelAdmin();
    }
};

// ==========================================
// 4. FUNGSI MAHASISWA (PENCARIAN BERITA TERKINI)
// ==========================================
window.renderBeritaTerkini = function(searchQuery = '') {
    const container = document.getElementById('feedBeritaTerkini');
    if (!container) return;

    let laporanValid = getLaporanDB().filter(item => item.status === 'Valid');

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        laporanValid = laporanValid.filter(item => 
            item.nama_barang.toLowerCase().includes(q) || 
            item.lokasi.toLowerCase().includes(q)
        );
    }

    container.innerHTML = '';
    if (laporanValid.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center text-gray-500 py-10">Tidak ada barang yang cocok dengan pencarian Anda.</div>`;
        return;
    }

    laporanValid.forEach(item => {
        const badgeColor = (item.tipe === 'Kehilangan' || item.tipe === 'Hilang') ? 'bg-red-500' : 'bg-green-600';
        container.innerHTML += `
            <div class="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div class="p-5">
                    <span class="${badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full">${item.tipe.toUpperCase()}</span>
                    <h3 class="text-xl font-bold text-[#030c3b] mt-3 mb-2">${item.nama_barang}</h3>
                    <p class="text-sm text-gray-600 mb-1">📍 <b>Lokasi:</b> ${item.lokasi}</p>
                    <p class="text-sm text-gray-600 mb-4">📅 <b>Tanggal:</b> ${item.tanggal}</p>
                    <div class="pt-3 border-t text-xs text-gray-500 flex justify-between">
                        <span>Oleh: <b>${item.pelapor}</b></span>
                        <span class="text-emerald-600 font-bold">✓ Terverifikasi</span>
                    </div>
                </div>
            </div>
        `;
    });
};

// ==========================================
// 5. INISIALISASI OTOMATIS SAAT HALAMAN DIBUKA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Jalankan fitur Admin jika ada tabel admin
    if (document.getElementById('tabelVerifikasiAdmin')) {
        renderTabelAdmin();
        
        // Listener Pencarian Admin
        document.getElementById('adminSearch').addEventListener('input', (e) => {
            renderTabelAdmin(document.getElementById('adminFilter').value, e.target.value);
        });
        document.getElementById('adminFilter').addEventListener('change', (e) => {
            renderTabelAdmin(e.target.value, document.getElementById('adminSearch').value);
        });
    }

    // Jalankan fitur Mahasiswa (Berita)
    if (document.getElementById('feedBeritaTerkini')) {
        renderBeritaTerkini();
        
        // Listener Pencarian Mahasiswa
        document.getElementById('studentSearch').addEventListener('input', (e) => {
            renderBeritaTerkini(e.target.value);
        });
    }

    // Amankan form pelaporan dengan Event Listener
    const formLapor = document.getElementById('formLaporMahasiswa');
    if (formLapor) {
        formLapor.addEventListener('submit', prosesKirimLaporan);
    }
});