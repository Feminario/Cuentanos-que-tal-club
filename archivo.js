// Lectura segura del archivo que sube la miembro (extracto, resumen de finanzas, captura).
// Acepta PDF, Excel, CSV e imágenes. Las imágenes se reducen; el resto debe pesar máx. 5 MB.
window.FeminarioArchivo = (() => {
  const MAX = 5 * 1024 * 1024;
  const MIME = {
    pdf: "application/pdf", xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    csv: "text/csv", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  };
  const aDataUrl = (blob) => new Promise((ok, no) => {
    const r = new FileReader();
    r.onload = () => ok(r.result); r.onerror = () => no(new Error("No pudimos leer el archivo."));
    r.readAsDataURL(blob);
  });
  async function reducirImagen(file) {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    const cv = document.createElement("canvas");
    cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
    cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height);
    return await new Promise((ok, no) => cv.toBlob((b) => (b ? ok(b) : no(new Error("No pudimos leer la imagen."))), "image/jpeg", 0.85));
  }
  // Devuelve { dataUrl, nombre } o lanza un Error con un mensaje para mostrar tal cual.
  async function leer(file) {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const mime = MIME[ext];
    if (!mime) throw new Error("Ese tipo de archivo no lo podemos leer. Sube un PDF, Excel, CSV o una foto.");
    let blob = file, tipo = mime;
    if (mime.startsWith("image/")) { blob = await reducirImagen(file); tipo = "image/jpeg"; }
    if (blob.size > MAX) throw new Error("El archivo pesa más de 5 MB. Prueba con uno más liviano o con una captura.");
    const url = await aDataUrl(blob);
    return { dataUrl: url.replace(/^data:[^;]*;/, "data:" + tipo + ";"), nombre: file.name };
  }
  return { leer };
})();
