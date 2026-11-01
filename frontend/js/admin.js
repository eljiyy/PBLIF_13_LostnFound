/* Panel petugas FindIt – memakai lapisan data di PBL.js */
const admin = getActiveUser();
if (!admin || admin.role !== 'admin') location.replace('login.html');

const statusSelect = l => `<select class="status-select" onchange="ubahStatusUI(${l.id_laporan}, this.value)" aria-label="Status ${esc(l.nama_barang)}">${STATUSES.map(s => `<option ${s === l.status ? 'selected' : ''}>${s}</option>`).join('')}</select>`;
function ubahStatusUI(id, s) { const r = Laporan.setStatus(id, s); showToast(r.msg, r.ok ? 'ok' : 'err'); renderAll(); }
function laporanRows(list) {
    if (!list.length) return '<p class="muted-note">Data tidak ditemukan.</p>';
    return `<table class="data-table"><thead><tr><th>Barang</th><th>Tipe</th><th>Kategori</th><th>Lokasi &amp; tanggal</th><th>Pelapor</th><th>Status</th><th class="num">Aksi</th></tr></thead><tbody>` +
        list.map(l => `<tr><td><a href="detail-laporan.html?id=${l.id_laporan}"><strong>${esc(l.nama_barang)}</strong></a></td><td>${esc(l.tipe)}</td><td>${esc(l.kategori)}</td>
        <td>${esc(l.lokasi)}<br><small>${esc(fmtTanggal(l.tanggal))}</small></td><td>${esc(l.pelapor.nama)}<br><small>${esc(l.kontak)}</small></td>
        <td>${statusSelect(l)}</td><td class="num"><a class="chip-btn" href="lapor.html?edit=${l.id_laporan}" title="Ubah"><i class="fa-solid fa-pen"></i></a>
        <button class="chip-btn chip-btn--danger" onclick="hapusLaporanUI(${l.id_laporan}, renderAll)" title="Hapus"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('') + '</tbody></table>';
}
function renderDashboard() {
    const all = Laporan.all(), c = s => all.filter(l => l.status === s).length;
    $('stTotal').textContent = all.length; $('stAktif').textContent = c('Aktif'); $('stCocok').textContent = c('Cocok');
    $('stSelesai').textContent = c('Dikembalikan') + c('Ditutup');
    $('dashLatest').innerHTML = laporanRows(all.slice(0, 6));
}
function renderLaporan() {
    $('lapTable').innerHTML = laporanRows(Laporan.search({ q: $('fq').value, kategori: $('fkat').value, tipe: $('ftipe').value, status: $('fstatus').value }));
}

/* Kategori */
let katEdit = null;
function renderKategori() {
    const used = id => Laporan.all().filter(l => l.id_kategori === id).length;
    const list = Kategori.all();
    $('katTable').innerHTML = list.length ? `<table class="data-table"><thead><tr><th>ID</th><th>Nama kategori</th><th class="num">Laporan</th><th class="num">Aksi</th></tr></thead><tbody>` +
        list.map(k => `<tr><td>${k.id_kategori}</td><td><strong>${esc(k.nama_kategori)}</strong></td><td class="num">${used(k.id_kategori)}</td><td class="num">
        <button class="chip-btn" onclick="editKategori(${k.id_kategori})"><i class="fa-solid fa-pen"></i></button>
        <button class="chip-btn chip-btn--danger" onclick="hapusKategori(${k.id_kategori})"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('') + '</tbody></table>' : '<p class="muted-note">Data tidak ditemukan.</p>';
    fillKategoriSelect($('fkat'), 'Semua kategori');
}
function editKategori(id) { katEdit = id; $('katNama').value = Kategori.get(id).nama_kategori; $('katTitle').textContent = 'Ubah kategori'; $('katNama').focus(); }
function resetKat() { katEdit = null; $('katForm').reset(); $('katTitle').textContent = 'Tambah kategori'; }
function hapusKategori(id) {
    if (!confirm('Hapus kategori ini?')) return;
    const r = Kategori.remove(id); showToast(r.msg, r.ok ? 'ok' : 'err'); renderAll();
}

/* Pelapor */
let pelEdit = null;
function renderPelapor() {
    const q = ($('pelCari').value || '').toLowerCase();
    const list = Pelapor.all().filter(p => !q || p.nama.toLowerCase().includes(q) || p.nim.includes(q));
    const n = id => Laporan.all().filter(l => l.id_pelapor === id).length;
    $('pelTable').innerHTML = list.length ? `<table class="data-table"><thead><tr><th>Nama</th><th>NIM</th><th>Kontak</th><th class="num">Laporan</th><th class="num">Aksi</th></tr></thead><tbody>` +
        list.map(p => `<tr><td><strong>${esc(p.nama)}</strong></td><td>${esc(p.nim)}</td><td>${esc(p.kontak)}</td><td class="num">${n(p.id_pelapor)}</td><td class="num">
        <button class="chip-btn" onclick="editPelapor(${p.id_pelapor})"><i class="fa-solid fa-pen"></i></button>
        <button class="chip-btn chip-btn--danger" onclick="hapusPelapor(${p.id_pelapor})"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('') + '</tbody></table>' : '<p class="muted-note">Data tidak ditemukan.</p>';
}
function editPelapor(id) { const p = Pelapor.get(id); pelEdit = id; $('pelNama').value = p.nama; $('pelNim').value = p.nim; $('pelKontak').value = p.kontak; $('pelTitle').textContent = 'Ubah pelapor'; $('pelNama').focus(); }
function resetPel() { pelEdit = null; $('pelForm').reset(); $('pelTitle').textContent = 'Tambah pelapor'; }
function hapusPelapor(id) {
    if (!confirm('Hapus pelapor ini?')) return;
    const r = Pelapor.remove(id); showToast(r.msg, r.ok ? 'ok' : 'err'); renderAll();
}

/* Pengumuman */
function renderNews() {
    const list = readJSON(T.news).slice().reverse();
    $('newsList').innerHTML = list.map(n => `<div class="news-item">${createHTMLCard(n, true)}<button class="chip-btn chip-btn--danger" onclick="hapusNews(${n.id})"><i class="fa-solid fa-trash"></i> Hapus</button></div>`).join('');
}
function hapusNews(id) {
    if (!confirm('Hapus pengumuman ini?')) return;
    localStorage.setItem(T.news, JSON.stringify(readJSON(T.news).filter(n => n.id !== id)));
    showToast('Pengumuman dihapus.'); renderNews();
}

function renderAll() { renderDashboard(); renderLaporan(); renderKategori(); renderPelapor(); renderNews(); }
function switchTab(id) {
    document.querySelectorAll('.tab').forEach(t => t.hidden = t.id !== 'tab-' + id);
    document.querySelectorAll('[data-tab]').forEach(a => a.classList.toggle('active', a.dataset.tab === id));
    renderAll();
}

document.addEventListener('DOMContentLoaded', () => {
    $('dateDisplay').textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.querySelectorAll('[data-tab]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); switchTab(a.dataset.tab); }));
    $('btnLogout').addEventListener('click', e => { e.preventDefault(); if (confirm('Keluar dari panel petugas?')) { sessionStorage.removeItem('activeUser'); location.href = 'login.html'; } });
    ['fq', 'fkat', 'ftipe', 'fstatus'].forEach(id => $(id).addEventListener(id === 'fq' ? 'input' : 'change', renderLaporan));
    $('freset').addEventListener('click', () => { ['fq', 'fkat', 'ftipe', 'fstatus'].forEach(id => $(id).value = ''); renderLaporan(); });
    $('pelCari').addEventListener('input', renderPelapor);
    $('katForm').addEventListener('submit', e => {
        e.preventDefault();
        const r = katEdit ? Kategori.update(katEdit, $('katNama').value) : Kategori.add($('katNama').value);
        showToast(r.msg, r.ok ? 'ok' : 'err'); if (r.ok) { resetKat(); renderAll(); }
    });
    $('katBatal').addEventListener('click', resetKat);
    $('pelForm').addEventListener('submit', e => {
        e.preventDefault();
        const d = { nama: $('pelNama').value, nim: $('pelNim').value, kontak: $('pelKontak').value };
        const r = pelEdit ? Pelapor.update(pelEdit, d) : Pelapor.add(d);
        showToast(r.msg, r.ok ? 'ok' : 'err'); if (r.ok) { resetPel(); renderAll(); }
    });
    $('pelBatal').addEventListener('click', resetPel);
    $('newsForm').addEventListener('submit', e => {
        e.preventDefault();
        const list = readJSON(T.news);
        list.push({ id: Date.now(), judul: $('b_judul').value.trim(), kategori: $('b_kategori').value, isi: $('b_isi').value.trim(), tanggal: new Date().toLocaleDateString('id-ID') });
        localStorage.setItem(T.news, JSON.stringify(list));
        showToast('Pengumuman disiarkan.'); e.target.reset(); renderNews();
    });
    renderAll();
});
