const express = require("express");
const pool = require("../db");
const { girisGerekli, rolGerekli } = require("../middleware/auth");

const router = express.Router();

// Bu satirdan sonraki TUM route'lar en az giris yapmis olmayi gerektirir
router.use(girisGerekli);

// İşletme profili oluştur (sadece isletme rolundeki giris yapmis kullanici, kendi adina)
router.post("/", rolGerekli("isletme"), async (req, res) => {
  const { isletme_adi, adres, aciklama } = req.body;

  if (!isletme_adi) {
    return res.status(400).json({ hata: "isletme_adi zorunludur" });
  }

  try {
    // kullanici_id'yi body'den degil, token'dan aliyoruz -
    // yoksa biri baska bir kullanici adina profil olusturabilirdi
    const sonuc = await pool.query(
      `INSERT INTO isletmeler (kullanici_id, isletme_adi, adres, aciklama)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.kullanici.id, isletme_adi, adres || null, aciklama || null]
    );
    res.status(201).json(sonuc.rows[0]);
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: "Sunucu hatasi" });
  }
});

// Giris yapmis isletme sahibinin kendi profilini bul (panel girisinde kullanilir)
router.get("/kullanici/:kullaniciId", rolGerekli("isletme"), async (req, res) => {
  if (Number(req.params.kullaniciId) !== req.kullanici.id) {
    return res.status(403).json({ hata: "Sadece kendi profilinizi goruntuleyebilirsiniz" });
  }

  try {
    const sonuc = await pool.query(
      "SELECT * FROM isletmeler WHERE kullanici_id = $1",
      [req.params.kullaniciId]
    );
    if (!sonuc.rows[0]) {
      return res.status(404).json({ hata: "Bu kullaniciya ait isletme profili yok" });
    }
    res.json(sonuc.rows[0]);
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: "Sunucu hatasi" });
  }
});

// Tum isletmeleri listele (musteri tarafinda secim yapmak icin, her iki rol de gorebilir)
router.get("/", async (req, res) => {
  try {
    const sonuc = await pool.query("SELECT * FROM isletmeler ORDER BY isletme_adi");
    res.json(sonuc.rows);
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: "Sunucu hatasi" });
  }
});

// Bir isletmenin sundugu hizmetleri listele (musteri randevu olusturuken kullanir)
router.get("/:id/hizmetler", async (req, res) => {
  try {
    const sonuc = await pool.query(
      "SELECT * FROM hizmetler WHERE isletme_id = $1 ORDER BY fiyat",
      [req.params.id]
    );
    res.json(sonuc.rows);
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: "Sunucu hatasi" });
  }
});

// Isletmeye yeni bir hizmet ekle (sadece o isletmenin sahibi)
router.post("/:id/hizmetler", rolGerekli("isletme"), async (req, res) => {
  const { ad, fiyat, tahmini_sure_dk } = req.body;

  if (!ad || fiyat === undefined) {
    return res.status(400).json({ hata: "ad ve fiyat zorunludur" });
  }

  try {
    const sahiplik = await pool.query(
      "SELECT id FROM isletmeler WHERE id = $1 AND kullanici_id = $2",
      [req.params.id, req.kullanici.id]
    );
    if (!sahiplik.rows[0]) {
      return res.status(403).json({ hata: "Bu isletme size ait degil" });
    }

    const sonuc = await pool.query(
      `INSERT INTO hizmetler (isletme_id, ad, fiyat, tahmini_sure_dk)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, ad, fiyat, tahmini_sure_dk || null]
    );
    res.status(201).json(sonuc.rows[0]);
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: "Sunucu hatasi" });
  }
});

module.exports = router;
