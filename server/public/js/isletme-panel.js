const kullanici = JSON.parse(localStorage.getItem("carevo_kullanici_isletme") || "null");

if (!kullanici || kullanici.rol !== "isletme" || !kullanici.token) {
  window.location.href = "isletme-giris.html";
}

document.getElementById("isletme-basligi").textContent = `Merhaba, ${kullanici.ad_soyad}`;

document.getElementById("cikis-btn").addEventListener("click", () => {
  localStorage.removeItem("carevo_kullanici_isletme");

  const mesaj = document.createElement("div");
  mesaj.textContent = "Panelden çıkış yapılmıştır.";
  mesaj.className =
    "fixed top-6 left-1/2 -translate-x-1/2 z-[9999] rounded-lg border border-white/10 bg-[#16233f] px-5 py-3 text-sm font-medium text-white shadow-2xl";
  document.body.appendChild(mesaj);

  setTimeout(() => {
    window.location.href = "index.html";
  }, 1200);
});

// Tum isteklerde token'i otomatik ekleyen yardimci fonksiyon
async function korumaliFetch(url, secenekler = {}) {
  const yanit = await fetch(url, {
    ...secenekler,
    headers: {
      ...(secenekler.headers || {}),
      Authorization: `Bearer ${kullanici.token}`,
    },
  });

  if (yanit.status === 401) {
    localStorage.removeItem("carevo_kullanici_isletme");
    window.location.href = "isletme-giris.html";
    throw new Error("Yetkisiz");
  }

  return yanit;
}

let isletme = null; // profil bulununca burada tutulacak

async function baslat() {
  const yanit = await korumaliFetch(`/api/isletmeler/kullanici/${kullanici.id}`);

  if (yanit.status === 404) {
    document.getElementById("profil-olustur-bolumu").classList.remove("gizli");
    return;
  }

  isletme = await yanit.json();
  document.getElementById("isletme-basligi").textContent = isletme.isletme_adi;
  document.getElementById("randevu-bolumu").classList.remove("gizli");
  document.getElementById("profil-isletme-adi").value = isletme.isletme_adi;
  document.getElementById("profil-adres").value = isletme.adres || "";
  document.getElementById("profil-aciklama").value = isletme.aciklama || "";
  hizmetleriYukle();
  randevulariYukle();
}

// Isletme profilini duzenleme formu
document.getElementById("profil-duzenle-formu").addEventListener("submit", async (olay) => {
  olay.preventDefault();

  const yanit = await korumaliFetch(`/api/isletmeler/${isletme.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      isletme_adi: document.getElementById("profil-isletme-adi").value,
      adres: document.getElementById("profil-adres").value,
      aciklama: document.getElementById("profil-aciklama").value,
    }),
  });

  if (yanit.ok) {
    isletme = await yanit.json();
    document.getElementById("isletme-basligi").textContent = isletme.isletme_adi;

    const mesaj = document.getElementById("profil-guncelleme-mesaji");
    mesaj.classList.remove("gizli");
    setTimeout(() => mesaj.classList.add("gizli"), 2500);
  }
});

async function hizmetleriYukle() {
  const yanit = await korumaliFetch(`/api/isletmeler/${isletme.id}/hizmetler`);
  const hizmetler = await yanit.json();

  const govde = document.getElementById("hizmet-govde");
  govde.innerHTML = hizmetler
    .map(
      (h) => `
      <tr data-id="${h.id}">
        <td>${kacir(h.ad)}</td>
        <td>${h.fiyat} TL</td>
        <td>${h.tahmini_sure_dk ? h.tahmini_sure_dk + " dk" : "-"}</td>
        <td><button class="eylem-btn hizmet-sil-btn" data-id="${h.id}">Sil</button></td>
      </tr>
    `
    )
    .join("");

  document.getElementById("hizmet-bos-mesaji").classList.toggle("gizli", hizmetler.length > 0);
}

// Yeni hizmet ekleme formu
document.getElementById("hizmet-formu").addEventListener("submit", async (olay) => {
  olay.preventDefault();

  await korumaliFetch(`/api/isletmeler/${isletme.id}/hizmetler`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ad: document.getElementById("hizmet-ad").value,
      fiyat: Number(document.getElementById("hizmet-fiyat").value),
      tahmini_sure_dk: document.getElementById("hizmet-sure").value
        ? Number(document.getElementById("hizmet-sure").value)
        : null,
    }),
  });

  document.getElementById("hizmet-formu").reset();
  hizmetleriYukle();
});

// Hizmet silme (event delegation)
document.getElementById("hizmet-govde").addEventListener("click", async (olay) => {
  if (!olay.target.matches(".hizmet-sil-btn")) return;

  await korumaliFetch(`/api/isletmeler/${isletme.id}/hizmetler/${olay.target.dataset.id}`, {
    method: "DELETE",
  });

  hizmetleriYukle();
});

// Profil olusturma formu (isletme ilk kez giris yaptiginda)
document.getElementById("profil-formu").addEventListener("submit", async (olay) => {
  olay.preventDefault();

  const yanit = await korumaliFetch("/api/isletmeler", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      isletme_adi: document.getElementById("isletme_adi").value,
      adres: document.getElementById("adres").value,
    }),
  });

  if (yanit.ok) {
    document.getElementById("profil-olustur-bolumu").classList.add("gizli");
    baslat();
  }
});

async function randevulariYukle() {
  const yanit = await korumaliFetch(`/api/randevular/isletme/${isletme.id}`);
  const randevular = await yanit.json();

  const govde = document.getElementById("randevu-govde");
  govde.innerHTML = "";

  document.getElementById("bos-mesaji").classList.toggle("gizli", randevular.length > 0);

  randevular.forEach((r) => {
    const satir = document.createElement("tr");
    const tarih = new Date(r.tarih_saat).toLocaleString("tr-TR");
    const konumMetni = r.konum_turu === "musteri_adresi" ? "Ekip Gidecek" : "Dükkana Gelecek";

    satir.innerHTML = `
      <td>${kacir(r.musteri_adi)}</td>
      <td>${kacir(r.musteri_telefon) || "-"}</td>
      <td>${kacir(r.hizmet_adi)}</td>
      <td>${kacir(r.arac_bilgisi)}</td>
      <td>${tarih}</td>
      <td>${konumMetni}${r.musteri_adresi ? " (" + kacir(r.musteri_adresi) + ")" : ""}</td>
      <td>${r.ucret} TL</td>
      <td><span class="durum durum-${r.durum}">${r.durum}</span></td>
      <td>${r.odeme_durumu}</td>
      <td>
        <button class="eylem-btn" data-id="${r.id}" data-durum="onaylandi">Onayla</button>
        <button class="eylem-btn" data-id="${r.id}" data-durum="iptal">İptal</button>
        <button class="eylem-btn" data-id="${r.id}" data-durum="tamamlandi">Tamamlandı</button>
      </td>
    `;
    govde.appendChild(satir);
  });
}

// Event delegation: tabloya her yeni satir eklendiginde ayri ayri dinleyici
// eklemek yerine, tek bir dinleyiciyi govdeye koyup tikanan butonu kontrol ediyoruz
document.getElementById("randevu-govde").addEventListener("click", async (olay) => {
  if (!olay.target.matches("button")) return;

  const id = olay.target.dataset.id;
  const yeniDurum = olay.target.dataset.durum;

  await korumaliFetch(`/api/randevular/${id}/durum`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ durum: yeniDurum }),
  });

  randevulariYukle(); // listeyi guncel haliyle yeniden ciz
});

baslat();
