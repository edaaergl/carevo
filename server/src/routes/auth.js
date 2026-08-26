const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const pool = require("../db");

const router = express.Router();

// Ayni IP'den 15 dakikada en fazla 10 giris denemesi - brute-force koruma
const girisSinirlayici = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { hata: "Cok fazla giris denemesi yapildi, lutfen daha sonra tekrar deneyin" },
});

// Kayıt ol
router.post("/kayit", async (req, res) => {
  const { ad_soyad, email, sifre, telefon, rol } = req.body;

  if (!ad_soyad || !email || !sifre || !rol) {
    return res.status(400).json({ hata: "ad_soyad, email, sifre ve rol zorunludur" });
  }
  if (!["musteri", "isletme"].includes(rol)) {
    return res.status(400).json({ hata: "rol 'musteri' veya 'isletme' olmalidir" });
  }
  if (sifre.length < 6) {
    return res.status(400).json({ hata: "sifre en az 6 karakter olmalidir" });
  }

  try {
    const sifreHash = await bcrypt.hash(sifre, 10);

    const sonuc = await pool.query(
      `INSERT INTO kullanicilar (ad_soyad, email, sifre_hash, telefon, rol)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, ad_soyad, email, telefon, rol`,
      [ad_soyad, email, sifreHash, telefon || null, rol]
    );

    res.status(201).json(sonuc.rows[0]);
  } catch (hata) {
    if (hata.code === "23505") {
      // unique_violation (email zaten kayıtlı)
      return res.status(409).json({ hata: "Bu email zaten kayitli" });
    }
    console.error(hata);
    res.status(500).json({ hata: "Sunucu hatasi" });
  }
});

// Giriş yap
router.post("/giris", girisSinirlayici, async (req, res) => {
  const { email, sifre } = req.body;

  if (!email || !sifre) {
    return res.status(400).json({ hata: "email ve sifre zorunludur" });
  }

  try {
    const sonuc = await pool.query(
      "SELECT * FROM kullanicilar WHERE email = $1",
      [email]
    );
    const kullanici = sonuc.rows[0];

    if (!kullanici) {
      return res.status(401).json({ hata: "Email veya sifre hatali" });
    }

    const sifreDogruMu = await bcrypt.compare(sifre, kullanici.sifre_hash);
    if (!sifreDogruMu) {
      return res.status(401).json({ hata: "Email veya sifre hatali" });
    }

    if (!kullanici.aktif) {
      return res.status(403).json({ hata: "Hesabiniz devre disi birakilmis" });
    }

    // Token, kullanicinin kim oldugunu (id, rol) imzali bir sekilde tasir.
    // Sunucu bunu JWT_SECRET ile imzaladigi icin, biri token icerigini
    // degistirmeye calisirsa (ornegin rol'u "admin" yapmaya) imza gecersiz olur.
    const token = jwt.sign(
      { id: kullanici.id, rol: kullanici.rol },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // sifre_hash'i cevaba dahil etmiyoruz
    const { sifre_hash, ...kullaniciBilgisi } = kullanici;
    res.json({ ...kullaniciBilgisi, token });
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ hata: "Sunucu hatasi" });
  }
});

module.exports = router;
