// ==========================================
// 1. DATABASE LOKAL (ANTI-CRASH)
// ==========================================
function getLaporanDB() { 
    try {
        let data = JSON.parse(localStorage.getItem('lostFoundLaporan'));
        return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
}
function saveLaporanDB(data) { localStorage.setItem('lostFoundLaporan', JSON.stringify(data)); }
function getNotifDB() { 
    try {
        let data = JSON.parse(localStorage.getItem('lostFoundNotif'));
        return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
}
function saveNotifDB(data) { localStorage.setItem('lostFoundNotif', JSON.stringify(data)); }

function initDummyData() {
    if (getLaporanDB().length === 0) {
        const dummies = [
            { id: 101, pelapor: 'Budi Santoso', nim: '33123001', tipe: 'Kehilangan', nama_barang: 'Dompet Kulit Coklat', kategori: 'Aksesoris', tanggal: '2026-10-10', lokasi: 'Kantin Utama', ciri: 'Berisi KTP dan KTM, kulit asli.', buktiFile: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=400&q=80', status: 'Valid', tanggalDibuat: '10/10/2026' },
            { id: 102, pelapor: 'Siti Aminah', nim: '33123002', tipe: 'Ditemukan', nama_barang: 'Kunci Motor Honda', kategori: 'Aksesoris', tanggal: '2026-10-12', lokasi: 'Parkiran Gedung B', ciri: 'Ada gantungan kunci beruang lucu.', buktiFile: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=400&q=80', status: 'Valid', tanggalDibuat: '12/10/2026' }
        ];
        saveLaporanDB(dummies);
    }
}

// ==========================================
// 2. KIRIM LAPORAN (MAHASISWA)
// ==========================================
window.prosesKirimLaporan = function(e) {
    e.preventDefault();
    try {
        const user = JSON.parse(sessionStorage.getItem('activeUser'));
        if (!user || user.role !== 'mahasiswa') return window.location.href = 'login.html';

        const form = e.target;
        const file = 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=400&q=80'; 

        const laporanBaru = {
            id: Date.now(),
            pelapor: user.nama || 'Tanpa Nama',
            nim: user.nim || '000',
            tipe: form.querySelector('[name="tipe"]').value || '',
            nama_barang: form.querySelector('[name="nama_barang"]').value || '',
            kategori: form.querySelector('[name="kategori"]').value || '',
            tanggal: form.querySelector('[name="tanggal"]').value || '',
            lokasi: form.querySelector('[name="lokasi"]').value || '',
            ciri: form.querySelector('[name="ciri"]').value || '',
            buktiFile: file,
            status: 'Pending',
            tanggalDibuat: new Date().toLocaleDateString('id-ID')
        };

        const database = getLaporanDB();
        database.push(laporanBaru);
        saveLaporanDB(database);

        alert('✅ Laporan Anda Berhasil Dikirim! Mohon tunggu proses validasi oleh Admin Keamanan Kampus.');
        window.location.href = 'PBL.html';
    } catch (error) {
        alert("Sistem mengalami kendala.");
    }
};

// ==========================================
// 3. FITUR ADMIN & VERIFIKASI KETAT
// ==========================================
let currentVerifyId = null; // Menyimpan ID sementara untuk modal

window.renderTabelAdmin = function(searchQuery = '') {
    const tbody = document.getElementById('tabelVerifikasiAdmin');
    if (!tbody) return; 

    let database = getLaporanDB();
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        database = database.filter(item => 
            (item.nama_barang || '').toLowerCase().includes(q) || 
            (item.pelapor || '').toLowerCase().includes(q) || 
            (item.nim || '').toLowerCase().includes(q)
        );
    }

    tbody.innerHTML = '';
    database.slice().reverse().forEach(item => {
        const isPending = item.status === 'Pending';
        const isSelesai = item.status === 'Selesai';
        let statusBg = isPending ? 'bg-amber-100 text-amber-700' : (item.status === 'Valid' ? 'bg-blue-100 text-blue-700' : (isSelesai ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'));

        tbody.innerHTML += `
            <tr class="border-b hover:bg-slate-50 transition">
                <td class="p-4"><b>${item.pelapor}</b><br><span class="text-xs text-gray-500">NIM: ${item.nim}</span></td>
                <td class="p-4"><b>${item.nama_barang}</b><br><span class="text-xs font-bold text-gray-400">${item.tipe} - ${item.kategori}</span></td>
                <td class="p-4">${item.lokasi}<br><span class="text-xs text-blue-500 hover:underline cursor-pointer font-bold" onclick="lihatBukti('${item.buktiFile}')">📷 Lihat Bukti Foto</span></td>
                <td class="p-4 text-center"><span class="px-3 py-1 rounded-full text-xs font-bold ${statusBg}">${item.status || 'Pending'}</span></td>
                <td class="p-4">
                    <div class="flex flex-col gap-1 justify-center max-w-[150px] mx-auto">
                        ${isPending || item.status === 'Tidak Valid' ? `<button onclick="bukaModalVerifikasi(${item.id})" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-[11px] font-bold shadow">🛡️ Verifikasi Ketat</button>` : ''}
                        ${isPending || item.status === 'Valid' ? `<button onclick="tolakDenganAlasan(${item.id})" class="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-[11px] font-bold shadow">Tolak Laporan</button>` : ''}
                        ${item.status === 'Valid' ? `<button onclick="ubahStatus(${item.id}, 'Selesai')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-[11px] font-bold shadow">Tandai Selesai</button>` : ''}
                        <button onclick="hapusLaporan(${item.id})" class="text-red-500 hover:text-red-700 text-[11px] font-bold mt-1 underline">Hapus Data</button>
                    </div>
                </td>
            </tr>
        `;
    });
};

window.lihatBukti = function(url) {
    window.open(url, '_blank');
};

// ---- LOGIKA MODAL VERIFIKASI KETAT ----
window.bukaModalVerifikasi = function(id) {
    currentVerifyId = id;
    const item = getLaporanDB().find(x => x.id === id);
    if(!item) return;

    // Masukkan data ke dalam Modal
    document.getElementById('mv_pelapor').innerText = `${item.pelapor} (${item.nim})`;
    document.getElementById('mv_barang').innerText = `${item.nama_barang} (${item.tipe})`;
    document.getElementById('mv_ciri').innerText = item.ciri;
    
    // Reset Form Modal
    document.getElementById('chk_bukti').checked = false;
    document.getElementById('chk_spam').checked = false;
    document.getElementById('admin_pin').value = '';

    // Tampilkan Modal
    document.getElementById('modalVerifikasi').classList.remove('hidden');
    document.getElementById('modalVerifikasi').classList.add('flex');
};

window.tutupModalVerifikasi = function() {
    document.getElementById('modalVerifikasi').classList.add('hidden');
    document.getElementById('modalVerifikasi').classList.remove('flex');
    currentVerifyId = null;
};

window.konfirmasiVerifikasi = function() {
    const chkBukti = document.getElementById('chk_bukti').checked;
    const chkSpam = document.getElementById('chk_spam').checked;
    const pin = document.getElementById('admin_pin').value;

    if (!chkBukti || !chkSpam) {
        alert("Peringatan: Anda harus mencentang kedua kotak persetujuan verifikasi!");
        return;
    }
    // PIN ADMIN RAHASIA (Hardcoded untuk demo)
    if (pin !== "123456") {
        alert("Akses Ditolak: PIN Otorisasi Admin Salah!");
        return;
    }

    // Jika PIN benar dan dicentang, jalankan Validasi
    ubahStatus(currentVerifyId, 'Valid');
    tutupModalVerifikasi();
    alert("Berhasil! Laporan telah terverifikasi ketat dan otomatis diterbitkan ke Berita Utama Kampus.");
};
// ----------------------------------------

window.ubahStatus = function(id, statusBaru, alasan = '') {
    const database = getLaporanDB();
    const index = database.findIndex(l => l.id === id);
    if (index !== -1) {
        database[index].status = statusBaru;
        saveLaporanDB(database);

        const listNotif = getNotifDB();
        let pesan = '';
        if (statusBaru === 'Valid') pesan = `Pembaruan berhasil. Laporan '${database[index].nama_barang}' telah diterbitkan ke Berita Utama.`;
        else if (statusBaru === 'Selesai') pesan = `Laporan '${database[index].nama_barang}' ditandai SELESAI. Barang telah dikembalikan ke pemiliknya.`;
        else pesan = `Data Anda terdeteksi tidak valid, <a href="lapor.html" class="text-red-500 underline font-bold">klik untuk memperbarui</a>. Catatan Petugas: ${alasan}`;
        
        listNotif.push({
            id: Date.now(), nim: database[index].nim, status: statusBaru, pesan: pesan,
            waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        });
        saveNotifDB(listNotif);
        
        // REFRESH SEMUA TABEL OTOMATIS
        renderTabelAdmin();
        renderBeritaTerkini(); 
    }
};

window.tolakDenganAlasan = function(id) {
    const alasan = prompt('Masukkan catatan/alasan mengapa laporan ini ditolak:');
    if (alasan) window.ubahStatus(id, 'Tidak Valid', alasan);
};

window.hapusLaporan = function(id) {
    if(confirm('Hapus laporan ini secara permanen dari database?')) {
        saveLaporanDB(getLaporanDB().filter(l => l.id !== id));
        renderTabelAdmin();
        renderBeritaTerkini();
    }
};

window.switchAdminTab = function(tabName) {
    document.getElementById('tabAntrean').classList.add('hidden');
    document.getElementById('tabBerita').classList.add('hidden');
    
    document.getElementById(`tab${tabName}`).classList.remove('hidden');
    
    // Paksa refresh fungsi berita saat tab dibuka agar datanya selalu baru
    if(tabName === 'Berita') {
        renderBeritaTerkini(); 
    }
};

// ==========================================
// 4. BERITA TERKINI & NOTIFIKASI MAHASISWA
// ==========================================
window.renderBeritaTerkini = function(searchQuery = '') {
    const container = document.getElementById('feedBeritaTerkini');
    if (!container) return;

    let laporan = getLaporanDB().filter(item => item.status === 'Valid' || item.status === 'Selesai');

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        laporan = laporan.filter(item => 
            (item.nama_barang || '').toLowerCase().includes(q) || 
            (item.lokasi || '').toLowerCase().includes(q) ||
            (item.kategori || '').toLowerCase().includes(q) ||
            (item.pelapor || '').toLowerCase().includes(q)
        );
    }

    container.innerHTML = '';
    if (laporan.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center text-gray-500 py-10 bg-white rounded-xl border">Belum ada Berita Utama terbaru.</div>`;
        return;
    }

    laporan.reverse().forEach(item => {
        const badgeColor = (item.tipe === 'Kehilangan' || item.tipe === 'Hilang') ? 'bg-red-500' : 'bg-blue-600';
        const filterSelesai = item.status === 'Selesai' ? '<div class="absolute inset-0 bg-white/70 flex items-center justify-center z-10 backdrop-blur-[1px]"><span class="bg-green-600 text-white font-extrabold px-6 py-2 rounded-full border-4 border-white shadow-xl transform -rotate-12 text-xl tracking-widest">DIKEMBALIKAN</span></div>' : '';

        container.innerHTML += `
            <div class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 relative group">
                ${filterSelesai}
                <div class="h-48 w-full bg-gray-200 overflow-hidden relative">
                    <img src="${item.buktiFile}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                    <span class="absolute top-3 right-3 ${badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">${item.tipe}</span>
                </div>
                <div class="p-5">
                    <div class="text-xs text-amber-500 font-bold uppercase tracking-wider mb-1">${item.kategori}</div>
                    <h3 class="text-xl font-bold text-[#030c3b] mb-2 truncate">${item.nama_barang}</h3>
                    <p class="text-sm text-gray-600 mb-1"><span class="font-bold">Lokasi:</span> ${item.lokasi}</p>
                    <p class="text-sm text-gray-500 mb-4 line-clamp-2"><span class="font-bold">Ciri Khusus:</span> ${item.ciri}</p>
                    <div class="pt-3 border-t text-xs text-gray-500 flex justify-between items-center">
                        <span class="truncate w-3/4">Oleh: <b>${item.pelapor}</b> (${item.nim})</span>
                        <span class="text-blue-600 font-bold">Terverifikasi</span>
                    </div>
                </div>
            </div>
        `;
    });
};

window.renderNotifikasiLonceng = function() {
    const user = JSON.parse(sessionStorage.getItem('activeUser'));
    if (!user || user.role !== 'mahasiswa') return;

    const listNotif = getNotifDB().filter(n => n.nim === user.nim);
    const badge = document.getElementById('notifBadge');
    const container = document.getElementById('notifDropdown');
    if (!badge || !container) return;

    badge.innerText = listNotif.length;
    badge.style.display = listNotif.length > 0 ? 'inline-block' : 'none';

    container.innerHTML = `<div class="p-3 border-b text-sm font-bold bg-[#030c3b] text-white">Notifikasi Sistem</div>`;
    if (listNotif.length === 0) {
        container.innerHTML += `<div class="p-4 text-xs text-gray-500 text-center">Tidak ada pemberitahuan baru.</div>`;
        return;
    }

    listNotif.reverse().forEach(n => {
        const bg = n.status === 'Valid' ? 'bg-blue-50' : (n.status === 'Selesai' ? 'bg-green-50' : 'bg-red-50');
        const tx = n.status === 'Valid' ? 'text-blue-700' : (n.status === 'Selesai' ? 'text-green-700' : 'text-red-700');
        container.innerHTML += `
            <div class="p-3 border-b ${bg} text-xs">
                <div class="flex justify-between font-bold ${tx} mb-1">
                    <span>${n.status}</span><span class="text-gray-400 font-normal">${n.waktu}</span>
                </div>
                <p class="text-gray-700 leading-relaxed">${n.pesan}</p>
            </div>
        `;
    });
};

window.toggleNotifDropdown = () => document.getElementById('notifDropdown').classList.toggle('hidden');

// ==========================================
// 5. INISIALISASI AUTO RUN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initDummyData();

    if (document.getElementById('tabelVerifikasiAdmin')) {
        renderTabelAdmin();
        const adminSearch = document.getElementById('adminSearch');
        if (adminSearch) adminSearch.addEventListener('input', (e) => renderTabelAdmin(e.target.value));
    }

    if (document.getElementById('feedBeritaTerkini')) {
        renderBeritaTerkini();
        const globalSearch = document.getElementById('globalSearch');
        if (globalSearch) globalSearch.addEventListener('input', (e) => renderBeritaTerkini(e.target.value));
    }

    renderNotifikasiLonceng();

    const formLapor = document.getElementById('formLaporMahasiswa');
    if (formLapor) {
        formLapor.removeAttribute('onsubmit'); 
        formLapor.addEventListener('submit', function(e) { window.prosesKirimLaporan(e); });
    }
});