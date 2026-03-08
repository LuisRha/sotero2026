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

// nuevos campos del sorteo
const nuevoPremio = document.getElementById("nuevoPremio");
const nuevaImagen = document.getElementById("nuevaImagen");
const precioTicket = document.getElementById("precioTicket");
const totalNumerosInput = document.getElementById("totalNumeros");

// configuración sitio
const topBarAdmin = document.getElementById("topBarAdmin");
const guardarTopBar = document.getElementById("guardarTopBar");

let sorteoActivoId = null;
let sorteosCache = [];

// =========================
// CARGAR SORTEOS
// =========================
async function cargarSorteos() {

  try {

    const res = await fetch("/api/sorteos");
    const data = await res.json();

    sorteosCache = data || [];
    sorteoActivoId = null;

    if (sorteosCache.length === 0) {

      sorteoActivoTitulo.textContent = "⚠️ No hay sorteos";
      return;

    }

    sorteosCache.forEach(sorteo => {

      if (sorteo.estado === "activo" && !sorteoActivoId) {

        sorteoActivoId = sorteo.id;

        sorteoActivoTitulo.textContent =
          `🟢 Sorteo activo: ${sorteo.nombre}`;

      }

    });

    if (!sorteoActivoId) {

      sorteoActivoTitulo.textContent =
        "⚠️ Ningún sorteo activo";

    }

  } catch (err) {

    console.error("Error cargando sorteos", err);

  }

}

// =========================
// ENVIAR WHATSAPP
// =========================
async function enviarWhatsapp(telefono,nombreCompleto,numeros,pedido,cantidad){

  nombreCompleto = decodeURIComponent(nombreCompleto);

  const numerosOriginales = decodeURIComponent(numeros);
  const numerosFormato = numerosOriginales.split(",").join(" - ");

  // =========================
  // OBTENER PREMIOS
  // =========================
  const resPremios = await fetch("/api/premios");

  if(!resPremios.ok){
    alert("Error cargando premios");
    return;
  }

  const premios = await resPremios.json();

  let premiosTexto = "";

  premios.forEach(n=>{
    premiosTexto += n.numero + "\n";
  });


  // =========================
  // OBTENER SORTEO ACTIVO
  // =========================
  const resSorteo = await fetch("/api/sorteos");

  if(!resSorteo.ok){
    alert("Error cargando sorteo");
    return;
  }

  const sorteos = await resSorteo.json();

  const activo = sorteos.find(s => s.estado === "activo");

  let nombreSorteo = "SORTEO";
  let nombreDinamica = "PRIMERA";

  if(activo){

    nombreSorteo = activo.nombre;

    const etapas = ["PRIMERA","SEGUNDA","TERCERA","CUARTA","QUINTA"];

    nombreDinamica = etapas[(activo.id || 1) - 1] || "PRIMERA";

  }


  // =========================
  // MENSAJE WHATSAPP
  // =========================
  const mensaje = `
Agradecemos por tu compra

Pedido número : ${pedido}

${nombreSorteo}

🎟 TICKETS COMPRADOS : ${cantidad}

${numerosFormato}

🍀 SUERTE EN NUESTRA ${nombreDinamica} DINÁMICA

Revisa los siguientes números y compáralos con los tuyos
si tienes alguno automáticamente ganas el premio extra

🎁 PREMIO EXTRA

${premiosTexto}

Con el respaldo de DADE'S Y TRUJILLOGROUP
`;

// GENERAR IMAGEN DEL TICKET
generarTicketImagen(
  pedido,
  nombreSorteo,
  numerosFormato,
  premiosTexto
);

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

  let totalNumerosVendidos = 0;

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

    if(item.estado === "aprobado" || item.estado === "pendiente"){
      totalNumerosVendidos += Number(item.cantidad || 0);
    }

    const nombreCompleto =
      `${item.nombres || item.nombre || ""} ${item.apellidos || ""}`.trim();

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${new Date(item.created_at).toLocaleString()}</td>
      <td>${nombreCompleto || "-"}</td>
      <td>${item.whatsapp || "-"}</td>
      <td>${item.cantidad ?? 0}</td>
      <td>${item.numeros ? `<button onclick="verNumeros('${encodeURIComponent(item.numeros)}')">Ver</button>` : "-"}</td>
      <td>${item.voucher ? `<button onclick="verVoucher('${encodeURIComponent(item.voucher)}')">Ver</button>` : "-"}</td>
      <td>${item.estado || "pendiente"}</td>

      <td>
        ${
          item.estado === "pendiente"
        ? `
        <button class="btn-aprobar" onclick="aprobar(${item.id})">
        Aprobar
        </button>

       <button class="btn-rechazar" onclick="rechazar(${item.id})">
        Rechazar
       </button>
        `
            : item.estado === "aprobado"
              ? `
              <button onclick="enviarWhatsapp(
                '${item.whatsapp}',
                '${encodeURIComponent(nombreCompleto)}',
                '${encodeURIComponent(item.numeros)}',
                '${item.id}',
                '${item.cantidad}',
                '${item.extras || ""}'
              )">
              Enviar WhatsApp
              </button>
              `
              : "<span style='color:red'>Rechazado</span>"
        }
      </td>
    `;

    tablaBody.appendChild(tr);

  });

  totalNumerosEl.textContent = totalNumerosVendidos;

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

  await fetch("/api/compras", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, estado: "aprobado" })
  });

  cargarDatos();

}

async function rechazar(id) {

  if (!confirm("¿Rechazar esta compra?")) return;

  await fetch("/api/compras", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, estado: "rechazado" })
  });

  cargarDatos();

}

// =========================
// BOTONES PANEL
// =========================
btnNuevoSorteo?.addEventListener("click", () => {
  modalNuevoSorteo.classList.remove("oculto");
});

btnCancelarSorteo?.addEventListener("click", () => {
  modalNuevoSorteo.classList.add("oculto");
});

// =========================
// CREAR SORTEO
// =========================
btnGuardarSorteo?.addEventListener("click", async () => {

  const nombre = nuevoNombreSorteo.value.trim();
  const premio = nuevoPremio.value.trim();
  const imagen = nuevaImagen.value.trim();
  const precio_ticket = precioTicket.value;
  const total_numeros = totalNumerosInput.value;
  const activo = nuevoSorteoActivo.checked;

  if (!nombre) {
    alert("Ingrese nombre del sorteo");
    return;
  }

  const res = await fetch("/api/sorteos", {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      nombre,
      premio,
      imagen,
      precio_ticket,
      total_numeros,
      activo
    })

  });

  if (!res.ok) {
    alert("Error creando sorteo");
    return;
  }

  modalNuevoSorteo.classList.add("oculto");

  nuevoNombreSorteo.value = "";
  nuevoPremio.value = "";
  nuevaImagen.value = "";
  precioTicket.value = "";
  totalNumerosInput.value = "99999";
  nuevoSorteoActivo.checked = false;

  await cargarSorteos();
  await cargarDatos();

});

// =========================
// CERRAR SORTEO
// =========================
btnCerrarSorteo?.addEventListener("click", async () => {

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

});

// =========================
// ELIMINAR SORTEO
// =========================
btnEliminarSorteo?.addEventListener("click", async () => {

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
// GUARDAR TEXTO TOP BAR
// =========================
guardarTopBar?.addEventListener("click", async ()=>{

  const valor = topBarAdmin.value;

  if(!valor){
    alert("Ingrese texto");
    return;
  }

  await fetch("/api/config",{

    method:"PUT",

    headers:{
      "Content-Type":"application/json"
    },

    body:JSON.stringify({

      clave:"top_bar_text",
      valor

    })

  });

  alert("Texto actualizado");

});

// =========================
// INICIO
// =========================
document.addEventListener("DOMContentLoaded", async () => {

  await cargarSorteos();
  await cargarDatos();

});

// =========================
// 3️⃣ Función para generar la imagen
// =========================

// =========================
// 3️⃣ Función para generar la imagen
// =========================

function generarTicketImagen(pedido,nombreSorteo,numeros,premios){

document.getElementById("imgPedido").innerText =
"Pedido: " + pedido;

document.getElementById("imgSorteo").innerText =
nombreSorteo;

document.getElementById("imgNumeros").innerText =
numeros;

document.getElementById("imgPremios").innerText =
premios;

// esperamos que el ticket se renderice
setTimeout(()=>{

html2canvas(document.getElementById("ticketImagen"),{
scale:2,
useCORS:true
})
.then(canvas=>{

const link = document.createElement("a");

link.download = "ticket.png";
link.href = canvas.toDataURL("image/png");

document.body.appendChild(link);

link.click();

document.body.removeChild(link);

});

},300);

}