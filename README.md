# Cuéntanos qué tal · Formulario de asesorías Club 365

Formulario estático (HTML/CSS/JS). Guarda las respuestas en la hoja de asesorías (pestañas **Cohorte 1** y **Cohorte 2**), sube la foto a Drive y abre el calendario según la cohorte:

- Cohorte 1 → https://calendar.app.google/EHn4KiBDv5vFA4M16
- Cohorte 2 → https://calendar.app.google/n7cx1ne7WXzwPjNYA

Se puede preseleccionar la cohorte con `?cohorte=1` o `?cohorte=2`.

## Activarlo (una sola vez)
1. Abre la hoja → Extensiones → Apps Script → pega [apps-script/Code.gs](apps-script/Code.gs).
2. Implementar → Nueva implementación → Aplicación web → Ejecutar como **yo**, acceso **Cualquier persona** → copia la URL `.../exec`.
3. Pégala en `SHEET_ENDPOINT` de [config.js](config.js) y publica.

Sin el paso 3 el formulario funciona pero **no guarda**.

## Extracto y avance (nov 2026)
- **En el formulario:** campo opcional «Sube tu extracto o resumen de finanzas» (PDF, Excel, CSV o foto, máx. 5 MB) con su autorización. Se guarda en la columna **Extracto** de la hoja.
- **[avance.html](avance.html):** página para volver a subir el extracto cada mes (`avance.html?cohorte=1`). Cada envío queda como una fila en la pestaña **Avances**.
- **Privacidad:** los archivos van a la carpeta de Drive «Extractos Club 365 (privado)», una subcarpeta por correo, **sin compartir** (a diferencia de las fotos). El enlace en la hoja solo abre para quien tenga acceso a ese Drive.
- **Para activarlo:** vuelve a pegar [apps-script/Code.gs](apps-script/Code.gs) en el Apps Script y publica una **nueva versión** de la implementación (Drive pedirá permisos otra vez). La URL `/exec` no cambia.
- **Límite:** el formulario no puede confirmar que el archivo llegó (Apps Script no lo permite con este método), así que revisa la carpeta después de la primera prueba.
