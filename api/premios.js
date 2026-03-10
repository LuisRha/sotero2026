import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export default async function handler(req, res) {

  try {

    if (req.method === "GET") {

      const { data, error } = await supabase
        .from("tickets")
        .select("numero, ganador, telefono")
        .eq("premio", true)
        .eq("usado", true);

      if(error){
        return res.status(500).json({error:error.message});
      }

      return res.status(200).json(data);

    }

    return res.status(405).json({error:"Método no permitido"});

  } catch(err){

    return res.status(500).json({
      error:"Error interno",
      detalle:err.message
    });

  }

}