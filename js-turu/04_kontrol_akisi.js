// 4) KOŞULLAR VE DÖNGÜLER

const randevuDurumu = "beklemede"; // "beklemede" | "onaylandi" | "iptal"

if (randevuDurumu === "onaylandi") {
  console.log("Randevu onaylandı, işletmeye bildirim gönder.");
} else if (randevuDurumu === "beklemede") {
  console.log("Randevu beklemede, işletme onayı bekleniyor.");
} else {
  console.log("Randevu iptal edilmiş.");
}

// for...of döngüsü ile dizi üzerinde gezinme
const hizmetler = ["Dış Yıkama", "İç Temizlik", "Motor Yıkama"];

for (const hizmet of hizmetler) {
  console.log("Hizmet:", hizmet);
}

// forEach ile aynı işi yapan alternatif (Node kodlarında sık görülür)
hizmetler.forEach((hizmet, index) => {
  console.log(`${index + 1}. ${hizmet}`);
});
