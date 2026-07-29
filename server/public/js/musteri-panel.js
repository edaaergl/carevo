const kullanici = JSON.parse(localStorage.getItem("carevo_kullanici") || "null");

if (!kullanici || kullanici.rol !== "musteri" || !kullanici.token) {
  window.location.href = "musteri-giris.html";
}

document.getElementById("musteri-basligi").textContent = `Merhaba, ${kullanici.ad_soyad}`;

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
    window.location.href = "musteri-giris.html";
    throw new Error("Yetkisiz");
  }

  return yanit;
}

const isletmeSecim = document.getElementById("isletme-secim");
const hizmetSecim = document.getElementById("hizmet-secim");
const konumTuru = document.getElementById("konum-turu");
const adresAlani = document.getElementById("adres-alani");
const musteriAdresi = document.getElementById("musteri-adresi");
const formMesaji = document.getElementById("form-mesaji");

// 1) Isletmeleri secim kutusuna doldur
async function isletmeleriYukle() {
  const yanit = await korumaliFetch("/api/isletmeler");
  const isletmeler = await yanit.json();

  isletmeler.forEach((i) => {
    const secenek = document.createElement("option");
    secenek.value = i.id;
    secenek.textContent = i.isletme_adi;
    isletmeSecim.appendChild(secenek);
  });
}

// 2) Bir isletme secilince, o isletmenin hizmetlerini getir
isletmeSecim.addEventListener("change", async () => {
  hizmetSecim.innerHTML = '<option value="">Yükleniyor...</option>';

  if (!isletmeSecim.value) {
    hizmetSecim.innerHTML = '<option value="">Önce işletme seçin</option>';
    return;
  }

  const yanit = await korumaliFetch(`/api/isletmeler/${isletmeSecim.value}/hizmetler`);
  const hizmetler = await yanit.json();

  hizmetSecim.innerHTML = '<option value="">Seçiniz...</option>';
  hizmetler.forEach((h) => {
    const secenek = document.createElement("option");
    secenek.value = h.id;
    secenek.textContent = `${h.ad} - ${h.fiyat} TL`;
    hizmetSecim.appendChild(secenek);
  });
});

// 3) Konum turune gore adres alanini goster/gizle
konumTuru.addEventListener("change", () => {
  const evegelmesiGerekiyor = konumTuru.value === "musteri_adresi";
  adresAlani.classList.toggle("gizli", !evegelmesiGerekiyor);
  musteriAdresi.required = evegelmesiGerekiyor;
});

// 4) Randevu formu gonderimi
document.getElementById("randevu-formu").addEventListener("submit", async (olay) => {
  olay.preventDefault();
  formMesaji.classList.add("gizli");

  const veri = {
    isletme_id: Number(isletmeSecim.value),
    hizmet_id: Number(hizmetSecim.value),
    arac_bilgisi: document.getElementById("arac-bilgisi").value,
    konum_turu: konumTuru.value,
    musteri_adresi: musteriAdresi.value || null,
    tarih_saat: document.getElementById("tarih-saat").value,
  };

  const yanit = await korumaliFetch("/api/randevular", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(veri),
  });

  const sonuc = await yanit.json();

  if (!yanit.ok) {
    formMesaji.textContent = sonuc.hata || "Randevu olusturulamadi";
    formMesaji.classList.remove("gizli");
    return;
  }

  document.getElementById("randevu-formu").reset();
  adresAlani.classList.add("gizli");
  hizmetSecim.innerHTML = '<option value="">Önce işletme seçin</option>';
  randevulariYukle();
});

// 5) Musterinin kendi randevularini listele
async function randevulariYukle() {
  const yanit = await korumaliFetch(`/api/randevular/musteri/${kullanici.id}`);
  const randevular = await yanit.json();

  const govde = document.getElementById("randevu-govde");
  govde.innerHTML = "";

  document.getElementById("bos-mesaji").classList.toggle("gizli", randevular.length > 0);

  randevular.forEach((r) => {
    const satir = document.createElement("tr");
    const tarih = new Date(r.tarih_saat).toLocaleString("tr-TR");
    const konumMetni = r.konum_turu === "musteri_adresi" ? "Ekip Gelecek" : "Dükkana Gideceğim";

    satir.innerHTML = `
      <td>${r.isletme_adi}</td>
      <td>${r.hizmet_adi}</td>
      <td>${r.arac_bilgisi}</td>
      <td>${tarih}</td>
      <td>${konumMetni}</td>
      <td>${r.ucret} TL</td>
      <td><span class="durum durum-${r.durum}">${r.durum}</span></td>
      <td>${r.odeme_durumu}</td>
    `;
    govde.appendChild(satir);
  });
}

isletmeleriYukle();
randevulariYukle();
