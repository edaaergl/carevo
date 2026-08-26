const express = require("express");
const pool = require("../db");
const { girisGerekli, rolGerekli } = require("../middleware/auth");

const router = express.Router();

// Bu satirdan sonraki TUM route'lar en az giris yapmis olmayi gerektirir
router.use(girisGerekli);

// Yeni randevu olustur (sadece musteri rolundeki giris yapmis kullanici, kendi adina)
router.post("/", rolGerekli("musteri"), async (req, res) => {
  const { isletme_id, hizmet_id, konum_turu, musteri_adresi, tarih_saat, arac_bilgisi } = req.body;

  if (!isletme_id || !hizmet_id || !konum_turu || !tarih_saat || !arac_bilgisi) {
    return res.status(400).json({
      hata: "isletme_id, hizmet_id, konum_turu, tarih_saat ve arac_bilgisi zorunludur",
    });
  }
  if (!["musteri_adresi", "dukkan"].includes(konum_turu)) {
    return res.status(400).json({ hata: "konum_turu 'musteri_adresi' veya 'dukkan' olmalidir" });
  }
  if (konum_turu === "musteri_adresi" && !musteri_adresi) {
    return res.status(400).json({ hata: "konum_turu 'musteri_adresi' ise musteri_adresi zorunludur" });
  }
  if (new Date(tarih_saat) < new Date()) {
    return res.status(400).json({ hata: "Gecmis bir tarihe randevu olusturulamaz" });
  }

  try {
    // Fiyati ve sureyi client'tan degil, veritabanindaki hizmet kaydindan aliyoruz
    // (musteri tarafi ucreti degistiremesin diye)
    const hizmet = await pool.query(
      "SELECT fiyat, tahmini_sure_dk FROM hizmetler WHERE id = $1 AND isletme_id = $2",
      [hizmet_id, isletme_id]
    );
    if (!hizmet.rows[0]) {
      return res.status(400).json({ hata: "Bu isletmede boyle bir hizmet bulunamadi" });
    }
    const ucret = hizmet.rows[0].fiyat;
    const yeniSureDk = hizmet.rows[0].tahmini_sure_dk || 60;

    // Ayni isletmede zaman araligi cakisan (durumu iptal olmayan) baska randevu var mi kontrol et
    const cakisma = await pool.query(
      `SELECT r.id FROM randevular r
       JOIN hizmetler h ON h.id = r.hizmet_id
       WHERE r.isletme_id = $1
         AND r.durum != 'iptal'
         AND (r.tarih_saat, (r.tarih_saat + (COALESCE(h.tahmini_sure_dk, 60) || ' minutes')::interval))
             OVERLAPS
             ($2::timestamp, ($2::timestamp + ($3 || ' minutes')::interval))`,
      [isletme_id, tarih_saat, yeniSureDk]
    );
    if (cakisma.rows[0]) {
      return res.status(409).json({ hata: "Bu isletmede secilen saat araliginda baska bir randevu var" });
    }

    // musteri_id'yi body'den degil, token'dan aliyoruz -
    // yoksa biri baska bir musteri adina randevu olusturabilirdi
    const sonuc = await pool.query(
      `INSERT INTO randevular
         (musteri_id, isletme_id, hizmet_id, konum_turu, musteri_adresi, tarih_saat, ucret, arac_bilgisi)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.kullanici.id, isletme_id, hizmet_id, konum_turu, musteri_adresi || null, tarih_saat, ucret, arac_bilgisi]
    );

    res.status(201).json(sonuc.rows[0]);
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: "Sunucu hatasi" });
  }
});

// Bir isletmenin tum randevularini listele (sadece o isletmenin sahibi)
router.get("/isletme/:isletmeId", rolGerekli("isletme"), async (req, res) => {
  try {
    const sahiplik = await pool.query(
      "SELECT id FROM isletmeler WHERE id = $1 AND kullanici_id = $2",
      [req.params.isletmeId, req.kullanici.id]
    );
    if (!sahiplik.rows[0]) {
      return res.status(403).json({ hata: "Bu isletme size ait degil" });
    }

    const sonuc = await pool.query(
      `SELECT r.*, k.ad_soyad AS musteri_adi, k.telefon AS musteri_telefon, h.ad AS hizmet_adi
       FROM randevular r
       JOIN kullanicilar k ON k.id = r.musteri_id
       JOIN hizmetler h ON h.id = r.hizmet_id
       WHERE r.isletme_id = $1
       ORDER BY r.tarih_saat DESC`,
      [req.params.isletmeId]
    );
    res.json(sonuc.rows);
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: "Sunucu hatasi" });
  }
});

// Bir musterinin kendi randevularini listele (sadece kendisi)
router.get("/musteri/:musteriId", async (req, res) => {
  if (Number(req.params.musteriId) !== req.kullanici.id) {
    return res.status(403).json({ hata: "Sadece kendi randevularinizi goruntuleyebilirsiniz" });
  }

  try {
    const sonuc = await pool.query(
      `SELECT r.*, i.isletme_adi, h.ad AS hizmet_adi
       FROM randevular r
       JOIN isletmeler i ON i.id = r.isletme_id
       JOIN hizmetler h ON h.id = r.hizmet_id
       WHERE r.musteri_id = $1
       ORDER BY r.tarih_saat DESC`,
      [req.params.musteriId]
    );
    res.json(sonuc.rows);
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: "Sunucu hatasi" });
  }
});

// Randevu durumunu guncelle (sadece randevunun ait oldugu isletmenin sahibi)
router.patch("/:id/durum", rolGerekli("isletme"), async (req, res) => {
  const { durum } = req.body;
  if (!["beklemede", "onaylandi", "iptal", "tamamlandi"].includes(durum)) {
    return res.status(400).json({ hata: "Gecersiz durum degeri" });
  }

  try {
    const sahiplik = await pool.query(
      `SELECT r.id FROM randevular r
       JOIN isletmeler i ON i.id = r.isletme_id
       WHERE r.id = $1 AND i.kullanici_id = $2`,
      [req.params.id, req.kullanici.id]
    );
    if (!sahiplik.rows[0]) {
      return res.status(403).json({ hata: "Bu randevu size ait degil" });
    }

    const sonuc = await pool.query(
      "UPDATE randevular SET durum = $1 WHERE id = $2 RETURNING *",
      [durum, req.params.id]
    );
    res.json(sonuc.rows[0]);
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: "Sunucu hatasi" });
  }
});

// Musteri kendi randevusunu iptal eder
router.patch("/:id/iptal", rolGerekli("musteri"), async (req, res) => {
  try {
    const randevu = await pool.query(
      "SELECT id, durum FROM randevular WHERE id = $1 AND musteri_id = $2",
      [req.params.id, req.kullanici.id]
    );
    if (!randevu.rows[0]) {
      return res.status(403).json({ hata: "Bu randevu size ait degil" });
    }
    if (["iptal", "tamamlandi"].includes(randevu.rows[0].durum)) {
      return res.status(400).json({ hata: "Bu randevu artik iptal edilemez" });
    }

    const sonuc = await pool.query(
      "UPDATE randevular SET durum = 'iptal' WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    res.json(sonuc.rows[0]);
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: "Sunucu hatasi" });
  }
});

module.exports = router;
