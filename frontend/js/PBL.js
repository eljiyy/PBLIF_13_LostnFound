/* FindIt – lapisan data relasional + logika halaman.
   Tabel: kategori_barang, pelapor, laporan_barang (PK auto-increment, FK id_kategori & id_pelapor).
   Penyimpanan: localStorage browser (situs statis tanpa server basis data). */
const T = { kat: 'fi_kategori_barang', pel: 'fi_pelapor', lap: 'fi_laporan_barang', seq: 'fi_seq', seed: 'fi_seed_v2', news: 'adminBeritaPBL' };
const PLACEHOLDER_IMAGE = '../images/Logo Pbl FindIt.jpg';
const ADMIN_WA = '6281572877012';
const STATUSES = ['Aktif', 'Cocok', 'Dikembalikan', 'Ditutup'];
const TIPES = ['Hilang', 'Ditemukan'];
const SELESAI = ['Dikembalikan', 'Ditutup'];
const VERIF = ['Menunggu', 'Valid', 'Tidak Valid']; // verifikasi petugas, terpisah dari status kasus

/* ---------- util ---------- */
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = id => document.getElementById(id);
const readJSON = (k, d = []) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } };
const getActiveUser = () => { try { return JSON.parse(sessionStorage.getItem('activeUser')); } catch { return null; } };
const fmtTanggal = iso => { const d = new Date(iso + 'T00:00:00'); return isNaN(d) ? iso : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); };
const todayISO = (off = 0) => { const d = new Date(); d.setDate(d.getDate() + off); return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-'); };
function showToast(msg, type = 'ok') {
    let t = $('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.className = 'toast toast--' + type; t.textContent = msg;
    requestAnimationFrame(() => t.classList.add('is-show'));
    clearTimeout(showToast._t); showToast._t = setTimeout(() => t.classList.remove('is-show'), 3400);
}
/* Notifikasi yang bertahan melewati perpindahan halaman */
function flashNext(msg, type = 'ok') { sessionStorage.setItem('fi_flash', JSON.stringify({ msg, type })); }

/* ---------- tabel ---------- */
const rows = n => readJSON(T[n]);
function save(n, list) {
    try { localStorage.setItem(T[n], JSON.stringify(list)); return true; } catch { return false; }
}
function nextId(n, pk) {
    const seq = readJSON(T.seq, {});
    const id = Math.max(seq[n] || 0, ...rows(n).map(r => r[pk]), 0) + 1;
    seq[n] = id; localStorage.setItem(T.seq, JSON.stringify(seq));
    return id;
}
const fail = msg => ({ ok: false, msg });
const done = (msg, data) => ({ ok: true, msg, data });

/* Kategori */
const Kategori = {
    all: () => rows('kat').sort((a, b) => a.nama_kategori.localeCompare(b.nama_kategori)),
    get: id => rows('kat').find(k => k.id_kategori === Number(id)),
    add(nama) {
        nama = (nama || '').trim();
        if (!nama) return fail('Nama kategori wajib diisi.');
        if (nama.length > 50) return fail('Nama kategori maksimal 50 karakter.');
        const list = rows('kat');
        if (list.some(k => k.nama_kategori.toLowerCase() === nama.toLowerCase())) return fail('Kategori sudah ada.');
        const k = { id_kategori: nextId('kat', 'id_kategori'), nama_kategori: nama };
        list.push(k); return save('kat', list) ? done('Kategori ditambahkan.', k) : fail('Gagal menyimpan.');
    },
    update(id, nama) {
        nama = (nama || '').trim();
        if (!nama) return fail('Nama kategori wajib diisi.');
        const list = rows('kat'), k = list.find(x => x.id_kategori === Number(id));
        if (!k) return fail('Kategori tidak ditemukan.');
        if (list.some(x => x !== k && x.nama_kategori.toLowerCase() === nama.toLowerCase())) return fail('Kategori sudah ada.');
        k.nama_kategori = nama; return save('kat', list) ? done('Kategori diperbarui.') : fail('Gagal menyimpan.');
    },
    remove(id) {
        id = Number(id);
        const used = rows('lap').filter(l => l.id_kategori === id).length;
        if (used) return fail(`Kategori masih dipakai ${used} laporan, penghapusan ditolak.`);
        save('kat', rows('kat').filter(k => k.id_kategori !== id)); return done('Kategori dihapus.');
    }
};

/* Pelapor */
const Pelapor = {
    all: () => rows('pel').sort((a, b) => a.nama.localeCompare(b.nama)),
    get: id => rows('pel').find(p => p.id_pelapor === Number(id)),
    byNim: nim => rows('pel').find(p => p.nim === nim),
    validate(d, selfId) {
        if (!d.nama?.trim() || !d.nim?.trim() || !d.kontak?.trim()) return 'Nama, NIM, dan kontak wajib diisi.';
        if (!validKontak(d.kontak)) return 'Kontak harus berupa nomor HP (08xx / +62xx) atau email yang valid.';
        if (rows('pel').some(p => p.nim === d.nim.trim() && p.id_pelapor !== selfId)) return 'NIM sudah terdaftar sebagai pelapor.';
        return '';
    },
    add(d) {
        const err = this.validate(d); if (err) return fail(err);
        const list = rows('pel');
        const p = { id_pelapor: nextId('pel', 'id_pelapor'), nama: d.nama.trim(), nim: d.nim.trim(), kontak: d.kontak.trim() };
        list.push(p); return save('pel', list) ? done('Pelapor ditambahkan.', p) : fail('Gagal menyimpan.');
    },
    update(id, d) {
        const err = this.validate(d, Number(id)); if (err) return fail(err);
        const list = rows('pel'), p = list.find(x => x.id_pelapor === Number(id));
        if (!p) return fail('Pelapor tidak ditemukan.');
        Object.assign(p, { nama: d.nama.trim(), nim: d.nim.trim(), kontak: d.kontak.trim() });
        return save('pel', list) ? done('Pelapor diperbarui.') : fail('Gagal menyimpan.');
    },
    remove(id) {
        id = Number(id);
        const used = rows('lap').filter(l => l.id_pelapor === id).length;
        if (used) return fail(`Pelapor masih memiliki ${used} laporan, penghapusan ditolak.`);
        save('pel', rows('pel').filter(p => p.id_pelapor !== id)); return done('Pelapor dihapus.');
    },
    /* Pastikan pengguna yang login punya baris di tabel pelapor.
       Akun sudah terdaftar di login, jadi tidak divalidasi ulang kontaknya di sini. */
    ensure(user) {
        if (!user || !user.nim) return null;
        let p = this.byNim(user.nim);
        if (!p) {
            const list = rows('pel');
            p = { id_pelapor: nextId('pel', 'id_pelapor'), nama: (user.nama || 'Mahasiswa').trim(), nim: String(user.nim).trim(), kontak: (user.nohp || '-').toString().trim() || '-' };
            list.push(p); if (!save('pel', list)) return null;
        }
        return p;
    }
};

function validKontak(v) {
    v = (v || '').trim();
    return /^(\+62|62|0)8[0-9]{8,12}$/.test(v.replace(/[\s-]/g, '')) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/* Laporan */
const Laporan = {
    all() {
        const kat = Object.fromEntries(rows('kat').map(k => [k.id_kategori, k]));
        const pel = Object.fromEntries(rows('pel').map(p => [p.id_pelapor, p]));
        return rows('lap').map(l => ({ ...l, kategori: kat[l.id_kategori]?.nama_kategori || '-', pelapor: pel[l.id_pelapor] || { nama: '-', nim: '-', kontak: '-' }, verifikasi: l.verifikasi || 'Menunggu', catatan: l.catatan || '' }))
            .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.id_laporan - a.id_laporan);
    },
    get: id => Laporan.all().find(l => l.id_laporan === Number(id)),
    validate(d) {
        const need = { tipe: 'Jenis laporan', id_kategori: 'Kategori', nama_barang: 'Nama barang', tanggal: 'Tanggal', lokasi: 'Lokasi', ciri: 'Ciri-ciri', kontak: 'Kontak', id_pelapor: 'Pelapor' };
        for (const k in need) if (!String(d[k] ?? '').trim()) return `${need[k]} wajib diisi.`;
        if (!TIPES.includes(d.tipe)) return 'Jenis laporan tidak valid.';
        if (!Kategori.get(d.id_kategori)) return 'Kategori tidak ditemukan.';
        if (!Pelapor.get(d.id_pelapor)) return 'Pelapor tidak ditemukan.';
        if (d.nama_barang.trim().length > 120) return 'Nama barang maksimal 120 karakter.';
        if (d.lokasi.trim().length > 150) return 'Lokasi maksimal 150 karakter.';
        if (d.tanggal > todayISO()) return 'Tanggal tidak boleh di masa depan.';
        if (!validKontak(d.kontak)) return 'Kontak harus berupa nomor HP (08xx / +62xx) atau email yang valid.';
        if (d.status && !STATUSES.includes(d.status)) return 'Status tidak valid.';
        return '';
    },
    clean: d => ({ id_kategori: Number(d.id_kategori), id_pelapor: Number(d.id_pelapor), tipe: d.tipe, nama_barang: d.nama_barang.trim(), tanggal: d.tanggal, lokasi: d.lokasi.trim(), ciri: d.ciri.trim(), kontak: d.kontak.trim() }),
    add(d) {
        const err = this.validate(d); if (err) return fail(err);
        const list = rows('lap');
        const r = { id_laporan: nextId('lap', 'id_laporan'), ...this.clean(d), status: 'Aktif', verifikasi: 'Menunggu', catatan: '', foto: d.foto || '', dibuat: new Date().toISOString() };
        list.push(r); return save('lap', list) ? done('Laporan tersimpan dengan status Aktif dan menunggu verifikasi petugas.', r) : fail('Penyimpanan penuh. Gunakan foto yang lebih kecil.');
    },
    update(id, d, resetVerif) {
        const err = this.validate(d); if (err) return fail(err);
        const list = rows('lap'), r = list.find(x => x.id_laporan === Number(id));
        if (!r) return fail('Laporan tidak ditemukan.');
        Object.assign(r, this.clean(d)); if (d.foto) r.foto = d.foto;
        if (resetVerif) { r.verifikasi = 'Menunggu'; r.catatan = ''; } // revisi mahasiswa dikirim ulang ke petugas
        return save('lap', list) ? done('Laporan berhasil diperbarui.') : fail('Penyimpanan penuh.');
    },
    setVerifikasi(id, v, catatan) {
        if (!VERIF.includes(v)) return fail('Status verifikasi tidak valid.');
        if (v === 'Tidak Valid' && !(catatan || '').trim()) return fail('Alasan wajib diisi saat menandai laporan tidak valid.');
        const list = rows('lap'), r = list.find(x => x.id_laporan === Number(id));
        if (!r) return fail('Laporan tidak ditemukan.');
        r.verifikasi = v; r.catatan = v === 'Tidak Valid' ? catatan.trim() : '';
        return save('lap', list) ? done(`Verifikasi diubah menjadi ${v}.`) : fail('Gagal menyimpan.');
    },
    setStatus(id, status) {
        if (!STATUSES.includes(status)) return fail('Status tidak valid.');
        const list = rows('lap'), r = list.find(x => x.id_laporan === Number(id));
        if (!r) return fail('Laporan tidak ditemukan.');
        r.status = status; return save('lap', list) ? done(`Status diubah menjadi ${status}.`) : fail('Gagal menyimpan.');
    },
    remove(id) {
        const before = rows('lap').length;
        const list = rows('lap').filter(x => x.id_laporan !== Number(id));
        if (list.length === before) return fail('Laporan tidak ditemukan.');
        save('lap', list); return done('Laporan dihapus.');
    },
    /* pencarian/filter: q (nama, kategori, lokasi, ciri), kategori, tipe, status, from/to (periode) */
    search(f = {}) {
        const q = (f.q || '').toLowerCase().trim();
        return this.all().filter(l =>
            (!q || [l.nama_barang, l.kategori, l.lokasi, l.ciri].some(x => String(x).toLowerCase().includes(q))) &&
            (!f.kategori || String(l.id_kategori) === String(f.kategori)) &&
            (!f.tipe || l.tipe === f.tipe) && (!f.status || l.status === f.status) &&
            (!f.from || l.tanggal >= f.from) && (!f.to || l.tanggal <= f.to));
    }
};

/* Hak akses: hanya petugas yang mengubah/menghapus laporan.
   Mahasiswa hanya boleh merevisi laporan miliknya setelah petugas menandainya "Tidak Valid". */
function canEdit(l) {
    const u = getActiveUser(); if (!u) return false;
    if (u.role === 'admin') return true;
    return u.role === 'mahasiswa' && l.pelapor?.nim === u.nim && l.verifikasi === 'Tidak Valid';
}
const canDelete = () => getActiveUser()?.role === 'admin';

/* ---------- data uji ---------- */
function seedIfEmpty() {
    if (localStorage.getItem(T.seed)) return;
    ['kat', 'pel', 'lap'].forEach(n => localStorage.removeItem(T[n]));
    localStorage.removeItem(T.seq);
    ['Elektronik', 'Dokumen & Kartu', 'Dompet & Aksesori', 'Kendaraan & Kunci', 'Tas & Perlengkapan', 'Lainnya'].forEach(n => Kategori.add(n));
    [['Rizky Pratama', '3312501011', '081234560011'], ['Nadia Putri', '3312501024', 'nadia.putri@students.polibatam.ac.id'], ['Petugas Keamanan', '0000000001', '081572877012']]
        .forEach(([nama, nim, kontak]) => Pelapor.add({ nama, nim, kontak }));
    const K = n => Kategori.all().find(k => k.nama_kategori.startsWith(n)).id_kategori;
    const P = [1, 2, 3];
    const S = [
        [1, 'Ditemukan', 'Elektronik', 'Laptop ASUS ROG', 'Gedung Tower Lantai 5', 2, 'Stiker naga di bagian atas, casing hitam, charger ikut ditemukan.', '../images/Laptop.png', 'Aktif', 3],
        [2, 'Ditemukan', 'Dompet', 'Dompet kulit cokelat', 'Kantin Gedung Utama', 5, 'Kulit cokelat tua, jahitan kuning, berisi kartu dan uang tunai.', '../images/dompet kulit.png', 'Cocok', 3],
        [0, 'Hilang', 'Kendaraan', 'Kunci motor Honda Vario', 'Area parkir timur', 6, 'Gantungan karakter kucing oranye, ada kunci cadangan.', '../images/kunci motor.png', 'Aktif', 1],
        [1, 'Hilang', 'Dokumen', 'Kartu Mahasiswa (KTM)', 'Perpustakaan lantai 2', 12, 'KTM atas nama Nadia Putri, ada goresan di sudut kanan.', '', 'Dikembalikan', 2],
        [0, 'Ditemukan', 'Tas', 'Tas ransel hitam', 'Lab Robotika', 18, 'Ransel hitam merek Eiger, berisi buku catatan dan botol minum.', '', 'Dikembalikan', 3],
        [1, 'Hilang', 'Elektronik', 'Earbud putih', 'Ruang kelas Tower 304', 25, 'Case putih dengan stiker bintang, earbud kiri retak.', '', 'Ditutup', 2],
        [0, 'Hilang', 'Elektronik', 'Smartwatch hitam', 'Gym Gedung Olahraga', 31, 'Strap silikon hitam, layar ada goresan tipis.', '', 'Aktif', 1],
        [1, 'Ditemukan', 'Lainnya', 'Payung lipat biru', 'Halte kampus', 40, 'Payung lipat biru tua dengan gagang karet.', '', 'Ditutup', 3]
    ];
    S.forEach(([, tipe, kat, nama, lokasi, ago, ciri, foto, status, pel]) => {
        const r = Laporan.add({ tipe, id_kategori: K(kat), id_pelapor: pel, nama_barang: nama, tanggal: todayISO(-ago), lokasi, ciri, kontak: Pelapor.get(pel).kontak, foto });
        Laporan.setStatus(r.data.id_laporan, status); Laporan.setVerifikasi(r.data.id_laporan, 'Valid');
    });
    localStorage.setItem(T.seed, '1');
}

/* ---------- tampilan bersama ---------- */
const verifChip = v => `<span class="status status--v-${v === 'Valid' ? 'valid' : v === 'Menunggu' ? 'menunggu' : 'tidak'}">${v === 'Menunggu' ? 'Menunggu verifikasi' : v}</span>`;
const statusChip = s => `<span class="status status--${esc(s.toLowerCase())}">${esc(s)}</span>`;
function createHTMLCard(item, isAdminMsg = false) {
    if (isAdminMsg) return `<article class="notice-card">
        <p class="notice-card__tag">${esc(item.kategori || 'INFO')} &middot; ${esc(item.tanggal || '')}</p>
        <h3>${esc(item.judul)}</h3><p>${esc(item.isi)}</p></article>`;
    const hilang = item.tipe === 'Hilang';
    const actions = (canEdit(item) || canDelete()) ? `<div class="report-card__actions">
        ${canEdit(item) ? `<a class="chip-btn" href="lapor.html?edit=${item.id_laporan}"><i class="fa-solid fa-pen"></i> ${canDelete() ? 'Ubah' : 'Revisi'}</a>` : ''}
        ${canDelete() ? `<button type="button" class="chip-btn chip-btn--danger" onclick="hapusLaporanUI(${item.id_laporan})"><i class="fa-solid fa-trash"></i> Hapus</button>` : ''}</div>` : '';
    return `<article class="report-card">
        <a class="report-card__media" href="detail-laporan.html?id=${item.id_laporan}" aria-label="Lihat detail ${esc(item.nama_barang)}">
            <span class="badge ${hilang ? 'badge--lost' : 'badge--found'}">${esc(item.tipe)}</span>
            <img src="${esc(item.foto || PLACEHOLDER_IMAGE)}" alt="${esc(item.nama_barang)}" loading="lazy" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}'">
        </a>
        <div class="report-card__body">
            <div class="report-card__row"><span class="item-cat">${esc(item.kategori)}</span><span>${verifChip(item.verifikasi)} ${statusChip(item.status)}</span></div>
            <h3 class="report-card__title">${esc(item.nama_barang)}</h3>
            <p class="report-card__meta"><i class="fa-solid fa-location-dot"></i> ${esc(item.lokasi)} <span>&bull;</span> ${esc(fmtTanggal(item.tanggal))}</p>
            <p class="report-card__desc">${esc(item.ciri)}</p>
            <a class="button button-secondary" href="detail-laporan.html?id=${item.id_laporan}">Lihat detail</a>
            ${actions}
        </div></article>`;
}
function hapusLaporanUI(id, after) {
    if (!canDelete()) return showToast('Hanya petugas yang dapat menghapus laporan.', 'err');
    if (!confirm('Hapus laporan ini? Tindakan tidak dapat dibatalkan.')) return;
    const r = Laporan.remove(id);
    showToast(r.msg, r.ok ? 'ok' : 'err');
    if (r.ok) { if (after) after(); else if ($('reportContainer')) renderDaftar(); }
}
/* Verifikasi/klaim barang selalu dialihkan ke WhatsApp petugas (ADMIN_WA) */
function hubungiWA(id) {
    const l = Laporan.get(id); if (!l) return;
    const pesan = `Halo Petugas FindIt, saya ingin verifikasi laporan #${l.id_laporan}: "${l.nama_barang}" (${l.tipe}, ${l.lokasi}, ${fmtTanggal(l.tanggal)}).`;
    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(pesan)}`, '_blank', 'noopener');
}
function fillKategoriSelect(sel, placeholder) {
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = (placeholder ? `<option value="">${placeholder}</option>` : '') + Kategori.all().map(k => `<option value="${k.id_kategori}">${esc(k.nama_kategori)}</option>`).join('');
    if (cur) sel.value = cur;
}
const emptyState = (t = 'Data tidak ditemukan', p = 'Ubah kata kunci atau filter, atau buat laporan baru.') =>
    `<div class="empty-state grid-full"><i class="fa-regular fa-folder-open"></i><h3>${t}</h3><p>${p}</p></div>`;

/* ---------- daftar ---------- */
function renderDaftar() {
    const box = $('reportContainer'); if (!box) return;
    const f = { q: $('inputSearch')?.value, kategori: $('filterKategori')?.value, tipe: $('filterTipe')?.value, status: $('filterStatus')?.value };
    const list = Laporan.search(f);
    const filtering = Object.values(f).some(Boolean);
    $('resultCount').textContent = `${list.length} laporan ditampilkan`;
    const news = filtering ? [] : readJSON(T.news).slice().reverse();
    box.innerHTML = news.map(n => `<div class="grid-full">${createHTMLCard(n, true)}</div>`).join('') + (list.length ? list.map(l => createHTMLCard(l)).join('') : emptyState());
}
function initDaftar() {
    if (!$('reportContainer')) return;
    fillKategoriSelect($('filterKategori'), 'Semua kategori');
    const q = new URLSearchParams(location.search).get('q'); if (q) $('inputSearch').value = q;
    ['inputSearch', 'filterKategori', 'filterTipe', 'filterStatus'].forEach(id => $(id)?.addEventListener(id === 'inputSearch' ? 'input' : 'change', renderDaftar));
    $('btnResetFilter')?.addEventListener('click', () => { ['inputSearch', 'filterKategori', 'filterTipe', 'filterStatus'].forEach(id => $(id).value = ''); renderDaftar(); });
    renderDaftar();
}

/* ---------- detail ---------- */
function renderDetail() {
    const root = $('detailRoot'); if (!root) return;
    const id = new URLSearchParams(location.search).get('id');
    const l = Laporan.get(id);
    if (!l) { root.innerHTML = emptyState('Laporan tidak ditemukan', 'Laporan mungkin sudah dihapus.'); return; }
    const u = getActiveUser(), admin = u?.role === 'admin';
    const row = (k, v) => `<div class="detail-row"><dt>${k}</dt><dd>${v}</dd></div>`;
    root.innerHTML = `<article class="panel detail-card">
        <div class="detail-media"><img src="${esc(l.foto || PLACEHOLDER_IMAGE)}" alt="${esc(l.nama_barang)}" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}'"></div>
        <div class="detail-info">
            <div class="report-card__row"><span class="item-cat">${esc(l.kategori)}</span><span>${verifChip(l.verifikasi)} ${statusChip(l.status)}</span></div>
            <h2 class="detail-title">${esc(l.nama_barang)}</h2>
            <p class="detail-type">${l.tipe === 'Hilang' ? 'Barang hilang' : 'Barang ditemukan'} &middot; Laporan #${l.id_laporan}</p>
            <dl class="detail-list">
                ${row('Tanggal kejadian', esc(fmtTanggal(l.tanggal)))}${row('Lokasi', esc(l.lokasi))}
                ${row('Ciri-ciri', esc(l.ciri))}${row('Pelapor', `${esc(l.pelapor.nama)} <small>(${esc(l.pelapor.nim)})</small>`)}${row('Kontak pelapor', `${esc(l.kontak)} <small>(hubungi manual)</small>`)}
            </dl>
            ${l.verifikasi === 'Tidak Valid' ? `<div class="info-strip info-strip--warn"><i class="fa-solid fa-triangle-exclamation"></i><div><strong>Laporan ditandai tidak valid oleh petugas</strong><p>${esc(l.catatan)}${canEdit(l) && !admin ? ' Perbaiki laporan lalu kirim ulang untuk diverifikasi.' : ''}</p></div></div>` : ''}
            <div class="detail-actions">
                <button type="button" class="button button-primary" onclick="hubungiWA(${l.id_laporan})"><i class="fa-brands fa-whatsapp"></i> Hubungi Admin</button>
                ${canEdit(l) ? `<a class="button button-secondary" href="lapor.html?edit=${l.id_laporan}"><i class="fa-solid fa-pen"></i> ${admin ? 'Ubah' : 'Revisi laporan'}</a>` : ''}
                ${admin ? `<button type="button" class="button button-secondary" onclick="hapusLaporanUI(${l.id_laporan}, () => { flashNext('Laporan dihapus.'); location.href='daftar-laporan.html'; })"><i class="fa-solid fa-trash"></i> Hapus</button>` : ''}
            </div>
            ${admin ? `<div class="panel-soft detail-status"><label for="detailVerif">Verifikasi laporan (petugas)</label>
                <div class="detail-status__row"><select id="detailVerif">${VERIF.map(v => `<option ${v === l.verifikasi ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
                <textarea id="detailCatatan" rows="2" placeholder="Alasan jika tidak valid (wajib)..." style="margin-top:10px;min-height:0">${esc(l.catatan)}</textarea>
                <button type="button" class="button button-primary" id="btnVerif" style="margin-top:10px">Simpan verifikasi</button></div>
            <div class="panel-soft detail-status"><label for="detailStatusSel">Perbarui status kasus (petugas)</label>
                <div class="detail-status__row"><select id="detailStatusSel">${STATUSES.map(s => `<option ${s === l.status ? 'selected' : ''}>${s}</option>`).join('')}</select>
                <button type="button" class="button button-primary" id="btnStatus">Simpan</button></div></div>` : ''}
        </div></article>`;
    $('btnVerif')?.addEventListener('click', () => {
        const r = Laporan.setVerifikasi(l.id_laporan, $('detailVerif').value, $('detailCatatan').value);
        showToast(r.msg, r.ok ? 'ok' : 'err'); if (r.ok) renderDetail();
    });
    $('btnStatus')?.addEventListener('click', () => {
        const r = Laporan.setStatus(l.id_laporan, $('detailStatusSel').value);
        showToast(r.msg, r.ok ? 'ok' : 'err'); renderDetail();
    });
}

/* ---------- form lapor (tambah & ubah) ---------- */
function compressImage(file, max = 720) {
    return new Promise((resolve, reject) => {
        const fr = new FileReader(); fr.onerror = reject;
        fr.onload = () => {
            const img = new Image(); img.onerror = reject;
            img.onload = () => {
                const s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
                c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
                c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                resolve(c.toDataURL('image/jpeg', 0.78));
            };
            img.src = fr.result;
        };
        fr.readAsDataURL(file);
    });
}
function initFormLapor() {
    const form = $('formLaporMahasiswa'); if (!form) return;
    const user = getActiveUser();
    if (!user) return location.replace('login.html');
    const admin = user.role === 'admin';
    fillKategoriSelect($('lap_kategori'));
    $('lap_tanggal').max = todayISO(); $('lap_tanggal').value = todayISO();
    if (admin) {
        $('fieldPelapor').hidden = false;
        $('lap_pelapor').innerHTML = Pelapor.all().map(p => `<option value="${p.id_pelapor}">${esc(p.nama)} (${esc(p.nim)})</option>`).join('');
    } else if (user.nohp && !$('lap_kontak').value) $('lap_kontak').value = user.nohp;
    const editId = new URLSearchParams(location.search).get('edit');
    let editing = null;
    if (editId) {
        editing = Laporan.get(editId);
        if (!editing || !canEdit(editing)) { flashNext('Laporan hanya dapat direvisi setelah petugas menandainya tidak valid.', 'err'); return location.replace('daftar-laporan.html'); }
        $('formTitle').textContent = 'Ubah laporan'; $('btnSubmitLaporan').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan perubahan';
        $('lap_tipe').value = editing.tipe; $('lap_kategori').value = editing.id_kategori; $('lap_nama').value = editing.nama_barang;
        $('lap_lokasi').value = editing.lokasi; $('lap_tanggal').value = editing.tanggal; $('lap_ciri').value = editing.ciri; $('lap_kontak').value = editing.kontak;
        if (admin) $('lap_pelapor').value = editing.id_pelapor;
    }
    $('lap_foto').addEventListener('change', e => { $('fileName').textContent = e.target.files?.[0]?.name || 'Pilih foto atau seret file ke area ini'; });
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = $('btnSubmitLaporan'); btn.disabled = true;
        const pel = admin ? Pelapor.get($('lap_pelapor').value) : Pelapor.ensure(user);
        let foto = '';
        const file = $('lap_foto').files?.[0];
        try { if (file) foto = await compressImage(file); } catch { btn.disabled = false; return showToast('Foto tidak dapat dibaca. Gunakan JPG atau PNG.', 'err'); }
        if (!pel && !(editing && !admin)) { btn.disabled = false; return showToast('Akun tidak dikenali. Silakan login ulang.', 'err'); }
        const data = { tipe: $('lap_tipe').value, id_kategori: $('lap_kategori').value, id_pelapor: editing && !admin ? editing.id_pelapor : pel?.id_pelapor, nama_barang: $('lap_nama').value, lokasi: $('lap_lokasi').value, tanggal: $('lap_tanggal').value, ciri: $('lap_ciri').value, kontak: $('lap_kontak').value, foto };
        const r = editing ? Laporan.update(editing.id_laporan, data, !admin) : Laporan.add(data);
        btn.disabled = false;
        if (!r.ok) return showToast(r.msg, 'err');
        flashNext(editing && !admin ? 'Revisi terkirim. Laporan menunggu verifikasi ulang petugas.' : r.msg);
        location.href = 'detail-laporan.html?id=' + (editing ? editing.id_laporan : r.data.id_laporan);
    });
}

/* ---------- rekap ---------- */
function animateNumber(el, to) {
    const t0 = performance.now();
    const step = t => { const p = Math.min(1, (t - t0) / 600); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
}
function groupCount(list, keyFn) {
    const m = {}; list.forEach(l => { const k = keyFn(l); (m[k] = m[k] || { Hilang: 0, Ditemukan: 0 })[l.tipe]++; });
    return Object.entries(m).map(([k, v]) => ({ k, ...v, total: v.Hilang + v.Ditemukan })).sort((a, b) => b.total - a.total);
}
function renderRekap() {
    if (!$('totalHilang')) return;
    const list = Laporan.search({ kategori: $('rkKategori').value, from: $('rkFrom').value, to: $('rkTo').value, status: $('rkStatus')?.value });
    const n = fn => list.filter(fn).length, total = list.length;
    animateNumber($('totalHilang'), n(l => l.tipe === 'Hilang'));
    animateNumber($('totalDitemukan'), n(l => l.tipe === 'Ditemukan'));
    animateNumber($('totalSelesai'), n(l => SELESAI.includes(l.status)));
    animateNumber($('totalAktif'), n(l => l.status === 'Aktif'));
    $('totalSemua').textContent = `${total} laporan`;
    const rate = total ? Math.round(n(l => SELESAI.includes(l.status)) / total * 100) : 0;
    $('rateSelesai').textContent = `${rate}% kasus terselesaikan`;
    $('statusRows').innerHTML = STATUSES.map(s => {
        const c = n(l => l.status === s), pct = total ? Math.round(c / total * 100) : 0;
        return `<div><div class="analytics-row-head"><span>${s}</span><span>${c} laporan &middot; ${pct}%</span></div><div class="analytics-track"><span class="bar-${s.toLowerCase()}" style="width:${pct}%"></span></div></div>`;
    }).join('');
    const tbl = (g, label) => g.length ? `<table class="data-table"><thead><tr><th>${label}</th><th class="num">Hilang</th><th class="num">Ditemukan</th><th class="num">Jumlah</th></tr></thead><tbody>${g.map(r => `<tr><td>${esc(r.k)}</td><td class="num">${r.Hilang}</td><td class="num">${r.Ditemukan}</td><td class="num"><strong>${r.total}</strong></td></tr>`).join('')}</tbody><tfoot><tr><td>Total</td><td class="num">${g.reduce((a, r) => a + r.Hilang, 0)}</td><td class="num">${g.reduce((a, r) => a + r.Ditemukan, 0)}</td><td class="num">${total}</td></tr></tfoot></table>` : '<p class="muted-note">Data tidak ditemukan untuk filter ini.</p>';
    $('tblLokasi').innerHTML = tbl(groupCount(list, l => l.lokasi), 'Lokasi');
    $('tblKategori').innerHTML = tbl(groupCount(list, l => l.kategori), 'Kategori');
    $('tblDaftar').innerHTML = list.length ? `<table class="data-table"><thead><tr><th>Tanggal</th><th>Barang</th><th>Tipe</th><th>Lokasi</th><th>Status</th></tr></thead><tbody>${list.map(l => `<tr><td>${esc(fmtTanggal(l.tanggal))}</td><td><a href="detail-laporan.html?id=${l.id_laporan}">${esc(l.nama_barang)}</a></td><td>${esc(l.tipe)}</td><td>${esc(l.lokasi)}</td><td>${statusChip(l.status)}</td></tr>`).join('')}</tbody></table>` : '<p class="muted-note">Data tidak ditemukan untuk filter ini.</p>';
}
function initRekap() {
    if (!$('totalHilang')) return;
    fillKategoriSelect($('rkKategori'), 'Semua kategori');
    $('rkFrom').value = todayISO(-90); $('rkTo').value = todayISO();
    ['rkFrom', 'rkTo', 'rkKategori', 'rkStatus'].forEach(id => $(id)?.addEventListener('change', renderRekap));
    $('rkPeriode')?.addEventListener('change', e => {
        const d = Number(e.target.value);
        $('rkFrom').value = d ? todayISO(-d) : ''; $('rkTo').value = d ? todayISO() : ''; renderRekap();
    });
    renderRekap();
}

/* ---------- beranda ---------- */
function landingRender(category, query) {
    const grid = $('itemsGrid'); if (!grid) return;
    const list = Laporan.search({ kategori: category, q: query }).slice(0, query || category ? 12 : 6);
    grid.innerHTML = list.length ? list.map(l => `<article class="item-card" data-category="${l.id_kategori}" data-title="${esc(l.nama_barang)}">
        <a class="item-card__media" href="detail-laporan.html?id=${l.id_laporan}"><img src="${esc(l.foto || PLACEHOLDER_IMAGE)}" alt="${esc(l.nama_barang)}" loading="lazy" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}'"></a>
        <div class="item-card__body"><span class="item-tag">${esc(l.kategori)} &middot; ${esc(l.tipe)}</span>
        <h3 class="item-card__title">${esc(l.nama_barang)}</h3>
        <p class="item-card__meta"><i class="fa-solid fa-location-dot"></i><span>${esc(l.lokasi)} &bull; ${esc(fmtTanggal(l.tanggal))}</span></p>
        <p class="item-card__contact"><i class="fa-solid fa-address-book"></i> Kontak pelapor: <strong>${esc(l.kontak)}</strong> <small>(hubungi manual)</small></p>
        <div class="item-card__action item-card__action--duo"><a class="btn-pill btn-pill--white" href="detail-laporan.html?id=${l.id_laporan}">Detail</a><button type="button" class="btn-pill btn-pill--claim" onclick="hubungiWA(${l.id_laporan})"><i class="fa-brands fa-whatsapp"></i> Hubungi Admin</button></div></div></article>`).join('')
        : `<p class="landing-empty">Data tidak ditemukan. Coba kata kunci atau kategori lain.</p>`;
}
const landing = { cat: '', q: '' };
function filterCategory(cat, btn) {
    landing.cat = cat;
    document.querySelectorAll('.tag-pill').forEach(b => b.classList.remove('active')); btn?.classList.add('active');
    landingRender(landing.cat, landing.q);
}
function handleSearch(e) {
    e.preventDefault(); landing.q = $('searchInput').value.trim(); landingRender(landing.cat, landing.q);
    $('galeri-temuan')?.scrollIntoView({ behavior: 'smooth' });
}
function initLanding() {
    if (!$('itemsGrid')) return;
    const tags = document.querySelector('.search-tags');
    if (tags) tags.innerHTML = '<span class="search-tags__label">Kategori:</span><button type="button" class="tag-pill active" onclick="filterCategory(\'\', this)">Semua</button>' +
        Kategori.all().map(k => `<button type="button" class="tag-pill" onclick="filterCategory('${k.id_kategori}', this)">${esc(k.nama_kategori)}</button>`).join('');
    $('searchInput')?.addEventListener('input', e => { landing.q = e.target.value.trim(); landingRender(landing.cat, landing.q); });
    landingRender('', '');
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
    seedIfEmpty();
    const user = getActiveUser();
    const sapa = $('sapaanMahasiswa'); if (sapa && user) sapa.textContent = user.nama.split(' ')[0];
    const flash = sessionStorage.getItem('fi_flash');
    if (flash) { sessionStorage.removeItem('fi_flash'); const f = JSON.parse(flash); setTimeout(() => showToast(f.msg, f.type), 150); }
    document.querySelectorAll('#headerSearch').forEach(hs => hs.addEventListener('keydown', e => {
        if (e.key === 'Enter' && hs.value.trim()) location.href = 'daftar-laporan.html?q=' + encodeURIComponent(hs.value.trim());
    }));
    initDaftar(); renderDetail(); initFormLapor(); initRekap(); initLanding();
});
