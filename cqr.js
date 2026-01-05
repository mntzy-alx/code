const jsQR = require("jsqr")
const Jimp = require("jimp")

module.exports = {
  name: "cqr",
  command: ["cqr"],
  async exec(m, { conn }) {

    if (!m.quoted) {
      return conn.sendMessage(
        m.chat,
        { text: "Reply gambar QRIS." },
        { quoted: m }
      )
    }

    const mime = m.quoted.mimetype || ""
    if (!mime.startsWith("image/")) {
      return conn.sendMessage(
        m.chat,
        { text: "Itu bukan gambar." },
        { quoted: m }
      )
    }

    try {
      const buffer = await m.quoted.download()
      const img = await Jimp.read(buffer)

      const { data, width, height } = img.bitmap
      const qr = jsQR(new Uint8ClampedArray(data), width, height)

      if (!qr) {
        return conn.sendMessage(
          m.chat,
          { text: "QR tidak terbaca." },
          { quoted: m }
        )
      }

      const payload = qr.data.trim()

      if (!payload.startsWith("000201")) {
        return conn.sendMessage(
          m.chat,
          { text: "Ini bukan QRIS." },
          { quoted: m }
        )
      }

      await conn.sendMessage(
        m.chat,
        {
          text:
`
${payload}
`
        },
        { quoted: m }
      )

    } catch (e) {
      conn.sendMessage(
        m.chat,
        { text: "Gagal membaca QR." },
        { quoted: m }
      )
    }
  }
}
