// Recibe las respuestas del formulario "Cuéntanos qué tal" y las guarda en la hoja,
// una pestaña por cohorte ("Cohorte 1" y "Cohorte 2"). La foto se guarda en Drive.
// Escribe por NOMBRE de columna; si falta una, la crea.

const SHEET_ID = "1fKDj7Z3nGKxd27qi64WlL6R47ozEB9VdG15jmFx7yo8";
const CARPETA_FOTOS = "Fotos asesoría Club 365";
const CARPETA_EXTRACTOS = "Extractos asesoría Club 365";
const HEADERS = ["Fecha", "Cohorte", "Nombre", "Email", "Whatsapp", "Foto",
  "Cómo vas con tus finanzas", "Mayor dolor con la plata", "Dudas para la asesoría",
  "Meta 2027", "Qué te gustaría ver en Feminario", "Autorizó uso de datos", "Extracto"];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const d = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const nombreHoja = "Cohorte " + (String(d["Cohorte"]) === "2" ? "2" : "1");
    let sh = ss.getSheetByName(nombreHoja) || ss.insertSheet(nombreHoja);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight("bold");
      sh.setFrozenRows(1);
    }
    const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
    HEADERS.forEach((h) => { if (headers.indexOf(h) < 0) { headers.push(h); sh.getRange(1, headers.length).setValue(h); } });

    d["Foto"] = guardarFoto(d["_foto"], d["Nombre"], d["Email"]);
    d["Extracto"] = guardarExtracto(d["_extracto"], d["_extracto_nombre"], d["Nombre"], d["Email"]);
    const fila = headers.map((h) => {
      const v = d[h] !== undefined ? d[h] : "";
      return h === "Whatsapp" ? "'" + v : v;
    });
    sh.appendRow(fila);
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  } finally { lock.releaseLock(); }
}

function guardarFoto(dataUrl, nombre, email) {
  if (!dataUrl) return "";
  const it = DriveApp.getFoldersByName(CARPETA_FOTOS);
  const carpeta = it.hasNext() ? it.next() : DriveApp.createFolder(CARPETA_FOTOS);
  const bytes = Utilities.base64Decode(String(dataUrl).split(",")[1]);
  const blob = Utilities.newBlob(bytes, "image/jpeg", (nombre || "foto") + " - " + email + ".jpg");
  const f = carpeta.createFile(blob);
  f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return "https://drive.google.com/thumbnail?id=" + f.getId() + "&sz=w400";
}

// Guarda el extracto (PDF o imagen) en una carpeta privada de Drive; la hoja queda con el enlace (solo lo abre quien tenga acceso a la carpeta).
function guardarExtracto(dataUrl, archivo, nombre, email) {
  if (!dataUrl) return "";
  const m = /^data:([^;]+);base64,(.*)$/.exec(String(dataUrl));
  if (!m) return "";
  const it = DriveApp.getFoldersByName(CARPETA_EXTRACTOS);
  const carpeta = it.hasNext() ? it.next() : DriveApp.createFolder(CARPETA_EXTRACTOS);
  const ext = m[1] === "application/pdf" ? ".pdf" : m[1] === "image/png" ? ".png" : ".jpg";
  const blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], "Extracto - " + (nombre || "sin nombre") + " - " + email + ext);
  return carpeta.createFile(blob).getUrl();
}

function doGet() { return out({ ok: true, service: "feminario-asesorias" }); }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
