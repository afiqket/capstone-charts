function _1(md){return(
md`# Global commodity price index of cereal crops and petroleum`
)}

function _2(rawData,d3)
{
  const W = 900, H = 520;
  const margin = { top: 80, right: 150, bottom: 70, left: 100 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const SERIES = [
    { key: "Petroleum", color: "#4472c4" },
    { key: "Corn",      color: "#8c6d2f" },
    { key: "Wheat",     color: "#b84c1a" }
  ];

  const rows = rawData
    .filter(d => d.Entity === "World")
    .map(d => ({
      year:      +d.Year,
      Petroleum: d.Petroleum != null && d.Petroleum !== "" ? +d.Petroleum : null,
      Wheat:     d.Wheat     != null && d.Wheat     !== "" ? +d.Wheat     : null,
      Corn:      d.Corn      != null && d.Corn      !== "" ? +d.Corn      : null
    }))
    .sort((a, b) => a.year - b.year);

  const allYears = rows.map(r => r.year);
  let currentYear = allYears[allYears.length - 1];
  let mode = "line";
  let playing = false, timer = null;

  // ── Container ─────────────────────────────────────────────────────────────
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
    .style("font-size","16px").style("font-weight","bold").style("fill","#111");

  svg.append("text").attr("x", margin.left).attr("y", 40)
    .style("font-size","10.5px").style("fill","#555")
    .text("This price index is measured relative to real prices in 1900 (where 1900 = 100).");

  const mainG = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none").style("pointer-events","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 6px rgba(0,0,0,0.13))");
  const ttTitle = ttG.append("text").attr("x",12).attr("y",22)
    .style("font-size","14px").style("font-weight","bold").style("fill","#111");

  function showTooltip(year, row, mx, my) {
    ttTitle.text(year);
    ttG.selectAll(".ttrow").remove();
    const present = SERIES.filter(s => row[s.key] != null).sort((a,b) => row[b.key]-row[a.key]);
    present.forEach((s, i) => {
      const g = ttG.append("g").attr("class","ttrow");
      g.append("rect").attr("x",12).attr("y",30+i*22).attr("width",12).attr("height",12)
        .attr("fill",s.color).attr("rx",2);
      g.append("text").attr("x",30).attr("y",41+i*22)
        .style("font-size","12px").style("fill","#333")
        .text(s.key);
      g.append("text").attr("x",160).attr("y",41+i*22)
        .style("font-size","12px").style("font-weight","bold").style("fill","#111").style("text-anchor","end")
        .text(d3.format(".2f")(row[s.key]));
    });
    const ttH = 26 + present.length * 22 + 8;
    const ttW = 175;
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
    titleEl.text(`Global commodity price index of cereal crops and petroleum, ${allYears[0]} to ${allYears[allYears.length-1]}`);

    const allVals = rows.flatMap(r => SERIES.map(s => r[s.key]).filter(v => v != null));
    const yMax = Math.ceil(d3.max(allVals) / 100) * 100;
    const xScale = d3.scaleLinear().domain(d3.extent(allYears)).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);

    // Gridlines Y
    yScale.ticks(8).forEach(v => {
      mainG.append("line")
        .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
        .attr("stroke", v===0 ? "#bbb" : "#e0e0e0")
        .attr("stroke-dasharray", v===0?"0":"4,3").attr("stroke-width",1);
      mainG.append("text").attr("x",-6).attr("y",yScale(v)).attr("dy","0.35em")
        .style("font-size","10px").style("fill","#888").style("text-anchor","end").text(v);
    });

    // X axis ticks
    [1850,1880,1900,1920,1940,1960,1980,2000,2020].forEach(y => {
      mainG.append("text").attr("x",xScale(y)).attr("y",innerH+16)
        .style("font-size","10px").style("fill","#888").style("text-anchor","middle").text(y);
    });
    mainG.append("line").attr("x1",0).attr("x2",innerW)
      .attr("y1",innerH).attr("y2",innerH).attr("stroke","#bbb").attr("stroke-width",1);

    // Lines
    SERIES.forEach(s => {
      const lineGen = d3.line().defined(d => d[s.key] != null)
        .x(d => xScale(d.year)).y(d => yScale(d[s.key]));
      mainG.append("path").datum(rows)
        .attr("fill","none").attr("stroke",s.color).attr("stroke-width",1.8)
        .attr("d", lineGen);
      const last = [...rows].reverse().find(r => r[s.key] != null);
      if (last) {
        mainG.append("text")
          .attr("x", innerW + 6).attr("y", yScale(last[s.key])).attr("dy","0.35em")
          .style("font-size","11px").style("font-weight","bold").style("fill",s.color)
          .text(s.key);
      }
    });

    // Hover vertical line
    const hoverLine = mainG.append("line").attr("y1",0).attr("y2",innerH)
      .attr("stroke","#aaa").attr("stroke-width",1).style("display","none");
    const hoverDots = SERIES.map(s =>
      mainG.append("circle").attr("r",5).attr("fill",s.color).style("display","none")
    );

    mainG.append("rect").attr("width",innerW).attr("height",innerH).attr("fill","transparent")
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event);
        const yr = Math.round(xScale.invert(mx));
        const row = rows.reduce((a,b) => Math.abs(a.year-yr)<Math.abs(b.year-yr)?a:b);
        hoverLine.attr("x1",xScale(row.year)).attr("x2",xScale(row.year)).style("display",null);
        SERIES.forEach((s,i) => {
          if (row[s.key] != null) {
            hoverDots[i].attr("cx",xScale(row.year)).attr("cy",yScale(row[s.key])).style("display",null);
          } else {
            hoverDots[i].style("display","none");
          }
        });
        const [sx,sy] = d3.pointer(event, svg.node());
        showTooltip(row.year, row, sx, sy);
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
    titleEl.text(`Global commodity price index of cereal crops and petroleum, ${currentYear}`);

    const row = rows.find(r => r.year === currentYear)
      || rows.reduce((a,b) => Math.abs(a.year-currentYear)<Math.abs(b.year-currentYear)?a:b);
    if (!row) return;

    const barData = SERIES
      .map(s => ({ key: s.key, val: row[s.key] }))
      .filter(d => d.val != null)
      .sort((a,b) => b.val - a.val);

    const BAR_COLOR = "#6b7fad";
    const xScale = d3.scaleLinear().domain([0, d3.max(barData, d => d.val) * 1.06]).range([0, innerW]);
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
        .text(d3.format(".2f")(d.val));
    });

    mainG.append("line").attr("x1",0).attr("x2",0).attr("y1",0).attr("y2",innerH)
      .attr("stroke","#bbb").attr("stroke-width",1);
  }

  // ── Slider ────────────────────────────────────────────────────────────────
  const sliderY  = H - 42;
  const sliderX0 = 90, sliderX1 = W - 60;
  const xSlider  = d3.scalePoint().domain(allYears).range([sliderX0, sliderX1]);
  const sliderG  = svg.append("g");

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
        else { clearInterval(timer); playing=false; playBtn.text("▶"); }
      }, 120);
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
    .text("Jacks (2020) – processed by Our World in Data");
  svg.append("text").attr("x",W-10).attr("y",H-16)
    .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
    .text("OurWorldInData.org/food-prices | CC BY");

  setMode("line");
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("commodity-price-index-cereal-crops-and-petroleum.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["commodity-price-index-cereal-crops-and-petroleum.csv", {url: new URL("./files/e9dbbfccd8ecfa5bf928e94e41894e47891b5328411f9234fa270622d73ffc1418a02e24a2112e32702d315b408b09db56d8da05476b7ecbf6c0b6ed31bb97d9.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
