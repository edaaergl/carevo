const express = require("express");
const path = require("path");
const pool = require("./db");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const isletmelerRoutes = require("./routes/isletmeler");
const randevularRoutes = require("./routes/randevular");
const adminRoutes = require("./routes/admin");

const app = express();
// Frontend hep ayni origin'den (bu sunucudan) relative istekler attigi icin
// cross-origin erisime izin vermeye gerek yok - CORS acmiyoruz.
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api/auth", authRoutes);
app.use("/api/isletmeler", isletmelerRoutes);
app.use("/api/randevular", randevularRoutes);
app.use("/api/admin", adminRoutes);

// Sağlık kontrolü: hem sunucunun hem veritabanı bağlantısının çalıştığını test eder
app.get("/saglik", async (req, res) => {
  try {
    const sonuc = await pool.query("SELECT NOW() AS su_an");
    res.json({ durum: "calisiyor", veritabani_saati: sonuc.rows[0].su_an });
  } catch (hata) {
    console.error(hata);
    res.status(500).json({ durum: "hata", mesaj: hata.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Carevo sunucusu http://localhost:${PORT} adresinde calisiyor`);
});
