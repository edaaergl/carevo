const jwt = require("jsonwebtoken");

// Gecerli bir token yoksa istegi durdurur. Varsa req.kullanici = { id, rol } atar.
function girisGerekli(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ hata: "Giris yapmalisiniz" });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    req.kullanici = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (hata) {
    return res.status(401).json({ hata: "Gecersiz veya suresi dolmus token" });
  }
}

// girisGerekli'den SONRA kullanilir: req.kullanici.rol izin verilenler arasinda degilse durdurur
function rolGerekli(...izinliRoller) {
  return (req, res, next) => {
    if (!izinliRoller.includes(req.kullanici.rol)) {
      return res.status(403).json({ hata: "Bu islem icin yetkiniz yok" });
    }
    next();
  };
}

module.exports = { girisGerekli, rolGerekli };
