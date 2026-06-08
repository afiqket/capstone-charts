function _1(md){return(
md`# Cumulative fertility rate by women's birth year`
)}

function _2(d3,rawData)
{
  const W = 900, H = 580;
  const margin = { top: 65, right: 80, bottom: 65, left: 55 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const country = "United States";

  const COHORT_YEARS = [1925,1930,1935,1940,1945,1950,1955,1960,1965,1970,1975,1980,1985,1990,1995,2000,2005,2010];

  // Degradado: antiguo (negro/azul oscuro) → reciente (verde turquesa claro)
  const cohortColor = (y) => {
    const t = (y - 1925) / (2010 - 1925); // 0=antiguo→negro, 1=reciente→verde claro
    return d3.interpolateRgbBasis([
      "#111111","#1a1a3e","#2a1a6e","#3b2a8e","#4a3aaa",
      "#3a6aaa","#2a8aaa","#1aaabb","#3abbc0","#7adcc8","#b8f0d8"
    ])(t);
  };

  // ── Datos ─────────────────────────────────────────────────────────────────
  const rows = rawData.filter(d => d.Entity === country)
    .map(d => {
      const r = { age: +d.Year };
      COHORT_YEARS.forEach(cy => {
        const v = d[String(cy)];
        r[cy] = v != null && v !== "" ? +v : null;
      });
      return r;
    })
    .sort((a,b) => a.age - b.age);

  const ages = rows.map(r => r.age);

  // Por cohorte: [{age, value}]
  const seriesData = COHORT_YEARS.map(cy => ({
    cohort: cy,
    color: cohortColor(cy),
    points: rows
      .map(r => ({ age: r.age, value: r[cy] }))
      .filter(p => p.value != null)
  }));

  const container = d3.create("div").style("font-family","sans-serif").style("user-select","none");

  const svg = container.append("svg")
    .attr("viewBox",`0 0 ${W} ${H}`)
    .attr("width",W).attr("height",H)
    .style("background","#fff");

  svg.append("text").attr("x", margin.left).attr("y", 22)
    .style("font-size","16px").style("font-weight","bold").style("fill","#111")
    .text(`Cumulative fertility rate by women's birth year, ${country}`);

  svg.append("text").attr("x", margin.left).attr("y", 38)
    .style("font-size","11px").style("fill","#555")
    .text("Each line shows, for women born in a particular year, the average number of children they have had by a specific age.");

  const mainG = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  // ── Escalas ───────────────────────────────────────────────────────────────
  const allVals = seriesData.flatMap(s => s.points.map(p => p.value));
  const yMax = Math.ceil((d3.max(allVals)||3.5) / 0.5) * 0.5;

  const xScale = d3.scaleLinear().domain([12, 55]).range([0, innerW]);
  const yScale = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);

  // ── Gridlines ─────────────────────────────────────────────────────────────
  d3.range(0, yMax + 0.01, 0.5).forEach(v => {
    mainG.append("line")
      .attr("x1",0).attr("x2",innerW).attr("y1",yScale(v)).attr("y2",yScale(v))
      .attr("stroke", v===0?"#aaa":"#e8e8e8")
      .attr("stroke-dasharray",v===0?"0":"4,3").attr("stroke-width",1);
    mainG.append("text")
      .attr("x",-8).attr("y",yScale(v)).attr("dy","0.35em")
      .style("font-size","11px").style("fill","#888").style("text-anchor","end").text(v);
  });

  // Eje X
  [20,30,40,50].forEach(age => {
    mainG.append("text")
      .attr("x",xScale(age)).attr("y",innerH+18)
      .style("font-size","11px").style("fill","#888").style("text-anchor","middle").text(age);
  });
  mainG.append("text")
    .attr("x",xScale(12)).attr("y",innerH+18)
    .style("font-size","11px").style("fill","#888").style("text-anchor","middle").text(12);
  mainG.append("text")
    .attr("x",xScale(55)).attr("y",innerH+18)
    .style("font-size","11px").style("fill","#888").style("text-anchor","middle").text(55);

  mainG.append("text")
    .attr("x",innerW/2).attr("y",innerH+38)
    .style("font-size","12px").style("font-weight","bold").style("fill","#555")
    .style("text-anchor","middle").text("Age of women");

  mainG.append("line").attr("x1",0).attr("x2",innerW)
    .attr("y1",innerH).attr("y2",innerH).attr("stroke","#bbb").attr("stroke-width",1);

  // ── Líneas ────────────────────────────────────────────────────────────────
  const lineGen = d3.line()
    .x(d => xScale(d.age))
    .y(d => yScale(d.value))
    .curve(d3.curveBasis);

  // Antiguas primero (encima las recientes)
  [...seriesData].reverse().forEach(s => {
    if (!s.points.length) return;
    mainG.append("path")
      .datum(s.points)
      .attr("fill","none")
      .attr("stroke", s.color)
      .attr("stroke-width", 1.8)
      .attr("opacity", 0.9)
      .attr("d", lineGen);
  });

  // ── Etiquetas laterales al final de cada línea ─────────────────────────────
  // Ordenar por valor final para separar etiquetas
  const labeled = seriesData
    .map(s => {
      const last = s.points[s.points.length - 1];
      return last ? { cohort: s.cohort, color: s.color, lastAge: last.age, lastVal: last.value } : null;
    })
    .filter(Boolean)
    .sort((a,b) => b.lastVal - a.lastVal);

  // Evitar solapamiento: separar etiquetas al menos 13px
  let lastY = -Infinity;
  labeled.forEach(d => {
    let y = yScale(d.lastVal);
    if (y - lastY < 13) y = lastY + 13;
    lastY = y;
    mainG.append("line")
      .attr("x1", xScale(d.lastAge) + 2).attr("x2", xScale(d.lastAge) + 10)
      .attr("y1", yScale(d.lastVal)).attr("y2", y)
      .attr("stroke", d.color).attr("stroke-width", 0.8);
    mainG.append("text")
      .attr("x", xScale(d.lastAge) + 14).attr("y", y).attr("dy","0.35em")
      .style("font-size","10.5px").style("font-weight","bold")
      .style("fill", d.color).text(d.cohort);
  });

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 8px rgba(0,0,0,0.15))");
  const ttTitle = ttG.append("text").attr("x",14).attr("y",22)
    .style("font-size","14px").style("font-weight","bold").style("fill","#111");
  ttG.append("text").attr("x",14).attr("y",38)
    .style("font-size","10px").style("fill","#888").text("avg. children by this age");

  const hoverLine = mainG.append("line").attr("y1",0).attr("y2",innerH)
    .attr("stroke","#999").attr("stroke-width",1).style("display","none");

  function showTooltip(age, items, mx, my) {
    ttTitle.text(`Age ${age}`);
    ttG.selectAll(".ttrow").remove();
    items.forEach((d, i) => {
      ttG.append("rect").attr("class","ttrow")
        .attr("x",14).attr("y",48+i*18).attr("width",12).attr("height",10)
        .attr("fill",d.color).attr("rx",2);
      ttG.append("text").attr("class","ttrow")
        .attr("x",30).attr("y",57+i*18)
        .style("font-size","11px").style("fill","#333").text(d.cohort);
      ttG.append("text").attr("class","ttrow")
        .attr("x",170).attr("y",57+i*18)
        .style("font-size","11px").style("font-weight","bold").style("fill","#111")
        .style("text-anchor","end").text(d3.format(".2f")(d.value));
    });
    const ttH = 48 + items.length*18 + 8;
    const ttW = 185;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 12;
    const ty = Math.max(0, Math.min(my - 30, H - ttH - 10));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }
  function hideTooltip() { ttG.style("display","none"); }

  mainG.append("rect").attr("width",innerW).attr("height",innerH)
    .attr("fill","transparent")
    .on("mousemove", function(event) {
      const [mx2] = d3.pointer(event);
      const age = Math.round(xScale.invert(mx2));
      hoverLine.attr("x1",xScale(age)).attr("x2",xScale(age)).style("display",null);

      const items = seriesData.map(s => {
        const exact = s.points.find(p => p.age === age);
        if (exact) return { cohort: s.cohort, color: s.color, value: exact.value };
        const lo = s.points.filter(p => p.age <= age).pop();
        const hi = s.points.find(p => p.age > age);
        if (!lo || !hi) return null;
        const t = (age - lo.age) / (hi.age - lo.age);
        return { cohort: s.cohort, color: s.color, value: lo.value + t*(hi.value-lo.value) };
      }).filter(d => d && d.value != null)
        .sort((a,b) => b.value - a.value);

      const [sx,sy] = d3.pointer(event, svg.node());
      showTooltip(age, items, sx, sy);
    })
    .on("mouseleave", () => { hoverLine.style("display","none"); hideTooltip(); });

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",margin.left).attr("y",H-18)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",margin.left+80).attr("y",H-18)
    .style("font-size","10.5px").style("fill","#333")
    .text("Human Fertility Database (2025) – processed by Our World in Data");
  svg.append("text").attr("x",margin.left).attr("y",H-5)
    .style("font-size","10px").style("fill","#aaa")
    .text("OurWorldInData.org/fertility-rate | CC BY");

  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("cumulative-cohort-fertility-rate-by-age.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["cumulative-cohort-fertility-rate-by-age.csv", {url: new URL("./files/68766b44c41839db42c023103a436f5617627173036e3543cdd9f29c64e540204cf4b1181458b1b37dd509574b0a0825180ec18cd26f9b6ab9e105867d3c9923.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["d3","rawData"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
