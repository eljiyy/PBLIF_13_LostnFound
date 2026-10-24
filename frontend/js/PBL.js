// FindIt Portal — front-end PBL logic. Storage remains browser-local by design.
const STORAGE_REPORTS = 'lostFoundLaporan';
const STORAGE_ADMIN_NEWS = 'adminBeritaPBL';
const PLACEHOLDER_IMAGE = '../assets/item-placeholder.svg';

function readArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(value) ? value : [];
    } catch (error) {
        console.warn('Data lokal tidak dapat dibaca:', key, error);
        return [];
    }
}

function getLaporanDB() {
    return readArray(STORAGE_REPORTS);
}

function saveLaporanDB(data) {
    localStorage.setItem(STORAGE_REPORTS, JSON.stringify(data));
}

function getBeritaAdmin() {
    return readArray(STORAGE_ADMIN_NEWS);
}

function initDummyData() {
    if (getLaporanDB().length === 0) {
        saveLaporanDB([{
            id: 1,
            pelapor: 'Yusuf Fauzi',
            nim: '33123001',
            tipe: 'Kehilangan',
            nama_barang: 'KTM Polibatam',
            kategori: 'Dokumen',
            tanggal: '2026-10-10',
            lokasi: 'Perpustakaan Lt. 2',
            ciri: 'Terdapat name tag lanyard biru.',
            buktiFile: PLACEHOLDER_IMAGE,
            status: 'Valid',
            tanggalDibuat: '10/10/2026'
        }]);
    }
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[ch]));
}

function safeImageSource(value) {
    const src = String(value || '');

    if (/^data:image\/(jpeg|png|webp);base64,/i.test(src)) {
        return src;
    }

    if (/^(https?:\/\/|\.\.\/|\.\/|assets\/)/i.test(src)) {
        return src;
    }

    return PLACEHOLDER_IMAGE;
}

// ========================================
// KOMPRESI FOTO BARANG
// ========================================
function compressImage(file, callback) {
    if (!file || !/^image\/(jpeg|png)$/i.test(file.type)) {
        callback(null);
        return;
    }

    const reader = new FileReader();

    reader.onerror = () => callback(null);

    reader.onload = event => {
        const img = new Image();

        img.onerror = () => callback(null);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxSize = 600;

            let width = img.width;
            let height = img.height;

            if (width > height && width > maxSize) {
                height *= maxSize / width;
                width = maxSize;
            } else if (height >= width && height > maxSize) {
                width *= maxSize / height;
                height = maxSize;
            }

            canvas.width = Math.max(1, Math.round(width));
            canvas.height = Math.max(1, Math.round(height));

            const ctx = canvas.getContext('2d');

            if (!ctx) {
                callback(null);
                return;
            }

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            callback(canvas.toDataURL('image/jpeg', 0.6));
        };

        img.src = event.target.result;
    };

    reader.readAsDataURL(file);
}

// ========================================
// PROSES PENGIRIMAN LAPORAN MAHASISWA
// ========================================
window.prosesKirimLaporan = function(event) {
    event.preventDefault();

    const user = JSON.parse(
        sessionStorage.getItem('activeUser') || 'null'
    );

    if (!user || user.role !== 'mahasiswa') {
        window.location.href = 'login.html';
        return;
    }

    const form = event.currentTarget;
    const button = document.getElementById('btnSubmitLaporan');

    if (button) {
        button.disabled = true;
        button.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    }

    const fileInput = document.getElementById('lap_foto');

    const persist = image => {
        simpanLaporan(form, user, image || PLACEHOLDER_IMAGE, button);
    };

    if (fileInput?.files?.length) {
        compressImage(fileInput.files[0], persist);
    } else {
        persist(PLACEHOLDER_IMAGE);
    }
};

function simpanLaporan(form, user, imageStr, button) {
    try {
        const item = {
            id: Date.now(),
            pelapor: user.nama || 'Mahasiswa',
            nim: user.nim || '',
            tipe: form.elements['tipe'].value,
            nama_barang: form.elements['nama_barang'].value.trim(),
            kategori: form.elements['kategori'].value,
            tanggal: form.elements['tanggal'].value,
            lokasi: form.elements['lokasi'].value.trim(),
            ciri: form.elements['ciri'].value.trim(),
            buktiFile: imageStr,
            status: 'Pending',
            tanggalDibuat: new Date().toLocaleDateString('id-ID')
        };

        const db = getLaporanDB();
        db.push(item);
        saveLaporanDB(db);

        alert(
            'Laporan tersimpan di antrean sistem dan menunggu validasi admin.'
        );

        window.location.href = 'PBL.html';

    } catch (error) {
        console.error(error);

        alert(
            'Penyimpanan lokal gagal. Coba foto berukuran lebih kecil ' +
            'atau kosongkan ruang penyimpanan browser.'
        );

        if (button) {
            button.disabled = false;
            button.innerHTML =
                '<i class="fa-solid fa-rotate-right"></i> Coba lagi';
        }
    }
}

// ========================================
// FORMAT TANGGAL DAN DETAIL LAPORAN
// ========================================
function formatDate(value) {
    if (!value) return 'Tanggal tidak tersedia';

    const d = new Date(
        value + (String(value).length === 10 ? 'T00:00:00' : '')
    );

    if (Number.isNaN(d.getTime())) {
        return String(value);
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(d);
}

function detailLaporan(id) {
    const item = getLaporanDB().find(
        entry => Number(entry.id) === Number(id)
    );

    if (!item) return;

    const status = item.status || 'Pending';

    alert(
        `Detail laporan\n\n` +
        `Barang: ${item.nama_barang || '-'}\n` +
        `Jenis: ${item.tipe || '-'}\n` +
        `Kategori: ${item.kategori || '-'}\n` +
        `Lokasi: ${item.lokasi || '-'}\n` +
        `Tanggal: ${formatDate(item.tanggal)}\n` +
        `Ciri barang: ${item.ciri || '-'}\n` +
        `Pelapor: ${item.pelapor || '-'}\n` +
        `Status: ${status}`
    );
}

window.detailLaporan = detailLaporan;

// ========================================
// KOMPONEN KARTU LAPORAN
// ========================================
function createHTMLCard(item, isAdminMsg = false) {

    if (isAdminMsg) {
        const image = escapeHTML(safeImageSource(item.gambar));
        const title = escapeHTML(item.judul || 'Informasi kampus');
        const content = escapeHTML(item.isi || '');

        return `
            <article class="report-card">
                <div class="report-image">
                    <img src="${image}"
                         alt="Ilustrasi informasi admin"
                         loading="lazy">
                    <span class="report-badge badge-found">INFO ADMIN</span>
                </div>

                <div class="report-body">
                    <div class="report-category">Papan informasi</div>
                    <h3 class="report-title" title="${title}">${title}</h3>
                    <p style="font-size:10px;line-height:1.7;color:var(--muted);margin:0">
                        ${content.slice(0, 150)}${content.length > 150 ? '…' : ''}
                    </p>
                </div>
            </article>
        `;
    }

    const isLost =
        item.tipe === 'Kehilangan' || item.tipe === 'Hilang';

    const isDone = item.status === 'Selesai';

    const badgeClass = isLost ? 'badge-lost' : 'badge-found';
    const badgeText = isLost ? 'Barang hilang' : 'Barang ditemukan';

    const doneOverlay = isDone
        ? '<div class="badge-done"><span>SELESAI</span></div>'
        : '';

    const image = escapeHTML(safeImageSource(item.buktiFile));
    const name = escapeHTML(item.nama_barang || 'Barang tanpa nama');
    const category = escapeHTML(item.kategori || 'Kategori lain');
    const location = escapeHTML(item.lokasi || 'Lokasi belum dicantumkan');
    const date = escapeHTML(formatDate(item.tanggal));
    const status = escapeHTML(item.status || 'Pending');

    const id = Number.isFinite(Number(item.id))
        ? Math.trunc(Number(item.id))
        : 0;

    return `
        <article class="report-card"
                 role="button"
                 tabindex="0"
                 aria-label="Lihat detail ${name}"
                 onclick="window.detailLaporan(${id})"
                 onkeydown="if(event.key==='Enter'||event.key===' '){
                    event.preventDefault();
                    window.detailLaporan(${id});
                 }">

            <div class="report-image">
                ${doneOverlay}

                <img src="${image}"
                     alt="Foto ${name}"
                     loading="lazy"
                     onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}'">

                <span class="report-badge ${badgeClass}">
                    ${badgeText}
                </span>
            </div>

            <div class="report-body">
                <div class="report-category">${category}</div>

                <h3 class="report-title" title="${name}">
                    ${name}
                </h3>

                <div class="report-meta">
                    <span>
                        <i class="fa-solid fa-location-dot"></i>
                        ${location}
                    </span>
                    <span>
                        <i class="fa-regular fa-calendar"></i>
                        ${date}
                    </span>
                </div>

                <span class="report-status ${isDone ? 'completed' : ''}">
                    Status: ${status}
                </span>
            </div>
        </article>
    `;
}

function emptyState(message) {
    return `
        <div class="empty-state">
            <i class="fa-regular fa-folder-open"></i>
            ${escapeHTML(message)}
        </div>
    `;
}

// ========================================
// RENDER LAPORAN BERANDA
// ========================================
window.renderBeritaTerkini = function(query = '') {
    const container = document.getElementById('feedBeritaTerkini');

    if (!container) return;

    const needle = String(query || '').toLowerCase().trim();

    const data = getLaporanDB().filter(
        item => item.status === 'Valid' || item.status === 'Selesai'
    );

    const news = getBeritaAdmin();

    let feed = [...data, ...news].filter(item =>
        !needle ||
        `${item.judul || ''} ${item.nama_barang || ''} ` +
        `${item.lokasi || ''} ${item.kategori || ''}`
            .toLowerCase()
            .includes(needle)
    );

    feed.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

    container.innerHTML = feed.length
        ? feed.slice(0, 4)
            .map(item => createHTMLCard(item, !!item.tipeAdmin))
            .join('')
        : emptyState(
            needle
                ? 'Tidak ada laporan cocok dengan pencarian.'
                : 'Belum ada laporan terverifikasi. Laporan baru akan tampil setelah divalidasi.'
        );
};

// ========================================
// RENDER DATABASE LAPORAN
// ========================================
window.renderDatabasePBL = function(query = '', type = 'Semua') {
    const container = document.getElementById('reportContainer');

    if (!container) return;

    const needle = String(query || '').toLowerCase().trim();

    let records = getLaporanDB().filter(
        item => item.status === 'Valid' || item.status === 'Selesai'
    );

    if (type !== 'Semua') {
        records = records.filter(
            item => item.tipe === type ||
                (type === 'Kehilangan' && item.tipe === 'Hilang')
        );
    }

    if (needle) {
        records = records.filter(item =>
            `${item.nama_barang || ''} ${item.lokasi || ''} ` +
            `${item.kategori || ''} ${item.ciri || ''}`
                .toLowerCase()
                .includes(needle)
        );
    }

    records.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

    const count = document.getElementById('databaseCount');

    if (count) {
        count.textContent = `${records.length} laporan`;
    }

    container.innerHTML = records.length
        ? records.map(item => createHTMLCard(item, false)).join('')
        : emptyState(
            needle || type !== 'Semua'
                ? 'Tidak ada laporan yang cocok dengan filter saat ini.'
                : 'Belum ada laporan terverifikasi yang tersedia.'
        );
};

// ========================================
// HITUNG STATISTIK DASHBOARD
// ========================================
window.hitungStatistik = function() {
    const db = getLaporanDB();

    const isLost = item =>
        item.tipe === 'Kehilangan' || item.tipe === 'Hilang';

    const lost = db.filter(isLost).length;
    const found = db.filter(item => item.tipe === 'Ditemukan').length;
    const pending = db.filter(item => item.status === 'Pending').length;
    const valid = db.filter(item => item.status === 'Valid').length;
    const done = db.filter(item => item.status === 'Selesai').length;

    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value);
    };

    set('statTotal', db.length);
    set('statHilang', lost);
    set('statDitemukan', found);
    set('statSelesai', done);

    set('totalHilang', lost);
    set('totalDitemukan', found);
    set('totalSelesai', done);
    set('totalPending', pending);
    set('totalSemua', `${db.length} laporan`);

    set('statusPending', pending);
    set('statusValid', valid);
    set('statusSelesai', done);

    const total = db.length || 1;

    const updateBar = (id, count) => {
        const el = document.getElementById(id);

        if (el) {
            el.style.width = `${Math.min(100, (count / total) * 100)}%`;
        }
    };

    updateBar('barStatusPending', pending);
    updateBar('barStatusValid', valid);
    updateBar('barStatusSelesai', done);

    updateBar('barPending', pending);
    updateBar('barValid', valid);
    updateBar('barSelesai', done);

    const setPerc = (id, count) => {
        set(id, `${count} laporan · ${Math.round(count / total * 100)}%`);
    };

    setPerc('valuePending', pending);
    setPerc('valueValid', valid);
    setPerc('valueSelesai', done);
};

// ========================================
// INISIALISASI HALAMAN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initDummyData();
    hitungStatistik();

    const feed = document.getElementById('feedBeritaTerkini');

    if (feed) {
        renderBeritaTerkini();

        const search = document.getElementById('globalSearch');

        if (search) {
            search.addEventListener('input', e =>
                renderBeritaTerkini(e.target.value)
            );
        }
    }

    const reports = document.getElementById('reportContainer');

    if (reports) {
        renderDatabasePBL();

        const search = document.getElementById('inputSearch');
        const filter = document.getElementById('filterTipe');

        const run = () => renderDatabasePBL(
            search?.value || '',
            filter?.value || 'Semua'
        );

        if (search) search.addEventListener('input', run);
        if (filter) filter.addEventListener('change', run);
    }

    const reportForm = document.getElementById('formLaporMahasiswa');

    if (reportForm) {
        reportForm.addEventListener('submit', prosesKirimLaporan);
    }
});