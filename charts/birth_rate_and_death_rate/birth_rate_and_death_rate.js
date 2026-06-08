function _1(md){return(
md`# Birth rate and death rate`
)}

function _2(rawData,d3)
{
  const W = 900, H = 560;
  const margin = { top: 70, right: 30, bottom: 100, left: 50 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const BIRTH_COLOR = "#4C6FAD";
  const DEATH_COLOR = "#B04B2D";

  const birthCol = "Birth rate";
  const deathCol = "Death rate";    

  // ── Preparar datos ────────────────────────────────────────────────────────
  const country = "United States";

  const rows = rawData.filter(d => d.Entity === country);
  const years = [...new Set(rows.map(d => d.Year))].sort((a, b) => a - b);

  // Por año: { birth, death }
  const byYear = new Map(years.map(y => {
    const r = rows.find(d => d.Year === y);
    return [y, {
      birth: r[birthCol]  != null && r[birthCol]  !== "" ? +r[birthCol]  : null,
      death: r[deathCol] != null && r[deathCol] !== "" ? +r[deathCol] : null
    }];
  }));

  let mode = "line";       // "line" | "bar"
  let currentYear = years[years.length - 1];
  let playing = false;
  let timer = null;

  // ── Contenedor ────────────────────────────────────────────────────────────
  const container = d3.create("div")
    .style("font-family", "sans-serif")
    .style("user-select", "none");

  // ── Botones de modo ───────────────────────────────────────────────────────
  const btnRow = container.append("div")
    .style("display", "flex").style("gap", "6px").style("margin-bottom", "6px");

  const mkBtn = (label, active) => btnRow.append("button").text(label)
    .style("padding", "4px 14px").style("border", "1px solid #ccc")
    .style("border-radius", "4px").style("cursor", "pointer")
    .style("font-size", "13px")
    .style("background", active ? "#3a6fc4" : "#fff")
    .style("color",      active ? "#fff"    : "#333");

  const btnLine = mkBtn("📈 Line", true);
  const btnBar  = mkBtn("📊 Bar",  false);

  // ── SVG ───────────────────────────────────────────────────────────────────
  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", W).attr("height", H)
    .style("background", "#fff");

  // Título dinámico
  const titleEl = svg.append("text")
    .attr("x", margin.left).attr("y", 22)
    .style("font-size", "17px").style("font-weight", "bold").style("fill", "#111");

  svg.append("foreignObject")
    .attr("x", margin.left).attr("y", 28)
    .attr("width", W - margin.left - 20).attr("height", 22)
    .append("xhtml:div")
    .style("font-size", "11px").style("color", "#555")
    .text("Estimated number of annual births and deaths per 1,000 people.");

  const mainG = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display", "none");
  const ttBg = ttG.append("rect").attr("rx", 6).attr("fill", "white")
    .attr("stroke", "#ddd").attr("stroke-width", 1)
    .attr("filter", "drop-shadow(0 2px 6px rgba(0,0,0,0.13))");
  const ttTitle = ttG.append("text").attr("x", 12).attr("y", 20)
    .style("font-size", "13px").style("font-weight", "bold").style("fill", "#111");
  const ttBirth = ttG.append("text").attr("x", 12).attr("y", 40)
    .style("font-size", "12px").style("fill", BIRTH_COLOR);
  const ttDeath = ttG.append("text").attr("x", 12).attr("y", 58)
    .style("font-size", "12px").style("fill", DEATH_COLOR);

  function showTooltip(year, vals, mx, my) {
    ttTitle.text(`${country}, ${year}`);
    ttBirth.text(vals.birth != null ? `Birth rate: ${d3.format(".1f")(vals.birth)}` : "Birth rate: n/a");
    ttDeath.text(vals.death != null ? `Death rate: ${d3.format(".1f")(vals.death)}` : "Death rate: n/a");
    const ttW = 200, ttH = 70;
    ttBg.attr("width", ttW).attr("height", ttH);
    ttG.style("display", null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 12;
    const ty = Math.max(0, Math.min(my - 20, H - ttH - 10));
    ttG.attr("transform", `translate(${tx},${ty})`);
  }
  function hideTooltip() { ttG.style("display", "none"); }

  // ── RENDER LINE ───────────────────────────────────────────────────────────
  function renderLine() {
    mainG.selectAll("*").remove();
    titleEl.text(`Birth rate and death rate, ${country}`);

    const allVals = years.flatMap(y => {
      const v = byYear.get(y);
      return [v.birth, v.death].filter(x => x != null);
    });
    const yMax = Math.ceil((d3.max(allVals) || 30) / 5) * 5;

    const xScale = d3.scaleLinear().domain(d3.extent(years)).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);

    // Gridlines + eje Y
    yScale.ticks(6).forEach(v => {
      mainG.append("line")
        .attr("x1", 0).attr("x2", innerW)
        .attr("y1", yScale(v)).attr("y2", yScale(v))
        .attr("stroke", v === 0 ? "#999" : "#e0e0e0")
        .attr("stroke-dasharray", v === 0 ? "0" : "4,3")
        .attr("stroke-width", 1);
      mainG.append("text")
        .attr("x", -8).attr("y", yScale(v)).attr("dy", "0.35em")
        .style("font-size", "11px").style("fill", "#888").style("text-anchor", "end")
        .text(v);
    });

    // Eje X
    const xTicks = years.filter(y => y % 20 === 0);
    xTicks.forEach(y => {
      mainG.append("text")
        .attr("x", xScale(y)).attr("y", innerH + 18)
        .style("font-size", "11px").style("fill", "#888").style("text-anchor", "middle")
        .text(y);
    });
    // primer y último año
    [years[0], years[years.length - 1]].forEach(y => {
      mainG.append("text")
        .attr("x", xScale(y)).attr("y", innerH + 18)
        .style("font-size", "11px").style("fill", "#888").style("text-anchor", "middle")
        .text(y);
    });

    // Línea base X
    mainG.append("line")
      .attr("x1", 0).attr("x2", innerW)
      .attr("y1", innerH).attr("y2", innerH)
      .attr("stroke", "#bbb").attr("stroke-width", 1);

    // Generador de línea
    const lineGen = (accessor) => d3.line()
      .defined(d => accessor(byYear.get(d)) != null)
      .x(d => xScale(d))
      .y(d => yScale(accessor(byYear.get(d))))
      .curve(d3.curveMonotoneX)(years);

    // Área entre curvas (natural gap = birth > death usually)
    // Línea Birth
    mainG.append("path")
      .attr("fill", "none")
      .attr("stroke", BIRTH_COLOR)
      .attr("stroke-width", 2)
      .attr("d", lineGen(v => v.birth));

    // Puntos Birth
    years.filter(y => byYear.get(y).birth != null).forEach(y => {
      mainG.append("circle")
        .attr("cx", xScale(y)).attr("cy", yScale(byYear.get(y).birth))
        .attr("r", 2.5).attr("fill", BIRTH_COLOR);
    });

    // Línea Death
    mainG.append("path")
      .attr("fill", "none")
      .attr("stroke", DEATH_COLOR)
      .attr("stroke-width", 2)
      .attr("d", lineGen(v => v.death));

    // Puntos Death
    years.filter(y => byYear.get(y).death != null).forEach(y => {
      mainG.append("circle")
        .attr("cx", xScale(y)).attr("cy", yScale(byYear.get(y).death))
        .attr("r", 2.5).attr("fill", DEATH_COLOR);
    });

    // Etiquetas al final de cada línea
    const lastBirthYear = [...years].reverse().find(y => byYear.get(y).birth != null);
    const lastDeathYear = [...years].reverse().find(y => byYear.get(y).death != null);

    if (lastBirthYear) {
      mainG.append("text")
        .attr("x", xScale(lastBirthYear) + 6)
        .attr("y", yScale(byYear.get(lastBirthYear).birth))
        .attr("dy", "0.35em")
        .style("font-size", "12px").style("font-weight", "bold").style("fill", BIRTH_COLOR)
        .text("Birth rate");
    }
    if (lastDeathYear) {
      mainG.append("text")
        .attr("x", xScale(lastDeathYear) + 6)
        .attr("y", yScale(byYear.get(lastDeathYear).death))
        .attr("dy", "0.35em")
        .style("font-size", "12px").style("font-weight", "bold").style("fill", DEATH_COLOR)
        .text("Death rate");
    }

    // Zona interactiva invisible para tooltip
    mainG.append("rect")
      .attr("width", innerW).attr("height", innerH)
      .attr("fill", "transparent")
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event);
        const year = Math.round(xScale.invert(mx));
        const closest = years.reduce((a, b) =>
          Math.abs(a - year) < Math.abs(b - year) ? a : b);
        const vals = byYear.get(closest);
        const [sx, sy] = d3.pointer(event, svg.node());
        showTooltip(closest, vals, sx, sy);
      })
      .on("mouseleave", hideTooltip);
  }

  // ── RENDER BAR ────────────────────────────────────────────────────────────
  function renderBar() {
    mainG.selectAll("*").remove();
    titleEl.text(`Birth rate and death rate, ${country}, ${currentYear}`);

    const vals = byYear.get(currentYear) || { birth: null, death: null };
    const items = [
      { label: "Birth rate", value: vals.birth, color: BIRTH_COLOR },
      { label: "Death rate", value: vals.death, color: DEATH_COLOR }
    ].filter(d => d.value != null);

    const maxVal = Math.ceil((d3.max(items, d => d.value) || 20) * 1.1);
    const xScale = d3.scaleLinear().domain([0, maxVal]).range([0, innerW]);
    const yScale = d3.scaleBand()
      .domain(items.map(d => d.label))
      .range([0, innerH])
      .padding(0.35);

    // Barras
    mainG.selectAll(".bar")
      .data(items).join("rect").attr("class", "bar")
      .attr("x", 0)
      .attr("y", d => yScale(d.label))
      .attr("width", d => xScale(d.value))
      .attr("height", yScale.bandwidth())
      .attr("fill", d => d.color);

    // Etiqueta izquierda (nombre)
    mainG.selectAll(".blabel")
      .data(items).join("text").attr("class", "blabel")
      .attr("x", -10)
      .attr("y", d => yScale(d.label) + yScale.bandwidth() / 2)
      .attr("dy", "0.35em")
      .style("text-anchor", "end")
      .style("font-size", "13px").style("font-weight", "bold").style("fill", "#333")
      .text(d => d.label);

    // Valor al final de la barra
    mainG.selectAll(".vlabel")
      .data(items).join("text").attr("class", "vlabel")
      .attr("x", d => xScale(d.value) + 8)
      .attr("y", d => yScale(d.label) + yScale.bandwidth() / 2)
      .attr("dy", "0.35em")
      .style("font-size", "13px").style("fill", "#444")
      .text(d => d3.format(".1f")(d.value));

    // Eje X base
    mainG.append("line")
      .attr("x1", 0).attr("x2", 0)
      .attr("y1", 0).attr("y2", innerH)
      .attr("stroke", "#bbb").attr("stroke-width", 1);
  }

  // ── Slider (compartido) ───────────────────────────────────────────────────
  const sliderY = H - 58;
  const sliderX0 = 60, sliderX1 = W - 60;
  const sliderWw = sliderX1 - sliderX0;
  const xSlider = d3.scalePoint().domain(years).range([sliderX0, sliderX1]);

  const sliderG = svg.append("g");

  const playBtn = sliderG.append("text")
    .attr("x", 24).attr("y", sliderY + 5)
    .style("font-size", "18px").style("cursor", "pointer").style("fill", "#555")
    .text("▶");

  sliderG.append("text").attr("x", sliderX0).attr("y", sliderY + 5)
    .style("font-size", "12px").style("fill", "#888").style("text-anchor", "middle")
    .text(years[0]);
  sliderG.append("text").attr("x", sliderX1).attr("y", sliderY + 5)
    .style("font-size", "12px").style("fill", "#888").style("text-anchor", "middle")
    .text(years[years.length - 1]);

  sliderG.append("line")
    .attr("x1", sliderX0).attr("x2", sliderX1)
    .attr("y1", sliderY).attr("y2", sliderY)
    .attr("stroke", "#ccc").attr("stroke-width", 4).attr("stroke-linecap", "round");

  const handle = sliderG.append("circle").attr("cy", sliderY).attr("r", 9)
    .attr("fill", "#555").style("cursor", "pointer");

  function updateYear(y) {
    currentYear = y;
    handle.attr("cx", xSlider(y));
    if (mode === "bar") renderBar();
  }

  updateYear(currentYear);

  sliderG.append("rect")
    .attr("x", sliderX0).attr("y", sliderY - 12)
    .attr("width", sliderWw).attr("height", 24)
    .attr("fill", "transparent").style("cursor", "pointer")
    .on("click", function(event) {
      const [mx] = d3.pointer(event);
      const closest = years.reduce((a, b) =>
        Math.abs(xSlider(a) - mx) < Math.abs(xSlider(b) - mx) ? a : b);
      updateYear(closest);
    });

  handle.call(d3.drag().on("drag", function(event) {
    const mx = Math.max(sliderX0, Math.min(sliderX1, event.x));
    const closest = years.reduce((a, b) =>
      Math.abs(xSlider(a) - mx) < Math.abs(xSlider(b) - mx) ? a : b);
    updateYear(closest);
  }));

  playBtn.on("click", () => {
    if (playing) { clearInterval(timer); playing = false; playBtn.text("▶"); }
    else {
      if (currentYear === years[years.length - 1]) updateYear(years[0]);
      playing = true; playBtn.text("⏸");
      timer = setInterval(() => {
        const idx = years.indexOf(currentYear);
        if (idx < years.length - 1) updateYear(years[idx + 1]);
        else { clearInterval(timer); playing = false; playBtn.text("▶"); }
      }, 120);
    }
  });

  // ── Mode switching ────────────────────────────────────────────────────────
  function setMode(m) {
    mode = m;
    btnLine.style("background", m === "line" ? "#3a6fc4" : "#fff").style("color", m === "line" ? "#fff" : "#333");
    btnBar .style("background", m === "bar"  ? "#3a6fc4" : "#fff").style("color", m === "bar"  ? "#fff" : "#333");
    // El slider solo es útil en bar (en line se ve toda la serie)
    sliderG.style("display", m === "line" ? "none" : null);
    hideTooltip();
    if (m === "line") renderLine();
    if (m === "bar")  renderBar();
  }

  btnLine.on("click", () => setMode("line"));
  btnBar .on("click", () => setMode("bar"));

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x", margin.left).attr("y", H - 20)
    .style("font-size", "10.5px").style("font-weight", "bold").style("fill", "#333")
    .text("Data source: ");
  svg.append("text").attr("x", margin.left + 80).attr("y", H - 20)
    .style("font-size", "10.5px").style("fill", "#333")
    .text("Human Mortality Database (2025); Human Fertility Database (2025) – processed by Our World in Data");
  svg.append("text").attr("x", margin.left).attr("y", H - 7)
    .style("font-size", "10px").style("fill", "#aaa")
    .text("OurWorldInData.org/population-growth | CC BY");

  // Arrancar en modo line
  setMode("line");

  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("births-and-deaths.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["births-and-deaths.csv", {url: new URL("./files/e229a323f2d907eb99ecd8a510236a6e289dc460b613b31d641922f6667f002c46fec78a085b9ea4342d5c3e56e080f0313246d3af1d9f073ba027b403da0a92.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
