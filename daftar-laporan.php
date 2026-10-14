<?php
// 1. Panggil file koneksi database
require 'koneksi.php';

// 2. Ambil data laporan dari database, gabungkan dengan tabel kategori agar nama kategorinya muncul
$query = "SELECT laporan_barang.*, kategori_barang.nama_kategori 
          FROM laporan_barang 
          LEFT JOIN kategori_barang ON laporan_barang.id_kategori = kategori_barang.id_kategori 
          ORDER BY laporan_barang.id_laporan DESC";
          
$result = mysqli_query($conn, $query);
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daftar Laporan - Lost & Found</title>
    <link rel="stylesheet" href="PBL.css">
</head>
<body>

    <!-- NAVBAR -->
    <nav class="navbar">
        <div class="container">
            <a href="PBL.php" class="logo">LOST n FOUND</a>
            <ul class="nav-links">
                <li><a href="PBL.php">Beranda</a></li>
                <li><a href="daftar-laporan.php">Daftar Laporan</a></li>
                <li><a href="lapor.php">Buat Laporan</a></li>
                <li><a href="rekap.php">Rekap Data</a></li>
            </ul>
        </div>
    </nav>

    <!-- FITUR PENCARIAN -->
    <section class="search-section" style="margin-top: 50px;">
        <div class="container">
            <h2>Cari Barang Hilang atau Temuan</h2>
            <form id="formSearch" class="search-form">
                <input type="text" id="inputSearch" placeholder="Masukkan nama barang, kategori, atau lokasi..." required>
                <button type="submit" class="btn">Cari Barang</button>
            </form>
        </div>
    </section>

    <!-- FITUR DAFTAR LAPORAN & FILTER -->
    <section class="list-section">
        <div class="container">
            <h2>Daftar Laporan Terbaru</h2>
            <div class="filter-bar">
                <label>Filter Tipe: </label>
                <select id="filterTipe">
                    <option value="Semua">Semua Laporan</option>
                    <option value="Hilang">Barang Hilang</option>
                    <option value="Ditemukan">Barang Ditemukan</option>
                </select>
            </div>
            
            <div class="report-cards" id="reportContainer">
                <?php
                // Cek apakah ada data di database
                if (mysqli_num_rows($result) > 0) {
                    // Looping data dari database ke dalam kartu HTML
                    while ($row = mysqli_fetch_assoc($result)) {
                        // Tentukan warna badge berdasarkan tipe (Hilang / Ditemukan)
                        $badgeClass = ($row['tipe'] == 'Hilang') ? 'lost-badge' : 'found-badge';
                        $cardClass = ($row['tipe'] == 'Hilang') ? 'lost-card' : 'found-card';
                ?>
                        <div class="report-card <?php echo $cardClass; ?>" data-tipe="<?php echo $row['tipe']; ?>">
                            <span class="badge <?php echo $badgeClass; ?>"><?php echo strtoupper($row['tipe']); ?></span>
                            <h3><?php echo htmlspecialchars($row['nama_barang']); ?></h3>
                            <p><strong>Kategori:</strong> <?php echo htmlspecialchars($row['nama_kategori'] ?? 'Lainnya'); ?></p>
                            <p><strong>Lokasi:</strong> <?php echo htmlspecialchars($row['lokasi']); ?></p>
                            <p><strong>Tanggal:</strong> <?php echo htmlspecialchars($row['tanggal']); ?></p>
                            
                            <!-- Tombol untuk melihat detail lengkap -->
                            <button class="btn-small btn-detail" 
                                    data-nama="<?php echo htmlspecialchars($row['nama_barang']); ?>"
                                    data-kategori="<?php echo htmlspecialchars($row['nama_kategori'] ?? 'Lainnya'); ?>"
                                    data-lokasi="<?php echo htmlspecialchars($row['lokasi']); ?>"
                                    data-tanggal="<?php echo htmlspecialchars($row['tanggal']); ?>"
                                    data-ciri="<?php echo htmlspecialchars($row['ciri']); ?>"
                                    data-status="<?php echo htmlspecialchars($row['status']); ?>">
                                Lihat Detail
                            </button>
                        </div>
                <?php 
                    }
                } else {
                    echo "<p style='text-align: center; width: 100%; color: #777;'>Belum ada laporan yang dimasukkan ke database.</p>";
                }
                ?>
            </div>
        </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer">
        <div class="container">
            <p>&copy; 2026 Muhammad Yusuf Fauzi. All rights reserved.</p>
        </div>
    </footer>

    <!-- MODAL POPUP DETAIL LAPORAN DINAMIS -->
    <div id="modalDetail" class="modal-overlay">
        <div class="modal-content">
            <span class="close-btn" id="btnCloseModal">&times;</span>
            <h2 style="margin-bottom: 15px; color: #030c3b;">Detail Informasi Barang</h2>
            <span class="badge lost-badge" id="modalStatus" style="margin-bottom: 15px;">Status Terverifikasi</span>
            <table class="detail-table">
                <tr><td><strong>Barang</strong></td><td id="modalNama">: -</td></tr>
                <tr><td><strong>Kategori</strong></td><td id="modalKategori">: -</td></tr>
                <tr><td><strong>Lokasi</strong></td><td id="modalLokasi">: -</td></tr>
                <tr><td><strong>Tanggal</strong></td><td id="modalTanggal">: -</td></tr>
                <tr><td><strong>Ciri Khusus</strong></td><td id="modalCiri">: -</td></tr>
            </table>
            <button class="btn" id="btnTutupModal" style="margin-top: 20px; width: 100%;">Tutup Detail</button>
        </div>
    </div>

    <!-- PANGGIL FILE JAVASCRIPT -->
    <script src="PBL.js"></script>
    <script>
        // Script tambahan khusus modal dinamis berdasarkan data database
        document.addEventListener("DOMContentLoaded", function() {
            const modalOverlay = document.getElementById("modalDetail");
            const btnCloseModal = document.getElementById("btnCloseModal");
            const btnTutupModal = document.getElementById("btnTutupModal");
            
            const modalNama = document.getElementById("modalNama");
            const modalKategori = document.getElementById("modalKategori");
            const modalLokasi = document.getElementById("modalLokasi");
            const modalTanggal = document.getElementById("modalTanggal");
            const modalCiri = document.getElementById("modalCiri");

            document.querySelectorAll(".btn-detail").forEach(button => {
                button.addEventListener("click", function() {
                    // Ambil data dari atribut tombol
                    modalNama.textContent = ": " + this.getAttribute("data-nama");
                    modalKategori.textContent = ": " + this.getAttribute("data-kategori");
                    modalLokasi.textContent = ": " + this.getAttribute("data-lokasi");
                    modalTanggal.textContent = ": " + this.getAttribute("data-tanggal");
                    modalCiri.textContent = ": " + this.getAttribute("data-ciri");
                    
                    modalOverlay.style.display = "flex";
                });
            });

            function tutupModal() { modalOverlay.style.display = "none"; }
            btnCloseModal.addEventListener("click", tutupModal);
            btnTutupModal.addEventListener("click", tutupModal);
            modalOverlay.addEventListener("click", function(e) {
                if (e.target === modalOverlay) tutupModal();
            });
        });
    </script>
</body>
</html>