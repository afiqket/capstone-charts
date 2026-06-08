function _1(md){return(
md`# Share of adults who smoke in 2000 vs. 2022`
)}

function _2(rawData,d3)
{
  const W = 900, H = 560;
  const margin = { top: 90, right: 170, bottom: 70, left: 70 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const colY   = "Share of adults in 2000";
  const colX   = "Share of adults in 2022";
  const colReg = "World region according to OWID";

  const regionColor = {
    "North America": "#e8714a",
    "South America": "#8b1a1a",
    "Africa":        "#9b4dca",
    "Europe":        "#4472c4",
    "Asia":          "#2e8b6e",
    "Oceania":       "#4ec9c9"
  };

  // Keep only year-2000 rows with valid x and y, exclude aggregates (no Code or OWID_ prefix)
  const points = rawData
    .filter(d =>
      +d.Year === 2000 &&
      d[colY] != null && d[colY] !== "" &&
      d[colX] != null && d[colX] !== "" &&
      d.Code && !d.Code.startsWith("OWID_")
    )
    .map(d => ({
      entity:  d.Entity,
      x:       +d[colX],
      y:       +d[colY],
      region:  d[colReg] || "Other"
    }));

  // Labels shown explicitly in original chart
  const labeledCountries = new Set([
    "Nepal","Kiribati","Nauru","Bangladesh","East Timor","Austria","Comoros",
    "Sweden","Chile","Belarus","Cyprus","Bosnia and Herz.","Cambodia","Denmark",
    "Afghanistan","Argentina","Bhutan","Azerbaijan","Algeria","Brunei",
    "Peru","Bolivia","Canada","Uganda","Australia","Africa","Benin",
    "Nigeria","Chad","Ethiopia","Bahamas","Jordan","Andorra","Czechia",
    "Marshall Islands","Bosnia and Herzegovina"
  ]);

  let hovered = null;

  const container = d3.create("div")
    .style("font-family", "sans-serif")
    .style("user-select", "none")
    .style("position", "relative");

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", W).attr("height", H)
    .style("background", "#fff");

  // Title
  svg.append("text").attr("x", margin.left).attr("y", 24)
    .style("font-size", "17px").style("font-weight", "bold").style("fill", "#111")
    .text("Share of adults who smoke in 2000 vs. 2022");

  svg.append("foreignObject")
    .attr("x", margin.left).attr("y", 30)
    .attr("width", W - margin.left - margin.right - 10).attr("height", 50)
    .append("xhtml:div")
    .style("font-size", "10.5px").style("color", "#555").style("line-height", "1.4")
    .text("Percentage of people aged 15 years and older who currently smoke or use tobacco. This includes smokeless products, such as chewing or snuffing tobacco, but excludes products that do not contain tobacco, such as e-cigarettes.");

  const mainG = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const maxVal = Math.ceil(d3.max(points, d => Math.max(d.x, d.y)) / 10) * 10;

  const xScale = d3.scaleLinear().domain([0, maxVal]).range([0, innerW]);
  const yScale = d3.scaleLinear().domain([0, maxVal]).range([innerH, 0]);

  // Gridlines
  xScale.ticks(6).forEach(v => {
    mainG.append("line")
      .attr("x1", xScale(v)).attr("x2", xScale(v)).attr("y1", 0).attr("y2", innerH)
      .attr("stroke", "#e0e0e0").attr("stroke-dasharray", "4,3").attr("stroke-width", 1);
  });
  yScale.ticks(6).forEach(v => {
    mainG.append("line")
      .attr("x1", 0).attr("x2", innerW).attr("y1", yScale(v)).attr("y2", yScale(v))
      .attr("stroke", "#e0e0e0").attr("stroke-dasharray", "4,3").attr("stroke-width", 1);
  });

  // Axes
  mainG.append("line").attr("x1",0).attr("x2",innerW).attr("y1",innerH).attr("y2",innerH)
    .attr("stroke","#bbb").attr("stroke-width",1);
  mainG.append("line").attr("x1",0).attr("x2",0).attr("y1",0).attr("y2",innerH)
    .attr("stroke","#bbb").attr("stroke-width",1);

  xScale.ticks(6).forEach(v => {
    mainG.append("text").attr("x", xScale(v)).attr("y", innerH + 18)
      .style("font-size","10px").style("fill","#888").style("text-anchor","middle")
      .text(`${v}%`);
  });
  yScale.ticks(6).forEach(v => {
    mainG.append("text").attr("x", -8).attr("y", yScale(v)).attr("dy","0.35em")
      .style("font-size","10px").style("fill","#888").style("text-anchor","end")
      .text(`${v}%`);
  });

  // Axis labels
  mainG.append("text").attr("x", innerW / 2).attr("y", innerH + 44)
    .style("font-size","12px").style("font-weight","bold").style("fill","#333").style("text-anchor","middle")
    .text("Share of adults in 2022");
  mainG.append("text")
    .attr("transform", `rotate(-90)`)
    .attr("x", -innerH / 2).attr("y", -52)
    .style("font-size","12px").style("font-weight","bold").style("fill","#333").style("text-anchor","middle")
    .text("Share of adults in 2000");

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none").style("pointer-events","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 8px rgba(0,0,0,0.15))");
  const ttName  = ttG.append("text").attr("x",12).attr("y",22)
    .style("font-size","14px").style("font-weight","bold").style("fill","#111");
  const ttSub   = ttG.append("text").attr("x",12).attr("y",38)
    .style("font-size","11px").style("fill","#777");
  const ttLabel = ttG.append("text").attr("x",12).attr("y",58)
    .style("font-size","11px").style("font-weight","bold").style("fill","#333")
    .text("Share of adults");
  const ttVals  = ttG.append("text").attr("x",12).attr("y",76)
    .style("font-size","15px").style("font-weight","bold");

  function showTT(d, mx, my) {
    ttName.text(d.entity);
    ttSub.text("2000 to 2022");
    ttVals.selectAll("*").remove();
    const decreased = d.y > d.x;
    const arrow = decreased ? "↘" : "↗";
    const arrowColor = decreased ? "#c0392b" : "#27ae60";
    ttVals.append("tspan").style("fill","#333").text(`${d.y.toFixed(1)}%  `);
    ttVals.append("tspan").style("fill", arrowColor).text(`${arrow} ${d.x.toFixed(1)}%`);
    const ttW = 200, ttH = 90;
    ttBg.attr("width", ttW).attr("height", ttH);
    ttG.style("display", null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 14;
    const ty = Math.max(0, Math.min(my - 20, H - ttH - 10));
    ttG.attr("transform", `translate(${tx},${ty})`);
  }
  function hideTT() { ttG.style("display","none"); hovered = null; redraw(); }

  // ── Dots + labels ─────────────────────────────────────────────────────────
  const dotsG   = mainG.append("g");
  const labelsG = mainG.append("g");

  function redraw(hoveredEntity) {
    dotsG.selectAll("circle").data(points, d => d.entity)
      .join("circle")
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", 5)
      .attr("fill", d => hoveredEntity
  ? (d.entity === hoveredEntity ? regionColor[d.region] || "#aaa" : "#aaa")
  : regionColor[d.region] || "#aaa")
      .attr("opacity", d => hoveredEntity ? (d.entity === hoveredEntity ? 1 : 0.15) : 0.75)
      .attr("stroke", d => d.entity === hoveredEntity ? "#fff" : "none")
      .attr("stroke-width", 1.5);

    labelsG.selectAll("text").data(
      hoveredEntity ? points.filter(d => d.entity === hoveredEntity) : points.filter(d => labeledCountries.has(d.entity)),
      d => d.entity
    ).join("text")
      .attr("x", d => xScale(d.x) + 7)
      .attr("y", d => yScale(d.y) + 4)
      .style("font-size","10px")
      .style("fill", d => hoveredEntity ? regionColor[d.region] || "#555" : regionColor[d.region] || "#555")
      .style("font-weight", d => d.entity === hoveredEntity ? "bold" : "normal")
      .text(d => d.entity);
  }

  redraw();

  // Hover overlay
  mainG.append("rect")
    .attr("width", innerW).attr("height", innerH).attr("fill","transparent")
    .on("mousemove", function(event) {
      const [mx, my] = d3.pointer(event);
      const closest = points.reduce((best, d) => {
        const dx = xScale(d.x) - mx, dy = yScale(d.y) - my;
        const dist = Math.sqrt(dx*dx + dy*dy);
        return dist < best.dist ? { d, dist } : best;
      }, { dist: Infinity, d: null });

      if (closest.dist < 20) {
        hovered = closest.d.entity;
        redraw(hovered);
        const [sx, sy] = d3.pointer(event, svg.node());
        showTT(closest.d, sx, sy);
      } else {
        hideTT();
      }
    })
    .on("mouseleave", hideTT);

  // ── Legend ────────────────────────────────────────────────────────────────
  const legendX = W - margin.right + 10;
  const legendG = svg.append("g").attr("transform", `translate(${legendX}, ${margin.top})`);
  Object.entries(regionColor).forEach(([region, color], i) => {
    legendG.append("rect").attr("x",0).attr("y", i*20).attr("width",12).attr("height",12)
      .attr("rx",2).attr("fill", color);
    legendG.append("text").attr("x",18).attr("y", i*20+10)
      .style("font-size","11px").style("fill","#333").text(region);
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x", margin.left).attr("y", H - 28)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333")
    .text("Data source: ");
  svg.append("text").attr("x", margin.left + 80).attr("y", H - 28)
    .style("font-size","10.5px").style("fill","#333")
    .text("World Health Organization - Global Health Observatory (2024) – processed by Our World in Data");
  svg.append("text").attr("x", margin.left).attr("y", H - 14)
    .style("font-size","10px").style("fill","#777")
    .text("Note: To allow for comparisons between countries and over time, this metric is age-standardized.");
  svg.append("text").attr("x", W - 10).attr("y", H - 14)
    .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
    .text("OurWorldInData.org/smoking | CC BY");

  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("adults-smoking-2007-2018.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["adults-smoking-2007-2018.csv", {url: new URL("./files/738363253617193e218569ae931b321ef5ced19ae10e5ed10cd39e60dc13c356811a2edf32a9944e3ae21dfb4ffbf506db26329c2eb741c97fa77f44ea20cbbc.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
