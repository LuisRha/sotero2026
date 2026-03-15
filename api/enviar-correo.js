import nodemailer from "nodemailer";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {

    const { email, nombre, numero, id_compra, valor } = req.body;

    if (!email || !nombre || !numero || !id_compra) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Sistema de Sorteos" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Confirmación de compra",
      html: `
        <div style="font-family:Arial;padding:20px">

        <h2 style="color:#2c7be5;">Compra confirmada</h2>

        Hola <b>${nombre}</b>,<br><br>

        Tu compra fue registrada correctamente.<br><br>

        <b>ID de compra:</b> ${id_compra}<br>
        <b>Número comprado:</b> ${numero}<br>
        <b>Valor pagado:</b> $${valor} USD<br><br>

        Guarda este correo como comprobante.<br><br>

        🍀 ¡Mucha suerte en el sorteo!

        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ ok: true });

  } catch (error) {

    console.error("Error enviando correo:", error);

    return res.status(500).json({ error: "Error enviando correo" });

  }

}