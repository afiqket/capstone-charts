function _1(md){return(
md`# Number of countries with key economic and social rights for women`
)}

function _2(rawData,d3)
{
  const W = 900, H = 510;
  const margin = { top: 75, right: 230, bottom: 80, left: 50 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const SERIES = [
    { key: "Equal right to start a business",       col: "Equal right to start a business",       color: "#8b1a1a" },
    { key: "Equal property rights",                 col: "Equal property rights",                 color: "#9b59b6" },
    { key: "Domestic violence sanctioned",          col: "Domestic violence sanctioned",          color: "#2e8b6e" },
    { key: "Employment discrimination prohibited",  col: "Employment discrimination prohibited",  color: "#4472c4" },
    { key: "Substantial paid leave for mothers",    col: "Substantial paid leave for mothers",    color: "#8c6d2f" },
    { key: "Pay equity mandated",                   col: "Pay equity mandated",                   color: "#c0392b" }
  ];

  const rows = rawData
    .filter(d => d.Entity === "World")
    .map(d => {
      const r = { year: +d.Year };
      SERIES.forEach(s => { r[s.key] = +d[s.col] || 0; });
      return r;
    })
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
    .attr("viewBox",`0 0 ${W} ${H}`)
    .attr("width",W).attr("height",H)
    .style("background","#fff");

  const titleEl = svg.append("text").attr("x",margin.left).attr("y",22)
    .style("font-size","15px").style("font-weight","bold").style("fill","#111");

  svg.append("text").attr("x",margin.left).attr("y",40)
    .style("font-size","10.5px").style("fill","#555")
    .text("Number of countries with key economic and social rights for women, World");

  const mainG = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

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
    const sorted = SERIES.slice().sort((a,b) => row[b.key] - row[a.key]);
    sorted.forEach((s, i) => {
      const g = ttG.append("g").attr("class","ttrow");
      g.append("rect").attr("x",12).attr("y",30+i*20).attr("width",12).attr("height",12)
        .attr("fill",s.color).attr("rx",2);
      g.append("text").attr("x",30).attr("y",41+i*20)
        .style("font-size","11px").style("fill","#333").text(s.key);
      g.append("text").attr("x",255).attr("y",41+i*20)
        .style("font-size","11px").style("font-weight","bold").style("fill","#111").style("text-anchor","end")
        .text(d3.format(",")(row[s.key]));
    });
    const ttH = 28 + sorted.length * 20 + 6;
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
    titleEl.text(`Number of countries with key economic and social rights for women, World`);

    const yMax = 200;
    const xScale = d3.scaleLinear().domain(d3.extent(allYears)).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);

    // Gridlines
    [0,20,40,60,80,100,120,140,160,180].forEach(v => {
      mainG.append("line")
        .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
        .attr("stroke", v===0?"#bbb":"#e0e0e0")
        .attr("stroke-dasharray", v===0?"0":"4,3").attr("stroke-width",1);
      mainG.append("text").attr("x",-6).attr("y",yScale(v)).attr("dy","0.35em")
        .style("font-size","10px").style("fill","#888").style("text-anchor","end").text(v);
    });

    // X axis
    [1970,1980,1990,2000,2010,2023].forEach(y => {
      mainG.append("text").attr("x",xScale(y)).attr("y",innerH+16)
        .style("font-size","10px").style("fill","#888").style("text-anchor","middle").text(y);
    });
    mainG.append("line").attr("x1",0).attr("x2",innerW)
      .attr("y1",innerH).attr("y2",innerH).attr("stroke","#bbb").attr("stroke-width",1);

    const lineGen = d3.line().x(d => xScale(d.year)).y(d => yScale(d.value));

    SERIES.forEach(s => {
      const vals = rows.map(r => ({ year: r.year, value: r[s.key] }));
      mainG.append("path").datum(vals)
        .attr("fill","none").attr("stroke",s.color).attr("stroke-width",2)
        .attr("d", lineGen);
      vals.forEach(r => {
        mainG.append("circle")
          .attr("cx",xScale(r.year)).attr("cy",yScale(r.value))
          .attr("r",2.2).attr("fill",s.color);
      });
      const last = vals[vals.length - 1];
      mainG.append("text")
        .attr("x", innerW + 5).attr("y", yScale(last.value)).attr("dy","0.35em")
        .style("font-size","10px").style("font-weight","bold").style("fill",s.color)
        .call(text => {
          // wrap long labels
          const words = s.key.split(" ");
          if (s.key.length > 22) {
            const mid = Math.ceil(words.length / 2);
            text.append("tspan").attr("x", innerW + 5).attr("dy","-0.5em").text(words.slice(0,mid).join(" "));
            text.append("tspan").attr("x", innerW + 5).attr("dy","1.1em").text(words.slice(mid).join(" "));
          } else {
            text.text(s.key);
          }
        });
    });

    // Hover
    const hoverLine = mainG.append("line").attr("y1",0).attr("y2",innerH)
      .attr("stroke","#aaa").attr("stroke-width",1).style("display","none");

    mainG.append("rect").attr("width",innerW).attr("height",innerH).attr("fill","transparent")
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event);
        const yr = Math.round(xScale.invert(mx));
        const row = rows.reduce((a,b) => Math.abs(a.year-yr)<Math.abs(b.year-yr)?a:b);
        hoverLine.attr("x1",xScale(row.year)).attr("x2",xScale(row.year)).style("display",null);
        const [sx,sy] = d3.pointer(event, svg.node());
        showTooltip(row.year, row, sx, sy);
      })
      .on("mouseleave", () => { hoverLine.style("display","none"); hideTooltip(); });
  }

  // ── RENDER BAR ────────────────────────────────────────────────────────────
  function renderBar() {
    mainG.selectAll("*").remove();
    titleEl.text(`Number of countries with key economic and social rights for women, World, ${currentYear}`);

    const row = rows.find(r => r.year === currentYear)
      || rows.reduce((a,b) => Math.abs(a.year-currentYear)<Math.abs(b.year-currentYear)?a:b);

    const barData = SERIES.map(s => ({ key: s.key, val: row[s.key] }))
      .sort((a,b) => b.val - a.val);

    const BAR_COLOR = "#6b7fad";
    const xScale = d3.scaleLinear().domain([0, d3.max(barData, d => d.val) * 1.06]).range([0, innerW]);
    const yScale = d3.scaleBand().domain(barData.map(d => d.key)).range([0, innerH]).padding(0.3);

    barData.forEach(d => {
      const y  = yScale(d.key);
      const bw = yScale.bandwidth();
      const cy = y + bw/2;

      mainG.append("rect")
        .attr("x",0).attr("y",y)
        .attr("width",xScale(d.val)).attr("height",bw)
        .attr("fill",BAR_COLOR);

      // Wrap label if long
      const words = d.key.split(" ");
      const mid = Math.ceil(words.length / 2);
      const labelEl = mainG.append("text").attr("x",-8).attr("y",cy)
        .style("text-anchor","end").style("font-size","12px").style("font-weight","bold").style("fill","#222");
      if (d.key.length > 20) {
        labelEl.append("tspan").attr("x",-8).attr("dy","-0.55em").text(words.slice(0,mid).join(" "));
        labelEl.append("tspan").attr("x",-8).attr("dy","1.1em").text(words.slice(mid).join(" "));
      } else {
        labelEl.attr("dy","0.35em").text(d.key);
      }

      mainG.append("text")
        .attr("x",xScale(d.val)+6).attr("y",cy).attr("dy","0.35em")
        .style("font-size","13px").style("fill","#444")
        .text(d3.format(",")(d.val));
    });

    mainG.append("line").attr("x1",0).attr("x2",0).attr("y1",0).attr("y2",innerH)
      .attr("stroke","#bbb").attr("stroke-width",1);
  }

  // ── Slider ────────────────────────────────────────────────────────────────
  const sliderY  = H - 46;
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
  svg.append("text").attr("x",margin.left).attr("y",H-26)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",margin.left+80).attr("y",H-26)
    .style("font-size","10.5px").style("fill","#333")
    .text("World Bank Gender Statistics (2025) – processed by Our World in Data");
  svg.append("text").attr("x",W-10).attr("y",H-26)
    .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
    .text("OurWorldInData.org/women-rights | CC BY");
  svg.append("text").attr("x",margin.left).attr("y",H-12)
    .style("font-size","10px").style("fill","#777")
    .text("Note: \"Pay equity\" refers to \"work of equal value\", meaning not just the same job, but also different jobs that are similar in skills, responsibilities, and working conditions.");

  setMode("line");
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("number-of-countries-with-key-economic-and-social-rights-for-women.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["number-of-countries-with-key-economic-and-social-rights-for-women.csv", {url: new URL("./files/83442387723fa5a9ba3e8e930d216f356cd3ec8fb612e9e6a3d80e56d96fac08ae0f23ac8f0cbf334be2f82ac586f1d23babda6eebe6e4664821e533b50fe86d.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
