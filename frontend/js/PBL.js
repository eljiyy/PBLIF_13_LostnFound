// ==========================================
// 1. DATABASE LOKAL (SINKRONISASI PENUH)
// ==========================================
function getLaporanDB() { 
    return JSON.parse(localStorage.getItem('lostFoundLaporan')) || [];
}
function saveLaporanDB(data) { 
    localStorage.setItem('lostFoundLaporan', JSON.stringify(data)); 
}
function getBeritaAdmin() {
    return JSON.parse(localStorage.getItem('adminBeritaPBL')) || [];
}

// Inisialisasi Data Dummy Sistem
function initDummyData() {
    if (getLaporanDB().length === 0) {
        saveLaporanDB([
            { id: 101, pelapor: 'Yusuf Fauzi', nim: '33123001', tipe: 'Kehilangan', nama_barang: 'Jam Tangan Kulit Hitam', kategori: 'Aksesoris', tanggal: '2026-10-10', lokasi: 'Kantin Area Terbuka', ciri: 'Kaca retak sedikit di pojok kiri.', buktiFile: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80', status: 'Valid', tanggalDibuat: '10/10/2026' }
        ]);
    }
}

// ==========================================
// 2. FITUR ALGORITMA KOMPRESI GAMBAR (ANTI-BUG)
// ==========================================
// Mencegah error 'QuotaExceededError' pada LocalStorage
function compressImage(file, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800; // Maksimal lebar
            const MAX_HEIGHT = 800; // Maksimal tinggi
            let width = img.width;
            let height = img.height;

            // Kalkulasi rasio
            if (width > height) {
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            } else {
                if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Kompresi ke format JPEG kualitas 70%
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            callback(compressedBase64);
        };
    };
    reader.onerror = function() {
        alert('Sistem gagal membaca berkas gambar.');
        callback(null);
    };
}

// ==========================================
// 3. KIRIM LAPORAN OLEH MAHASISWA
// ==========================================
window.prosesKirimLaporan = function(e) {
    e.preventDefault();
    const user = JSON.parse(sessionStorage.getItem('activeUser'));
    if (!user || user.role !== 'mahasiswa') return window.location.href = 'login.html';

    const form = e.target;
    const submitBtn = document.getElementById('btnSubmitLaporan');
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Memproses...';
    submitBtn.disabled = true;

    const fileInput = document.getElementById('lap_foto');
    const defaultImage = 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=400&q=80'; 

    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        
        // Panggil algoritma kompresi sebelum simpan
        compressImage(file, function(compressedBase64) {
            if(compressedBase64) {
                eksekusiSimpanLaporan(form, user, compressedBase64, submitBtn);
            } else {
                eksekusiSimpanLaporan(form, user, defaultImage, submitBtn);
            }
        });
    } else {
        eksekusiSimpanLaporan(form, user, defaultImage, submitBtn);
    }
};

function eksekusiSimpanLaporan(form, user, imageBase64, submitBtn) {
    try {
        const laporanBaru = {
            id: Date.now(),
            pelapor: user.nama || 'Tanpa Nama',
            nim: user.nim || '000',
            tipe: form.querySelector('[name="tipe"]').value,
            nama_barang: form.querySelector('[name="nama_barang"]').value,
            kategori: form.querySelector('[name="kategori"]').value,
            tanggal: form.querySelector('[name="tanggal"]').value,
            lokasi: form.querySelector('[name="lokasi"]').value,
            ciri: form.querySelector('[name="ciri"]').value,
            buktiFile: imageBase64,
            status: 'Pending',
            tanggalDibuat: new Date().toLocaleDateString('id-ID')
        };

        const db = getLaporanDB();
        db.push(laporanBaru);
        saveLaporanDB(db);

        alert('Berhasil: Laporan telah dimasukkan ke registri. Menunggu validasi admin.');
        window.location.href = 'PBL.html';
    } catch (error) {
        alert("Gagal menyimpan data! Penyimpanan lokal penuh. Hapus cache atau gunakan gambar lebih kecil.");
        submitBtn.innerHTML = 'Eksekusi Laporan <i class="fa-solid fa-arrow-right"></i>';
        submitBtn.disabled = false;
    }
}

// ==========================================
// 4. RENDER FEED BERITA (Tampilan Kaca)
// ==========================================
window.renderBeritaTerkini = function(searchQuery = '') {
    const container = document.getElementById('feedBeritaTerkini');
    if (!container) return; 

    let laporanMhs = getLaporanDB().filter(item => item.status === 'Valid' || item.status === 'Selesai');
    let beritaAdm = getBeritaAdmin();
    let feed = [...laporanMhs, ...beritaAdm];

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        feed = feed.filter(i => (i.judul || i.nama_barang || '').toLowerCase().includes(q) || (i.lokasi || i.kategori || '').toLowerCase().includes(q));
    }

    container.innerHTML = '';
    if (feed.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center text-gray-500 py-10 font-light text-sm">Tidak ada data ditemukan dalam sistem.</div>`;
        return;
    }

    feed.sort((a,b) => b.id - a.id).forEach(item => {
        if(item.tipeAdmin) {
            container.innerHTML += `
                <div class="perfect-blur rounded-lg overflow-hidden flex flex-col group border border-white/20">
                    <div class="h-56 w-full overflow-hidden relative">
                        <img src="${item.gambar}" class="w-full h-full object-cover opacity-80 group-hover:scale-105 transition duration-700">
                        <span class="absolute top-4 left-4 bg-white text-black text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest"><i class="fa-solid fa-bullhorn mr-1"></i> ADMIN SYS</span>
                    </div>
                    <div class="p-6 flex-1 flex flex-col justify-between">
                        <div>
                            <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">${item.kategori}</div>
                            <h3 class="text-xl font-semibold text-white mb-3 leading-snug">${item.judul}</h3>
                            <p class="text-sm text-gray-300 font-light line-clamp-3 leading-relaxed">${item.isi}</p>
                        </div>
                        <button class="mt-5 text-left text-xs uppercase tracking-widest hover:text-gray-400 transition" onclick="alert('DETAIL PENGUMUMAN:\\n\\n${item.isi}')">Baca Instruksi <i class="fa-solid fa-arrow-right ml-1"></i></button>
                    </div>
                </div>`;
        } else {
            const isKehilangan = (item.tipe === 'Kehilangan');
            const badgeClass = isKehilangan ? 'border-red-500 text-red-400' : 'border-green-500 text-green-400';
            const flagSelesai = item.status === 'Selesai' ? '<div class="absolute inset-0 bg-black/80 flex items-center justify-center z-20 backdrop-blur-sm"><span class="border border-white text-white font-bold px-6 py-2 uppercase tracking-widest">KASUS DITUTUP</span></div>' : '';

            container.innerHTML += `
                <div class="perfect-blur rounded-lg overflow-hidden relative flex flex-col group border border-white/20">
                    ${flagSelesai}
                    <div class="h-56 w-full overflow-hidden relative">
                        <img src="${item.buktiFile}" class="w-full h-full object-cover opacity-80 group-hover:scale-105 transition duration-700">
                        <span class="absolute top-4 right-4 bg-black/60 backdrop-blur-sm border ${badgeClass} text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest">${item.tipe}</span>
                    </div>
                    <div class="p-6 flex-1 flex flex-col justify-between">
                        <div>
                            <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">${item.kategori}</div>
                            <h3 class="text-xl font-semibold text-white mb-3 truncate" title="${item.nama_barang}">${item.nama_barang}</h3>
                            <div class="space-y-1 mb-4">
                                <p class="text-xs text-gray-300 font-light"><span class="font-medium text-white">LOKASI:</span> ${item.lokasi}</p>
                                <p class="text-xs text-gray-300 font-light"><span class="font-medium text-white">WAKTU:</span> ${item.tanggal}</p>
                            </div>
                        </div>
                        <div class="pt-4 border-t border-white/10 text-[10px] uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            <i class="fa-regular fa-circle-user"></i> ${item.pelapor}
                        </div>
                    </div>
                </div>`;
        }
    });
};

// ==========================================
// 5. STATISTIK SISTEM
// ==========================================
window.hitungStatistik = function() {
    const db = getLaporanDB();
    if (document.getElementById('statTotal')) {
        document.getElementById('statTotal').innerText = db.length + '+';
        document.getElementById('statSelesai').innerText = db.filter(i => i.status === 'Selesai').length + '+';
    }
    // Jika berada di rekap.html
    if (document.getElementById('totalHilang')) {
        document.getElementById('totalHilang').innerText = db.filter(i => i.tipe === 'Kehilangan').length;
        document.getElementById('totalDitemukan').innerText = db.filter(i => i.tipe === 'Ditemukan').length;
        document.getElementById('totalSelesai').innerText = db.filter(i => i.status === 'Selesai').length;
    }
};

// ==========================================
// 6. INISIALISASI
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initDummyData();
    hitungStatistik();

    if (document.getElementById('feedBeritaTerkini')) {
        renderBeritaTerkini();
        const search = document.getElementById('globalSearch');
        if (search) search.addEventListener('input', (e) => renderBeritaTerkini(e.target.value));
    }

    const formLapor = document.getElementById('formLaporMahasiswa');
    if (formLapor) formLapor.addEventListener('submit', function(e) { window.prosesKirimLaporan(e); });
});