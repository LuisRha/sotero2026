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

  }

  // =========================
  // OBTENER BOLETOS VENDIDOS
  // =========================
  async function obtenerVendidos(){

    if(!SORTEO_ID) return 0;

    // Ajustado: Si no tienes columna 'estado' aún, quitamos el filtro para que cuente todo
    const res = await fetch(`/api/compras?sorteo_id=${SORTEO_ID}`);

    if(!res.ok) return 0;

    const json = await res.json();

    // Sumamos la columna 'cantidad' que se ve en tu captura
    return json.reduce(
      (sum, fila) => sum + Number(fila.cantidad || 0),
      0
    );

  }

  // =========================
  // ACTUALIZAR BARRA (CONEXIÓN REAL)
  // =========================
  async function actualizarDisponibles(){

    try{

      const vendidos = await obtenerVendidos();

      const disponibles = TOTAL_BOLETOS - vendidos;

      if(disponiblesEl){
        disponiblesEl.textContent =
        `Boletos disponibles: ${disponibles}`;
      }

      // Cálculo basado en tus 61 registros actuales
      const porcentaje =
      TOTAL_BOLETOS > 0
      ? Math.round((vendidos / TOTAL_BOLETOS) * 100)
      : 0;

      const barra = document.getElementById("barraFill");
      const texto = document.getElementById("porcentajeTexto");

      if(barra) {
        barra.style.width = porcentaje + "%";
        barra.style.transition = "width 1s ease-in-out";
      }

      if(texto) {
        texto.textContent = `Números vendidos: ${porcentaje}%`;
      }

    }
    catch(err){
      console.error("Error al actualizar barra:", err);
    }

  }

  // =========================
  // MOSTRAR FORMULARIO
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
        const voucher = voucherInput.value.trim();
        const modo = modoSelect ? modoSelect.value : "aleatorio";

        if(!nombre || !whatsapp || !cantidad || !voucher){
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

        // Lógica de asignación de números según tu tabla
        if(modo === "orden"){

          for(let i=1; i<=cantidad; i++){
            numeros.push(vendidos + i);
          }

        } else {

          const usados = new Set();
          while(numeros.length < cantidad){
            const n = Math.floor(Math.random() * TOTAL_BOLETOS) + 1;
            if(!usados.has(n)){
              usados.add(n);
              numeros.push(n);
            }
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

        if(!res.ok) throw new Error("Error al registrar compra");

        const mensaje = `NUEVA COMPRA\n\nNOMBRE: ${nombre}\nWHATSAPP: ${whatsapp}\nBOLETOS: ${cantidad}\nTOTAL: $${cantidad * PRECIO_BOLETO}\nNUMEROS: ${numeros.join(", ")}\nVOUCHER: ${voucher}`;

        window.open(`https://wa.me/593987354472?text=${encodeURIComponent(mensaje)}`, "_blank");

        // Reset
        nombreInput.value = "";
        whatsappInput.value = "";
        cantidadInput.value = "";
        voucherInput.value = "";
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
  // AUTO SCROLL GALERÍA
  // =========================
  const galeria = document.getElementById("galeriaSorteo");

  if(galeria){

    let scrollPos = 0;

    setInterval(()=>{

      scrollPos += 1;

      galeria.scrollLeft = scrollPos;

      if(scrollPos >=
         galeria.scrollWidth -
         galeria.clientWidth){

        scrollPos = 0;

      }

    }, 30);

  }

});