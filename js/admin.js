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
  const numerosFormato = numerosOriginales
  ? numerosOriginales.split(",").join(" - ")
  : "";

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


  // =========================
  // ACTUALIZAR PRECIOS
  // =========================
  const precio = Number(activo.precio_ticket || 0);

  const p6  = document.getElementById("precio6");
  const p8  = document.getElementById("precio8");
  const p10 = document.getElementById("precio10");
  const p20 = document.getElementById("precio20");
  const p30 = document.getElementById("precio30");
  const p50 = document.getElementById("precio50");

  if(p6)  p6.innerText  = "$" + (precio * 6);
  if(p8)  p8.innerText  = "$" + (precio * 8);
  if(p10) p10.innerText = "$" + (precio * 10);
  if(p20) p20.innerText = "$" + (precio * 20);
  if(p30) p30.innerText = "$" + (precio * 30);
  if(p50) p50.innerText = "$" + (precio * 50);

}

  // =========================
  // MENSAJE WHATSAPP
  // =========================
const mensaje = `
Hola *${nombreCompleto}* 👋🏻
Agradecemos por tu compra

📓 Pedido número : *${pedido}*

*${nombreSorteo}*

💴 TICKETS COMPRADOS : *${cantidad}*

${numerosFormato}

🍀 *SUERTE EN NUESTRA ${nombreDinamica} DINÁMICA*

Revisa los siguientes números y compáralos con los tuyos
si tienes alguno automáticamente ganas el premio extra

🎁 *PREMIO EXTRA*

${premiosTexto}

Con el respaldo de *DADE'S Y TRUJILLOGROUP*
`;

// ==========================
// GENERAR TICKET (IMAGEN O PDF)
// ==========================
let lista = numerosFormato ? numerosFormato.split(" - ") : [];

if(lista.length <= 500){

  generarTicketImagen(
    pedido,
    nombreSorteo,
    numerosFormato,
    premiosTexto,
    nombreCompleto,
    cantidad,
    nombreDinamica
  );

}else{

  generarTicketPDF(
    pedido,
    nombreSorteo,
    numerosFormato,
    premiosTexto,
    nombreCompleto,
    cantidad,
    nombreDinamica
  );

}

const telefonoFinal = "593" + telefono.replace(/^0/, "");

window.open(
  `https://wa.me/${telefonoFinal}?text=${encodeURIComponent(mensaje)}`,
  "_blank"
);

}



// ==========================
// GENERAR PDF DEL TICKET
// ==========================
function generarTicketPDF(
pedido,
nombreSorteo,
numeros,
premios,
nombreCompleto,
cantidad,
nombreDinamica
){

const { jsPDF } = window.jspdf;

const doc = new jsPDF();

let y = 20;

doc.setFontSize(18);
doc.text("TRUJILLOGROUP",105,y,null,null,"center");

y += 10;

doc.setFontSize(12);

doc.text("Hola " + nombreCompleto,20,y);
y+=8;

doc.text("Pedido: " + pedido,20,y);
y+=8;

doc.text(nombreSorteo,20,y);
y+=8;

doc.text("TICKETS COMPRADOS: " + cantidad,20,y);
y+=10;

doc.text("TICKETS:",20,y);
y+=8;


// ==========================
// FORMATEAR NUMEROS EN FILAS
// ==========================
let lista = numeros.split(" - ");
let linea = "";

lista.forEach((n,i)=>{

linea += n + "    ";

if((i+1)%11===0){

doc.text(linea,20,y);

linea = "";

y += 6;

if(y>280){
doc.addPage();
y=20;
}

}

});

// si quedan numeros que no completan la fila
if(linea !== ""){
doc.text(linea,20,y);
}

y+=10;

doc.text("SUERTE EN NUESTRA " + nombreDinamica + " DINÁMICA",20,y);

y+=10;

doc.text("PREMIOS INSTANTÁNEOS :",20,y);

y+=8;

let premiosLista = premios.split("\n");

premiosLista.forEach(p=>{

doc.text(p,20,y);

y+=6;

if(y>280){
doc.addPage();
y=20;
}

});

doc.save("ticket_" + pedido + ".pdf");

}
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
// BUSCAR COMPRA
// =========================
async function buscarCompra(){

const valor = document.getElementById("buscarInput").value.trim();

if(!valor){
alert("Ingresa un número o cliente");
return;
}

const res = await fetch("/api/compras");
const data = await res.json();

let resultado = null;

for(const compra of data){

if(!compra.numeros) continue;

const lista = compra.numeros.split(",");

if(
lista.includes(valor) ||
(compra.nombres && compra.nombres.toLowerCase().includes(valor.toLowerCase())) ||
(compra.whatsapp && compra.whatsapp.includes(valor))
){
resultado = compra;
break;
}

}

const cont = document.getElementById("resultadoBusqueda");

if(!resultado){
cont.innerHTML = "<b>No encontrado</b>";
return;
}

cont.innerHTML = `
<div style="background:#111;color:white;padding:20px;border-radius:10px;margin-top:15px;position:relative">

<button onclick="cerrarBusqueda()"
style="position:absolute;top:8px;right:10px;background:red;color:white;border:none;border-radius:50%;width:26px;height:26px;cursor:pointer;font-weight:bold">
✖
</button>

<h3>Información de compra</h3>

Nombre: ${resultado.nombres} ${resultado.apellidos}<br>
WhatsApp: ${resultado.whatsapp}<br>
Email: ${resultado.email}<br>
Cantidad de tickets: ${resultado.cantidad}<br>
Número encontrado: <b>${valor}</b><br>
Voucher: ${resultado.voucher}<br>
Estado: ${resultado.estado}

<br><br>

<button onclick="enviarWhats(
'${resultado.whatsapp}',
'${valor}',
'${resultado.nombres}',
'${resultado.apellidos}',
'${resultado.id}'
)">
Enviar por WhatsApp
</button>

</div>
`;

}


// =========================
// ENVIAR WHATSAPP BUSQUEDA
// =========================
async function enviarWhats(telefono,numeroBuscado,nombre,apellido,pedido){

const tel = "593" + telefono.replace(/^0/, "");

// obtener sorteo activo
const res = await fetch("/api/sorteos");
const sorteos = await res.json();

let nombreSorteo = "SORTEO";

const activo = sorteos.find(s => s.estado === "activo");

if(activo){
nombreSorteo = activo.nombre;
}

const mensaje = `
🎉 *FELICIDADES ${nombre} ${apellido}*

Nos complace informarte que tu número ha resultado ganador.

🎟 Número ganador: *${numeroBuscado}*

🧾 Pedido: *${pedido}*

🏷 Sorteo: *${nombreSorteo}*

Guarda este mensaje como comprobante oficial.

Gracias por participar 🍀
`;

window.open(
`https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`,
"_blank"
);

}

// =========================
// APROBAR / RECHAZAR
// =========================

async function aprobar(id) {

  const confirmar = confirm("¿Seguro que deseas aprobar esta compra?");

  if(!confirmar) return;

  await fetch("/api/compras", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, estado: "aprobado" })
  });

  const res = await fetch("/api/compras?id=" + id);
  const compra = await res.json();

  if(compra && compra.numeros){

    const numeros = compra.numeros.split(",");

    for(const numero of numeros){

      await fetch("/api/verificar_premio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero: numero.trim(),
          ganador: compra.nombres,
          telefono: compra.whatsapp
        })
      });

    }

  }

  cargarDatos();
  revisarGanadores();

}


// 🔴 RECHAZAR
async function rechazar(id){

  const confirmar = confirm("¿Seguro que deseas rechazar esta compra?");

  if(!confirmar) return;

  await fetch("/api/compras", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      estado: "rechazado"
    })
  });

  cargarDatos();

  // obtener datos de la compra
  const res = await fetch("/api/compras?id=" + id);
  const compra = await res.json();

  if(compra && compra.numeros){

    // convertir string a array de números
    const numeros = compra.numeros.split(",");

    for(const numero of numeros){

      await fetch("/api/verificar_premio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero: numero.trim(),      // número comprado
          ganador: compra.nombres,    // nombre del ganador
          telefono: compra.whatsapp   // telefono del comprador
        })
      });

    }

  }

  // recargar panel
  cargarDatos();

  // revisar si hay premios ganados
  revisarGanadores();

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

// BOTON BUSCAR COMPRA
document.getElementById("btnBuscar")?.addEventListener("click", buscarCompra);

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
  await revisarGanadores();

  // revisar cada 5 segundos si hay ganadores
  setInterval(revisarGanadores, 5000);

});

// =========================
// 3️⃣ Función para generar la imagen
// =========================

function generarTicketImagen(
pedido,
nombreSorteo,
numeros,
premios,
nombreCompleto,
cantidad,
nombreDinamica
){

const ticket = document.getElementById("ticketImagen");

if(!ticket){
console.error("No existe el elemento ticketImagen");
return;
}

document.getElementById("imgSaludo").innerText =
"Hola " + nombreCompleto;

document.getElementById("imgPedido").innerText =
"Pedido: " + pedido;

document.getElementById("imgSorteo").innerText =
nombreSorteo;

document.getElementById("imgCantidad").innerText =
"TICKETS COMPRADOS : " + cantidad;

document.getElementById("imgNumeros").innerText =
numeros;

document.getElementById("imgDinamica").innerText =
"SUERTE EN NUESTRA " + nombreDinamica + " DINÁMICA";

document.getElementById("imgPremios").innerText =
premios;

// esperar que el contenido se actualice
setTimeout(()=>{

if(typeof html2canvas === "undefined"){
console.error("html2canvas no está cargado");
return;
}

html2canvas(ticket,{
scale:2,
useCORS:true,
backgroundColor:"#ffffff"
})
.then(canvas=>{

const imagen = canvas.toDataURL("image/png");

const link = document.createElement("a");

link.download = "ticket_"+pedido+".png";
link.href = imagen;

document.body.appendChild(link);
link.click();
document.body.removeChild(link);

});

},500);

}

// ==========================
// REVISAR GANADORES
// ==========================
async function revisarGanadores(){

  try{

    const res = await fetch("/api/tickets_ganadores");

    if(!res.ok){
      console.error("Error en la respuesta del servidor");
      return;
    }

    const data = await res.json();

    const alerta = document.getElementById("alertaAdmin");

    // Verificar si existe el contenedor
    if(!alerta) return;

    if(data && data.length > 0){

      // Título del aviso en el panel admin
      let html = "🎉 <b>Premios instantáneos ganados</b><br><br>";

      // Recorrer cada ganador
      data.forEach(g => {

        html += `
        🏆 Número: <b>${g.numero}</b><br>
        👤 Ganador: <b>${g.ganador}</b><br>
        📱 WhatsApp: <b>${g.telefono}</b><br>

        <!-- BOTON PARA NOTIFICAR POR WHATSAPP -->
        <button class="btn-whatsapp"
        onclick="notificarGanador('${g.telefono}','${g.ganador}','${g.numero}')">
        📲 Notificar ganador
        </button>

        <br><br>
        `;

      });

      // Mostrar la información en el panel admin
      alerta.innerHTML = html;

    }else{

      // Mensaje si no hay ganadores
      alerta.innerHTML = "✔ No hay premios instantáneos reclamados";

    }

  }catch(err){

    console.error("Error revisando ganadores:", err);

  }

}



// ==========================
// notificador
// ==========================
function notificarGanador(telefono,nombre,numero){

  // Verificar si existe número
  if(!telefono){
    alert("No hay número de WhatsApp para este ganador");
    return;
  }

  telefono = telefono.trim();

  // Mensaje que se enviará al ganador
  const mensaje = `
Hola ${nombre} 🎉

¡Felicidades!
Tu número ${numero} ha ganado un premio instantáneo.

Por favor contáctanos para reclamar tu premio.

SorteoEC
`;

  // Convertir número ecuatoriano a formato internacional
  const telefonoFinal = "593" + telefono.replace(/^0/, "");

  // Abrir WhatsApp con el mensaje listo
  window.open(
    `https://wa.me/${telefonoFinal}?text=${encodeURIComponent(mensaje)}`,
    "_blank"
  );

}