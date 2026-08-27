# Carevo

Carevo, oto yıkama işletmeleri ile müşterileri buluşturan bir randevu platformu. Müşteriler işletme/hizmet seçip online randevu oluşturur, işletmeler kendi hizmet ve randevularını yönetir, adminler tüm platformu tek yerden denetler.

Bu proje bir **portföy çalışmasıdır** — vanilla JS + Express + PostgreSQL ile uçtan uca (kayıt/giriş, yetkilendirme, randevu akışı, admin paneli) bir web uygulaması kurma alıştırması olarak geliştirildi.

## Özellikler

**Müşteri**
- Kayıt olma / giriş yapma
- İşletme ve hizmet seçerek randevu oluşturma (geçmiş tarih ve saat çakışması engellenir)
- Randevularını görüntüleme ve iptal etme

**İşletme**
- İşletme profili oluşturma ve düzenleme
- Hizmet ekleme / silme (fiyat, tahmini süre)
- Gelen randevuları görüntüleme, onaylama/iptal/tamamlandı olarak işaretleme, ödeme durumunu güncelleme

**Admin**
- Tüm randevular, işletmeler ve kullanıcılar üzerinde tam görünürlük
- Randevularda arama, durum ve tarih aralığı filtresi
- Kullanıcı hesaplarını aktif/devre dışı bırakma
- Kullanıcı şifresini sıfırlama (email servisi gerektirmez)
- Son 6 aylık randevu sayısı ve tahsilat grafiği

**Güvenlik**
- JWT tabanlı kimlik doğrulama, bcrypt ile şifre hash'leme
- Girişte rate limiting (brute-force koruması)
- Kullanıcı girdileri escape edilerek XSS'e karşı korunuyor
- Rol bazlı yetkilendirme (route seviyesinde middleware kontrolü)

## Teknoloji

- **Backend:** Node.js, Express 5
- **Veritabanı:** PostgreSQL
- **Frontend:** Vanilla HTML/CSS/JS + Tailwind (CDN)
- **Kimlik doğrulama:** JWT (`jsonwebtoken`), `bcryptjs`

## Proje Yapısı

```
server/
  src/
    index.js           # Express uygulama girisi
    db.js               # PostgreSQL baglantisi
    middleware/auth.js   # JWT dogrulama ve rol kontrolu
    routes/
      auth.js            # Kayit / giris
      isletmeler.js       # Isletme profili + hizmetler
      randevular.js        # Randevu olusturma / iptal / durum
      admin.js             # Admin paneli endpoint'leri
  sql/
    schema.sql          # Veritabani semasi
  public/                # Statik frontend (HTML/CSS/JS)
```

## Kurulum

1. PostgreSQL'de bir veritabanı oluşturun ve `server/sql/schema.sql` dosyasını çalıştırın.
2. `server/` klasöründe bir `.env` dosyası oluşturun:
   ```
   PORT=3000
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_NAME=carevo
   DB_USER=postgres
   DB_PASSWORD=...
   JWT_SECRET=...
   ```
3. Bağımlılıkları kurup sunucuyu başlatın:
   ```bash
   cd server
   npm install
   npm run dev
   ```
4. Tarayıcıdan `http://localhost:3000` adresine gidin.

Admin hesabı `kullanicilar` tablosuna elle eklenir (kayıt formu sadece müşteri/işletme rolünü destekler); `rol` alanını `'admin'` olarak, şifreyi bcrypt hash'i olarak girin.

## Bilinen Sınırlamalar

Bu bir portföy projesi olduğu için canlıya alınmadan önce eklenmesi gereken bazı parçalar var: ödeme entegrasyonu (şu an ödeme durumu manuel işaretleniyor), email tabanlı şifremi unuttum akışı, otomatik testler ve production deployment yapılandırması.
