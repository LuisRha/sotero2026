import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);


// =========================
// MOTOR GENERADOR DE TICKETS
// =========================
function generarTickets(cantidad, numerosYaVendidos = [], totalNumeros = 99999) {

  const vendidos = new Set(numerosYaVendidos);

  const principales = [];
  const extras = [];

  function generarNumero() {

    let num;

    do {

      num = Math.floor(Math.random() * totalNumeros) + 1;
      num = num.toString().padStart(5, "0");

    } while (vendidos.has(num));

    vendidos.add(num);

    return num;
  }

  for (let i = 0; i < cantidad; i++) {
    principales.push(generarNumero());
  }

  for (let i = 0; i < 4; i++) {
    extras.push(generarNumero());
  }

  return {
    principales,
    extras
  };
}



export default async function handler(req, res) {

  try {

    let body = req.body;

    if (typeof body === "string") {
      body = JSON.parse(body);
    }


    // =========================
    // GET → LISTAR COMPRAS
    // =========================
    if (req.method === "GET") {

      const { sorteo_id, estados, whatsapp } = req.query;

      let query = supabase
        .from("compras")
        .select("*")
        .order("created_at", { ascending: false });

      if (sorteo_id) {
        query = query.eq("sorteo_id", sorteo_id);
      }

      if (estados) {
        query = query.in("estado", estados.split(","));
      }

      if (whatsapp) {
        query = query.eq("whatsapp", whatsapp);
      }

      const { data, error } = await query;

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data);
    }



    // =========================
    // POST → CREAR COMPRA
    // =========================
    if (req.method === "POST") {

      const {

        sorteo_id,
        tipo_documento,
        numero_documento,

        nombres,
        apellidos,

        email,
        telefono,
        whatsapp,

        direccion,
        pais,
        provincia,
        ciudad,

        cantidad,
        voucher,
        total

      } = body;



      if (
        !sorteo_id ||
        !nombres ||
        !apellidos ||
        !telefono ||
        !cantidad ||
        !voucher
      ) {
        return res.status(400).json({ error: "Datos incompletos" });
      }



      // =========================
      // OBTENER CONFIG SORTEO
      // =========================
      const { data: sorteo, error: sorteoError } = await supabase
        .from("sorteos")
        .select("total_numeros")
        .eq("id", sorteo_id)
        .single();

      if (sorteoError || !sorteo) {
        return res.status(400).json({ error: "Sorteo no encontrado" });
      }

      const totalNumeros = sorteo.total_numeros || 99999;



      // =========================
      // OBTENER NUMEROS OCUPADOS
      // =========================
      const { data: vendidosData } = await supabase
        .from("compras")
        .select("numeros, extras")
        .eq("sorteo_id", sorteo_id)
        .in("estado", ["pendiente", "aprobado"]);



      let numerosOcupados = [];

      if (vendidosData) {

        vendidosData.forEach(c => {

          if (c.numeros) {
            numerosOcupados.push(...c.numeros.replace(/\s/g,'').split(","));
          }

          if (c.extras) {
            numerosOcupados.push(...c.extras.replace(/\s/g,'').split(","));
          }

        });

      }



      const ocupados = numerosOcupados.length;

      if (ocupados >= totalNumeros) {

        return res.status(400).json({
          error: "El sorteo ya se encuentra lleno"
        });

      }



      const extrasPorCompra = 4;
      const boletosNecesarios = Number(cantidad) + extrasPorCompra;

      if (ocupados + boletosNecesarios > totalNumeros) {

        return res.status(400).json({
          error: "No hay suficientes boletos disponibles"
        });

      }



      // =========================
      // GENERAR TICKETS
      // =========================
      const tickets = generarTickets(
        Number(cantidad),
        numerosOcupados,
        totalNumeros
      );



      const numeros = tickets.principales.join(",");
      const extras = tickets.extras.join(",");



      // =========================
      // INSERTAR COMPRA
      // =========================
      const { error } = await supabase
        .from("compras")
        .insert([
          {

            sorteo_id,

            nombres,
            apellidos,

            tipo_documento,
            numero_documento,

            email,
            telefono,
            whatsapp,

            direccion,
            pais,
            provincia,
            ciudad,

            cantidad: Number(cantidad),

            numeros,
            extras,

            voucher,
            total: Number(total),

            estado: "pendiente"

          }
        ]);



      if (error) {

        console.error("Error insert:", error);

        return res.status(500).json({ error: error.message });

      }



      return res.status(200).json({

        ok: true,
        numeros,
        extras

      });

    }



    // =========================
    // PUT → APROBAR / RECHAZAR
    // =========================
    if (req.method === "PUT") {

      const { id, estado } = body;

      if (!id || !estado) {
        return res.status(400).json({ error: "ID o estado faltante" });
      }

      const { error } = await supabase
        .from("compras")
        .update({ estado })
        .eq("id", id);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ ok: true });

    }



    return res.status(405).json({ error: "Método no permitido" });



  } catch (err) {

    console.error("Error general:", err);

    return res.status(500).json({ error: err.message });

  }

}