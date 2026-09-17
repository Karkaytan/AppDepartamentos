# App Departamentos - Analizador Inmobiliario

Este proyecto es una herramienta integral para extraer, almacenar y analizar oportunidades de inversión inmobiliaria.

## Arquitectura del Proyecto

El proyecto se compone de 3 partes:
1. **Extensión de Chrome (`/extension`)**: Extrae datos (precio, m2, habitaciones, ubicación) de portales inmobiliarios (ej. InfoCasas) usando un scraper con expresiones regulares.
2. **Backend en Google Apps Script (`/apps_script`)**: Recibe los datos, los convierte en diferentes divisas (USD, PYG, EUR) mediante la API de Google Finance y calcula la rentabilidad bruta y los flujos de caja.
3. **Frontend (Looker Studio)**: Panel visual conectado directamente al Google Sheets resultante para crear gráficas interactivas y cuadros de mando.

## Cómo retomar este proyecto en otro ordenador

Si descargas este repositorio en un ordenador nuevo, sigue estos pasos:

### 1. Instalar la Extensión en Chrome
1. Abre Google Chrome y ve a `chrome://extensions/`.
2. Activa el **Modo Desarrollador** (esquina superior derecha).
3. Haz clic en **Cargar descomprimida** y selecciona la carpeta `extension` de este proyecto.

### 2. Reconectar Google Apps Script (clasp)
Para poder subir actualizaciones al código de Google Sheets desde el nuevo ordenador:
1. Asegúrate de tener Node.js instalado.
2. Abre la terminal en la carpeta `/apps_script`.
3. Instala clasp (si no está instalado globalmente): `npm install -g @google/clasp`.
4. Inicia sesión en Google: `clasp login` (se abrirá tu navegador para autorizar).
5. (Opcional) Si modificas el archivo `Code.js`, súbelo con: `clasp push -f` y despliégalo de nuevo con `clasp deploy`.

### Notas de Configuración
* El enlace al Web App de Google (Webhook) está configurado en `extension/popup.js`. Si alguna vez haces un nuevo despliegue mayor en Apps Script, asegúrate de actualizar la variable `WEB_APP_URL`.
* Los IDs del script y del documento están guardados en `apps_script/.clasp.json` y `apps_script/Code.js`. No necesitan modificarse a menos que crees un Google Sheet completamente nuevo.
