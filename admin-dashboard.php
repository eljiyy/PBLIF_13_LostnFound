<?php
session_start();
require 'koneksi.php';

// Validasi ketat hak akses admin
if (!isset($_SESSION['role']) || $_SESSION['role'] != 'admin') {
    header("Location: login.php");
    exit();
}

$pesan = "";

// 1. Proses Tambah Laporan/Berita Barang Hilang oleh Admin
if (isset($_POST['tambah_laporan'])) {
    $tipe = $_POST['tipe'];
    $nama_barang = mysqli_real_escape_string($conn, $_POST['nama_barang']);
    $id_kategori = $_POST['kategori'];
    $tanggal = $_POST['tanggal'];
    $lokasi = mysqli_real_escape_string($conn, $_POST['lokasi']);
    $ciri = mysqli_real_escape_string($conn, $_POST['ciri']);
    $id_admin = $_SESSION['id_pelapor'];

    $query_add = "INSERT INTO laporan_barang (id_pelapor, id_kategori, tipe, nama_barang, tanggal, lokasi, ciri, status_verifikasi) 
                  VALUES ('$id_admin', '$id_kategori', '$tipe', '$nama_barang', '$tanggal', '$lokasi', '$ciri', 'Valid/Sesuai')";
                  
    if (mysqli_query($conn, $query_add)) {
        $pesan = "Berita/Laporan baru berhasil ditambahkan!";
    }
}

// 2. Proses Verifikasi / Ubah Status oleh Admin
if (isset($_GET['aksi']) && isset($_GET['id'])) {
    $id = $_GET['id'];
    $aksi = $_GET['aksi'];

    if ($aksi == 'valid') {
        mysqli_query($conn, "UPDATE laporan_barang SET status_verifikasi = 'Valid/Sesuai' WHERE id_laporan = '$id'");
    } elseif ($aksi == 'tolak') {
        mysqli_query($conn, "UPDATE laporan_barang SET status_verifikasi = 'Ditolak/Palsu' WHERE id_laporan = '$id'");
    } elseif ($aksi == 'selesai') {
        mysqli_query($conn, "UPDATE laporan_barang SET status_verifikasi = 'Selesai/Dikembalikan' WHERE id_laporan = '$id'");
    } elseif ($aksi == 'hapus') {
        mysqli_query($conn, "DELETE FROM laporan_barang WHERE id_laporan = '$id'");
    }
    header("Location: admin-dashboard.php");
    exit();
}

// Ambil data laporan lengkap dengan data pelapor
$query_data = "SELECT laporan_barang.*, pelapor.nama AS nama_pelapor, pelapor.nim, kategori_barang.nama_kategori 
               FROM laporan_barang 
               LEFT JOIN pelapor ON laporan_barang.id_pelapor = pelapor.id_pelapor
               LEFT JOIN kategori_barang ON laporan_barang.id_kategori = kategori_barang.id_kategori 
               ORDER BY laporan_barang.id_laporan DESC";
$result_data = mysqli_query($conn, $query_data);
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Verifikasi & Kontrol Data</title>
    <link rel="stylesheet" href="PBL.css">
</head>
<body style="background-color: #f4f4f4;">

    <!-- NAVBAR ADMIN -->
    <nav class="navbar" style="background-color: #0f2b2e;">
        <div class="container" style="display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 15px;">
            <a href="#" class="logo" style="color: #f59e0b; text-decoration: none; font-weight: bold; font-size: 1.2rem;">🛡️ PANEL KONTROL ADMIN & VERIFIKASI</a>
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="color: white; font-size: 0.9rem;">Petugas: <b><?php echo $_SESSION['nama']; ?></b></span>
                <a href="logout.php" style="background: #ef4444; color: white; padding: 6px 14px; border-radius: 6px; text-decoration: none; font-size: 0.85rem; font-weight: bold;">Keluar</a>
            </div>
        </div>
    </nav>

    <div class="container" style="max-width: 1200px; margin: 30px auto; padding: 0 20px;">
        
        <?php if (!empty($pesan)) { ?>
            <div style="background: #10b981; color: white; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-weight: bold;">
                <?php echo $pesan; ?>
            </div>
        <?php } ?>

        <!-- KOTAK TAMBAH BERITA / LAPORAN BARU OLEH ADMIN -->
        <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 30px;">
            <h3 style="color: #0f2b2e; margin-bottom: 15px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">+ Tambah Berita / Laporan Resmi Barang</h3>
            <form method="POST" action="" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px;">
                <select name="tipe" required style="padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1;">
                    <option value="" disabled selected>Pilih Tipe...</option>
                    <option value="Hilang">Barang Hilang</option>
                    <option value="Ditemukan">Barang Ditemukan</option>
                </select>
                <input type="text" name="nama_barang" placeholder="Nama Barang" required style="padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1;">
                <select name="kategori" required style="padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1;">
                    <option value="" disabled selected>Pilih Kategori...</option>
                    <option value="1">Elektronik</option>
                    <option value="2">Dokumen / KTM</option>
                    <option value="3">Aksesoris</option>
                    <option value="4">Lainnya</option>
                </select>
                <input type="date" name="tanggal" required style="padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1;">
                <input type="text" name="lokasi" placeholder="Lokasi Kejadian" required style="padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1;">
                <input type="text" name="ciri" placeholder="Ciri-ciri Khusus" required style="padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1;">
                <button type="submit" name="tambah_laporan" style="grid-column: 1 / -1; background: #1a4d52; color: white; padding: 12px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Publikasikan Berita / Laporan</button>
            </form>
        </div>

        <!-- TABEL KONTROL & VERIFIKASI DATA -->
        <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h3 style="color: #0f2b2e; margin-bottom: 15px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Daftar Validasi & Verifikasi Seluruh Laporan</h3>
            
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                    <thead>
                        <tr style="background: #f8fafc; color: #475569; border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 12px;">Pelapor / NIM</th>
                            <th style="padding: 12px;">Barang & Kategori</th>
                            <th style="padding: 12px;">Lokasi & Tanggal</th>
                            <th style="padding: 12px;">Ciri Khusus</th>
                            <th style="padding: 12px;">Status Verifikasi</th>
                            <th style="padding: 12px; text-align: center;">Aksi Kontrol Admin</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while ($row = mysqli_fetch_assoc($result_data)) { ?>
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 12px;">
                                <b><?php echo htmlspecialchars($row['nama_pelapor'] ?? 'Admin Kampus'); ?></b><br>
                                <span style="font-size: 0.75rem; color: #64748b;"><?php echo htmlspecialchars($row['nim'] ?? 'Sistem'); ?></span>
                            </td>
                            <td style="padding: 12px;">
                                <span class="badge <?php echo ($row['tipe'] == 'Hilang') ? 'lost-badge' : 'found-badge'; ?>"><?php echo $row['tipe']; ?></span><br>
                                <b><?php echo htmlspecialchars($row['nama_barang']); ?></b>
                            </td>
                            <td style="padding: 12px; font-size: 0.85rem;">
                                <?php echo htmlspecialchars($row['lokasi']); ?><br>
                                <small style="color: #64748b;"><?php echo $row['tanggal']; ?></small>
                            </td>
                            <td style="padding: 12px; font-size: 0.85rem; max-width: 180px;"><?php echo htmlspecialchars($row['ciri']); ?></td>
                            <td style="padding: 12px;">
                                <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; background: #e2e8f0; color: #334155;">
                                    <?php echo $row['status_verifikasi']; ?>
                                </span>
                            </td>
                            <td style="padding: 12px; text-align: center; display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">
                                <!-- Tombol Aksi Verifikasi Terstruktur -->
                                <a href="admin-dashboard.php?aksi=valid&id=<?php echo $row['id_laporan']; ?>" style="background: #10b981; color: white; padding: 5px 10px; border-radius: 4px; text-decoration: none; font-size: 0.75rem;">Validasi</a>
                                <a href="admin-dashboard.php?aksi=selesai&id=<?php echo $row['id_laporan']; ?>" style="background: #3b82f6; color: white; padding: 5px 10px; border-radius: 4px; text-decoration: none; font-size: 0.75rem;">Selesai</a>
                                <a href="admin-dashboard.php?aksi=hapus&id=<?php echo $row['id_laporan']; ?>" onclick="return confirm('Yakin ingin menghapus laporan ini?')" style="background: #ef4444; color: white; padding: 5px 10px; border-radius: 4px; text-decoration: none; font-size: 0.75rem;">Hapus</a>
                            </td>
                        </tr>
                        <?php } ?>
                    </tbody>
                </table>
            </div>
        </div>

    </div>

</body>
</html>
