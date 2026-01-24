// ⚠️ DATOS DE SUPABASE
const SUPABASE_URL = "https://caovuekqrczqysxgnucc.supabase.co";
const SUPABASE_KEY = "sb_publishable_843ipMaoEhnMrvuF95Iq6Q_9It7qiFX";

// Cliente Supabase
const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// Elementos
const btnComprar = document.getElementById("btnComprar");
const formulario = document.getElementById("formulario");
const btnEnviar = document.getElementById("btnEnviar");
const disponiblesEl = document.getElementById("disponibles");

const nombreInput = document.getElementById("nombre");
const whatsappInput = document.getElementById("whatsapp");
const cantidadInput = document.getElementById("cantidad");
const voucherInput = document.getElementById("voucher");
const totalPagarEl = document.getElementById("totalPagar");

// Configuración
const TOTAL_BOLETOS = 5000;
const PRECIO_BOLETO = 5;

// Mostrar formulario
btnComprar.addEventListener("click", () => {
  formulario.classList.remove("oculto");
  formulario.scrollIntoView({ behavior: "smooth" });
});

// 🔢 Obtener boletos vendidos
async function obtenerVendidos() {
  const { data, error } = await supabaseClient
    .from("compras")
    .select("cantidad");

  if (error) {
    console.error("Error al obtener vendidos:", error);
    return 0;
  }

  return data.reduce((sum, fila) => sum + Number(fila.cantidad), 0);
}

// 📊 Actualizar boletos disponibles
async function actualizarDisponibles() {
  const vendidos = await obtenerVendidos();
  const disponibles = TOTAL_BOLETOS - vendidos;
  disponiblesEl.textContent = `Boletos disponibles: ${disponibles}`;
}

// 💰 CALCULAR TOTAL AUTOMÁTICAMENTE
cantidadInput.addEventListener("input", () => {
  const cantidad = Number(cantidadInput.value);

  if (!cantidad || cantidad <= 0) {
    totalPagarEl.textContent = "Total a pagar: $0";
    return;
  }

  const total = cantidad * PRECIO_BOLETO;
  totalPagarEl.textContent = `Total a pagar: $${total}`;
});

// Al cargar
actualizarDisponibles();

// 🚀 Enviar datos
btnEnviar.addEventListener("click", async () => {
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

  // 🎟️ Generar números automáticos
  const numerosAsignados = [];
  for (let i = 1; i <= cantidad; i++) {
    numerosAsignados.push(vendidos + i);
  }

  const numerosTexto = numerosAsignados.join(",");
  const totalPagar = cantidad * PRECIO_BOLETO;

  // Guardar en Supabase
  const { error: insertError } = await supabaseClient
    .from("compras")
    .insert([
      {
        nombre,
        whatsapp,
        cantidad,
        numeros: numerosTexto,
        voucher,
        total: totalPagar
      }
    ]);

  if (insertError) {
    console.error(insertError);
    alert("Error al guardar la compra");
    return;
  }

  // 📲 WhatsApp ADMIN
  const numeroAdmin = "593988271324";

  const mensaje = `
📢 NUEVA SOLICITUD DE SORTEO

👤 Nombre: ${nombre}
📱 WhatsApp cliente: ${whatsapp}
🎟️ Cantidad de boletos: ${cantidad}
💰 Total pagado: $${totalPagar}

🔢 NÚMEROS ASIGNADOS:
${numerosAsignados.join(", ")}

🧾 VOUCHER:
${voucher}

Por favor confirmar pago.
`;

  window.open(
    `https://wa.me/${numeroAdmin}?text=${encodeURIComponent(mensaje)}`,
    "_blank"
  );

  // 🧼 Limpiar formulario
  nombreInput.value = "";
  whatsappInput.value = "";
  cantidadInput.value = "";
  voucherInput.value = "";
  totalPagarEl.textContent = "Total a pagar: $0";

  formulario.classList.add("oculto");
  actualizarDisponibles();
});
  

// dinamico

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
}, 3000); // cambia cada 3 segundos
