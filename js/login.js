const SUPABASE_URL = "https://caovuekqrczqysxgnucc.supabase.co";
const SUPABASE_KEY = "sb_publishable_843ipMaoEhnMrvuF95Iq6Q_9It7qiFX";

// Crear cliente Supabase
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// Esperar que cargue el DOM
document.addEventListener("DOMContentLoaded", () => {

  const btn = document.getElementById("btnLogin");

  if(!btn){
    console.error("No se encontró el botón btnLogin");
    return;
  }

  btn.addEventListener("click", login);

});

async function login(){

  console.log("Intentando login...");

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if(!email || !password){
    document.getElementById("msg").innerText = "Ingrese correo y contraseña";
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if(error){
    console.error("Error login:", error);
    document.getElementById("msg").innerText = error.message;
    return;
  }

  console.log("Login correcto", data);

  // Redirigir al panel admin
  window.location.href = "admin.html";

}