<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lost & Found - Polibatam</title>
    <link rel="stylesheet" href="PBL.css">
</head>
<body>


<nav class="navbar">
    <div class="container navbar-container">
        <!-- Logo -->
        <a href="PBL.php" class="logo">LOST n FOUND</a>
        

        <ul class="nav-links">
            <li><a href="PBL.php">Beranda</a></li>
            <li><a href="daftar-laporan.php">Daftar Laporan</a></li>
            <li><a href="lapor.php">Buat Laporan</a></li>
            <li><a href="rekap.php">Rekap Data</a></li>
            <li><a href="#tentang">Tentang</a></li>
        </ul>


        <div class="nav-auth">
            <a href="login.php" class="btn btn-logout">Logout</a>
        </div>
    </div>
</nav>


    <section id="home" class="hero">
        <div class="container">
            <h1>W E L C O M E</h1>
            <a href="#pencarian" class="btn">Jelajahi</a>
        </div>
    </section>

    <!-- FITUR PBL: PENCARIAN -->
    <section id="pencarian" class="search-section">
        <div class="container">
            <h2>Cari Barang Hilang atau Temuan</h2>
            <form id="formSearch" class="search-form">
                <input type="text" id="inputSearch" placeholder="Masukkan nama barang, kategori, atau lokasi..." required>
                <button type="submit" class="btn">Cari Barang</button>
            </form>
        </div>
    </section>

    <!-- FITUR PBL: DAFTAR LAPORAN -->
    <section id="daftar-laporan" class="list-section">
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

                <div class="report-card lost-card" data-tipe="Hilang">
                    <span class="badge lost-badge">HILANG</span>
                    <h3>Dompet Hitam Kulit</h3>
                    <p><strong>Kategori:</strong> Aksesoris</p>
                    <p><strong>Lokasi:</strong> Kantin Gedung Utama</p>
                    <p><strong>Tanggal:</strong> 01 Oktober 2026</p>
                    <button class="btn-small btn-detail">Lihat Detail</button>
                </div>
                

                <div class="report-card found-card" data-tipe="Ditemukan">
                    <span class="badge found-badge">DITEMUKAN</span>
                    <h3>Kunci Motor Honda</h3>
                    <p><strong>Kategori:</strong> Lainnya</p>
                    <p><strong>Lokasi:</strong> Parkiran Depan</p>
                    <p><strong>Tanggal:</strong> 29 September 2026</p>
                    <button class="btn-small btn-detail">Lihat Detail</button>
                </div>
            </div>
        </div>
    </section>


    <section id="lapor" class="report-form-section">
        <div class="container">
            <h2>Form Tambah Laporan</h2>
            <p style="text-align: center; margin-bottom: 20px;">Laporkan barang yang anda temukan atau hilangkan disini.</p>
            <form id="formLapor" class="contact-form report-form">
                <select name="tipe" required>
                    <option value="" disabled selected>Pilih Tipe Laporan...</option>
                    <option value="Hilang">Kehilangan Barang</option>
                    <option value="Ditemukan">Menemukan Barang</option>
                </select>
                
                <input type="text" name="nama_barang" placeholder="Nama Barang (Cth: KTM Mahasiswa)" required>
                
                <select name="kategori" required>
                    <option value="" disabled selected>Pilih Kategori...</option>
                    <option value="Elektronik">Elektronik (Laptop, HP)</option>
                    <option value="Dokumen">Dokumen (KTM, KTP, Berkas)</option>
                    <option value="Lainnya">Aksesoris / Lainnya</option>
                </select>

                <input type="date" name="tanggal" required title="Tanggal Kejadian">
                <input type="text" name="lokasi" placeholder="Lokasi Kejadian (Cth: Lab Komputer)" required>
                <textarea name="ciri" rows="3" placeholder="Sebutkan ciri-ciri khusus barang..." required></textarea>
                <input type="text" name="kontak" placeholder="Kontak Pelapor (No WA / Email)" required>
                
                <button type="submit" class="btn">Simpan Laporan</button>
            </form>
        </div>
    </section>

    <!-- FITUR PBL: REKAPITULASI -->
    <section id="rekap" class="rekap-section">
        <div class="container">
            <h2>Rekapitulasi Kasus Penyelesaian</h2>
            <p style="text-align: center; margin-bottom: 20px;">Statistik barang hilang dan ditemukan periode ini.</p>
            <div class="rekap-stats">
                <div class="stat-box">
                    <h3>12</h3>
                    <p>Total Barang Hilang</p>
                </div>
                <div class="stat-box">
                    <h3>18</h3>
                    <p>Total Barang Ditemukan</p>
                </div>
                <div class="stat-box" style="background-color: #050560; color: white;">
                    <h3>25</h3>
                    <p>Kasus Selesai / Ditutup</p>
                </div>
            </div>
        </div>
    </section>



    
    <section id="produk" class="main-content">
        <div class="container">
            <h2>Daftar Barang hilang</h2>
            <div class="feature-box">
                <div class="feature">
                    <img src="dompet kulit.png" alt="Produk A">
                    <h3>Dompet kulit hitam</h3>
                    <p>Ditemukan di area parkir utama. Berisi kartu identitas dan beberapa lembar uang tunai. Segera verifikasi kepemilikan.</p>
                </div>
                <div class="feature">
                    <img src="Laptop.png" alt="Produk B">
                    <h3>Laptop MacBook</h3>
                    <p>Ditemukan tertinggal di ruang baca perpustakaan lantai 2. Kondisi aman di pos pengamanan.</p>
                </div>
                <div class="feature">
                    <img src="kunci motor.png" alt="Produk C">
                    <h3>Kunci motor</h3>
                    <p>Dilengkapi gantungan kunci unik berbentuk helm kecil. Ditemukan di kantin kampus.</p>
                </div>
            </div>
        </div>
    </section>


    
    
    <section id="tentang" class="about">
        <div class="container about-container">
            <div class="about-text">
                <h2 align="center">Tentang Kami</h2>
                <p align="center">Kalau kelen pakai website kami, beuhhhh bakal gacor kali kalian nanti.</p>
            </div>
            <div class="about-image">
                <img src="Logo_PBL.jpeg" alt="Tentang Kami">
            </div>
        </div>
    </section>

    <section id="kontak" class="contact">
        <div class="container">
            <h2>Hubungi Kami</h2>
            <p>Nahhh misal ada masalah kelen kasih tau aja, tapi chat pribadi, jangan disebar ke publik hehehe</p>
            <form id="formKontak" class="contact-form">
                <input type="text" name="name" placeholder="Masukkan Nama Anda" required>
                <input type="email" name="email" placeholder="Masukkan Email Anda" required>
                <textarea name="message" rows="5" placeholder="Tuliskan Pesan Anda" required></textarea>
                <button type="submit" class="btn">Kirim Pesan</button>
            </form>
        </div>
    </section>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2026 Muhammad Yusuf Fauzi. All rights reserved.</p>
            <ul class="social-links">
                <li><a href="https://www.instagram.com/el.jiyy" target="_blank">Instagram</a></li>
                <li><a href="https://wa.me/?text=Halo%20Yusuf" target="_blank">WhatsApp</a></li>
            </ul>
        </div>
    </footer>

    <!-- MODAL POPUP DETAIL LAPORAN -->
    <div id="modalDetail" class="modal-overlay">
        <div class="modal-content">
            <span class="close-btn" id="btnCloseModal">&times;</span>
            <h2 style="margin-bottom: 15px; color: #030c3b;">Detail Informasi Barang</h2>
            <span class="badge lost-badge" style="margin-bottom: 15px;">Status Laporan Ini Terverifikasi</span>
            <table class="detail-table">
                <tr><td><strong>Barang</strong></td><td>: Dompet Hitam Kulit / Kunci Motor</td></tr>
                <tr><td><strong>Kategori</strong></td><td>: Aksesoris / Lainnya</td></tr>
                <tr><td><strong>Lokasi</strong></td><td>: Kantin Gedung Utama / Parkiran</td></tr>
                <tr><td><strong>Tanggal</strong></td><td>: September/Oktober 2026</td></tr>
                <tr><td><strong>Ciri Khusus</strong></td><td>: Bukti data akan disesuaikan saat relasi database.</td></tr>
            </table>
            <button class="btn" id="btnTutupModal" style="margin-top: 20px; width: 100%;">Tutup Detail</button>
        </div>
    </div>

    <!-- PANGGIL FILE JAVASCRIPT -->
    <script src="PBL.js"></script>
</body>
</html>