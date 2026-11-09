// Recibe las respuestas del formulario "Cuéntanos qué tal" y las guarda en la hoja,
// una pestaña por cohorte ("Cohorte 1" y "Cohorte 2"). La foto se guarda en Drive.
// Escribe por NOMBRE de columna; si falta una, la crea.

const SHEET_ID = "1fKDj7Z3nGKxd27qi64WlL6R47ozEB9VdG15jmFx7yo8";
const CARPETA_FOTOS = "Fotos asesoría Club 365";
const CARPETA_EXTRACTOS = "Extractos Club 365 (privado)";   // NO se comparte: solo la ven quienes tengan acceso a tu Drive
const HOJA_AVANCES = "Avances";
const HEADERS_AVANCES = ["Fecha", "Cohorte", "Nombre", "Email", "Cómo vas", "Archivo"];
const TIPOS_OK = ["application/pdf", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv", "image/jpeg", "image/png", "image/webp"];
const HEADERS = ["Fecha", "Cohorte", "Nombre", "Email", "Whatsapp", "Foto",
  "Cómo vas con tus finanzas", "Mayor dolor con la plata", "Dudas para la asesoría",
  "Meta 2027", "Qué te gustaría ver en Feminario", "Autorizó uso de datos",
  "Extracto", "Autorizó guardar extracto"];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const d = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    if (d["_tipo"] === "avance") return out(guardarAvance(ss, d));
    const nombreHoja = "Cohorte " + (String(d["Cohorte"]) === "2" ? "2" : "1");
    let sh = ss.getSheetByName(nombreHoja) || ss.insertSheet(nombreHoja);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight("bold");
      sh.setFrozenRows(1);
    }
    const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
    HEADERS.forEach((h) => { if (headers.indexOf(h) < 0) { headers.push(h); sh.getRange(1, headers.length).setValue(h); } });

    d["Foto"] = guardarFoto(d["_foto"], d["Nombre"], d["Email"]);
    d["Extracto"] = guardarArchivo(d["_extracto"], d["_extractoNombre"], d["Nombre"], d["Email"]);
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

// Avances posteriores: la miembro vuelve a subir su extracto y queda una fila en la pestaña «Avances».
function guardarAvance(ss, d) {
  const email = String(d["Email"] || "").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: "correo inválido" };
  const archivo = guardarArchivo(d["_extracto"], d["_extractoNombre"], d["Nombre"], email);
  if (!archivo) return { ok: false, error: "archivo inválido" };
  let sh = ss.getSheetByName(HOJA_AVANCES) || ss.insertSheet(HOJA_AVANCES);
  if (sh.getLastRow() === 0) { sh.getRange(1, 1, 1, HEADERS_AVANCES.length).setValues([HEADERS_AVANCES]).setFontWeight("bold"); sh.setFrozenRows(1); }
  sh.appendRow([d["Fecha"], d["Cohorte"], d["Nombre"], email, d["Cómo vas"] || "", archivo]);
  return { ok: true };
}

// Guarda el archivo en una carpeta privada, con una subcarpeta por correo. Devuelve el enlace de Drive (solo abre con permiso).
function guardarArchivo(dataUrl, nombreOriginal, nombre, email) {
  if (!dataUrl) return "";
  const m = /^data:([^;]+);base64,(.*)$/.exec(String(dataUrl));
  if (!m || TIPOS_OK.indexOf(m[1]) < 0) return "";
  const it = DriveApp.getFoldersByName(CARPETA_EXTRACTOS);
  const raiz = it.hasNext() ? it.next() : DriveApp.createFolder(CARPETA_EXTRACTOS);
  const sub = String(email || "sin-correo").toLowerCase().replace(/[^a-z0-9@._+-]/g, "").slice(0, 80) || "sin-correo";
  const ih = raiz.getFoldersByName(sub);
  const dir = ih.hasNext() ? ih.next() : raiz.createFolder(sub);
  const ext = String(nombreOriginal || "").split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
  const fecha = Utilities.formatDate(new Date(), "America/Bogota", "yyyy-MM-dd HH-mm");
  const limpio = String(nombre || "").replace(/[^\p{L}\p{N} ]/gu, "").slice(0, 40);
  const blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], fecha + " - " + limpio + (ext ? "." + ext : ""));
  return dir.createFile(blob).getUrl();   // sin setSharing: queda privado
}

function doGet() { return out({ ok: true, service: "feminario-asesorias" }); }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
