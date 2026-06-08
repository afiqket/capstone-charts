function _1(md){return(
md`# Survival ages across the population`
)}

function _2(rawData,d3)
{
  const W = 900, H = 600;
  const margin = { top: 90, right: 100, bottom: 90, left: 65 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const country = "France";

  // Series de arriba (Top 1%) a abajo (99%) — orden de leyenda
  const SERIES = [
    { col: "Top 1%", label: "Top 1%", color: "#2222CC" },
    { col: "10%",    label: "10%",    color: "#3344DD" },
    { col: "20%",    label: "20%",    color: "#5533CC" },
    { col: "30%",    label: "30%",    color: "#7722BB" },
    { col: "40%",    label: "40%",    color: "#9922AA" },
    { col: "50%",    label: "50%",    color: "#BB2299" },
    { col: "60%",    label: "60%",    color: "#CC2288" },
    { col: "70%",    label: "70%",    color: "#DD3366" },
    { col: "80%",    label: "80%",    color: "#EE4444" },
    { col: "90%",    label: "90%",    color: "#EE6655" },
    { col: "99%",    label: "99%",    color: "#EE9977" },
  ];

  const rows = rawData
    .filter(d => d.Entity === country)
    .map(d => {
      const r = { year: +d.Year };
      SERIES.forEach(s => { r[s.col] = d[s.col] != null && d[s.col] !== "" ? +d[s.col] : null; });
      return r;
    })
    .sort((a,b) => a.year - b.year);

  const years = rows.map(r => r.year);
  const byYear = new Map(rows.map(r => [r.year, r]));

  let mode = "line";
  let currentYear = years[years.length - 1];
  let playing = false, timer = null;

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
    .attr("width", W - margin.left - 10).attr("height", 44)
    .append("xhtml:div").style("font-size","11px").style("color","#555").style("line-height","1.5")
    .text("The number of years that a specific share of the population would survive, if they were born in a given year and experienced age-specific death rates of that year. For example, the line indicating 1% corresponds to the top 1% of survivors born in a given year and the number of years of their survival.");

  const mainG = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 8px rgba(0,0,0,0.15))");
  const ttTitle = ttG.append("text").attr("x",12).attr("y",22)
    .style("font-size","14px").style("font-weight","bold").style("fill","#111");

  function showTooltip(year, row, mx, my) {
    ttTitle.text(year);
    ttG.selectAll(".ttrow").remove();
    SERIES.forEach((s, i) => {
      const v = row[s.col];
      if (v == null) return;
      ttG.append("rect").attr("class","ttrow")
        .attr("x",12).attr("y", 30 + i*18).attr("width",12).attr("height",12)
        .attr("fill",s.color).attr("rx",2);
      ttG.append("text").attr("class","ttrow")
        .attr("x",28).attr("y", 40 + i*18)
        .style("font-size","11px").style("fill","#333")
        .text(`${s.label}`);
      ttG.append("text").attr("class","ttrow")
        .attr("x",170).attr("y", 40 + i*18)
        .style("font-size","11px").style("font-weight","bold").style("fill","#111")
        .style("text-anchor","end")
        .text(`${d3.format(".1f")(v)} years`);
    });
    const ttH = 30 + SERIES.length * 18 + 8;
    const ttW = 185;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 12;
    const ty = Math.max(0, Math.min(my - 40, H - ttH - 10));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }
  function hideTooltip() { ttG.style("display","none"); }

  // ── RENDER LINE ───────────────────────────────────────────────────────────
  function renderLine() {
    mainG.selectAll("*").remove();
    titleEl.text(`Survival ages across the population, ${country}, ${years[0]} to ${years[years.length-1]}`);

    const allVals = rows.flatMap(r => SERIES.map(s => r[s.col]).filter(v => v != null));
    const yMax = Math.ceil((d3.max(allVals)||110) / 20) * 20;

    const xScale = d3.scaleLinear().domain(d3.extent(years)).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);

    // Gridlines
    d3.range(0, yMax+1, 20).forEach(v => {
      mainG.append("line")
        .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
        .attr("stroke", v===0?"#aaa":"#e8e8e8").attr("stroke-dasharray",v===0?"0":"4,3").attr("stroke-width",1);
      mainG.append("text")
        .attr("x",-8).attr("y",yScale(v)).attr("dy","0.35em")
        .style("font-size","11px").style("fill","#888").style("text-anchor","end")
        .text(`${v} years`);
    });

    // Eje X
    const xTicks = years.filter(y => y % 50 === 0);
    [...new Set([years[0], ...xTicks, years[years.length-1]])].forEach(y => {
      mainG.append("text")
        .attr("x",xScale(y)).attr("y",innerH+18)
        .style("font-size","11px").style("fill","#888").style("text-anchor","middle").text(y);
    });
    mainG.append("line").attr("x1",0).attr("x2",innerW)
      .attr("y1",innerH).attr("y2",innerH).attr("stroke","#bbb").attr("stroke-width",1);

    const lineGen = (col) => d3.line()
      .defined(d => d[col] != null)
      .x(d => xScale(d.year))
      .y(d => yScale(d[col]))
      .curve(d3.curveMonotoneX)(rows);

    // Dibujar líneas de atrás adelante (99% primero)
    [...SERIES].reverse().forEach(s => {
      mainG.append("path")
        .attr("fill","none").attr("stroke",s.color).attr("stroke-width",1.5)
        .attr("d", lineGen(s.col));
    });

    // Etiquetas al final (derecha)
    const lastRow = rows[rows.length-1];
    SERIES.forEach(s => {
      const v = lastRow[s.col];
      if (v == null) return;
      mainG.append("text")
        .attr("x",innerW+6).attr("y",yScale(v)).attr("dy","0.35em")
        .style("font-size","10px").style("font-weight","bold").style("fill",s.color)
        .text(s.label);
    });

    // Línea vertical + puntos en hover
    const hoverLine = mainG.append("line").attr("y1",0).attr("y2",innerH)
      .attr("stroke","#888").attr("stroke-width",1).style("display","none");

    const hoverDots = SERIES.map(s =>
      mainG.append("circle").attr("r",4).attr("fill",s.color).attr("stroke","white").attr("stroke-width",1.5)
        .style("display","none")
    );

    mainG.append("rect").attr("width",innerW).attr("height",innerH)
      .attr("fill","transparent")
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event);
        const yr = Math.round(xScale.invert(mx));
        const closest = years.reduce((a,b) => Math.abs(a-yr)<Math.abs(b-yr)?a:b);
        const row = byYear.get(closest);
        if (!row) return hideTooltip();
        hoverLine.attr("x1",xScale(closest)).attr("x2",xScale(closest)).style("display",null);
        SERIES.forEach((s,i) => {
          const v = row[s.col];
          if (v != null) {
            hoverDots[i].attr("cx",xScale(closest)).attr("cy",yScale(v)).style("display",null);
          }
        });
        const [sx,sy] = d3.pointer(event, svg.node());
        showTooltip(closest, row, sx, sy);
      })
      .on("mouseleave", () => {
        hoverLine.style("display","none");
        hoverDots.forEach(d => d.style("display","none"));
        hideTooltip();
      });
  }

  // ── RENDER BAR ────────────────────────────────────────────────────────────
  function renderBar() {
    mainG.selectAll("*").remove();
    titleEl.text(`Survival ages across the population, ${country}, ${currentYear}`);

    const row = byYear.get(currentYear);
    const barData = SERIES.map(s => ({
      label: s.label, color: s.color,
      value: row && row[s.col] != null ? row[s.col] : null
    })).filter(d => d.value != null);

    if (!barData.length) {
      mainG.append("text").attr("x",innerW/2).attr("y",innerH/2)
        .style("text-anchor","middle").style("fill","#888").style("font-size","14px")
        .text("No data for this year");
      return;
    }

    const maxVal = d3.max(barData, d=>d.value) * 1.04;
    const xScale = d3.scaleLinear().domain([0, maxVal]).range([0, innerW]);
    const yScale = d3.scaleBand().domain(barData.map(d=>d.label))
      .range([0, innerH]).padding(0.2);

    barData.forEach(d => {
      mainG.append("rect")
        .attr("x",0).attr("y",yScale(d.label))
        .attr("width",xScale(d.value)).attr("height",yScale.bandwidth())
        .attr("fill",d.color);
      mainG.append("text")
        .attr("x",-8).attr("y",yScale(d.label)+yScale.bandwidth()/2).attr("dy","0.35em")
        .style("text-anchor","end").style("font-size","12px").style("font-weight","bold").style("fill","#333")
        .text(d.label);
      // Solo el último (99%) lleva "years"
      const isLast = d.label === "99%";
      mainG.append("text")
        .attr("x",xScale(d.value)+6).attr("y",yScale(d.label)+yScale.bandwidth()/2).attr("dy","0.35em")
        .style("font-size","12px").style("fill","#444")
        .text(`${d3.format(".1~f")(d.value)}${isLast?" years":""}`);
    });

    mainG.append("line").attr("x1",0).attr("x2",0).attr("y1",0).attr("y2",innerH)
      .attr("stroke","#bbb").attr("stroke-width",1);
  }

  // ── Slider ────────────────────────────────────────────────────────────────
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
      updateYear(years.reduce((a,b)=>Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
    });
  handle.call(d3.drag().on("drag", function(event) {
    const mx = Math.max(sliderX0, Math.min(sliderX1, event.x));
    updateYear(years.reduce((a,b)=>Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
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
      }, 100);
    }
  });

  // ── Mode switching ────────────────────────────────────────────────────────
  function setMode(m) {
    mode = m;
    btnLine.style("background",m==="line"?"#3a6fc4":"#fff").style("color",m==="line"?"#fff":"#333");
    btnBar .style("background",m==="bar" ?"#3a6fc4":"#fff").style("color",m==="bar" ?"#fff":"#333");
    sliderG.style("display", m==="line"?"none":null);
    hideTooltip();
    if (m==="line") renderLine();
    if (m==="bar")  renderBar();
  }
  btnLine.on("click", ()=>setMode("line"));
  btnBar .on("click", ()=>setMode("bar"));

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",margin.left).attr("y",H-18)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",margin.left+80).attr("y",H-18)
    .style("font-size","10.5px").style("fill","#333")
    .text("Alvarez & Vaupel (2023); Human Mortality Database (2025) – with major processing by Our World in Data");
  svg.append("text").attr("x",margin.left).attr("y",H-5)
    .style("font-size","10px").style("fill","#aaa")
    .text("OurWorldInData.org/life-expectancy | CC BY");

  setMode("line");
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("survival-ages-across-the-population.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["survival-ages-across-the-population.csv", {url: new URL("./files/316e0d5156e650a35f1c860d73c5f47b63461a7381f7234f63fb2dfd912df40fec5f8bafeacf06d8f25893cfc6ac09b0b2cada0ecbc8b1b74f0b56922cdb04b1.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
