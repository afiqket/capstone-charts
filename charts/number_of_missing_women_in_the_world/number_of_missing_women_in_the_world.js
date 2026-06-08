function _1(md){return(
md`# Number of 'missing women' in the world`
)}

function _2(rawData,d3)
{
  const W = 900, H = 540;
  const margin = { top: 90, right: 160, bottom: 100, left: 90 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  // Orden de apilado: China abajo, India encima, Rest of World arriba
  // (igual que OWID: China rojo, India naranja, Rest of World azul)
  const LAYERS = [
    { entity: "China",         color: "#C0392B", labelColor: "#C0392B" },
    { entity: "India",         color: "#E8824A", labelColor: "#E8824A" },
    { entity: "Rest of World", color: "#7B9EC9", labelColor: "#4472AA" },
  ];

  const valueCol = "Number of missing women";

  // ── Datos ─────────────────────────────────────────────────────────────────
  const years = [...new Set(rawData.map(d => +d.Year))].sort((a,b) => a - b);

  // Para cada año, valor por entidad
  const byYear = new Map();
  years.forEach(y => {
    const row = {};
    LAYERS.forEach(l => {
      const r = rawData.find(d => d.Entity === l.entity && +d.Year === y);
      row[l.entity] = r ? +r[valueCol] : 0;
    });
    byYear.set(y, row);
  });

  // Stacked: para cada año, calcular y0 e y1 de cada capa
  function getStacked(y) {
    const row = byYear.get(y) || {};
    let cum = 0;
    return LAYERS.map(l => {
      const v = row[l.entity] || 0;
      const result = { entity: l.entity, y0: cum, y1: cum + v, value: v };
      cum += v;
      return result;
    });
  }

  // Años visibles (rango slider)
  let yearStart = years[0];
  let yearEnd   = years[years.length - 1];

  // ── Formato ───────────────────────────────────────────────────────────────
  function fmtM(v) {
    return `${d3.format(".2f")(v / 1e6)} million`;
  }

  // ── Contenedor ────────────────────────────────────────────────────────────
  const container = d3.create("div").style("font-family","sans-serif").style("user-select","none");

  const svg = container.append("svg")
    .attr("viewBox",`0 0 ${W} ${H}`)
    .attr("width",W).attr("height",H)
    .style("background","#fff");

  // Título
  const titleEl = svg.append("text").attr("x", margin.left).attr("y", 22)
    .style("font-size","16px").style("font-weight","bold").style("fill","#111");

  svg.append("foreignObject").attr("x", margin.left).attr("y", 28)
    .attr("width", W - margin.left - 10).attr("height", 50)
    .append("xhtml:div").style("font-size","11px").style("color","#555").style("line-height","1.5")
    .text("'Missing women' refers to the number who would be alive in the absence of sex discrimination. Missing women are the sum of women missing at birth (as a result of sex-selective abortion) and excess female mortality through infanticide, neglect or poor treatment.");

  const mainG = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 8px rgba(0,0,0,0.15))");
  const ttYear  = ttG.append("text").attr("x",14).attr("y",22)
    .style("font-size","15px").style("font-weight","bold").style("fill","#111");
  const ttUnit  = ttG.append("text").attr("x",14).attr("y",38)
    .style("font-size","11px").style("fill","#888").text("in missing women");

  function showTooltip(year, stacked, mx, my) {
    ttYear.text(year);
    ttG.selectAll(".ttrow").remove();
    ttG.selectAll(".ttsep").remove();

    const total = stacked[stacked.length-1].y1;
    stacked.forEach((s, i) => {
      const layer = LAYERS.find(l => l.entity === s.entity);
      // Swatch
      ttG.append("rect").attr("class","ttrow")
        .attr("x",14).attr("y", 50 + i*22).attr("width",12).attr("height",12)
        .attr("fill",layer.color).attr("rx",2);
      ttG.append("text").attr("class","ttrow")
        .attr("x",32).attr("y", 59 + i*22)
        .style("font-size","12px").style("fill","#333")
        .text(s.entity);
      ttG.append("text").attr("class","ttrow")
        .attr("x",190).attr("y", 59 + i*22)
        .style("font-size","12px")
        .style("font-weight", s.entity === "India" ? "bold" : "normal")
        .style("fill","#111").style("text-anchor","end")
        .text(fmtM(s.value));
    });

    // Separador + total
    const sepY = 50 + stacked.length * 22 + 4;
    ttG.append("line").attr("class","ttsep")
      .attr("x1",14).attr("x2",200).attr("y1",sepY).attr("y2",sepY)
      .attr("stroke","#ddd");
    ttG.append("text").attr("class","ttrow")
      .attr("x",14).attr("y",sepY+16)
      .style("font-size","12px").style("font-weight","bold").style("fill","#111").text("Total");
    ttG.append("text").attr("class","ttrow")
      .attr("x",190).attr("y",sepY+16)
      .style("font-size","12px").style("font-weight","bold").style("fill","#111")
      .style("text-anchor","end").text(fmtM(total));

    const ttH = sepY + 28;
    const ttW = 215;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 12;
    const ty = Math.max(0, Math.min(my - 30, H - ttH - 10));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }
  function hideTooltip() { ttG.style("display","none"); }

  // ── Línea vertical de hover ───────────────────────────────────────────────
  const hoverLine = mainG.append("line")
    .attr("y1",0).attr("y2",innerH)
    .attr("stroke","#888").attr("stroke-width",1)
    .style("display","none");
  const hoverDots = LAYERS.map(() =>
    mainG.append("circle").attr("r",4).attr("fill","white").attr("stroke","#888").attr("stroke-width",1.5)
      .style("display","none")
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  function render() {
    mainG.selectAll(".areaPath, .axisEl, .gridEl, .labelEl").remove();

    const visYears = years.filter(y => y >= yearStart && y <= yearEnd);
    if (!visYears.length) return;

    titleEl.text(`Number of 'missing women' in the world, ${yearStart} to ${yearEnd}`);

    // Máximo total apilado
    const maxTotal = d3.max(visYears, y => {
      const s = getStacked(y);
      return s[s.length-1].y1;
    });
    const yMax = Math.ceil(maxTotal / 2e7) * 2e7; // redondear a 20M

    const xScale = d3.scaleLinear().domain([yearStart, yearEnd]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);

    // Gridlines
    d3.range(0, yMax + 1, 2e7).forEach(v => {
      mainG.append("line").attr("class","gridEl")
        .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
        .attr("stroke", v === 0 ? "#aaa" : "#e0e0e0")
        .attr("stroke-dasharray", v === 0 ? "0" : "4,3").attr("stroke-width",1);
      mainG.append("text").attr("class","axisEl")
        .attr("x",-8).attr("y",yScale(v)).attr("dy","0.35em")
        .style("font-size","11px").style("fill","#888").style("text-anchor","end")
        .text(v === 0 ? "0" : `${v/1e6} million`);
    });

    // Eje X
    xScale.ticks(6).concat([yearStart, yearEnd]).forEach(y => {
      mainG.append("text").attr("class","axisEl")
        .attr("x",xScale(y)).attr("y",innerH+18)
        .style("font-size","11px").style("fill","#888").style("text-anchor","middle")
        .text(Math.round(y));
    });
    mainG.append("line").attr("class","axisEl")
      .attr("x1",0).attr("x2",innerW).attr("y1",innerH).attr("y2",innerH)
      .attr("stroke","#bbb").attr("stroke-width",1);

    // Áreas apiladas (de abajo a arriba)
    LAYERS.forEach((layer, li) => {
      const areaGen = d3.area()
        .x(d => xScale(d.year))
        .y0(d => yScale(getStacked(d.year)[li].y0))
        .y1(d => yScale(getStacked(d.year)[li].y1))
        .curve(d3.curveMonotoneX);

      mainG.append("path").attr("class","areaPath")
        .datum(visYears.map(y => ({ year: y })))
        .attr("fill", layer.color).attr("opacity", 0.85)
        .attr("d", areaGen);
    });

    // Etiquetas al final del área
    const lastYear = visYears[visYears.length - 1];
    const lastStacked = getStacked(lastYear);
    LAYERS.forEach((layer, li) => {
      const s = lastStacked[li];
      const midY = yScale((s.y0 + s.y1) / 2);
      mainG.append("text").attr("class","labelEl")
        .attr("x", xScale(lastYear) + 8)
        .attr("y", midY).attr("dy","0.35em")
        .style("font-size","12px").style("font-weight","bold")
        .style("fill", layer.labelColor).text(layer.entity);
    });

    // Zona interactiva
    mainG.selectAll(".hoverRect").remove();
    mainG.append("rect").attr("class","hoverRect")
      .attr("width",innerW).attr("height",innerH)
      .attr("fill","transparent")
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event);
        const yearHov = xScale.invert(mx);
        const closest = visYears.reduce((a,b) => Math.abs(a-yearHov)<Math.abs(b-yearHov)?a:b);
        const stacked = getStacked(closest);
        const cx = xScale(closest);

        hoverLine.attr("x1",cx).attr("x2",cx).style("display",null);
        LAYERS.forEach((layer, li) => {
          const s = stacked[li];
          const midY = yScale((s.y0 + s.y1) / 2);
          hoverDots[li].attr("cx",cx).attr("cy",midY)
            .attr("stroke",layer.color).style("display",null);
        });

        const [sx,sy] = d3.pointer(event, svg.node());
        showTooltip(closest, stacked, sx, sy);
      })
      .on("mouseleave", () => {
        hoverLine.style("display","none");
        hoverDots.forEach(d => d.style("display","none"));
        hideTooltip();
      });
  }

  render();

  // ── Slider de dos handles (rango) ────────────────────────────────────────
  const sliderY = H - 52;
  const sliderX0 = 80, sliderX1 = W - 60;
  const xSlider = d3.scalePoint().domain(years).range([sliderX0, sliderX1]);
  const sliderG = svg.append("g");

  let playing = false;
  let timer = null;

  const playBtn = sliderG.append("text").attr("x",24).attr("y",sliderY+5)
    .style("font-size","18px").style("cursor","pointer").style("fill","#555").text("▶");

  sliderG.append("text").attr("x",sliderX0).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(years[0]);
  sliderG.append("text").attr("x",sliderX1).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(years[years.length-1]);

  sliderG.append("line").attr("x1",sliderX0).attr("x2",sliderX1)
    .attr("y1",sliderY).attr("y2",sliderY)
    .attr("stroke","#ccc").attr("stroke-width",4).attr("stroke-linecap","round");

  // Handle izquierdo (inicio)
  const handleL = sliderG.append("circle").attr("cy",sliderY).attr("r",9)
    .attr("fill","#555").style("cursor","ew-resize");
  // Handle derecho (fin)
  const handleR = sliderG.append("circle").attr("cy",sliderY).attr("r",9)
    .attr("fill","#555").style("cursor","ew-resize");

  function positionHandles() {
    handleL.attr("cx", xSlider(yearStart));
    handleR.attr("cx", xSlider(yearEnd));
  }
  positionHandles();

  handleL.call(d3.drag().on("drag", function(event) {
    const mx = Math.max(sliderX0, Math.min(xSlider(yearEnd) - 10, event.x));
    const y = years.reduce((a,b) => Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b);
    if (y < yearEnd) { yearStart = y; positionHandles(); render(); }
  }));

  handleR.call(d3.drag().on("drag", function(event) {
    const mx = Math.max(xSlider(yearStart) + 10, Math.min(sliderX1, event.x));
    const y = years.reduce((a,b) => Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b);
    if (y > yearStart) { yearEnd = y; positionHandles(); render(); }
  }));

  // Click en la barra del slider mueve el handle más cercano
  sliderG.append("rect").attr("x",sliderX0).attr("y",sliderY-12)
    .attr("width",sliderX1-sliderX0).attr("height",24)
    .attr("fill","transparent").style("cursor","pointer")
    .on("click", function(event) {
      const [mx] = d3.pointer(event);
      const y = years.reduce((a,b) => Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b);
      const distL = Math.abs(xSlider(yearStart) - mx);
      const distR = Math.abs(xSlider(yearEnd) - mx);
      if (distL < distR) { yearStart = y; }
      else               { yearEnd   = y; }
      positionHandles(); render();
    });

  // Play: expande el rango desde yearStart hasta el final
  playBtn.on("click", () => {
    if (playing) { clearInterval(timer); playing=false; playBtn.text("▶"); }
    else {
      if (yearEnd >= years[years.length-1]) { yearEnd = yearStart; positionHandles(); render(); }
      playing=true; playBtn.text("⏸");
      timer = setInterval(() => {
        const idx = years.indexOf(yearEnd);
        if (idx < years.length-1) { yearEnd = years[idx+1]; positionHandles(); render(); }
        else { clearInterval(timer); playing=false; playBtn.text("▶"); }
      }, 300);
    }
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",margin.left).attr("y",H-18)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",margin.left+80).attr("y",H-18)
    .style("font-size","10.5px").style("fill","#333")
    .text("Bongaarts and Guilmoto (2015) – processed by Our World in Data");
  svg.append("text").attr("x",margin.left).attr("y",H-5)
    .style("font-size","10px").style("fill","#aaa")
    .text("OurWorldInData.org/gender-ratio | CC BY");

  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("global-number-of-missing-women.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["global-number-of-missing-women.csv", {url: new URL("./files/f147db20ce28dddb3ea583fda7627cf601dd46519e0e3bc8b145696e0ea1988aacf9d2361d699a87dd02c5305fb21223faf106008c6b983c2187bd41dae70a92.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
