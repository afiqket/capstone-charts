function _1(md){return(
md`# Total fertility rate vs cohort fertility rate vs tempo-adjusted total fertility rate`
)}

function _2(rawData,d3)
{
  const W = 900, H = 560;
  const margin = { top: 105, right: 130, bottom: 100, left: 170 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const SERIES = [
    { col: "Completed cohort fertility rate shifted +30 years", label: "Completed cohort fertility rate shifted +30 years", color: "#B04B2D", shortLabel: "Completed cohort fertility rate\nshifted +30 years" },
    { col: "Tempo-adjusted total fertility rate",               label: "Tempo-adjusted total fertility rate",               color: "#8B3A8B" },
    { col: "Total fertility rate",                              label: "Total fertility rate",                              color: "#4C6FAD" },
  ];
  const BAR_COLOR = "#6b7fad";
  const country = "Sweden";

  const rows = rawData.filter(d => d.Entity === country)
    .map(d => {
      const r = { year: +d.Year };
      SERIES.forEach(s => { r[s.col] = d[s.col] != null && d[s.col] !== "" ? +d[s.col] : null; });
      return r;
    })
    .sort((a,b) => a.year - b.year);

  const years = rows.map(r => r.year);
  let currentYear = years[years.length - 1];
  const byYear = new Map(rows.map(r => [r.year, r]));

  const seriesData = SERIES.map(s => ({
    ...s,
    points: rows.map(r => ({ year: r.year, value: r[s.col] })).filter(p => p.value != null)
  }));

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
    .attr("viewBox",`0 0 ${W} ${H}`)
    .attr("width",W).attr("height",H)
    .style("background","#fff");

  const titleEl = svg.append("text").attr("x", margin.left).attr("y", 20)
    .style("font-size","15px").style("font-weight","bold").style("fill","#111");

  // Subtítulo multilínea
  const subtitleLines = [
    "Three measures of fertility rate are compared: the total fertility rate (a summary metric based on birth rates across",
    "different age groups of women in one particular year); the completed cohort fertility rate (the average number of children",
    "born to a woman by the end of her childbearing years); and the tempo-adjusted total fertility rate (which aims to adjust",
    "for changes in the timing of childbearing)."
  ];
  subtitleLines.forEach((line, i) => {
    svg.append("text").attr("x", margin.left).attr("y", 34 + i * 13)
      .style("font-size","10.5px").style("fill","#555").text(line);
  });

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
        .attr("x",12).attr("y", 36+i*16)
        .style("font-size","11px").style("fill",item.color)
        .text(`${item.label}: ${d3.format(".2f")(item.value)}`);
    });
    const ttH = 28 + items.length*16 + 4;
    const ttW = 310;
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
    titleEl.text(`Total fertility rate vs cohort fertility rate vs tempo-adjusted total fertility rate, ${country}`);

    const allVals = seriesData.flatMap(s => s.points.map(p => p.value));
    const yMax = Math.ceil((d3.max(allVals)||5) / 0.5) * 0.5;

    const xScale = d3.scaleLinear().domain(d3.extent(years)).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);

    // Gridlines
    d3.range(0, yMax+0.01, 0.5).forEach(v => {
      mainG.append("line")
        .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
        .attr("stroke",v===0?"#aaa":"#e0e0e0")
        .attr("stroke-dasharray",v===0?"0":"4,3").attr("stroke-width",1);
      mainG.append("text")
        .attr("x",-8).attr("y",yScale(v)).attr("dy","0.35em")
        .style("font-size","11px").style("fill","#888").style("text-anchor","end").text(v);
    });

    // Eje X
    const xTicks = years.filter(y => y%20===0);
    [...new Set([years[0], ...xTicks, years[years.length-1]])].forEach(y => {
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
      mainG.append("path").datum(s.points)
        .attr("fill","none").attr("stroke",s.color).attr("stroke-width",1.8)
        .attr("d", lineGen);
      s.points.filter(p => p.year % 5 === 0).forEach(p => {
        mainG.append("circle")
          .attr("cx",xScale(p.year)).attr("cy",yScale(p.value))
          .attr("r",2.5).attr("fill",s.color);
      });
    });

    // Etiquetas al final — con separación anti-solapamiento
    const endLabels = seriesData.map(s => {
      const last = s.points[s.points.length-1];
      return last ? { ...s, lastYear: last.year, lastVal: last.value } : null;
    }).filter(Boolean).sort((a,b) => b.lastVal - a.lastVal);

    let lastLY = -Infinity;
    endLabels.forEach(d => {
      let ly = yScale(d.lastVal);
      if (ly - lastLY < 13) ly = lastLY + 13;
      lastLY = ly;

      // Líneas de etiqueta multilínea
      const words = d.label.split(" ");
      // Dividir en max 2 líneas de ~25 chars
      let line1 = "", line2 = "";
      let cur = "";
      words.forEach(w => {
        if ((cur + " " + w).trim().length <= 28) { cur = (cur + " " + w).trim(); }
        else if (!line1) { line1 = cur; cur = w; }
        else { cur += " " + w; }
      });
      if (!line1) { line1 = cur; } else { line2 = cur; }

      mainG.append("line")
        .attr("x1",xScale(d.lastYear)+3).attr("x2",xScale(d.lastYear)+10)
        .attr("y1",yScale(d.lastVal)).attr("y2",ly)
        .attr("stroke",d.color).attr("stroke-width",0.8);
      mainG.append("text")
        .attr("x",xScale(d.lastYear)+14).attr("y",ly - (line2?6:0)).attr("dy","0.35em")
        .style("font-size","10.5px").style("font-weight","bold").style("fill",d.color)
        .text(line1);
      if (line2) {
        mainG.append("text")
          .attr("x",xScale(d.lastYear)+14).attr("y",ly+8).attr("dy","0.35em")
          .style("font-size","10.5px").style("font-weight","bold").style("fill",d.color)
          .text(line2);
      }
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
        const items = SERIES.map(s=>({
          label: s.label, color: s.color,
          value: row[s.col] != null ? row[s.col] : null
        })).filter(d=>d.value!=null);
        const [sx,sy] = d3.pointer(event, svg.node());
        showTooltip(closest, items, sx, sy);
      })
      .on("mouseleave", ()=>{ hoverLine.style("display","none"); hideTooltip(); });
  }

  // ── RENDER BAR ────────────────────────────────────────────────────────────
  function renderBar() {
    mainG.selectAll("*").remove();
    titleEl.text(`Total fertility rate vs cohort fertility rate vs tempo-adjusted TFR, ${country}, ${currentYear}`);

    const row = byYear.get(currentYear);
    const barData = SERIES.map(s=>({
      label: s.label, color: s.color,
      value: row && row[s.col] != null ? row[s.col] : null
    })).filter(d=>d.value!=null).sort((a,b)=>b.value-a.value);

    if (!barData.length) {
      mainG.append("text").attr("x",innerW/2).attr("y",innerH/2)
        .style("text-anchor","middle").style("fill","#888").style("font-size","14px")
        .text("No data for this year");
      return;
    }

    const maxVal = d3.max(barData,d=>d.value)*1.08;
    const xScale = d3.scaleLinear().domain([0,maxVal]).range([0,innerW]);
    const yScale = d3.scaleBand().domain(barData.map(d=>d.label))
      .range([0,innerH]).padding(0.35);

    barData.forEach(d => {
      mainG.append("rect")
        .attr("x",0).attr("y",yScale(d.label))
        .attr("width",xScale(d.value)).attr("height",yScale.bandwidth())
        .attr("fill",d.color);

      // Label izquierdo con wrap para labels largos
      const words = d.label.split(" ");
      const mid = Math.ceil(words.length/2);
      const cy = yScale(d.label)+yScale.bandwidth()/2;
      const line1 = words.slice(0,mid).join(" ");
      const line2 = words.slice(mid).join(" ");
      mainG.append("text").attr("x",-10).attr("y",line2?cy-7:cy).attr("dy","0.35em")
        .style("text-anchor","end").style("font-size","11px").style("font-weight","bold").style("fill","#333")
        .text(line1);
      if (line2) {
        mainG.append("text").attr("x",-10).attr("y",cy+7).attr("dy","0.35em")
          .style("text-anchor","end").style("font-size","11px").style("font-weight","bold").style("fill","#333")
          .text(line2);
      }

      mainG.append("text")
        .attr("x",xScale(d.value)+8).attr("y",cy).attr("dy","0.35em")
        .style("font-size","13px").style("fill","#444")
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
    if (mode==="bar") renderBar();
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

  playBtn.on("click", ()=>{
    if (playing){clearInterval(timer);playing=false;playBtn.text("▶");}
    else {
      if (currentYear===years[years.length-1]) updateYear(years[0]);
      playing=true; playBtn.text("⏸");
      timer=setInterval(()=>{
        const idx=years.indexOf(currentYear);
        if(idx<years.length-1) updateYear(years[idx+1]);
        else{clearInterval(timer);playing=false;playBtn.text("▶");}
      },200);
    }
  });

  // ── Mode switching ────────────────────────────────────────────────────────
  function setMode(m) {
    mode=m;
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
  svg.append("text").attr("x",margin.left).attr("y",H-22)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",margin.left+80).attr("y",H-22)
    .style("font-size","10.5px").style("fill","#333")
    .text("Human Fertility Database (2025) – processed by Our World in Data");
  svg.append("text").attr("x",margin.left).attr("y",H-9)
    .style("font-size","10px").style("fill","#777")
    .text("Note: The completed cohort fertility rate has been shifted +30 years to compare with period measures at roughly the average age of mothers at childbirth.");
  svg.append("text").attr("x",W-20).attr("y",H-9)
    .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
    .text("OurWorldInData.org/fertility-rate | CC BY");

  setMode("line");
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("total-fertility-rate-vs-cohort-fertility-rate-vs-tempo-adjusted-tfr.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["total-fertility-rate-vs-cohort-fertility-rate-vs-tempo-adjusted-tfr.csv", {url: new URL("./files/9560569cc2675a1168475b3e4108f61e28437460b2e9f4eeee0a7c2a3063be0d233a9d09b230ba1ba8ef8ba8769f6a058817f8582efb594214777034ef135a8c.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
