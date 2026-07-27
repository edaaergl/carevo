const kullanici = JSON.parse(localStorage.getItem("carevo_kullanici") || "null");

if (!kullanici || kullanici.rol !== "admin" || !kullanici.token) {
  window.location.href = "admin-giris.html";
}

document.getElementById("admin-basligi").textContent = `Yönetici Paneli - ${kullanici.ad_soyad}`;

document.getElementById("cikis-btn").addEventListener("click", () => {
  localStorage.removeItem("carevo_kullanici");
  window.location.href = "admin-giris.html";
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

async function randevulariYukle() {
  const yanit = await adminFetch("/api/admin/randevular");
  const randevular = await yanit.json();

  const govde = document.getElementById("randevu-govde");
  govde.innerHTML = "";

  randevular.forEach((r) => {
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

async function isletmeleriYukle() {
  const yanit = await adminFetch("/api/admin/isletmeler");
  const isletmeler = await yanit.json();

  const govde = document.getElementById("isletme-govde");
  govde.innerHTML = isletmeler
    .map((i) => `<tr><td>${i.isletme_adi}</td><td>${i.adres || "-"}</td><td>${i.sahip_email}</td></tr>`)
    .join("");
}

async function kullanicilariYukle() {
  const yanit = await adminFetch("/api/admin/kullanicilar");
  const kullanicilar = await yanit.json();

  const govde = document.getElementById("kullanici-govde");
  govde.innerHTML = kullanicilar
    .map((k) => `
      <tr>
        <td>${k.ad_soyad}</td>
        <td>${k.email}</td>
        <td>${k.telefon || "-"}</td>
        <td>${k.rol}</td>
        <td>${new Date(k.olusturulma_tarihi).toLocaleDateString("tr-TR")}</td>
      </tr>
    `)
    .join("");
}

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

function yenile() {
  istatistikleriYukle();
  randevulariYukle();
  isletmeleriYukle();
  kullanicilariYukle();
}

yenile();
