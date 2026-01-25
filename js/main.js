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
  if (!res.ok) {
    throw new Error("❌ Error obteniendo sorteos");
  }

  const data = await res.json();

  if (!Array.isArray(data)) {
    throw new Error("❌ Respuesta inválida de sorteos");
  }

  const activo = data.find(s => s.estado === "activo");
  if (!activo) throw new Error("❌ No hay sorteo activo");

  return activo.id;
}

// =========================
// 🔢 OBTENER BOLETOS VENDIDOS
// =========================
async function obtenerVendidos() {
  const res = await fetch("/api/compras?estados=pendiente,aprobado");
  if (!res.ok) return 0;

  const json = await res.json();
  return json.reduce((sum, fila) => sum + Number(fila.cantidad), 0);
}

// =========================
// 📊 ACTUALIZAR DISPONIBLES
// =========================
async function actualizarDisponibles() {
  try {
    const vendidos = await obtenerVendidos();
    const disponibles = TOTAL_BOLETOS - vendidos;
    disponiblesEl.textContent = `Boletos disponibles: ${disponibles}`;
  } catch {
    disponiblesEl.textContent = "Boletos disponibles: --";
  }
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
  totalPagarEl.textContent = cantidad > 0
    ? `Total a pagar: $${cantidad * PRECIO_BOLETO}`
    : "Total a pagar: $0";
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

    if (!nombre || !whatsapp || !cantidad || !voucher) {
      alert("Completa todos los campos");
      return;
    }

    const vendidos = await obtenerVendidos();
    const disponibles = TOTAL_BOLETOS - vendidos;

    if (cantidad > disponibles) {
      alert(`Solo quedan ${disponibles} boletos`);
      return;
    }

    const numeros = [];
    for (let i = 1; i <= cantidad; i++) {
      numeros.push(vendidos + i);
    }

    const sorteoId = await obtenerSorteoActivo();

    const res = await fetch("/api/compras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sorteo_id: sorteoId,
        nombre,
        whatsapp,
        cantidad,
        numeros: numeros.join(","),
        voucher,
        total: cantidad * PRECIO_BOLETO
      })
    });

    if (!res.ok) throw new Error("Error al registrar compra");

    // 📲 WhatsApp admin
    const numeroAdmin = "593988271324";
    const mensaje = `
📢 NUEVA COMPRA

👤 ${nombre}
📱 ${whatsapp}
🎟️ ${cantidad} boletos
💰 $${cantidad * PRECIO_BOLETO}

🔢 ${numeros.join(", ")}
🧾 ${voucher}
`;

    window.open(
      `https://wa.me/${numeroAdmin}?text=${encodeURIComponent(mensaje)}`,
      "_blank"
    );

    // limpiar
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
// TEXTO DINÁMICO
// =========================
const textosTopBar = [
  "JUEGA EL BONAZO $50.000",
  "SORTEO 100% TRANSPARENTE",
  "PAGA $5 Y GANA EN GRANDE",
  "PREMIOS REALES · GANADORES REALES"
];

let indice = 0;
setInterval(() => {
  const el = document.getElementById("topBarText");
  if (el) {
    indice = (indice + 1) % textosTopBar.length;
    el.textContent = textosTopBar[indice];
  }
}, 3000);
