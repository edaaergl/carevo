const form = document.getElementById("giris-formu");
const hataMesaji = document.getElementById("hata-mesaji");

form.addEventListener("submit", async (olay) => {
  olay.preventDefault();

  const veri = {
    email: document.getElementById("email").value,
    sifre: document.getElementById("sifre").value,
  };

  try {
    const yanit = await fetch("/api/auth/giris", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(veri),
    });

    const kullanici = await yanit.json();

    if (!yanit.ok) {
      hataMesaji.textContent = kullanici.hata || "Giris basarisiz";
      hataMesaji.classList.remove("gizli");
      return;
    }

    if (kullanici.rol !== "isletme") {
      hataMesaji.textContent = "Bu hesap bir isletme hesabi degil";
      hataMesaji.classList.remove("gizli");
      return;
    }

    // Rol'e ozel anahtar kullaniyoruz ki farkli rollerle ayni tarayicida
    // acilan farkli sekmeler birbirinin oturumunu silmesin
    localStorage.setItem("carevo_kullanici_isletme", JSON.stringify(kullanici));
    localStorage.setItem("carevo_son_rol", "isletme");
    window.location.href = "isletme-panel.html";
  } catch (hata) {
    hataMesaji.textContent = "Sunucuya baglanilamadi";
    hataMesaji.classList.remove("gizli");
  }
});
