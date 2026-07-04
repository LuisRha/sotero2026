// =========================
// CONEXIÓN SUPABASE
// =========================
const SUPABASE_URL = "https://caovuekqrczqysxgnucc.supabase.co";
const SUPABASE_KEY = "sb_publishable_843ipMaoEhnMrvuF95Iq6Q_9It7qiFX";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// =========================
// VARIABLES GLOBALES
// =========================
let TOTAL_BOLETOS = 0;
let PRECIO_BOLETO = 0;
let SORTEO_ID = null;

// =========================
// Detectar premio cuando compran
// =========================
async function verificarPremio(numero){

const { data, error } = await supabaseClient
.from("tickets")
.select("numero,premio")
.eq("numero", numero)
.eq("sorteo_id", SORTEO_ID);

if(error){
console.error("Error consultando premio:", error);
return;
}

if(data && data.length > 0 && data[0].premio){

alert("🎉 ¡FELICIDADES! Número premiado: " + numero);

}

}
// =========================
// INICIO DOM
// =========================
document.addEventListener("DOMContentLoaded", () => {

  const btnEnviar = document.getElementById("btnEnviar");
  const formulario = document.getElementById("formulario");
  const disponiblesEl = document.getElementById("disponibles");

  const nombreInput = document.getElementById("nombre");
  const apellidosInput = document.getElementById("apellidos");
  const whatsappInput = document.getElementById("whatsapp");
  const cantidadInput = document.getElementById("cantidad");
  

  const emailInput = document.getElementById("email");
  const direccionInput = document.getElementById("direccion");
  const provinciaInput = document.getElementById("provincia");
  const ciudadInput = document.getElementById("ciudad");
  const documentoInput = document.getElementById("numero_documento");
  const tipoDocumentoInput = document.querySelector("select");

  const totalPagarEl = document.getElementById("totalPagar");
  const aceptarTerminos = document.getElementById("aceptarTerminos");
  const nombreSorteoPedido = document.getElementById("nombreSorteoPedido");


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

  const precioUnidad = document.getElementById("precioUnidad");

  if(precioUnidad){
    precioUnidad.textContent = PRECIO_BOLETO.toFixed(2);
  }

  if(nombreSorteoPedido){
    nombreSorteoPedido.textContent = activo.nombre;
  }

  // =========================
  // ACTUALIZAR PRECIOS PAQUETES
  // =========================

  const p5  = document.getElementById("precio5");
  const p10  = document.getElementById("precio10");
  const p15 = document.getElementById("precio15");
  const p20 = document.getElementById("precio20");
  const p30 = document.getElementById("precio30");
  const p50 = document.getElementById("precio50");

  if(p5)  p5.textContent  = "$" + (PRECIO_BOLETO * 5);
  if(p10) p10.textContent  = "$" + (PRECIO_BOLETO * 10);
  if(p15) p15.textContent = "$" + (PRECIO_BOLETO * 15);
  if(p20) p20.textContent = "$" + (PRECIO_BOLETO * 20);
  if(p30) p30.textContent = "$" + (PRECIO_BOLETO * 30);
  if(p50) p50.textContent = "$" + (PRECIO_BOLETO * 50);

}


  // =========================
  // OBTENER VENDIDOS
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
  // ACTUALIZAR DISPONIBLES
  // =========================
  async function actualizarDisponibles(){

    try{

      const vendidos = await obtenerVendidos();

      let disponibles = TOTAL_BOLETOS - vendidos;

      if(disponibles < 0) disponibles = 0;

      let porcentaje = TOTAL_BOLETOS > 0
        ? (vendidos / TOTAL_BOLETOS) * 100
        : 0;

      if(porcentaje > 100) porcentaje = 100;

      porcentaje = porcentaje.toFixed(2);

      const barra = document.getElementById("barraFill");
      const texto = document.getElementById("porcentajeTexto");

      if(barra){
        barra.style.width = porcentaje + "%";
      }

      if(texto){
        texto.textContent = `Números vendidos: ${porcentaje}%`;
      }

      if(disponiblesEl){
        disponiblesEl.textContent = `Boletos disponibles: ${disponibles}`;
      }

    }
    catch(err){
      console.error("Error barra:", err);
    }
  }


  // =========================
// BOTON PAGAR
// =========================
if(btnEnviar){

  btnEnviar.addEventListener("click", async (e)=>{

  e.preventDefault();

  // 🔄 MOSTRAR PROCESANDO
document.getElementById("procesando").style.display = "flex";
document.querySelector("#procesando h2").innerText = "Procesando tu compra...";
document.querySelector("#procesando p").innerText = "Por favor espera";

  const cantidad = Number(cantidadInput?.value);
  const totalCompra = cantidad * PRECIO_BOLETO;

  let confirmar = confirm(
`⚠️ CONFIRMAR COMPRA

Cantidad: ${cantidad} números
Total: $${totalCompra.toFixed(2)}

¿Deseas continuar?`
  );

  if(!confirmar){
  document.getElementById("procesando").style.display = "none";
  return;
}

  try{

        const nombres = nombreInput?.value.trim();
        const apellidos = apellidosInput?.value.trim();
        const telefono = whatsappInput?.value.trim();
      

        const email = emailInput?.value.trim();
        const direccion = direccionInput?.value.trim();
        const provincia = provinciaInput?.value;
        const ciudad = ciudadInput?.value.trim();
        const numero_documento = documentoInput?.value.trim();
        const tipo_documento = tipoDocumentoInput?.value;

        if(!aceptarTerminos.checked){
  alert("Debes aceptar los términos");
  document.getElementById("procesando").style.display = "none";
  return;
}

        if(!nombres || !apellidos || !telefono || !cantidad || !email){
  alert("Completa todos los campos obligatorios");
  document.getElementById("procesando").style.display = "none";
  return;
}

        const vendidos = await obtenerVendidos();
const disponibles = TOTAL_BOLETOS - vendidos;
if(cantidad > disponibles){
  alert(`⚠️ Solo quedan ${disponibles} boletos disponibles...`);
  document.getElementById("procesando").style.display = "none";
  return;
}

        const res = await fetch("/api/compras",{

          method:"POST",

          headers:{
            "Content-Type":"application/json"
          },

          body: JSON.stringify({

            sorteo_id: SORTEO_ID,

            nombres,
            apellidos,

            telefono,
            whatsapp: telefono,

            email,
            direccion,
            provincia,
            ciudad,
            numero_documento,
            tipo_documento,

            cantidad,
            total: cantidad * PRECIO_BOLETO

          })

        });

        const data = await res.json();

        if(!res.ok){
          throw new Error(data.error || "Error al registrar compra");
        }


        // =========================
       // ENVIAR CORREO AUTOMATICO
      // =========================

await fetch("/api/enviar-correo", {

method: "POST",

headers: {
"Content-Type": "application/json"
},

body: JSON.stringify({

email: email,
nombre: nombres,
numero: data.numeros,
id_compra: data.id_compra,
valor: cantidad * PRECIO_BOLETO

})

});

        

        // =========================
        // VERIFICAR PREMIOS
        // =========================
        if(data.numeros){

        const lista = data.numeros.split(",");

        for(const numero of lista){

        await verificarPremio(numero.trim());

        }

        }

        // ocultar loader
document.getElementById("procesando").style.display = "none";

// redirigir a confirmación
window.location.href = `confirmacion.html?id=${data.id_compra}&total=${cantidad * PRECIO_BOLETO}&nums=${data.numeros}&cliente=${encodeURIComponent(nombres + " " + apellidos)}`;

        nombreInput.value="";
        apellidosInput.value="";
        whatsappInput.value="";
        cantidadInput.value="";
        emailInput.value="";
        direccionInput.value="";
        ciudadInput.value="";
        documentoInput.value="";

        if(provinciaInput) provinciaInput.selectedIndex = 0;
        if(tipoDocumentoInput) tipoDocumentoInput.selectedIndex = 0;

        totalPagarEl.textContent="$0";

        if(formulario){
         formulario.classList.add("oculto");
          }

        actualizarDisponibles();

      }
      catch(err){
  document.getElementById("procesando").style.display = "none";
  alert(err.message);
}

    });

  }


  (async ()=>{
  try{

    await obtenerSorteoActivo();

    cargarSlider(); // 🔥 ACTIVAS EL SLIDER

await actualizarDisponibles();
await cargarNumerosPremio();

    // =========================
    // LEER CANTIDAD DESDE URL
    // =========================
    const params = new URLSearchParams(window.location.search);
    const cantidadURL = params.get("cantidad");

    if(cantidadURL){

      const campoCantidad = document.getElementById("cantidad");
      const totalPagar = document.getElementById("totalPagar");

      if(campoCantidad){
        campoCantidad.value = cantidadURL;
      }

      const total = cantidadURL * PRECIO_BOLETO;

      if(totalPagar){
        totalPagar.textContent = "$" + total.toFixed(2);
      }

    }

    await actualizarDisponibles();
    await cargarNumerosPremio();

  }
  catch(err){
    console.error(err);
  }
})();

// =========================
// CONSULTAR BOLETOS (Versión Inteligente: WhatsApp o Orden)
// =========================
async function consultarNumeros(){

  const inputUsuario = document.getElementById("consultaWhatsapp").value.trim();

  if(!inputUsuario){
    alert("Ingresa tu WhatsApp o Número de Orden");
    return;
  }

  // 🕵️‍♂️ DETECTAR SI ES UNA ORDEN O UN WHATSAPP
  const esNumeroOrden = inputUsuario.startsWith("#") || (!isNaN(inputUsuario) && inputUsuario.length <= 4);
  
  let urlApi = "";
  
  // Suponiendo que SORTEO_ID es una variable global ya definida en tu script
  if (esNumeroOrden) {
    const idCompra = inputUsuario.replace("#", "");
    urlApi = `/api/compras?id=${idCompra}&sorteo_id=${SORTEO_ID}`;
  } else {
    urlApi = `/api/compras?whatsapp=${inputUsuario}&sorteo_id=${SORTEO_ID}`;
  }

  try {
    const res = await fetch(urlApi);

    if(!res.ok){
      alert("Error consultando la información");
      return;
    }

    const data = await res.json();
    const resultado = document.getElementById("resultadoConsulta");

    // =========================
    // NO HAY COMPRAS
    // =========================
    if(!data || !data.length){
      resultado.innerHTML = `
        <div class="estado sin-compras">
          <h3>📭 No se encontraron registros</h3>
          <p>No encontramos ninguna compra asociada a "${inputUsuario}".</p>
        </div>
      `;
      return;
    }

    // ✨ CORRECCIÓN AQUÍ: Si es número de orden, localizamos la orden exacta dentro de la respuesta
    let ordenEspecifica = null;
    if (esNumeroOrden) {
      const idBuscado = inputUsuario.replace("#", "").trim();
      ordenEspecifica = data.find(c => String(c.id) === idBuscado);

      if (!ordenEspecifica) {
        resultado.innerHTML = `
          <div class="estado sin-compras">
            <h3>📭 Orden no encontrada</h3>
            <p>No encontramos la Orden #${idBuscado} en el sistema.</p>
          </div>
        `;
        return;
      }
    }

    // Asignamos el estado correcto dependiendo del tipo de búsqueda
    const estadoAEvaluar = esNumeroOrden 
      ? (ordenEspecifica.estado ? ordenEspecifica.estado.toLowerCase().trim() : "")
      : (data[0].estado ? data[0].estado.toLowerCase().trim() : "");

    // =========================
    // HAY COMPRAS PENDIENTES / RECHAZADAS
    // =========================
    if (!esNumeroOrden) {
      const pendientes = data.filter(c => c.estado && c.estado.toLowerCase().trim() === "pendiente");
      if(pendientes.length && pendientes.length === data.length){
        resultado.innerHTML = `
          <div class="estado pendiente">
            <h3>⏳ Compra pendiente de aprobación</h3>
            <p>Tu compra aún no ha sido aprobada por el administrador.</p>
            <p>Realiza el pago mediante <b>transferencia</b> o <b>depósito</b>.</p>
            <p>Luego envíanos el comprobante por WhatsApp para evaluar y aprobar tu compra.</p>
            <p>Una vez aprobada podrás visualizar tus números.</p>
          </div>
        `;
        return;
      }
    } else {
      // Validamos los estados usando la orden exacta encontrada en el filtro
      if (estadoAEvaluar === "pendiente") {
        resultado.innerHTML = `
          <div class="estado pendiente">
            <h3>⏳ La Orden #${ordenEspecifica.id} está pendiente</h3>
            <p>Envíanos el comprobante de pago por WhatsApp para proceder con la aprobación.</p>
          </div>
        `;
        return;
      }
      
      if (estadoAEvaluar === "rechazado" || estadoAEvaluar === "rechazada") {
        resultado.innerHTML = `
          <div class="estado sin-compras" style="border-left: 6px solid #ff4a4a;">
            <h3>❌ La Orden #${ordenEspecifica.id} fue Rechazada</h3>
            <p>Esta compra no fue aprobada por el administrador.</p>
          </div>
        `;
        return;
      }
    }

    // =========================
    // COMPRAS APROBADAS / MOSTRAR NÚMEROS
    // =========================
    let html = `
      <div class="estado aprobada">
        <h3>✅ Tus números</h3>
    `;

    let tieneAprobados = false;
    let totalNumerosComprados = 0;
    let premiosGanados = [];

    // Si es búsqueda por orden, procesamos solo esa orden. Si es por WhatsApp, procesamos todo el array.
    const comprasAProcesar = esNumeroOrden ? [ordenEspecifica] : data;

    // Calculamos el total de números de forma segura
    comprasAProcesar.forEach(compra => {
      const est = compra.estado ? compra.estado.toLowerCase().trim() : "";
      if ((est === "aprobado" || est === "aprobada") && compra.numeros) {
        totalNumerosComprados += compra.numeros.split(",").filter(n => n.trim() !== "").length;
      }
    });

    // Si tiene más de 15 números en total, añadimos el mini buscador
    if (totalNumerosComprados > 15) {
      html += `
        <div class="buscador-boletos-box" style="margin-bottom: 15px;">
          <input type="text" id="filtrarBoletoInput" placeholder="🔍 Buscar mi número..." 
                 onkeyup="filtrarBoletosEnPantalla()" 
                 style="width:100%; padding:8px; border-radius:5px; border:1px solid #444; background:#222; color:#fff;">
        </div>
      `;
    }

    comprasAProcesar.forEach(compra => {
      const est = compra.estado ? compra.estado.toLowerCase().trim() : "";

      if ((est === "aprobado" || est === "aprobada") && compra.numeros) {
        tieneAprobados = true;
        const arrayNumeros = compra.numeros.split(",").map(n => n.trim()).filter(n => n !== "");

        html += `
          <div class="numeros-box" style="margin-bottom: 20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <small style="color:#aaa;">Orden #${compra.id}</small>
              <span style="font-size:12px; background:#333; padding:2px 8px; border-radius:10px; color:#fff;">
                ${arrayNumeros.length} boletos
              </span>
            </div>
            
            <div class="boletos-grid-scroll" style="max-height: 200px; overflow-y: auto; display: flex; flex-wrap: wrap; gap: 5px; padding: 5px; border: 1px solid #333; border-radius: 6px; background: rgba(0,0,0,0.2);">
              ${arrayNumeros
                .map(n => `<span class="numero data-boleto-item" style="display:inline-block; padding:4px 8px; background:#00ff88; color:#000; font-weight:bold; border-radius:4px; font-size:14px;">${n}</span>`)
                .join("")}
            </div>
          </div>
        `;

        if (compra.premio) {
          premiosGanados.push(compra);
        }
      }
    });

    html += "</div>";

    if (!tieneAprobados) {
      const estadoMostrar = esNumeroOrden ? (ordenEspecifica.estado || "En revisión") : (data[0].estado || "En revisión");
      resultado.innerHTML = `
        <div class="estado pendiente">
          <h3>⏳ Estado de la Orden: ${estadoMostrar}</h3>
          <p>La orden se encuentra en revisión o tiene un formato no reconocido.</p>
        </div>
      `;
    } else {
      // Inyectar sección de premios si existen
      if (premiosGanados.length > 0) {
        premiosGanados.forEach(compra => {
          html += `
            <div style="color:#00ff88; font-weight:bold; margin-top:15px; background: rgba(0,255,136,0.1); padding: 10px; border-radius: 5px; border: 1px solid #00ff88;">
              🎉 ¡GANASTE UN PREMIO INSTANTÁNEO!<br>
              Número ganador en la Orden #${compra.id}: ${compra.numeros}
            </div>
          `;
        });
      }

      resultado.innerHTML = html;
      
      // Manejo controlado de WhatsApp de premios (solo el primero para evitar bloqueos)
      if (premiosGanados.length > 0) {
        const primerPremio = premiosGanados[0];
        const mensaje = `🎉 FELICIDADES\n\nTu número de orden #${primerPremio.id} ha ganado un premio instantáneo.\n\nComunícate con nosotros para reclamarlo.`;
        
        let numLimpio = primerPremio.whatsapp.replace(/\D/g, ""); 
        if (numLimpio.startsWith("0")) {
          numLimpio = "593" + numLimpio.substring(1);
        } else if (!numLimpio.startsWith("593")) {
          numLimpio = "593" + numLimpio;
        }

        setTimeout(() => {
          window.open(`https://wa.me/${numLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank');
        }, 800);
      }
    }

  } catch (err) {
    console.error("Error en la consulta:", err);
    alert("Hubo un error de conexión al consultar tus boletos.");
  }
}

// =========================
// FILTRADO DINÁMICO
// =========================
window.filtrarBoletosEnPantalla = function() {
  const query = document.getElementById("filtrarBoletoInput").value.trim().toLowerCase();
  const spans = document.querySelectorAll(".data-boleto-item");
  
  spans.forEach(span => {
    if (span.textContent.toLowerCase().includes(query)) {
      span.style.display = "inline-block";
      span.style.opacity = "1";
    } else {
      span.style.display = "none";
    }
  });
}

// Hacer la función visible globalmente
window.consultarNumeros = consultarNumeros;
// =========================
// SLIDER DINÁMICO
// =========================
function cargarSlider(){

  const cont = document.getElementById("slider");
  if(!cont) return;

  cont.innerHTML = "";

  const total = 8;

  for(let i = 1; i <= total; i++){

    const img = document.createElement("img");
    img.src = `images/sorteos/s${i}.jpeg`;
    img.classList.add("slide");

    if(i === 1){
      img.classList.add("active");
    }

    cont.appendChild(img);
  }

  iniciarSlider();
}

function iniciarSlider(){

  const slides = document.querySelectorAll("#slider .slide");

  let index = 0;

  setInterval(() => {

    slides[index].classList.remove("active");

    index++;

    if(index >= slides.length){
      index = 0;
    }

    slides[index].classList.add("active");

  }, 5000);

}

// =========================
// TEXTOS DINAMICOS
// =========================
async function cargarTopBar(){

const res = await fetch("/api/config");

if(!res.ok) return;

const data = await res.json();

const config = data.find(c => c.clave === "top_bar_text");

if(!config) return;

let frases = JSON.parse(config.valor);

let i = 0;

const el = document.getElementById("topBarText");

if(!el) return;

el.textContent = frases[0];

setInterval(()=>{

i++;

if(i >= frases.length){
i = 0;
}

el.textContent = frases[i];

},1000);

}

cargarTopBar();


// =========================
// CARGAR NUMEROS PREMIOS
// =========================
async function cargarNumerosPremio(){

  try{

    const res = await fetch("/api/premios");

    if(!res.ok){
      console.error("Error cargando premios");
      return;
    }

    const data = await res.json();

    const contenedor = document.getElementById("numerosPremio");

    if(!contenedor) return;

    contenedor.innerHTML = "";

    data.forEach(n => {

      const div = document.createElement("div");
      div.classList.add("numeroBox");

      const span = document.createElement("span");
      span.textContent = n.numero;

      // 🔥 SIEMPRE mostrar
      span.classList.add("normal");

      // 🟢 PREMIO DISPONIBLE
      if(n.premio && !n.usado){
        span.classList.add("activo");
      }

      // 🔴 PREMIO ENTREGADO
      if(n.usado){

        span.classList.add("entregado");

        const texto = document.createElement("div");
        texto.textContent = "Premio entregado";
        texto.classList.add("estadoPremio");

        div.appendChild(span);
        div.appendChild(texto);

      } else {

        div.appendChild(span);

      }

      contenedor.appendChild(div);

    });

  }catch(err){
    console.error("Error leyendo premios",err);
  }

}


// =========================
// FUNCIÓN COMPRAR
// =========================
function comprar(cantidad){

  const formulario = document.getElementById("formulario");
  const cantidadInput = document.getElementById("cantidad");
  const totalPagar = document.getElementById("totalPagar");

  if(!cantidadInput) return;

  cantidadInput.value = cantidad;

  const total = cantidad * PRECIO_BOLETO;

  totalPagar.textContent = "$" + total.toFixed(2);

  formulario.classList.remove("oculto");

  formulario.scrollIntoView({
    behavior:"smooth"
  });

}


// =========================
// FUNCIÓN COMPRAR PERSONALIZADO
// =========================
function comprarPersonalizado(){

  const cantidad = Number(
    document.getElementById("cantidadPersonalizada").value
  );

  if(!cantidad || cantidad < 50){
    alert("Ingresa una cantidad válida");
    return;
  }

  comprar(cantidad);

}
});

