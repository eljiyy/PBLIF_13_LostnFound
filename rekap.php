<?php
// 1. Panggil file koneksi database
require 'koneksi.php';

// 2. Query untuk menghitung jumlah total Barang Hilang dari database
$queryHilang = "SELECT COUNT(*) AS total_hilang FROM laporan_barang WHERE tipe = 'Hilang'";
$resultHilang = mysqli_query($conn, $queryHilang);
$dataHilang = mysqli_fetch_assoc($resultHilang);
$totalHilang = $dataHilang['total_hilang'];

// 3. Query untuk menghitung jumlah total Barang Ditemukan dari database
$queryDitemukan = "SELECT COUNT(*) AS total_ditemukan FROM laporan_barang WHERE tipe = 'Ditemukan'";
$resultDitemukan = mysqli_query($conn, $queryDitemukan);
$dataDitemukan = mysqli_fetch_assoc($resultDitemukan);
$totalDitemukan = $dataDitemukan['total_ditemukan'];

// 4. Query untuk menghitung jumlah kasus yang statusnya Selesai / Ditutup
$querySelesai = "SELECT COUNT(*) AS total_selesai FROM laporan_barang WHERE status = 'Selesai' OR status = 'Ditutup'";
$resultSelesai = mysqli_query($conn, $querySelesai);
$dataSelesai = mysqli_fetch_assoc($resultSelesai);
$totalSelesai = $dataSelesai['total_selesai'];
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rekapitulasi - Lost & Found</title>
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

    <!-- FITUR REKAPITULASI OTOMATIS DARI DATABASE -->
    <section class="rekap-section" style="margin-top: 50px; min-height: 75vh;">
        <div class="container">
            <h2>Rekapitulasi Kasus Penyelesaian</h2>
            <p style="text-align: center; margin-bottom: 30px;">Statistik barang hilang dan ditemukan yang tercatat di database sistem.</p>
            
            <div class="rekap-stats">
                <!-- Kotak Total Barang Hilang -->
                <div class="stat-box">
                    <h3 style="color: #d9534f;"><?php echo $totalHilang; ?></h3>
                    <p>Total Barang Hilang</p>
                </div>
                
                <!-- Kotak Total Barang Ditemukan -->
                <div class="stat-box">
                    <h3 style="color: #5cb85c;"><?php echo $totalDitemukan; ?></h3>
                    <p>Total Barang Ditemukan</p>
                </div>
                
                <!-- Kotak Total Kasus Selesai -->
                <div class="stat-box" style="background-color: #030c3b; color: white;">
                    <h3 style="color: #cdbc0b;"><?php echo $totalSelesai; ?></h3>
                    <p style="color: white;">Kasus Selesai / Ditutup</p>
                </div>
            </div>
            
            <!-- Tombol Cetak Laporan -->
            <div style="text-align: center; margin-top: 40px;">
                <button class="btn" onclick="window.print()">Cetak Laporan (PDF)</button>
            </div>
        </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer">
        <div class="container">
            <p>&copy; 2026 Muhammad Yusuf Fauzi. All rights reserved.</p>
        </div>
    </footer>

    <!-- PANGGIL FILE JAVASCRIPT -->
    <script src="PBL.js"></script>
</body>
</html>