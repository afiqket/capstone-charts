function _1(md){return(
md`# Peak birth month each year and the daily birth rate that month`
)}

function _2(rawData,d3)
{
  const W = 900, H = 560;
  const margin = { top: 105, right: 130, bottom: 80, left: 55 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const MONTH_COLORS = {
    1:  "#7B3F00", 2:  "#A0522D", 3:  "#C47A2B", 4:  "#D4A843",
    5:  "#E8D5A3", 6:  "#B8D9C8", 7:  "#7EC8C8", 8:  "#5BA8A0",
    9:  "#3D8B8B", 10: "#2E6B6B", 11: "#1F4F4F", 12: "#0D3333",
    null: "#cccccc"
  };
  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const COUNTRIES = ["France", "Spain"];

  const parseData = (country) =>
    rawData
      .filter(d => d.Entity === country)
      .map(d => ({
        year:  +d.Year,
        rate:  +d["Daily birth rate in the peak month"],
        month: d["Month with peak value"] ? +d["Month with peak value"] : null
      }))
      .sort((a, b) => a.year - b.year);

  const seriesData = { France: parseData("France"), Spain: parseData("Spain") };

  const allYears = [...new Set(rawData.map(d => +d.Year))].sort((a,b) => a-b);
  let currentYear = allYears[allYears.length - 1];
  let mode = "line";
  let playing = false, timer = null;

  const container = d3.create("div").style("font-family","sans-serif").style("user-select","none");

  // ── Botones Line / Bar ────────────────────────────────────────────────────
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

  // ── Título ────────────────────────────────────────────────────────────────
  const titleEl = svg.append("text").attr("x", margin.left).attr("y", 20)
    .style("font-size","15px").style("font-weight","bold").style("fill","#111");

  const subtitleLines = [
    "For each year, the peak birth month (month with the highest average number of births per day) is colored.",
    "The y-axis shows the number of births per day in that peak month."
  ];
  subtitleLines.forEach((line, i) => {
    svg.append("text").attr("x", margin.left).attr("y", 36 + i * 13)
      .style("font-size","10.5px").style("fill","#555").text(line);
  });

  // ── Leyenda de meses ──────────────────────────────────────────────────────
  const legendY = 70;
  const legendCellW = 58, legendCellH = 12;
  MONTH_NAMES.forEach((name, i) => {
    const lx = margin.left + i * legendCellW;
    svg.append("rect").attr("x", lx).attr("y", legendY)
      .attr("width", legendCellW - 2).attr("height", legendCellH)
      .attr("fill", MONTH_COLORS[i + 1]);
    svg.append("text").attr("x", lx + (legendCellW - 2) / 2).attr("y", legendY - 3)
      .style("font-size","9.5px").style("fill","#444").style("text-anchor","middle").text(name);
  });

  const mainG = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 6px rgba(0,0,0,0.13))");
  const ttTitle = ttG.append("text").attr("x",12).attr("y",20)
    .style("font-size","12px").style("font-weight","bold").style("fill","#111");

  function showTooltip(year, items, mx, my) {
    ttTitle.text(`${year}`);
    ttG.selectAll(".ttrow").remove();
    items.forEach((item, i) => {
      const g = ttG.append("g").attr("class","ttrow");
      g.append("rect").attr("x",12).attr("y",28+i*18).attr("width",10).attr("height",10)
        .attr("fill", item.color).attr("rx",2);
      g.append("text").attr("x",28).attr("y",37+i*18)
        .style("font-size","11px").style("fill","#333")
        .text(`${item.country}: ${d3.format(".2f")(item.rate)} — Peak: ${item.month ? MONTH_NAMES[item.month-1] : "n/a"}`);
    });
    const ttH = 24 + items.length * 18 + 8;
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
    titleEl.text("Peak birth month each year and the daily birth rate that month");

    const allRates = Object.values(seriesData).flatMap(s => s.map(d => d.rate));
    const yMax = Math.ceil(d3.max(allRates) / 20) * 20;
    const xExtent = d3.extent(Object.values(seriesData).flatMap(s => s.map(d => d.year)));

    const xScale = d3.scaleLinear().domain(xExtent).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);

    // Gridlines y etiquetas Y
    d3.range(0, yMax + 1, 20).forEach(v => {
      mainG.append("line")
        .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
        .attr("stroke", v===0 ? "#aaa" : "#e0e0e0")
        .attr("stroke-dasharray", v===0 ? "0" : "4,3").attr("stroke-width",1);
      mainG.append("text").attr("x",-6).attr("y",yScale(v)).attr("dy","0.35em")
        .style("font-size","11px").style("fill","#888").style("text-anchor","end").text(v);
    });

    // Eje X
    const xTicks = d3.range(xExtent[0], xExtent[1]+1, 20);
    [...new Set([xExtent[0], ...xTicks, xExtent[1]])].forEach(y => {
      mainG.append("text").attr("x",xScale(y)).attr("y",innerH+18)
        .style("font-size","11px").style("fill","#888").style("text-anchor","middle").text(y);
    });
    mainG.append("line").attr("x1",0).attr("x2",innerW)
      .attr("y1",innerH).attr("y2",innerH).attr("stroke","#bbb").attr("stroke-width",1);

    // Líneas y puntos por país
    COUNTRIES.forEach(country => {
      const pts = seriesData[country];
      if (!pts.length) return;

      // Línea base gris
      const lineGen = d3.line().x(d => xScale(d.year)).y(d => yScale(d.rate)).curve(d3.curveMonotoneX);
      mainG.append("path").datum(pts)
        .attr("fill","none").attr("stroke","#ddd").attr("stroke-width",1.5).attr("d", lineGen);

      // Segmentos coloreados
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i], p1 = pts[i+1];
        mainG.append("line")
          .attr("x1",xScale(p0.year)).attr("y1",yScale(p0.rate))
          .attr("x2",xScale(p1.year)).attr("y2",yScale(p1.rate))
          .attr("stroke", MONTH_COLORS[p0.month] || MONTH_COLORS[null])
          .attr("stroke-width",2);
      }

      // Puntos
      pts.forEach(p => {
        mainG.append("circle")
          .attr("cx",xScale(p.year)).attr("cy",yScale(p.rate))
          .attr("r",2.2).attr("fill", MONTH_COLORS[p.month] || MONTH_COLORS[null]);
      });

      // Etiqueta final
      const last = pts[pts.length - 1];
      mainG.append("text")
        .attr("x",xScale(last.year)+8).attr("y",yScale(last.rate)).attr("dy","0.35em")
        .style("font-size","11px").style("font-weight","bold")
        .style("fill", MONTH_COLORS[last.month] || MONTH_COLORS[null])
        .text(country);
    });

    // Hover overlay
    const hoverLine = mainG.append("line").attr("y1",0).attr("y2",innerH)
      .attr("stroke","#999").attr("stroke-width",1).style("display","none");

    mainG.append("rect").attr("width",innerW).attr("height",innerH).attr("fill","transparent")
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event);
        const yr = Math.round(xScale.invert(mx));
        hoverLine.attr("x1",xScale(yr)).attr("x2",xScale(yr)).style("display",null);
        const items = COUNTRIES.map(country => {
          const pt = seriesData[country].find(d => d.year === yr);
          if (!pt) return null;
          return { country, rate: pt.rate, month: pt.month, color: MONTH_COLORS[pt.month] || MONTH_COLORS[null] };
        }).filter(Boolean);
        const [sx, sy] = d3.pointer(event, svg.node());
        if (items.length) showTooltip(yr, items, sx, sy);
        else hideTooltip();
      })
      .on("mouseleave", () => { hoverLine.style("display","none"); hideTooltip(); });
  }

  // ── RENDER BAR ────────────────────────────────────────────────────────────
  function renderBar() {
    mainG.selectAll("*").remove();
    titleEl.text(`Peak birth month each year and the daily birth rate that month, ${currentYear}`);

    const byYear = new Map(Object.entries(seriesData).flatMap(([c, rows]) => rows.map(r => [`${c}-${r.year}`, r])));
    const barData = COUNTRIES.map(country => {
      const pt = seriesData[country].find(d => d.year === currentYear);
      return pt ? { country, rate: pt.rate, month: pt.month, color: MONTH_COLORS[pt.month] || MONTH_COLORS[null] } : null;
    }).filter(Boolean);

    if (!barData.length) {
      mainG.append("text").attr("x",innerW/2).attr("y",innerH/2)
        .style("text-anchor","middle").style("fill","#888").style("font-size","14px")
        .text("No data for this year");
      return;
    }

    const maxVal = d3.max(barData, d => d.rate) * 1.1;
    const xScale = d3.scaleLinear().domain([0, maxVal]).range([0, innerW]);
    const yScale = d3.scaleBand().domain(barData.map(d => d.country)).range([0, innerH]).padding(0.35);

    barData.forEach(d => {
      mainG.append("rect")
        .attr("x",0).attr("y",yScale(d.country))
        .attr("width",xScale(d.rate)).attr("height",yScale.bandwidth())
        .attr("fill",d.color);
      mainG.append("text").attr("x",-10).attr("y",yScale(d.country)+yScale.bandwidth()/2).attr("dy","0.35em")
        .style("text-anchor","end").style("font-size","12px").style("font-weight","bold").style("fill","#333")
        .text(d.country);
      mainG.append("text")
        .attr("x",xScale(d.rate)+8).attr("y",yScale(d.country)+yScale.bandwidth()/2).attr("dy","0.35em")
        .style("font-size","13px").style("fill","#444")
        .text(d3.format(".2f")(d.rate));
    });

    mainG.append("line").attr("x1",0).attr("x2",0).attr("y1",0).attr("y2",innerH)
      .attr("stroke","#bbb").attr("stroke-width",1);
  }

  // ── Slider ────────────────────────────────────────────────────────────────
  const sliderY = H - 38;
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
      updateYear(allYears.reduce((a,b) => Math.abs(xSlider(a)-mx) < Math.abs(xSlider(b)-mx) ? a : b));
    });

  handle.call(d3.drag().on("drag", function(event) {
    const mx = Math.max(sliderX0, Math.min(sliderX1, event.x));
    updateYear(allYears.reduce((a,b) => Math.abs(xSlider(a)-mx) < Math.abs(xSlider(b)-mx) ? a : b));
  }));

  playBtn.on("click", () => {
    if (playing) { clearInterval(timer); playing = false; playBtn.text("▶"); }
    else {
      if (currentYear === allYears[allYears.length-1]) updateYear(allYears[0]);
      playing = true; playBtn.text("⏸");
      timer = setInterval(() => {
        const idx = allYears.indexOf(currentYear);
        if (idx < allYears.length-1) updateYear(allYears[idx+1]);
        else { clearInterval(timer); playing = false; playBtn.text("▶"); }
      }, 200);
    }
  });

  // ── Mode switching ────────────────────────────────────────────────────────
  function setMode(m) {
    mode = m;
    btnLine.style("background", m==="line" ? "#3a6fc4" : "#fff").style("color", m==="line" ? "#fff" : "#333");
    btnBar .style("background", m==="bar"  ? "#3a6fc4" : "#fff").style("color", m==="bar"  ? "#fff" : "#333");
    sliderG.style("display", m==="line" ? "none" : null);
    hideTooltip();
    if (m==="line") renderLine();
    if (m==="bar")  renderBar();
  }
  btnLine.on("click", () => setMode("line"));
  btnBar .on("click", () => setMode("bar"));

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",margin.left).attr("y",H-16)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",margin.left+80).attr("y",H-16)
    .style("font-size","10.5px").style("fill","#333")
    .text("Human Mortality Database (2025) – processed by Our World in Data");
  svg.append("text").attr("x",W-20).attr("y",H-16)
    .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
    .text("OurWorldInData.org/fertility-rate | CC BY");

  setMode("line");
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("birth-rate-total.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["birth-rate-total.csv", {url: new URL("./files/bbea95cbdd37e3079ffb3b0062c467e27bbd6b0300ca1d7f1dc158bcdef7c103ce3781b9d42dd9bc7fc1650b7071ac01bfe06a6383895c4df0b4b899e9845968.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
