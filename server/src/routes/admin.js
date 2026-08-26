const express = require("express");
const pool = require("../db");
const { girisGerekli, rolGerekli } = require("../middleware/auth");

const router = express.Router();

// Bu satirdan sonraki TUM route'lar once giris + admin rolu kontrolunden gecer
router.use(girisGerekli, rolGerekli("admin"));

// Sistemdeki TUM randevular (herhangi bir isletmeyle sinirli degil)
router.get("/randevular", async (req, res) => {
  try {
    const sonuc = await pool.query(
      `SELECT r.*,
              k.ad_soyad AS musteri_adi, k.telefon AS musteri_telefon,
              i.isletme_adi,
              h.ad AS hizmet_adi
       FROM randevular r
       JOIN kullanicilar k ON k.id = r.musteri_id
       JOIN isletmeler i ON i.id = r.isletme_id
       JOIN hizmetler h ON h.id = r.hizmet_id
       ORDER BY r.tarih_saat DESC`
    );
    res.json(sonuc.rows);
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: "Sunucu hatasi" });
  }
});

// Sistemdeki tum isletmeler
router.get("/isletmeler", async (req, res) => {
  try {
    const sonuc = await pool.query(
      `SELECT i.*, k.email AS sahip_email
       FROM isletmeler i
       JOIN kullanicilar k ON k.id = i.kullanici_id
       ORDER BY i.isletme_adi`
    );
    res.json(sonuc.rows);
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: "Sunucu hatasi" });
  }
});

// Sistemdeki tum kullanicilar (musteri + isletme, admin haric)
router.get("/kullanicilar", async (req, res) => {
  try {
    const sonuc = await pool.query(
      `SELECT id, ad_soyad, email, telefon, rol, aktif, olusturulma_tarihi
       FROM kullanicilar
       WHERE rol != 'admin'
       ORDER BY olusturulma_tarihi DESC`
    );
    res.json(sonuc.rows);
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: "Sunucu hatasi" });
  }
});

// Bir kullaniciyi aktif/pasif yap (hesap devre disi birakma)
router.patch("/kullanicilar/:id/durum", async (req, res) => {
  const { aktif } = req.body;
  if (typeof aktif !== "boolean") {
    return res.status(400).json({ hata: "aktif alani boolean olmalidir" });
  }

  try {
    const sonuc = await pool.query(
      `UPDATE kullanicilar SET aktif = $1 WHERE id = $2 AND rol != 'admin'
       RETURNING id, ad_soyad, email, telefon, rol, aktif, olusturulma_tarihi`,
      [aktif, req.params.id]
    );
    if (!sonuc.rows[0]) {
      return res.status(404).json({ hata: "Kullanici bulunamadi" });
    }
    res.json(sonuc.rows[0]);
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: "Sunucu hatasi" });
  }
});

// Genel istatistikler (ust bilgi karti icin)
router.get("/istatistikler", async (req, res) => {
  try {
    const sonuc = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM randevular) AS toplam_randevu,
        (SELECT COUNT(*) FROM isletmeler) AS toplam_isletme,
        (SELECT COUNT(*) FROM kullanicilar WHERE rol = 'musteri') AS toplam_musteri,
        (SELECT COALESCE(SUM(ucret), 0) FROM randevular WHERE odeme_durumu = 'odendi') AS toplam_tahsilat,
        (SELECT COALESCE(SUM(ucret), 0) FROM randevular WHERE odeme_durumu = 'odenmedi') AS bekleyen_tahsilat
    `);
    res.json(sonuc.rows[0]);
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: "Sunucu hatasi" });
  }
});

// Son 6 ayin randevu sayisi ve tahsilati (grafik icin)
router.get("/istatistikler/aylik", async (req, res) => {
  try {
    const sonuc = await pool.query(`
      SELECT
        to_char(gs.ay, 'YYYY-MM') AS ay,
        COALESCE(r.randevu_sayisi, 0) AS randevu_sayisi,
        COALESCE(r.tahsilat, 0) AS tahsilat
      FROM generate_series(
        date_trunc('month', NOW()) - INTERVAL '5 months',
        date_trunc('month', NOW()),
        INTERVAL '1 month'
      ) AS gs(ay)
      LEFT JOIN (
        SELECT
          date_trunc('month', tarih_saat) AS ay,
          COUNT(*) AS randevu_sayisi,
          COALESCE(SUM(ucret) FILTER (WHERE odeme_durumu = 'odendi'), 0) AS tahsilat
        FROM randevular
        GROUP BY date_trunc('month', tarih_saat)
      ) r ON r.ay = gs.ay
      ORDER BY gs.ay
    `);
    res.json(sonuc.rows);
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: "Sunucu hatasi" });
  }
});

// Herhangi bir randevunun durumunu degistir (yonetici mudahalesi)
router.patch("/randevular/:id/durum", async (req, res) => {
  const { durum } = req.body;
  if (!["beklemede", "onaylandi", "iptal", "tamamlandi"].includes(durum)) {
    return res.status(400).json({ hata: "Gecersiz durum degeri" });
  }

  try {
    const sonuc = await pool.query(
      "UPDATE randevular SET durum = $1 WHERE id = $2 RETURNING *",
      [durum, req.params.id]
    );
    if (!sonuc.rows[0]) {
      return res.status(404).json({ hata: "Randevu bulunamadi" });
    }
    res.json(sonuc.rows[0]);
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: "Sunucu hatasi" });
  }
});

// Herhangi bir randevunun odeme durumunu degistir (ornegin elden odeme alindiginda elle isaretlemek icin)
router.patch("/randevular/:id/odeme", async (req, res) => {
  const { odeme_durumu } = req.body;
  if (!["odenmedi", "odendi"].includes(odeme_durumu)) {
    return res.status(400).json({ hata: "Gecersiz odeme_durumu degeri" });
  }

  try {
    const sonuc = await pool.query(
      "UPDATE randevular SET odeme_durumu = $1 WHERE id = $2 RETURNING *",
      [odeme_durumu, req.params.id]
    );
    if (!sonuc.rows[0]) {
      return res.status(404).json({ hata: "Randevu bulunamadi" });
    }
    res.json(sonuc.rows[0]);
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: "Sunucu hatasi" });
  }
});

module.exports = router;
