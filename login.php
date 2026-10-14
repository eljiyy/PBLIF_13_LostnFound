<?php
session_start();
require 'koneksi.php';

$error = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nim = mysqli_real_escape_string($conn, $_POST['nim']);
    $password = md5($_POST['password']);

    $query = "SELECT * FROM pelapor WHERE nim = '$nim' AND password = '$password'";
    $result = mysqli_query($conn, $query);

    if (mysqli_num_rows($result) == 1) {
        $row = mysqli_fetch_assoc($result);
        
        $_SESSION['id_pelapor'] = $row['id_pelapor'];
        $_SESSION['nama'] = $row['nama'];
        $_SESSION['role'] = $row['role']; 

        if ($row['role'] == 'admin') {
            header("Location: admin-dashboard.php");
        } else {
            header("Location: PBL.php");
        }
        exit();
    } else {
        $error = "NIM/Username atau Kata Sandi salah!";
    }
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Portal Keamanan Kampus</title>
    <link rel="stylesheet" href="PBL.css">
</head>
<body style="background-color: #091719; display: flex; justify-content: center; align-items: center; height: 100vh;">

    <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); width: 100%; max-width: 420px;">
        <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="color: #0f2b2e; font-size: 1.8rem; font-weight: bold;">FindIt Portal</h2>
            <p style="color: #64748b; font-size: 0.85rem;">Sistem Verifikasi Barang Hilang & Temuan Kampus</p>
        </div>
        
        <?php if (!empty($error)) { ?>
            <div style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid #ef4444; padding: 10px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-size: 0.85rem; font-weight: bold;">
                <?php echo $error; ?>
            </div>
        <?php } ?>

        <form method="POST" action="" style="display: flex; flex-direction: column; gap: 15px;">
            <div>
                <label style="font-size: 0.85rem; font-weight: bold; color: #1e293b; display: block; margin-bottom: 5px;">NIM / ID Petugas</label>
                <input type="text" name="nim" placeholder="Masukkan NIM atau ID" required style="width: 100%; padding: 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; outline: none;">
            </div>
            <div>
                <label style="font-size: 0.85rem; font-weight: bold; color: #1e293b; display: block; margin-bottom: 5px;">Kata Sandi</label>
                <input type="password" name="password" placeholder="********" required style="width: 100%; padding: 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; outline: none;">
            </div>
            <button type="submit" class="btn" style="width: 100%; padding: 12px; margin-top: 10px; background-color: #0f2b2e; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Masuk Sistem</button>
        </form>

    </div>

</body>
</html>
