//SEUAIN SENDIRI AHH MALES GW, KLO GA SAMA AI AJA🙂

const QRCode = require("qrcode")

const QRIS_STATIC = "CODE_QR_STATIC_LUU"

/* di indexnya pake
const { handlePay } = require("./payqr")

 if (command === "pay") {
  await handlePay(sock, msg, args[0])
}
*/
async function handlePay(sock, msg, amount) {
  const from = msg.key.remoteJid

  if (!amount) {
    return sock.sendMessage(from, {
      text: "Gunakan: .pay 10000"
    })
  }

  if (isNaN(amount) || Number(amount) < 1000) {
    return sock.sendMessage(from, {
      text: "Nominal tidak valid. Minimal 1000."
    })
  }

  try {
    const dynamicQR = createDynamicQRIS(QRIS_STATIC, amount)

    const qrBuffer = await QRCode.toBuffer(dynamicQR, {
      margin: 2,
      scale: 10
    })

    await sock.sendMessage(from, {
      image: qrBuffer,
      caption:
`QRIS DINAMIS

Nominal: Rp ${Number(amount).toLocaleString("id-ID")}
Expired: ±5 menit

Scan untuk bayar.`
    })
  } catch (e) {
    await sock.sendMessage(from, {
      text: "Gagal generate QRIS."
    })
  }
}

// fungqr
function crc16ccitt(data) {
  let crc = 0xFFFF
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xFFFF
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0")
}

function createDynamicQRIS(payload, amount) {
  function parse(p) {
    let arr = []
    let i = 0
    while (i < p.length) {
      const id = p.substr(i, 2)
      const len = parseInt(p.substr(i + 2, 2))
      const val = p.substr(i + 4, len)
      arr.push({ id, val })
      i += 4 + len
    }
    return arr
  }

  let tlv = parse(payload).filter(x => x.id !== "63")

  const idx01 = tlv.findIndex(x => x.id === "01")
  if (idx01 !== -1) tlv[idx01].val = "12"

  const idx54 = tlv.findIndex(x => x.id === "54")
  if (idx54 !== -1) {
    tlv[idx54].val = amount.toString()
  } else {
    tlv.push({ id: "54", val: amount.toString() })
  }

  const body = tlv.map(x =>
    x.id + x.val.length.toString().padStart(2, "0") + x.val
  ).join("")

  const crc = crc16ccitt(body + "6304")
  return body + "6304" + crc
}

module.exports = {
  handlePay
}
