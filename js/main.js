document.addEventListener("DOMContentLoaded", () => {

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
  const modoSelect = document.getElementById("modoNumeros");

  const aceptarTerminos = document.getElementById("aceptarTerminos");
  const nombreSorteoPedido = document.getElementById("nombreSorteoPedido");

  // =========================
  // CONFIGURACIÓN DINÁMICA
  // =========================
  let TOTAL_BOLETOS = 0;
  let PRECIO_BOLETO = 0;
  let SORTEO_ID = null;

  // =========================
  // OBTENER SORTEO ACTIVO
  // =========================
  async function obtenerSorteoActivo(){

    const res = await fetch("/api/sorteos");

    if(!res.ok) throw new Error("Error obteniendo sorteos");

    const data = await res.json();

    const activo = data.find(s => s.estado === "activo");

    if(!activo) throw new Error("No hay sorteo activo");

    SORTEO_ID = activo.id;
    TOTAL_BOLETOS = Number(activo.total_numeros);
    PRECIO_BOLETO = Number(activo.precio_ticket);

    const titulo = document.getElementById("titulo");
    const premio = document.getElementById("premio");
    const imagen = document.getElementById("imagen");
    const precio = document.getElementById("precio");

    if(titulo) titulo.textContent = activo.nombre;
    if(premio) premio.textContent = activo.premio;
    if(imagen) imagen.src = activo.imagen;
    if(precio) precio.textContent = activo.precio_ticket;

    if(nombreSorteoPedido){
      nombreSorteoPedido.textContent = activo.nombre;
    }

  }

  // =========================
  // OBTENER BOLETOS VENDIDOS
  // =========================
  async function obtenerVendidos(){

    if(!SORTEO_ID) return 0;

    const res = await fetch(`/api/compras?sorteo_id=${SORTEO_ID}&estados=pendiente,aprobado`);

    if(!res.ok) return 0;

    const json = await res.json();

    return json.reduce(
      (sum, fila) => sum + Number(fila.cantidad || 0),
      0
    );
  }

  // =========================
  // DISPONIBLES + BARRA
  // =========================
  async function actualizarDisponibles(){

    try{

      const vendidos = await obtenerVendidos();

      let disponibles = TOTAL_BOLETOS - vendidos;

      if (disponibles < 0) disponibles = 0;

      let porcentaje = TOTAL_BOLETOS > 0
      ? (vendidos / TOTAL_BOLETOS) * 100
      : 0;

      if (porcentaje > 100) porcentaje = 100;

      porcentaje = porcentaje.toFixed(2);

      const barra = document.getElementById("barraFill");
      const texto = document.getElementById("porcentajeTexto");

      if(barra){
        barra.style.width = porcentaje + "%";
        barra.style.transition = "width 1s ease-in-out";
      }

      if(texto){
        texto.textContent = `Números vendidos: ${porcentaje}%`;
      }

      if(disponiblesEl){
        disponiblesEl.textContent = `Boletos disponibles: ${disponibles}`;
      }

    }
    catch(err){
      console.error("Error al actualizar barra:", err);
    }
  }

  // =========================
  // BOTÓN RESERVAR ANTIGUO
  // =========================
  if(btnComprar && formulario){

    btnComprar.addEventListener("click", ()=>{

      formulario.classList.remove("oculto");

      formulario.scrollIntoView({
        behavior:"smooth"
      });

    });

  }

  // =========================
  // CALCULAR TOTAL
  // =========================
  if(cantidadInput && totalPagarEl){

    cantidadInput.addEventListener("input",()=>{

      const cantidad = Number(cantidadInput.value);

      totalPagarEl.textContent =
      cantidad > 0
      ? `$${cantidad * PRECIO_BOLETO}`
      : "$0";

    });

  }

  // =========================
  // ENVIAR COMPRA
  // =========================
  if(btnEnviar){

    btnEnviar.addEventListener("click", async ()=>{

      try{

        const nombre = nombreInput.value.trim();
        const whatsapp = whatsappInput.value.trim();
        const cantidad = Number(cantidadInput.value);
        const voucher = voucherInput ? voucherInput.value.trim() : "";
        const modo = modoSelect ? modoSelect.value : "aleatorio";

        if(!aceptarTerminos || !aceptarTerminos.checked){
          alert("Debes aceptar los términos y condiciones");
          return;
        }

        if(!nombre || !whatsapp || !cantidad){
          alert("Completa todos los campos");
          return;
        }

        const vendidos = await obtenerVendidos();
        const disponibles = TOTAL_BOLETOS - vendidos;

        if(cantidad > disponibles){
          alert(`Solo quedan ${disponibles} boletos`);
          return;
        }

        let numeros = [];

        const usados = new Set();

        while(numeros.length < cantidad){

          const n = Math.floor(Math.random() * TOTAL_BOLETOS) + 1;

          if(!usados.has(n)){
            usados.add(n);
            numeros.push(n);
          }

        }

        const res = await fetch("/api/compras",{

          method:"POST",

          headers:{
            "Content-Type":"application/json"
          },

          body: JSON.stringify({

            sorteo_id: SORTEO_ID,
            nombre,
            whatsapp,
            cantidad,
            numeros: numeros.join(", "),
            voucher,
            total: cantidad * PRECIO_BOLETO

          })

        });

        if(!res.ok)
        throw new Error("Error al registrar compra");

        const numeroAdmin = "593987354472";

        const mensaje = `
NUEVA COMPRA

NOMBRE: ${nombre}
WHATSAPP: ${whatsapp}
BOLETOS: ${cantidad}
TOTAL: $${cantidad * PRECIO_BOLETO}

NUMEROS:
${numeros.join(", ")}

VOUCHER: ${voucher}
`;

        window.open(
          `https://wa.me/${numeroAdmin}?text=${encodeURIComponent(mensaje)}`,
          "_blank"
        );

        nombreInput.value = "";
        whatsappInput.value = "";
        cantidadInput.value = "";
        if(voucherInput) voucherInput.value = "";
        totalPagarEl.textContent = "$0";

        formulario.classList.add("oculto");

        actualizarDisponibles();

      }
      catch(err){
        alert(err.message);
      }

    });

  }

  // =========================
  // INICIO
  // =========================
  (async ()=>{

    try{
      await obtenerSorteoActivo();
      await actualizarDisponibles();
    }
    catch(err){
      console.error(err);
    }

  })();

  // =========================
  // TEXTO DINÁMICO TOP BAR
  // =========================
  const textosTopBar = [
    "DINÁMICA #1",
    "A llevarse un iPhone 17 Pro Max",
    "SORTEO 100% TRANSPARENTE",
    "A llevarse un iPhone 17 Pro Max",
    "PREMIOS REALES · GANADORES REALES",
    "A llevarse un iPhone 17 Pro Max"
  ];

  let indice = 0;

  setInterval(()=>{

    const el = document.getElementById("topBarText");

    if(el){

      indice = (indice + 1) % textosTopBar.length;

      el.textContent = textosTopBar[indice];

    }

  }, 3000);

});


// =========================
// COMPRAR DESDE CUADROS
// =========================
function comprar(cantidad){

const cantidadInput = document.getElementById("cantidad");
const totalPagarEl = document.getElementById("totalPagar");

cantidadInput.value = cantidad;

// calcular total
if(totalPagarEl && typeof PRECIO_BOLETO !== "undefined"){
totalPagarEl.textContent = "$" + (cantidad * PRECIO_BOLETO);
}

document.getElementById("formulario").classList.remove("oculto");

document.getElementById("formulario").scrollIntoView({
behavior:"smooth"
});

}

function comprarPersonalizado(){

const cantidad = document.getElementById("cantidadPersonalizada").value;

comprar(Number(cantidad));

}


// =========================
// CONSULTAR BOLETOS
// =========================
async function consultarNumeros(){

const telefono = document.getElementById("consultaWhatsapp").value.trim();

if(!telefono){
alert("Ingresa tu número de WhatsApp");
return;
}

const res = await fetch(`/api/compras?whatsapp=${telefono}`);

if(!res.ok){
alert("Error consultando números");
return;
}

const data = await res.json();

const resultado = document.getElementById("resultadoConsulta");

if(!data.length){
resultado.innerHTML = "No se encontraron compras con ese WhatsApp.";
return;
}

let html = "<h3>Tus números:</h3>";

data.forEach(compra => {

html += `
<div style="margin-bottom:10px;">
🎟 ${compra.numeros}
</div>
`;

});

resultado.innerHTML = html;

}


// =========================
// MOSTRAR ÚLTIMA COMPRA
// =========================
async function mostrarUltimaCompra(){

try{

const res = await fetch("/api/compras?estados=aprobado");

if(!res.ok) return;

const data = await res.json();

if(!data.length) return;

const ultima = data[0];

const aviso = document.createElement("div");

aviso.className = "alerta-compra";

aviso.innerHTML = `
🔥 ${ultima.nombre} acaba de comprar 
<b>${ultima.cantidad}</b> boletos
`;

document.body.appendChild(aviso);

setTimeout(()=>{
aviso.remove();
},6000);

}
catch(err){
console.error("Error mostrando compra:", err);
}

}


// =========================
// CONSULTAR CADA 1 HORA
// =========================
setInterval(mostrarUltimaCompra,3600000);