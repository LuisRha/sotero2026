// =========================
// ELEMENTOS
// =========================
const tablaBody = document.querySelector("#tabla tbody");
const totalComprasEl = document.getElementById("totalCompras");
const totalNumerosEl = document.getElementById("totalNumeros");
const sorteoActivoTitulo = document.getElementById("sorteoActivoTitulo");

// botones superiores
const btnCerrarSorteo = document.getElementById("btnCerrarSorteo");
const btnNuevoSorteo = document.getElementById("btnNuevoSorteo");
const btnEliminarSorteo = document.getElementById("btnEliminarSorteo");

// modal nuevo sorteo
const modalNuevoSorteo = document.getElementById("modalNuevoSorteo");
const btnGuardarSorteo = document.getElementById("btnGuardarSorteo");
const btnCancelarSorteo = document.getElementById("btnCancelarSorteo");
const nuevoNombreSorteo = document.getElementById("nuevoNombreSorteo");
const nuevoSorteoActivo = document.getElementById("nuevoSorteoActivo");

let sorteoActivoId = null;
let sorteosCache = [];


// =========================
// CARGAR SORTEOS
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
// ENVIAR WHATSAPP
// =========================
function enviarWhatsapp(telefono,nombre,numeros,pedido,cantidad,extras){

  nombre = decodeURIComponent(nombre);

  const numerosOriginales = decodeURIComponent(numeros);

  const numerosFormato = numerosOriginales.split(",").join(" - ");

  const producto = "Moto IGM CR 200";

  let extrasTexto = "----\n----\n----\n----";

  if(extras){
    extrasTexto = extras.split(",").join("\n");
  }

  const mensaje = `
Hola, ${nombre}

Agradecemos por tu compra

Pedido número : ${pedido}

${producto} adicional

🎟️ TICKETS COMPRADOS : ${cantidad}

${numerosFormato}

SUERTE EN NUESTRA PRIMER DINAMICA

Revisa los siguientes números y compararlos con los tuyos
si tienes alguno automáticamente ganas el premio extra

🎁 NÚMEROS EXTRA (BONO)

${extrasTexto}

Con el respaldo de DADE'S Y TRUJILLOGROUP
`;

  const telefonoFinal = "593" + telefono.replace(/^0/, "");

  window.open(
    `https://wa.me/${telefonoFinal}?text=${encodeURIComponent(mensaje)}`,
    "_blank"
  );

}


// =========================
// CARGAR COMPRAS
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
                '${item.cantidad}',
                '${item.extras || ""}'
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
// BOTONES PANEL
// =========================

// abrir modal nuevo sorteo
btnNuevoSorteo.addEventListener("click", () => {

  modalNuevoSorteo.classList.remove("oculto");

});

// cancelar modal
btnCancelarSorteo.addEventListener("click", () => {

  modalNuevoSorteo.classList.add("oculto");

});

// guardar sorteo
btnGuardarSorteo.addEventListener("click", async () => {

  const nombre = nuevoNombreSorteo.value.trim();
  const activo = nuevoSorteoActivo.checked;

  if (!nombre) {
    alert("Ingrese nombre del sorteo");
    return;
  }

  const res = await fetch("/api/sorteos", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      nombre,
      activo
    })
  });

  if(!res.ok){
    alert("Error al crear sorteo");
    return;
  }

  modalNuevoSorteo.classList.add("oculto");

  nuevoNombreSorteo.value="";
  nuevoSorteoActivo.checked=false;

  await cargarSorteos();
  await cargarDatos();

});


// cerrar sorteo
btnCerrarSorteo.addEventListener("click", async () => {

  if(!sorteoActivoId){
    alert("No hay sorteo activo");
    return;
  }

  if(!confirm("¿Cerrar este sorteo?")) return;

  await fetch("/api/sorteos",{
    method:"PUT",
    headers:{ "Content-Type":"application/json"},
    body: JSON.stringify({
      id: sorteoActivoId,
      estado:"cerrado"
    })
  });

  await cargarSorteos();
  await cargarDatos();

});


// eliminar sorteo
btnEliminarSorteo.addEventListener("click", async () => {

  if(!sorteoActivoId){
    alert("No hay sorteo seleccionado");
    return;
  }

  if(!confirm("⚠️ ¿Eliminar este sorteo?")) return;

  await fetch("/api/sorteos",{
    method:"DELETE",
    headers:{ "Content-Type":"application/json"},
    body: JSON.stringify({
      id:sorteoActivoId
    })
  });

  await cargarSorteos();
  await cargarDatos();

});


// =========================
// INICIO
// =========================
document.addEventListener("DOMContentLoaded", async () => {

  await cargarSorteos();
  await cargarDatos();

});