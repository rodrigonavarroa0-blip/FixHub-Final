# FixHub — Plataforma de soporte técnico para computadoras

FixHub es una aplicación web **full stack** y bilingüe (inglés/español) para un emprendimiento de reparación de computadoras.
Ayuda a los visitantes a diagnosticar problemas comunes, ofrece un **catálogo de servicios** con precios, un **formulario de contacto real**,
un **panel de administrador con login** y **FixBot**, un asistente con **IA personalizada** que conoce el catálogo y habla con el tono de la marca.

- **Frontend:** **React 19** (componentes, hooks y Context) con **Vite** y **React Router**, publicado en **GitHub Pages** con GitHub Actions.
- **Backend + datos:** **Supabase** (PostgreSQL, API REST, autenticación, Row Level Security y Edge Functions).
- **IA:** **Ollama** local (`llama3.2`) para desarrollo y **Groq** (plan gratis, modelo `openai/gpt-oss-20b`) a través de una Edge Function en producción.

---

## Requisitos del proyecto final y dónde se cumplen

| Entregable | Dónde está |
|---|---|
| 01 App publicada | GitHub Pages (ver [Publicar](#5-publicar-en-github-pages)) |
| 02 Repositorio GitHub con historial (mín. 15 commits) | Este repositorio |
| 03 Marca + home | `src/pages/HomePage.jsx`, logos en `resources/LOGOS/` |
| 04 Catálogo | `src/pages/ServicesPage.jsx` + tabla `services` en Supabase |
| 05 Contacto real | `src/pages/ContactPage.jsx` → tabla `contact_messages` |
| 06 Admin con login | `src/pages/admin/` (Supabase Auth + RLS) |
| 07 IA personalizada | Chat FixBot en todas las páginas + generador de descripciones en el admin |

| Criterio de calidad | Implementación |
|---|---|
| Separación frontend/backend | Los componentes de React solo llaman a la capa de servicios (`src/services/supabase.js`); la seguridad vive en la base de datos (`supabase/schema.sql`) |
| Carpetas claras / componentes reutilizables | `src/components/` (Header, Footer, ServiceCard, ChatWidget, FormField, LoadingButton…), `src/pages/`, `src/context/`, `src/hooks/` |
| Responsive real | Menú hamburguesa, grids que pasan a 1 columna, tabla del admin convertida en tarjetas en el celular |
| Animaciones básicas | Aparición al hacer scroll (componente `Reveal`), hero animado, burbujas del chat, toasts (respeta `prefers-reduced-motion`) |
| Errores claros y validaciones | Errores por campo, mensajes traducidos y la misma validación repetida en la base de datos (`CHECK`) |
| Estados de carga | Skeletons en el catálogo, spinners en los botones, indicador "FixBot está escribiendo" |
| IA: conoce productos, usa el tono de la marca, responde como el negocio, genera textos listos | Prompt en `src/ai/assistant.js` con el catálogo real; botón "Redacta mi solicitud" que rellena el formulario; generador de descripciones en el admin |

---

## Estructura de carpetas

```
FixHub/
├── index.html                  # Único HTML: React dibuja todo dentro de <div id="root">
├── package.json                # Dependencias (react, react-dom, react-router-dom, vite)
├── vite.config.js              # Configuración de Vite (base "./" para GitHub Pages)
├── src/
│   ├── main.jsx                # Arranca React y envuelve la app con los Providers
│   ├── App.jsx                 # Rutas: /, /diagnose, /guides, /maintenance, /services, /contact, /admin
│   ├── config.js               # ⚙️ Claves de Supabase y proveedor de IA
│   ├── components/             # Componentes reutilizables: Layout, Header, Footer, ServiceCard,
│   │                           #   ChatWidget, PageHero, InfoCard, Reveal, FormField, LoadingButton,
│   │                           #   SkeletonCards, StateBox
│   ├── pages/                  # Una página por ruta (HomePage, ServicesPage, ContactPage…)
│   │   └── admin/              # AdminPage, LoginForm, Dashboard, ServiceForm, ServicesTable, MessagesList
│   ├── context/                # Estado global: ToastContext (avisos), ChatContext (FixBot)
│   ├── i18n/                   # LanguageContext (inglés/español) + translations.json
│   ├── hooks/                  # Hooks propios: useServices (carga el catálogo), usePageTitle
│   ├── services/supabase.js    # Capa de datos: todas las llamadas a Supabase con fetch()
│   ├── ai/assistant.js         # Prompts y conexión con la IA
│   ├── data/pageContent.js     # Contenido de Diagnóstico, Guías y Mantenimiento
│   ├── utils/                  # Funciones puras: formato de precios/fechas, categorías
│   └── styles/myStyles.css     # Estilos (variables, componentes, responsive, animaciones)
├── supabase/
│   ├── schema.sql              # Tablas, seguridad (RLS) y datos iniciales
│   └── functions/ai-chat/      # Edge Function que conecta con Groq
├── resources/                  # Logos e imágenes
└── .github/workflows/deploy.yml  # Compila y publica en GitHub Pages en cada push
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
En **Project Settings → API** copia la **Project URL** y la clave **anon/publishable**, y pégalas en `src/config.js`.
Esa clave es pública por diseño: lo que protege los datos son las políticas RLS de `schema.sql`.

### 3. IA en tu computadora (desarrollo y demo)
```bash
ollama pull llama3.2
```
Instala las dependencias y arranca el servidor de desarrollo de Vite:
```bash
npm install
npm run dev
```
Abre `http://localhost:5173`.
Con `provider: "auto"`, en `localhost` la web usa tu Ollama local.

### 4. IA para todos los visitantes (sitio publicado)
GitHub Pages no puede guardar claves secretas, así que la web llama a la Edge Function `ai-chat` y la función llama a **Groq**, que tiene un plan gratis:
1. Crea una cuenta en [console.groq.com](https://console.groq.com) y genera una API key en **API Keys**.
2. En Supabase, ve a **Edge Functions → Secrets** y agrega `AI_API_KEY` con esa clave (opcionalmente `AI_MODEL`, que por defecto es `openai/gpt-oss-20b`, y `ALLOWED_ORIGIN` con la URL de tu sitio).
3. Despliega la función: crea en el panel una función llamada `ai-chat` con el contenido de `supabase/functions/ai-chat/index.ts`, o usa la CLI:
   ```bash
   npx supabase login
   npx supabase link --project-ref TU_PROJECT_REF
   npx supabase functions deploy ai-chat --no-verify-jwt
   ```
   Si la creas desde el panel, desactiva **Verify JWT**.

> La función usa el formato de chat "compatible con OpenAI", así que también sirve con otros proveedores cambiando solo los secretos.
> Por ejemplo, Ollama Cloud: `AI_BASE_URL=https://ollama.com/v1` y `AI_MODEL=gpt-oss:20b` (requiere crédito en Ollama).
>
> Alternativa sin internet: pon `provider: "local"` en `src/config.js` y permite tu sitio en Ollama
> (`launchctl setenv OLLAMA_ORIGINS "https://TU-USUARIO.github.io"` y reinicia Ollama). Solo funcionará en la computadora donde corre Ollama.

### 5. Publicar en GitHub Pages
React se tiene que **compilar** (`npm run build` crea la carpeta `dist/`). Eso lo hace GitHub automáticamente:
1. Sube el repositorio a GitHub.
2. Ve a **Settings → Pages → Build and deployment** y en **Source** elige **GitHub Actions** (solo una vez).
3. Cada `git push` a `main` ejecuta `.github/workflows/deploy.yml`: instala, compila y publica `dist/`.
4. Tu sitio quedará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

Las direcciones usan `#` (por ejemplo `…/#/services`) porque GitHub Pages solo sirve archivos: con `HashRouter` el servidor siempre entrega `index.html` y React muestra la página correcta.

---

## Seguridad (resumen para la defensa)
- **Row Level Security:** los visitantes solo pueden **leer servicios activos** y **crear mensajes**; nunca pueden leer los mensajes.
  Solo los usuarios de la tabla `admins` pueden crear, editar o borrar.
- **Validación doble:** en el navegador (para dar buena experiencia) y con `CHECK` en la base de datos (para que no se pueda saltar).
- **Sin XSS:** React escapa automáticamente todo lo que se muestra con `{valor}`; el proyecto no usa `dangerouslySetInnerHTML` (las negritas del chat se arman como elementos de React).
- **Antispam:** el formulario incluye un campo trampa (*honeypot*) invisible.
- **Clave de IA secreta:** la clave del proveedor de IA (Groq) solo existe en los secretos de Supabase, nunca en el navegador.
