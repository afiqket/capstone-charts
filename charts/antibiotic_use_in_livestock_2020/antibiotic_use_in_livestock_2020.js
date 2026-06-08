function _1(md){return(
md`# Antibiotic use in livestock, 2020`
)}

function _2(rawData,d3)
{
  const W = 1100, H = 600;
  const margin = { top: 100, right: 20, bottom: 120, left: 75 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const COL_VAL    = "Antibiotic use in livestock";
  const COL_REGION = "World region according to OWID";

  const REGION_COLORS = {
    "North America": "#f4a582",
    "South America": "#b2182b",
    "Africa":        "#c994c7",
    "Europe":        "#5a6fa8",
    "Asia":          "#2a9d8f",
    "Oceania":       "#76ccc4"
  };
  const REGION_ORDER = ["North America","South America","Africa","Europe","Asia","Oceania"];

  // Parse & sort descending
  const data = rawData
    .filter(d => d[COL_VAL] != null && d[COL_VAL] !== "")
    .map(d => ({
      entity: d.Entity,
      val:    +d[COL_VAL],
      region: d[COL_REGION] || "Other"
    }))
    .sort((a, b) => b.val - a.val);

  const container = d3.create("div").style("font-family","sans-serif").style("user-select","none");

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", W).attr("height", H)
    .style("background","#fff");

  // ── Título & subtítulo ────────────────────────────────────────────────────
  svg.append("text").attr("x", margin.left).attr("y", 22)
    .style("font-size","16px").style("font-weight","bold").style("fill","#111")
    .text("Antibiotic use in livestock, 2020");
  svg.append("text").attr("x", margin.left).attr("y", 38)
    .style("font-size","10.5px").style("fill","#555")
    .text("Milligrams of total antibiotic use per kilogram of livestock. Adjusted for differences in livestock numbers and species (PCU).");

  // ── Leyenda ───────────────────────────────────────────────────────────────
  let lx = margin.left;
  REGION_ORDER.forEach(r => {
    if (!REGION_COLORS[r]) return;
    svg.append("rect").attr("x",lx).attr("y",52).attr("width",14).attr("height",14)
      .attr("fill",REGION_COLORS[r]).attr("rx",2);
    svg.append("text").attr("x",lx+18).attr("y",63)
      .style("font-size","11px").style("fill","#333").text(r);
    lx += r.length * 7 + 32;
  });

  const mainG = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  // ── Escalas ───────────────────────────────────────────────────────────────
  const xScale = d3.scaleBand()
    .domain(data.map(d => d.entity))
    .range([0, innerW])
    .padding(0.12);

  const yMax = Math.ceil(d3.max(data, d => d.val) / 50) * 50;
  const yScale = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);

  // ── Gridlines Y ───────────────────────────────────────────────────────────
  d3.range(0, yMax + 1, 50).forEach(v => {
    mainG.append("line")
      .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
      .attr("stroke", v===0 ? "#aaa" : "#e0e0e0")
      .attr("stroke-dasharray", v===0?"0":"4,3").attr("stroke-width",1);
    mainG.append("text").attr("x",-6).attr("y",yScale(v)).attr("dy","0.35em")
      .style("font-size","9.5px").style("fill","#888").style("text-anchor","end")
      .text(v + " mg/PCU");
  });

  // ── Barras ────────────────────────────────────────────────────────────────
  const barW = xScale.bandwidth();

  data.forEach(d => {
    const color = REGION_COLORS[d.region] || "#aaa";
    mainG.append("rect")
      .attr("x", xScale(d.entity))
      .attr("y", yScale(d.val))
      .attr("width", barW)
      .attr("height", innerH - yScale(d.val))
      .attr("fill", color)
      .attr("rx", 1);
  });

  // ── Etiquetas X (rotadas, cada N países para no saturar) ──────────────────
  // Mostrar solo algunos países destacados + primero y último
  const nLabels = 15;
  const step = Math.floor(data.length / nLabels);
  const labelIdxs = new Set([
    0, 1, 2, 3,
    ...d3.range(0, data.length, step),
    data.length - 1
  ]);

  data.forEach((d, i) => {
    if (!labelIdxs.has(i)) return;
    const color = REGION_COLORS[d.region] || "#555";
    mainG.append("text")
      .attr("x", xScale(d.entity) + barW / 2)
      .attr("y", innerH + 8)
      .attr("transform", `rotate(-45, ${xScale(d.entity) + barW/2}, ${innerH + 8})`)
      .style("text-anchor","end")
      .style("font-size","9.5px")
      .style("fill", color)
      .text(d.entity);
  });

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none").style("pointer-events","none");
  const ttBg = ttG.append("rect").attr("rx",5).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 6px rgba(0,0,0,0.12))");
  const ttName   = ttG.append("text").attr("x",10).attr("y",18).style("font-size","12px").style("font-weight","bold").style("fill","#111");
  const ttRegion = ttG.append("text").attr("x",10).attr("y",32).style("font-size","10px").style("fill","#888");
  const ttVal    = ttG.append("text").attr("x",10).attr("y",48).style("font-size","11px").style("fill","#333");

  function hideTooltip() { ttG.style("display","none"); }

  // Overlay invisible per bar
  data.forEach(d => {
    mainG.append("rect")
      .attr("x", xScale(d.entity))
      .attr("y", 0)
      .attr("width", barW)
      .attr("height", innerH)
      .attr("fill","transparent")
      .on("mousemove", function(event) {
        ttName.text(d.entity);
        ttRegion.text(d.region);
        ttVal.text(d3.format(".2f")(d.val) + " mg/PCU");
        const tw = Math.max(ttName.node().getComputedTextLength() + 20, 180);
        const th = 58;
        ttBg.attr("width",tw).attr("height",th);
        ttG.style("display",null);
        const [sx,sy] = d3.pointer(event, svg.node());
        const tx = sx + tw + 10 > W ? sx - tw - 8 : sx + 10;
        const ty = Math.max(0, sy - 30);
        ttG.attr("transform",`translate(${tx},${ty})`);
      })
      .on("mouseleave", hideTooltip);
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",margin.left).attr("y",H-28)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",margin.left+80).attr("y",H-28)
    .style("font-size","10.5px").style("fill","#333")
    .text("Mulchandani et al. (2023) – processed by Our World in Data");
  svg.append("text").attr("x",margin.left).attr("y",H-14)
    .style("font-size","9.5px").style("fill","#555")
    .text("Note: Several small island states have been excluded as they are large anomalous outliers in the global dataset.");
  svg.append("text").attr("x",W-10).attr("y",H-14)
    .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
    .text("OurWorldInData.org/antibiotics | CC BY");

  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("antibiotic-use-livestock-marimekko.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["antibiotic-use-livestock-marimekko.csv", {url: new URL("./files/ab314c3164ac2b1b223d43500846820601a37b03a71451f05bbf41de5a9f48ac4a518964f1d5858a9e83be3d8d3b17911f2fc164c85e73193ad40f54c56fd72e.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
