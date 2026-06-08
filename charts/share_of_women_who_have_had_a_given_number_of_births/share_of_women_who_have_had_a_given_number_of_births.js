function _1(md){return(
md`# Share of women who have had a given number of births`
)}

function _2(rawData,d3)
{
  const W = 900, H = 560;
  const margin = { top: 70, right: 160, bottom: 90, left: 60 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const country = "United States";

  // De abajo a arriba: 4+, 3, 2, 1, 0
  const LAYERS = [
    { col: "4 births or more", label: "4 births or more", color: "#9B3A8A" },
    { col: "3 births",         label: "3 births",         color: "#C070B0" },
    { col: "2 births",         label: "2 births",         color: "#7B8EC8" },
    { col: "1 birth",          label: "1 birth",          color: "#A8C0DC" },
    { col: "No births",        label: "No births",        color: "#D8E8F4" },
  ];

  const rows = rawData
    .filter(d => d.Entity === country)
    .map(d => {
      const r = { year: +d.Year };
      LAYERS.forEach(l => { r[l.col] = d[l.col] != null && d[l.col] !== "" ? +d[l.col] : null; });
      return r;
    })
    .sort((a,b) => a.year - b.year);

  const years = rows.map(r => r.year);

  // Stack — los valores ya suman ~100%, usar stackOffsetNone
  const stack = d3.stack()
    .keys(LAYERS.map(l => l.col))
    .value((d, key) => d[key] || 0)
    .offset(d3.stackOffsetNone);

  const stacked = stack(rows);

  // Rango slider
  let yearStart = years[0];
  let yearEnd   = years[years.length - 1];

  let playing = false, timer = null;

  const container = d3.create("div").style("font-family","sans-serif").style("user-select","none");

  const svg = container.append("svg")
    .attr("viewBox",`0 0 ${W} ${H}`)
    .attr("width",W).attr("height",H)
    .style("background","#fff");

  svg.append("text").attr("x", margin.left).attr("y", 22)
    .style("font-size","16px").style("font-weight","bold").style("fill","#111")
    .text(`Share of women who have had a given number of births, ${country}`);

  svg.append("text").attr("x", margin.left).attr("y", 38)
    .style("font-size","11px").style("fill","#555")
    .text("The share of women who have had a given number of births by the end of their childbearing years.");

  const mainG = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 8px rgba(0,0,0,0.15))");
  const ttTitle = ttG.append("text").attr("x",14).attr("y",22)
    .style("font-size","13px").style("font-weight","bold").style("fill","#111");
  const ttSub = ttG.append("text").attr("x",14).attr("y",36)
    .style("font-size","10px").style("fill","#888").text("(Women's birth year)");

  function showTooltip(year, rowData, hoveredCol, mx, my) {
    ttTitle.text(year);
    ttG.selectAll(".ttrow").remove();
    // Mostrar de arriba (No births) a abajo (4+)
    [...LAYERS].reverse().forEach((l, i) => {
      const v = rowData[l.col];
      if (v == null) return;
      const isBold = l.col === hoveredCol;
      ttG.append("rect").attr("class","ttrow")
        .attr("x",14).attr("y", 46 + i*20).attr("width",12).attr("height",12)
        .attr("fill",l.color).attr("rx",2);
      ttG.append("text").attr("class","ttrow")
        .attr("x",30).attr("y", 56 + i*20)
        .style("font-size","11px").style("font-weight",isBold?"bold":"normal").style("fill","#333")
        .text(l.label);
      ttG.append("text").attr("class","ttrow")
        .attr("x",200).attr("y", 56 + i*20)
        .style("font-size","11px").style("font-weight",isBold?"bold":"normal").style("fill","#111")
        .style("text-anchor","end")
        .text(`${d3.format(".2f")(v)}%`);
    });
    const ttH = 46 + LAYERS.length * 20 + 8;
    const ttW = 215;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 12;
    const ty = Math.max(0, Math.min(my - 40, H - ttH - 10));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }
  function hideTooltip() { ttG.style("display","none"); }

  // ── Línea vertical hover ──────────────────────────────────────────────────
  const hoverLine = mainG.append("line").attr("stroke","#888").attr("stroke-width",1)
    .style("display","none");
  const hoverDots = LAYERS.map(l =>
    mainG.append("circle").attr("r",4).attr("fill",l.color)
      .attr("stroke","white").attr("stroke-width",1.5).style("display","none")
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  function render() {
    mainG.selectAll(".areaEl,.axisEl,.gridEl,.hoverRect").remove();

    const visRows = rows.filter(r => r.year >= yearStart && r.year <= yearEnd);
    if (!visRows.length) return;

    const visStacked = d3.stack()
      .keys(LAYERS.map(l => l.col))
      .value((d, key) => d[key] || 0)
      .offset(d3.stackOffsetNone)(visRows);

    const xScale = d3.scaleLinear().domain([yearStart, yearEnd]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([innerH, 0]);

    // Gridlines
    [0, 20, 40, 60, 80, 100].forEach(v => {
      mainG.append("line").attr("class","gridEl")
        .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
        .attr("stroke", v===0||v===100?"#bbb":"#e0e0e0")
        .attr("stroke-dasharray", (v===0||v===100)?"0":"4,3").attr("stroke-width",1);
      mainG.append("text").attr("class","axisEl")
        .attr("x",-8).attr("y",yScale(v)).attr("dy","0.35em")
        .style("font-size","11px").style("fill","#888").style("text-anchor","end")
        .text(`${v}%`);
    });

    // Eje X
    const span = yearEnd - yearStart;
    const tickStep = span <= 20 ? 5 : span <= 50 ? 10 : 20;
    const xTicks = d3.range(Math.ceil(yearStart/tickStep)*tickStep, yearEnd+1, tickStep);
    [...new Set([yearStart, ...xTicks, yearEnd])].forEach(y => {
      mainG.append("text").attr("class","axisEl")
        .attr("x",xScale(y)).attr("y",innerH+18)
        .style("font-size","11px").style("fill","#888").style("text-anchor","middle").text(y);
    });

    // Etiqueta eje X
    mainG.append("text").attr("class","axisEl")
      .attr("x",innerW/2).attr("y",innerH+40)
      .style("font-size","12px").style("font-weight","bold").style("fill","#555")
      .style("text-anchor","middle").text("Women's birth year");

    // Áreas
    visStacked.forEach((layer, li) => {
      const areaGen = d3.area()
        .x(d => xScale(d.data.year))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]))
        .curve(d3.curveBasis);

      mainG.append("path").attr("class","areaEl")
        .datum(layer)
        .attr("fill", LAYERS[li].color)
        .attr("opacity", 0.9)
        .attr("d", areaGen);
    });

    // Etiquetas al final (derecha)
    const lastRow = visRows[visRows.length - 1];
    const lastStacked = d3.stack()
      .keys(LAYERS.map(l => l.col))
      .value((d, key) => d[key] || 0)
      .offset(d3.stackOffsetNone)([lastRow]);

    LAYERS.forEach((l, li) => {
      const s = lastStacked[li][0];
      const midY = yScale((s[0] + s[1]) / 2);
      mainG.append("text").attr("class","areaEl")
        .attr("x", innerW + 8).attr("y", midY).attr("dy","0.35em")
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

        // Qué capa está bajo el cursor (Y)
        const [, my2] = d3.pointer(event);
        const yVal = yScale.invert(my2);
        const layerStacked = d3.stack()
          .keys(LAYERS.map(l => l.col))
          .value((d, key) => d[key] || 0)
          .offset(d3.stackOffsetNone)([closest]);
        let hoveredCol = null;
        layerStacked.forEach((layer, li) => {
          if (yVal >= layer[0][0] && yVal <= layer[0][1]) hoveredCol = LAYERS[li].col;
        });

        hoverLine.attr("x1",xScale(closest.year)).attr("x2",xScale(closest.year))
          .attr("y1",0).attr("y2",innerH).style("display",null);

        // Puntos en cada área
        layerStacked.forEach((layer, li) => {
          const midY = (layer[0][0] + layer[0][1]) / 2;
          hoverDots[li].attr("cx",xScale(closest.year)).attr("cy",yScale(midY)).style("display",null);
        });

        const [sx,sy] = d3.pointer(event, svg.node());
        showTooltip(closest.year, closest, hoveredCol, sx, sy);
      })
      .on("mouseleave", () => {
        hoverLine.style("display","none");
        hoverDots.forEach(d => d.style("display","none"));
        hideTooltip();
      });
  }

  render();

  // ── Slider dos handles ────────────────────────────────────────────────────
  const sliderY = H - 52;
  const sliderX0 = 90, sliderX1 = W - 60;
  const xSlider = d3.scalePoint().domain(years).range([sliderX0, sliderX1]);
  const sliderG = svg.append("g");

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
    const y = years.reduce((a,b)=>Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b);
    if (y < yearEnd) { yearStart=y; positionHandles(); render(); }
  }));
  handleR.call(d3.drag().on("drag", function(event) {
    const mx = Math.max(xSlider(yearStart)+10, Math.min(sliderX1, event.x));
    const y = years.reduce((a,b)=>Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b);
    if (y > yearStart) { yearEnd=y; positionHandles(); render(); }
  }));

  sliderG.append("rect").attr("x",sliderX0).attr("y",sliderY-12)
    .attr("width",sliderX1-sliderX0).attr("height",24)
    .attr("fill","transparent").style("cursor","pointer")
    .on("click", function(event) {
      const [mx] = d3.pointer(event);
      const y = years.reduce((a,b)=>Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b);
      const dL = Math.abs(xSlider(yearStart)-mx), dR = Math.abs(xSlider(yearEnd)-mx);
      if (dL<dR) yearStart=y; else yearEnd=y;
      positionHandles(); render();
    });

  playBtn.on("click", () => {
    if (playing) { clearInterval(timer); playing=false; playBtn.text("▶"); }
    else {
      if (yearEnd>=years[years.length-1]) { yearEnd=yearStart; positionHandles(); render(); }
      playing=true; playBtn.text("⏸");
      timer = setInterval(() => {
        const idx = years.indexOf(yearEnd);
        if (idx<years.length-1) { yearEnd=years[idx+1]; positionHandles(); render(); }
        else { clearInterval(timer); playing=false; playBtn.text("▶"); }
      }, 200);
    }
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",margin.left).attr("y",H-18)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",margin.left+80).attr("y",H-18)
    .style("font-size","10.5px").style("fill","#333")
    .text("Human Fertility Database (2025) – processed by Our World in Data");
  svg.append("text").attr("x",margin.left).attr("y",H-5)
    .style("font-size","10px").style("fill","#aaa")
    .text("OurWorldInData.org/fertility-rate | CC BY");

  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("share-of-women-having-births.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["share-of-women-having-births.csv", {url: new URL("./files/d89d48f040521243f86a00b4a317982ccfc07cca88c6c168d974448bf3f8b893ebb5e957bc31237e1f278c58262f80e872da6931ce80eb543ce5f1efc216e6a8.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
