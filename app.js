(() => {
  const cfg = window.FEMINARIO_CONFIG;

  // [iso, nombre, código]
  const COUNTRIES = [
    ["co", "Colombia", "57"], ["mx", "México", "52"], ["ar", "Argentina", "54"],
    ["cl", "Chile", "56"], ["pe", "Perú", "51"], ["ec", "Ecuador", "593"],
    ["ve", "Venezuela", "58"], ["uy", "Uruguay", "598"], ["py", "Paraguay", "595"],
    ["bo", "Bolivia", "591"], ["br", "Brasil", "55"], ["pa", "Panamá", "507"],
    ["cr", "Costa Rica", "506"], ["gt", "Guatemala", "502"], ["sv", "El Salvador", "503"],
    ["hn", "Honduras", "504"], ["ni", "Nicaragua", "505"], ["do", "Rep. Dominicana", "1"],
    ["cu", "Cuba", "53"], ["us", "Estados Unidos", "1"], ["ca", "Canadá", "1"],
    ["es", "España", "34"], ["gb", "Reino Unido", "44"], ["fr", "Francia", "33"],
    ["de", "Alemania", "49"], ["it", "Italia", "39"], ["pt", "Portugal", "351"],
    ["nl", "Países Bajos", "31"], ["ch", "Suiza", "41"], ["au", "Australia", "61"],
  ];

  const $ = (s) => document.querySelector(s);
  const form = $("#form");
  const errorEl = $("#formError");
  const submitBtn = $("#submitBtn");
  let country = COUNTRIES[0];

  // ---------- Selector de país ----------
  const flag = (iso) => `https://flagcdn.com/w40/${iso}.png`;
  const ccBtn = $("#ccBtn"), ccList = $("#ccList");

  function renderCountry() {
    $("#ccFlag").src = flag(country[0]);
    $("#ccCode").textContent = "+" + country[2];
  }
  COUNTRIES.forEach((c) => {
    const li = document.createElement("li");
    li.role = "option";
    li.dataset.iso = c[0];
    li.innerHTML = `<img src="${flag(c[0])}" width="22" height="16" alt="" loading="lazy"><span>${c[1]}</span><span>+${c[2]}</span>`;
    li.addEventListener("click", () => {
      country = c; renderCountry(); toggleList(false);
      form.telefono.focus();
    });
    ccList.appendChild(li);
  });
  function toggleList(open) {
    ccList.hidden = !open;
    ccBtn.setAttribute("aria-expanded", String(open));
    [...ccList.children].forEach((li) => li.setAttribute("aria-selected", String(li.dataset.iso === country[0])));
  }
  ccBtn.addEventListener("click", () => toggleList(ccList.hidden));
  document.addEventListener("click", (e) => { if (!$("#cc").contains(e.target)) toggleList(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleList(false); });
  renderCountry();

  // ---------- Desplegable de metas (selección múltiple) ----------
  const msBtn = $("#msBtn"), msList = $("#msList"), msText = $("#msText");
  const toggleMs = (open) => { msList.hidden = !open; msBtn.setAttribute("aria-expanded", String(open)); };
  msBtn.addEventListener("click", () => toggleMs(msList.hidden));
  document.addEventListener("click", (e) => { if (!$("#ms").contains(e.target)) toggleMs(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleMs(false); });
  msList.addEventListener("change", () => {
    const sel = [...msList.querySelectorAll("input:checked")].map((i) => i.value);
    msText.textContent = sel.length ? sel.join(", ") : "Elige una o varias opciones";
    msText.classList.toggle("ph", !sel.length);
  });

  // ---------- Foto (obligatoria): se reduce a 480 px antes de enviarla ----------
  let fotoData = "";
  const fotoIn = $("#foto");
  fotoIn.addEventListener("change", () => {
    const file = fotoIn.files[0];
    fotoData = "";
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const cv = document.createElement("canvas");
      cv.width = cv.height = 480;
      cv.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 480, 480);
      fotoData = cv.toDataURL("image/jpeg", 0.82);
      $("#fotoPrev").src = fotoData; $("#fotoPrev").hidden = false;
      $("#fotoTxt").textContent = "Cambiar foto";
      form.querySelector("[data-group=foto]").classList.remove("invalid");
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { fotoIn.value = ""; };
    img.src = url;
  });

  // ---------- Extracto / resumen de finanzas (opcional) ----------
  let extracto = null;
  const extIn = $("#extracto"), extErr = $("#extractoError");
  extIn.addEventListener("change", async () => {
    extracto = null; extErr.hidden = true;
    $("#extractoTxt").textContent = "Elegir archivo";
    form.querySelector("[data-group=okExtracto]").hidden = true;
    const file = extIn.files[0];
    if (!file) return;
    try {
      extracto = await window.FeminarioArchivo.leer(file);
      $("#extractoTxt").textContent = "✓ " + file.name;
      form.querySelector("[data-group=okExtracto]").hidden = false;
    } catch (err) {
      extIn.value = ""; extErr.textContent = err.message; extErr.hidden = false;
    }
  });

  // Cohorte desde la URL (?cohorte=1 o 2)
  const pre = new URLSearchParams(location.search).get("cohorte");
  if (pre === "1" || pre === "2") form.querySelector(`input[name=cohorte][value="${pre}"]`).checked = true;

  // ---------- Validación ----------
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const grp = (n, isBad, el, bad) => { form.querySelector(`[data-group=${n}]`).classList.toggle("invalid", isBad); if (isBad) bad.push(el); };

  function validate() {
    const f = form.elements, bad = [];
    const mark = (el, isBad) => { el.closest(".field").classList.toggle("invalid", isBad); if (isBad) bad.push(el); };
    ["nombre", "apellido", "dudas", "meta2027"].forEach((n) => mark(f[n], !f[n].value.trim()));
    mark(f.email, !emailOk(f.email.value.trim()));
    const digits = f.telefono.value.replace(/\D/g, "");
    mark(f.telefono, digits.length < 6 || digits.length > 12);
    grp("foto", !fotoData, $("#foto"), bad);
    grp("cohorte", !form.querySelector("input[name=cohorte]:checked"), form.querySelector("input[name=cohorte]"), bad);
    grp("momento", !form.querySelector("input[name=momento]:checked"), form.querySelector("input[name=momento]"), bad);
    grp("dolor", !form.querySelector("input[name=dolor]:checked"), $("#msBtn"), bad);
    grp("ok", !f.ok.checked, f.ok, bad);
    grp("okExtracto", !!extracto && !f.okExtracto.checked, f.okExtracto, bad);
    return bad;
  }

  // ---------- Envío ----------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    const bad = validate();
    if (bad.length) {
      errorEl.textContent = "Revisa los campos marcados para continuar.";
      errorEl.hidden = false;
      bad[0].focus();
      return;
    }

    const f = form.elements;
    const cohorte = form.querySelector("input[name=cohorte]:checked").value;
    const calUrl = cfg.CALENDARIOS[cohorte]; // cohorte 1 y 2 tienen calendarios distintos

    const nombre = f.nombre.value.trim();
    const payload = {
      "Fecha": new Date().toISOString(),
      "Cohorte": cohorte,
      "Nombre": `${nombre} ${f.apellido.value.trim()}`,
      "Email": f.email.value.trim().toLowerCase(),
      "Whatsapp": country[2] + f.telefono.value.replace(/\D/g, "").replace(/^0+/, ""),
      "Cómo vas con tus finanzas": f.momento.value,
      "Mayor dolor con la plata": [...form.querySelectorAll("input[name=dolor]:checked")].map((i) => i.value).join(", "),
      "Dudas para la asesoría": f.dudas.value.trim(),
      "Meta 2027": f.meta2027.value.trim(),
      "Qué te gustaría ver en Feminario": f.ideas.value.trim(),
      "Autorizó uso de datos": "Sí",
      "_foto": fotoData,
    };
    if (extracto) {
      payload["Autorizó guardar extracto"] = "Sí";
      payload["_extracto"] = extracto.dataUrl;
      payload["_extractoNombre"] = extracto.nombre;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando…";
    try {
      if (!cfg.SHEET_ENDPOINT) {
        console.warn("SHEET_ENDPOINT vacío: no se guardó en la hoja.", payload);
      } else {
        // text/plain evita el preflight CORS que Apps Script no soporta.
        await fetch(cfg.SHEET_ENDPOINT, {
          method: "POST", mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
        });
      }
    } catch (err) { console.error(err); }

    $("#doneName").textContent = nombre;
    $("#calBtn").href = calUrl;
    $("#formView").hidden = true;
    $("#doneView").hidden = false;
    $("#card").scrollIntoView({ behavior: "smooth", block: "start" });
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) confetti();
    // Tras el confeti la llevamos al calendario en esta misma pestaña (el botón queda por si prefiere ir antes).
    setTimeout(() => { location.href = calUrl; }, 4500);
  });

  form.addEventListener("input", (e) => e.target.closest(".field")?.classList.remove("invalid"));

  // ---------- Confeti con formas Feminario ----------
  const COLORS = ["#ddf0a8", "#ff8a5b", "#ff9fb5", "#c3c8ff", "#f8f6ea", "#8084b0"];
  const SHAPES = (() => {
    const star = new Path2D("M0-1l.16.66.64-.24-.4.54.6.18-.62.14.3.58-.56-.34-.12.66-.12-.66-.56.34.3-.58-.62-.14.6-.18-.4-.54.64.24z");
    const pin = new Path2D("M.08-.08V-.92A.84.84 0 0 1 .92-.08ZM.08.08H.92A.84.84 0 0 1 .08.92ZM-.08.08V.92A.84.84 0 0 1-.92.08ZM-.08-.08H-.92A.84.84 0 0 1-.08-.92Z");
    const spark = new Path2D("M0-1Q.12-.12 1 0Q.12.12 0 1Q-.12.12-1 0Q-.12-.12 0-1Z");
    const dots = new Path2D();
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { dots.moveTo(i * .66 + .28, j * .66); dots.arc(i * .66, j * .66, .28, 0, Math.PI * 2); }
    const burst = new Path2D();
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; burst.moveTo(Math.cos(a) * .35, Math.sin(a) * .35); burst.lineTo(Math.cos(a), Math.sin(a)); }
    const squig = new Path2D("M-.9.5C-.9-.5.1-.9.4-.4S.2.4-.2.1.2-.9.9-.6");
    return [
      { p: star, fill: true }, { p: pin, fill: true }, { p: spark, fill: true },
      { p: dots, fill: true }, { p: burst, fill: false, w: .16 }, { p: squig, fill: false, w: .2 },
    ];
  })();

  function confetti() {
    const cv = $("#confetti"), ctx = cv.getContext("2d");
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = (cv.width = innerWidth * dpr), H = (cv.height = innerHeight * dpr);
    const rnd = (a, b) => a + Math.random() * (b - a);
    const N = innerWidth < 600 ? 70 : 120;
    const bits = Array.from({ length: N }, (_, i) => {
      const fromLeft = i % 2 === 0;
      return {
        s: SHAPES[i % SHAPES.length], c: COLORS[(i * 5 + (i >> 2)) % COLORS.length],
        x: (fromLeft ? 0.1 : 0.9) * W, y: H * 0.75,
        vx: (fromLeft ? 1 : -1) * rnd(2, 9) * dpr, vy: -rnd(9, 20) * dpr,
        r: rnd(0, 6.28), vr: rnd(-.12, .12), size: rnd(13, 30) * dpr,
      };
    });
    const t0 = performance.now();
    (function frame(t) {
      const dt = t - t0;
      ctx.clearRect(0, 0, W, H);
      const fade = dt > 3200 ? Math.max(0, 1 - (dt - 3200) / 1000) : 1;
      for (const b of bits) {
        b.vy += .38 * dpr; b.vx *= .992; b.vy *= .992;
        b.x += b.vx; b.y += b.vy; b.r += b.vr;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.scale(b.size, b.size);
        ctx.fillStyle = ctx.strokeStyle = b.c;
        if (b.s.fill) ctx.fill(b.s.p);
        else { ctx.lineWidth = b.s.w; ctx.lineCap = "round"; ctx.stroke(b.s.p); }
        ctx.restore();
      }
      if (dt < 4200) requestAnimationFrame(frame); else ctx.clearRect(0, 0, W, H);
    })(t0);
  }
})();
