-- CAREVO VERITABANI SEMASI

CREATE TABLE kullanicilar (
    id              SERIAL PRIMARY KEY,
    ad_soyad        VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    sifre_hash      VARCHAR(255) NOT NULL,
    telefon         VARCHAR(20),
    rol             VARCHAR(20) NOT NULL CHECK (rol IN ('musteri', 'isletme', 'admin')),
    aktif           BOOLEAN NOT NULL DEFAULT true,
    olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE isletmeler (
    id              SERIAL PRIMARY KEY,
    kullanici_id    INTEGER NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
    isletme_adi     VARCHAR(150) NOT NULL,
    adres           VARCHAR(255),
    aciklama        TEXT,
    olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE hizmetler (
    id              SERIAL PRIMARY KEY,
    isletme_id      INTEGER NOT NULL REFERENCES isletmeler(id) ON DELETE CASCADE,
    ad              VARCHAR(150) NOT NULL,
    fiyat           NUMERIC(10, 2) NOT NULL,
    tahmini_sure_dk INTEGER,
    olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE randevular (
    id              SERIAL PRIMARY KEY,
    musteri_id      INTEGER NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
    isletme_id      INTEGER NOT NULL REFERENCES isletmeler(id) ON DELETE CASCADE,
    hizmet_id       INTEGER NOT NULL REFERENCES hizmetler(id) ON DELETE CASCADE,
    konum_turu      VARCHAR(20) NOT NULL CHECK (konum_turu IN ('musteri_adresi', 'dukkan')),
    musteri_adresi  VARCHAR(255),
    arac_bilgisi    VARCHAR(100) NOT NULL,
    tarih_saat      TIMESTAMP NOT NULL,
    durum           VARCHAR(20) NOT NULL DEFAULT 'beklemede'
                        CHECK (durum IN ('beklemede', 'onaylandi', 'iptal', 'tamamlandi')),
    odeme_durumu    VARCHAR(20) NOT NULL DEFAULT 'odenmedi'
                        CHECK (odeme_durumu IN ('odenmedi', 'odendi')),
    ucret           NUMERIC(10, 2) NOT NULL,
    olusturulma_tarihi TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_randevular_isletme ON randevular(isletme_id);
CREATE INDEX idx_randevular_musteri ON randevular(musteri_id);
