// 5) ASYNC/AWAIT (EN ÖNEMLİ KISIM)
// Veritabanı sorguları, ödeme API'si gibi işlemler ANINDA bitmez, zaman alır.
// JS bu bekleme sürecini "Promise" (söz) ile yönetir. async/await bunu okunaklı hale getirir.

// Gerçek bir veritabanı sorgusunu SİMÜLE eden sahte fonksiyon:
function veritabanindanRandevuGetir(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id, musteri: "Ahmet Yılmaz", ucret: 250 });
    }, 1000); // 1 saniye gecikme, gerçek bir DB sorgusunu taklit ediyor
  });
}

// async fonksiyon: içinde "await" kullanabilmek için fonksiyonun başına "async" yazılır
async function randevuGoster() {
  console.log("Randevu sorgulanıyor...");

  // await: Promise sonuçlanana kadar BEKLE, sonucu değişkene ata
  const randevu = await veritabanindanRandevuGetir(1);

  console.log("Randevu bulundu:", randevu);
}

randevuGoster();

// Not: Express'te bir route handler şuna benzer:
//
// app.get("/randevu/:id", async (req, res) => {
//   const randevu = await db.query("SELECT * FROM randevular WHERE id = $1", [req.params.id]);
//   res.json(randevu);
// });
//
// Yani route içindeki fonksiyon da "async", DB sorgusu da "await" ile bekleniyor.
