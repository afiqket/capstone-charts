function _1(md){return(
md`# Projected change in dependency ratio depending on labor force participation`
)}

function _2(d3,rawData,topojson,world,numericEntityMap)
{
  const W = 1100, H = 600;
  const mapMargin = { top: 100, right: 20, bottom: 80, left: 150 };
  const mapW = W - mapMargin.left - mapMargin.right;
  const mapH = H - mapMargin.top - mapMargin.bottom;

  const SERIES = [
    { col: "Age dependency ratio",                                label: "Age dependency ratio",                                color: "#B04B2D" },
    { col: "Labor force dependency ratio",                        label: "Labor force dependency ratio",                        color: "#4C6FAD" },
    { col: "Labor force dependency ratio – higher participation", label: "Labor force dependency ratio – higher participation", color: "#8B6914" },
  ];
  const BAR_COLOR = "#6b7fad";
  const MAP_COL = "Age dependency ratio"; // columna que muestra el mapa por defecto

  const colorScale = d3.scaleSequential()
    .domain([95, 145])
    .interpolator(d3.interpolateRgbBasis([
      "#e0f5f0","#a8ddd1","#5fb8a5","#2a8a72","#00574a","#003530"
    ]));

  const country = "United Kingdom";
  const allEntities = [...new Set(rawData.map(d => d.Entity))].filter(e => e && !e.startsWith("OWID_"));
  const years = [...new Set(rawData.map(d => +d.Year))].sort((a,b) => a-b);
  let currentYear = years[years.length - 1];

  // Map<entity, Map<year, row>>
  const dataMap = new Map();
  rawData.forEach(r => {
    if (!dataMap.has(r.Entity)) dataMap.set(r.Entity, new Map());
    dataMap.get(r.Entity).set(+r.Year, r);
  });

  // Por serie para el modo line (UK)
  const rowsUK = rawData.filter(d => d.Entity === country);
  const byYearUK = new Map(rowsUK.map(r => [+r.Year, r]));
  const seriesData = SERIES.map(s => ({
    ...s,
    points: rowsUK
      .map(r => ({ year: +r.Year, value: r[s.col] != null && r[s.col] !== "" ? +r[s.col] : null }))
      .filter(d => d.value != null).sort((a,b) => a.year - b.year)
  }));

  let mode = "map";
  let playing = false;
  let timer = null;

  // ── Contenedor ────────────────────────────────────────────────────────────
  const container = d3.create("div").style("font-family","sans-serif").style("user-select","none");

  const btnRow = container.append("div").style("display","flex").style("gap","6px").style("margin-bottom","6px");
  const mkBtn = (label, active) => btnRow.append("button").text(label)
    .style("padding","4px 14px").style("border","1px solid #ccc").style("border-radius","4px")
    .style("cursor","pointer").style("font-size","13px")
    .style("background", active ? "#3a6fc4" : "#fff")
    .style("color",      active ? "#fff"    : "#333");

  const btnMap  = mkBtn("🌍 Map",  true);
  const btnLine = mkBtn("📈 Line", false);
  const btnBar  = mkBtn("📊 Bar",  false);

  const svg = container.append("svg")
    .attr("viewBox",`0 0 ${W} ${H}`)
    .attr("width",W).attr("height",H)
    .style("background","#fff");

  const titleEl = svg.append("text").attr("x", mapMargin.left).attr("y", 22)
    .style("font-size","15px").style("font-weight","bold").style("fill","#111");

  const subtitleLines = [
    "– Age dependency is the ratio between people defined as dependents (under-15s and over-65s) and working-age people.",
    "– Labor force dependency does not take into account age brackets but instead uses the ratio between those not participating in the workforce to those that are.",
    "– High labor force participation assumes a higher share of people participating in the workforce (e.g. beyond the age of 65)."
  ];
  subtitleLines.forEach((line, i) => {
    svg.append("foreignObject").attr("x", mapMargin.left).attr("y", 26 + i * 15)
      .attr("width", W - mapMargin.left - 10).attr("height", 16)
      .append("xhtml:div").style("font-size","10px").style("color","#555").text(line);
  });

  // ── Defs: hatch + gradient ────────────────────────────────────────────────
  const defs = svg.append("defs");
  defs.append("pattern").attr("id","hatchDEP").attr("patternUnits","userSpaceOnUse")
    .attr("width",6).attr("height",6).attr("patternTransform","rotate(45)")
    .append("line").attr("x1",0).attr("y1",0).attr("x2",0).attr("y2",6)
    .attr("stroke","#bbb").attr("stroke-width",2);

  const grad = defs.append("linearGradient").attr("id","gradDEP").attr("x1","0%").attr("x2","100%");
  [95,105,115,125,135,145].forEach(v =>
    grad.append("stop").attr("offset",`${((v-95)/50)*100}%`).attr("stop-color", colorScale(v))
  );

  const mainG = svg.append("g").attr("transform",`translate(${mapMargin.left},${mapMargin.top})`);

  // ── Projection ────────────────────────────────────────────────────────────
  const projection = d3.geoNaturalEarth1().scale(145).translate([mapW/2, mapH/2+10]);
  const pathGen = d3.geoPath().projection(projection);
  const countriesGeo = topojson.feature(world, world.objects.countries);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 6px rgba(0,0,0,0.13))");
  const ttTitle = ttG.append("text").attr("x",12).attr("y",20)
    .style("font-size","13px").style("font-weight","bold").style("fill","#111");
  const ttYear  = ttG.append("text").attr("x",12).attr("y",36)
    .style("font-size","11px").style("fill","#888");

  function showTooltip(entity, year, items, mx, my) {
    ttTitle.text(entity);
    ttYear.text(year);
    ttG.selectAll(".ttrow").remove();
    items.forEach((item, i) => {
      ttG.append("text").attr("class","ttrow")
        .attr("x",12).attr("y", 50 + i * 15)
        .style("font-size","11px").style("fill", item.color)
        .text(`${item.label}: ${d3.format(".2f")(item.value)}`);
    });
    const ttH = 42 + items.length * 15 + 6;
    const ttW = 320;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 12;
    const ty = Math.max(0, Math.min(my - 20, H - ttH - 10));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }
  function hideTooltip() { ttG.style("display","none"); }

  // ── RENDER MAP ────────────────────────────────────────────────────────────
  function renderMap() {
    mainG.selectAll("*").remove();
    titleEl.text(`Projected change in dependency ratio depending on labor force participation, ${currentYear}`);

    mainG.selectAll(".country").data(countriesGeo.features).join("path")
      .attr("class","country").attr("d", pathGen)
      .attr("fill", d => {
        const entity = numericEntityMap.get(String(d.id).padStart(3,"0"));
        if (!entity) return "#e8e8e8";
        const row = dataMap.get(entity)?.get(currentYear);
        if (!row || row[MAP_COL] == null || row[MAP_COL] === "") return "url(#hatchDEP)";
        return colorScale(Math.max(95, Math.min(145, +row[MAP_COL])));
      })
      .attr("stroke","#fff").attr("stroke-width",0.4)
      .on("mousemove", function(event, d) {
        const entity = numericEntityMap.get(String(d.id).padStart(3,"0"));
        if (!entity) return hideTooltip();
        const row = dataMap.get(entity)?.get(currentYear);
        if (!row) return hideTooltip();
        d3.selectAll(".country").attr("stroke","#fff").attr("stroke-width",0.4);
        d3.select(this).attr("stroke","#333").attr("stroke-width",1.5).raise();
        const items = SERIES.map(s => ({
          label: s.label, color: s.color,
          value: row[s.col] != null && row[s.col] !== "" ? +row[s.col] : null
        })).filter(x => x.value != null);
        const [mx,my] = d3.pointer(event, svg.node());
        showTooltip(entity, currentYear, items, mx, my);
      })
      .on("mouseleave", function() {
        d3.selectAll(".country").attr("stroke","#fff").attr("stroke-width",0.4);
        hideTooltip();
      });

    // Leyenda
    const legW = 400, legH = 14;
    const legX = (mapW - legW)/2 + 20, legY = mapH + 10;
    const legG = mainG.append("g").attr("transform",`translate(${legX},${legY})`);
    legG.append("rect").attr("x",-70).attr("width",50).attr("height",legH)
      .attr("fill","url(#hatchDEP)").attr("stroke","#ccc").attr("stroke-width",0.5);
    legG.append("text").attr("x",-70).attr("y",legH+13)
      .style("font-size","11px").style("fill","#555").text("No data");
    legG.append("rect").attr("width",legW).attr("height",legH).attr("fill","url(#gradDEP)");
    legG.append("rect").attr("width",legW).attr("height",legH).attr("fill","none")
      .attr("stroke","#ccc").attr("stroke-width",0.5);
    [95,100,110,120,130,140,145].forEach(v => {
      legG.append("text").attr("x",((v-95)/50)*legW).attr("y",legH+13)
        .style("font-size","11px").style("fill","#555").style("text-anchor","middle").text(v);
    });
    legG.append("text").attr("x",legW/2).attr("y",legH+26)
      .style("font-size","10px").style("fill","#888").style("text-anchor","middle")
      .text("Age dependency ratio (indexed, 100 = 2015)");
  }

  // ── RENDER LINE ───────────────────────────────────────────────────────────
  function renderLine() {
    const lMargin = { top: 10, right: 10, bottom: 30, left: 55 };
    const lW = mapW - lMargin.left - lMargin.right;
    const lH = mapH - lMargin.top - lMargin.bottom;
    mainG.selectAll("*").remove();
    titleEl.text(`Projected change in dependency ratio depending on labor force participation, ${country}`);

    const allVals = seriesData.flatMap(s => s.points.map(p => p.value));
    const yMax = Math.ceil((d3.max(allVals) || 150) / 20) * 20;
    const xScale = d3.scaleLinear().domain(d3.extent(years)).range([0, lW]);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([lH, 0]);

    const lG = mainG.append("g").attr("transform",`translate(${lMargin.left},${lMargin.top})`);

    d3.range(0, yMax+1, 20).forEach(v => {
      lG.append("line").attr("x1",0).attr("x2",lW).attr("y1",yScale(v)).attr("y2",yScale(v))
        .attr("stroke", v===0?"#999":"#e0e0e0").attr("stroke-dasharray",v===0?"0":"4,3").attr("stroke-width",1);
      lG.append("text").attr("x",-8).attr("y",yScale(v)).attr("dy","0.35em")
        .style("font-size","11px").style("fill","#888").style("text-anchor","end").text(v);
    });
    years.filter(y => y%5===0).forEach(y => {
      lG.append("text").attr("x",xScale(y)).attr("y",lH+18)
        .style("font-size","11px").style("fill","#888").style("text-anchor","middle").text(y);
    });
    lG.append("line").attr("x1",0).attr("x2",lW).attr("y1",lH).attr("y2",lH)
      .attr("stroke","#bbb").attr("stroke-width",1);

    const lineGen = d3.line().x(d=>xScale(d.year)).y(d=>yScale(d.value)).curve(d3.curveMonotoneX);

    seriesData.forEach(s => {
      if (!s.points.length) return;
      lG.append("path").datum(s.points).attr("fill","none")
        .attr("stroke",s.color).attr("stroke-width",2).attr("d",lineGen);
      s.points.forEach(p => {
        lG.append("circle").attr("cx",xScale(p.year)).attr("cy",yScale(p.value))
          .attr("r",3.5).attr("fill",s.color);
      });
      const last = s.points[s.points.length-1];
      lG.append("text").attr("x",xScale(last.year)+8).attr("y",yScale(last.value))
        .attr("dy","0.35em").style("font-size","11px").style("font-weight","bold")
        .style("fill",s.color).text(s.label);
    });

    lG.append("rect").attr("width",lW).attr("height",lH).attr("fill","transparent")
      .on("mousemove", function(event) {
        const [mx] = d3.pointer(event);
        const closest = years.reduce((a,b)=>Math.abs(xScale(a)-mx)<Math.abs(xScale(b)-mx)?a:b);
        const row = byYearUK.get(closest);
        if (!row) return hideTooltip();
        const items = SERIES.map(s=>({
          label:s.label, color:s.color,
          value: row[s.col]!=null&&row[s.col]!==""?+row[s.col]:null
        })).filter(d=>d.value!=null);
        const [sx,sy] = d3.pointer(event,svg.node());
        showTooltip(country, closest, items, sx, sy);
      })
      .on("mouseleave", hideTooltip);
  }

  // ── RENDER BAR ────────────────────────────────────────────────────────────
  function renderBar() {
    const bMargin = { left: 55 };
    const bW = mapW - bMargin.left - 80;
    mainG.selectAll("*").remove();
    titleEl.text(`Projected change in dependency ratio depending on labor force participation, ${country}, ${currentYear}`);

    const row = byYearUK.get(currentYear);
    const barData = SERIES.map(s=>({
      label:s.label, color:s.color,
      value: row&&row[s.col]!=null&&row[s.col]!==""?+row[s.col]:null
    })).filter(d=>d.value!=null);

    if (!barData.length) {
      mainG.append("text").attr("x",mapW/2).attr("y",mapH/2)
        .style("text-anchor","middle").style("fill","#888").style("font-size","14px")
        .text("No data for this year");
      return;
    }

    const maxVal = d3.max(barData,d=>d.value)*1.08;
    const xScale = d3.scaleLinear().domain([0,maxVal]).range([0,bW]);
    const yScale = d3.scaleBand().domain(barData.map(d=>d.label))
      .range([0,mapH-20]).padding(0.32);

    const bG = mainG.append("g").attr("transform",`translate(${bMargin.left},0)`);

    barData.forEach(d => {
      bG.append("rect").attr("x",0).attr("y",yScale(d.label))
        .attr("width",xScale(d.value)).attr("height",yScale.bandwidth())
        .attr("fill",BAR_COLOR);

      const words = d.label.split(" ");
      const mid = Math.ceil(words.length/2);
      const cy = yScale(d.label)+yScale.bandwidth()/2;
      bG.append("text").attr("x",-10).attr("y", words.length>3?cy-7:cy).attr("dy","0.35em")
        .style("text-anchor","end").style("font-size","12px").style("font-weight","bold").style("fill","#333")
        .text(words.slice(0,mid).join(" "));
      if (words.length>3) {
        bG.append("text").attr("x",-10).attr("y",cy+7).attr("dy","0.35em")
          .style("text-anchor","end").style("font-size","12px").style("font-weight","bold").style("fill","#333")
          .text(words.slice(mid).join(" "));
      }
      bG.append("text").attr("x",xScale(d.value)+8).attr("y",cy).attr("dy","0.35em")
        .style("font-size","13px").style("fill","#444").text(d3.format(".2f")(d.value));
    });

    bG.append("line").attr("x1",0).attr("x2",0).attr("y1",0).attr("y2",mapH-20)
      .attr("stroke","#bbb").attr("stroke-width",1);
  }

  // ── Slider ────────────────────────────────────────────────────────────────
  const sliderY = H - 48;
  const sliderX0 = 80, sliderX1 = W - 60;
  const xSlider = d3.scalePoint().domain(years).range([sliderX0,sliderX1]);
  const sliderG = svg.append("g");

  const playBtn = sliderG.append("text").attr("x",24).attr("y",sliderY+5)
    .style("font-size","18px").style("cursor","pointer").style("fill","#555").text("▶");
  sliderG.append("text").attr("x",sliderX0).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(years[0]);
  sliderG.append("text").attr("x",sliderX1).attr("y",sliderY+5)
    .style("font-size","12px").style("fill","#888").style("text-anchor","middle").text(years[years.length-1]);
  sliderG.append("line").attr("x1",sliderX0).attr("x2",sliderX1)
    .attr("y1",sliderY).attr("y2",sliderY).attr("stroke","#ccc").attr("stroke-width",4).attr("stroke-linecap","round");

  const handle = sliderG.append("circle").attr("cy",sliderY).attr("r",9)
    .attr("fill","#555").style("cursor","pointer");

  function updateYear(y) {
    currentYear = y; handle.attr("cx",xSlider(y));
    if (mode==="map") renderMap();
    else if (mode==="bar") renderBar();
  }
  updateYear(currentYear);

  sliderG.append("rect").attr("x",sliderX0).attr("y",sliderY-12)
    .attr("width",sliderX1-sliderX0).attr("height",24).attr("fill","transparent").style("cursor","pointer")
    .on("click", function(event) {
      const [mx]=d3.pointer(event);
      updateYear(years.reduce((a,b)=>Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
    });
  handle.call(d3.drag().on("drag", function(event) {
    const mx=Math.max(sliderX0,Math.min(sliderX1,event.x));
    updateYear(years.reduce((a,b)=>Math.abs(xSlider(a)-mx)<Math.abs(xSlider(b)-mx)?a:b));
  }));
  playBtn.on("click",()=>{
    if(playing){clearInterval(timer);playing=false;playBtn.text("▶");}
    else{
      if(currentYear===years[years.length-1])updateYear(years[0]);
      playing=true;playBtn.text("⏸");
      timer=setInterval(()=>{
        const idx=years.indexOf(currentYear);
        if(idx<years.length-1)updateYear(years[idx+1]);
        else{clearInterval(timer);playing=false;playBtn.text("▶");}
      },500);
    }
  });

  // ── Mode switching ────────────────────────────────────────────────────────
  function setMode(m) {
    mode=m;
    btnMap .style("background",m==="map" ?"#3a6fc4":"#fff").style("color",m==="map" ?"#fff":"#333");
    btnLine.style("background",m==="line"?"#3a6fc4":"#fff").style("color",m==="line"?"#fff":"#333");
    btnBar .style("background",m==="bar" ?"#3a6fc4":"#fff").style("color",m==="bar" ?"#fff":"#333");
    sliderG.style("display", m==="line"?"none":null);
    hideTooltip();
    if(m==="map")  renderMap();
    if(m==="line") renderLine();
    if(m==="bar")  renderBar();
  }
  btnMap .on("click",()=>setMode("map"));
  btnLine.on("click",()=>setMode("line"));
  btnBar .on("click",()=>setMode("bar"));

  // ── Footer ────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",mapMargin.left).attr("y",H-14)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",mapMargin.left+80).attr("y",H-14)
    .style("font-size","10.5px").style("fill","#333")
    .text("Marois et al. (2020) – processed by Our World in Data");
  svg.append("text").attr("x",mapMargin.left).attr("y",H-2)
    .style("font-size","10px").style("fill","#aaa").text("OurWorldInData.org/age-structure | CC BY");

  setMode("map");
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("projected-change-dependency-ratios.csv").csv({ typed: true })
)}

function _topojson(require){return(
require("topojson-client@3")
)}

function _world(){return(
fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(r => r.json())
)}

function _alpha3Numeric(){return(
{"AFG":"004","ALB":"008","DZA":"012","AND":"020","AGO":"024","ARG":"032","ARM":"051","AUS":"036","AUT":"040","AZE":"031","BHS":"044","BHR":"048","BGD":"050","BLR":"112","BEL":"056","BLZ":"084","BEN":"204","BTN":"064","BOL":"068","BIH":"070","BWA":"072","BRA":"076","BRN":"096","BGR":"100","BFA":"854","BDI":"108","CPV":"132","KHM":"116","CMR":"120","CAN":"124","CAF":"140","TCD":"148","CHL":"152","CHN":"156","COL":"170","COM":"174","COG":"178","COD":"180","CRI":"188","CIV":"384","HRV":"191","CUB":"192","CYP":"196","CZE":"203","DNK":"208","DJI":"262","DOM":"214","ECU":"218","EGY":"818","SLV":"222","GNQ":"226","ERI":"232","EST":"233","SWZ":"748","ETH":"231","FJI":"242","FIN":"246","FRA":"250","GAB":"266","GMB":"270","GEO":"268","DEU":"276","GHA":"288","GRC":"300","GTM":"320","GIN":"324","GNB":"624","HTI":"332","HND":"340","HUN":"348","ISL":"352","IND":"356","IDN":"360","IRN":"364","IRQ":"368","IRL":"372","ISR":"376","ITA":"380","JAM":"388","JPN":"392","JOR":"400","KAZ":"398","KEN":"404","PRK":"408","KOR":"410","KWT":"414","KGZ":"417","LAO":"418","LVA":"428","LBN":"422","LSO":"426","LBR":"430","LBY":"434","LTU":"440","LUX":"442","MDG":"450","MWI":"454","MYS":"458","MDV":"462","MLI":"466","MLT":"470","MRT":"478","MUS":"480","MEX":"484","MDA":"498","MNG":"496","MNE":"499","MAR":"504","MOZ":"508","MMR":"104","NAM":"516","NPL":"524","NLD":"528","NZL":"554","NIC":"558","NER":"562","NGA":"566","MKD":"807","NOR":"578","OMN":"512","PAK":"586","PAN":"591","PNG":"598","PRY":"600","PER":"604","PHL":"608","POL":"616","PRT":"620","QAT":"634","ROU":"642","RUS":"643","RWA":"646","SAU":"682","SEN":"686","SRB":"688","SLE":"694","SGP":"702","SVK":"703","SVN":"705","SOM":"706","ZAF":"710","SSD":"728","ESP":"724","LKA":"144","SDN":"729","SUR":"740","SWE":"752","CHE":"756","SYR":"760","TWN":"158","TJK":"762","TZA":"834","THA":"764","TLS":"626","TGO":"768","TTO":"780","TUN":"788","TUR":"792","TKM":"795","UGA":"800","UKR":"804","ARE":"784","GBR":"826","USA":"840","URY":"858","UZB":"860","VEN":"862","VNM":"704","PSE":"275","YEM":"887","ZMB":"894","ZWE":"716"}
)}

function _numericEntityMap(rawData,alpha3Numeric)
{
  const m = new Map()
  rawData.forEach(d => {
    if (d.Code && alpha3Numeric[d.Code]) m.set(alpha3Numeric[d.Code], d.Entity)
  })
  return m
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["projected-change-dependency-ratios.csv", {url: new URL("./files/6d42f625b78a95230979484019957c58b0ee9559cfd64dd48361f89b14d705bf5a7592e38623aedee660dbcde5458bc4cf31a8c8750b718a04166846d81188d1.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["d3","rawData","topojson","world","numericEntityMap"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  main.variable(observer("topojson")).define("topojson", ["require"], _topojson);
  main.variable(observer("world")).define("world", _world);
  main.variable(observer("alpha3Numeric")).define("alpha3Numeric", _alpha3Numeric);
  main.variable(observer("numericEntityMap")).define("numericEntityMap", ["rawData","alpha3Numeric"], _numericEntityMap);
  return main;
}
