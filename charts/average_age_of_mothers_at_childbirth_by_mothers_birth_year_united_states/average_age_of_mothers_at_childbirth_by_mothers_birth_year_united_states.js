function _1(md){return(
md`# Average age of mothers at childbirth by mother's birth year, United States`
)}

function _2(rawData,d3)
{
  const W = 900, H = 560;
  const margin = { top: 75, right: 170, bottom: 100, left: 55 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const country = "United States";

  // Orden de arriba (5th) a abajo (1st), con "All" en naranja destacado
  const SERIES = [
    { col: "5th birth or higher", label: "5th birth or higher", color: "#B8C4D4" },
    { col: "4th birth",           label: "4th birth",           color: "#8FA8C0" },
    { col: "3rd birth",           label: "3rd birth",           color: "#6080A0" },
    { col: "2nd birth",           label: "2nd birth",           color: "#4A6585" },
    { col: "All",                 label: "All",                 color: "#C07038" },
    { col: "1st birth",           label: "1st birth",           color: "#1A3A5C" },
  ];

  const COL_MAP = {
  "1st birth":           "1st birth",
  "2nd birth":           "2nd birth",
  "3rd birth":           "3rd birth",
  "4th birth":           "4th birth",
  "5th birth or higher": "5th birth or higher",
  "All":                  "All",
};

  const rows = rawData
    .filter(d => d.Entity === country)
    .map(d => {
      const r = { year: +d.Year };
      SERIES.forEach(s => {
        const raw = d[COL_MAP[s.col]];
        r[s.col] = raw != null && raw !== "" ? +raw : null;
      });
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

  svg.append("text").attr("x", margin.left).attr("y", 38)
    .style("font-size","11px").style("fill","#555")
    .text("Each line shows the average age of women who had their first child, second child, third child, or higher in a given year.");

  const mainG = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 6px rgba(0,0,0,0.13))");
  const ttTitle = ttG.append("text").attr("x",12).attr("y",20)
    .style("font-size","13px").style("font-weight","bold").style("fill","#111");

  function showTooltip(year, row, mx, my) {
    ttTitle.text(`${country}, ${year}`);
    ttG.selectAll(".ttrow").remove();
    SERIES.forEach((s, i) => {
      const v = row[s.col];
      if (v == null) return;
      ttG.append("text").attr("class","ttrow")
        .attr("x",12).attr("y", 36 + i*16)
        .style("font-size","11px").style("fill", s.color)
        .style("font-weight", s.col==="All"?"bold":"normal")
        .text(`${s.label}: ${d3.format(".2f")(v)} years`);
    });
    const ttH = 28 + SERIES.length*16 + 4;
    const ttW = 210;
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
    titleEl.text(`Average age of mothers at childbirth by birth order, ${country}`);

    const allVals = rows.flatMap(r => SERIES.map(s => r[s.col]).filter(v => v != null));
    const yMin = Math.floor((d3.min(allVals)||15) / 5) * 5;
    const yMax = Math.ceil((d3.max(allVals)||40) / 5) * 5;

    const xScale = d3.scaleLinear().domain(d3.extent(years)).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([yMin, yMax]).range([innerH, 0]);

    // Gridlines
    d3.range(yMin, yMax+1, 5).forEach(v => {
      mainG.append("line")
        .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
        .attr("stroke", v===yMin?"#aaa":"#e0e0e0")
        .attr("stroke-dasharray", v===yMin?"0":"4,3").attr("stroke-width",1);
      mainG.append("text")
        .attr("x",-8).attr("y",yScale(v)).attr("dy","0.35em")
        .style("font-size","11px").style("fill","#888").style("text-anchor","end").text(v);
    });

    // Eje X
    const xTicks = years.filter(y => y % 20 === 0);
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

    // Dibujar líneas (grises primero, luego "All" naranja, luego "1st birth" encima)
    [...SERIES].reverse().forEach(s => {
      mainG.append("path")
        .attr("fill","none").attr("stroke",s.color)
        .attr("stroke-width", s.col==="All" ? 2.5 : s.col==="1st birth" ? 2 : 1.5)
        .attr("d", lineGen(s.col));
    });

    // Etiquetas al final
    const lastRow = rows[rows.length-1];
    SERIES.forEach(s => {
      const v = lastRow[s.col];
      if (v == null) return;
      mainG.append("text")
        .attr("x",innerW+6).attr("y",yScale(v)).attr("dy","0.35em")
        .style("font-size","11px").style("font-weight", s.col==="All"||s.col==="1st birth"?"bold":"normal")
        .style("fill",s.color).text(s.label);
    });

    // Hover
    const hoverLine = mainG.append("line").attr("y1",0).attr("y2",innerH)
      .attr("stroke","#999").attr("stroke-width",1).style("display","none");

    mainG.append("rect").attr("width",innerW).attr("height",innerH)
      .attr("fill","transparent")
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event);
        const yr = Math.round(xScale.invert(mx));
        const closest = years.reduce((a,b)=>Math.abs(a-yr)<Math.abs(b-yr)?a:b);
        const row = byYear.get(closest);
        if (!row) return hideTooltip();
        hoverLine.attr("x1",xScale(closest)).attr("x2",xScale(closest)).style("display",null);
        const [sx,sy] = d3.pointer(event, svg.node());
        showTooltip(closest, row, sx, sy);
      })
      .on("mouseleave", () => { hoverLine.style("display","none"); hideTooltip(); });
  }

  // ── RENDER BAR ────────────────────────────────────────────────────────────
  function renderBar() {
    mainG.selectAll("*").remove();
    titleEl.text(`Average age of mothers at childbirth by birth order, ${country}, ${currentYear}`);

    const row = byYear.get(currentYear);
    // Ordenar de mayor a menor valor (igual que OWID: 5th+ arriba, 1st abajo)
    const barData = SERIES
      .map(s => ({ label: s.label, color: s.color, value: row && row[s.col] != null ? row[s.col] : null }))
      .filter(d => d.value != null)
      .sort((a,b) => b.value - a.value);

    if (!barData.length) {
      mainG.append("text").attr("x",innerW/2).attr("y",innerH/2)
        .style("text-anchor","middle").style("fill","#888").style("font-size","14px")
        .text("No data for this year");
      return;
    }

    const maxVal = d3.max(barData, d=>d.value) * 1.06;
    const xScale = d3.scaleLinear().domain([0, maxVal]).range([0, innerW]);
    const yScale = d3.scaleBand().domain(barData.map(d=>d.label))
      .range([0, innerH]).padding(0.28);

    barData.forEach(d => {
      mainG.append("rect")
        .attr("x",0).attr("y",yScale(d.label))
        .attr("width",xScale(d.value)).attr("height",yScale.bandwidth())
        .attr("fill",d.color);
      mainG.append("text")
        .attr("x",-8).attr("y",yScale(d.label)+yScale.bandwidth()/2).attr("dy","0.35em")
        .style("text-anchor","end").style("font-size","12px").style("font-weight","bold").style("fill","#333")
        .text(d.label);
      mainG.append("text")
        .attr("x",xScale(d.value)+6).attr("y",yScale(d.label)+yScale.bandwidth()/2).attr("dy","0.35em")
        .style("font-size","12px").style("fill","#444")
        .text(d3.format(".2f")(d.value));
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
      }, 200);
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
    .text("Human Fertility Database (2025) – processed by Our World in Data");
  svg.append("text").attr("x",margin.left).attr("y",H-5)
    .style("font-size","10px").style("fill","#aaa")
    .text("OurWorldInData.org/fertility-rate | CC BY");

  setMode("line");
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("average-age-of-mothers-birth-cohort.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["average-age-of-mothers-birth-cohort.csv", {url: new URL("./files/c9250009143f77937b2cae6883537bef09627c059fdc5150e69060dc4b352961f86d60154a06ea2fc3569fe3d63e5c2af68dac7bd628e70aaf19e5d2afb88805.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
