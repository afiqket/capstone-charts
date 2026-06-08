function _1(md){return(
md`# Annual number of missing female births and excess mortality`
)}

function _2(rawData,d3)
{
  const W = 900, H = 560;
  const margin = { top: 90, right: 200, bottom: 100, left: 150 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const SERIES = [
    { col: "Excess female deaths",  label: "Excess female deaths",  color: "#4C6FAD" },
    { col: "Missing female births", label: "Missing female births", color: "#B04B2D" },
  ];
  const BAR_COLOR = "#6b7fad";
  const PROJECTION_YEAR = 2015; // a partir de aquí son proyecciones
  const country = "World";

  // ── Datos ─────────────────────────────────────────────────────────────────
  const rows = rawData.filter(d => d.Entity === country);
  const years = [...new Set(rows.map(d => +d.Year))].sort((a,b) => a - b);
  let currentYear = years[years.length - 1];
  const byYear = new Map(rows.map(r => [+r.Year, r]));

  const seriesData = SERIES.map(s => ({
    ...s,
    points: rows
      .map(r => ({ year: +r.Year, value: r[s.col] != null && r[s.col] !== "" ? +r[s.col] : null }))
      .filter(d => d.value != null)
      .sort((a,b) => a.year - b.year)
  }));

  // ── Formato eje Y ─────────────────────────────────────────────────────────
  function fmtY(v) {
    if (v >= 1e6)  return `${d3.format(".1~f")(v/1e6)} million`;
    if (v >= 1e3)  return d3.format(",")(v);
    return v;
  }
  function fmtVal(v) {
    if (v >= 1e6)  return `${d3.format(".2f")(v/1e6)} million`;
    if (v >= 1e3)  return d3.format(",")(Math.round(v));
    return String(v);
  }

  let mode = "line";
  let playing = false;
  let timer = null;

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
    .attr("viewBox",`0 0 ${W} ${H}`)
    .attr("width",W).attr("height",H)
    .style("background","#fff");

  const titleEl = svg.append("text").attr("x", margin.left).attr("y", 22)
    .style("font-size","16px").style("font-weight","bold").style("fill","#111");

  svg.append("foreignObject").attr("x", margin.left).attr("y", 28)
    .attr("width", W - margin.left - 10).attr("height", 50)
    .append("xhtml:div").style("font-size","11px").style("color","#555").style("line-height","1.5")
    .text("'Missing women' are defined as the number of additional women who would be alive in the absence of sex discrimination. Missing women are the sum of women missing at birth (as a result of sex-selective abortion) and excess female mortality through infanticide or neglect. Figures after 2015 are projections.");

  const mainG = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 6px rgba(0,0,0,0.13))");
  const ttTitle = ttG.append("text").attr("x",12).attr("y",20)
    .style("font-size","13px").style("font-weight","bold").style("fill","#111");

  function showTooltip(year, items, mx, my) {
    ttTitle.text(`${country}, ${year}`);
    ttG.selectAll(".ttrow").remove();
    items.forEach((item, i) => {
      ttG.append("text").attr("class","ttrow")
        .attr("x",12).attr("y", 36 + i*16)
        .style("font-size","11px").style("fill", item.color)
        .text(`${item.label}: ${fmtVal(item.value)}`);
    });
    const ttH = 28 + items.length*16 + 4;
    const ttW = 250;
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
    titleEl.text(`Annual number of missing female births and excess mortality, ${country}`);

    const allVals = seriesData.flatMap(s => s.points.map(p => p.value));
    const yMax = Math.ceil((d3.max(allVals) || 3e6) / 5e5) * 5e5;

    const xScale = d3.scaleLinear().domain(d3.extent(years)).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);

    // Zona sombreada de proyecciones (post 2015)
    const projX = xScale(PROJECTION_YEAR);
    mainG.append("rect")
      .attr("x", projX).attr("y", 0)
      .attr("width", innerW - projX).attr("height", innerH)
      .attr("fill", "#f5f5f5").attr("opacity", 0.7);
    mainG.append("text")
      .attr("x", projX + 6).attr("y", 12)
      .style("font-size","10px").style("fill","#aaa").text("Projections →");

    // Gridlines + eje Y
    const yTicks = d3.range(0, yMax + 1, 5e5);
    yTicks.forEach(v => {
      mainG.append("line")
        .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
        .attr("stroke", v===0 ? "#999" : "#e0e0e0")
        .attr("stroke-dasharray", v===0 ? "0" : "4,3").attr("stroke-width",1);
      mainG.append("text")
        .attr("x",-8).attr("y",yScale(v)).attr("dy","0.35em")
        .style("font-size","11px").style("fill","#888").style("text-anchor","end")
        .text(fmtY(v));
    });

    // Eje X
    const xTicks = years.filter(y => y % 10 === 0);
    [...new Set([...xTicks, years[0], years[years.length-1]])].forEach(y => {
      mainG.append("text")
        .attr("x",xScale(y)).attr("y",innerH+18)
        .style("font-size","11px").style("fill","#888").style("text-anchor","middle").text(y);
    });
    mainG.append("line").attr("x1",0).attr("x2",innerW)
      .attr("y1",innerH).attr("y2",innerH).attr("stroke","#bbb").attr("stroke-width",1);

    const lineGen = d3.line()
      .x(d => xScale(d.year)).y(d => yScale(d.value)).curve(d3.curveMonotoneX);

    seriesData.forEach(s => {
      if (!s.points.length) return;

      // Línea histórica (sólida)
      const historical = s.points.filter(p => p.year <= PROJECTION_YEAR);
      const projection = s.points.filter(p => p.year >= PROJECTION_YEAR);

      if (historical.length > 1) {
        mainG.append("path").datum(historical)
          .attr("fill","none").attr("stroke",s.color).attr("stroke-width",2)
          .attr("d", lineGen);
      }
      // Línea proyección (discontinua)
      if (projection.length > 1) {
        mainG.append("path").datum(projection)
          .attr("fill","none").attr("stroke",s.color).attr("stroke-width",2)
          .attr("stroke-dasharray","6,4")
          .attr("d", lineGen);
      }

      // Puntos cada 5 años
      s.points.filter(p => p.year % 5 === 0).forEach(p => {
        mainG.append("circle")
          .attr("cx",xScale(p.year)).attr("cy",yScale(p.value))
          .attr("r",3.5).attr("fill",s.color);
      });

      // Etiqueta al final
      const last = s.points[s.points.length-1];
      mainG.append("text")
        .attr("x",xScale(last.year)+8).attr("y",yScale(last.value))
        .attr("dy","0.35em").style("font-size","11px").style("font-weight","bold")
        .style("fill",s.color).text(s.label);
    });

    // Zona interactiva
    mainG.append("rect").attr("width",innerW).attr("height",innerH)
      .attr("fill","transparent")
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event);
        const yearHov = Math.round(xScale.invert(mx));
        const closest = years.reduce((a,b) => Math.abs(a-yearHov)<Math.abs(b-yearHov)?a:b);
        const row = byYear.get(closest);
        if (!row) return hideTooltip();
        const items = SERIES.map(s => ({
          label: s.label, color: s.color,
          value: row[s.col] != null && row[s.col] !== "" ? +row[s.col] : null
        })).filter(d => d.value != null);
        const [sx,sy] = d3.pointer(event, svg.node());
        showTooltip(closest, items, sx, sy);
      })
      .on("mouseleave", hideTooltip);
  }

  // ── RENDER BAR ────────────────────────────────────────────────────────────
  function renderBar() {
    mainG.selectAll("*").remove();
    titleEl.text(`Annual number of missing female births and excess mortality, ${country}, ${currentYear}`);

    const row = byYear.get(currentYear);
    const barData = SERIES.map(s => ({
      label: s.label,
      value: row && row[s.col] != null && row[s.col] !== "" ? +row[s.col] : null
    })).filter(d => d.value != null).sort((a,b) => b.value - a.value);

    if (!barData.length) {
      mainG.append("text").attr("x",innerW/2).attr("y",innerH/2)
        .style("text-anchor","middle").style("fill","#888").style("font-size","14px")
        .text("No data for this year");
      return;
    }

    const maxVal = d3.max(barData, d=>d.value) * 1.08;
    const xScale = d3.scaleLinear().domain([0, maxVal]).range([0, innerW]);
    const yScale = d3.scaleBand().domain(barData.map(d=>d.label))
      .range([0, innerH]).padding(0.35);

    barData.forEach(d => {
      mainG.append("rect")
        .attr("x",0).attr("y",yScale(d.label))
        .attr("width",xScale(d.value)).attr("height",yScale.bandwidth())
        .attr("fill",BAR_COLOR);
      mainG.append("text")
        .attr("x",-10).attr("y",yScale(d.label)+yScale.bandwidth()/2).attr("dy","0.35em")
        .style("text-anchor","end").style("font-size","12px").style("font-weight","bold").style("fill","#333")
        .text(d.label);
      mainG.append("text")
        .attr("x",xScale(d.value)+8).attr("y",yScale(d.label)+yScale.bandwidth()/2).attr("dy","0.35em")
        .style("font-size","13px").style("fill","#444")
        .text(fmtVal(d.value));
    });

    mainG.append("line").attr("x1",0).attr("x2",0).attr("y1",0).attr("y2",innerH)
      .attr("stroke","#bbb").attr("stroke-width",1);

    // Nota de proyección si aplica
    if (currentYear > PROJECTION_YEAR) {
      mainG.append("text").attr("x",0).attr("y",innerH + 30)
        .style("font-size","10px").style("fill","#aaa").style("font-style","italic")
        .text(`Note: ${currentYear} values are projections.`);
    }
  }

  // ── Slider ────────────────────────────────────────────────────────────────
  const sliderY = H - 52;
  const sliderX0 = 80, sliderX1 = W - 60;
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

  const handle = sliderG.append("circle").attr("cy",sliderY).attr("r",9)
    .attr("fill","#555").style("cursor","pointer");

  function updateYear(y) {
    currentYear = y;
    handle.attr("cx", xSlider(y));
    if (mode === "bar") renderBar();
  }
  updateYear(currentYear);

  sliderG.append("rect").attr("x",sliderX0).attr("y",sliderY-12)
    .attr("width",sliderX1-sliderX0).attr("height",24)
    .attr("fill","transparent").style("cursor","pointer")
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
  svg.append("text").attr("x",margin.left).attr("y",H-18)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",margin.left+80).attr("y",H-18)
    .style("font-size","10.5px").style("fill","#333")
    .text("Bongaarts and Guilmoto (2015) – processed by Our World in Data");
  svg.append("text").attr("x",margin.left).attr("y",H-5)
    .style("font-size","10px").style("fill","#aaa")
    .text("OurWorldInData.org/gender-ratio | CC BY");

  setMode("line");
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("missing-female-births-and-excess-mortality.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["missing-female-births-and-excess-mortality.csv", {url: new URL("./files/ece6d3b997dfda42014e98bd6a6e97973dffaeef79ce894832479bc27c600c336b05bebcd4cee141c399a55dd4c5046acc51974d028bff9b39f8e4b7d74c4e43.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
