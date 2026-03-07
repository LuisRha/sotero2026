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

    const precioUnidad = document.getElementById("precioUnidad");

    if(precioUnidad){
      precioUnidad.textContent = PRECIO_BOLETO.toFixed(2);
    }

    const titulo = document.getElementById("titulo");
    const premio = document.getElementById("premio");
    const imagen = document.getElementById("imagen");

    if(titulo) titulo.textContent = activo.nombre;
    if(premio) premio.textContent = activo.premio;
    if(imagen && activo.imagen) imagen.src = activo.imagen;

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
  // CALCULAR TOTAL
  // =========================
  if(cantidadInput && totalPagarEl){

    const calcularTotal = () => {

      const cantidad = Number(cantidadInput.value);

      if(cantidad > 0){
        totalPagarEl.textContent =
          "$" + (cantidad * PRECIO_BOLETO).toFixed(2);
      }else{
        totalPagarEl.textContent = "$0";
      }

    };

    cantidadInput.addEventListener("input", calcularTotal);

    calcularTotal();

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

        if(!aceptarTerminos.checked){
          alert("Debes aceptar los términos");
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
            voucher,
            total: cantidad * PRECIO_BOLETO

          })

        });

        if(!res.ok)
          throw new Error("Error al registrar compra");

        alert("Compra registrada correctamente");

        nombreInput.value="";
        whatsappInput.value="";
        cantidadInput.value="";
        voucherInput.value="";
        totalPagarEl.textContent="$0";

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

});


// =========================
// COMPRAR DESDE PAQUETES
// =========================
function comprar(cantidad){

  const cantidadInput = document.getElementById("cantidad");
  const totalPagarEl = document.getElementById("totalPagar");
  const formulario = document.getElementById("formulario");

  if(!cantidadInput || !totalPagarEl) return;

  cantidadInput.value = cantidad;

  const precio = Number(cantidad) * Number(PRECIO_BOLETO);

  totalPagarEl.textContent = "$" + precio.toFixed(2);

  formulario.classList.remove("oculto");

  formulario.scrollIntoView({
    behavior:"smooth"
  });

}


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

  });

  resultado.innerHTML = html;

}


// =========================
// COMPRAR PERSONALIZADO
// =========================
function comprarPersonalizado(){

  const input = document.getElementById("cantidadPersonalizada");

  if(!input) return;

  const cantidad = Number(input.value);

  if(!cantidad || cantidad <= 0){
    alert("Ingresa una cantidad válida");
    return;
  }

  comprar(cantidad);

}