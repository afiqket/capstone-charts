function _1(md){return(
md`# Weekly working hours`
)}

function _2(rawData,d3)
{
  const W = 900, H = 490;
  const margin = { top: 75, right: 120, bottom: 70, left: 55 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const col = "Working hours per week";

  const countries = ["Italy", "Switzerland", "Belgium", "France", "Australia"];

  const colorMap = {
    "Switzerland": "#9b59b6",
    "Australia":   "#2980b9",
    "Italy":       "#2e8b6e",
    "Belgium":     "#c0392b",
    "France":      "#8c6d2f"
  };

  const nested = countries.map(country => ({
    country,
    values: rawData
      .filter(d => d.Entity === country && d[col] != null && d[col] !== "")
      .map(d => ({ year: +d.Year, value: +d[col] }))
      .sort((a, b) => a.year - b.year)
  })).filter(d => d.values.length > 0);

  const allYears = [...new Set(
    rawData.filter(d => countries.includes(d.Entity)).map(d => +d.Year)
  )].sort((a, b) => a - b);

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
    .style("font-size","16px").style("font-weight","bold").style("fill","#111");

  svg.append("text").attr("x",margin.left).attr("y",40)
    .style("font-size","10.5px").style("fill","#555")
    .text("Work hours of full-time production workers (male and female) in non-agricultural activities");

  const mainG = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none").style("pointer-events","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 6px rgba(0,0,0,0.13))");
  const ttTitle = ttG.append("text").attr("x",12).attr("y",22)
    .style("font-size","14px").style("font-weight","bold").style("fill","#111");

  function showTooltip(year, dataAtYear, mx, my) {
    ttTitle.text(year);
    ttG.selectAll(".ttrow").remove();
    const sorted = dataAtYear.filter(d => d.value != null).sort((a,b) => b.value - a.value);
    sorted.forEach((d, i) => {
      const g = ttG.append("g").attr("class","ttrow");
      g.append("rect").attr("x",12).attr("y",30+i*20).attr("width",12).attr("height",12)
        .attr("fill",colorMap[d.country]).attr("rx",2);
      g.append("text").attr("x",30).attr("y",41+i*20)
        .style("font-size","11px").style("fill","#333").text(d.country);
      g.append("text").attr("x",185).attr("y",41+i*20)
        .style("font-size","11px").style("font-weight","bold").style("fill","#111").style("text-anchor","end")
        .text(`${d3.format(".1f")(d.value)} h`);
    });
    const ttH = 28 + sorted.length * 20 + 6;
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
    titleEl.text(`Weekly working hours, ${allYears[0]} to ${allYears[allYears.length-1]}`);

    const allVals = nested.flatMap(d => d.values.map(v => v.value));
    const yMax = Math.ceil(d3.max(allVals) / 10) * 10;
    const xScale = d3.scaleLinear().domain(d3.extent(allYears)).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);

    // Gridlines Y
    yScale.ticks(8).forEach(v => {
      mainG.append("line")
        .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
        .attr("stroke", v===0?"#bbb":"#e0e0e0")
        .attr("stroke-dasharray", v===0?"0":"4,3").attr("stroke-width",1);
      mainG.append("text").attr("x",-6).attr("y",yScale(v)).attr("dy","0.35em")
        .style("font-size","10px").style("fill","#888").style("text-anchor","end")
        .text(`${v} h`);
    });

    // X axis
    [1870,1900,1920,1940,1960,1980,2000].forEach(y => {
      mainG.append("text").attr("x",xScale(y)).attr("y",innerH+16)
        .style("font-size","10px").style("fill","#888").style("text-anchor","middle").text(y);
    });
    mainG.append("line").attr("x1",0).attr("x2",innerW)
      .attr("y1",innerH).attr("y2",innerH).attr("stroke","#bbb").attr("stroke-width",1);

    const lineGen = d3.line().defined(d => d.value != null)
      .x(d => xScale(d.year)).y(d => yScale(d.value));

    nested.forEach(({ country, values }) => {
      mainG.append("path").datum(values)
        .attr("fill","none").attr("stroke",colorMap[country]).attr("stroke-width",2.2)
        .attr("d", lineGen);
      values.forEach(r => {
        mainG.append("circle")
          .attr("cx",xScale(r.year)).attr("cy",yScale(r.value))
          .attr("r",3).attr("fill",colorMap[country]);
      });
      const last = values[values.length - 1];
      mainG.append("text")
        .attr("x", innerW + 5).attr("y", yScale(last.value)).attr("dy","0.35em")
        .style("font-size","10px").style("font-weight","bold").style("fill",colorMap[country])
        .text(country);
    });

    // Hover
    const hoverLine = mainG.append("line").attr("y1",0).attr("y2",innerH)
      .attr("stroke","#aaa").attr("stroke-width",1).style("display","none");

    mainG.append("rect").attr("width",innerW).attr("height",innerH).attr("fill","transparent")
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event);
        const yr = xScale.invert(mx);
        const snapYr = allYears.reduce((a,b) => Math.abs(a-yr)<Math.abs(b-yr)?a:b);
        hoverLine.attr("x1",xScale(snapYr)).attr("x2",xScale(snapYr)).style("display",null);
        const dataAtYear = nested.map(({ country, values }) => ({
          country, value: values.find(v => v.year === snapYr)?.value
        }));
        const [sx,sy] = d3.pointer(event, svg.node());
        showTooltip(snapYr, dataAtYear, sx, sy);
      })
      .on("mouseleave", () => { hoverLine.style("display","none"); hideTooltip(); });
  }

  // ── RENDER BAR ────────────────────────────────────────────────────────────
  function renderBar() {
    mainG.selectAll("*").remove();
    titleEl.text(`Weekly working hours, ${currentYear}`);

    const barData = nested.map(({ country, values }) => ({
      country,
      val: values.find(v => v.year === currentYear)?.value ?? null
    }))
    .filter(d => d.val != null)
    .sort((a,b) => b.val - a.val);

    if (barData.length === 0) {
      mainG.append("text").attr("x",innerW/2).attr("y",innerH/2)
        .style("text-anchor","middle").style("fill","#aaa").style("font-size","13px")
        .text(`No data for ${currentYear}`);
      return;
    }

    const BAR_COLOR = "#6b7fad";
    const xScale = d3.scaleLinear().domain([0, d3.max(barData, d => d.val) * 1.08]).range([0, innerW]);
    const yScale = d3.scaleBand().domain(barData.map(d => d.country)).range([0, innerH]).padding(0.3);

    barData.forEach(d => {
      const y  = yScale(d.country);
      const bw = yScale.bandwidth();
      const cy = y + bw/2;

      mainG.append("rect")
        .attr("x",0).attr("y",y)
        .attr("width",xScale(d.val)).attr("height",bw)
        .attr("fill",BAR_COLOR);

      mainG.append("text").attr("x",-8).attr("y",cy).attr("dy","0.35em")
        .style("text-anchor","end").style("font-size","13px").style("font-weight","bold").style("fill","#222")
        .text(d.country);

      mainG.append("text")
        .attr("x",xScale(d.val)+8).attr("y",cy).attr("dy","0.35em")
        .style("font-size","13px").style("fill","#444")
        .text(`${d3.format(".1f")(d.val)} h`);
    });

    mainG.append("line").attr("x1",0).attr("x2",0).attr("y1",0).attr("y2",innerH)
      .attr("stroke","#bbb").attr("stroke-width",1);
  }

  // ── Slider ────────────────────────────────────────────────────────────────
  const sliderY  = H - 45;
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
      }, 400);
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
  svg.append("text").attr("x",margin.left).attr("y",H-14)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",margin.left+80).attr("y",H-14)
    .style("font-size","10.5px").style("fill","#333")
    .text("Huberman and Minns (2005) – with major processing by Our World in Data");
  svg.append("text").attr("x",W-10).attr("y",H-14)
    .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
    .text("OurWorldInData.org/working-hours | CC BY");

  setMode("line");
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("work-hours-per-week.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["work-hours-per-week.csv", {url: new URL("./files/cb595e218da4406db0c74f4e261f3af26d82c3e8322784ed9bfdb8dcdde5bb4aa0149cc722b3bffb455a3d62ae891bacbfef1f2a2f2994934f82240857869998.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
