# FixHub — Plataforma de soporte técnico para computadoras

FixHub es una aplicación web **full stack** y bilingüe (inglés/español) para un emprendimiento de reparación de computadoras.
Ayuda a los visitantes a diagnosticar problemas comunes, ofrece un **catálogo de servicios** con precios, un **formulario de contacto real**,
un **panel de administrador con login** y **FixBot**, un asistente con **IA personalizada** que conoce el catálogo y habla con el tono de la marca.

- **Frontend:** HTML, CSS y JavaScript (módulos ES), publicado en **GitHub Pages**.
- **Backend + datos:** **Supabase** (PostgreSQL, API REST, autenticación, Row Level Security y Edge Functions).
- **IA:** **Ollama** (modelo local `llama3.2` para desarrollo; Ollama Cloud a través de una Edge Function en producción).

---

## Requisitos del proyecto final y dónde se cumplen

| Entregable | Dónde está |
|---|---|
| 01 App publicada | GitHub Pages (ver [Publicar](#5-publicar-en-github-pages)) |
| 02 Repositorio GitHub con historial (mín. 15 commits) | Este repositorio |
| 03 Marca + home | `html/index.html`, logos en `resources/LOGOS/` |
| 04 Catálogo | `html/services.html` + tabla `services` en Supabase |
| 05 Contacto real | `html/contact.html` → tabla `contact_messages` |
| 06 Admin con login | `html/admin.html` (Supabase Auth + RLS) |
| 07 IA personalizada | Chat FixBot en todas las páginas + generador de descripciones en el admin |

| Criterio de calidad | Implementación |
|---|---|
| Separación frontend/backend | El frontend solo llama a APIs (`js/core/supabase.js`); la seguridad vive en la base de datos (`supabase/schema.sql`) |
| Carpetas claras / componentes reutilizables | `js/components/` (header, footer, tarjeta de servicio, chat), `js/core/`, `js/pages/` |
| Responsive real | Menú hamburguesa, grids que pasan a 1 columna, tabla del admin convertida en tarjetas en el celular |
| Animaciones básicas | Aparición al hacer scroll, hero animado, burbujas del chat, toasts (respeta `prefers-reduced-motion`) |
| Errores claros y validaciones | Errores por campo, mensajes traducidos y la misma validación repetida en la base de datos (`CHECK`) |
| Estados de carga | Skeletons en el catálogo, spinners en los botones, indicador "FixBot está escribiendo" |
| IA: conoce productos, usa el tono de la marca, responde como el negocio, genera textos listos | Prompt en `js/ai/assistant.js` con el catálogo real; botón "Redacta mi solicitud" que rellena el formulario; generador de descripciones en el admin |

---

## Estructura de carpetas

```
FixHub/
├── index.html                  # Entrada de GitHub Pages (redirige a html/index.html)
├── html/                       # Páginas
│   ├── index.html              # Home (marca, servicios destacados, banner de IA)
│   ├── diagnose.html  guide.html  maintenance.html   # Contenido de ayuda
│   ├── services.html           # Catálogo (desde Supabase)
│   ├── contact.html            # Formulario de contacto real
│   └── admin.html              # Login + panel de administración
├── css/myStyles.css            # Estilos (variables, componentes, responsive, animaciones)
├── js/
│   ├── config.js               # ⚙️ Claves de Supabase y proveedor de IA
│   ├── main.js                 # Se carga en todas las páginas
│   ├── core/                   # supabase.js (API), i18n.js (idiomas), ui.js (estados, formato)
│   ├── components/             # layout.js, chat-widget.js, service-card.js
│   ├── ai/assistant.js         # Prompts y conexión con Ollama
│   └── pages/                  # Lógica de cada página: home, services, contact, admin
├── data/translations.json      # Textos en inglés y español
├── supabase/
│   ├── schema.sql              # Tablas, seguridad (RLS) y datos iniciales
│   └── functions/ai-chat/      # Edge Function que conecta con Ollama Cloud
└── resources/                  # Logos e imágenes
```

---

## Puesta en marcha

### 1. Crear la base de datos en Supabase
1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor → New query**, pega todo `supabase/schema.sql` y pulsa **Run**. Esto crea las tablas, la seguridad y 8 servicios de ejemplo.
3. Ve a **Authentication → Users → Add user**, crea tu usuario administrador (correo y contraseña, con *Auto Confirm*).
4. En el SQL Editor, ejecuta esta consulta con tu correo para darle permisos de administrador:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'tu-correo@ejemplo.com';
   ```
5. En **Authentication → Sign In / Providers**, desactiva **Allow new users to sign up**: las cuentas de administrador se crean solo desde el panel de Supabase.

### 2. Conectar la web
En **Project Settings → API** copia la **Project URL** y la clave **anon/publishable**, y pégalas en `js/config.js`.
Esa clave es pública por diseño: lo que protege los datos son las políticas RLS de `schema.sql`.

### 3. IA en tu computadora (desarrollo y demo)
```bash
ollama pull llama3.2
```
Sirve la carpeta con cualquier servidor local (por ejemplo, la extensión *Live Server* de VS Code) y abre `http://localhost:…/html/index.html`.
Con `provider: "auto"`, en `localhost` la web usa tu Ollama local.

### 4. IA para todos los visitantes (sitio publicado)
GitHub Pages no puede guardar claves secretas, así que la web llama a la Edge Function `ai-chat` y la función llama a **Ollama Cloud**:
1. Crea una cuenta en [ollama.com](https://ollama.com) y genera una API key en **Settings → Keys**.
2. En Supabase, ve a **Edge Functions → Secrets** y agrega `OLLAMA_API_KEY` (opcionalmente `OLLAMA_MODEL`, que por defecto es `gpt-oss:20b`, y `ALLOWED_ORIGIN` con la URL de tu sitio).
3. Despliega la función: crea en el panel una función llamada `ai-chat` con el contenido de `supabase/functions/ai-chat/index.ts`, o usa la CLI:
   ```bash
   npx supabase login
   npx supabase link --project-ref TU_PROJECT_REF
   npx supabase functions deploy ai-chat --no-verify-jwt
   ```
   Si la creas desde el panel, desactiva **Verify JWT**.

> Alternativa sin Ollama Cloud: pon `provider: "local"` en `js/config.js` y permite tu sitio en Ollama
> (`launchctl setenv OLLAMA_ORIGINS "https://TU-USUARIO.github.io"` y reinicia Ollama). Solo funcionará en la computadora donde corre Ollama.

### 5. Publicar en GitHub Pages
1. Sube el repositorio a GitHub.
2. Ve a **Settings → Pages → Build and deployment**, elige **Deploy from a branch**, la rama `main` y la carpeta `/ (root)`.
3. Tu sitio quedará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

---

## Seguridad (resumen para la defensa)
- **Row Level Security:** los visitantes solo pueden **leer servicios activos** y **crear mensajes**; nunca pueden leer los mensajes.
  Solo los usuarios de la tabla `admins` pueden crear, editar o borrar.
- **Validación doble:** en el navegador (para dar buena experiencia) y con `CHECK` en la base de datos (para que no se pueda saltar).
- **Sin XSS:** todo lo que viene de la base de datos o de la IA pasa por `escapeHtml()` antes de mostrarse.
- **Antispam:** el formulario incluye un campo trampa (*honeypot*) invisible.
- **Clave de IA secreta:** la clave de Ollama Cloud solo existe en los secretos de Supabase, nunca en el navegador.
