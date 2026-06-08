function _1(md){return(
md`# World population, comparison of UN projections`
)}

function _2(d3,rawData)
{
  const W = 900, H = 580;
  const margin = { top: 75, right: 180, bottom: 100, left: 70 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  // Todas las series disponibles en el CSV, en el orden de la leyenda
  const SERIES = [
    { col: "2017 projection",       label: "2017 projection" },
    { col: "2019 projection",       label: "2019 projection" },
    { col: "2022 projection",       label: "2022 projection" },
    { col: "2024 projection",       label: "2024 projection" },
    { col: "2012 projection",       label: "2012 projection" },
    { col: "2002 projection",       label: "2002 projection" },
    { col: "1998 projection",       label: "1998 projection" },
    { col: "1990 projection",       label: "1990 projection" },
    { col: "1984 projection",       label: "1984 projection" },
    { col: "1982 projection",       label: "1982 projection" },
    { col: "Latest observed data",  label: "Latest observed data" },
    { col: "1968 projection",       label: "1968 projection" },
    { col: "1973 projection",       label: "1973 projection" },
    { col: "1980 projection",       label: "1980 projection" },
  ];

  // Colores: las proyecciones recientes en azul oscuro, las antiguas en azul claro,
  // "Latest observed data" en rojo/rosa (igual que OWID)
  const colorOf = (col) => {
    if (col === "Latest observed data") return "#C0306A";
    const projYear = parseInt(col);
    // Escala: 1968 (más claro) → 2024 (más oscuro)
    const t = (projYear - 1968) / (2024 - 1968);
    return d3.interpolateRgb("#b0b8d8", "#1a2a6c")(t);
  };

  let mode = "line";
  let playing = false;
  let timer = null;

  // ── Datos ─────────────────────────────────────────────────────────────────
  const rows = rawData.filter(d => d.Entity === "World");
  const years = [...new Set(rows.map(d => +d.Year))].sort((a, b) => a - b);
  let currentYear = years[years.length - 1];

  // byYear: Map<year, { col -> value }>
  const byYear = new Map(rows.map(r => [+r.Year, r]));

  // Para cada serie, lista de {year, value} con valor en billones
  const seriesData = SERIES.map(s => ({
    ...s,
    color: colorOf(s.col),
    points: rows
      .map(r => ({ year: +r.Year, value: r[s.col] !== "" && r[s.col] != null ? +r[s.col] / 1e9 : null }))
      .filter(d => d.value != null)
  }));

  // ── Contenedor ────────────────────────────────────────────────────────────
  const container = d3.create("div").style("font-family", "sans-serif").style("user-select", "none");

  const btnRow = container.append("div").style("display","flex").style("gap","6px").style("margin-bottom","6px");
  const mkBtn = (label, active) => btnRow.append("button").text(label)
    .style("padding","4px 14px").style("border","1px solid #ccc").style("border-radius","4px")
    .style("cursor","pointer").style("font-size","13px")
    .style("background", active ? "#3a6fc4" : "#fff")
    .style("color",      active ? "#fff"    : "#333");

  const btnLine = mkBtn("📈 Line", true);
  const btnBar  = mkBtn("📊 Bar",  false);

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", W).attr("height", H)
    .style("background", "#fff");

  const titleEl = svg.append("text").attr("x", margin.left).attr("y", 22)
    .style("font-size","17px").style("font-weight","bold").style("fill","#111");

  svg.append("foreignObject").attr("x", margin.left).attr("y", 28)
    .attr("width", W - margin.left - 10).attr("height", 36)
    .append("xhtml:div").style("font-size","11px").style("color","#555").style("line-height","1.4")
    .text("World population projections from historical editions of the United Nations Population Prospects. All projections are based on the UN medium scenario. Also shown is the observed UN data from the last edition.");

  const mainG = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 6px rgba(0,0,0,0.13))");
  const ttTitle = ttG.append("text").attr("x",12).attr("y",20)
    .style("font-size","13px").style("font-weight","bold").style("fill","#111");

  function showTooltip(year, items, mx, my) {
    ttTitle.text(`Year: ${year}`);
    ttG.selectAll(".ttrow").remove();
    items.forEach((item, i) => {
      ttG.append("text").attr("class","ttrow")
        .attr("x",12).attr("y", 36 + i * 16)
        .style("font-size","11px").style("fill", item.color)
        .text(`${item.label}: ${d3.format(".2f")(item.value)}B`);
    });
    const ttH = 28 + items.length * 16;
    const ttW = 200;
    ttBg.attr("width", ttW).attr("height", ttH);
    ttG.style("display", null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 12;
    const ty = Math.max(0, Math.min(my - 20, H - ttH - 10));
    ttG.attr("transform", `translate(${tx},${ty})`);
  }
  function hideTooltip() { ttG.style("display","none"); }

  // ── RENDER LINE ───────────────────────────────────────────────────────────
  function renderLine() {
    mainG.selectAll("*").remove();
    titleEl.text("World population, comparison of UN projections");

    const allVals = seriesData.flatMap(s => s.points.map(p => p.value));
    const yMax = Math.ceil(d3.max(allVals) * 1.05);

    const xScale = d3.scaleLinear().domain(d3.extent(years)).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);

    // Gridlines + Y axis
    [0, 2, 4, 6, 8, 10].forEach(v => {
      mainG.append("line")
        .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
        .attr("stroke", v === 0 ? "#999" : "#e0e0e0")
        .attr("stroke-dasharray", v === 0 ? "0" : "4,3").attr("stroke-width",1);
      mainG.append("text")
        .attr("x",-8).attr("y",yScale(v)).attr("dy","0.35em")
        .style("font-size","11px").style("fill","#888").style("text-anchor","end")
        .text(v === 0 ? "0" : `${v} billion`);
    });

    // X axis
    const xTicks = years.filter(y => y % 10 === 0);
    xTicks.forEach(y => {
      mainG.append("text")
        .attr("x",xScale(y)).attr("y",innerH + 18)
        .style("font-size","11px").style("fill","#888").style("text-anchor","middle").text(y);
    });
    mainG.append("line").attr("x1",0).attr("x2",innerW)
      .attr("y1",innerH).attr("y2",innerH).attr("stroke","#bbb").attr("stroke-width",1);

    const lineGen = d3.line().x(d => xScale(d.year)).y(d => yScale(d.value)).curve(d3.curveMonotoneX);

    // Dibujar líneas (las antiguas primero para que las recientes queden encima)
    [...seriesData].reverse().forEach(s => {
      if (!s.points.length) return;
      mainG.append("path").datum(s.points)
        .attr("fill","none").attr("stroke", s.color)
        .attr("stroke-width", s.col === "Latest observed data" ? 2.5 : 1.5)
        .attr("stroke-dasharray", s.col === "Latest observed data" ? "0" : "0")
        .attr("d", lineGen);

      // Puntos cada 5 años
      s.points.filter(p => p.year % 5 === 0).forEach(p => {
        mainG.append("circle")
          .attr("cx", xScale(p.year)).attr("cy", yScale(p.value))
          .attr("r", s.col === "Latest observed data" ? 3.5 : 2.5)
          .attr("fill", s.color);
      });
    });

    // Leyenda lateral
    const legG = mainG.append("g").attr("transform", `translate(${innerW + 10}, 0)`);
    seriesData.forEach((s, i) => {
      legG.append("line")
        .attr("x1",0).attr("x2",14).attr("y1", i * 18 + 4).attr("y2", i * 18 + 4)
        .attr("stroke", s.color).attr("stroke-width", s.col === "Latest observed data" ? 2.5 : 1.5);
      legG.append("text")
        .attr("x",18).attr("y", i * 18 + 8)
        .style("font-size","11px")
        .style("font-weight", s.col === "2024 projection" ? "bold" : "normal")
        .style("fill", s.color)
        .text(s.label);
    });

    // Zona interactiva
    mainG.append("rect").attr("width",innerW).attr("height",innerH)
      .attr("fill","transparent")
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event);
        const year = Math.round(xScale.invert(mx));
        const closest = years.reduce((a,b) => Math.abs(a-year)<Math.abs(b-year)?a:b);
        const row = byYear.get(closest);
        if (!row) return hideTooltip();
        const items = seriesData
          .map(s => ({ label: s.label, color: s.color, value: row[s.col] !== "" && row[s.col] != null ? +row[s.col]/1e9 : null }))
          .filter(d => d.value != null);
        const [sx,sy] = d3.pointer(event, svg.node());
        showTooltip(closest, items, sx, sy);
      })
      .on("mouseleave", hideTooltip);
  }

  // ── RENDER BAR ────────────────────────────────────────────────────────────
  function renderBar() {
    mainG.selectAll("*").remove();
    titleEl.text(`World population, comparison of UN projections, ${currentYear}`);

    const row = byYear.get(currentYear);
    const barData = seriesData
      .map(s => ({ label: s.label, color: s.color, value: row && row[s.col] !== "" && row[s.col] != null ? +row[s.col]/1e9 : null }))
      .filter(d => d.value != null && d.label !== "Latest observed data")
      .sort((a,b) => b.value - a.value);

    if (!barData.length) {
      mainG.append("text").attr("x", innerW/2).attr("y", innerH/2)
        .style("text-anchor","middle").style("fill","#888").style("font-size","14px")
        .text("No projection data for this year");
      return;
    }

    const maxVal = d3.max(barData, d => d.value) * 1.1;
    const xScale = d3.scaleLinear().domain([0, maxVal]).range([0, innerW]);
    const yScale = d3.scaleBand().domain(barData.map(d => d.label))
      .range([0, innerH]).padding(0.28);

    barData.forEach(d => {
      mainG.append("rect")
        .attr("x",0).attr("y", yScale(d.label))
        .attr("width", xScale(d.value)).attr("height", yScale.bandwidth())
        .attr("fill", d.color);

      mainG.append("text")
        .attr("x",-10).attr("y", yScale(d.label) + yScale.bandwidth()/2).attr("dy","0.35em")
        .style("text-anchor","end").style("font-size","12px").style("font-weight","bold").style("fill","#333")
        .text(d.label);

      mainG.append("text")
        .attr("x", xScale(d.value)+8).attr("y", yScale(d.label) + yScale.bandwidth()/2).attr("dy","0.35em")
        .style("font-size","12px").style("fill","#444")
        .text(`${d3.format(".2f")(d.value)} billion`);
    });

    mainG.append("line").attr("x1",0).attr("x2",0).attr("y1",0).attr("y2",innerH)
      .attr("stroke","#bbb").attr("stroke-width",1);
  }

  // ── Slider ────────────────────────────────────────────────────────────────
  const sliderY = H - 58;
  const sliderX0 = 60, sliderX1 = W - 60;
  const xSlider = d3.scalePoint().domain(years).range([sliderX0, sliderX1]);
  const sliderG = svg.append("g");

  const playBtn = sliderG.append("text").attr("x",24).attr("y",sliderY+5)
    .style("font-size","18px").style("cursor","pointer").style("fill","#555").text("▶");

  sliderG.append("text").attr("x",sliderX0).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(years[0]);
  sliderG.append("text").attr("x",sliderX1).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(years[years.length-1]);
  sliderG.append("line").attr("x1",sliderX0).attr("x2",sliderX1)
    .attr("y1",sliderY).attr("y2",sliderY).attr("stroke","#ccc").attr("stroke-width",4).attr("stroke-linecap","round");

  const handle = sliderG.append("circle").attr("cy",sliderY).attr("r",9)
    .attr("fill","#555").style("cursor","pointer");

  function updateYear(y) {
    currentYear = y;
    handle.attr("cx", xSlider(y));
    if (mode === "bar") renderBar();
  }

  updateYear(currentYear);

  sliderG.append("rect").attr("x",sliderX0).attr("y",sliderY-12)
    .attr("width", sliderX1-sliderX0).attr("height",24).attr("fill","transparent").style("cursor","pointer")
    .on("click", function(event) {
      const [mx] = d3.pointer(event);
      updateYear(years.reduce((a,b) => Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
    });

  handle.call(d3.drag().on("drag", function(event) {
    const mx = Math.max(sliderX0, Math.min(sliderX1, event.x));
    updateYear(years.reduce((a,b) => Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
  }));

  playBtn.on("click", () => {
    if (playing) { clearInterval(timer); playing=false; playBtn.text("▶"); }
    else {
      if (currentYear === years[years.length-1]) updateYear(years[0]);
      playing=true; playBtn.text("⏸");
      timer = setInterval(() => {
        const idx = years.indexOf(currentYear);
        if (idx < years.length-1) updateYear(years[idx+1]);
        else { clearInterval(timer); playing=false; playBtn.text("▶"); }
      }, 150);
    }
  });

  // ── Mode switching ────────────────────────────────────────────────────────
  function setMode(m) {
    mode = m;
    btnLine.style("background", m==="line"?"#3a6fc4":"#fff").style("color", m==="line"?"#fff":"#333");
    btnBar .style("background", m==="bar" ?"#3a6fc4":"#fff").style("color", m==="bar" ?"#fff":"#333");
    sliderG.style("display", m==="line" ? "none" : null);
    hideTooltip();
    if (m==="line") renderLine();
    if (m==="bar")  renderBar();
  }

  btnLine.on("click", () => setMode("line"));
  btnBar .on("click", () => setMode("bar"));

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",margin.left).attr("y",H-20)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",margin.left+80).attr("y",H-20)
    .style("font-size","10.5px").style("fill","#333")
    .text("UN, World Population Prospects (1968 - 2024) – processed by Our World in Data");
  svg.append("text").attr("x",margin.left).attr("y",H-7)
    .style("font-size","10px").style("fill","#aaa").text("OurWorldInData.org/population-growth | CC BY");

  setMode("line");
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("world-population-projections-by-un-prospects-revision.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["world-population-projections-by-un-prospects-revision.csv", {url: new URL("./files/0c69e90ec26df4577659e8d1cec8bd5a51c22ab2e1d9ac51ebf313690ddde3dc9b5c9888408e4bb6b0ad19f1c1dac8883a1046301614dd620625def87532173c.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["d3","rawData"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
