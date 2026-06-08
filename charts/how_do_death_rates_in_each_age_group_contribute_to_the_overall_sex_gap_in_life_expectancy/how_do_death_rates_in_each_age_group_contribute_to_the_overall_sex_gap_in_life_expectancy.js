function _1(md){return(
md`# How do death rates in each age group contribute to the overall sex gap in life expectancy?`
)}

function _2(rawData,d3)
{
  const W = 900, H = 580;
  const margin = { top: 95, right: 160, bottom: 90, left: 55 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const country = "France";

  // Orden de apilado: de abajo a arriba (igual que OWID)
  const LAYERS = [
    { col: "Age 0 (infancy)", label: "Age 0 (infancy)", color: "#6b7fad" },
    { col: "Ages 1–14",       label: "Ages 1–14",       color: "#45B8C5" },
    { col: "Ages 15–39",      label: "Ages 15–39",       color: "#3AA87A" },
    { col: "Ages 40–59",      label: "Ages 40–59",       color: "#A8C45A" },
    { col: "Ages 60–79",      label: "Ages 60–79",       color: "#C8A048" },
    { col: "Ages 80+",        label: "Ages 80+",         color: "#C07050" },
  ];

  // ── Datos ─────────────────────────────────────────────────────────────────
  const rows = rawData
    .filter(d => d.Entity === country)
    .map(d => {
      const r = { year: +d.Year };
      LAYERS.forEach(l => { r[l.col] = d[l.col] != null && d[l.col] !== "" ? +d[l.col] : 0; });
      return r;
    })
    .sort((a,b) => a.year - b.year);

  const years = rows.map(r => r.year);

  // Stack D3 con valores pos y neg separados
  // Para áreas apiladas con negativos usamos d3.stack con offset diverging
  const stackKeys = LAYERS.map(l => l.col);
  const stack = d3.stack()
    .keys(stackKeys)
    .offset(d3.stackOffsetDiverging);

  const stacked = stack(rows);

  // Rango Y
  const allY = stacked.flatMap(s => s.flatMap(d => [d[0], d[1]]));
  const yMin = Math.floor(d3.min(allY) * 1.1);
  const yMax = Math.ceil(d3.max(allY) * 1.05);

  // ── Slider range ──────────────────────────────────────────────────────────
  let yearStart = years[0];
  let yearEnd   = years[years.length - 1];

  // ── Contenedor ────────────────────────────────────────────────────────────
  const container = d3.create("div").style("font-family","sans-serif").style("user-select","none");

  const svg = container.append("svg")
    .attr("viewBox",`0 0 ${W} ${H}`)
    .attr("width",W).attr("height",H)
    .style("background","#fff");

  svg.append("text").attr("x", margin.left).attr("y", 20)
    .style("font-size","15px").style("font-weight","bold").style("fill","#111")
    .text(`How do death rates in each age group contribute to the overall sex gap in life expectancy? ${country}`);

  svg.append("foreignObject").attr("x", margin.left).attr("y", 26)
    .attr("width", W - margin.left - 10).attr("height", 50)
    .append("xhtml:div").style("font-size","11px").style("color","#555").style("line-height","1.5")
    .text("The total height of the curve shows the total sex gap in life expectancy in years (female minus male). Positive values indicate higher life expectancy in females. The stacked areas show how the gap arises from sex differences in death rates in each age group.");

  const mainG = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 8px rgba(0,0,0,0.15))");
  const ttTitle = ttG.append("text").attr("x",12).attr("y",20)
    .style("font-size","13px").style("font-weight","bold").style("fill","#111");
  const ttUnit = ttG.append("text").attr("x",12).attr("y",34)
    .style("font-size","10px").style("fill","#888").text("contribution to sex gap (years)");

  function showTooltip(year, rowData, mx, my) {
    ttTitle.text(`${country}, ${year}`);
    ttG.selectAll(".ttrow").remove();
    let total = 0;
    [...LAYERS].reverse().forEach((l, i) => {
      const v = rowData[l.col] || 0;
      total += v;
      ttG.append("rect").attr("class","ttrow")
        .attr("x",12).attr("y", 44 + i*16).attr("width",10).attr("height",10)
        .attr("fill",l.color).attr("rx",2);
      ttG.append("text").attr("class","ttrow")
        .attr("x",26).attr("y", 52 + i*16)
        .style("font-size","11px").style("fill","#333")
        .text(`${l.label}: ${d3.format(".2f")(v)}`);
    });
    // Total
    ttG.append("line").attr("class","ttrow")
      .attr("x1",12).attr("x2",210).attr("y1", 44 + LAYERS.length*16 + 2).attr("y2", 44 + LAYERS.length*16 + 2)
      .attr("stroke","#ddd");
    ttG.append("text").attr("class","ttrow")
      .attr("x",12).attr("y", 44 + LAYERS.length*16 + 16)
      .style("font-size","11px").style("font-weight","bold").style("fill","#111")
      .text(`Total: ${d3.format(".2f")(total)} years`);

    const ttH = 44 + LAYERS.length*16 + 26;
    const ttW = 220;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 12;
    const ty = Math.max(0, Math.min(my - 30, H - ttH - 10));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }
  function hideTooltip() { ttG.style("display","none"); }

  // ── Línea vertical hover ──────────────────────────────────────────────────
  const hoverLine = mainG.append("line").attr("stroke","#888").attr("stroke-width",1)
    .style("display","none");

  // ── RENDER ────────────────────────────────────────────────────────────────
  function render() {
    mainG.selectAll(".areaEl,.axisEl,.gridEl,.hoverRect").remove();

    const visRows = rows.filter(r => r.year >= yearStart && r.year <= yearEnd);
    if (!visRows.length) return;

    const xScale = d3.scaleLinear()
      .domain([yearStart, yearEnd]).range([0, innerW]);
    const yScale = d3.scaleLinear()
      .domain([yMin, yMax]).range([innerH, 0]);

    // Gridlines Y
    d3.range(Math.ceil(yMin/5)*5, yMax+1, 5).forEach(v => {
      mainG.append("line").attr("class","gridEl")
        .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
        .attr("stroke","#e0e0e0").attr("stroke-dasharray","4,3").attr("stroke-width",1);
      mainG.append("text").attr("class","axisEl")
        .attr("x",-8).attr("y",yScale(v)).attr("dy","0.35em")
        .style("font-size","11px").style("fill","#888").style("text-anchor","end").text(v);
    });

    // Línea 0
    mainG.append("line").attr("class","gridEl")
      .attr("x1",0).attr("x2",innerW).attr("y1",yScale(0)).attr("y2",yScale(0))
      .attr("stroke","#aaa").attr("stroke-width",1.5);

    // Eje X
    const span = yearEnd - yearStart;
    const tickStep = span <= 50 ? 5 : span <= 150 ? 20 : 50;
    const xTicks = d3.range(Math.ceil(yearStart/tickStep)*tickStep, yearEnd+1, tickStep);
    [...new Set([yearStart, ...xTicks, yearEnd])].forEach(y => {
      mainG.append("text").attr("class","axisEl")
        .attr("x",xScale(y)).attr("y",innerH+18)
        .style("font-size","11px").style("fill","#888").style("text-anchor","middle").text(y);
    });
    mainG.append("line").attr("class","axisEl")
      .attr("x1",0).attr("x2",innerW).attr("y1",innerH).attr("y2",innerH)
      .attr("stroke","#bbb").attr("stroke-width",1);

    // Re-stack solo los años visibles
    const visStacked = d3.stack().keys(stackKeys).offset(d3.stackOffsetDiverging)(visRows);

    // Áreas
    visStacked.forEach((layer, li) => {
      const areaGen = d3.area()
        .x(d => xScale(d.data.year))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]))
        .curve(d3.curveMonotoneX);

      mainG.append("path").attr("class","areaEl")
        .datum(layer)
        .attr("fill", LAYERS[li].color)
        .attr("opacity", 0.85)
        .attr("d", areaGen);
    });

    // Línea total (suma de todas las capas)
    const totalLine = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(LAYERS.reduce((s,l) => s + (d[l.col]||0), 0)))
      .curve(d3.curveMonotoneX);

    mainG.append("path").attr("class","areaEl")
      .datum(visRows)
      .attr("fill","none")
      .attr("stroke","#555")
      .attr("stroke-width",1)
      .attr("d", totalLine);

    // Leyenda inline al final (derecha)
    const lastRow = visRows[visRows.length-1];
    let cumPos = 0, cumNeg = 0;
    [...LAYERS].reverse().forEach((l) => {
      const v = lastRow[l.col] || 0;
      const mid = v >= 0
        ? (cumPos + v/2)
        : (cumNeg + v/2);
      if (v >= 0) cumPos += v; else cumNeg += v;
      const total = LAYERS.reduce((s,ll) => s+(lastRow[ll.col]||0), 0);
      mainG.append("text").attr("class","areaEl")
        .attr("x", xScale(lastRow.year) + 8)
        .attr("y", yScale(v >= 0 ? (cumPos - v/2) : (cumNeg - v/2)))
        .attr("dy","0.35em")
        .style("font-size","11px").style("font-weight","bold")
        .style("fill", l.color).text(l.label);
    });

    // Zona interactiva
    mainG.append("rect").attr("class","hoverRect")
      .attr("width",innerW).attr("height",innerH).attr("fill","transparent")
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event);
        const yearHov = xScale.invert(mx);
        const closest = visRows.reduce((a,b) => Math.abs(a.year-yearHov)<Math.abs(b.year-yearHov)?a:b);
        hoverLine.attr("x1",xScale(closest.year)).attr("x2",xScale(closest.year))
          .attr("y1",0).attr("y2",innerH).style("display",null);
        const [sx,sy] = d3.pointer(event, svg.node());
        showTooltip(closest.year, closest, sx, sy);
      })
      .on("mouseleave", () => { hoverLine.style("display","none"); hideTooltip(); });
  }

  render();

  // ── Slider dos handles ────────────────────────────────────────────────────
  const sliderY = H - 50;
  const sliderX0 = 90, sliderX1 = W - 60;
  const xSlider = d3.scalePoint().domain(years).range([sliderX0, sliderX1]);
  const sliderG = svg.append("g");

  let playing = false, timer = null;

  const playBtn = sliderG.append("text").attr("x",24).attr("y",sliderY+5)
    .style("font-size","18px").style("cursor","pointer").style("fill","#555").text("▶");

  sliderG.append("text").attr("x",sliderX0).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(years[0]);
  sliderG.append("text").attr("x",sliderX1).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(years[years.length-1]);

  sliderG.append("line").attr("x1",sliderX0).attr("x2",sliderX1)
    .attr("y1",sliderY).attr("y2",sliderY)
    .attr("stroke","#ccc").attr("stroke-width",4).attr("stroke-linecap","round");

  const handleL = sliderG.append("circle").attr("cy",sliderY).attr("r",9)
    .attr("fill","#555").style("cursor","ew-resize");
  const handleR = sliderG.append("circle").attr("cy",sliderY).attr("r",9)
    .attr("fill","#555").style("cursor","ew-resize");

  function positionHandles() {
    handleL.attr("cx", xSlider(yearStart));
    handleR.attr("cx", xSlider(yearEnd));
  }
  positionHandles();

  handleL.call(d3.drag().on("drag", function(event) {
    const mx = Math.max(sliderX0, Math.min(xSlider(yearEnd)-10, event.x));
    const y = years.reduce((a,b) => Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b);
    if (y < yearEnd) { yearStart=y; positionHandles(); render(); }
  }));
  handleR.call(d3.drag().on("drag", function(event) {
    const mx = Math.max(xSlider(yearStart)+10, Math.min(sliderX1, event.x));
    const y = years.reduce((a,b) => Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b);
    if (y > yearStart) { yearEnd=y; positionHandles(); render(); }
  }));

  sliderG.append("rect").attr("x",sliderX0).attr("y",sliderY-12)
    .attr("width",sliderX1-sliderX0).attr("height",24)
    .attr("fill","transparent").style("cursor","pointer")
    .on("click", function(event) {
      const [mx] = d3.pointer(event);
      const y = years.reduce((a,b) => Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b);
      const dL = Math.abs(xSlider(yearStart)-mx), dR = Math.abs(xSlider(yearEnd)-mx);
      if (dL < dR) yearStart=y; else yearEnd=y;
      positionHandles(); render();
    });

  playBtn.on("click", () => {
    if (playing) { clearInterval(timer); playing=false; playBtn.text("▶"); }
    else {
      if (yearEnd >= years[years.length-1]) { yearEnd=yearStart; positionHandles(); render(); }
      playing=true; playBtn.text("⏸");
      timer = setInterval(() => {
        const idx = years.indexOf(yearEnd);
        if (idx < years.length-1) { yearEnd=years[idx+1]; positionHandles(); render(); }
        else { clearInterval(timer); playing=false; playBtn.text("▶"); }
      }, 80);
    }
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",margin.left).attr("y",H-18)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",margin.left+80).attr("y",H-18)
    .style("font-size","10.5px").style("fill","#333")
    .text("Zarulli et al. (2021) – processed by Our World in Data");
  svg.append("text").attr("x",margin.left).attr("y",H-5)
    .style("font-size","10px").style("fill","#aaa")
    .text("OurWorldInData.org/life-expectancy | CC BY");

  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("gender-gap-in-life-expectancy-by-age-group.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["gender-gap-in-life-expectancy-by-age-group.csv", {url: new URL("./files/b46ddef49222fd79787c19e4456a9a874198b6925624432da68a80c54293c2056b3670475d4fc0e7cdd1b0be741e66d52beb9c59a9fa53c4eb394f4c83558d01.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
