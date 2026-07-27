// 3) NESNELER (OBJECT) VE DİZİLER (ARRAY)
// Bunlar Carevo'da veritabanından gelen/giden verinin temel şekli olacak (JSON gibi düşün)

// Bir randevu "nesne" (object) olarak:
const randevu = {
  id: 1,
  musteri: "Ahmet Yılmaz",
  hizmetTipi: "Dış Yıkama",
  konumTuru: "musteri",   // "musteri" = ekip gelsin, "dukkan" = dükkana gidilsin
  ucret: 250,
  odendi: false,
};

console.log(randevu.musteri);       // nokta ile erişim
console.log(randevu["hizmetTipi"]); // köşeli parantezle erişim

// Birden fazla randevu = dizi (array) içinde nesneler
const randevular = [
  { id: 1, musteri: "Ahmet", ucret: 250, konumTuru: "musteri" },
  { id: 2, musteri: "Ayşe",  ucret: 400, konumTuru: "dukkan" },
  { id: 3, musteri: "Mehmet", ucret: 150, konumTuru: "musteri" },
];

// map: her randevuyu başka bir şeye DÖNÜŞTÜRÜR (yeni dizi döner)
const isimler = randevular.map((r) => r.musteri);
console.log("İsimler:", isimler);

// filter: sadece şartı sağlayanları SÜZER
const eveGelecekRandevular = randevular.filter((r) => r.konumTuru === "musteri");
console.log("Eve gidilecek randevular:", eveGelecekRandevular);

// find: şartı sağlayan İLK elemanı bulur
const ayseninRandevusu = randevular.find((r) => r.musteri === "Ayşe");
console.log("Ayşe'nin randevusu:", ayseninRandevusu);

// reduce: diziyi TEK bir değere indirger (örn. toplam ciro)
const toplamCiro = randevular.reduce((toplam, r) => toplam + r.ucret, 0);
console.log("Toplam ciro:", toplamCiro);
