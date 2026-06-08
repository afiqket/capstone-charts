function _1(md){return(
md`# World population, comparison of different historical sources`
)}

function _2(rawData,d3)
{
  const W = 900, H = 560;
  const margin = { top: 70, right: 220, bottom: 100, left: 90 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  // Las 6 fuentes seleccionadas (igual que OWID por defecto)
  const SELECTED = [
    "Maddison (1991)",
    "Durand (1977)",
    "Thomlinson (1975)",
    "Tuve (1976)",
    "McEvedy and Jones (1978)",
  ];

  const COLORS = [
    "#3B7A57",  // Maddison
    "#5B8DB8",  // Durand lower
    "#C0392B",  // Durand upper / Thomlinson upper
    "#8E44AD",  // Tuve
    "#B7860B",  // McEvedy
  ];

  // Fuentes reales presentes en el CSV
  const allEntities = [...new Set(rawData.map(d => d.Entity))].sort();

  // Selección inicial: las que existan en los datos
  let selectedSources = allEntities.filter(e =>
    SELECTED.some(s => e.includes(s.split(" ")[0]))
  ).slice(0, 8);

  // Si no hay match, coger las primeras 6
  if (!selectedSources.length) selectedSources = allEntities.slice(0, 6);

  // Paleta de colores por fuente
  const palette = [
    "#8E44AD","#B7860B","#C0392B","#5B8DB8","#3B7A57",
    "#E67E22","#2980B9","#E91E63","#607D8B","#00796B"
  ];
  const colorOf = (entity) => {
    const idx = allEntities.indexOf(entity) % palette.length;
    return palette[idx];
  };

  let mode = "line";
  let playing = false;
  let timer = null;

  // ── Datos por fuente ──────────────────────────────────────────────────────
  // Map<entity, [{year, value}]>
  const dataByEntity = new Map();
  allEntities.forEach(e => {
    dataByEntity.set(e, rawData
      .filter(d => d.Entity === e && d["World population"] != null && d["World population"] !== "")
      .map(d => ({ year: +d.Year, value: +d["World population"] / 1e9 }))
      .sort((a, b) => a.year - b.year)
    );
  });

  // Todos los años disponibles para el slider
  const allYears = [...new Set(rawData.map(d => +d.Year))].sort((a, b) => a - b);
  let currentYear = allYears[allYears.length - 1];

  // ── Formato eje Y ─────────────────────────────────────────────────────────
  function fmtBillion(v) {
    if (v >= 1) return `${d3.format(".1~f")(v)} billion`;
    if (v >= 0.001) return `${d3.format(".0f")(v * 1000)} million`;
    return `${d3.format(".0f")(v * 1e6)}k`;
  }

  // ── Contenedor ────────────────────────────────────────────────────────────
  const container = d3.create("div").style("font-family","sans-serif").style("user-select","none");

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
    .style("background","#fff");

  const titleEl = svg.append("text").attr("x", margin.left).attr("y", 22)
    .style("font-size","17px").style("font-weight","bold").style("fill","#111");

  svg.append("foreignObject").attr("x", margin.left).attr("y", 28)
    .attr("width", W - margin.left - 10).attr("height", 22)
    .append("xhtml:div").style("font-size","11px").style("color","#555")
    .text("Total world population.");

  const mainG = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 6px rgba(0,0,0,0.13))");
  const ttTitle = ttG.append("text").attr("x",12).attr("y",20)
    .style("font-size","13px").style("font-weight","bold").style("fill","#111");

  function showTooltip(year, items, mx, my) {
    const displayYear = year < 0 ? `${Math.abs(year)} BCE` : `${year}`;
    ttTitle.text(`Year: ${displayYear}`);
    ttG.selectAll(".ttrow").remove();
    items.forEach((item, i) => {
      ttG.append("text").attr("class","ttrow")
        .attr("x",12).attr("y", 36 + i * 16)
        .style("font-size","11px").style("fill", colorOf(item.entity))
        .text(`${item.entity}: ${fmtBillion(item.value)}`);
    });
    const ttH = 28 + items.length * 16;
    const ttW = 240;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 12;
    const ty = Math.max(0, Math.min(my - 20, H - ttH - 10));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }
  function hideTooltip() { ttG.style("display","none"); }

  // ── RENDER LINE ───────────────────────────────────────────────────────────
  function renderLine() {
    mainG.selectAll("*").remove();
    titleEl.text("World population, comparison of different historical sources");

    const visData = selectedSources.map(e => ({
      entity: e,
      points: dataByEntity.get(e) || []
    })).filter(s => s.points.length > 0);

    const allVals = visData.flatMap(s => s.points.map(p => p.value));
    const allYearsVis = visData.flatMap(s => s.points.map(p => p.year));
    const yMax = (d3.max(allVals) || 4) * 1.08;
    const xExtent = d3.extent(allYearsVis);

    const xScale = d3.scaleLinear().domain(xExtent).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);

    // Gridlines Y
    const yTicks = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].filter(v => v <= yMax * 1.05);
    yTicks.forEach(v => {
      mainG.append("line")
        .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
        .attr("stroke", v === 0 ? "#999" : "#e0e0e0")
        .attr("stroke-dasharray", v === 0 ? "0" : "4,3").attr("stroke-width",1);
      mainG.append("text")
        .attr("x",-8).attr("y",yScale(v)).attr("dy","0.35em")
        .style("font-size","11px").style("fill","#888").style("text-anchor","end")
        .text(v === 0 ? "0" : fmtBillion(v));
    });

    // X axis ticks
    const xTicks = xScale.ticks(8);
    xTicks.forEach(y => {
      mainG.append("text")
        .attr("x",xScale(y)).attr("y",innerH+18)
        .style("font-size","11px").style("fill","#888").style("text-anchor","middle")
        .text(y < 0 ? `${Math.abs(y)} BCE` : y);
    });
    mainG.append("line").attr("x1",0).attr("x2",innerW)
      .attr("y1",innerH).attr("y2",innerH).attr("stroke","#bbb").attr("stroke-width",1);

    const lineGen = d3.line().x(d => xScale(d.year)).y(d => yScale(d.value)).curve(d3.curveMonotoneX);

    // Líneas
    visData.forEach(s => {
      const color = colorOf(s.entity);
      mainG.append("path").datum(s.points)
        .attr("fill","none").attr("stroke",color).attr("stroke-width",1.8)
        .attr("d", lineGen);

      // Puntos
      s.points.forEach(p => {
        mainG.append("circle")
          .attr("cx",xScale(p.year)).attr("cy",yScale(p.value))
          .attr("r",3).attr("fill",color);
      });

      // Etiqueta al final
      const last = s.points[s.points.length - 1];
      mainG.append("text")
        .attr("x", xScale(last.year) + 6).attr("y", yScale(last.value))
        .attr("dy","0.35em").style("font-size","11px").style("font-weight","bold")
        .style("fill",color).text(s.entity);
    });

    // Zona interactiva
    mainG.append("rect").attr("width",innerW).attr("height",innerH)
      .attr("fill","transparent")
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event);
        const yearHover = xScale.invert(mx);
        // Para cada serie, punto más cercano
        const items = visData.map(s => {
          const closest = s.points.reduce((a,b) =>
            Math.abs(a.year - yearHover) < Math.abs(b.year - yearHover) ? a : b
          );
          return { entity: s.entity, value: closest.value, year: closest.year };
        }).filter(d => Math.abs(d.year - yearHover) < (xExtent[1]-xExtent[0]) * 0.05);
        if (!items.length) return hideTooltip();
        const [sx,sy] = d3.pointer(event, svg.node());
        showTooltip(items[0].year, items, sx, sy);
      })
      .on("mouseleave", hideTooltip);
  }

  // ── RENDER BAR ────────────────────────────────────────────────────────────
  function renderBar() {
    mainG.selectAll("*").remove();
    const displayYear = currentYear < 0 ? `${Math.abs(currentYear)} BCE` : `${currentYear}`;
    titleEl.text(`World population, comparison of different historical sources, ${displayYear}`);

    // Para el año seleccionado, valor de cada fuente (interpolando si hace falta)
    const barData = selectedSources.map(entity => {
      const pts = dataByEntity.get(entity) || [];
      // Buscar punto exacto o más cercano
      const exact = pts.find(p => p.year === currentYear);
      if (exact) return { entity, value: exact.value };
      // Más cercano
      if (!pts.length) return null;
      const closest = pts.reduce((a,b) =>
        Math.abs(a.year - currentYear) < Math.abs(b.year - currentYear) ? a : b
      );
      if (Math.abs(closest.year - currentYear) > 50) return null;
      return { entity, value: closest.value };
    }).filter(Boolean).sort((a,b) => b.value - a.value);

    if (!barData.length) {
      mainG.append("text").attr("x",innerW/2).attr("y",innerH/2)
        .style("text-anchor","middle").style("fill","#888").style("font-size","14px")
        .text("No data available for this year");
      return;
    }

    const maxVal = d3.max(barData, d => d.value) * 1.1;
    const xScale = d3.scaleLinear().domain([0, maxVal]).range([0, innerW]);
    const yScale = d3.scaleBand().domain(barData.map(d => d.entity))
      .range([0, innerH]).padding(0.3);

    barData.forEach(d => {
      const color = colorOf(d.entity);
      mainG.append("rect")
        .attr("x",0).attr("y",yScale(d.entity))
        .attr("width",xScale(d.value)).attr("height",yScale.bandwidth())
        .attr("fill",color).attr("opacity",0.8);
      mainG.append("text")
        .attr("x",-10).attr("y",yScale(d.entity)+yScale.bandwidth()/2).attr("dy","0.35em")
        .style("text-anchor","end").style("font-size","12px").style("font-weight","bold").style("fill","#333")
        .text(d.entity);
      mainG.append("text")
        .attr("x",xScale(d.value)+8).attr("y",yScale(d.entity)+yScale.bandwidth()/2).attr("dy","0.35em")
        .style("font-size","12px").style("fill","#444")
        .text(fmtBillion(d.value));
    });

    mainG.append("line").attr("x1",0).attr("x2",0).attr("y1",0).attr("y2",innerH)
      .attr("stroke","#bbb").attr("stroke-width",1);
  }

  // ── Slider ────────────────────────────────────────────────────────────────
  const sliderY = H - 58;
  const sliderX0 = 100, sliderX1 = W - 60;
  const xSlider = d3.scalePoint().domain(allYears).range([sliderX0, sliderX1]);
  const sliderG = svg.append("g");

  const playBtn = sliderG.append("text").attr("x",24).attr("y",sliderY+5)
    .style("font-size","18px").style("cursor","pointer").style("fill","#555").text("▶");

  const minLabel = allYears[0] < 0 ? `${Math.abs(allYears[0])} BCE` : `${allYears[0]}`;
  sliderG.append("text").attr("x",sliderX0).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(minLabel);
  sliderG.append("text").attr("x",sliderX1).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(allYears[allYears.length-1]);

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
    .attr("width",sliderX1-sliderX0).attr("height",24).attr("fill","transparent").style("cursor","pointer")
    .on("click", function(event) {
      const [mx] = d3.pointer(event);
      updateYear(allYears.reduce((a,b) => Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
    });

  handle.call(d3.drag().on("drag", function(event) {
    const mx = Math.max(sliderX0, Math.min(sliderX1, event.x));
    updateYear(allYears.reduce((a,b) => Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
  }));

  playBtn.on("click", () => {
    if (playing) { clearInterval(timer); playing=false; playBtn.text("▶"); }
    else {
      if (currentYear === allYears[allYears.length-1]) updateYear(allYears[0]);
      playing=true; playBtn.text("⏸");
      timer = setInterval(() => {
        const idx = allYears.indexOf(currentYear);
        if (idx < allYears.length-1) updateYear(allYears[idx+1]);
        else { clearInterval(timer); playing=false; playBtn.text("▶"); }
      }, 300);
    }
  });

  // ── Mode switching ────────────────────────────────────────────────────────
  function setMode(m) {
    mode = m;
    btnLine.style("background",m==="line"?"#3a6fc4":"#fff").style("color",m==="line"?"#fff":"#333");
    btnBar .style("background",m==="bar" ?"#3a6fc4":"#fff").style("color",m==="bar" ?"#fff":"#333");
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
    .text("Multiple sources compiled by Our World in Data (2019) and other sources – with major processing by Our World in Data");
  svg.append("text").attr("x",margin.left).attr("y",H-7)
    .style("font-size","10px").style("fill","#aaa").text("OurWorldInData.org/population-growth | CC BY");

  setMode("line");
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("world-population-comparison-historical-sources.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["world-population-comparison-historical-sources.csv", {url: new URL("./files/8abbce88679a4a7197e5a849c271f02e75acce989e279d6e3e1ed2d8e5ae1642ad143bd77d1627c4a9cc8fcbb98486168fa8f52951f247995b53c8d07274642c.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
