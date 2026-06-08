function _1(md){return(
md`# Number of people living in the world's largest cities`
)}

function _2(rawData,d3)
{
  const W = 900, H = 600;
  const margin = { top: 100, right: 160, bottom: 80, left: 70 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const CITIES = ["Dhaka","Jakarta","Karachi","Cairo","New Delhi","Lahore","Shanghai","Tokyo","New York City"];
  const COL_EST  = "Population of the top 100 most populous cities";
  const COL_PROJ = "Population of the top 100 most populous cities (projected) (Projected)";
  const COL_ANN  = "Population of the top 100 most populous cities (Annotations)";

  // Colores distintos por ciudad
  const CITY_COLORS = {
    "Jakarta":      "#8B6914",
    "Tokyo":        "#5C3D1E",
    "Dhaka":        "#B22222",
    "New Delhi":    "#C0392B",
    "Shanghai":     "#9B59B6",
    "Cairo":        "#2980B9",
    "Karachi":      "#27AE60",
    "New York City":"#2C3E50",
    "Lahore":       "#7D3C98"
  };

  // Parse data per city: combina estimates + projections
  const parseCity = (city) => {
    const rows = rawData.filter(d => d.Entity === city);
    const country = rows[0] ? (rows[0][COL_ANN] || "") : "";
    const est  = rows.filter(d => d[COL_EST]  != null && d[COL_EST]  !== "").map(d => ({ year: +d.Year, pop: +d[COL_EST],  proj: false }));
    const proj = rows.filter(d => d[COL_PROJ] != null && d[COL_PROJ] !== "" && +d.Year > 2020).map(d => ({ year: +d.Year, pop: +d[COL_PROJ], proj: true  }));
    return { city, country, pts: [...est, ...proj].sort((a,b) => a.year - b.year) };
  };

  const seriesData = CITIES.map(parseCity).filter(s => s.pts.length > 0);

  const allYears = [...new Set(rawData.map(d => +d.Year))].sort((a,b) => a-b);
  const estYears  = allYears.filter(y => y <= 2020);
  const projYears = allYears.filter(y => y >= 2020);
  let currentYear = 2020;
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
    "The number of people living in cities ranked among the top 100 most populous in 2020.",
    "Cities are identified using satellite imagery and population data, applying the same definitions across countries."
  ];
  subtitleLines.forEach((line, i) => {
    svg.append("text").attr("x", margin.left).attr("y", 38 + i * 13)
      .style("font-size","10.5px").style("fill","#555").text(line);
  });

  const mainG = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const fmtPop = v => v >= 1e6 ? d3.format(".1f")(v/1e6) + " million" : d3.format(",.0f")(v);

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
        .text(`${item.city}: ${fmtPop(item.pop)}${item.proj ? " (proj.)" : ""}`);
    });
    const ttH = 24 + items.length * 18 + 8;
    const ttW = 230;
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
    titleEl.text("Number of people living in the world's largest cities");

    const allPop = seriesData.flatMap(s => s.pts.map(d => d.pop));
    const yMax = Math.ceil(d3.max(allPop) / 5e6) * 5e6;
    const allYearsAll = seriesData.flatMap(s => s.pts.map(d => d.year));
    const xExtent = d3.extent(allYearsAll);

    const xScale = d3.scaleLinear().domain(xExtent).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);

    // Gridlines Y
    d3.range(0, yMax + 1, 5e6).forEach(v => {
      mainG.append("line")
        .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
        .attr("stroke", v===0 ? "#bbb" : "#e0e0e0")
        .attr("stroke-dasharray", v===0 ? "0" : "4,3").attr("stroke-width",1);
      mainG.append("text").attr("x",-6).attr("y",yScale(v)).attr("dy","0.35em")
        .style("font-size","10px").style("fill","#888").style("text-anchor","end")
        .text(v === 0 ? "0" : d3.format(".0f")(v/1e6) + " million");
    });

    // Eje X
    d3.range(1950, xExtent[1]+1, 10).forEach(y => {
      mainG.append("text").attr("x",xScale(y)).attr("y",innerH+18)
        .style("font-size","10px").style("fill","#888").style("text-anchor","middle").text(y);
    });
    mainG.append("line").attr("x1",0).attr("x2",innerW)
      .attr("y1",innerH).attr("y2",innerH).attr("stroke","#bbb").attr("stroke-width",1);

    // Línea vertical 2020 (separación estimates/projections)
    mainG.append("line")
      .attr("x1",xScale(2020)).attr("x2",xScale(2020))
      .attr("y1",0).attr("y2",innerH)
      .attr("stroke","#ccc").attr("stroke-width",1).attr("stroke-dasharray","4,3");

    const lineGen = d3.line().x(d => xScale(d.year)).y(d => yScale(d.pop)).curve(d3.curveMonotoneX).defined(d => d.pop != null);

    seriesData.forEach(s => {
      const color = CITY_COLORS[s.city] || "#888";
      const estPts  = s.pts.filter(d => !d.proj);
      const projPts = s.pts.filter(d => d.proj || d.year === 2020);

      // Línea estimates (sólida)
      if (estPts.length > 1) {
        mainG.append("path").datum(estPts)
          .attr("fill","none").attr("stroke",color).attr("stroke-width",1.8).attr("d",lineGen);
      }
      // Línea proyección (discontinua)
      if (projPts.length > 1) {
        mainG.append("path").datum(projPts)
          .attr("fill","none").attr("stroke",color).attr("stroke-width",1.8)
          .attr("stroke-dasharray","5,3").attr("d",lineGen);
      }

      // Puntos cada 5 años
      s.pts.filter(p => p.year % 5 === 0).forEach(p => {
        mainG.append("circle")
          .attr("cx",xScale(p.year)).attr("cy",yScale(p.pop))
          .attr("r",2.2).attr("fill",color);
      });

      // Etiqueta final (ordenadas para evitar solapamiento)
      // Etiqueta final al extremo derecho del gráfico
      const lastAll = s.pts[s.pts.length - 1];
      if (lastAll) {
        mainG.append("text")
          .attr("x", innerW + 8).attr("y", yScale(lastAll.pop)).attr("dy","0.35em")
          .style("font-size","10px").style("font-weight","bold").style("fill",color)
          .text(s.city);
        mainG.append("text")
          .attr("x", innerW + 8).attr("y", yScale(lastAll.pop) + 11).attr("dy","0.35em")
          .style("font-size","9px").style("fill","#888")
          .text(s.country);
      }
    });

    // Hover
    const hoverLine = mainG.append("line").attr("y1",0).attr("y2",innerH)
      .attr("stroke","#999").attr("stroke-width",1).style("display","none");

    mainG.append("rect").attr("width",innerW).attr("height",innerH).attr("fill","transparent")
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event);
        const yr = Math.round(xScale.invert(mx) / 5) * 5;
        hoverLine.attr("x1",xScale(yr)).attr("x2",xScale(yr)).style("display",null);
        const items = seriesData.map(s => {
          const pt = s.pts.find(d => d.year === yr);
          if (!pt) return null;
          return { city: s.city, pop: pt.pop, proj: pt.proj, color: CITY_COLORS[s.city] || "#888" };
        }).filter(Boolean).sort((a,b) => b.pop - a.pop);
        const [sx,sy] = d3.pointer(event, svg.node());
        if (items.length) showTooltip(yr, items, sx, sy);
        else hideTooltip();
      })
      .on("mouseleave", () => { hoverLine.style("display","none"); hideTooltip(); });
  }

  // ── RENDER BAR ────────────────────────────────────────────────────────────
  function renderBar() {
    mainG.selectAll("*").remove();
    titleEl.text(`Number of people living in the world's largest cities, ${currentYear}`);

    const barData = seriesData.map(s => {
      const pt = s.pts.find(d => d.year === currentYear);
      return pt ? { city: s.city, country: s.country, pop: pt.pop, proj: pt.proj, color: CITY_COLORS[s.city] || "#888" } : null;
    }).filter(Boolean).sort((a,b) => b.pop - a.pop);

    if (!barData.length) {
      mainG.append("text").attr("x",innerW/2).attr("y",innerH/2)
        .style("text-anchor","middle").style("fill","#888").style("font-size","14px")
        .text("No data for this year");
      return;
    }

    const BAR_COLOR = "#6b7fad";
    const maxVal = d3.max(barData, d => d.pop) * 1.08;
    const xScale = d3.scaleLinear().domain([0, maxVal]).range([0, innerW]);
    const yScale = d3.scaleBand().domain(barData.map(d => d.city)).range([0, innerH]).padding(0.25);

    barData.forEach(d => {
      const y  = yScale(d.city);
      const bw = yScale.bandwidth();
      const cy = y + bw / 2;

      mainG.append("rect")
        .attr("x",0).attr("y",y)
        .attr("width",xScale(d.pop)).attr("height",bw)
        .attr("fill", BAR_COLOR);

      // Ciudad (bold) + país (gris) a la izquierda
      mainG.append("text").attr("x",-8).attr("y",cy - 5).attr("dy","0.35em")
        .style("text-anchor","end").style("font-size","12px").style("font-weight","bold").style("fill","#222")
        .text(d.city);
      mainG.append("text").attr("x",-8).attr("y",cy + 8).attr("dy","0.35em")
        .style("text-anchor","end").style("font-size","10px").style("fill","#888")
        .text(d.country);

      // Valor a la derecha
      mainG.append("text")
        .attr("x",xScale(d.pop)+8).attr("y",cy).attr("dy","0.35em")
        .style("font-size","12px").style("fill","#444")
        .text(fmtPop(d.pop) + (d.proj ? " (proj.)" : ""));
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
  svg.append("text").attr("x",margin.left).attr("y",H-26)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",margin.left+80).attr("y",H-26)
    .style("font-size","10.5px").style("fill","#333")
    .text("European Commission, Joint Research Centre (JRC) (2025) – with minor processing by Our World in Data");
  svg.append("text").attr("x",margin.left).attr("y",H-13)
    .style("font-size","9.5px").style("fill","#555")
    .text("Note: Because a standardized global definition is used instead of national administrative ones, the figures may differ from those reported by countries.");
  svg.append("text").attr("x",W-10).attr("y",H-13)
    .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
    .text("OurWorldInData.org/urbanization | CC BY");

  setMode("line");
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("population-of-the-worlds-largest-cities.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["population-of-the-worlds-largest-cities.csv", {url: new URL("./files/60ca0ef66adacb3d4ad267449cb46afd78e9c15fcaa639d2eb03749fb8a1ffaa472e434c96fe29e786d9f76a44975ea89da10bd0460178c34d460f2c8328eb3d.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
