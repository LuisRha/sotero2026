// ⚠️ DATOS DE SUPABASE
const SUPABASE_URL = "https://caovuekqrczqysxgnucc.supabase.co";
const SUPABASE_KEY = "sb_publishable_843ipMaoEhnMrvuF95Iq6Q_9It7qiFX";

// 👉 CREAR CLIENTE UNA SOLA VEZ
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ELEMENTOS
const tablaBody = document.querySelector("#tabla tbody");
const totalComprasEl = document.getElementById("totalCompras");
const selectSorteo = document.getElementById("selectSorteo");

let sorteoActivoId = null;

// =========================
// CARGAR SORTEOS
// =========================
async function cargarSorteos() {
  const { data, error } = await supabaseClient
    .from("sorteos")
    .select("*")
    .order("id", { ascending: false }); // ✅ más seguro

  if (error) {
    console.error("Error cargando sorteos:", error);
    return;
  }

  selectSorteo.innerHTML = "";

  if (!data || data.length === 0) {
    const opt = document.createElement("option");
    opt.textContent = "No hay sorteos";
    selectSorteo.appendChild(opt);
    return;
  }

  data.forEach(sorteo => {
    const option = document.createElement("option");
    option.value = sorteo.id;
    option.textContent = sorteo.nombre;

    if (sorteo.estado === "activo") {
      option.selected = true;
      sorteoActivoId = sorteo.id;
    }

    selectSorteo.appendChild(option);
  });
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

  // 🔥 SOLO filtra si ya existe sorteoActivoId
  if (sorteoActivoId) {
    query = query.eq("sorteo_id", sorteoActivoId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error cargando compras:", error);
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
      <td>${item.created_at ? new Date(item.created_at).toLocaleString() : "-"}</td>
      <td>${item.nombre || "-"}</td>
      <td>${item.whatsapp || "-"}</td>
      <td>${item.cantidad ?? 0}</td>

      <td class="numeros">
        ${item.numeros ? `<button onclick="verNumeros('${numeros}')">Ver</button>` : "-"}
      </td>

      <td>
        ${item.voucher ? `<button onclick="verVoucher('${voucher}')">Ver</button>` : "-"}
      </td>

      <td>${item.estado || "pendiente"}</td>

      <td>
        ${
          item.estado === "aprobado"
            ? "<span style='color:green;font-weight:bold'>✔ Aprobado</span>"
            : `<button onclick="aprobar(${item.id})">Aprobar</button>`
        }
      </td>
    `;

    tablaBody.appendChild(tr);
  });
}

// =========================
// MODALES
// =========================
function verNumeros(numeros) {
  alert("🎟️ Números comprados:\n\n" + decodeURIComponent(numeros));
}

function verVoucher(voucher) {
  alert("📄 Voucher:\n\n" + decodeURIComponent(voucher));
}

// =========================
// APROBAR COMPRA
// =========================
async function aprobar(id) {
  const { error } = await supabaseClient
    .from("compras")
    .update({ estado: "aprobado" })
    .eq("id", Number(id));

  if (error) {
    alert("❌ No se pudo aprobar:\n" + error.message);
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
