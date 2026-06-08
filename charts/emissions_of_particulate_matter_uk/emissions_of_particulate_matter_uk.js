function _1(md){return(
md`# Emissions of particulate matter, UK`
)}

function _2(rawData,d3)
{
  const W = 900, H = 520;
  const margin = { top: 90, right: 90, bottom: 80, left: 90 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const entity = "United Kingdom";

  const SERIES = [
    { key: "PM₁₀",  col: "PM\u2081\u2080",          color: "#b84c1a" },
    { key: "PM₂.₅", col: "PM\u2082.\u2085",          color: "#4e79a7" }
  ];

  // Deduplicate by year
  const seen = new Set();
  const rows = rawData
    .filter(d => d.Entity === entity)
    .filter(d => { const k = +d.Year; if (seen.has(k)) return false; seen.add(k); return true; })
    .map(d => ({
      year:   +d.Year,
      "PM₁₀":  d["PM\u2081\u2080"] != null && d["PM\u2081\u2080"] !== "" ? +d["PM\u2081\u2080"] : null,
      "PM₂.₅": d["PM\u2082.\u2085"] != null && d["PM\u2082.\u2085"] !== "" ? +d["PM\u2082.\u2085"] : null
    }))
    .sort((a,b) => a.year - b.year);

  const allYears = rows.map(r => r.year);
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
    "Annual emissions of particulate matter from all human-induced sources. This is measured in terms of PM₁₀ and PM₂.₅,",
    "which denotes particulate matter less than 10 and 2.5 microns in diameter, respectively."
  ];
  subtitleLines.forEach((line, i) => {
    svg.append("text").attr("x", margin.left).attr("y", 36 + i * 13)
      .style("font-size","10.5px").style("fill","#555").text(line);
  });

  const mainG = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const fmtVal = v => d3.format(",.0f")(v) + " tonnes";

  const ttG = svg.append("g").style("display","none").style("pointer-events","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 6px rgba(0,0,0,0.13))");
  const ttTitle = ttG.append("text").attr("x",12).attr("y",20)
    .style("font-size","13px").style("font-weight","bold").style("fill","#111");

  function showTooltip(year, row, mx, my) {
    ttTitle.text(year);
    ttG.selectAll(".ttrow").remove();
    SERIES.forEach((s, i) => {
      if (row[s.key] == null) return;
      const g = ttG.append("g").attr("class","ttrow");
      g.append("rect").attr("x",12).attr("y",28+i*18).attr("width",10).attr("height",10)
        .attr("fill",s.color).attr("rx",2);
      g.append("text").attr("x",28).attr("y",37+i*18)
        .style("font-size","11px").style("fill","#333")
        .text(`${s.key}: ${fmtVal(row[s.key])}`);
    });
    const ttH = 24 + SERIES.length * 18 + 8;
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
    titleEl.text(`Emissions of particulate matter, ${entity}, ${allYears[0]} to ${allYears[allYears.length-1]}`);

    const allVals = rows.flatMap(r => SERIES.map(s => r[s.key]).filter(v => v != null));
    const yMax = Math.ceil(d3.max(allVals) / 1e5) * 1e5;
    const xScale = d3.scaleLinear().domain(d3.extent(allYears)).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);

    // Gridlines Y
    d3.range(0, yMax + 1, 1e5).forEach(v => {
      mainG.append("line")
        .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
        .attr("stroke", v===0 ? "#bbb" : "#e0e0e0")
        .attr("stroke-dasharray", v===0?"0":"4,3").attr("stroke-width",1);
      mainG.append("text").attr("x",-6).attr("y",yScale(v)).attr("dy","0.35em")
        .style("font-size","10px").style("fill","#888").style("text-anchor","end")
        .text(v === 0 ? "0 tonnes" : d3.format(",.0f")(v) + " tonnes");
    });

    // Eje X
    allYears.filter(y => y%10===0 || y===allYears[0] || y===allYears[allYears.length-1]).forEach(y => {
      mainG.append("text").attr("x",xScale(y)).attr("y",innerH+18)
        .style("font-size","10px").style("fill","#888").style("text-anchor","middle").text(y);
    });
    mainG.append("line").attr("x1",0).attr("x2",innerW)
      .attr("y1",innerH).attr("y2",innerH).attr("stroke","#bbb").attr("stroke-width",1);

    const lineGen = (key) => d3.line()
      .defined(d => d[key] != null)
      .x(d => xScale(d.year)).y(d => yScale(d[key]))
      .curve(d3.curveMonotoneX);

    SERIES.forEach(s => {
      mainG.append("path").datum(rows)
        .attr("fill","none").attr("stroke",s.color).attr("stroke-width",2)
        .attr("d", lineGen(s.key));
      rows.forEach(r => {
        if (r[s.key] == null) return;
        mainG.append("circle")
          .attr("cx",xScale(r.year)).attr("cy",yScale(r[s.key]))
          .attr("r",2.5).attr("fill",s.color);
      });
      const last = [...rows].reverse().find(r => r[s.key] != null);
      if (last) {
        mainG.append("text")
          .attr("x", innerW + 8).attr("y", yScale(last[s.key])).attr("dy","0.35em")
          .style("font-size","11px").style("font-weight","bold").style("fill",s.color)
          .text(s.key);
      }
    });

    // Hover
    const hoverLine = mainG.append("line").attr("y1",0).attr("y2",innerH)
      .attr("stroke","#999").attr("stroke-width",1).style("display","none");

    mainG.append("rect").attr("width",innerW).attr("height",innerH).attr("fill","transparent")
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event);
        const yr = Math.round(xScale.invert(mx));
        const row = rows.find(r => r.year === yr);
        if (!row) return;
        hoverLine.attr("x1",xScale(yr)).attr("x2",xScale(yr)).style("display",null);
        const [sx,sy] = d3.pointer(event, svg.node());
        showTooltip(yr, row, sx, sy);
      })
      .on("mouseleave", () => { hoverLine.style("display","none"); hideTooltip(); });
  }

  // ── RENDER BAR ────────────────────────────────────────────────────────────
  function renderBar() {
    mainG.selectAll("*").remove();
    titleEl.text(`Emissions of particulate matter, ${entity}, ${currentYear}`);

    const row = rows.find(r => r.year === currentYear);
    if (!row) {
      mainG.append("text").attr("x",innerW/2).attr("y",innerH/2)
        .style("text-anchor","middle").style("fill","#888").style("font-size","14px")
        .text("No data for this year");
      return;
    }

    const barData = SERIES
      .map(s => ({ key: s.key, val: row[s.key] }))
      .filter(d => d.val != null)
      .sort((a,b) => b.val - a.val);

    const BAR_COLOR = "#6b7fad";
    const maxVal = d3.max(barData, d => d.val) * 1.08;
    const xScale = d3.scaleLinear().domain([0, maxVal]).range([0, innerW]);
    const yScale = d3.scaleBand().domain(barData.map(d => d.key)).range([0, innerH]).padding(0.35);

    barData.forEach(d => {
      const y  = yScale(d.key);
      const bw = yScale.bandwidth();
      const cy = y + bw/2;

      mainG.append("rect")
        .attr("x",0).attr("y",y)
        .attr("width",xScale(d.val)).attr("height",bw)
        .attr("fill", BAR_COLOR);

      mainG.append("text").attr("x",-8).attr("y",cy).attr("dy","0.35em")
        .style("text-anchor","end").style("font-size","13px").style("font-weight","bold").style("fill","#222")
        .text(d.key);

      mainG.append("text")
        .attr("x",xScale(d.val)+8).attr("y",cy).attr("dy","0.35em")
        .style("font-size","13px").style("fill","#444")
        .text(fmtVal(d.val));
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
      },200);
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
    .text("DEFRA and EPA (2018) – processed by Our World in Data");
  svg.append("text").attr("x",W-10).attr("y",H-16)
    .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
    .text("OurWorldInData.org/outdoor-air-pollution | CC BY");

  setMode("line");
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("emissions-of-particulate-matter.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["emissions-of-particulate-matter.csv", {url: new URL("./files/8dd8d676f3743320ea3d27faadadc49a126176c3cfcd759e6b1385135cabb367c699460143440b2bff8caa2faba6b7a5d055c402775471b16f13c8f0d069e6b5.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
