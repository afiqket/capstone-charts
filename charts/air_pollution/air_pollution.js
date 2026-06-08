function _1(md){return(
md`# Air pollution`
)}

function _2(rawData,d3)
{
  const W = 900, H = 520;
  const margin = { top: 80, right: 90, bottom: 80, left: 70 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const COL = "Suspended Particulate Matter (SPM) (Fouquet and DPCC (2011))";
  const ENTITIES = ["London", "Delhi"];
  const COLORS = { London: "#4e79a7", Delhi: "#b84c1a" };

  // Deduplicate by entity+year
  const seen = new Set();
  const parsed = rawData
    .filter(d => ENTITIES.includes(d.Entity) && d[COL] != null && d[COL] !== "")
    .filter(d => {
      const k = d.Entity + "|" + d.Year;
      if (seen.has(k)) return false;
      seen.add(k); return true;
    })
    .map(d => ({ entity: d.Entity, year: +d.Year, val: +d[COL] }));

  const seriesData = ENTITIES.map(e => ({
    entity: e,
    pts: parsed.filter(d => d.entity === e).sort((a,b) => a.year - b.year)
  })).filter(s => s.pts.length > 0);

  const allYears = [...new Set(parsed.map(d => d.year))].sort((a,b) => a-b);
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

  svg.append("text").attr("x", margin.left).attr("y", 38)
    .style("font-size","10.5px").style("fill","#555")
    .text("Average concentrations of suspended particulate matter, measured in micrograms per cubic meter.");

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
      g.append("rect").attr("x",12).attr("y",28+i*18).attr("width",10).attr("height",10)
        .attr("fill",item.color).attr("rx",2);
      g.append("text").attr("x",28).attr("y",37+i*18)
        .style("font-size","11px").style("fill","#333")
        .text(`${item.entity}: ${d3.format(",.0f")(item.val)} μg/m³`);
    });
    const ttH = 24 + items.length * 18 + 8;
    const ttW = 200;
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
    titleEl.text(`Air pollution, ${allYears[0]} to ${allYears[allYears.length-1]}`);

    const allVals = parsed.map(d => d.val);
    const yMax = Math.ceil(d3.max(allVals) / 100) * 100;
    const xExtent = d3.extent(allYears);

    const xScale = d3.scaleLinear().domain(xExtent).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);

    // Gridlines Y
    d3.range(0, yMax + 1, 100).forEach(v => {
      mainG.append("line")
        .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
        .attr("stroke", v===0 ? "#bbb" : "#e0e0e0")
        .attr("stroke-dasharray", v===0?"0":"4,3").attr("stroke-width",1);
      mainG.append("text").attr("x",-6).attr("y",yScale(v)).attr("dy","0.35em")
        .style("font-size","10px").style("fill","#888").style("text-anchor","end")
        .text(v === 0 ? "0 μg/m³" : d3.format(",.0f")(v) + " μg/m³");
    });

    // Eje X (major ticks cada 50 años)
    d3.range(Math.ceil(xExtent[0]/50)*50, xExtent[1]+1, 50).forEach(y => {
      mainG.append("text").attr("x",xScale(y)).attr("y",innerH+18)
        .style("font-size","10px").style("fill","#888").style("text-anchor","middle").text(y);
    });
    mainG.append("text").attr("x",xScale(xExtent[1])).attr("y",innerH+18)
      .style("font-size","10px").style("fill","#888").style("text-anchor","middle").text(xExtent[1]);
    mainG.append("line").attr("x1",0).attr("x2",innerW)
      .attr("y1",innerH).attr("y2",innerH).attr("stroke","#bbb").attr("stroke-width",1);

    const lineGen = d3.line().x(d => xScale(d.year)).y(d => yScale(d.val)).curve(d3.curveMonotoneX);

    seriesData.forEach(s => {
      const color = COLORS[s.entity] || "#888";
      mainG.append("path").datum(s.pts)
        .attr("fill","none").attr("stroke",color).attr("stroke-width",2).attr("d",lineGen);
      s.pts.forEach(p => {
        mainG.append("circle")
          .attr("cx",xScale(p.year)).attr("cy",yScale(p.val))
          .attr("r",2.5).attr("fill",color);
      });
      const last = s.pts[s.pts.length - 1];
      mainG.append("text")
        .attr("x", innerW + 8).attr("y", yScale(last.val)).attr("dy","0.35em")
        .style("font-size","11px").style("font-weight","bold").style("fill",color)
        .text(s.entity);
    });

    // Hover
    const hoverLine = mainG.append("line").attr("y1",0).attr("y2",innerH)
      .attr("stroke","#999").attr("stroke-width",1).style("display","none");

    mainG.append("rect").attr("width",innerW).attr("height",innerH).attr("fill","transparent")
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event);
        const yr = Math.round(xScale.invert(mx));
        const items = seriesData.map(s => {
          const pt = s.pts.find(p => p.year === yr);
          if (!pt) return null;
          return { entity: s.entity, val: pt.val, color: COLORS[s.entity] };
        }).filter(Boolean);
        if (!items.length) { hoverLine.style("display","none"); hideTooltip(); return; }
        hoverLine.attr("x1",xScale(yr)).attr("x2",xScale(yr)).style("display",null);
        const [sx,sy] = d3.pointer(event, svg.node());
        showTooltip(yr, items, sx, sy);
      })
      .on("mouseleave", () => { hoverLine.style("display","none"); hideTooltip(); });
  }

  // ── RENDER BAR ────────────────────────────────────────────────────────────
  function renderBar() {
    mainG.selectAll("*").remove();
    titleEl.text(`Air pollution, ${currentYear}`);

    const barData = seriesData.map(s => {
      const pt = s.pts.find(p => p.year === currentYear);
      return pt ? { entity: s.entity, val: pt.val } : null;
    }).filter(Boolean).sort((a,b) => b.val - a.val);

    if (!barData.length) {
      mainG.append("text").attr("x",innerW/2).attr("y",innerH/2)
        .style("text-anchor","middle").style("fill","#888").style("font-size","14px")
        .text("No data for this year");
      return;
    }

    const BAR_COLOR = "#6b7fad";
    const maxVal = d3.max(barData, d => d.val) * 1.08;
    const xScale = d3.scaleLinear().domain([0, maxVal]).range([0, innerW]);
    const yScale = d3.scaleBand().domain(barData.map(d => d.entity)).range([0, innerH]).padding(0.35);

    barData.forEach(d => {
      const y  = yScale(d.entity);
      const bw = yScale.bandwidth();
      const cy = y + bw/2;

      mainG.append("rect")
        .attr("x",0).attr("y",y)
        .attr("width",xScale(d.val)).attr("height",bw)
        .attr("fill", BAR_COLOR);

      mainG.append("text").attr("x",-8).attr("y",cy).attr("dy","0.35em")
        .style("text-anchor","end").style("font-size","13px").style("font-weight","bold").style("fill","#222")
        .text(d.entity);

      mainG.append("text")
        .attr("x",xScale(d.val)+8).attr("y",cy).attr("dy","0.35em")
        .style("font-size","13px").style("fill","#444")
        .text(d3.format(",.0f")(d.val) + " μg/m³");
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
      },150);
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
    .text("Fouquet (2011) and Government of India (2012-13) – processed by Our World in Data");
  svg.append("text").attr("x",W-10).attr("y",H-16)
    .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
    .text("OurWorldInData.org/air-pollution | CC BY");

  setMode("line");
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("air-pollution-london-vs-delhi.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["air-pollution-london-vs-delhi.csv", {url: new URL("./files/6aa33353c180052409097534428175a4031558889e41fff31faa7ef9cdeeb3f8a1173e3c5947548a9c4cfd516cd461a2b58fcdfbf8091ca3f9e0190ef7fe6427.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
