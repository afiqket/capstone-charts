function _1(md){return(
md`# Life satisfaction vs. life expectancy`
)}

function _2(rawData,d3)
{
  const W = 900, H = 590;
  const margin = { top: 105, right: 195, bottom: 85, left: 65 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const colX   = "Life satisfaction (measured from lowest=0 to highest=10 on Cantril Ladder)";
  const colY   = "Life expectancy at birth";
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

  const allYears = [...new Set(
    rawData
      .filter(d => d[colX] != null && d[colX] !== "" && d.Code && !d.Code.startsWith("OWID_"))
      .map(d => +d.Year)
  )].sort((a, b) => a - b);

  let currentYear = allYears[allYears.length - 1];
  let playing = false, timer = null;

  const labeledCountries = new Set([
    "Hong Kong","Italy","France","Australia","United States","China","Albania",
    "Algeria","Brazil","Mexico","India","Sri Lanka","Iran","Morocco","Iraq",
    "Indonesia","Uzbekistan","Libya","Pakistan","Laos","South Africa","Mozambique",
    "Ethiopia","Malawi","DR Congo","Kenya","Burkina Faso","Mali","Chad","Nigeria",
    "Lesotho","Lebanon","Afghanistan"
  ]);

  // ── Container ─────────────────────────────────────────────────────────────
  const container = d3.create("div")
    .style("font-family","sans-serif").style("user-select","none").style("position","relative");

  const svg = container.append("svg")
    .attr("viewBox",`0 0 ${W} ${H}`)
    .attr("width",W).attr("height",H)
    .style("background","#fff");

  const titleEl = svg.append("text").attr("x",margin.left).attr("y",24)
    .style("font-size","17px").style("font-weight","bold").style("fill","#111");

  svg.append("foreignObject")
    .attr("x",margin.left).attr("y",30)
    .attr("width", W - margin.left - margin.right - 10).attr("height",55)
    .append("xhtml:div")
    .style("font-size","10.5px").style("color","#555").style("line-height","1.4")
    .text("The vertical axis shows life expectancy at birth. The horizontal axis shows self-reported life satisfaction in the Cantril Ladder (0–10 point scale with higher values representing higher life satisfaction).");

  svg.append("text").attr("x",margin.left).attr("y",margin.top - 12)
    .style("font-size","11px").style("font-weight","bold").style("fill","#333")
    .text("Life expectancy at birth");

  const mainG = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  // ── Scales ────────────────────────────────────────────────────────────────
  const xScale = d3.scaleLinear().domain([1.5, 8.2]).range([0, innerW]);
  const yScale = d3.scaleLinear().domain([43, 88]).range([innerH, 0]);

  // Population → radius (sqrt scale so area ∝ population)
  const rScale = d3.scaleSqrt().domain([0, 1_500_000_000]).range([0, 55]);

  // ── Gridlines & axes ──────────────────────────────────────────────────────
  [2,3,4,5,6,7].forEach(v => {
    mainG.append("line")
      .attr("x1",xScale(v)).attr("x2",xScale(v)).attr("y1",0).attr("y2",innerH)
      .attr("stroke","#e0e0e0").attr("stroke-dasharray","4,3").attr("stroke-width",1);
    mainG.append("text").attr("x",xScale(v)).attr("y",innerH+18)
      .style("font-size","10px").style("fill","#888").style("text-anchor","middle").text(v);
  });

  [45,50,55,60,65,70,75,80,85].forEach(v => {
    mainG.append("line")
      .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
      .attr("stroke","#e0e0e0").attr("stroke-dasharray","4,3").attr("stroke-width",1);
    mainG.append("text").attr("x",-8).attr("y",yScale(v)).attr("dy","0.35em")
      .style("font-size","10px").style("fill","#888").style("text-anchor","end")
      .text(`${v} years`);
  });

  mainG.append("line").attr("x1",0).attr("x2",innerW).attr("y1",innerH).attr("y2",innerH)
    .attr("stroke","#bbb").attr("stroke-width",1);
  mainG.append("line").attr("x1",0).attr("x2",0).attr("y1",0).attr("y2",innerH)
    .attr("stroke","#bbb").attr("stroke-width",1);

  mainG.append("text").attr("x",innerW/2).attr("y",innerH+46)
    .style("font-size","11px").style("font-weight","bold").style("fill","#333").style("text-anchor","middle")
    .text("Life satisfaction (measured from lowest=0 to highest=10 on Cantril Ladder)");

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none").style("pointer-events","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 8px rgba(0,0,0,0.15))");
  ttG.append("text").attr("class","tt-name").attr("x",12).attr("y",22)
    .style("font-size","14px").style("font-weight","bold").style("fill","#111");
  ttG.append("text").attr("class","tt-year").attr("x",12).attr("y",38)
    .style("font-size","11px").style("fill","#777");
  ttG.append("line").attr("class","tt-d1").attr("x1",12).attr("x2",230).attr("y1",46).attr("y2",46)
    .attr("stroke","#eee").attr("stroke-width",1);
  ttG.append("text").attr("x",12).attr("y",60)
    .style("font-size","10px").style("font-weight","bold").style("fill","#555")
    .text("Life satisfaction (measured from lowest=0 to highest=10 on Cantril Ladder)");
  ttG.append("text").attr("class","tt-x").attr("x",12).attr("y",82)
    .style("font-size","15px").style("font-weight","bold").style("fill","#111");
  ttG.append("line").attr("class","tt-d2").attr("x1",12).attr("x2",230).attr("y1",92).attr("y2",92)
    .attr("stroke","#eee").attr("stroke-width",1);
  ttG.append("text").attr("x",12).attr("y",106)
    .style("font-size","10px").style("font-weight","bold").style("fill","#555")
    .text("Life expectancy at birth");
  ttG.append("text").attr("class","tt-y").attr("x",12).attr("y",124)
    .style("font-size","15px").style("font-weight","bold").style("fill","#111");
  ttG.append("line").attr("class","tt-d3").attr("x1",12).attr("x2",230).attr("y1",134).attr("y2",134)
    .attr("stroke","#eee").attr("stroke-width",1);
  ttG.append("text").attr("x",12).attr("y",148)
    .style("font-size","10px").style("font-weight","bold").style("fill","#555")
    .text("Population (people)");
  ttG.append("text").attr("class","tt-pop").attr("x",12).attr("y",166)
    .style("font-size","15px").style("font-weight","bold").style("fill","#111");

  function showTT(d, mx, my) {
    ttG.select(".tt-name").text(d.entity);
    ttG.select(".tt-year").text(currentYear);
    ttG.select(".tt-x").text(d3.format(".2f")(d.x));
    ttG.select(".tt-y").text(`${d3.format(".1f")(d.y)} years`);
    const popM = d.pop / 1e6;
    ttG.select(".tt-pop").text(popM >= 1000
      ? `${d3.format(".2f")(d.pop/1e9)} billion`
      : `${d3.format(".2f")(popM)} million`);
    const ttW = 245, ttH = 180;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 14;
    const ty = Math.max(0, Math.min(my - 20, H - ttH - 10));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }
  function hideTT() { ttG.style("display","none"); redraw(null); }

  // ── Dots + labels ─────────────────────────────────────────────────────────
  const bubblesG = mainG.append("g");
  const labelsG  = mainG.append("g");

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
        y:      +d[colY],
        pop:    +d[colPop] || 1e6,
        region: d[colReg] || "Other"
      }))
      .sort((a, b) => b.pop - a.pop); // draw big first so small visible on top
  }

  function bx(d) { return xScale(Math.max(1.6, Math.min(8.1, d.x))); }
  function by(d) { return yScale(Math.max(44, Math.min(87, d.y))); }

  function redraw(hoveredEntity) {
    const points = getPoints(currentYear);

    bubblesG.selectAll("circle").data(points, d => d.entity)
      .join("circle")
      .attr("cx", bx).attr("cy", by)
      .attr("r", d => Math.max(3, rScale(d.pop)))
      .attr("fill", d => hoveredEntity
        ? (d.entity === hoveredEntity ? regionColor[d.region] || "#aaa" : "#ccc")
        : regionColor[d.region] || "#aaa")
      .attr("opacity", d => hoveredEntity ? (d.entity === hoveredEntity ? 0.85 : 0.15) : 0.7)
      .attr("stroke", d => d.entity === hoveredEntity ? "#fff" : "rgba(255,255,255,0.4)")
      .attr("stroke-width", d => d.entity === hoveredEntity ? 1.5 : 0.5);

    const labelData = hoveredEntity
      ? points.filter(d => d.entity === hoveredEntity)
      : points.filter(d => labeledCountries.has(d.entity));

    labelsG.selectAll("text").data(labelData, d => d.entity)
      .join("text")
      .attr("x", d => bx(d) + Math.max(3, rScale(d.pop)) + 3)
      .attr("y", d => by(d) + 4)
      .style("font-size", d => d.pop > 200e6 ? "11px" : "10px")
      .style("font-weight", d => d.pop > 200e6 || d.entity === hoveredEntity ? "bold" : "normal")
      .style("fill", d => hoveredEntity ? regionColor[d.region] || "#555" : regionColor[d.region] || "#555")
      .text(d => d.entity);
  }

  // Hover overlay
  mainG.append("rect")
    .attr("width",innerW).attr("height",innerH).attr("fill","transparent")
    .on("mousemove", function(event) {
      const [mx, my] = d3.pointer(event);
      const points = getPoints(currentYear);
      const closest = points.reduce((best, d) => {
        const dist = Math.sqrt((bx(d)-mx)**2 + (by(d)-my)**2);
        return dist < best.dist ? { d, dist } : best;
      }, { dist: Infinity, d: null });

      if (closest.dist < Math.max(20, rScale(closest.d?.pop || 0)) + 5) {
        redraw(closest.d.entity);
        const [sx,sy] = d3.pointer(event, svg.node());
        showTT(closest.d, sx, sy);
      } else {
        hideTT();
      }
    })
    .on("mouseleave", hideTT);

  // ── Legend ────────────────────────────────────────────────────────────────
  const legendX = W - margin.right + 12;
  const legendG = svg.append("g").attr("transform",`translate(${legendX},${margin.top})`);

  Object.entries(regionColor).forEach(([region, color], i) => {
    legendG.append("rect").attr("x",0).attr("y",i*20).attr("width",12).attr("height",12)
      .attr("rx",2).attr("fill",color);
    legendG.append("text").attr("x",18).attr("y",i*20+10)
      .style("font-size","11px").style("fill","#333").text(region);
  });

  // Bubble size legend
  const bubLegY = 145;
  legendG.append("text").attr("x",0).attr("y",bubLegY)
    .style("font-size","10px").style("fill","#555").text("1.4B");
  legendG.append("circle").attr("cx",20).attr("cy",bubLegY+20).attr("r",rScale(1.4e9))
    .attr("fill","none").attr("stroke","#aaa").attr("stroke-width",1);
  legendG.append("circle").attr("cx",20).attr("cy",bubLegY+20+rScale(1.4e9)-rScale(600e6)).attr("r",rScale(600e6))
    .attr("fill","none").attr("stroke","#aaa").attr("stroke-width",1);
  legendG.append("text").attr("x",0).attr("y",bubLegY+15).style("font-size","10px").style("fill","#555").text("600M");
  legendG.append("text").attr("x",0).attr("y",bubLegY+55)
    .style("font-size","10px").style("fill","#777").text("Circles sized by");
  legendG.append("text").attr("x",0).attr("y",bubLegY+68)
    .style("font-size","10px").style("font-weight","bold").style("fill","#333").text("Population");

  // ── Slider ────────────────────────────────────────────────────────────────
  const sliderY  = H - 52;
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
    titleEl.text(`Life satisfaction vs. life expectancy, ${y}`);
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
      }, 500);
    }
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",margin.left).attr("y",H-14)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",margin.left+80).attr("y",H-14)
    .style("font-size","10.5px").style("fill","#333")
    .text("UN, World Population Prospects (2024); Wellbeing Research Centre (2026) – processed by Our World in Data");
  svg.append("text").attr("x",W-10).attr("y",H-14)
    .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
    .text("OurWorldInData.org/happiness-and-life-satisfaction | CC BY");

  redraw(null);
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("life-satisfaction-vs-life-expectancy.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["life-satisfaction-vs-life-expectancy.csv", {url: new URL("./files/4a332e6915d972c8ca59fe31158a33eb5009fb3d9d8355da595f68457e257a8604ce210fa0ec8d2cc336680a6d76952320afc03048b5557684034e594e8f716e.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
