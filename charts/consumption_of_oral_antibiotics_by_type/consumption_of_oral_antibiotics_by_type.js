function _1(md){return(
md`# Consumption of oral antibiotics by type`
)}

function _2(rawData,d3)
{
  const W = 1000, H = 680;
  const margin = { top: 95, right: 280, bottom: 80, left: 205 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const entity = "United Kingdom";

  const ANTIBIOTIC_COLS = [
    "Tetracyclines","Penicillins with extended spectrum","Macrolides",
    "Beta-lactamase resistant penicillins","Nitrofuran derivatives",
    "Beta-lactamase sensitive penicillins","Combinations of penicillins",
    "Trimethoprim and derivatives","Fluoroquinolones","Nitroimidazole",
    "Combinations of sulfonamides and trimethoprim","First-generation cephalosporins",
    "Lincosamides","Other antibiotics","Second-generation cephalosporins",
    "Steroid antibiotics","Other aminoglycosides","Intermediate-acting sulfonamides",
    "Amphenicols","Third-generation cephalosporins","Streptogramins",
    "Short-acting sulfonamides","Imidazole derivatives"
  ];

  // Colores distintos para los tipos más relevantes
  const PALETTE = [
    "#2ca02c","#7f7f7f","#bcbd22","#8c564b","#1f3a5f","#17becf",
    "#c49c94","#e377c2","#f7b6d2","#dbdb8d","#9edae5","#aec7e8",
    "#ffbb78","#98df8a","#ff9896","#c5b0d5","#c7c7c7","#9467bd",
    "#d62728","#8c8c8c","#e8cb57","#393b79","#637939"
  ];
  const COLOR_MAP = {};
  ANTIBIOTIC_COLS.forEach((c, i) => { COLOR_MAP[c] = PALETTE[i % PALETTE.length]; });

  // Parse UK data
  const ukRows = rawData
    .filter(d => d.Entity === entity)
    .map(d => {
      const row = { year: +d.Year };
      ANTIBIOTIC_COLS.forEach(c => { row[c] = (d[c] !== "" && d[c] != null) ? +d[c] : null; });
      return row;
    })
    .sort((a,b) => a.year - b.year);

  const allYears = ukRows.map(r => r.year);

  // Which cols have any data for UK
  const activeCols = ANTIBIOTIC_COLS.filter(c => ukRows.some(r => r[c] != null && r[c] > 0));

  // For line: sort series by last value desc
  const lastRow = ukRows[ukRows.length - 1];
  const sortedCols = [...activeCols].sort((a,b) => (lastRow[b] || 0) - (lastRow[a] || 0));

  let currentYear = allYears[allYears.length - 1];
  let mode = "line";
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
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", W).attr("height", H)
    .style("background","#fff");

  const titleEl = svg.append("text").attr("x", margin.left).attr("y", 22)
    .style("font-size","15px").style("font-weight","bold").style("fill","#111");

  const subtitleLines = [
    "Reported defined daily doses of oral antibiotics of each type per 1,000 people. Countries may report data from",
    "different sources, including insurance claims, import records, hospital prescriptions, and wholesale data."
  ];
  subtitleLines.forEach((line, i) => {
    svg.append("text").attr("x", margin.left).attr("y", 36 + i * 13)
      .style("font-size","10.5px").style("fill","#555").text(line);
  });

  const mainG = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none").style("pointer-events","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 6px rgba(0,0,0,0.13))");
  const ttTitle = ttG.append("text").attr("x",12).attr("y",20)
    .style("font-size","13px").style("font-weight","bold").style("fill","#111");

  function showTooltip(year, items, mx, my) {
    ttTitle.text(year);
    ttG.selectAll(".ttrow").remove();
    items.forEach((item, i) => {
      const g = ttG.append("g").attr("class","ttrow");
      g.append("rect").attr("x",12).attr("y",28+i*16).attr("width",9).attr("height",9)
        .attr("fill",item.color).attr("rx",1);
      g.append("text").attr("x",26).attr("y",36+i*16)
        .style("font-size","10px").style("fill","#333")
        .text(`${item.col}: ${d3.format(".2f")(item.val)}`);
    });
    const ttH = 24 + items.length * 16 + 8;
    const ttW = 270;
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
    titleEl.text(`Consumption of oral antibiotics by type, ${entity}, ${allYears[0]} to ${allYears[allYears.length-1]}`);

    const allVals = ukRows.flatMap(r => activeCols.map(c => r[c]).filter(v => v != null));
    const yMax = Math.ceil(d3.max(allVals) / 1) * 1;
    const yMaxR = Math.ceil(yMax);

    const xScale = d3.scaleLinear().domain(d3.extent(allYears)).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, yMaxR]).range([innerH, 0]);

    // Gridlines Y (cada 1 o 2 unidades)
    const step = yMaxR <= 8 ? 1 : 2;
    d3.range(0, yMaxR + 0.01, step).forEach(v => {
      mainG.append("line")
        .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
        .attr("stroke", v===0 ? "#bbb" : "#e0e0e0")
        .attr("stroke-dasharray", v===0?"0":"4,3").attr("stroke-width",1);
      mainG.append("text").attr("x",-6).attr("y",yScale(v)).attr("dy","0.35em")
        .style("font-size","10px").style("fill","#888").style("text-anchor","end").text(v);
    });

    // Eje X
    allYears.forEach(y => {
      mainG.append("text").attr("x",xScale(y)).attr("y",innerH+18)
        .style("font-size","10px").style("fill","#888").style("text-anchor","middle").text(y);
    });
    mainG.append("line").attr("x1",0).attr("x2",innerW)
      .attr("y1",innerH).attr("y2",innerH).attr("stroke","#bbb").attr("stroke-width",1);

    const lineGen = (col) => d3.line()
      .defined(d => d[col] != null)
      .x(d => xScale(d.year)).y(d => yScale(d[col]))
      .curve(d3.curveMonotoneX);

    sortedCols.forEach(col => {
      const color = COLOR_MAP[col] || "#aaa";
      mainG.append("path").datum(ukRows)
        .attr("fill","none").attr("stroke",color).attr("stroke-width",1.8)
        .attr("d", lineGen(col));
      ukRows.forEach(r => {
        if (r[col] == null) return;
        mainG.append("circle")
          .attr("cx",xScale(r.year)).attr("cy",yScale(r[col]))
          .attr("r",2.5).attr("fill",color);
      });
    });

    // Etiquetas a la derecha, ordenadas por valor final
    const labelData = sortedCols.map(col => {
      const last = [...ukRows].reverse().find(r => r[col] != null);
      return last ? { col, val: last[col], y: yScale(last[col]) } : null;
    }).filter(Boolean);

    // Separar etiquetas para evitar solapamiento
    const MIN_GAP = 11;
    const placed = [];
    labelData.forEach(d => {
      let y = d.y;
      for (const p of placed) {
        if (Math.abs(y - p) < MIN_GAP) y = p + MIN_GAP;
      }
      placed.push(y);
      const color = COLOR_MAP[d.col] || "#aaa";
      mainG.append("text")
        .attr("x", innerW + 8).attr("y", y).attr("dy","0.35em")
        .style("font-size","9.5px").style("fill", color)
        .text(d.col);
    });

    // Hover
    const hoverLine = mainG.append("line").attr("y1",0).attr("y2",innerH)
      .attr("stroke","#999").attr("stroke-width",1).style("display","none");

    mainG.append("rect").attr("width",innerW).attr("height",innerH).attr("fill","transparent")
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event);
        const yr = Math.round(xScale.invert(mx));
        const row = ukRows.find(r => r.year === yr);
        if (!row) return;
        hoverLine.attr("x1",xScale(yr)).attr("x2",xScale(yr)).style("display",null);
        const items = sortedCols
          .map(col => ({ col, val: row[col], color: COLOR_MAP[col] || "#aaa" }))
          .filter(d => d.val != null && d.val > 0)
          .sort((a,b) => b.val - a.val);
        const [sx,sy] = d3.pointer(event, svg.node());
        if (items.length) showTooltip(yr, items, sx, sy);
        else hideTooltip();
      })
      .on("mouseleave", () => { hoverLine.style("display","none"); hideTooltip(); });
  }

  // ── RENDER BAR ────────────────────────────────────────────────────────────
  function renderBar() {
    mainG.selectAll("*").remove();
    titleEl.text(`Consumption of oral antibiotics by type, ${entity}, ${currentYear}`);

    const row = ukRows.find(r => r.year === currentYear);
    if (!row) {
      mainG.append("text").attr("x",innerW/2).attr("y",innerH/2)
        .style("text-anchor","middle").style("fill","#888").style("font-size","14px")
        .text("No data for this year");
      return;
    }

    const barData = activeCols
      .map(col => ({ col, val: row[col] ?? 0 }))
      .filter(d => d.val >= 0)
      .sort((a,b) => b.val - a.val);

    const BAR_COLOR = "#6b7fad";
    const maxVal = d3.max(barData, d => d.val) * 1.08;
    const xScale = d3.scaleLinear().domain([0, maxVal]).range([0, innerW]);
    const yScale = d3.scaleBand().domain(barData.map(d => d.col)).range([0, innerH]).padding(0.2);

    barData.forEach(d => {
      const y  = yScale(d.col);
      const bw = yScale.bandwidth();
      const cy = y + bw / 2;
      const minW = d.val > 0 ? Math.max(xScale(d.val), 2) : 0;

      mainG.append("rect")
        .attr("x",0).attr("y",y)
        .attr("width", minW).attr("height",bw)
        .attr("fill", BAR_COLOR);

      mainG.append("text").attr("x",-6).attr("y",cy).attr("dy","0.35em")
        .style("text-anchor","end").style("font-size","10.5px").style("font-weight","bold").style("fill","#222")
        .text(d.col);

      const label = d.val < 0.1 && d.val > 0 ? "<0.1" : d3.format(".1f")(d.val);
      mainG.append("text")
        .attr("x", Math.max(minW, 3) + 5).attr("y",cy).attr("dy","0.35em")
        .style("font-size","10.5px").style("fill","#444")
        .text(label);
    });

    mainG.append("line").attr("x1",0).attr("x2",0).attr("y1",0).attr("y2",innerH)
      .attr("stroke","#bbb").attr("stroke-width",1);
  }

  // ── Slider ────────────────────────────────────────────────────────────────
  const sliderY = H - 42;
  const sliderX0 = 90, sliderX1 = W - 60;
  const xSlider = d3.scalePoint().domain(allYears).range([sliderX0, sliderX1]);
  const sliderG = svg.append("g");

  const playBtn = sliderG.append("text").attr("x",24).attr("y",sliderY+5)
    .style("font-size","18px").style("cursor","pointer").style("fill","#555").text("▶");

  sliderG.append("text").attr("x",sliderX0).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(allYears[0]);
  sliderG.append("text").attr("x",sliderX1).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(allYears[allYears.length-1]);
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
      updateYear(allYears.reduce((a,b) => Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
    });

  handle.call(d3.drag().on("drag", function(event) {
    const mx = Math.max(sliderX0, Math.min(sliderX1, event.x));
    updateYear(allYears.reduce((a,b) => Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
  }));

  playBtn.on("click", () => {
    if (playing) { clearInterval(timer); playing=false; playBtn.text("▶"); }
    else {
      if (currentYear===allYears[allYears.length-1]) updateYear(allYears[0]);
      playing=true; playBtn.text("⏸");
      timer=setInterval(()=>{
        const idx=allYears.indexOf(currentYear);
        if(idx<allYears.length-1) updateYear(allYears[idx+1]);
        else{clearInterval(timer);playing=false;playBtn.text("▶");}
      },500);
    }
  });

  // ── Mode switching ────────────────────────────────────────────────────────
  function setMode(m) {
    mode = m;
    btnLine.style("background",m==="line"?"#3a6fc4":"#fff").style("color",m==="line"?"#fff":"#333");
    btnBar .style("background",m==="bar" ?"#3a6fc4":"#fff").style("color",m==="bar" ?"#fff":"#333");
    sliderG.style("display",m==="line"?"none":null);
    hideTooltip();
    if(m==="line") renderLine();
    if(m==="bar")  renderBar();
  }
  btnLine.on("click",()=>setMode("line"));
  btnBar .on("click",()=>setMode("bar"));

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",margin.left).attr("y",H-16)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",margin.left+80).attr("y",H-16)
    .style("font-size","10.5px").style("fill","#333")
    .text("WHO Global Antimicrobial Resistance and Use Surveillance System (GLASS) (2024) – processed by Our World in Data");
  svg.append("text").attr("x",W-10).attr("y",H-16)
    .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
    .text("OurWorldInData.org/antibiotics | CC BY");

  setMode("line");
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("consumption-of-oral-antibiotics-by-type.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["consumption-of-oral-antibiotics-by-type.csv", {url: new URL("./files/c439905bfae334c5851823e518333a402985e955f12ad72ed6b0d1e1cb3038b682e8bf0ab0273d33971ba43ff7d3f39a0790914405fe42dbb02d7232931fe700.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
