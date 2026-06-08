function _1(md){return(
md`# Age of mothers at childbirth by mother's birth year`
)}

function _2(d3,rawData)
{
  const W = 900, H = 720;
  const COUNTRIES = ["Spain", "United Kingdom", "Japan", "United States"];

  // Años de nacimiento de madres (columnas del CSV), de más reciente a más antiguo
  const COHORT_YEARS = [2010,2005,2000,1995,1990,1985,1980,1975,1970,1965,1960,1955,1950,1945,1940,1935,1930,1925];

  // Degradado verde agua → azul marino (2010=verde claro, 1925=negro)
  const cohortColor = (y) => {
    const t = (y - 1925) / (2010 - 1925); // 0=antiguo, 1=reciente
    return d3.interpolateRgbBasis([
      "#1a1a2e", "#16213e", "#0f3460", "#1a5276",
      "#1a7a8a", "#1a9e8e", "#5abf9a", "#a8dbc0", "#d4eed8"
    ])(t);
  };

  // ── Datos ─────────────────────────────────────────────────────────────────
  // Map<country, Map<cohortYear, [{age, value}]>>
  const dataMap = new Map();
  COUNTRIES.forEach(c => {
    const cm = new Map();
    COHORT_YEARS.forEach(cy => cm.set(cy, []));
    rawData
      .filter(d => d.Entity === c)
      .forEach(d => {
        const age = +d.Year;
        COHORT_YEARS.forEach(cy => {
          const v = d[String(cy)];
          if (v != null && v !== "") cm.get(cy).push({ age, value: +v });
        });
      });
    // Ordenar por edad
    COHORT_YEARS.forEach(cy => cm.get(cy).sort((a,b) => a.age - b.age));
    dataMap.set(c, cm);
  });

  const container = d3.create("div").style("font-family","sans-serif").style("user-select","none");

  const svg = container.append("svg")
    .attr("viewBox",`0 0 ${W} ${H}`)
    .attr("width",W).attr("height",H)
    .style("background","#fff");

  // Título
  svg.append("text").attr("x",20).attr("y",22)
    .style("font-size","17px").style("font-weight","bold").style("fill","#111")
    .text("Age of mothers at childbirth by mother's birth year");

  svg.append("foreignObject").attr("x",20).attr("y",28)
    .attr("width",W-30).attr("height",28)
    .append("xhtml:div").style("font-size","11px").style("color","#555")
    .text("Each line denotes women born in a particular year, and shows their timing of childbearing. The vertical axis shows the age-specific fertility rate per woman.");

  // ── Leyenda global ────────────────────────────────────────────────────────
  const legG = svg.append("g").attr("transform","translate(20,58)");
  const legCols = 10, legSpW = 80;
  COHORT_YEARS.forEach((cy, i) => {
    const col = i % legCols, row = Math.floor(i / legCols);
    const lx = col * legSpW, ly = row * 18;
    legG.append("rect").attr("x",lx).attr("y",ly+2).attr("width",14).attr("height",10)
      .attr("fill",cohortColor(cy)).attr("rx",2);
    legG.append("text").attr("x",lx+18).attr("y",ly+11)
      .style("font-size","11px").style("fill","#333").text(cy);
  });

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 8px rgba(0,0,0,0.15))");
  const ttTitle = ttG.append("text").attr("x",14).attr("y",22)
    .style("font-size","14px").style("font-weight","bold").style("fill","#111");
  const ttSub = ttG.append("text").attr("x",14).attr("y",38)
    .style("font-size","11px").style("fill","#888")
    .text("in births per woman at a specific age");

  function showTooltip(age, items, mx, my) {
    ttTitle.text(`${age} (Age of women)`);
    ttG.selectAll(".ttrow").remove();
    items.slice(0,10).forEach((item, i) => {
      ttG.append("rect").attr("class","ttrow")
        .attr("x",14).attr("y",48+i*20).attr("width",12).attr("height",12)
        .attr("fill",cohortColor(item.cohort)).attr("rx",2);
      ttG.append("text").attr("class","ttrow")
        .attr("x",30).attr("y",58+i*20)
        .style("font-size","11px").style("fill","#333").text(item.cohort);
      ttG.append("text").attr("class","ttrow")
        .attr("x",160).attr("y",58+i*20)
        .style("font-size","11px").style("font-weight","bold").style("fill","#111")
        .style("text-anchor","end").text(d3.format(".2f")(item.value));
    });
    const ttH = 48 + Math.min(items.length,10)*20 + 8;
    const ttW = 175;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 12;
    const ty = Math.max(0, Math.min(my - 30, H - ttH - 10));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }
  function hideTooltip() { ttG.style("display","none"); }

  // ── Paneles 2×2 ───────────────────────────────────────────────────────────
  const legH = Math.ceil(COHORT_YEARS.length / 10) * 18 + 8;
  const topOffset = 58 + legH;
  const cols = 2, rows2 = 2;
  const panelW = (W - 40) / cols;
  const panelH = (H - topOffset - 60) / rows2;
  const pm = { top: 30, right: 10, bottom: 45, left: 42 };
  const innerW2 = panelW - pm.left - pm.right;
  const innerH2 = panelH - pm.top - pm.bottom;

  const xDomain = [12, 55];
  const yMax = 0.32;

  const xScale = d3.scaleLinear().domain(xDomain).range([0, innerW2]);
  const yScale = d3.scaleLinear().domain([0, yMax]).range([innerH2, 0]);

  COUNTRIES.forEach((country, ci) => {
    const col = ci % cols, row2 = Math.floor(ci / cols);
    const tx = col * panelW + 20;
    const ty = topOffset + row2 * panelH;

    const g = svg.append("g").attr("transform",`translate(${tx},${ty})`);

    // Título panel
    g.append("text").attr("x", pm.left).attr("y", 18)
      .style("font-size","13px").style("font-weight","bold").style("fill","#333")
      .text(country);

    const pg = g.append("g").attr("transform",`translate(${pm.left},${pm.top})`);

    // Gridlines Y
    [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3].forEach(v => {
      pg.append("line")
        .attr("x1",0).attr("x2",innerW2).attr("y1",yScale(v)).attr("y2",yScale(v))
        .attr("stroke", v===0?"#bbb":"#e8e8e8")
        .attr("stroke-dasharray", v===0?"0":"3,3").attr("stroke-width",1);
      pg.append("text").attr("x",-5).attr("y",yScale(v)).attr("dy","0.35em")
        .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
        .text(v===0?"0":v);
    });

    // Eje X
    [20,30,40,50].forEach(age => {
      pg.append("text").attr("x",xScale(age)).attr("y",innerH2+16)
        .style("font-size","10px").style("fill","#aaa").style("text-anchor","middle").text(age);
      pg.append("line").attr("x1",xScale(age)).attr("x2",xScale(age))
        .attr("y1",innerH2).attr("y2",innerH2+4).attr("stroke","#ccc");
    });
    pg.append("text").attr("x",innerW2/2).attr("y",innerH2+32)
      .style("font-size","10px").style("font-weight","bold").style("fill","#888")
      .style("text-anchor","middle").text("Age of women");

    // Línea baseline
    pg.append("line").attr("x1",0).attr("x2",innerW2)
      .attr("y1",innerH2).attr("y2",innerH2).attr("stroke","#bbb").attr("stroke-width",1);

    const cm = dataMap.get(country);
    const lineGen = d3.line()
      .x(d => xScale(d.age))
      .y(d => yScale(Math.min(d.value, yMax)))
      .curve(d3.curveBasis);

    // Dibujar líneas (más antiguas primero → encima las recientes)
    [...COHORT_YEARS].reverse().forEach(cy => {
      const pts = cm.get(cy).filter(p => p.age >= xDomain[0] && p.age <= xDomain[1]);
      if (!pts.length) return;
      pg.append("path")
        .datum(pts)
        .attr("fill","none")
        .attr("stroke", cohortColor(cy))
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.85)
        .attr("d", lineGen);
    });

    // Zona interactiva
    pg.append("rect").attr("width",innerW2).attr("height",innerH2)
      .attr("fill","transparent")
      .on("mousemove", function(event) {
        const [mx2] = d3.pointer(event);
        const age = Math.round(xScale.invert(mx2));
        // Para cada cohorte, interpolar el valor en esa edad
        const items = COHORT_YEARS.map(cy => {
          const pts = cm.get(cy);
          const exact = pts.find(p => p.age === age);
          if (exact) return { cohort: cy, value: exact.value };
          // Interpolar
          const lo = pts.filter(p => p.age <= age).pop();
          const hi = pts.find(p => p.age >= age);
          if (!lo || !hi || lo.age === hi.age) return null;
          const t = (age - lo.age) / (hi.age - lo.age);
          return { cohort: cy, value: lo.value + t * (hi.value - lo.value) };
        }).filter(d => d && d.value > 0.001)
          .sort((a,b) => b.value - a.value);

        const [sx,sy] = d3.pointer(event, svg.node());
        showTooltip(age, items, sx, sy);
      })
      .on("mouseleave", hideTooltip);
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",20).attr("y",H-18)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",100).attr("y",H-18)
    .style("font-size","10.5px").style("fill","#333")
    .text("Human Fertility Database (2025) – processed by Our World in Data");
  svg.append("text").attr("x",20).attr("y",H-5)
    .style("font-size","10px").style("fill","#aaa")
    .text("OurWorldInData.org/fertility-rate | CC BY");

  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("cohort-fertility-rate-by-age.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["cohort-fertility-rate-by-age.csv", {url: new URL("./files/72da5be78ea8bf640d1e09e908811cf46846102868a6cc2736a273b8a794c4f33d9b3a36c34d6965fd1635fe3019b5f115e9feb8780e4c60975a7b3a92bc305b.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["d3","rawData"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
