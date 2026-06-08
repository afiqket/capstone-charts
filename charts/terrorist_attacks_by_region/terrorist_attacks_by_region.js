function _1(md){return(
md`# Terrorist attacks by region`
)}

function _2(rawData,d3)
{
  const W = 900, H = 520;
  const margin = { top: 70, right: 195, bottom: 70, left: 70 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  // Stacking order: bottom to top (matches legend top-to-bottom reversed)
  const REGIONS = [
    "Sub-Saharan Africa",
    "Central America & Caribbean",
    "East Asia",
    "Middle East & North Africa",
    "South America",
    "Southeast Asia",
    "South Asia",
    "North America",
    "Eastern Europe",
    "Central Asia",
    "Australasia & Oceania"
  ];

  const colorMap = {
    "Australasia & Oceania":       "#c9b8d8",
    "Central Asia":                "#b8cfd8",
    "Eastern Europe":              "#4ec9c9",
    "North America":               "#2e4a7a",
    "South Asia":                  "#e05c6e",
    "Southeast Asia":              "#c06080",
    "South America":               "#c8783a",
    "Middle East & North Africa":  "#e07850",
    "East Asia":                   "#6aaf6a",
    "Central America & Caribbean": "#e08888",
    "Sub-Saharan Africa":          "#8888c8"
  };

  // Filter to region rows only
  const regionSet = new Set(REGIONS);
  const filtered = rawData.filter(d => regionSet.has(d.Entity) && +d.Year >= 1992);

  // Build year → {region: value} map
  const allYears = [...new Set(filtered.map(d => +d.Year))].sort((a,b) => a-b);

  const byYear = new Map();
  allYears.forEach(y => { byYear.set(y, {}); });
  filtered.forEach(d => {
    byYear.get(+d.Year)[d.Entity] = +d.Attacks || 0;
  });

  // Build stacked data array
  const tableData = allYears.map(y => {
    const row = { year: y };
    REGIONS.forEach(r => { row[r] = byYear.get(y)[r] || 0; });
    return row;
  });

  const stack = d3.stack().keys(REGIONS).order(d3.stackOrderNone).offset(d3.stackOffsetNone);
  const series = stack(tableData);

  const yMax = d3.max(series[series.length - 1], d => d[1]);

  const xScale = d3.scaleLinear().domain(d3.extent(allYears)).range([0, innerW]);
  const yScale = d3.scaleLinear().domain([0, Math.ceil(yMax / 2000) * 2000]).range([innerH, 0]);

  let hoveredRegion = null;

  // ── Container ─────────────────────────────────────────────────────────────
  const container = d3.create("div").style("font-family","sans-serif").style("user-select","none");

  const svg = container.append("svg")
    .attr("viewBox",`0 0 ${W} ${H}`)
    .attr("width",W).attr("height",H)
    .style("background","#fff");

  svg.append("text").attr("x",margin.left).attr("y",22)
    .style("font-size","16px").style("font-weight","bold").style("fill","#111")
    .text(`Terrorist attacks by region, ${allYears[0]} to ${allYears[allYears.length-1]}`);

  svg.append("text").attr("x",margin.left).attr("y",40)
    .style("font-size","10.5px").style("fill","#555")
    .text("Number of terrorist attacks by world region.");

  const mainG = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  // Gridlines Y
  yScale.ticks(6).forEach(v => {
    mainG.append("line")
      .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
      .attr("stroke","#e0e0e0").attr("stroke-dasharray","4,3").attr("stroke-width",1);
    mainG.append("text").attr("x",-6).attr("y",yScale(v)).attr("dy","0.35em")
      .style("font-size","10px").style("fill","#888").style("text-anchor","end")
      .text(d3.format(",")(v));
  });

  // X axis
  [1992,1995,2000,2005,2010,2015,2021].forEach(y => {
    mainG.append("text").attr("x",xScale(y)).attr("y",innerH+16)
      .style("font-size","10px").style("fill","#888").style("text-anchor","middle").text(y);
  });
  mainG.append("line").attr("x1",0).attr("x2",innerW)
    .attr("y1",innerH).attr("y2",innerH).attr("stroke","#bbb").attr("stroke-width",1);
  mainG.append("line").attr("x1",0).attr("x2",0)
    .attr("y1",0).attr("y2",innerH).attr("stroke","#bbb").attr("stroke-width",1);

  // ── Area paths ────────────────────────────────────────────────────────────
  const areaGen = d3.area()
    .x(d => xScale(d.data.year))
    .y0(d => yScale(d[0]))
    .y1(d => yScale(d[1]));

  const areasG = mainG.append("g");

  function redrawAreas(hovered) {
    areasG.selectAll("path").data(series, d => d.key)
      .join("path")
      .attr("d", areaGen)
      .attr("fill", d => hovered
        ? (d.key === hovered ? colorMap[d.key] : "#ddd")
        : colorMap[d.key])
      .attr("opacity", d => hovered ? (d.key === hovered ? 1 : 0.3) : 0.9)
      .attr("stroke", "white")
      .attr("stroke-width", 0.5);
  }
  redrawAreas(null);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none").style("pointer-events","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 6px rgba(0,0,0,0.13))");
  const ttTitle = ttG.append("text").attr("x",12).attr("y",22)
    .style("font-size","14px").style("font-weight","bold").style("fill","#111");
  ttG.append("text").attr("x",12).attr("y",38)
    .style("font-size","11px").style("fill","#888").text("in attacks");

  function showTooltip(year, row, hovered, mx, my) {
    ttTitle.text(year);
    ttG.selectAll(".ttrow").remove();
    // Show all regions sorted top to bottom as in legend
    const displayOrder = [...REGIONS].reverse();
    displayOrder.forEach((r, i) => {
      const val = row[r];
      const isBold = r === hovered;
      const g = ttG.append("g").attr("class","ttrow");
      g.append("rect").attr("x",12).attr("y",46+i*20).attr("width",12).attr("height",12)
        .attr("fill", colorMap[r]).attr("rx",2)
        .attr("opacity", hovered && !isBold ? 0.4 : 1);
      g.append("text").attr("x",30).attr("y",57+i*20)
        .style("font-size","11px")
        .style("font-weight", isBold ? "bold" : "normal")
        .style("fill", hovered && !isBold ? "#bbb" : "#333")
        .text(r);
      g.append("text").attr("x",235).attr("y",57+i*20)
        .style("font-size","11px")
        .style("font-weight", isBold ? "bold" : "normal")
        .style("fill", hovered && !isBold ? "#bbb" : "#111")
        .style("text-anchor","end")
        .text(val != null ? d3.format(",")(val) : "No data");
    });
    const ttH = 50 + displayOrder.length * 20 + 8;
    const ttW = 250;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 12;
    const ty = Math.max(0, Math.min(my - 20, H - ttH - 10));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }
  function hideTooltip() {
    ttG.style("display","none");
    hoveredRegion = null;
    redrawAreas(null);
    updateLegend(null);
  }

  // Vertical hover line
  const hoverLine = mainG.append("line").attr("y1",0).attr("y2",innerH)
    .attr("stroke","#aaa").attr("stroke-width",1).style("display","none");

  // Hover dots (one per region at hovered year)
  const hoverDots = REGIONS.map(r =>
    mainG.append("circle").attr("r",4).attr("fill",colorMap[r]).style("display","none")
  );

  mainG.append("rect").attr("width",innerW).attr("height",innerH).attr("fill","transparent")
    .on("mousemove", function(event) {
      const [mx, my] = d3.pointer(event);
      const yr = Math.round(xScale.invert(mx));
      const snapYr = allYears.reduce((a,b) => Math.abs(a-yr)<Math.abs(b-yr)?a:b);
      const row = byYear.get(snapYr) || {};

      // Determine which region the mouse is in (find top series at this x,y)
      let foundRegion = null;
      for (let i = series.length - 1; i >= 0; i--) {
        const s = series[i];
        const pt = s.find(d => d.data.year === snapYr);
        if (pt && yScale(pt[0]) >= my && my >= yScale(pt[1])) {
          foundRegion = s.key;
          break;
        }
      }

      hoverLine.attr("x1",xScale(snapYr)).attr("x2",xScale(snapYr)).style("display",null);

      // Show dots for each region at this year
      REGIONS.forEach((r, i) => {
        const s = series.find(s => s.key === r);
        const pt = s?.find(d => d.data.year === snapYr);
        if (pt && pt[1] > 0) {
          const midY = yScale((pt[0] + pt[1]) / 2);
          hoverDots[i].attr("cx",xScale(snapYr)).attr("cy",midY).style("display",null);
        } else {
          hoverDots[i].style("display","none");
        }
      });

      hoveredRegion = foundRegion;
      redrawAreas(foundRegion);
      updateLegend(foundRegion);
      const [sx,sy] = d3.pointer(event, svg.node());
      showTooltip(snapYr, row, foundRegion, sx, sy);
    })
    .on("mouseleave", () => {
      hoverLine.style("display","none");
      hoverDots.forEach(d => d.style("display","none"));
      hideTooltip();
    });

  // ── Legend ────────────────────────────────────────────────────────────────
  const legendX = W - margin.right + 10;
  const legendG = svg.append("g").attr("transform",`translate(${legendX},${margin.top})`);
  const legendOrder = [...REGIONS].reverse(); // top to bottom

  function updateLegend(hovered) {
    legendG.selectAll(".leg-row").each(function(d) {
      const isH = d === hovered;
      d3.select(this).select("rect")
        .attr("opacity", hovered && !isH ? 0.3 : 1);
      d3.select(this).select("text")
        .style("fill", hovered && !isH ? "#bbb" : colorMap[d])
        .style("font-weight", isH ? "bold" : "normal");
    });
  }

  legendOrder.forEach((region, i) => {
    const row = legendG.append("g").attr("class","leg-row").datum(region)
      .attr("transform",`translate(0,${i * 20})`);
    row.append("rect").attr("x",0).attr("y",0).attr("width",10).attr("height",10)
      .attr("rx",2).attr("fill",colorMap[region]);
    row.append("text").attr("x",15).attr("y",9)
      .style("font-size","10px").style("fill",colorMap[region])
      .text(region);
  });

  // ── Slider (decorative, no bar mode here — area chart only) ───────────────// ── Slider (start-year range) ─────────────────────────────────────────────
const sliderY  = H - 42;
const sliderX0 = 90, sliderX1 = W - 60;
const xSlider  = d3.scalePoint().domain(allYears).range([sliderX0, sliderX1]);

let startYear = allYears[0];
let playing = false, timer = null;

svg.append("text").attr("x",sliderX0).attr("y",sliderY+5)
  .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(allYears[0]);
svg.append("text").attr("x",sliderX1).attr("y",sliderY+5)
  .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(allYears[allYears.length-1]);
svg.append("line").attr("x1",sliderX0).attr("x2",sliderX1)
  .attr("y1",sliderY).attr("y2",sliderY)
  .attr("stroke","#ccc").attr("stroke-width",4).attr("stroke-linecap","round");

const handle = svg.append("circle").attr("cy",sliderY).attr("r",9)
  .attr("fill","#555").style("cursor","pointer");

const playBtn = svg.append("text").attr("x",24).attr("y",sliderY+5)
  .style("font-size","18px").style("cursor","pointer").style("fill","#555").text("▶");

function updateStartYear(y) {
  startYear = y;
  handle.attr("cx", xSlider(y));

  // Filter years from startYear onward
  const visibleYears = allYears.filter(yr => yr >= startYear);
  const visibleData  = tableData.filter(d => d.year >= startYear);

  // Recompute stack & scales
  const newSeries = stack(visibleData);
  const newYMax   = d3.max(newSeries[newSeries.length - 1], d => d[1]);

  xScale.domain([startYear, allYears[allYears.length - 1]]);
  yScale.domain([0, Math.ceil((newYMax || 1) / 2000) * 2000]);

  // Redraw gridlines
  mainG.selectAll(".ygrid").remove();
  yScale.ticks(6).forEach(v => {
    mainG.append("line").attr("class","ygrid")
      .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
      .attr("stroke","#e0e0e0").attr("stroke-dasharray","4,3").attr("stroke-width",1);
    mainG.append("text").attr("class","ygrid")
      .attr("x",-6).attr("y",yScale(v)).attr("dy","0.35em")
      .style("font-size","10px").style("fill","#888").style("text-anchor","end")
      .text(d3.format(",")(v));
  });

  // Redraw x ticks
  mainG.selectAll(".xtick").remove();
  const xTickVals = allYears.filter(yr => yr >= startYear && (yr % 5 === 0 || yr === startYear || yr === allYears[allYears.length-1]));
  xTickVals.forEach(yr => {
    mainG.append("text").attr("class","xtick")
      .attr("x",xScale(yr)).attr("y",innerH+16)
      .style("font-size","10px").style("fill","#888").style("text-anchor","middle").text(yr);
  });

  // Recompute series with new stack and redraw areas
  series.length = 0;
  newSeries.forEach(s => series.push(s));
  redrawAreas(hoveredRegion);
}

svg.append("rect").attr("x",sliderX0).attr("y",sliderY-12)
  .attr("width",sliderX1-sliderX0).attr("height",24)
  .attr("fill","transparent").style("cursor","pointer")
  .on("click", function(event) {
    const [mx] = d3.pointer(event);
    updateStartYear(allYears.reduce((a,b) => Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
  });

handle.call(d3.drag().on("drag", function(event) {
  const mx = Math.max(sliderX0, Math.min(sliderX1, event.x));
  updateStartYear(allYears.reduce((a,b) => Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
}));

playBtn.on("click", () => {
  if (playing) { clearInterval(timer); playing=false; playBtn.text("▶"); }
  else {
    if (startYear === allYears[allYears.length-1]) updateStartYear(allYears[0]);
    playing=true; playBtn.text("⏸");
    timer=setInterval(()=>{
      const idx = allYears.indexOf(startYear);
      if (idx < allYears.length-1) updateStartYear(allYears[idx+1]);
      else { clearInterval(timer); playing=false; playBtn.text("▶"); }
    }, 150);
  }
});

// Initialize handle position
handle.attr("cx", xSlider(startYear));

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",margin.left).attr("y",H-18)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",margin.left+80).attr("y",H-18)
    .style("font-size","10.5px").style("fill","#333")
    .text("National Consortium for the Study of Terrorism and Responses to Terrorism (START) (2022) – processed by Our World in Data");
  svg.append("text").attr("x",W-10).attr("y",H-4)
    .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
    .text("OurWorldInData.org/terrorism | CC BY");

  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("terrorist-attacks-by-region.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["terrorist-attacks-by-region.csv", {url: new URL("./files/7a0e00a468616d21e7fc48b026ea4ac6d02319e44bdaac509c82d3f4fa35039b66bdaf6a4925d42bea11481eefdad989d076447fc151a0851fbe97145eb91b8c.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
