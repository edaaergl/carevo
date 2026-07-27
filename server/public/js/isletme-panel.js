const kullanici = JSON.parse(localStorage.getItem("carevo_kullanici") || "null");

if (!kullanici || kullanici.rol !== "isletme" || !kullanici.token) {
  window.location.href = "isletme-giris.html";
}

document.getElementById("isletme-basligi").textContent = `Merhaba, ${kullanici.ad_soyad}`;

document.getElementById("cikis-btn").addEventListener("click", () => {
  localStorage.removeItem("carevo_kullanici");
  window.location.href = "isletme-giris.html";
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
    localStorage.removeItem("carevo_kullanici");
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
  randevulariYukle();
}

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
      <td>${r.musteri_adi}</td>
      <td>${r.musteri_telefon || "-"}</td>
      <td>${r.hizmet_adi}</td>
      <td>${r.arac_bilgisi}</td>
      <td>${tarih}</td>
      <td>${konumMetni}${r.musteri_adresi ? " (" + r.musteri_adresi + ")" : ""}</td>
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
