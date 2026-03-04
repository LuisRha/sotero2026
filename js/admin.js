// =========================
// ELEMENTOS
// =========================
const tablaBody = document.querySelector("#tabla tbody");
const totalComprasEl = document.getElementById("totalCompras");
const totalNumerosEl = document.getElementById("totalNumeros");
// const selectSorteo = document.getElementById("selectSorteo");
const sorteoActivoTitulo = document.getElementById("sorteoActivoTitulo");

// ➕ Nuevo sorteo (modal)
const btnNuevoSorteo = document.getElementById("btnNuevoSorteo");
const modalNuevoSorteo = document.getElementById("modalNuevoSorteo");
const btnGuardarSorteo = document.getElementById("btnGuardarSorteo");
const btnCancelarSorteo = document.getElementById("btnCancelarSorteo");
const nuevoNombreSorteo = document.getElementById("nuevoNombreSorteo");
const nuevoSorteoActivo = document.getElementById("nuevoSorteoActivo");

let sorteoActivoId = null;
let sorteosCache = [];


// =========================
// CARGAR SORTEOS (API)
// =========================
async function cargarSorteos() {

  const res = await fetch("/api/sorteos");
  const data = await res.json();

  sorteosCache = data || [];
  sorteoActivoId = null;

  if (sorteosCache.length === 0) {

    sorteoActivoTitulo.textContent = "⚠️ No hay sorteos";
    return;

  }

  sorteosCache.forEach(sorteo => {

    if (sorteo.estado === "activo" && sorteoActivoId === null) {

      sorteoActivoId = sorteo.id;

      sorteoActivoTitulo.textContent =
        `🔴 Sorteo activo: ${sorteo.nombre}`;

    }

  });

  if (!sorteoActivoId) {

    sorteoActivoId = sorteosCache[0].id;

    sorteoActivoTitulo.textContent =
      `🔴 Sorteo activo: ${sorteosCache[0].nombre}`;

  }

}


// =========================
// GENERAR NUMEROS EXTRA UNICOS
// =========================
function generarExtras(numerosPrincipales){

  const usados = new Set()

  if(numerosPrincipales){
    numerosPrincipales.split(/[\s,]+/).forEach(n=>{
      if(n.trim() !== "") usados.add(n.trim())
    })
  }

  const extras = []

  while(extras.length < 4){

    let num = Math.floor(Math.random()*99999)+1
    num = num.toString().padStart(5,"0")

    if(!usados.has(num) && !extras.includes(num)){
      extras.push(num)
    }

  }

  return extras

}


// =========================
// ENVIAR WHATSAPP
// =========================
function enviarWhatsapp(telefono,nombre,numeros,pedido,cantidad){

  nombre = decodeURIComponent(nombre)
  numeros = decodeURIComponent(numeros)

  const producto = "Moto IGM CR 200"

  const extras = generarExtras(numeros)

  const mensaje = `
Hola, ${nombre}

Agradecemos por tu compra

Pedido número : ${pedido}

${producto} adicional

🎟️ TICKETS COMPRADOS : ${cantidad}


${numeros}


SUERTE EN NUESTRA PRIMER DINAMICA

Revisa los siguientes números y compararlos con los tuyos
si tienes alguno automáticamente ganas el premio extra

🎁 NÚMEROS EXTRA (BONO)

${extras[0]}
${extras[1]}
${extras[2]}
${extras[3]}

Con el respaldo de DADE'S Y TRUJILLOGROUP
`

  const telefonoFinal = "593" + telefono.replace(/^0/, "")

  window.open(
    `https://wa.me/${telefonoFinal}?text=${encodeURIComponent(mensaje)}`,
    "_blank"
  )

}


// =========================
// CARGAR COMPRAS (API)
// =========================
async function cargarDatos() {

  tablaBody.innerHTML = "";

  totalComprasEl.textContent = "0";
  totalNumerosEl.textContent = "0";

  let totalNumeros = 0;

  let url = "/api/compras";

  if (sorteoActivoId) {
    url += `?sorteo_id=${sorteoActivoId}`;
  }

  const res = await fetch(url);
  const data = await res.json();

  if (!data || data.length === 0) {

    tablaBody.innerHTML =
      "<tr><td colspan='8'>No hay compras registradas</td></tr>";

    return;

  }

  totalComprasEl.textContent = data.length;

  data.forEach(item => {

    totalNumeros += Number(item.cantidad || 0);

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${new Date(item.created_at).toLocaleString()}</td>
      <td>${item.nombre || "-"}</td>

      <td>${item.whatsapp || "-"}</td>

      <td>${item.cantidad ?? 0}</td>
      <td>${item.numeros ? `<button onclick="verNumeros('${encodeURIComponent(item.numeros)}')">Ver</button>` : "-"}</td>
      <td>${item.voucher ? `<button onclick="verVoucher('${encodeURIComponent(item.voucher)}')">Ver</button>` : "-"}</td>
      <td>${item.estado || "pendiente"}</td>

      <td>
        ${
          item.estado === "pendiente"
            ? `
              <button onclick="aprobar(${item.id})" style="background:#28a745;color:#fff">Aprobar</button>
              <button onclick="rechazar(${item.id})" style="background:#dc3545;color:#fff">Rechazar</button>
            `
            : item.estado === "aprobado"
              ? `
              <button onclick="enviarWhatsapp(
                '${item.whatsapp}',
                '${encodeURIComponent(item.nombre)}',
                '${encodeURIComponent(item.numeros)}',
                '${item.id}',
                '${item.cantidad}'
              )"
              style="background:#25D366;color:#fff">
              📨 Enviar WhatsApp
              </button>
              `
              : "<span style='color:red;font-weight:bold'>✖ Rechazado</span>"
        }
      </td>
    `;

    tablaBody.appendChild(tr);

  });

  totalNumerosEl.textContent = totalNumeros;

}


// =========================
// UTILIDADES
// =========================
function verNumeros(n) {
  alert("🎟️ Números comprados:\n\n" + decodeURIComponent(n));
}

function verVoucher(v) {
  alert("📄 Voucher:\n\n" + decodeURIComponent(v));
}


// =========================
// APROBAR / RECHAZAR
// =========================
async function aprobar(id) {

  const res = await fetch("/api/compras", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, estado: "aprobado" })
  });

  if (!res.ok) {
    alert("❌ Error al aprobar");
    return;
  }

  cargarDatos();

}

async function rechazar(id) {

  if (!confirm("¿Rechazar esta compra?")) return;

  const res = await fetch("/api/compras", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, estado: "rechazado" })
  });

  if (!res.ok) {
    alert("❌ Error al rechazar");
    return;
  }

  cargarDatos();

}


// =========================
// INICIO
// =========================
document.addEventListener("DOMContentLoaded", async () => {

  await cargarSorteos();
  await cargarDatos();

});