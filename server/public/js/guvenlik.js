// Kullanici tarafindan girilen metinleri innerHTML'e yazmadan once
// HTML olarak yorumlanmasini engellemek icin kacan (escape eden) yardimci fonksiyon.
function kacir(metin) {
  if (metin === null || metin === undefined) return "";
  return String(metin)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
