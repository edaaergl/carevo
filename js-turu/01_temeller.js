// 1) DEĞİŞKENLER VE VERİ TİPLERİ

const musteriAdi = "Ahmet Yılmaz";     // const: değeri sonradan DEĞİŞMEYECEK veriler için
let telefon = "0532 000 00 00";       // let: değeri sonradan değişebilecek veriler için

const fiyat = 250.50;                 // number
const odemeYapildiMi = false;         // boolean (true/false)

// Template literal: string içine değişken gömme (HTML'deki gibi + ile birleştirmeye gerek yok)
console.log(`Müşteri: ${musteriAdi}, Telefon: ${telefon}`);
console.log(`Randevu ücreti: ${fiyat} TL, Ödendi mi? ${odemeYapildiMi}`);

// let ile değer değiştirebiliriz:
telefon = "0533 111 11 11";
console.log(`Güncellenmiş telefon: ${telefon}`);

// const ile bunu yapamayız, aşağıdaki satırın yorumunu açarsan hata alırsın:
// musteriAdi = "Başka İsim"; // TypeError: Assignment to constant variable.
