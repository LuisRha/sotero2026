// =========================
// ELEMENTOS
// =========================
const btnComprar = document.getElementById("btnComprar");
const formulario = document.getElementById("formulario");
const btnEnviar = document.getElementById("btnEnviar");
const disponiblesEl = document.getElementById("disponibles");

const nombreInput = document.getElementById("nombre");
const whatsappInput = document.getElementById("whatsapp");
const cantidadInput = document.getElementById("cantidad");
const voucherInput = document.getElementById("voucher");
const totalPagarEl = document.getElementById("totalPagar");

// =========================
// CONFIGURACIÓN
// =========================
const TOTAL_BOLETOS = 5000;
const PRECIO_BOLETO = 5;

// =========================
// 🔥 OBTENER SORTEO ACTIVO (API)
// =========================
async function obtenerSorteoActivo() {
  const res = await fetch("/api/sorteos");
  const sorteos = await res.json();

  const activo = sorteos.find(s => s.estado === "activo");
  if (!activo) throw new Error("❌ No hay sorteo activo");

  return activo.id;
}

// =========================
// 🔢 OBTENER BOLETOS VENDIDOS (API)
// =========================
async function obtenerVendidos() {
  const res = await fetch("/api/compras?estados=pendiente,aprobado");
  const data = await res.json();

  return data.reduce((sum, fila) => sum + Number(fila.cantidad), 0);
}

// =========================
// 📊 ACTUALIZAR DISPONIBLES
// =========================
async function actualizarDisponibles() {
  const vendidos = await obtenerVendidos();
  const disponibles = TOTAL_BOLETOS - vendidos;
  disponiblesEl.textContent = `Boletos disponibles: ${disponibles}`;
}

// =========================
// MOSTRAR FORMULARIO
// =========================
btnComprar.addEventListener("click", () => {
  formulario.classList.remove("oculto");
  formulario.scrollIntoView({ behavior: "smooth" });
});

// =========================
// 💰 CALCULAR TOTAL
// =========================
cantidadInput.addEventListener("input", () => {
  const cantidad = Number(cantidadInput.value);
  if (!cantidad || cantidad <= 0) {
    totalPagarEl.textContent = "Total a pagar: $0";
    return;
  }
  totalPagarEl.textContent = `Total a pagar: $${cantidad * PRECIO_BOLETO}`;
});

// =========================
// 🚀 ENVIAR COMPRA (API)
// =========================
btnEnviar.addEventListener("click", async () => {
  try {
    const nombre = nombreInput.value.trim();
    const whatsapp = whatsappInput.value.trim();
    const cantidad = Number(cantidadInput.value);
    const voucher = voucherInput.value.trim();

    if (!nombre || !whatsapp || !cantidad || cantidad <= 0 || !voucher) {
      alert("Completa todos los campos y realiza el pago");
      return;
    }

    const vendidos = await obtenerVendidos();
    const disponibles = TOTAL_BOLETOS - vendidos;

    if (cantidad > disponibles) {
      alert(`Solo quedan ${disponibles} boletos disponibles`);
      return;
    }

    // 🎟️ NÚMEROS AUTOMÁTICOS
    const numerosAsignados = [];
    for (let i = 1; i <= cantidad; i++) {
      numerosAsignados.push(vendidos + i);
    }

    const sorteoId = await obtenerSorteoActivo();

    // 📡 ENVIAR A BACKEND
    await fetch("/api/compras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sorteo_id: sorteoId,
        nombre,
        whatsapp,
        cantidad,
        numeros: numerosAsignados.join(","),
        voucher,
        total: cantidad * PRECIO_BOLETO
      })
    });

    // 📲 WHATSAPP ADMIN
    const numeroAdmin = "593988271324";
    const mensaje = `
📢 NUEVA SOLICITUD DE SORTEO

👤 Nombre: ${nombre}
📱 WhatsApp cliente: ${whatsapp}
🎟️ Cantidad de boletos: ${cantidad}
💰 Total pagado: $${cantidad * PRECIO_BOLETO}

🔢 NÚMEROS:
${numerosAsignados.join(", ")}

🧾 VOUCHER:
${voucher}
`;

    window.open(
      `https://wa.me/${numeroAdmin}?text=${encodeURIComponent(mensaje)}`,
      "_blank"
    );

    // 🧼 LIMPIAR
    nombreInput.value = "";
    whatsappInput.value = "";
    cantidadInput.value = "";
    voucherInput.value = "";
    totalPagarEl.textContent = "Total a pagar: $0";

    formulario.classList.add("oculto");
    actualizarDisponibles();

  } catch (err) {
    alert(err.message);
  }
});

// =========================
// INICIO
// =========================
actualizarDisponibles();

// =========================
// TEXTO DINÁMICO (SIN CAMBIOS)
// =========================
const textosTopBar = [
  "JUEGA EL BONAZO $50.000",
  "SORTEO 100% TRANSPARENTE",
  "PAGA $5 Y GANA EN GRANDE",
  "PREMIOS REALES · GANADORES REALES"
];

let indice = 0;

setInterval(() => {
  const topBar = document.getElementById("topBarText");
  indice = (indice + 1) % textosTopBar.length;
  topBar.textContent = textosTopBar[indice];
}, 3000);
