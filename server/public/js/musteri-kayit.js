const form = document.getElementById("kayit-formu");
const hataMesaji = document.getElementById("hata-mesaji");

form.addEventListener("submit", async (olay) => {
  olay.preventDefault();

  const veri = {
    ad_soyad: document.getElementById("ad_soyad").value,
    email: document.getElementById("email").value,
    telefon: document.getElementById("telefon").value,
    sifre: document.getElementById("sifre").value,
    rol: "musteri",
  };

  try {
    const yanit = await fetch("/api/auth/kayit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(veri),
    });

    const sonuc = await yanit.json();

    if (!yanit.ok) {
      hataMesaji.textContent = sonuc.hata || "Kayit olusturulamadi";
      hataMesaji.classList.remove("gizli");
      return;
    }

    window.location.href = "musteri-giris.html";
  } catch (hata) {
    hataMesaji.textContent = "Sunucuya baglanilamadi";
    hataMesaji.classList.remove("gizli");
  }
});
