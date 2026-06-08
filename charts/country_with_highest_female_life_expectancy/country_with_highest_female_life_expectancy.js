function _1(md){return(
md`# Country with highest female life expectancy`
)}

function _2(rawData,d3)
{
  const W = 900, H = 580;
  const margin = { top: 70, right: 180, bottom: 70, left: 70 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  // Colores por país (igual que OWID)
  const COUNTRY_COLORS = {
    "Australia":    "#9B59B6",
    "Denmark":      "#1A9E77",
    "Hong Kong":    "#4C6FAD",
    "Iceland":      "#E8824A",
    "Japan":        "#45C3D1",
    "Netherlands":  "#8B2020",
    "Norway":       "#3A7A3A",
    "Sweden":       "#8B3A7A",
  };
  const DEFAULT_COLOR = "#aaa";

  const leCol      = "Life expectancy";
  const countryCol = "Country with yearly maximum life expectancy - Sex: female";

  // ── Datos ─────────────────────────────────────────────────────────────────
  const points = rawData
    .filter(d => d[leCol] != null && d[leCol] !== "")
    .map(d => ({
      year:    +d.Year,
      value:   +d[leCol],
      country: d[countryCol] || ""
    }))
    .sort((a,b) => a.year - b.year);

  // Países únicos presentes
  const countries = [...new Set(points.map(d => d.country))].sort();

  // ── Contenedor ────────────────────────────────────────────────────────────
  const container = d3.create("div").style("font-family","sans-serif").style("user-select","none");

  const svg = container.append("svg")
    .attr("viewBox",`0 0 ${W} ${H}`)
    .attr("width",W).attr("height",H)
    .style("background","#fff");

  svg.append("text").attr("x", margin.left).attr("y", 22)
    .style("font-size","17px").style("font-weight","bold").style("fill","#111")
    .text("Country with highest female life expectancy");

  svg.append("text").attr("x", margin.left).attr("y", 38)
    .style("font-size","11px").style("fill","#555")
    .text("The country with the highest female life expectancy at birth, in each year.");

  // Etiqueta eje Y
  svg.append("text").attr("x", margin.left).attr("y", 58)
    .style("font-size","11px").style("font-weight","bold").style("fill","#333")
    .text("Life expectancy");

  const mainG = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleLinear()
    .domain(d3.extent(points, d => d.year))
    .range([0, innerW]);
  const yScale = d3.scaleLinear()
    .domain([d3.min(points, d => d.value) - 2, d3.max(points, d => d.value) + 1])
    .range([innerH, 0]);

  // ── Gridlines ─────────────────────────────────────────────────────────────
  const yTicks = [50, 60, 70, 80];
  yTicks.forEach(v => {
    mainG.append("line")
      .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
      .attr("stroke","#e0e0e0").attr("stroke-dasharray","4,3").attr("stroke-width",1);
    mainG.append("text")
      .attr("x",-8).attr("y",yScale(v)).attr("dy","0.35em")
      .style("font-size","11px").style("fill","#888").style("text-anchor","end")
      .text(`${v} years`);
  });

  const xTicks = [1840,1860,1880,1900,1920,1940,1960,1980,2000,2020];
  xTicks.forEach(y => {
    mainG.append("line")
      .attr("x1",xScale(y)).attr("x2",xScale(y)).attr("y1",0).attr("y2",innerH)
      .attr("stroke","#e0e0e0").attr("stroke-dasharray","4,3").attr("stroke-width",1);
    mainG.append("text")
      .attr("x",xScale(y)).attr("y",innerH+18)
      .style("font-size","11px").style("fill","#888").style("text-anchor","middle").text(y);
  });

  // Etiqueta eje X
  svg.append("text")
    .attr("x", margin.left + innerW/2).attr("y", H - margin.bottom + 45)
    .style("font-size","12px").style("font-weight","bold").style("fill","#555")
    .style("text-anchor","middle").text("Year");

  // ── Estado de hover ───────────────────────────────────────────────────────
  let hoveredCountry = null;

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 8px rgba(0,0,0,0.15))");
  const ttTitle = ttG.append("text").attr("x",14).attr("y",22)
    .style("font-size","14px").style("font-weight","bold").style("fill","#111");
  const ttYear2  = ttG.append("text").attr("x",14).attr("y",38)
    .style("font-size","12px").style("fill","#888");

  const ttDiv1 = ttG.append("text").attr("x",14).attr("y",58)
    .style("font-size","11px").style("font-weight","bold").style("fill","#555")
    .text("Life expectancy");
  const ttVal = ttG.append("text").attr("x",14).attr("y",76)
    .style("font-size","16px").style("font-weight","bold").style("fill","#111");

  ttG.append("line").attr("x1",14).attr("x2",220).attr("y1",90).attr("y2",90)
    .attr("stroke","#eee");

  const ttDiv2 = ttG.append("text").attr("x",14).attr("y",106)
    .style("font-size","11px").style("font-weight","bold").style("fill","#555")
    .text("Country with yearly maximum life expectancy - Sex: female");
  const ttCountry = ttG.append("text").attr("x",14).attr("y",124)
    .style("font-size","14px").style("font-weight","bold").style("fill","#111");

  function showTooltip(pt, mx, my) {
    const color = COUNTRY_COLORS[pt.country] || DEFAULT_COLOR;
    ttTitle.text(`${pt.country} ${pt.year}`).attr("fill", color);
    ttYear2.text(pt.year);
    ttVal.text(`${d3.format(".1f")(pt.value)} years`);
    ttCountry.text(pt.country);
    const ttW = 240, ttH = 140;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 12;
    const ty = Math.max(0, Math.min(my - 40, H - ttH - 10));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }
  function hideTooltip() { ttG.style("display","none"); }

  // ── Puntos ────────────────────────────────────────────────────────────────
  const dots = mainG.selectAll(".dot").data(points).join("circle")
    .attr("class","dot")
    .attr("cx", d => xScale(d.year))
    .attr("cy", d => yScale(d.value))
    .attr("r", 5)
    .attr("fill", d => COUNTRY_COLORS[d.country] || DEFAULT_COLOR)
    .attr("opacity", 0.85)
    .attr("stroke","white").attr("stroke-width",0.5)
    .style("cursor","pointer")
    .on("mouseover", function(event, d) {
      hoveredCountry = d.country;
      dots.attr("opacity", p => p.country === d.country ? 1 : 0.12)
          .attr("fill", p => p.country === d.country ? (COUNTRY_COLORS[p.country]||DEFAULT_COLOR) : "#ccc");
      // Highlight leyenda
      legItems.each(function(c) {
        d3.select(this).select("text").style("font-weight", c === d.country ? "bold" : "normal");
        d3.select(this).select("circle").attr("opacity", c === d.country ? 1 : 0.3);
      });
      const [mx,my] = d3.pointer(event, svg.node());
      showTooltip(d, mx, my);
    })
    .on("mouseout", function() {
      hoveredCountry = null;
      dots.attr("opacity",0.85)
          .attr("fill", d => COUNTRY_COLORS[d.country] || DEFAULT_COLOR);
      legItems.each(function() {
        d3.select(this).select("text").style("font-weight","normal");
        d3.select(this).select("circle").attr("opacity",1);
      });
      hideTooltip();
    });

  // ── Leyenda ───────────────────────────────────────────────────────────────
  const legG = svg.append("g").attr("transform",`translate(${margin.left + innerW + 14}, ${margin.top})`);

  const legItems = legG.selectAll(".legItem").data(countries).join("g")
    .attr("class","legItem")
    .attr("transform", (d,i) => `translate(0,${i * 22})`)
    .style("cursor","pointer")
    .on("mouseover", function(event, c) {
      dots.attr("opacity", d => d.country === c ? 1 : 0.12)
          .attr("fill", d => d.country === c ? (COUNTRY_COLORS[d.country]||DEFAULT_COLOR) : "#ccc");
      legItems.each(function(cc) {
        d3.select(this).select("text").style("font-weight", cc === c ? "bold" : "normal");
        d3.select(this).select("circle").attr("opacity", cc === c ? 1 : 0.3);
      });
    })
    .on("mouseout", function() {
      dots.attr("opacity",0.85).attr("fill", d => COUNTRY_COLORS[d.country]||DEFAULT_COLOR);
      legItems.each(function() {
        d3.select(this).select("text").style("font-weight","normal");
        d3.select(this).select("circle").attr("opacity",1);
      });
    });

  legItems.append("circle")
    .attr("cx",6).attr("cy",6).attr("r",6)
    .attr("fill", d => COUNTRY_COLORS[d] || DEFAULT_COLOR);

  legItems.append("text")
    .attr("x",16).attr("y",10)
    .style("font-size","12px").style("fill","#333")
    .text(d => d);

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",margin.left).attr("y",H-28)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",margin.left+80).attr("y",H-28)
    .style("font-size","10.5px").style("fill","#333")
    .text("Human Mortality Database (2025); UN, World Population Prospects (2024) – processed by Our World in Data");
  svg.append("text").attr("x",margin.left).attr("y",H-15)
    .style("font-size","10px").style("fill","#777")
    .text("Note: Records are only shown for countries in the Human Mortality Database.");
  svg.append("text").attr("x",margin.left).attr("y",H-3)
    .style("font-size","10px").style("fill","#aaa")
    .text("OurWorldInData.org/life-expectancy | CC BY");

  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("maximum-life-expectancy-sex-female.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["maximum-life-expectancy-sex-female.csv", {url: new URL("./files/8253df4e3d97102c046bd1ec5da00def255a8aec6b308b3c7d5f456c81c36689286f8c95c5bae459d2f2dcfe383a1c63e0271ac2ce271e69b896dc4f5450e7a0.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
