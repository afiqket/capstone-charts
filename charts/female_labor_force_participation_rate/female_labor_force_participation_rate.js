function _1(md){return(
md`# Female labor force participation rate`
)}

function _2(rawData,d3)
{
  const W = 960, H = 580;
  const margin = { top: 115, right: 160, bottom: 80, left: 165 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const colV   = "Female labor force participation rate";
  const defaultCountries = ["Canada", "United States", "Germany", "United Kingdom"];

  const countryColor = {
    "Canada":         "#8c6d3f",
    "United States":  "#4472c4",
    "Germany":        "#c0392b",
    "United Kingdom": "#2e8b6e",
    "France":         "#9b4dca",
    "Spain":          "#e8714a"
  };

  const allYears = [...new Set(rawData.map(d => +d.Year))].filter(Boolean).sort();
  let currentYear = Math.max(...allYears);
  let playing = false, timer = null;
  let viewMode = "line"; // "line" or "bar"

  // ── Container ─────────────────────────────────────────────────────────────
  const container = d3.create("div")
    .style("font-family", "sans-serif")
    .style("user-select", "none")
    .style("position", "relative");

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", W).attr("height", H)
    .style("background", "#fff");

  // Title
  const titleEl = svg.append("text")
    .attr("x", margin.left).attr("y", 30)
    .style("font-size", "20px").style("font-weight", "bold").style("fill", "#111");

  // Subtitle
  svg.append("foreignObject")
    .attr("x", margin.left).attr("y", 40)
    .attr("width", W - margin.left - 20).attr("height", 48)
    .append("xhtml:div")
    .style("font-size", "10.5px").style("color", "#555").style("line-height", "1.4")
    .text("Share of the female working-age population (ages 15 and over) who are economically active (employed or unemployed). Figures refer to national estimates and may not be fully comparable across countries and over time.");

  // ── View toggle buttons ───────────────────────────────────────────────────
  const btnY = 88, btnH = 22, btnRx = 4;
  const btnDefs = [
    { label: "Line", mode: "line",  x: margin.left },
    { label: "Bar",  mode: "bar",   x: margin.left + 62 }
  ];

  const btnGs = btnDefs.map(b => {
    const g = svg.append("g").style("cursor", "pointer");
    const rect = g.append("rect")
      .attr("x", b.x).attr("y", btnY)
      .attr("width", 56).attr("height", btnH)
      .attr("rx", btnRx)
      .attr("fill", "#f0f0f0").attr("stroke", "#ccc").attr("stroke-width", 1);
    g.append("text")
      .attr("x", b.x + 28).attr("y", btnY + 14)
      .style("font-size", "11px").style("text-anchor", "middle").style("fill", "#333")
      .text(b.label);
    g.on("click", () => { viewMode = b.mode; updateView(); });
    return { g, rect, mode: b.mode };
  });

  function styleButtons() {
    btnGs.forEach(({ rect, mode }) => {
      rect.attr("fill", mode === viewMode ? "#dce8f5" : "#f0f0f0")
          .attr("stroke", mode === viewMode ? "#4472c4" : "#ccc");
    });
  }

  const mainG = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // ── Scales ────────────────────────────────────────────────────────────────
  const xScaleLine = d3.scaleLinear()
    .domain([d3.min(allYears), d3.max(allYears)])
    .range([0, innerW]);
  const yScale = d3.scaleLinear().domain([0, 70]).range([innerH, 0]);

  // ── Gridlines (shared) ────────────────────────────────────────────────────
  const gridG = mainG.append("g");
  [0, 10, 20, 30, 40, 50, 60].forEach(v => {
    gridG.append("line")
      .attr("x1", 0).attr("x2", innerW)
      .attr("y1", yScale(v)).attr("y2", yScale(v))
      .attr("stroke", v === 0 ? "#bbb" : "#e0e0e0")
      .attr("stroke-dasharray", v === 0 ? "0" : "4,3")
      .attr("stroke-width", 1);
    gridG.append("text")
      .attr("x", -8).attr("y", yScale(v)).attr("dy", "0.35em")
      .style("font-size", "10px").style("fill", "#888").style("text-anchor", "end")
      .text(`${v}%`);
  });
  mainG.append("line").attr("x1",0).attr("x2",innerW).attr("y1",innerH).attr("y2",innerH)
    .attr("stroke","#bbb").attr("stroke-width",1);

  // ── Line chart elements ───────────────────────────────────────────────────
  const lineG  = mainG.append("g");
  const dotsG  = mainG.append("g");
  const labelG = mainG.append("g");

  // X axis ticks (line view)
  const xAxisG = mainG.append("g");
  const xTickYears = [1890,1910,1930,1950,1970,1990,2010,2024];
  xTickYears.forEach(y => {
    xAxisG.append("text")
      .attr("x", xScaleLine(y)).attr("y", innerH + 18)
      .style("font-size", "10px").style("fill", "#888").style("text-anchor", "middle")
      .text(y);
  });

  // ── Bar chart elements ────────────────────────────────────────────────────
  const barG = mainG.append("g");

  // ── Tooltip ───────────────────────────────────────────────────────────────
  // ── Tooltip (estilo OWID: línea vertical + lista de países) ───────────────
const ttG = svg.append("g").style("display","none").style("pointer-events","none");
const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
  .attr("stroke","#ddd").attr("stroke-width",1)
  .attr("filter","drop-shadow(0 2px 6px rgba(0,0,0,0.12))");
const ttYear = ttG.append("text").attr("x",12).attr("y",22)
  .style("font-size","13px").style("font-weight","bold").style("fill","#111");
const ttRows = ttG.append("g").attr("transform","translate(0,30)");

// Línea vertical de cursor
const cursorLine = mainG.append("line")
  .attr("y1",0).attr("y2",innerH)
  .attr("stroke","#ccc").attr("stroke-width",1)
  .style("display","none").style("pointer-events","none");

// Punto destacado en la línea hovered
const hoverDot = mainG.append("circle").attr("r",5)
  .attr("fill","white").attr("stroke-width",2)
  .style("display","none").style("pointer-events","none");

function showTT(hoveredCountry, year, pts, mx, my) {
  // Línea vertical
  cursorLine.attr("x1", xScaleLine(year)).attr("x2", xScaleLine(year))
    .style("display", null);

  // Punto en la línea hovered
  const hp = pts.find(p => p.country === hoveredCountry);
  if (hp && hp.value != null) {
    hoverDot
      .attr("cx", xScaleLine(year))
      .attr("cy", yScale(hp.value))
      .attr("stroke", countryColor[hoveredCountry] || "#999")
      .style("display", null);
  }

  // Contenido del tooltip
  ttYear.text(year);
  ttRows.selectAll("*").remove();

  // Ordenar: hovered primero, luego el resto por valor desc
  const sorted = [...pts].sort((a,b) => {
    if (a.country === hoveredCountry) return -1;
    if (b.country === hoveredCountry) return 1;
    return (b.value||0) - (a.value||0);
  });

  const rowH = 22;
  sorted.forEach((p, i) => {
    const isHovered = p.country === hoveredCountry;
    const g = ttRows.append("g").attr("transform",`translate(0,${i*rowH})`);

    // Color dot
    g.append("rect").attr("x",12).attr("y",4).attr("width",10).attr("height",10)
      .attr("rx",2)
      .attr("fill", isHovered ? countryColor[p.country]||"#999" : "#ddd");

    // Country name
    g.append("text").attr("x",28).attr("y",13)
      .style("font-size","12px")
      .style("fill", isHovered ? "#111" : "#bbb")
      .style("font-weight", isHovered ? "normal" : "normal")
      .text(p.country);

    // Value (solo para hovered)
    if (isHovered && p.value != null) {
      g.append("text").attr("x",175).attr("y",13)
        .style("font-size","12px").style("font-weight","bold").style("fill","#111")
        .style("text-anchor","end")
        .text(`${d3.format(".1f")(p.value)}%`);
    }
  });

  const ttW = 190, ttH = 36 + sorted.length * rowH;
  ttBg.attr("width",ttW).attr("height",ttH);
  ttG.style("display",null);

  const [sx, sy] = [mx, my];
  const tx = sx + ttW + 20 > W ? sx - ttW - 8 : sx + 14;
  const ty = Math.max(0, Math.min(sy - ttH/2, H - ttH - 10));
  ttG.attr("transform",`translate(${tx},${ty})`);
}

function hideTT() {
  ttG.style("display","none");
  cursorLine.style("display","none");
  hoverDot.style("display","none");
}

  // ── Data helpers ──────────────────────────────────────────────────────────
  function getSeriesData(country) {
    return rawData
      .filter(d => d.Entity === country && d[colV] != null && d[colV] !== "")
      .map(d => ({ year: +d.Year, value: +d[colV] }))
      .sort((a,b) => a.year - b.year);
  }

  function getValueAtYear(country, year) {
    const rows = rawData.filter(d => d.Entity === country && d[colV] != null && d[colV] !== "");
    if (!rows.length) return null;
    const closest = rows.sort((a,b) => Math.abs(+a.Year - year) - Math.abs(+b.Year - year))[0];
    return +closest[colV];
  }

  // ── Draw line view ────────────────────────────────────────────────────────
  function drawLine() {
    lineG.style("display",null);
    dotsG.style("display",null);
    labelG.style("display",null);
    xAxisG.style("display",null);
    barG.style("display","none");
    gridG.style("display",null);

    const lineFn = d3.line().x(d => xScaleLine(d.year)).y(d => yScale(d.value)).defined(d => d.value != null);

    const series = defaultCountries.map(c => ({ country: c, data: getSeriesData(c) }));

    lineG.selectAll("path").data(series, d => d.country)
      .join("path")
      .attr("fill","none")
      .attr("stroke", d => countryColor[d.country] || "#999")
      .attr("stroke-width", 2)
      .attr("d", d => lineFn(d.data));

    // Dots
    const allPts = series.flatMap(s => s.data.map(d => ({ ...d, country: s.country })));
    dotsG.selectAll("circle").data(allPts, d => `${d.country}-${d.year}`)
      .join("circle")
      .attr("cx", d => xScaleLine(d.year))
      .attr("cy", d => yScale(d.value))
      .attr("r", 2.5)
      .attr("fill", d => countryColor[d.country] || "#999")
      .attr("opacity", 0.7);

    // End labels
    const endPts = series.map(s => {
      const last = s.data[s.data.length - 1];
      return { country: s.country, ...last };
    });

    labelG.selectAll("text").data(endPts, d => d.country)
      .join("text")
      .attr("x", d => xScaleLine(d.year) + 6)
      .attr("y", d => yScale(d.value) + 4)
      .style("font-size","11px")
      .style("fill", d => countryColor[d.country]||"#555")
      .style("font-weight","bold")
      .text(d => d.country);

    // Hover overlay for line chart
    mainG.select(".line-hover").remove();
mainG.append("rect")
  .attr("class","line-hover")
  .attr("width",innerW).attr("height",innerH)
  .attr("fill","transparent")
  .on("mousemove", function(event) {
    const [mx, my] = d3.pointer(event);
    const year = Math.round(xScaleLine.invert(mx));
    const snappedYear = allYears.reduce((a,b) =>
      Math.abs(a-year)<Math.abs(b-year)?a:b);

    // Valor de cada país en ese año (interpolado al punto más cercano)
    const pts = defaultCountries.map(c => {
      const rows = rawData.filter(d => d.Entity===c && d[colV]!=null && d[colV]!=="");
      const closest = rows.sort((a,b)=>Math.abs(+a.Year-snappedYear)-Math.abs(+b.Year-snappedYear))[0];
      return { country: c, value: closest ? +closest[colV] : null };
    });

    // País más cercano al cursor verticalmente
    const withVal = pts.filter(p=>p.value!=null);
    const closest = withVal.reduce((best,p) => {
      const dist = Math.abs(yScale(p.value) - my);
      return dist < best.dist ? {p, dist} : best;
    }, {dist:Infinity, p:null});

    if (closest.p) {
      const [sx,sy] = d3.pointer(event, svg.node());
      showTT(closest.p.country, snappedYear, pts, sx, sy);
    } else hideTT();
  })
  .on("mouseleave", hideTT);
  }

  // ── Draw bar view ─────────────────────────────────────────────────────────
  function drawBar() {
    lineG.style("display","none");
    dotsG.style("display","none");
    labelG.style("display","none");
    xAxisG.style("display","none");
    barG.style("display",null);
    gridG.style("display","none");
    mainG.select(".line-hover").remove();
    hideTT();

    const barColor = "#6a8fc0";
    const barH = 48, barGap = 28;
    const countries = defaultCountries;

    // Compute values
    const vals = countries.map(c => ({
      country: c,
      value: getValueAtYear(c, currentYear)
    })).filter(d => d.value != null).sort((a,b) => b.value - a.value);

    const xBar = d3.scaleLinear().domain([0, 70]).range([0, innerW - 60]);

    barG.selectAll("*").remove();

    // Remove gridlines for bar, draw custom ones
    [0,10,20,30,40,50,60].forEach(v => {
      barG.append("line")
        .attr("x1", xBar(v)).attr("x2", xBar(v))
        .attr("y1", 0).attr("y2", vals.length * (barH + barGap))
        .attr("stroke","#e8e8e8").attr("stroke-width",1);
    });

    vals.forEach((d, i) => {
      const y = i * (barH + barGap) + 10;

      // Country label
      barG.append("text")
        .attr("x", -8).attr("y", y + barH/2).attr("dy","0.35em")
        .style("font-size","12px").style("font-weight","bold").style("fill","#333")
        .style("text-anchor","end")
        .text(d.country);

      // Bar
      barG.append("rect")
        .attr("x", 0).attr("y", y)
        .attr("width", xBar(d.value)).attr("height", barH)
        .attr("fill", barColor).attr("rx", 2);

      // Value label
      barG.append("text")
        .attr("x", xBar(d.value) + 6).attr("y", y + barH/2).attr("dy","0.35em")
        .style("font-size","12px").style("fill","#333")
        .text(`${d3.format(".1f")(d.value)}%`);
    });
  }

  // ── Legend (line view only) ───────────────────────────────────────────────
  const legendX = W - margin.right + 10;
  const legendG = svg.append("g").attr("transform",`translate(${legendX},${margin.top})`);

  function updateLegend() {
    legendG.style("display", viewMode === "line" ? null : "none");
    if (viewMode !== "line") return;
    legendG.selectAll("*").remove();
    defaultCountries.forEach((c, i) => {
      legendG.append("line")
        .attr("x1",0).attr("x2",14).attr("y1",i*20+6).attr("y2",i*20+6)
        .attr("stroke", countryColor[c]||"#aaa").attr("stroke-width",2);
      legendG.append("text").attr("x",20).attr("y",i*20+10)
        .style("font-size","11px").style("fill","#333").text(c);
    });
  }

  // ── Main update ───────────────────────────────────────────────────────────
  function updateView() {
    styleButtons();
    updateLegend();
    if (viewMode === "line") drawLine();
    else drawBar();
  }

  // ── Year slider ───────────────────────────────────────────────────────────
  const sliderY  = H - 50;
  const sliderX0 = 90, sliderX1 = W - 60;
  const xSlider  = d3.scalePoint().domain(allYears).range([sliderX0, sliderX1]);
  const sliderG  = svg.append("g");

  const playBtn = sliderG.append("text")
    .attr("x",24).attr("y",sliderY+5)
    .style("font-size","18px").style("cursor","pointer").style("fill","#555")
    .text("▶");

  sliderG.append("text").attr("x",sliderX0).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle")
    .text(allYears[0]);
  sliderG.append("text").attr("x",sliderX1).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle")
    .text(allYears[allYears.length-1]);
  sliderG.append("line")
    .attr("x1",sliderX0).attr("x2",sliderX1)
    .attr("y1",sliderY).attr("y2",sliderY)
    .attr("stroke","#ccc").attr("stroke-width",4).attr("stroke-linecap","round");

  const handle = sliderG.append("circle").attr("cy",sliderY).attr("r",9)
    .attr("fill","#555").style("cursor","pointer");

  function updateYear(y) {
    currentYear = y;
    handle.attr("cx", xSlider(y));
    titleEl.text(`Female labor force participation rate, 1890 to ${y}`);
    if (viewMode === "bar") drawBar();
  }
  updateYear(currentYear);

  sliderG.append("rect")
    .attr("x",sliderX0).attr("y",sliderY-12)
    .attr("width",sliderX1-sliderX0).attr("height",24)
    .attr("fill","transparent").style("cursor","pointer")
    .on("click", function(event) {
      const [mx] = d3.pointer(event);
      updateYear(allYears.reduce((a,b) =>
        Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
    });

  handle.call(d3.drag().on("drag", function(event) {
    const mx = Math.max(sliderX0, Math.min(sliderX1, event.x));
    updateYear(allYears.reduce((a,b) =>
      Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
  }));

  playBtn.on("click", () => {
    if (playing) {
      clearInterval(timer); playing=false; playBtn.text("▶");
    } else {
      if (currentYear===allYears[allYears.length-1]) updateYear(allYears[0]);
      playing=true; playBtn.text("⏸");
      timer = setInterval(() => {
        const idx = allYears.indexOf(currentYear);
        if (idx<allYears.length-1) updateYear(allYears[idx+1]);
        else { clearInterval(timer); playing=false; playBtn.text("▶"); }
      }, 700);
    }
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",margin.left).attr("y",H-28)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333")
    .text("Data source: ");
  svg.append("text").attr("x",margin.left+82).attr("y",H-28)
    .style("font-size","10.5px").style("fill","#333")
    .text("Labour Force Statistics, via World Bank (2026); Killingsworth and Heckman (1986) – with major processing by Our World in Data");
  svg.append("foreignObject")
    .attr("x",margin.left).attr("y",H-20)
    .attr("width",750).attr("height",18)
    .append("xhtml:div")
    .style("font-size","10px").style("color","#555")
    .html("<strong>Note:</strong> For some observations prior to 1960, the participation rate is calculated with respect to the female population aged 14+.");
  svg.append("text").attr("x",W-10).attr("y",H-4)
    .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
    .text("OurWorldInData.org/female-labor-supply | CC BY");

  updateView();
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("female-labor-force-participation-long-run.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["female-labor-force-participation-long-run.csv", {url: new URL("./files/71d9940756b2511dc389e7f5116524302f0d4fe8fe2cfdd54414411a71c7f60a08b61298a7d43d31cbbd74738bd7241da4b85195d58d300057582a67710ab15c.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
