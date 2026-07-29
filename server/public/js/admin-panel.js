const kullanici = JSON.parse(localStorage.getItem("carevo_kullanici") || "null");

if (!kullanici || kullanici.rol !== "admin" || !kullanici.token) {
  window.location.href = "admin-giris.html";
}

document.getElementById("admin-basligi").textContent = `Yönetici Paneli - ${kullanici.ad_soyad}`;

document.getElementById("cikis-btn").addEventListener("click", () => {
  localStorage.removeItem("carevo_kullanici");

  const mesaj = document.createElement("div");
  mesaj.textContent = "Panelden çıkış yapılmıştır.";
  mesaj.className =
    "fixed top-6 left-1/2 -translate-x-1/2 z-[9999] rounded-lg border border-white/10 bg-[#16233f] px-5 py-3 text-sm font-medium text-white shadow-2xl";
  document.body.appendChild(mesaj);

  setTimeout(() => {
    window.location.href = "index.html";
  }, 1200);
});

// Tum admin isteklerinde token'i otomatik ekleyen yardimci fonksiyon
async function adminFetch(url, secenekler = {}) {
  const yanit = await fetch(url, {
    ...secenekler,
    headers: {
      ...(secenekler.headers || {}),
      Authorization: `Bearer ${kullanici.token}`,
    },
  });

  if (yanit.status === 401 || yanit.status === 403) {
    // token gecersiz/suresi dolmus, tekrar giris yaptir
    localStorage.removeItem("carevo_kullanici");
    window.location.href = "admin-giris.html";
    throw new Error("Yetkisiz");
  }

  return yanit;
}

async function istatistikleriYukle() {
  const yanit = await adminFetch("/api/admin/istatistikler");
  const ist = await yanit.json();

  const kartlar = [
    { etiket: "Toplam Randevu", deger: ist.toplam_randevu },
    { etiket: "Toplam İşletme", deger: ist.toplam_isletme },
    { etiket: "Toplam Müşteri", deger: ist.toplam_musteri },
    { etiket: "Tahsil Edilen", deger: `${ist.toplam_tahsilat} TL` },
    { etiket: "Bekleyen Tahsilat", deger: `${ist.bekleyen_tahsilat} TL` },
  ];

  const kutu = document.getElementById("istatistik-satiri");
  kutu.innerHTML = kartlar
    .map((k) => `<div class="istatistik-kart"><div class="sayi">${k.deger}</div><div class="etiket">${k.etiket}</div></div>`)
    .join("");
}

let tumRandevular = [];

async function randevulariYukle() {
  const yanit = await adminFetch("/api/admin/randevular");
  tumRandevular = await yanit.json();

  const govde = document.getElementById("randevu-govde");
  govde.innerHTML = "";

  tumRandevular.forEach((r) => {
    const satir = document.createElement("tr");
    const tarih = new Date(r.tarih_saat).toLocaleString("tr-TR");

    satir.innerHTML = `
      <td>${r.isletme_adi}</td>
      <td>${r.musteri_adi}</td>
      <td>${r.hizmet_adi}</td>
      <td>${r.arac_bilgisi}</td>
      <td>${tarih}</td>
      <td>${r.ucret} TL</td>
      <td><span class="durum durum-${r.durum}">${r.durum}</span></td>
      <td>${r.odeme_durumu}</td>
      <td>
        <select class="durum-sec" data-id="${r.id}">
          <option value="beklemede" ${r.durum === "beklemede" ? "selected" : ""}>Beklemede</option>
          <option value="onaylandi" ${r.durum === "onaylandi" ? "selected" : ""}>Onaylandı</option>
          <option value="iptal" ${r.durum === "iptal" ? "selected" : ""}>İptal</option>
          <option value="tamamlandi" ${r.durum === "tamamlandi" ? "selected" : ""}>Tamamlandı</option>
        </select>
        <button class="eylem-btn odeme-btn" data-id="${r.id}" data-yeni="${r.odeme_durumu === "odendi" ? "odenmedi" : "odendi"}">
          ${r.odeme_durumu === "odendi" ? "Ödenmedi İşaretle" : "Ödendi İşaretle"}
        </button>
      </td>
    `;
    govde.appendChild(satir);
  });
}

let tumIsletmeler = [];
let tumKullanicilar = [];

async function isletmeleriYukle() {
  const yanit = await adminFetch("/api/admin/isletmeler");
  tumIsletmeler = await yanit.json();
  isletmeleriGoster();
}

function isletmeleriGoster() {
  const arama = document.getElementById("isletme-arama").value.trim().toLowerCase();

  const filtrelenmis = tumIsletmeler.filter((i) => {
    if (!arama) return true;
    return (
      i.isletme_adi.toLowerCase().includes(arama) ||
      (i.adres || "").toLowerCase().includes(arama) ||
      i.sahip_email.toLowerCase().includes(arama)
    );
  });

  const govde = document.getElementById("isletme-govde");
  govde.innerHTML = filtrelenmis
    .map((i) => `<tr data-id="${i.id}"><td>${i.isletme_adi}</td><td>${i.adres || "-"}</td><td>${i.sahip_email}</td></tr>`)
    .join("");

  document.getElementById("isletme-bos-mesaji").classList.toggle("gizli", filtrelenmis.length > 0);
}

async function kullanicilariYukle() {
  const yanit = await adminFetch("/api/admin/kullanicilar");
  tumKullanicilar = await yanit.json();
  kullanicilariGoster();
}

function kullanicilariGoster() {
  const arama = document.getElementById("kullanici-arama").value.trim().toLowerCase();
  const rolFiltre = document.getElementById("kullanici-rol-filtre").value;

  const filtrelenmis = tumKullanicilar.filter((k) => {
    if (rolFiltre && k.rol !== rolFiltre) return false;
    if (!arama) return true;
    return k.ad_soyad.toLowerCase().includes(arama) || k.email.toLowerCase().includes(arama);
  });

  const govde = document.getElementById("kullanici-govde");
  govde.innerHTML = filtrelenmis
    .map((k) => `
      <tr data-id="${k.id}">
        <td>${k.ad_soyad}</td>
        <td>${k.email}</td>
        <td>${k.telefon || "-"}</td>
        <td>${k.rol}</td>
        <td>${new Date(k.olusturulma_tarihi).toLocaleDateString("tr-TR")}</td>
      </tr>
    `)
    .join("");

  document.getElementById("kullanici-bos-mesaji").classList.toggle("gizli", filtrelenmis.length > 0);
}

document.getElementById("isletme-arama").addEventListener("input", isletmeleriGoster);
document.getElementById("kullanici-arama").addEventListener("input", kullanicilariGoster);
document.getElementById("kullanici-rol-filtre").addEventListener("change", kullanicilariGoster);

// Randevu durumu secimi degistiginde sunucuya bildir
document.getElementById("randevu-govde").addEventListener("change", async (olay) => {
  if (!olay.target.matches(".durum-sec")) return;

  await adminFetch(`/api/admin/randevular/${olay.target.dataset.id}/durum`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ durum: olay.target.value }),
  });

  yenile();
});

// Odeme durumu butonuna tiklaninca
document.getElementById("randevu-govde").addEventListener("click", async (olay) => {
  if (!olay.target.matches(".odeme-btn")) return;

  await adminFetch(`/api/admin/randevular/${olay.target.dataset.id}/odeme`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ odeme_durumu: olay.target.dataset.yeni }),
  });

  yenile();
});

// Isletme veya kullanici satirina tiklaninca detay modalini ac
async function isletmeDetayiGoster(id) {
  const isletme = tumIsletmeler.find((i) => i.id === id);
  if (!isletme) return;

  const hizmetYaniti = await adminFetch(`/api/isletmeler/${id}/hizmetler`);
  const hizmetler = await hizmetYaniti.json();

  const ilgiliRandevular = tumRandevular.filter((r) => r.isletme_id === id);

  document.getElementById("detay-baslik").textContent = isletme.isletme_adi;
  document.getElementById("detay-icerik").innerHTML = `
    <p class="mb-1"><strong class="text-white">Adres:</strong> ${isletme.adres || "-"}</p>
    <p class="mb-1"><strong class="text-white">Açıklama:</strong> ${isletme.aciklama || "-"}</p>
    <p class="mb-4"><strong class="text-white">Sahip E-posta:</strong> ${isletme.sahip_email}</p>

    <h3 class="mb-2 mt-4 font-bold text-white">Hizmetler (${hizmetler.length})</h3>
    ${
      hizmetler.length === 0
        ? '<p class="mb-4 text-xs text-gray-400">Henüz hizmet eklenmemiş.</p>'
        : `<ul class="mb-4 space-y-1">${hizmetler
            .map((h) => `<li>• ${h.ad} — ${h.fiyat} TL${h.tahmini_sure_dk ? ` (${h.tahmini_sure_dk} dk)` : ""}</li>`)
            .join("")}</ul>`
    }

    <h3 class="mb-2 mt-4 font-bold text-white">Randevu Geçmişi (${ilgiliRandevular.length})</h3>
    ${
      ilgiliRandevular.length === 0
        ? '<p class="text-xs text-gray-400">Henüz randevu yok.</p>'
        : `<div class="space-y-2">${ilgiliRandevular
            .map(
              (r) => `
              <div class="rounded-md border border-white/10 p-2 text-xs">
                <div class="flex justify-between"><span>${r.musteri_adi}</span><span class="durum durum-${r.durum}">${r.durum}</span></div>
                <div class="mt-1 text-gray-400">${r.hizmet_adi} · ${new Date(r.tarih_saat).toLocaleString("tr-TR")} · ${r.ucret} TL</div>
              </div>`
            )
            .join("")}</div>`
    }
  `;

  detayModalGoster();
}

function kullaniciDetayiGoster(id) {
  const kullaniciKaydi = tumKullanicilar.find((k) => k.id === id);
  if (!kullaniciKaydi) return;

  const ilgiliRandevular = tumRandevular.filter((r) => r.musteri_id === id);

  document.getElementById("detay-baslik").textContent = kullaniciKaydi.ad_soyad;
  document.getElementById("detay-icerik").innerHTML = `
    <p class="mb-1"><strong class="text-white">E-posta:</strong> ${kullaniciKaydi.email}</p>
    <p class="mb-1"><strong class="text-white">Telefon:</strong> ${kullaniciKaydi.telefon || "-"}</p>
    <p class="mb-1"><strong class="text-white">Rol:</strong> ${kullaniciKaydi.rol}</p>
    <p class="mb-4"><strong class="text-white">Kayıt Tarihi:</strong> ${new Date(kullaniciKaydi.olusturulma_tarihi).toLocaleDateString("tr-TR")}</p>

    <h3 class="mb-2 mt-4 font-bold text-white">Randevu Geçmişi (${ilgiliRandevular.length})</h3>
    ${
      ilgiliRandevular.length === 0
        ? '<p class="text-xs text-gray-400">Henüz randevu yok.</p>'
        : `<div class="space-y-2">${ilgiliRandevular
            .map(
              (r) => `
              <div class="rounded-md border border-white/10 p-2 text-xs">
                <div class="flex justify-between"><span>${r.isletme_adi}</span><span class="durum durum-${r.durum}">${r.durum}</span></div>
                <div class="mt-1 text-gray-400">${r.hizmet_adi} · ${new Date(r.tarih_saat).toLocaleString("tr-TR")} · ${r.ucret} TL</div>
              </div>`
            )
            .join("")}</div>`
    }
  `;

  detayModalGoster();
}

function detayModalGoster() {
  const modal = document.getElementById("detay-modal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function detayModalKapat() {
  const modal = document.getElementById("detay-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

document.getElementById("isletme-govde").addEventListener("click", (olay) => {
  const satir = olay.target.closest("tr");
  if (!satir || !satir.dataset.id) return;
  isletmeDetayiGoster(Number(satir.dataset.id));
});

document.getElementById("kullanici-govde").addEventListener("click", (olay) => {
  const satir = olay.target.closest("tr");
  if (!satir || !satir.dataset.id) return;
  kullaniciDetayiGoster(Number(satir.dataset.id));
});

document.getElementById("detay-kapat").addEventListener("click", detayModalKapat);
document.getElementById("detay-modal").addEventListener("click", (olay) => {
  if (olay.target.id === "detay-modal") detayModalKapat();
});

function yenile() {
  istatistikleriYukle();
  randevulariYukle();
  isletmeleriYukle();
  kullanicilariYukle();
}

yenile();
