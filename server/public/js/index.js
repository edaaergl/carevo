// Her rol kendi anahtarina kaydedildigi icin (farkli sekmeler birbirini
// bozmasin diye), burada en son giris yapilan role bakip onu okuyoruz
const sonRol = localStorage.getItem("carevo_son_rol");
const kullanici = sonRol ? JSON.parse(localStorage.getItem(`carevo_kullanici_${sonRol}`) || "null") : null;

const girisAlani = document.getElementById("giris-alani");
const randevuAlLink = document.getElementById("randevu-al-link");

const panelSayfasi = {
  musteri: "musteri-panel.html",
  isletme: "isletme-panel.html",
  admin: "admin-panel.html",
};

function menuleriKapat() {
  document.querySelectorAll(".giris-menu").forEach((m) => m.classList.add("gizli"));
}

if (kullanici && kullanici.token) {
  const ilkHarf = kullanici.ad_soyad.trim().charAt(0).toUpperCase();

  girisAlani.innerHTML = `
    <div class="menu-sarmalayici">
      <button id="hesap-btn" class="hesap-btn">
        <span class="avatar">${kacir(ilkHarf)}</span> ${kacir(kullanici.ad_soyad)} <span class="ok">⌄</span>
      </button>
      <div id="hesap-menu" class="giris-menu gizli">
        <a href="${panelSayfasi[kullanici.rol]}">📊 Panelim</a>
        <a href="#" id="cikis-yap-link" class="cikis">⏻ Çıkış Yap</a>
      </div>
    </div>
    <div class="menu-sarmalayici">
      <button id="giris-yap-btn" class="giris-yap-btn">Giriş Yap</button>
      <div id="giris-menu" class="giris-menu gizli">
        <a href="musteri-giris.html">Müşteri Girişi</a>
        <a href="isletme-giris.html">İşletme Girişi</a>
      </div>
    </div>
  `;

  document.getElementById("hesap-btn").addEventListener("click", (olay) => {
    olay.stopPropagation();
    document.getElementById("hesap-menu").classList.toggle("gizli");
  });

  document.getElementById("cikis-yap-link").addEventListener("click", (olay) => {
    olay.preventDefault();
    localStorage.removeItem(`carevo_kullanici_${kullanici.rol}`);
    localStorage.removeItem("carevo_son_rol");
    window.location.reload();
  });

  document.getElementById("giris-yap-btn").addEventListener("click", (olay) => {
    olay.stopPropagation();
    document.getElementById("giris-menu").classList.toggle("gizli");
  });

  if (kullanici.rol === "musteri") {
    randevuAlLink.href = "musteri-panel.html";
  } else {
    randevuAlLink.classList.add("gizli");
  }
} else {
  girisAlani.innerHTML = `
    <div class="menu-sarmalayici">
      <button id="giris-yap-btn" class="giris-yap-btn">Giriş Yap</button>
      <div id="giris-menu" class="giris-menu gizli">
        <a href="musteri-giris.html">Müşteri Girişi</a>
        <a href="isletme-giris.html">İşletme Girişi</a>
      </div>
    </div>
  `;

  document.getElementById("giris-yap-btn").addEventListener("click", (olay) => {
    olay.stopPropagation();
    document.getElementById("giris-menu").classList.toggle("gizli");
  });
}

document.addEventListener("click", menuleriKapat);

const navbar = document.querySelector(".navbar");

function navbarKaydirmaKontrolu() {
  navbar.classList.toggle("navbar-koyu", window.scrollY > 20);
}

window.addEventListener("scroll", navbarKaydirmaKontrolu);
navbarKaydirmaKontrolu();

// SSS akordeonu: tikla, yumusakca ac/kapa, ayni anda sadece bir soru acik kalsin
document.querySelectorAll(".sss-baslik").forEach((baslik) => {
  baslik.addEventListener("click", () => {
    const icerik = baslik.nextElementSibling;
    const ok = baslik.querySelector(".sss-ok");
    const acikMi = icerik.classList.contains("sss-acik");

    document.querySelectorAll(".sss-icerik").forEach((el) => {
      el.style.maxHeight = "0px";
      el.classList.remove("sss-acik");
    });
    document.querySelectorAll(".sss-ok").forEach((el) => el.classList.remove("rotate-180"));

    if (!acikMi) {
      icerik.style.maxHeight = icerik.scrollHeight + "px";
      icerik.classList.add("sss-acik");
      ok.classList.add("rotate-180");
    }
  });
});

// Sayfa ici baglantilar (#hizmetler, #sss vb.) tiklandiginda hedefi ekranin ortasina getir
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  const hedefSecici = link.getAttribute("href");
  if (hedefSecici.length <= 1) return;

  link.addEventListener("click", (olay) => {
    const hedef = document.querySelector(hedefSecici);
    if (!hedef) return;

    olay.preventDefault();
    hedef.scrollIntoView({ behavior: "smooth", block: "center" });
  });
});

// Hizmet kartlarindaki "Detaylari Gor" bilgilendirme modali
const hizmetBilgileri = {
  "dis-yikama": {
    baslik: "🚿 Dış Yıkama",
    sure: "Yaklaşık 20-30 dakika",
    dikkat: [
      "Gövdedeki kir ve toz önce köpükle yumuşatılır.",
      "Çizik oluşturmayacak yumuşak bezlerle durulama yapılır.",
      "Jantlar ve lastikler ayrıca temizlenir.",
      "Kurutma işlemi mikrofiber havlularla yapılır.",
    ],
    tekrar: "Kullanım yoğunluğuna göre 1-2 haftada bir önerilir.",
  },
  "ic-temizlik": {
    baslik: "🧴 Detaylı İç Temizlik",
    sure: "Yaklaşık 45-60 dakika",
    dikkat: [
      "Koltuk ve halı yüzeyleri şampuanlanarak temizlenir.",
      "Plastik ve deri yüzeylerde uygun bakım ürünleri kullanılır.",
      "Havalandırma kanalları ve dar aralıklar özenle temizlenir.",
      "Son aşamada koku giderme işlemi uygulanır.",
    ],
    tekrar: "Ortalama 1-2 ayda bir yaptırılması önerilir.",
  },
  cila: {
    baslik: "✨ Cilalama & Parlatma",
    sure: "Yaklaşık 1-1.5 saat",
    dikkat: [
      "Yüzeydeki ince çizikler polisaj makinesiyle giderilir.",
      "Boya kalınlığı kontrol edilerek aşırı aşındırmadan kaçınılır.",
      "Son katman koruyucu cila ile kapatılır.",
    ],
    tekrar: "3-4 ayda bir tekrarlanması önerilir.",
  },
  seramik: {
    baslik: "🛡️ Seramik Kaplama",
    sure: "Yaklaşık 3-5 saat (bazı işletmelerde 1 gün sürebilir)",
    dikkat: [
      "Uygulama öncesi yüzey detaylı şekilde dekontamine edilir.",
      "Kaplama, kontrollü ortamda ince ve eşit katmanlar hâlinde uygulanır.",
      "Kürlenme süresince araç suyla temas ettirilmemelidir.",
    ],
    tekrar: "Kaplama kalitesine göre genellikle 1-2 yılda bir yenilenmesi önerilir.",
  },
  motor: {
    baslik: "⚙️ Motor Yıkama",
    sure: "Yaklaşık 20-30 dakika",
    dikkat: [
      "Elektrikli ve hassas aksam naylonla korunur.",
      "Uygun degresan ile yağ ve kir çözülür.",
      "Durulama düşük basınçla yapılır.",
      "Kurutma sonrası kontak noktaları kontrol edilir.",
    ],
    tekrar: "Yılda 2-3 kez yaptırılması yeterlidir.",
  },
  jant: {
    baslik: "🛞 Jant & Lastik Bakımı",
    sure: "Yaklaşık 15-20 dakika",
    dikkat: [
      "Jantlardaki fren tozu özel temizleyiciyle çözülür.",
      "Lastik yüzeyleri parlatıcı ile korunur.",
      "Jant somunlarının sıkılığı kontrol edilir.",
    ],
    tekrar: "Detaylı bakımın ayda bir tekrarlanması önerilir.",
  },
};

const hizmetDetayModal = document.getElementById("hizmet-detay-modal");

function hizmetDetayiGoster(anahtar) {
  const bilgi = hizmetBilgileri[anahtar];
  if (!bilgi) return;

  document.getElementById("hizmet-detay-baslik").textContent = bilgi.baslik;
  document.getElementById("hizmet-detay-icerik").innerHTML = `
    <div class="rounded-lg bg-blue-50 p-4">
      <div class="mb-1 text-xs font-bold uppercase tracking-wide text-blue-700">⏱️ Süre</div>
      <div class="text-gray-700">${bilgi.sure}</div>
    </div>
    <div>
      <div class="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">🔍 Nelere Dikkat Edilir</div>
      <ul class="list-inside list-disc space-y-1 text-gray-600">
        ${bilgi.dikkat.map((d) => `<li>${d}</li>`).join("")}
      </ul>
    </div>
    <div class="rounded-lg bg-gray-50 p-4">
      <div class="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">🔁 Ne Sıklıkla Tekrarlanmalı</div>
      <div class="text-gray-700">${bilgi.tekrar}</div>
    </div>
  `;

  hizmetDetayModal.classList.remove("hidden");
  hizmetDetayModal.classList.add("flex");
}

function hizmetDetayModalKapat() {
  hizmetDetayModal.classList.add("hidden");
  hizmetDetayModal.classList.remove("flex");
}

document.querySelectorAll(".hizmet-detay-link").forEach((link) => {
  link.addEventListener("click", (olay) => {
    olay.preventDefault();
    hizmetDetayiGoster(link.dataset.hizmet);
  });
});

document.getElementById("hizmet-detay-kapat").addEventListener("click", hizmetDetayModalKapat);
hizmetDetayModal.addEventListener("click", (olay) => {
  if (olay.target === hizmetDetayModal) hizmetDetayModalKapat();
});
