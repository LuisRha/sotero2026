// ⚠️ DATOS DE SUPABASE
const SUPABASE_URL = "https://caovuekqrczqysxgnucc.supabase.co";
const SUPABASE_KEY = "sb_publishable_843ipMaoEhnMrvuF95Iq6Q_9It7qiFX";

// 👉 CREAR CLIENTE
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// =========================
// ELEMENTOS
// =========================
const tablaBody = document.querySelector("#tabla tbody");
const totalComprasEl = document.getElementById("totalCompras");
const selectSorteo = document.getElementById("selectSorteo");
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
// CARGAR SORTEOS
// =========================
async function cargarSorteos() {
  const { data, error } = await supabaseClient
    .from("sorteos")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error("Error cargando sorteos:", error);
    return;
  }

  sorteosCache = data || [];
  selectSorteo.innerHTML = "";
  sorteoActivoId = null;

  // 👉 OPCIÓN TODOS
  const optTodos = document.createElement("option");
  optTodos.value = "";
  optTodos.textContent = "📋 Todos los sorteos";
  selectSorteo.appendChild(optTodos);

  if (sorteosCache.length === 0) {
    sorteoActivoTitulo.textContent = "⚠️ No hay sorteos";
    return;
  }

  sorteosCache.forEach(sorteo => {
    const option = document.createElement("option");
    option.value = sorteo.id;
    option.textContent = sorteo.nombre;

    if (sorteo.estado === "activo" && sorteoActivoId === null) {
      option.selected = true;
      sorteoActivoId = sorteo.id;
      sorteoActivoTitulo.textContent = `🔴 Sorteo activo: ${sorteo.nombre}`;
    }

    selectSorteo.appendChild(option);
  });

  // fallback seguro
  if (!sorteoActivoId) {
    sorteoActivoId = sorteosCache[0].id;
    selectSorteo.value = sorteoActivoId;
    sorteoActivoTitulo.textContent = `🔴 Sorteo activo: ${sorteosCache[0].nombre}`;
  }
}

// =========================
// CARGAR COMPRAS
// =========================
async function cargarDatos() {
  tablaBody.innerHTML = "";
  totalComprasEl.textContent = "0";

  let query = supabaseClient
    .from("compras")
    .select("*")
    .order("created_at", { ascending: false });

  if (sorteoActivoId) {
    query = query.eq("sorteo_id", sorteoActivoId);
  }

  const { data, error } = await query;

  if (error) {
    tablaBody.innerHTML =
      "<tr><td colspan='8'>❌ Error al cargar datos</td></tr>";
    return;
  }

  if (!data || data.length === 0) {
    tablaBody.innerHTML =
      "<tr><td colspan='8'>No hay compras registradas</td></tr>";
    return;
  }

  totalComprasEl.textContent = data.length;

  data.forEach(item => {
    const tr = document.createElement("tr");

    const numeros = item.numeros ? encodeURIComponent(item.numeros) : "";
    const voucher = item.voucher ? encodeURIComponent(item.voucher) : "";

    tr.innerHTML = `
      <td>${new Date(item.created_at).toLocaleString()}</td>
      <td>${item.nombre || "-"}</td>
      <td>${item.whatsapp || "-"}</td>
      <td>${item.cantidad ?? 0}</td>
      <td>${item.numeros ? `<button onclick="verNumeros('${numeros}')">Ver</button>` : "-"}</td>
      <td>${item.voucher ? `<button onclick="verVoucher('${voucher}')">Ver</button>` : "-"}</td>
      <td>${item.estado || "pendiente"}</td>
      <td>
        ${
          item.estado === "pendiente"
            ? `
              <button onclick="aprobar(${item.id})" style="background:#28a745;color:#fff">Aprobar</button>
              <button onclick="rechazar(${item.id})" style="background:#dc3545;color:#fff">Rechazar</button>
            `
            : item.estado === "aprobado"
              ? "<span style='color:green;font-weight:bold'>✔ Aprobado</span>"
              : "<span style='color:red;font-weight:bold'>✖ Rechazado</span>"
        }
      </td>
    `;
    tablaBody.appendChild(tr);
  });
}

// =========================
// EVENTO CAMBIO DE SORTEO
// =========================
selectSorteo.addEventListener("change", () => {
  const id = selectSorteo.value;

  if (!id) {
    sorteoActivoId = null;
    sorteoActivoTitulo.textContent = "📋 Mostrando todos los sorteos";
  } else {
    sorteoActivoId = Number(id);
    const s = sorteosCache.find(x => x.id == id);
    if (s) sorteoActivoTitulo.textContent = `🔴 Sorteo activo: ${s.nombre}`;
  }

  cargarDatos();
});

// =========================
// MODAL NUEVO SORTEO
// =========================
btnNuevoSorteo.addEventListener("click", () => {
  modalNuevoSorteo.classList.remove("oculto");
});

btnCancelarSorteo.addEventListener("click", () => {
  modalNuevoSorteo.classList.add("oculto");
});

btnGuardarSorteo.addEventListener("click", async () => {
  const nombre = nuevoNombreSorteo.value.trim();
  const activo = nuevoSorteoActivo.checked;

  if (!nombre) return alert("Ingresa el nombre del sorteo");

  if (activo) {
    await supabaseClient
      .from("sorteos")
      .update({ estado: "inactivo" })
      .neq("estado", "inactivo");
  }

  await supabaseClient.from("sorteos").insert([
    { nombre, estado: activo ? "activo" : "inactivo" }
  ]);

  nuevoNombreSorteo.value = "";
  nuevoSorteoActivo.checked = false;
  modalNuevoSorteo.classList.add("oculto");

  await cargarSorteos();
  await cargarDatos();
});

// =========================
// UTILIDADES
// =========================
function verNumeros(n) {
  alert("🎟️ Números comprados:\n\n" + decodeURIComponent(n));
}

function verVoucher(v) {
  alert("📄 Voucher:\n\n" + decodeURIComponent(v));
}

async function aprobar(id) {
  await supabaseClient.from("compras").update({ estado: "aprobado" }).eq("id", id);
  cargarDatos();
}

async function rechazar(id) {
  if (!confirm("¿Rechazar esta compra y liberar boletos?")) return;
  await supabaseClient.from("compras").update({ estado: "rechazado" }).eq("id", id);
  cargarDatos();
}

// =========================
// INICIO
// =========================
document.addEventListener("DOMContentLoaded", async () => {
  await cargarSorteos();
  await cargarDatos();
});
