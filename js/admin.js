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
// CARGAR SORTEOS (API)
// =========================
async function cargarSorteos() {
  const res = await fetch("/api/sorteos");
  const data = await res.json();

  sorteosCache = data || [];
  selectSorteo.innerHTML = "";
  sorteoActivoId = null;

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

  if (!sorteoActivoId) {
    sorteoActivoId = sorteosCache[0].id;
    selectSorteo.value = sorteoActivoId;
    sorteoActivoTitulo.textContent = `🔴 Sorteo activo: ${sorteosCache[0].nombre}`;
  }
}

// =========================
// CARGAR COMPRAS (API)
// =========================
async function cargarDatos() {
  tablaBody.innerHTML = "";
  totalComprasEl.textContent = "0";

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
  console.log("CLICK APROBAR:", id);

  const res = await fetch("/api/compras", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, estado: "aprobado" })
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("ERROR BACKEND:", txt);
    alert("❌ Error al aprobar");
    return;
  }

  cargarDatos();
}

async function rechazar(id) {
  console.log("CLICK RECHAZAR:", id);

  if (!confirm("¿Rechazar esta compra?")) return;

  const res = await fetch("/api/compras", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, estado: "rechazado" })
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("ERROR BACKEND:", txt);
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
