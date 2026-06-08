function _1(md){return(
md`# Population of cities, towns and rural areas`
)}

function _2(rawData,d3)
{
  const REGIONS = ["Asia", "Africa", "Europe", "North America", "South America", "Oceania"];
  const COLS = {
    cities: "Cities",
    towns:  "Towns & suburbs",
    rural:  "Rural areas"
  };
  const COLORS = { cities: "#5ec4c4", towns: "#3d8b8b", rural: "#e8a0a8" };
  const LABELS = { cities: "Cities", towns: "Towns & suburbs", rural: "Rural areas" };

  // ── Layout ────────────────────────────────────────────────────────────────
  const COLS_GRID = 3, ROWS_GRID = 2;
  const CW = 280, CH = 200;
  const cm = { top: 30, right: 20, bottom: 30, left: 55 };
  const iW = CW - cm.left - cm.right;
  const iH = CH - cm.top - cm.bottom;
  const PAD_X = 40, PAD_Y = 20;
  const W = COLS_GRID * CW + (COLS_GRID - 1) * PAD_X + 60;
  const H_CHARTS = ROWS_GRID * CH + (ROWS_GRID - 1) * PAD_Y;
  const H_HEADER = 110;
  const H_FOOTER = 70;
  const H = H_HEADER + H_CHARTS + H_FOOTER;

  // ── Data prep ─────────────────────────────────────────────────────────────
  const byRegion = {};
  REGIONS.forEach(r => {
    byRegion[r] = rawData
      .filter(d => d.Entity === r)
      .map(d => ({
        year:   +d.Year,
        cities: +d[COLS.cities] || 0,
        towns:  +d[COLS.towns]  || 0,
        rural:  +d[COLS.rural]  || 0
      }))
      .sort((a, b) => a.year - b.year);
  });

  const allYears = [...new Set(rawData.map(d => +d.Year))].sort((a,b) => a-b);

  // ── Container ─────────────────────────────────────────────────────────────
  const container = d3.create("div").style("font-family","sans-serif").style("user-select","none");

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", W).attr("height", H)
    .style("background","#fff");

  // ── Header ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x", 10).attr("y", 22)
    .style("font-size","16px").style("font-weight","bold").style("fill","#111")
    .text("Population of cities, towns and rural areas");
  svg.append("text").attr("x", 10).attr("y", 38)
    .style("font-size","10.5px").style("fill","#555")
    .text("Number of people living in cities, towns and suburbs, and rural areas.");

  // ── Leyenda ───────────────────────────────────────────────────────────────
  const legendItems = [
    { key: "cities", label: "Cities" },
    { key: "towns",  label: "Towns & suburbs" },
    { key: "rural",  label: "Rural areas" }
  ];
  let lx = 10;
  legendItems.forEach(item => {
    svg.append("rect").attr("x", lx).attr("y", 50).attr("width", 14).attr("height", 14)
      .attr("fill", COLORS[item.key]).attr("rx", 2);
    svg.append("text").attr("x", lx + 18).attr("y", 61)
      .style("font-size","11px").style("fill","#333").text(item.label);
    lx += item.label.length * 7 + 36;
  });

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const fmt = v => {
    if (v >= 1e9) return d3.format(".2f")(v/1e9) + " billion";
    if (v >= 1e6) return d3.format(".2f")(v/1e6) + " million";
    return d3.format(",.0f")(v);
  };
  const fmtShort = v => {
    if (v >= 1e9) return d3.format(".1f")(v/1e9) + "B";
    if (v >= 1e6) return d3.format(".0f")(v/1e6) + "M";
    return d3.format(",.0f")(v);
  };

  const ttG = svg.append("g").style("display","none").style("pointer-events","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 8px rgba(0,0,0,0.15))");
  const ttYear = ttG.append("text").attr("x",12).attr("y",20)
    .style("font-size","13px").style("font-weight","bold").style("fill","#111");
  const ttSub = ttG.append("text").attr("x",12).attr("y",35)
    .style("font-size","10px").style("fill","#888");

  function showTooltip(year, data, mx, my) {
    ttYear.text(year);
    ttSub.text("in people");
    ttG.selectAll(".ttrow").remove();
    const rows = [
      { label: "Rural areas",     val: data.rural,  color: COLORS.rural,  bold: false },
      { label: "Towns & suburbs", val: data.towns,  color: COLORS.towns,  bold: false },
      { label: "Cities",          val: data.cities, color: COLORS.cities, bold: true  },
      { label: "Total",           val: data.cities + data.towns + data.rural, color: "#555", bold: false }
    ];
    rows.forEach((row, i) => {
      const g = ttG.append("g").attr("class","ttrow");
      if (row.label !== "Total") {
        g.append("rect").attr("x",12).attr("y",44+i*20).attr("width",12).attr("height",12)
          .attr("fill",row.color).attr("rx",2);
      }
      g.append("text").attr("x", row.label==="Total" ? 12 : 30).attr("y",54+i*20)
        .style("font-size","11px").style("fill","#333")
        .style("font-weight", row.bold ? "bold" : "normal")
        .text(row.label);
      g.append("text").attr("x",230).attr("y",54+i*20)
        .style("font-size","11px").style("fill","#333").style("text-anchor","end")
        .style("font-weight", row.bold ? "bold" : "normal")
        .text(fmt(row.val));
    });
    const ttH = 44 + rows.length * 20 + 8;
    const ttW = 240;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx = mx + ttW + 10 > W ? mx - ttW - 8 : mx + 12;
    const ty = Math.max(0, Math.min(my - 20, H - ttH - 10));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }
  function hideTooltip() { ttG.style("display","none"); }

  // ── Draw small multiples ──────────────────────────────────────────────────
  const chartsG = svg.append("g").attr("transform", `translate(0, ${H_HEADER})`);

  REGIONS.forEach((region, idx) => {
    const col = idx % COLS_GRID;
    const row = Math.floor(idx / COLS_GRID);
    const ox = col * (CW + PAD_X) + 10;
    const oy = row * (CH + PAD_Y);
    const g = chartsG.append("g").attr("transform", `translate(${ox},${oy})`);
    const pts = byRegion[region];
    if (!pts.length) return;

    const xScale = d3.scaleLinear().domain(d3.extent(pts, d => d.year)).range([cm.left, cm.left + iW]);
    const yMax = d3.max(pts, d => d.cities + d.towns + d.rural);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([cm.top + iH, cm.top]);

    // Gridlines y etiquetas Y
    const yTicks = yScale.ticks(4);
    yTicks.forEach(v => {
      g.append("line")
        .attr("x1", cm.left).attr("x2", cm.left + iW)
        .attr("y1", yScale(v)).attr("y2", yScale(v))
        .attr("stroke", v===0 ? "#bbb" : "#e8e8e8")
        .attr("stroke-dasharray", v===0 ? "0" : "3,3").attr("stroke-width",1);
      g.append("text").attr("x", cm.left - 5).attr("y", yScale(v)).attr("dy","0.35em")
        .style("font-size","9px").style("fill","#888").style("text-anchor","end")
        .text(fmtShort(v));
    });

    // Eje X
    pts.filter(p => p.year % 20 === 0 || p.year === pts[0].year || p.year === pts[pts.length-1].year)
      .forEach(p => {
        g.append("text").attr("x", xScale(p.year)).attr("y", cm.top + iH + 14)
          .style("font-size","9px").style("fill","#888").style("text-anchor","middle").text(p.year);
      });

    // Área apilada: cities (bottom), towns (middle), rural (top)
    const areaBase   = d3.area().x(d => xScale(d.year)).y0(d => yScale(0))                               .y1(d => yScale(d.cities)).curve(d3.curveMonotoneX);
    const areaTowns  = d3.area().x(d => xScale(d.year)).y0(d => yScale(d.cities))                         .y1(d => yScale(d.cities + d.towns)).curve(d3.curveMonotoneX);
    const areaRural  = d3.area().x(d => xScale(d.year)).y0(d => yScale(d.cities + d.towns))               .y1(d => yScale(d.cities + d.towns + d.rural)).curve(d3.curveMonotoneX);

    g.append("path").datum(pts).attr("fill", COLORS.cities).attr("opacity",0.85).attr("d", areaBase);
    g.append("path").datum(pts).attr("fill", COLORS.towns) .attr("opacity",0.85).attr("d", areaTowns);
    g.append("path").datum(pts).attr("fill", COLORS.rural) .attr("opacity",0.85).attr("d", areaRural);

    // Título región
    g.append("text").attr("x", cm.left).attr("y", cm.top - 10)
      .style("font-size","11px").style("font-weight","bold").style("fill","#222").text(region);

    // Línea base
    g.append("line")
      .attr("x1", cm.left).attr("x2", cm.left + iW)
      .attr("y1", cm.top + iH).attr("y2", cm.top + iH)
      .attr("stroke","#bbb").attr("stroke-width",1);

    // Hover overlay
    const hoverLine = g.append("line")
      .attr("y1", cm.top).attr("y2", cm.top + iH)
      .attr("stroke","#666").attr("stroke-width",1).attr("stroke-dasharray","3,2")
      .style("display","none");

    g.append("rect")
      .attr("x", cm.left).attr("y", cm.top)
      .attr("width", iW).attr("height", iH)
      .attr("fill","transparent")
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event);
        const yr = Math.round(xScale.invert(mx));
        const closest = pts.reduce((a,b) => Math.abs(a.year-yr)<Math.abs(b.year-yr)?a:b);
        hoverLine.attr("x1",xScale(closest.year)).attr("x2",xScale(closest.year)).style("display",null);
        const [sx, sy] = d3.pointer(event, svg.node());
        showTooltip(closest.year, closest, sx, sy);
      })
      .on("mouseleave", () => { hoverLine.style("display","none"); hideTooltip(); });
  });

  // ── Slider (decorativo, no interactivo en esta gráfica estática) ──────────
  const sliderY = H_HEADER + H_CHARTS + 20;
  const sliderX0 = 90, sliderX1 = W - 60;

  const playBtn = svg.append("text").attr("x",24).attr("y",sliderY+5)
    .style("font-size","18px").style("cursor","pointer").style("fill","#555").text("▶");

  svg.append("text").attr("x",sliderX0).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(allYears[0]);
  svg.append("text").attr("x",sliderX1).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(allYears[allYears.length-1]);
  svg.append("line")
    .attr("x1",sliderX0).attr("x2",sliderX1).attr("y1",sliderY).attr("y2",sliderY)
    .attr("stroke","#ccc").attr("stroke-width",4).attr("stroke-linecap","round");
  svg.append("circle").attr("cx",sliderX0).attr("cy",sliderY).attr("r",9).attr("fill","#555");

  // ── Footer ────────────────────────────────────────────────────────────────
  const fy = H_HEADER + H_CHARTS + 46;
  svg.append("text").attr("x",10).attr("y",fy)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",88).attr("y",fy)
    .style("font-size","10.5px").style("fill","#333")
    .text("European Commission, Joint Research Centre (JRC) (2025) – with major processing by Our World in Data");
  svg.append("text").attr("x",10).attr("y",fy+14)
    .style("font-size","9.5px").style("fill","#555")
    .text("Note: Settlements are classified by population density and size, using harmonized definitions across countries (Degree of Urbanization Framework).");
  svg.append("text").attr("x",W-10).attr("y",fy+28)
    .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
    .text("OurWorldInData.org/urbanization | CC BY");

  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("population-of-cities-towns-and-villages.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["population-of-cities-towns-and-villages.csv", {url: new URL("./files/71406cb58de5d652fa3072828fce15836b0cc89a86a8fe57219e37d24c6a43ea783ac598fa6bf5ad1b336fb9cabd3f720111c0e8e7953ea95b0d9ac99cdec103.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
