<?php
// 1. Hubungkan ke file koneksi database
require 'koneksi.php';

$pesan = "";

// 2. Cek apakah form disubmit (tombol Simpan ditekan)
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Ambil data dari input form
    $tipe = $_POST['tipe'];
    $nama_barang = $_POST['nama_barang'];
    $id_kategori = $_POST['kategori']; // Berupa angka ID (1, 2, 3, 4)
    $tanggal = $_POST['tanggal'];
    $lokasi = $_POST['lokasi'];
    $ciri = $_POST['ciri'];
    
    // Karena kita belum membuat fitur Login, kita asumsikan yang melapor adalah 
    // akun dummy pertama di database (id_pelapor = 1, yaitu M. Yusuf Fauzi)
    $id_pelapor = 1;

    // 3. Query SQL untuk memasukkan data ke tabel laporan_barang
    $query = "INSERT INTO laporan_barang (id_pelapor, id_kategori, tipe, nama_barang, tanggal, lokasi, ciri, status) 
              VALUES ('$id_pelapor', '$id_kategori', '$tipe', '$nama_barang', '$tanggal', '$lokasi', '$ciri', 'Aktif')";

    // 4. Eksekusi query dan berikan notifikasi
    if (mysqli_query($conn, $query)) {
        // Jika berhasil, munculkan alert dan pindahkan ke halaman daftar laporan
        $pesan = "<script>
                    alert('✅ BERHASIL! Laporan Anda telah tersimpan di Database.');
                    window.location.href = 'daftar-laporan.php';
                  </script>";
    } else {
        $pesan = "<script>alert('Gagal menyimpan laporan: " . mysqli_error($conn) . "');</script>";
    }
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buat Laporan - Lost & Found</title>
    <link rel="stylesheet" href="PBL.css">
</head>
<body>

    <!-- Cetak pesan alert JavaScript jika ada -->
    <?php echo $pesan; ?>

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

    <!-- FORM PELAPORAN -->
    <section class="report-form-section" style="margin-top: 50px; min-height: 80vh;">
        <div class="container">
            <h2>Form Tambah Laporan</h2>
            <p style="text-align: center; margin-bottom: 20px;">Laporkan barang yang anda temukan atau hilangkan disini.</p>
            
            <!-- PERUBAHAN: Hapus id="formLapor" JS lama, tambahkan method="POST" agar data dikirim ke PHP atas -->
            <form method="POST" action="" class="contact-form report-form">
                
                <select name="tipe" required>
                    <option value="" disabled selected>Pilih Tipe Laporan...</option>
                    <option value="Hilang">Kehilangan Barang</option>
                    <option value="Ditemukan">Menemukan Barang</option>
                </select>
                
                <input type="text" name="nama_barang" placeholder="Nama Barang (Cth: KTM Mahasiswa)" required>
                
                <!-- PERUBAHAN: Value disesuaikan dengan id_kategori di database MySQL -->
                <select name="kategori" required>
                    <option value="" disabled selected>Pilih Kategori...</option>
                    <option value="1">Elektronik (Laptop, HP)</option>
                    <option value="2">Dokumen (KTM, KTP, Berkas)</option>
                    <option value="3">Aksesoris (Dompet, Jam Tangan)</option>
                    <option value="4">Lainnya</option>
                </select>

                <input type="date" name="tanggal" required title="Tanggal Kejadian">
                <input type="text" name="lokasi" placeholder="Lokasi Kejadian (Cth: Lab Komputer)" required>
                <textarea name="ciri" rows="3" placeholder="Sebutkan ciri-ciri khusus barang..." required></textarea>
                
                <!-- Input kontak aku hapus dari sini karena di database kontak nempel di tabel pelapor (user yang login) -->
                
                <button type="submit" class="btn">Simpan Laporan</button>
            </form>
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