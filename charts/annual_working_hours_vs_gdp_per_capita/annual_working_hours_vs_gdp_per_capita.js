function _1(md){return(
md`# Annual working hours vs. GDP per capita`
)}

function _2(rawData,d3)
{
  const W = 960, H = 600;
  const margin = { top: 110, right: 215, bottom: 95, left: 80 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const colX   = "GDP per capita";
  const colY   = "Average working hours per worker";
  const colPop = "Population";
  const colReg = "World region according to OWID";

  const regionColor = {
    "North America": "#e8714a",
    "South America": "#8b1a1a",
    "Africa":        "#9b4dca",
    "Europe":        "#4472c4",
    "Asia":          "#2e8b6e",
    "Oceania":       "#4ec9c9"
  };

  const allYears = [...new Set(rawData.map(d => +d.Year))].filter(Boolean).sort();
  let currentYear = Math.max(...allYears);
  let playing = false, timer = null;

  const labeledCountries = new Set([
    "United States","Germany","United Kingdom","Ireland","Japan","France",
    "Saudi Arabia","Qatar","Singapore","Russia","Kazakhstan","China","India",
    "Indonesia","Thailand","Vietnam","Malaysia","Myanmar","South Korea",
    "Mexico","Uruguay","Iraq","Azerbaijan","Kyrgyzstan","Nigeria","Ghana",
    "Ethiopia","Uganda","Niger","Burkina Faso","Sudan","DR Congo","Congo",
    "Mozambique","Yemen","Lebanon","India","South Africa"
  ]);

  const maxPop = d3.max(rawData, d => +d[colPop] || 0);
  const rScale = d3.scaleSqrt().domain([0, maxPop]).range([0, 40]);

  const container = d3.create("div")
    .style("font-family", "sans-serif")
    .style("user-select", "none")
    .style("position", "relative");

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", W).attr("height", H)
    .style("background", "#fff");

  // Title
  const titleEl = svg.append("text")
    .attr("x", margin.left).attr("y", 28)
    .style("font-size", "20px").style("font-weight", "bold").style("fill", "#111");

  // Subtitle
  svg.append("foreignObject")
    .attr("x", margin.left).attr("y", 38)
    .attr("width", W - margin.left - margin.right - 10).attr("height", 55)
    .append("xhtml:div")
    .style("font-size", "10.5px").style("color", "#555").style("line-height", "1.4")
    .text("Working hours are the annual average per worker. GDP per capita is adjusted for inflation and differences in living costs between countries.");

  // Y axis label
  svg.append("foreignObject")
    .attr("x", margin.left).attr("y", margin.top - 28)
    .attr("width", 400).attr("height", 22)
    .append("xhtml:div")
    .style("font-size", "11px").style("font-weight", "bold").style("color", "#333")
    .html("Average working hours per worker <span style='font-weight:normal'>(hours per worker)</span>");

  const mainG = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // ── Scales (X is LOG) ─────────────────────────────────────────────────────
  const xScale = d3.scaleLog().domain([800, 130000]).range([0, innerW]);
  const yScale = d3.scaleLinear().domain([1300, 3100]).range([innerH, 0]);

  // Gridlines & axes — X (log)
  const xTicks = [1000, 2000, 5000, 10000, 20000, 50000, 100000];
  xTicks.forEach(v => {
    mainG.append("line")
      .attr("x1", xScale(v)).attr("x2", xScale(v))
      .attr("y1", 0).attr("y2", innerH)
      .attr("stroke", "#e0e0e0").attr("stroke-dasharray", "4,3").attr("stroke-width", 1);
    mainG.append("text")
      .attr("x", xScale(v)).attr("y", innerH + 18)
      .style("font-size", "10px").style("fill", "#888").style("text-anchor", "middle")
      .text(`$${d3.format("~s")(v).replace("k","k").replace("M","M")}`);
  });

  // Gridlines & axes — Y (linear)
  const yTicks = [1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000];
  yTicks.forEach(v => {
    mainG.append("line")
      .attr("x1", 0).attr("x2", innerW)
      .attr("y1", yScale(v)).attr("y2", yScale(v))
      .attr("stroke", "#e0e0e0").attr("stroke-dasharray", "4,3").attr("stroke-width", 1);
    mainG.append("text")
      .attr("x", -8).attr("y", yScale(v)).attr("dy", "0.35em")
      .style("font-size", "10px").style("fill", "#888").style("text-anchor", "end")
      .text(`${d3.format(",")(v)} h`);
  });

  mainG.append("line").attr("x1",0).attr("x2",innerW).attr("y1",innerH).attr("y2",innerH)
    .attr("stroke","#bbb").attr("stroke-width",1);
  mainG.append("line").attr("x1",0).attr("x2",0).attr("y1",0).attr("y2",innerH)
    .attr("stroke","#bbb").attr("stroke-width",1);

  // X axis label
  mainG.append("foreignObject")
    .attr("x", innerW / 2 - 200).attr("y", innerH + 38)
    .attr("width", 400).attr("height", 22)
    .append("xhtml:div")
    .style("font-size", "11px").style("text-align", "center").style("color", "#333")
    .html("<strong>GDP per capita</strong> (international-$ in 2021 prices; plotted on a logarithmic axis)");

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none").style("pointer-events","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 8px rgba(0,0,0,0.15))");
  ttG.append("text").attr("class","tt-name").attr("x",12).attr("y",26)
    .style("font-size","15px").style("font-weight","bold").style("fill","#111");
  ttG.append("text").attr("class","tt-year").attr("x",12).attr("y",42)
    .style("font-size","11px").style("fill","#777");
  ttG.append("line").attr("x1",12).attr("x2",250).attr("y1",50).attr("y2",50)
    .attr("stroke","#eee").attr("stroke-width",1);
  ttG.append("text").attr("x",12).attr("y",64)
    .style("font-size","10px").style("font-weight","bold").style("fill","#555")
    .text("GDP per capita");
  ttG.append("text").attr("class","tt-x").attr("x",12).attr("y",82)
    .style("font-size","15px").style("font-weight","bold").style("fill","#111");
  ttG.append("line").attr("x1",12).attr("x2",250).attr("y1",92).attr("y2",92)
    .attr("stroke","#eee").attr("stroke-width",1);
  ttG.append("text").attr("x",12).attr("y",106)
    .style("font-size","10px").style("font-weight","bold").style("fill","#555")
    .text("Average working hours per worker");
  ttG.append("text").attr("class","tt-y").attr("x",12).attr("y",124)
    .style("font-size","15px").style("font-weight","bold").style("fill","#111");
  ttG.append("line").attr("x1",12).attr("x2",250).attr("y1",134).attr("y2",134)
    .attr("stroke","#eee").attr("stroke-width",1);
  ttG.append("text").attr("x",12).attr("y",148)
    .style("font-size","10px").style("font-weight","bold").style("fill","#555")
    .text("Population (people)");
  ttG.append("text").attr("class","tt-pop").attr("x",12).attr("y",166)
    .style("font-size","15px").style("font-weight","bold").style("fill","#111");

  function showTT(d, mx, my) {
    ttG.select(".tt-name").text(d.entity);
    ttG.select(".tt-year").text(currentYear);
    ttG.select(".tt-x").text(d.x != null ? `$${d3.format(",.0f")(d.x)}` : "No data");
    ttG.select(".tt-y").text(d.y != null ? `${d3.format(",.0f")(d.y)} h` : "No data");
    ttG.select(".tt-pop").text(d.pop != null ? d3.format(",.2~s")(d.pop).replace("G","B") : "No data");
    const ttW = 270, ttH = 180;
    ttBg.attr("width", ttW).attr("height", ttH);
    ttG.style("display", null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 14;
    const ty = Math.max(0, Math.min(my - 20, H - ttH - 10));
    ttG.attr("transform", `translate(${tx},${ty})`);
  }
  function hideTT() { ttG.style("display","none"); redraw(null); }

  // ── Dots + labels ─────────────────────────────────────────────────────────
  const dotsG   = mainG.append("g");
  const labelsG = mainG.append("g");

  function getPoints(year) {
    const countries = [...new Set(rawData.map(d => d.Entity))].filter(e => {
      const r = rawData.find(d => d.Entity === e);
      return r && r.Code && !r.Code.startsWith("OWID_");
    });
    return countries.map(entity => {
      const rows = rawData.filter(d => d.Entity === entity);
      const region = (rows[0] || {})[colReg] || "Other";
      const xRows = rows.filter(d => d[colX] != null && d[colX] !== "");
      const xRow  = xRows.sort((a,b) => Math.abs(+a.Year-year)-Math.abs(+b.Year-year))[0];
      const yRows = rows.filter(d => d[colY] != null && d[colY] !== "");
      const yRow  = yRows.sort((a,b) => Math.abs(+a.Year-year)-Math.abs(+b.Year-year))[0];
      const popRows = rows.filter(d => d[colPop] != null && d[colPop] !== "");
      const popRow  = popRows.sort((a,b) => Math.abs(+a.Year-year)-Math.abs(+b.Year-year))[0];
      if (!xRow && !yRow) return null;
      return {
        entity,
        x:   xRow   ? +xRow[colX]     : null,
        y:   yRow   ? +yRow[colY]     : null,
        pop: popRow ? +popRow[colPop] : null,
        region
      };
    }).filter(d => d && d.x != null && d.y != null && d.x > 0);
  }

  function clampX(v) { return Math.max(800, Math.min(v, 130000)); }
  function clampY(v) { return Math.max(1300, Math.min(v, 3100)); }

  function redraw(hoveredEntity) {
    const points = getPoints(currentYear);
    points.sort((a,b) => (b.pop||0) - (a.pop||0));

    dotsG.selectAll("circle").data(points, d => d.entity)
      .join("circle")
      .attr("cx", d => xScale(clampX(d.x)))
      .attr("cy", d => yScale(clampY(d.y)))
      .attr("r",  d => d.pop ? Math.max(3, rScale(d.pop)) : 4)
      .attr("fill", d => hoveredEntity
        ? (d.entity === hoveredEntity ? regionColor[d.region]||"#aaa" : "#ccc")
        : regionColor[d.region]||"#aaa")
      .attr("opacity", d => hoveredEntity ? (d.entity===hoveredEntity ? 0.85 : 0.15) : 0.7)
      .attr("stroke", d => d.entity===hoveredEntity ? "#fff" : "none")
      .attr("stroke-width", 1.5);

    const labelData = hoveredEntity
      ? points.filter(d => d.entity===hoveredEntity)
      : points.filter(d => labeledCountries.has(d.entity));

    labelsG.selectAll("text").data(labelData, d => d.entity)
      .join("text")
      .attr("x", d => xScale(clampX(d.x)) + (d.pop ? Math.max(3,rScale(d.pop)) : 4) + 3)
      .attr("y", d => yScale(clampY(d.y)) + 4)
      .style("font-size", "10px")
      .style("fill", d => regionColor[d.region]||"#555")
      .style("font-weight", d => d.entity===hoveredEntity ? "bold" : "normal")
      .text(d => d.entity);
  }

  // Hover overlay
  mainG.append("rect")
    .attr("width", innerW).attr("height", innerH)
    .attr("fill","transparent")
    .on("mousemove", function(event) {
      const [mx, my] = d3.pointer(event);
      const points = getPoints(currentYear);
      const closest = points.reduce((best,d) => {
        const cx = xScale(clampX(d.x));
        const cy = yScale(clampY(d.y));
        const dist = Math.sqrt((cx-mx)**2+(cy-my)**2);
        return dist < best.dist ? {d,dist} : best;
      }, {dist:Infinity, d:null});
      if (closest.dist < 30) {
        redraw(closest.d.entity);
        const [sx,sy] = d3.pointer(event, svg.node());
        showTT(closest.d, sx, sy);
      } else { hideTT(); }
    })
    .on("mouseleave", hideTT);

  // ── Legend (regions) ──────────────────────────────────────────────────────
  const legendX = W - margin.right + 15;
  const legendG = svg.append("g").attr("transform",`translate(${legendX},${margin.top})`);
  Object.entries(regionColor).forEach(([region,color],i) => {
    legendG.append("rect").attr("x",0).attr("y",i*20).attr("width",12).attr("height",12)
      .attr("rx",2).attr("fill",color);
    legendG.append("text").attr("x",18).attr("y",i*20+10)
      .style("font-size","11px").style("fill","#333").text(region);
  });

  // ── Bubble size legend ────────────────────────────────────────────────────
  const sizeLegG = svg.append("g").attr("transform",`translate(${legendX+10},${margin.top+155})`);
  sizeLegG.append("text").attr("x",0).attr("y",0)
    .style("font-size","10px").style("fill","#555").text("Circles sized by");
  sizeLegG.append("text").attr("x",0).attr("y",14)
    .style("font-size","10px").style("font-weight","bold").style("fill","#333").text("Population");
  const sizePairs = [[600e6,"600M"],[1.4e9,"1.4B"]];
  let sy = 30;
  sizePairs.forEach(([val,label]) => {
    const r = Math.max(3, rScale(val));
    sizeLegG.append("circle").attr("cx",30).attr("cy",sy+r).attr("r",r)
      .attr("fill","none").attr("stroke","#aaa").attr("stroke-width",1);
    sizeLegG.append("text").attr("x",30+r+5).attr("y",sy+r+4)
      .style("font-size","10px").style("fill","#555").text(label);
    sy += r*2+8;
  });

  // ── Year slider ───────────────────────────────────────────────────────────
  const sliderY  = H - 50;
  const sliderX0 = 90, sliderX1 = W - 60;
  const xSlider  = d3.scalePoint().domain(allYears).range([sliderX0,sliderX1]);
  const sliderG  = svg.append("g");

  const playBtn = sliderG.append("text")
    .attr("x",24).attr("y",sliderY+5)
    .style("font-size","18px").style("cursor","pointer").style("fill","#555")
    .text("▶");

  sliderG.append("text").attr("x",sliderX0).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle")
    .text(allYears[0]);
  sliderG.append("text").attr("x",sliderX1).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle")
    .text(allYears[allYears.length-1]);
  sliderG.append("line")
    .attr("x1",sliderX0).attr("x2",sliderX1)
    .attr("y1",sliderY).attr("y2",sliderY)
    .attr("stroke","#ccc").attr("stroke-width",4).attr("stroke-linecap","round");

  const handle = sliderG.append("circle").attr("cy",sliderY).attr("r",9)
    .attr("fill","#555").style("cursor","pointer");

  function updateYear(y) {
    currentYear = y;
    handle.attr("cx", xSlider(y));
    titleEl.text(`Annual working hours vs. GDP per capita, ${y}`);
    hideTT();
    redraw(null);
  }
  updateYear(currentYear);

  sliderG.append("rect")
    .attr("x",sliderX0).attr("y",sliderY-12)
    .attr("width",sliderX1-sliderX0).attr("height",24)
    .attr("fill","transparent").style("cursor","pointer")
    .on("click", function(event) {
      const [mx] = d3.pointer(event);
      updateYear(allYears.reduce((a,b) =>
        Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
    });

  handle.call(d3.drag().on("drag", function(event) {
    const mx = Math.max(sliderX0, Math.min(sliderX1, event.x));
    updateYear(allYears.reduce((a,b) =>
      Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
  }));

  playBtn.on("click", () => {
    if (playing) {
      clearInterval(timer); playing=false; playBtn.text("▶");
    } else {
      if (currentYear===allYears[allYears.length-1]) updateYear(allYears[0]);
      playing=true; playBtn.text("⏸");
      timer = setInterval(() => {
        const idx = allYears.indexOf(currentYear);
        if (idx<allYears.length-1) updateYear(allYears[idx+1]);
        else { clearInterval(timer); playing=false; playBtn.text("▶"); }
      }, 700);
    }
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",margin.left).attr("y",H-28)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333")
    .text("Data source: ");
  svg.append("text").attr("x",margin.left+82).attr("y",H-28)
    .style("font-size","10.5px").style("fill","#333")
    .text("Feenstra et al. - Penn World Table (2025) – with major processing by Our World in Data");
  svg.append("foreignObject")
    .attr("x",margin.left).attr("y",H-20)
    .attr("width",700).attr("height",18)
    .append("xhtml:div")
    .style("font-size","10px").style("color","#555")
    .html("<strong>Note:</strong> This data is expressed in international-$ at 2021 prices, using multiple benchmark years to adjust for differences in living costs between countries over time.");
  svg.append("text").attr("x",W-10).attr("y",H-16)
    .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
    .text("OurWorldInData.org/working-hours | CC BY");

  redraw(null);
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("annual-working-hours-vs-gdp-per-capita-pwt.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["annual-working-hours-vs-gdp-per-capita-pwt.csv", {url: new URL("./files/c799ff0dfc31152f1af65a2f2f5efc1790df8c1c5798206592a1201549363ab376b91b20724a1ddcaa01573f2a87f6cc18abb686bd500de6943fd4148375c788.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
