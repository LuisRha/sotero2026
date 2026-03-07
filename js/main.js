// =========================
// VARIABLES GLOBALES
// =========================
let TOTAL_BOLETOS = 0;
let PRECIO_BOLETO = 0;
let SORTEO_ID = null;


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
  const voucherInput = document.getElementById("voucher");

  // NUEVOS CAMPOS
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

    btnEnviar.addEventListener("click", async ()=>{

      try{

        const nombres = nombreInput?.value.trim();
        const apellidos = apellidosInput?.value.trim();
        const telefono = whatsappInput?.value.trim();
        const cantidad = Number(cantidadInput?.value);
        const voucher = voucherInput ? voucherInput.value.trim() : "";

        const email = emailInput?.value.trim();
        const direccion = direccionInput?.value.trim();
        const provincia = provinciaInput?.value;
        const ciudad = ciudadInput?.value.trim();
        const numero_documento = documentoInput?.value.trim();
        const tipo_documento = tipoDocumentoInput?.value;

        if(!aceptarTerminos.checked){
          alert("Debes aceptar los términos");
          return;
        }

        if(!nombres || !apellidos || !telefono || !cantidad || !email){
          alert("Completa todos los campos obligatorios");
          return;
        }

        const vendidos = await obtenerVendidos();
        const disponibles = TOTAL_BOLETOS - vendidos;

        if(cantidad > disponibles){
          alert(`Solo quedan ${disponibles} boletos`);
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
            voucher,

            total: cantidad * PRECIO_BOLETO

          })

        });

        const data = await res.json();

        if(!res.ok){
          throw new Error(data.error || "Error al registrar compra");
        }

        alert(
`Compra registrada correctamente

Tus números:
${data.numeros}

Extras:
${data.extras}`
        );

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

        if(voucherInput) voucherInput.value="";

        totalPagarEl.textContent="$0";

        formulario.classList.add("oculto");

        actualizarDisponibles();

      }
      catch(err){
        alert(err.message);
      }

    });

  }


  (async ()=>{
    try{
      await obtenerSorteoActivo();
      await actualizarDisponibles();
    }
    catch(err){
      console.error(err);
    }
  })();

});


// =========================
// CONSULTAR BOLETOS
// =========================
async function consultarNumeros(){

  const telefono = document.getElementById("consultaWhatsapp").value.trim();

  if(!telefono){
    alert("Ingresa tu WhatsApp");
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
    resultado.innerHTML = "No se encontraron compras.";
    return;
  }

  let html = "<h3>Tus números:</h3>";

  data.forEach(compra => {

    html += `
    <div style="margin-bottom:10px;">
    🎟 ${compra.numeros}
    </div>
    `;

    if(compra.premio){

      html += `
      <div style="color:#00ff88;font-weight:bold;">
      🎉 ¡GANASTE UN PREMIO!
      Número ganador: ${compra.numeros}
      </div>
      `;

      const mensaje = `
🎉 FELICIDADES

Tu número ${compra.numeros} ha ganado
un premio instantáneo.

Comunícate con nosotros para reclamarlo.
`;

      const telefonoFinal = "593" + telefono.replace(/^0/, "");

      window.open(
      `https://wa.me/${telefonoFinal}?text=${encodeURIComponent(mensaje)}`
      );

    }

  });

  resultado.innerHTML = html;

}


// slider iamgen 
document.addEventListener("DOMContentLoaded", function(){

let slides = document.querySelectorAll(".slide");
let index = 0;

function cambiarImagen(){

slides[index].classList.remove("active");

index++;

if(index >= slides.length){
index = 0;
}

slides[index].classList.add("active");

}

setInterval(cambiarImagen,3000);

});


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

  if(!window.supabaseClient){
    console.warn("Supabase no está cargado");
    return;
  }

  const { data, error } = await window.supabaseClient
  .from("tickets")
  .select("numero,premio")
  .order("numero",{ascending:true});

  if(error){
    console.error("Error cargando premios",error);
    return;
  }

  const contenedor = document.getElementById("numerosPremio");

  if(!contenedor) return;

  contenedor.innerHTML = "";

  data.forEach(n => {

    const span = document.createElement("span");

    span.textContent = n.numero;

    if(n.premio){
      span.classList.add("activo");
    }else{
      span.classList.add("entregado");
    }

    contenedor.appendChild(span);

  });

}

cargarNumerosPremio();