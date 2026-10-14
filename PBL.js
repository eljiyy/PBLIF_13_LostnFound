// Pastikan kode berjalan setelah seluruh HTML selesai dimuat
document.addEventListener("DOMContentLoaded", function() {

    // 1. FITUR PENCARIAN BARANG
    const formSearch = document.getElementById("formSearch");
    formSearch.addEventListener("submit", function(event) {
        event.preventDefault(); // Mencegah web reload
        const keyword = document.getElementById("inputSearch").value;
        alert(`Sistem sedang mencari barang dengan kata kunci: "${keyword}"\n\n(Nantinya ini akan terhubung ke Database MySQL)`);
    });

    // 2. FITUR FILTER LAPORAN (HILANG / DITEMUKAN)
    const filterTipe = document.getElementById("filterTipe");
    const reportCards = document.querySelectorAll(".report-card");

    filterTipe.addEventListener("change", function() {
        const selectedValue = this.value; // 'Semua', 'Hilang', atau 'Ditemukan'

        reportCards.forEach(card => {
            // Ambil tipe data dari atribut HTML: data-tipe="Hilang"
            const cardTipe = card.getAttribute("data-tipe");

            if (selectedValue === "Semua" || selectedValue === cardTipe) {
                card.style.display = "block"; // Tampilkan kartu
            } else {
                card.style.display = "none";  // Sembunyikan kartu
            }
        });
    });

    // 3. FITUR SIMPAN LAPORAN BARU
    const formLapor = document.getElementById("formLapor");
    formLapor.addEventListener("submit", function(event) {
        event.preventDefault();
        alert("✅ LAPORAN BERHASIL DISIMPAN!\n\nLaporan Anda telah masuk ke sistem dan menunggu verifikasi Admin.");
        this.reset(); // Mengosongkan form otomatis setelah berhasil
    });

    // 4. FITUR KIRIM PESAN KONTAK
    const formKontak = document.getElementById("formKontak");
    formKontak.addEventListener("submit", function(event) {
        event.preventDefault();
        alert("Pesan Anda berhasil dikirim ke Admin! Terima kasih.");
        this.reset();
    });

    // 5. FITUR MODAL POPUP (DETAIL BARANG)
    const modalOverlay = document.getElementById("modalDetail");
    const btnCloseModal = document.getElementById("btnCloseModal");
    const btnTutupModal = document.getElementById("btnTutupModal");
    const btnDetails = document.querySelectorAll(".btn-detail"); // Ambil semua tombol "Lihat Detail"

    // Fungsi membuka modal saat tombol diklik
    btnDetails.forEach(button => {
        button.addEventListener("click", function() {
            modalOverlay.style.display = "flex";
        });
    });

    // Fungsi menutup modal
    function tutupModal() {
        modalOverlay.style.display = "none";
    }

    // Pasang fungsi tutup ke tombol [X] dan tombol "Tutup Detail"
    btnCloseModal.addEventListener("click", tutupModal);
    btnTutupModal.addEventListener("click", tutupModal);

    // Menutup modal jika user klik area gelap di luar kotak putih
    modalOverlay.addEventListener("click", function(event) {
        if (event.target === modalOverlay) {
            tutupModal();
        }
    });

});