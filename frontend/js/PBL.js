const PLACEHOLDER_IMAGE = "../images/Logo Pbl FindIt.jpg";

function createHTMLCard(item, isAdminMsg = false) {
    if (isAdminMsg) {
        return `<article class="notice-card">
            <h3>${item.judul}</h3>
            <p>${item.isi}</p>
        </article>`;
    }

    const isLost = item.tipe === 'Kehilangan' || item.tipe === 'Hilang';
    const image = item.buktiFile || PLACEHOLDER_IMAGE;
    const btnKlaim = item.status === 'Valid'
        ? `<button onclick="hubungiWA(${item.id})" class="button button-secondary"><i class="fa-brands fa-whatsapp"></i> Hubungi Petugas</button>`
        : '';

    return `<article class="report-card">
        <div class="report-card__media">
            <span class="badge ${isLost ? 'badge--lost' : 'badge--found'}">${item.tipe}</span>
            <img src="${image}" alt="${item.nama_barang}">
        </div>
        <div class="report-card__body">
            <h3 class="report-card__title">${item.nama_barang}</h3>
            <p class="report-card__meta"><i class="fa-solid fa-location-dot"></i> ${item.lokasi} <span>&bull;</span> ${item.tanggal}</p>
            <p class="report-card__desc">${item.ciri}</p>
            ${btnKlaim}
        </div>
    </article>`;
}
