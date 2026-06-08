function _1(md){return(
md`# Modal age at death in adults`
)}

function _2(rawData,d3)
{
  const W = 900, H = 680;
  const FEMALE_COLOR = "#C07050";
  const MALE_COLOR   = "#6B3FA0";
  const BAR_COLOR    = "#6b7fad";

  const COUNTRIES = ["Finland", "France", "Japan", "United Kingdom"];

  const allRows = rawData.filter(d => COUNTRIES.includes(d.Entity));
  const years = [...new Set(allRows.map(d => +d.Year))].sort((a,b) => a-b);
  let currentYear = years[years.length - 1];

  // Map<country, Map<year, {f, m}>>
  const dataMap = new Map();
  COUNTRIES.forEach(c => {
    const m = new Map();
    allRows.filter(d => d.Entity === c).forEach(r => {
      m.set(+r.Year, {
        f: r.Females != null && r.Females !== "" ? +r.Females : null,
        m: r.Males   != null && r.Males   !== ""   ? +r.Males   : null
      });
    });
    dataMap.set(c, m);
  });

  let mode = "line";
  let playing = false, timer = null;

  const container = d3.create("div").style("font-family","sans-serif").style("user-select","none");

  const btnRow = container.append("div").style("display","flex").style("gap","6px").style("margin-bottom","6px");
  const mkBtn = (label, active) => btnRow.append("button").text(label)
    .style("padding","4px 14px").style("border","1px solid #ccc").style("border-radius","4px")
    .style("cursor","pointer").style("font-size","13px")
    .style("background", active ? "#3a6fc4" : "#fff")
    .style("color",      active ? "#fff"    : "#333");

  const btnLine = mkBtn("📈 Line", true);
  const btnBar  = mkBtn("📊 Bar",  false);

  const svg = container.append("svg")
    .attr("viewBox",`0 0 ${W} ${H}`)
    .attr("width",W).attr("height",H)
    .style("background","#fff");

  const titleEl = svg.append("text").attr("x", 30).attr("y", 22)
    .style("font-size","17px").style("font-weight","bold").style("fill","#111");

  svg.append("text").attr("x", 30).attr("y", 38)
    .style("font-size","11px").style("fill","#555")
    .text("The most common age at death, among adults in a given year.");

  // Leyenda global (solo en modo line)
  const legG = svg.append("g").attr("id","globalLeg").attr("transform","translate(30,50)");
  [[FEMALE_COLOR,"Females"],[MALE_COLOR,"Males"]].forEach(([col, label], i) => {
    legG.append("circle").attr("cx", i*90+6).attr("cy",6).attr("r",6).attr("fill",col);
    legG.append("text").attr("x", i*90+16).attr("y",10)
      .style("font-size","12px").style("fill","#333").text(label);
  });

  const mainG = svg.append("g").attr("transform","translate(0,70)");

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 6px rgba(0,0,0,0.13))");
  const ttTitle = ttG.append("text").attr("x",12).attr("y",20)
    .style("font-size","13px").style("font-weight","bold").style("fill","#111");
  const ttF = ttG.append("text").attr("x",12).attr("y",38)
    .style("font-size","12px").style("fill",FEMALE_COLOR);
  const ttM = ttG.append("text").attr("x",12).attr("y",54)
    .style("font-size","12px").style("fill",MALE_COLOR);

  function showTooltip(country, year, vals, mx, my) {
    ttTitle.text(`${country}, ${year}`);
    ttF.text(vals.f != null ? `Females: ${d3.format(".1f")(vals.f)} years` : "Females: n/a");
    ttM.text(vals.m != null ? `Males: ${d3.format(".1f")(vals.m)} years` : "Males: n/a");
    const ttW = 200, ttH = 66;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 12;
    const ty = Math.max(0, Math.min(my - 20, H - ttH - 10));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }
  function hideTooltip() { ttG.style("display","none"); }

  // ── RENDER LINE — 2×2 small multiples ─────────────────────────────────────
  function renderLine() {
    mainG.selectAll("*").remove();
    legG.style("display", null);
    titleEl.text("Modal age at death in adults");

    const cols = 2, rows2 = 2;
    const panelW = (W - 60) / cols;
    const panelH = (H - 140) / rows2;
    const pm = { top: 30, right: 20, bottom: 35, left: 58 };
    const innerW2 = panelW - pm.left - pm.right;
    const innerH2 = panelH - pm.top - pm.bottom;

    // Rango Y global para todos los paneles
    const allVals = COUNTRIES.flatMap(c => [...dataMap.get(c).values()].flatMap(v => [v.f, v.m].filter(x => x!=null)));
    const yMin = Math.floor((d3.min(allVals)||70) / 5) * 5;
    const yMax = Math.ceil((d3.max(allVals)||95) / 5) * 5;

    COUNTRIES.forEach((country, ci) => {
      const col = ci % cols, row = Math.floor(ci / cols);
      const tx = col * panelW + 30;
      const ty = row * panelH;
      const g = mainG.append("g").attr("transform",`translate(${tx},${ty})`);

      // Título del panel
      g.append("text").attr("x", pm.left).attr("y", 16)
        .style("font-size","13px").style("font-weight","bold").style("fill","#333")
        .text(country);

      const pg = g.append("g").attr("transform",`translate(${pm.left},${pm.top})`);

      const cm = dataMap.get(country);
      const cYears = [...cm.keys()].sort((a,b)=>a-b);

      const xScale = d3.scaleLinear().domain(d3.extent(cYears)).range([0, innerW2]);
      const yScale = d3.scaleLinear().domain([yMin, yMax]).range([innerH2, 0]);

      // Gridlines
      d3.range(yMin, yMax+1, 5).forEach(v => {
        pg.append("line")
          .attr("x1",0).attr("x2",innerW2).attr("y1",yScale(v)).attr("y2",yScale(v))
          .attr("stroke", v===yMin?"#bbb":"#e8e8e8")
          .attr("stroke-dasharray", v===yMin?"0":"4,3").attr("stroke-width",1);
        pg.append("text").attr("x",-6).attr("y",yScale(v)).attr("dy","0.35em")
          .style("font-size","10px").style("fill","#aaa").style("text-anchor","end")
          .text(`${v} years`);
      });

      // X ticks
      [1970,1980,1990,2000,2010,2022].forEach(y => {
        if (y < cYears[0] || y > cYears[cYears.length-1]) return;
        pg.append("text").attr("x",xScale(y)).attr("y",innerH2+16)
          .style("font-size","10px").style("fill","#aaa").style("text-anchor","middle").text(y);
        pg.append("line").attr("x1",xScale(y)).attr("x2",xScale(y))
          .attr("y1",innerH2).attr("y2",innerH2+4).attr("stroke","#bbb");
      });

      const lineGen = (acc) => d3.line()
        .defined(d => acc(cm.get(d)) != null)
        .x(d => xScale(d))
        .y(d => yScale(acc(cm.get(d))))
        .curve(d3.curveMonotoneX)(cYears);

      pg.append("path").attr("fill","none").attr("stroke",FEMALE_COLOR).attr("stroke-width",1.8)
        .attr("d", lineGen(v => v?.f));
      pg.append("path").attr("fill","none").attr("stroke",MALE_COLOR).attr("stroke-width",1.8)
        .attr("d", lineGen(v => v?.m));

      // Zona interactiva
      pg.append("rect").attr("width",innerW2).attr("height",innerH2)
        .attr("fill","transparent")
        .on("mousemove", function(event) {
          const [mx2] = d3.pointer(event);
          const yr = Math.round(xScale.invert(mx2));
          const closest = cYears.reduce((a,b)=>Math.abs(a-yr)<Math.abs(b-yr)?a:b);
          const [sx,sy] = d3.pointer(event, svg.node());
          showTooltip(country, closest, cm.get(closest)||{}, sx, sy);
        })
        .on("mouseleave", hideTooltip);
    });
  }

  // ── RENDER BAR — dos secciones (Females / Males) ──────────────────────────
  function renderBar() {
    mainG.selectAll("*").remove();
    legG.style("display","none");
    titleEl.text(`Modal age at death in adults, ${currentYear}`);

    const bMargin = { left: 130, right: 120 };
    const bW = W - bMargin.left - bMargin.right;

    const sections = [
      { label: "Females", acc: v => v?.f, countries: [...COUNTRIES] },
      { label: "Males",   acc: v => v?.m, countries: [...COUNTRIES] },
    ];

    const rowH = 44, sectionGap = 40, headerH = 28;
    let yOffset = 0;

    sections.forEach(sec => {
      // Encabezado de sección
      mainG.append("text").attr("x", bMargin.left).attr("y", yOffset + 16)
        .style("font-size","13px").style("font-weight","bold").style("fill","#333")
        .text(sec.label);
      yOffset += headerH;

      // Datos del año seleccionado (o el más cercano con dato)
      const barData = sec.countries.map(c => {
        const cm = dataMap.get(c);
        // Buscar el año más cercano con dato
        const yr = [...cm.keys()].filter(y => cm.get(y)?.[sec.acc === (v=>v?.f) ? "f" : "m"] != null)
          .reduce((a,b) => Math.abs(a-currentYear)<Math.abs(b-currentYear)?a:b, null);
        const val = yr != null ? sec.acc(cm.get(yr)) : null;
        return { country: c, value: val, dataYear: yr };
      }).filter(d => d.value != null).sort((a,b) => b.value - a.value);

      const maxVal = d3.max(barData, d=>d.value) * 1.04;
      const xScale = d3.scaleLinear().domain([0, maxVal]).range([0, bW]);

      // Línea vertical
      mainG.append("line")
        .attr("x1",bMargin.left).attr("x2",bMargin.left)
        .attr("y1",yOffset).attr("y2",yOffset + barData.length*rowH)
        .attr("stroke","#bbb").attr("stroke-width",1);

      barData.forEach((d, i) => {
        const y = yOffset + i*rowH + 4;
        const barH = rowH - 10;

        mainG.append("rect")
          .attr("x",bMargin.left).attr("y",y)
          .attr("width",xScale(d.value)).attr("height",barH)
          .attr("fill",BAR_COLOR);

        mainG.append("text")
          .attr("x",bMargin.left-8).attr("y",y+barH/2).attr("dy","0.35em")
          .style("text-anchor","end").style("font-size","12px").style("font-weight","bold").style("fill","#333")
          .text(d.country);

        // Valor + nota de año si es distinto
        const note = d.dataYear !== currentYear ? ` in ${d.dataYear}` : "";
        mainG.append("text")
          .attr("x",bMargin.left+xScale(d.value)+8).attr("y",y+barH/2).attr("dy","0.35em")
          .style("font-size","12px").style("fill","#444")
          .text(`${d.value} years${note}`);
      });

      yOffset += barData.length * rowH + sectionGap;
    });
  }

  // ── Slider ────────────────────────────────────────────────────────────────
  const sliderY = H - 50;
  const sliderX0 = 90, sliderX1 = W - 60;
  const xSlider = d3.scalePoint().domain(years).range([sliderX0, sliderX1]);
  const sliderG = svg.append("g");

  const playBtn = sliderG.append("text").attr("x",24).attr("y",sliderY+5)
    .style("font-size","18px").style("cursor","pointer").style("fill","#555").text("▶");

  sliderG.append("text").attr("x",sliderX0).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(years[0]);
  sliderG.append("text").attr("x",sliderX1).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(years[years.length-1]);
  sliderG.append("line").attr("x1",sliderX0).attr("x2",sliderX1)
    .attr("y1",sliderY).attr("y2",sliderY)
    .attr("stroke","#ccc").attr("stroke-width",4).attr("stroke-linecap","round");

  const handle = sliderG.append("circle").attr("cy",sliderY).attr("r",9)
    .attr("fill","#555").style("cursor","pointer");

  function updateYear(y) {
    currentYear = y;
    handle.attr("cx", xSlider(y));
    if (mode === "bar") renderBar();
  }
  updateYear(currentYear);

  sliderG.append("rect").attr("x",sliderX0).attr("y",sliderY-12)
    .attr("width",sliderX1-sliderX0).attr("height",24)
    .attr("fill","transparent").style("cursor","pointer")
    .on("click", function(event) {
      const [mx] = d3.pointer(event);
      updateYear(years.reduce((a,b)=>Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
    });

  handle.call(d3.drag().on("drag", function(event) {
    const mx = Math.max(sliderX0, Math.min(sliderX1, event.x));
    updateYear(years.reduce((a,b)=>Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
  }));

  playBtn.on("click", () => {
    if (playing) { clearInterval(timer); playing=false; playBtn.text("▶"); }
    else {
      if (currentYear === years[years.length-1]) updateYear(years[0]);
      playing=true; playBtn.text("⏸");
      timer = setInterval(() => {
        const idx = years.indexOf(currentYear);
        if (idx < years.length-1) updateYear(years[idx+1]);
        else { clearInterval(timer); playing=false; playBtn.text("▶"); }
      }, 200);
    }
  });

  // ── Mode switching ────────────────────────────────────────────────────────
  function setMode(m) {
    mode = m;
    btnLine.style("background",m==="line"?"#3a6fc4":"#fff").style("color",m==="line"?"#fff":"#333");
    btnBar .style("background",m==="bar" ?"#3a6fc4":"#fff").style("color",m==="bar" ?"#fff":"#333");
    sliderG.style("display", m==="line"?"none":null);
    hideTooltip();
    if (m==="line") renderLine();
    if (m==="bar")  { updateYear(currentYear); }
  }

  btnLine.on("click", ()=>setMode("line"));
  btnBar .on("click", ()=>setMode("bar"));

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",30).attr("y",H-18)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",110).attr("y",H-18)
    .style("font-size","10.5px").style("fill","#333")
    .text("Diaconu et al. (2022) – processed by Our World in Data");
  svg.append("text").attr("x",30).attr("y",H-5)
    .style("font-size","10px").style("fill","#aaa")
    .text("OurWorldInData.org/life-expectancy | CC BY");

  setMode("line");
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("modal-age-at-death-in-adults.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["modal-age-at-death-in-adults.csv", {url: new URL("./files/654f31c945b713b9ac50eb5493cb8c8c1e1fbbbab783f86fd4eec1f7f45d77e640699c65902f5579aea6b1d01479d09aa98b112d85a00b8ef88b7780290a036a.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  return main;
}
