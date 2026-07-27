const kullanici = JSON.parse(localStorage.getItem("carevo_kullanici") || "null");

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
        <span class="avatar">${ilkHarf}</span> ${kullanici.ad_soyad} <span class="ok">⌄</span>
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
    localStorage.removeItem("carevo_kullanici");
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
