function _1(md){return(
md`# Share of expenditure spent on food vs. food expenditure per person`
)}

function _2(d3,rawData)
{
  const W = 900, H = 560;
  const margin = { top: 100, right: 170, bottom: 80, left: 70 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const colX   = "Food expenditure";
  const colY   = "Share of expenditure spent on food";
  const colReg = "World region according to OWID";

  const regionColor = {
    "North America": "#e8714a",
    "South America": "#8b1a1a",
    "Africa":        "#9b4dca",
    "Europe":        "#4472c4",
    "Asia":          "#2e8b6e",
    "Oceania":       "#4ec9c9"
  };

  const allYears = [2017, 2018, 2019, 2020, 2021, 2022, 2023];
  let currentYear = 2023;
  let playing = false, timer = null;

  const labeledCountries = new Set([
    "Nigeria","Angola","Cameroon","Ethiopia","Algeria","India","Bolivia",
    "China","Brazil","Ukraine","Azerbaijan","Lebanon","Georgia","Belarus",
    "Bosnia and Herz.","Bosnia and Herzegovina","Dominican Republic","Russia",
    "Argentina","Oman","Hungary","Czechia","Singapore","Bahrain",
    "Kazakhstan","Croatia","Italy","Israel","Austria","Australia","Hong Kong","Ireland"
  ]);

  // ── Container ─────────────────────────────────────────────────────────────
  const container = d3.create("div")
    .style("font-family","sans-serif").style("user-select","none").style("position","relative");

  const svg = container.append("svg")
    .attr("viewBox",`0 0 ${W} ${H}`)
    .attr("width",W).attr("height",H)
    .style("background","#fff");

  const titleEl = svg.append("text").attr("x",margin.left).attr("y",22)
    .style("font-size","17px").style("font-weight","bold").style("fill","#111");

  svg.append("foreignObject")
    .attr("x",margin.left).attr("y",30)
    .attr("width",W - margin.left - margin.right - 10).attr("height",55)
    .append("xhtml:div")
    .style("font-size","10.5px").style("color","#555").style("line-height","1.4")
    .text("Food expenditure only includes food bought for consumption at home. Out-of-home food purchases, alcohol, and tobacco are not included. Food expenditure is expressed in US dollars per person. It is not adjusted for inflation or differences in living costs between countries.");

  // Y axis label
  svg.append("text").attr("x",margin.left).attr("y",margin.top - 10)
    .style("font-size","11px").style("font-weight","bold").style("fill","#333")
    .text("Share of expenditure spent on food");

  const mainG = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  // ── Scales ────────────────────────────────────────────────────────────────
  const xScale = d3.scaleLinear().domain([0, 4500]).range([0, innerW]);
  const yScale = d3.scaleLinear().domain([0, 0.65]).range([innerH, 0]);

  // Gridlines & axes
  [0, 1000, 2000, 3000, 4000].forEach(v => {
    mainG.append("line")
      .attr("x1",xScale(v)).attr("x2",xScale(v)).attr("y1",0).attr("y2",innerH)
      .attr("stroke","#e0e0e0").attr("stroke-dasharray","4,3").attr("stroke-width",1);
    mainG.append("text").attr("x",xScale(v)).attr("y",innerH+18)
      .style("font-size","10px").style("fill","#888").style("text-anchor","middle")
      .text(v === 0 ? "" : `$${d3.format(",")(v)}`);
  });

  [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].forEach(v => {
    mainG.append("line")
      .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
      .attr("stroke", v===0 ? "#bbb" : "#e0e0e0")
      .attr("stroke-dasharray", v===0?"0":"4,3").attr("stroke-width",1);
    mainG.append("text").attr("x",-8).attr("y",yScale(v)).attr("dy","0.35em")
      .style("font-size","10px").style("fill","#888").style("text-anchor","end")
      .text(`${v*100}%`);
  });

  mainG.append("line").attr("x1",0).attr("x2",innerW).attr("y1",innerH).attr("y2",innerH)
    .attr("stroke","#bbb").attr("stroke-width",1);
  mainG.append("line").attr("x1",0).attr("x2",0).attr("y1",0).attr("y2",innerH)
    .attr("stroke","#bbb").attr("stroke-width",1);

  // X axis label
  mainG.append("text").attr("x",innerW/2).attr("y",innerH+46)
    .style("font-size","11px").style("font-weight","bold").style("fill","#333").style("text-anchor","middle")
    .text("Food expenditure (current US$)");

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none").style("pointer-events","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 8px rgba(0,0,0,0.15))");
  ttG.append("text").attr("class","tt-name").attr("x",12).attr("y",22)
    .style("font-size","14px").style("font-weight","bold").style("fill","#111");
  ttG.append("text").attr("class","tt-year").attr("x",12).attr("y",38)
    .style("font-size","11px").style("fill","#777");
  ttG.append("line").attr("x1",12).attr("x2",210).attr("y1",46).attr("y2",46)
    .attr("stroke","#eee").attr("stroke-width",1);
  ttG.append("text").attr("x",12).attr("y",60)
    .style("font-size","10px").style("font-weight","bold").style("fill","#555")
    .text("Food expenditure (current US$)");
  ttG.append("text").attr("class","tt-x").attr("x",12).attr("y",78)
    .style("font-size","15px").style("font-weight","bold").style("fill","#111");
  ttG.append("line").attr("x1",12).attr("x2",210).attr("y1",88).attr("y2",88)
    .attr("stroke","#eee").attr("stroke-width",1);
  ttG.append("text").attr("x",12).attr("y",102)
    .style("font-size","10px").style("font-weight","bold").style("fill","#555")
    .text("Share of expenditure spent on food");
  ttG.append("text").attr("class","tt-y").attr("x",12).attr("y",120)
    .style("font-size","15px").style("font-weight","bold").style("fill","#111");

  function showTT(d, mx, my) {
    ttG.select(".tt-name").text(d.entity);
    ttG.select(".tt-year").text(currentYear);
    ttG.select(".tt-x").text(`$${d3.format(",.0f")(d.x)}`);
    ttG.select(".tt-y").text(`${d3.format(".1f")(d.y * 100)}%`);
    const ttW = 225, ttH = 132;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 14;
    const ty = Math.max(0, Math.min(my - 20, H - ttH - 10));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }
  function hideTT() { ttG.style("display","none"); redraw(null); }

  // ── Dots + labels ─────────────────────────────────────────────────────────
  const dotsG   = mainG.append("g");
  const labelsG = mainG.append("g");

  function getPoints(year) {
    return rawData
      .filter(d =>
        +d.Year === year &&
        d[colX] != null && d[colX] !== "" &&
        d[colY] != null && d[colY] !== "" &&
        d.Code && !d.Code.startsWith("OWID_")
      )
      .map(d => ({
        entity: d.Entity,
        x:      +d[colX],
        y:      +d[colY] / 100,   // stored as percent, convert to fraction
        region: d[colReg] || "Other"
      }));
  }

  function redraw(hoveredEntity) {
    const points = getPoints(currentYear);

    dotsG.selectAll("circle").data(points, d => d.entity)
      .join("circle")
      .attr("cx", d => xScale(Math.min(d.x, 4499)))
      .attr("cy", d => yScale(Math.min(d.y, 0.649)))
      .attr("r", 5)
      .attr("fill", d => hoveredEntity
        ? (d.entity === hoveredEntity ? regionColor[d.region] || "#aaa" : "#ccc")
        : regionColor[d.region] || "#aaa")
      .attr("opacity", d => hoveredEntity ? (d.entity === hoveredEntity ? 1 : 0.2) : 0.8)
      .attr("stroke", d => d.entity === hoveredEntity ? "#fff" : "none")
      .attr("stroke-width", 1.5);

    const labelData = hoveredEntity
      ? points.filter(d => d.entity === hoveredEntity)
      : points.filter(d => labeledCountries.has(d.entity));

    labelsG.selectAll("text").data(labelData, d => d.entity)
      .join("text")
      .attr("x", d => xScale(Math.min(d.x, 4499)) + 7)
      .attr("y", d => yScale(Math.min(d.y, 0.649)) + 4)
      .style("font-size","10px")
      .style("fill", d => hoveredEntity ? regionColor[d.region] || "#555" : regionColor[d.region] || "#555")
      .style("font-weight", d => d.entity === hoveredEntity ? "bold" : "normal")
      .text(d => d.entity);
  }

  // Hover overlay
  mainG.append("rect")
    .attr("width",innerW).attr("height",innerH).attr("fill","transparent")
    .on("mousemove", function(event) {
      const [mx, my] = d3.pointer(event);
      const points = getPoints(currentYear);
      const closest = points.reduce((best, d) => {
        const cx = xScale(Math.min(d.x, 4499));
        const cy = yScale(Math.min(d.y, 0.649));
        const dist = Math.sqrt((cx-mx)**2 + (cy-my)**2);
        return dist < best.dist ? { d, dist } : best;
      }, { dist: Infinity, d: null });

      if (closest.dist < 20) {
        redraw(closest.d.entity);
        const [sx, sy] = d3.pointer(event, svg.node());
        showTT(closest.d, sx, sy);
      } else {
        hideTT();
      }
    })
    .on("mouseleave", hideTT);

  // ── Legend ────────────────────────────────────────────────────────────────
  const legendX = W - margin.right + 10;
  const legendG = svg.append("g").attr("transform",`translate(${legendX},${margin.top})`);
  Object.entries(regionColor).forEach(([region, color], i) => {
    legendG.append("rect").attr("x",0).attr("y",i*20).attr("width",12).attr("height",12)
      .attr("rx",2).attr("fill",color);
    legendG.append("text").attr("x",18).attr("y",i*20+10)
      .style("font-size","11px").style("fill","#333").text(region);
  });

  // ── Slider ────────────────────────────────────────────────────────────────
  const sliderY  = H - 50;
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
    titleEl.text(`Share of expenditure spent on food vs. food expenditure per person, ${y}`);
    hideTT();
    redraw(null);
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
      }, 600);
    }
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",margin.left).attr("y",H-18)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",margin.left+80).attr("y",H-18)
    .style("font-size","10.5px").style("fill","#333")
    .text("USDA Economic Research Service (2022); USDA ERS (2023); USDA ERS (2025) – processed by Our World in Data");
  svg.append("text").attr("x",W-10).attr("y",H-4)
    .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
    .text("OurWorldInData.org/food-prices | CC BY");

  redraw(null);
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("share-of-food-expenditure-vs-food-expenditure.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["share-of-food-expenditure-vs-food-expenditure.csv", {url: new URL("./files/b4a314e89c5a515f743ea0cd386c863da97e4dbb705fa8d51ecc7ff3220b92b8d0f5ee1bbfefd80b60a2dce90d97c7504f74943d70fcc8d331af7b873beea692.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["d3","rawData"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
