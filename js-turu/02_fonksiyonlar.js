// 2) FONKSİYONLAR

// Klasik fonksiyon tanımı
function toplamFiyatHesapla(temizlikUcreti, ekstraUcret) {
  return temizlikUcreti + ekstraUcret;
}

console.log("Toplam:", toplamFiyatHesapla(200, 50));

// Arrow function (ok fonksiyonu) — Node/Express kodlarında en çok bunu göreceksin
const kdvEkle = (fiyat) => {
  return fiyat * 1.20;
};

console.log("KDV dahil:", kdvEkle(200));

// Tek satırlık arrow function, "return" bile yazmadan kısa yoldan:
const indirimUygula = (fiyat, oran) => fiyat - (fiyat * oran);

console.log("İndirimli fiyat:", indirimUygula(200, 0.1));

// Varsayılan parametre: konum belirtilmezse "dükkan" kabul edilsin
const randevuTipiBelirle = (konum = "dukkan") => {
  return konum === "musteri" ? "Ekip müşteriye gidecek" : "Müşteri dükkana gelecek";
};

console.log(randevuTipiBelirle("musteri"));
console.log(randevuTipiBelirle()); // parametre verilmedi, varsayılan çalışır
