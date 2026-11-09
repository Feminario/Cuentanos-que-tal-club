# Cuéntanos qué tal · Formulario de asesorías Club 365

Formulario estático (HTML/CSS/JS). Guarda las respuestas en la hoja de asesorías (pestañas **Cohorte 1** y **Cohorte 2**), sube la foto y el extracto bancario (opcional) a Drive y abre el calendario según la cohorte:

- Cohorte 1 → https://calendar.app.google/EHn4KiBDv5vFA4M16
- Cohorte 2 → https://calendar.app.google/n7cx1ne7WXzwPjNYA

Se puede preseleccionar la cohorte con `?cohorte=1` o `?cohorte=2`.

## Activarlo (una sola vez)
1. Abre la hoja → Extensiones → Apps Script → pega [apps-script/Code.gs](apps-script/Code.gs).
2. Implementar → Nueva implementación → Aplicación web → Ejecutar como **yo**, acceso **Cualquier persona** → copia la URL `.../exec`.
3. Pégala en `SHEET_ENDPOINT` de [config.js](config.js) y publica.

Sin el paso 3 el formulario funciona pero **no guarda**.
