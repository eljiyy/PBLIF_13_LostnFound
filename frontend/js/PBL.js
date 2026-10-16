const API_URL = 'http://localhost:5000/api';

// 1. FUNGSI LOGIN
async function login(event) {
    event.preventDefault();
    const nim = document.getElementById("nim").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nim, password })
        });
        const result = await response.json();

        if (result.success) {
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            if (result.user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'PBL.html';
            }
        } else {
            document.getElementById("errorMsg").classList.remove("hidden");
        }
    } catch (err) {
        alert("Gagal terhubung ke Server Backend Node.js!");
    }
}

// 2. FUNGSI LOGOUT
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// JALANKAN SAAT HALAMAN DIMUAT
document.addEventListener("DOMContentLoaded", async function() {
    const user = JSON.parse(localStorage.getItem('currentUser'));

    // Render Nama Admin
    if (document.getElementById("adminName") && user) {
        document.getElementById("adminName").innerText = user.nama;
    }

    // A. RENDER DAFTAR LAPORAN (Halaman User)
    const reportContainer = document.getElementById("reportContainer");
    if (reportContainer) {
        loadLaporan("Semua");
        document.getElementById("filterTipe")?.addEventListener("change", function() {
            loadLaporan(this.value);
        });
    }

    async function loadLaporan(filter) {
        try {
            const res = await fetch(`${API_URL}/laporan`);
            const data = await res.json();
            
            reportContainer.innerHTML = "";
            const filteredData = filter === "Semua" ? data : data.filter(item => item.tipe === filter);

            if (filteredData.length === 0) {
                reportContainer.innerHTML = "<p class='w-full text-center text-gray-500'>Belum ada laporan.</p>";
                return;
            }

            filteredData.forEach(item => {
                const badgeColor = item.tipe === 'Hilang' ? 'bg-red-500' : 'bg-green-500';
                reportContainer.innerHTML += `
                    <div class="report-card bg-white p-5 rounded-lg shadow hover:-translate-y-1 transition duration-300 w-full md:w-[45%]">
                        <span class="badge ${badgeColor} text-white px-2 py-1 rounded text-xs font-bold">${item.tipe.toUpperCase()}</span>
                        <h3 class="text-xl font-bold text-[#030c3b] mt-3 mb-2">${item.nama_barang}</h3>
                        <p class="text-sm text-gray-600 mb-1"><strong>Kategori:</strong> ${item.kategori}</p>
                        <p class="text-sm text-gray-600 mb-1"><strong>Lokasi:</strong> ${item.lokasi}</p>
                        <p class="text-sm text-gray-600 mb-3"><strong>Tanggal:</strong> ${item.tanggal}</p>
                        <button class="btn-detail bg-[#cdbc0b] text-[#050560] font-bold py-2 px-4 rounded hover:bg-[#050560] hover:text-white transition"
                            onclick="bukaModal('${item.nama_barang}', '${item.kategori}', '${item.lokasi}', '${item.tanggal}', '${item.ciri}', '${item.status}')">
                            Lihat Detail
                        </button>
                    </div>
                `;
            });
        } catch (err) { console.error("Error load laporan:", err); }
    }

    // B. RENDER REKAP DATA (Halaman Rekap)
    if (document.getElementById("totalHilang")) {
        try {
            const res = await fetch(`${API_URL}/laporan`);
            const data = await res.json();
            document.getElementById("totalHilang").innerText = data.filter(i => i.tipe === 'Hilang').length;
            document.getElementById("totalDitemukan").innerText = data.filter(i => i.tipe === 'Ditemukan').length;
            document.getElementById("totalSelesai").innerText = data.filter(i => i.status === 'Selesai').length;
        } catch (err) { console.error(err); }
    }

    // C. FORM SIMPAN LAPORAN BARU
    const formLapor = document.getElementById("formLapor");
    if (formLapor) {
        formLapor.addEventListener("submit", async function(e) {
            e.preventDefault();
            const bodyData = {
                tipe: document.querySelector('[name="tipe"]').value,
                nama_barang: document.querySelector('[name="nama_barang"]').value,
                kategori: document.querySelector('[name="kategori"] option:checked').text,
                tanggal: document.querySelector('[name="tanggal"]').value,
                lokasi: document.querySelector('[name="lokasi"]').value,
                ciri: document.querySelector('[name="ciri"]').value,
                pelapor: user ? user.nama : 'Anonim'
            };

            const res = await fetch(`${API_URL}/laporan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });

            if (res.ok) {
                alert('✅ BERHASIL! Laporan Anda telah tersimpan.');
                window.location.href = 'daftar-laporan.html';
            }
        });
    }

    // D. RENDER TABEL ADMIN DASHBOARD
    const adminTableBody = document.getElementById("adminTableBody");
    if (adminTableBody) {
        try {
            const res = await fetch(`${API_URL}/laporan`);
            const data = await res.json();
            
            adminTableBody.innerHTML = "";
            data.forEach(item => {
                const badgeColor = item.tipe === 'Hilang' ? 'bg-red-500' : 'bg-green-500';
                adminTableBody.innerHTML += `
                    <tr class="border-b border-slate-100 hover:bg-slate-50">
                        <td class="p-3"><b>${item.pelapor}</b></td>
                        <td class="p-3"><span class="${badgeColor} text-white px-2 py-1 rounded text-xs font-bold">${item.tipe}</span><br><b>${item.nama_barang}</b></td>
                        <td class="p-3 text-sm">${item.lokasi}<br><small class="text-slate-500">${item.tanggal}</small></td>
                        <td class="p-3 text-sm max-w-[180px]">${item.ciri}</td>
                        <td class="p-3"><span class="bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs font-bold">${item.status}</span></td>
                        <td class="p-3 flex gap-2 justify-center">
                            <button onclick="ubahStatus(${item.id}, 'Selesai')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs">Selesai</button>
                            <button onclick="hapusLaporan(${item.id})" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs">Hapus</button>
                        </td>
                    </tr>
                `;
            });
        } catch (err) { console.error(err); }
    }

    // E. MODAL DETAIL POPUP
    const modalOverlay = document.getElementById("modalDetail");
    const btnCloseModal = document.getElementById("btnCloseModal");
    const btnTutupModal = document.getElementById("btnTutupModal");

    window.bukaModal = function(nama, kategori, lokasi, tanggal, ciri, status) {
        document.getElementById("modalNama").textContent = ": " + nama;
        document.getElementById("modalKategori").textContent = ": " + kategori;
        document.getElementById("modalLokasi").textContent = ": " + lokasi;
        document.getElementById("modalTanggal").textContent = ": " + tanggal;
        document.getElementById("modalCiri").textContent = ": " + ciri;
        modalOverlay.style.display = "flex";
    }

    if(modalOverlay) {
        function tutupModal() { modalOverlay.style.display = "none"; }
        btnCloseModal?.addEventListener("click", tutupModal);
        btnTutupModal?.addEventListener("click", tutupModal);
        modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) tutupModal(); });
    }
});

// AKSI ADMIN (UBAH STATUS & HAPUS)
async function ubahStatus(id, statusBaru) {
    await fetch(`${API_URL}/laporan/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusBaru })
    });
    window.location.reload();
}

async function hapusLaporan(id) {
    if(confirm('Yakin ingin menghapus laporan ini?')) {
        await fetch(`${API_URL}/laporan/${id}`, { method: 'DELETE' });
        window.location.reload();
    }
}