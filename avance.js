(() => {
  const cfg = window.FEMINARIO_CONFIG;
  const $ = (s) => document.querySelector(s);
  const form = $("#form"), errorEl = $("#formError"), submitBtn = $("#submitBtn");
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  const pre = new URLSearchParams(location.search).get("cohorte");
  if (pre === "1" || pre === "2") form.querySelector(`input[name=cohorte][value="${pre}"]`).checked = true;

  let archivo = null;
  const aIn = $("#archivo"), aErr = $("#archivoError");
  aIn.addEventListener("change", async () => {
    archivo = null; aErr.hidden = true; $("#archivoTxt").textContent = "Elegir archivo";
    form.querySelector("[data-group=archivo]").classList.remove("invalid");
    const file = aIn.files[0];
    if (!file) return;
    try { archivo = await window.FeminarioArchivo.leer(file); $("#archivoTxt").textContent = "✓ " + file.name; }
    catch (err) { aIn.value = ""; aErr.textContent = err.message; aErr.hidden = false; }
  });

  const grp = (n, isBad, el, bad) => { form.querySelector(`[data-group=${n}]`).classList.toggle("invalid", isBad); if (isBad) bad.push(el); };
  function validate() {
    const f = form.elements, bad = [];
    const mark = (el, isBad) => { el.closest(".field").classList.toggle("invalid", isBad); if (isBad) bad.push(el); };
    mark(f.nombre, !f.nombre.value.trim());
    mark(f.email, !emailOk(f.email.value.trim()));
    grp("cohorte", !form.querySelector("input[name=cohorte]:checked"), form.querySelector("input[name=cohorte]"), bad);
    grp("archivo", !archivo, aIn, bad);
    grp("ok", !f.ok.checked, f.ok, bad);
    return bad;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); errorEl.hidden = true;
    const bad = validate();
    if (bad.length) { errorEl.textContent = "Revisa los campos marcados para continuar."; errorEl.hidden = false; bad[0].focus(); return; }
    const f = form.elements;
    const payload = {
      "_tipo": "avance",
      "Fecha": new Date().toISOString(),
      "Cohorte": form.querySelector("input[name=cohorte]:checked").value,
      "Nombre": f.nombre.value.trim(),
      "Email": f.email.value.trim().toLowerCase(),
      "Cómo vas": f.nota.value.trim(),
      "_extracto": archivo.dataUrl,
      "_extractoNombre": archivo.nombre,
    };
    submitBtn.disabled = true; submitBtn.textContent = "Enviando…";
    try {
      if (!cfg.SHEET_ENDPOINT) console.warn("SHEET_ENDPOINT vacío: no se guardó.");
      else await fetch(cfg.SHEET_ENDPOINT, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
    } catch (err) { console.error(err); }
    $("#doneName").textContent = payload["Nombre"].split(" ")[0];
    $("#formView").hidden = true; $("#doneView").hidden = false;
    $("#card").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  form.addEventListener("input", (e) => e.target.closest(".field")?.classList.remove("invalid"));
})();
