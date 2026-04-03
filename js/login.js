const SUPABASE_URL = "https://caovuekqrczqysxgnucc.supabase.co";
const SUPABASE_KEY = "sb_publishable_843ipMaoEhnMrvuF95Iq6Q_9It7qiFX";

// Crear cliente Supabase
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// Esperar que cargue el DOM
document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("loginForm");
  const msg = document.getElementById("msg");

  if (!form) {
    console.error("No se encontró el formulario loginForm");
    return;
  }

  // Evento submit (ENTER o botón)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    console.log("Intentando login...");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      msg.innerText = "Ingrese correo y contraseña";
      return;
    }

    msg.innerText = "Verificando...";

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error("Error login:", error);
      msg.innerText = error.message;
      return;
    }

    console.log("Login correcto", data);

    msg.innerText = "Login correcto";

    // Redirigir al panel admin
    setTimeout(() => {
      window.location.href = "admin.html";
    }, 800);
  });

});