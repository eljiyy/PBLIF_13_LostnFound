<?php
$host = "localhost";
$user = "root";       // Username bawaan XAMPP
$pass = "";           // Password bawaan XAMPP (kosong)
$db   = "db_LostnFound";

// Membuat koneksi menggunakan ekstensi mysqli
$conn = mysqli_connect($host, $user, $pass, $db);

// Mengecek apakah koneksi berhasil atau gagal
if (!$conn) {
    die("Koneksi database gagal: " . mysqli_connect_error());
}
?>