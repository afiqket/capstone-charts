function _1(md){return(
md`# Interstate and Intrastate war 2010`
)}

function _2(maxYear,d3,topojson,world,numericEntityMap,dataByCountry,valueCol,minYear,selectedCountries)
{
  const W = 900, H = 580;
  const mapMargin = { top: 58, right: 20, bottom: 110, left: 20 };
  const mapW = W - mapMargin.left - mapMargin.right;
  const mapH = H - mapMargin.top - mapMargin.bottom;

  const COLOR_YES  = "#e8916a"; // naranja — conflicto
  const COLOR_NO   = "#7db8d4"; // azul — sin conflicto
  const COLOR_NONE = "#e8e8e8"; // gris — sin datos

  let mode = "map";
  let currentYear = maxYear;
  let playing = false, playInterval = null;

  const projection = d3.geoNaturalEarth1().scale(145).translate([mapW/2, mapH/2+10]);
  const pathGen    = d3.geoPath().projection(projection);
  const countries  = topojson.feature(world, world.objects.countries);

  // ── Container ─────────────────────────────────────────────────────────────
  const container = d3.create("div").style("font-family","sans-serif").style("user-select","none");

  const btnRow = container.append("div").style("display","flex").style("gap","6px").style("margin-bottom","6px");
  const mkBtn = (label, active) => btnRow.append("button").text(label)
    .style("padding","4px 14px").style("border","1px solid #ccc").style("border-radius","4px")
    .style("cursor","pointer").style("font-size","13px")
    .style("background", active ? "#3a6fc4" : "#fff")
    .style("color",      active ? "#fff"    : "#333");

  const btnMap  = mkBtn("🌍 Map",  true);
  const btnLine = mkBtn("📈 Line", false);

  const svg = container.append("svg")
    .attr("viewBox",`0 0 ${W} ${H}`).attr("width",W).attr("height",H).style("background","#fff");

  // Patrón rayas "no data"
  const defs = svg.append("defs");
  defs.append("pattern").attr("id","hatchLoc").attr("patternUnits","userSpaceOnUse")
    .attr("width",6).attr("height",6).attr("patternTransform","rotate(45)")
    .append("line").attr("x1",0).attr("y1",0).attr("x2",0).attr("y2",6)
    .attr("stroke","#bbb").attr("stroke-width",2);

  const titleEl = svg.append("text").attr("x",mapMargin.left).attr("y",22)
    .style("font-size","18px").style("font-weight","bold").style("fill","#111");

  svg.append("text").attr("x",mapMargin.left).attr("y",38)
    .style("font-size","11px").style("fill","#555")
    .text("Included are interstate and intrastate wars that were ongoing that year.");

  const mainG = svg.append("g").attr("transform",`translate(${mapMargin.left},${mapMargin.top})`);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 8px rgba(0,0,0,0.13))");
  const ttCountry = ttG.append("text").attr("x",14).attr("y",24)
    .style("font-size","15px").style("font-weight","bold").style("fill","#111");
  const ttYearLbl = ttG.append("text").attr("x",14).attr("y",40)
    .style("font-size","11px").style("fill","#888");
  const ttVal = ttG.append("text").attr("x",14).attr("y",66)
    .style("font-size","18px").style("font-weight","bold");

  function showTooltip(entity, value, year, mx, my) {
    ttCountry.text(entity);
    ttYearLbl.text(year);
    const isYes = value === 1;
    ttVal.text(isYes ? "Yes — conflict occurred" : "No — no conflict").attr("fill", isYes ? COLOR_YES : COLOR_NO);
    const ttW=240, ttH=78;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx=mx+ttW+20>W?mx-ttW-8:mx+12;
    const ty=Math.max(0,Math.min(my-20,H-ttH-10));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }
  function hideTooltip() { ttG.style("display","none"); }

  // ── RENDER MAP ────────────────────────────────────────────────────────────
  function renderMap() {
    titleEl.text(`Countries where interstate or intrastate wars took place, ${currentYear}`);
    mainG.selectAll("*").remove();

    mainG.selectAll(".country").data(countries.features).join("path")
      .attr("class","country").attr("d",pathGen)
      .attr("fill", d => {
        const entity = numericEntityMap.get(String(d.id).padStart(3,"0"));
        if (!entity) return "url(#hatchLoc)";
        const rows = dataByCountry.get(entity);
        if (!rows) return "url(#hatchLoc)";
        const row = rows.find(r => r.Year === currentYear);
        if (!row) return "url(#hatchLoc)";
        return row[valueCol] === 1 ? COLOR_YES : COLOR_NO;
      })
      .attr("stroke","#fff").attr("stroke-width",0.4)
      .on("mousemove", function(event, d) {
        const entity = numericEntityMap.get(String(d.id).padStart(3,"0"));
        if (!entity) return hideTooltip();
        const rows = dataByCountry.get(entity);
        if (!rows) return hideTooltip();
        const row = rows.find(r => r.Year === currentYear);
        if (!row) return hideTooltip();
        d3.selectAll(".country").attr("stroke","#fff").attr("stroke-width",0.4);
        d3.select(this).attr("stroke","#333").attr("stroke-width",1.5).raise();
        const [mx,my] = d3.pointer(event, svg.node());
        showTooltip(entity, row[valueCol], currentYear, mx, my);
      })
      .on("mouseleave", function() {
        d3.selectAll(".country").attr("stroke","#fff").attr("stroke-width",0.4);
        hideTooltip();
      });

    // Leyenda categórica
    const legX = mapW/2 - 120, legY = mapH + 20;
    const legG = mainG.append("g").attr("transform",`translate(${legX},${legY})`);

    // No data
    legG.append("rect").attr("x",-100).attr("width",40).attr("height",14)
      .attr("fill","url(#hatchLoc)").attr("stroke","#ccc").attr("stroke-width",0.5);
    legG.append("text").attr("x",-100).attr("y",28).style("font-size","12px").style("fill","#555").text("No data");

    // No
    legG.append("rect").attr("x",0).attr("width",50).attr("height",14).attr("fill",COLOR_NO).attr("rx",2);
    legG.append("text").attr("x",25).attr("y",28).style("font-size","12px").style("fill","#555")
      .style("text-anchor","middle").text("No");

    // Yes
    legG.append("rect").attr("x",60).attr("width",50).attr("height",14).attr("fill",COLOR_YES).attr("rx",2);
    legG.append("text").attr("x",85).attr("y",28).style("font-size","12px").style("fill","#555")
      .style("text-anchor","middle").text("Yes");
  }

  // ── RENDER LINE (small multiples) ─────────────────────────────────────────
  function renderLine() {
    const lineStartYear = currentYear >= maxYear ? minYear : currentYear;
    titleEl.text(`Countries where interstate or intrastate wars took place, ${lineStartYear} to ${maxYear}`);
    mainG.selectAll("*").remove(); hideTooltip();

    // Leyenda arriba
    const legG = mainG.append("g").attr("transform",`translate(${mapW/2 - 80}, 0)`);
    legG.append("rect").attr("x",0).attr("width",36).attr("height",10).attr("fill",COLOR_NO).attr("rx",2);
    legG.append("text").attr("x",42).attr("y",9).style("font-size","11px").style("fill","#555").text("No");
    legG.append("rect").attr("x",70).attr("width",36).attr("height",10).attr("fill",COLOR_YES).attr("rx",2);
    legG.append("text").attr("x",112).attr("y",9).style("font-size","11px").style("fill","#555").text("Yes");

    // Grid 2×2 de small multiples
    const cols = 2, rows = Math.ceil(selectedCountries.length / cols);
    const padTop = 22, padBetween = 20;
    const cellW = (mapW - (cols-1)*padBetween) / cols;
    const cellH = (mapH - padTop - (rows-1)*padBetween) / rows;
    const innerM = {left:36, right:10, top:24, bottom:22};
    const iW = cellW - innerM.left - innerM.right;
    const iH = cellH - innerM.top  - innerM.bottom;

    selectedCountries.forEach((entity, idx) => {
      const col = idx % cols, row = Math.floor(idx / cols);
      const cx = col*(cellW+padBetween), cy = padTop + row*(cellH+padBetween);

      const cellG = mainG.append("g").attr("transform",`translate(${cx},${cy})`);

      // Borde sutil
      cellG.append("rect").attr("width",cellW).attr("height",cellH)
        .attr("fill","none").attr("stroke","#efefef").attr("rx",4);

      // Título país
      cellG.append("text").attr("x",innerM.left).attr("y",16)
        .style("font-size","12px").style("font-weight","bold").style("fill","#222")
        .text(entity);

      const vals = (dataByCountry.get(entity)||[])
        .filter(d=>d.Year>=lineStartYear).sort((a,b)=>a.Year-b.Year);

      const xScale = d3.scaleLinear().domain([lineStartYear,maxYear]).range([0,iW]);
      const yScale = d3.scaleLinear().domain([0,1]).range([iH,0]);

      const gInner = cellG.append("g").attr("transform",`translate(${innerM.left},${innerM.top})`);

      // Grid horizontal en y=1
      gInner.append("line").attr("x1",0).attr("x2",iW).attr("y1",yScale(1)).attr("y2",yScale(1))
        .attr("stroke","#e8e8e8").attr("stroke-dasharray","3,3");

      // Eje Y (0 y 1)
      [0,1].forEach(v => {
        gInner.append("text").attr("x",-4).attr("y",yScale(v)).attr("dy","0.35em")
          .style("font-size","9px").style("fill","#aaa").style("text-anchor","end").text(v);
      });

      // Eje X (años)
      const xTicks = d3.ticks(lineStartYear,maxYear,5).map(Math.round);
      gInner.append("g").attr("transform",`translate(0,${iH})`).call(
        d3.axisBottom(xScale).tickValues(xTicks).tickFormat(d3.format("d")).tickSize(3)
      ).call(ax=>ax.select(".domain").attr("stroke","#ccc"))
       .call(ax=>ax.selectAll("line").attr("stroke","#ccc"))
       .selectAll("text").style("font-size","9px").style("fill","#888");

      // Área coloreada: cada año es una franja vertical con color según valor
      // Usamos barras verticales finas (una por año)
      const yearRange = vals.map(d=>d.Year);
      if (yearRange.length > 1) {
        vals.forEach((d,i) => {
          const x0 = xScale(d.Year);
          const x1 = i < vals.length-1 ? xScale(vals[i+1].Year) : iW;
          gInner.append("rect")
            .attr("x", x0).attr("y", yScale(1))
            .attr("width", Math.max(x1-x0, 1))
            .attr("height", iH - yScale(1) + 0.5)
            .attr("fill", d[valueCol]===1 ? COLOR_YES : COLOR_NO)
            .attr("opacity", 0.85);
        });
      }

      // Línea escalonada encima
      const stepLine = d3.line().x(d=>xScale(d.Year)).y(d=>yScale(d[valueCol])).curve(d3.curveStepAfter);
      gInner.append("path").datum(vals).attr("fill","none")
        .attr("stroke","#666").attr("stroke-width",1).attr("d",stepLine);
    });
  }

  // ── Slider ────────────────────────────────────────────────────────────────
  const sliderY=H-72, sliderX=40, sliderW=W-sliderX-40;
  const sliderG=svg.append("g").attr("transform",`translate(${sliderX},${sliderY})`);
  sliderG.append("line").attr("x1",0).attr("x2",sliderW).attr("y1",0).attr("y2",0)
    .attr("stroke","#ddd").attr("stroke-width",4).attr("stroke-linecap","round");
  const activeTrack=sliderG.append("line").attr("y1",0).attr("y2",0)
    .attr("stroke","#3a6fc4").attr("stroke-width",4).attr("stroke-linecap","round");
  const sliderScale=d3.scaleLinear().domain([minYear,maxYear]).range([0,sliderW]).clamp(true);
  sliderG.append("text").attr("x",0).attr("y",22).style("font-size","12px").style("fill","#555")
    .style("text-anchor","middle").text(minYear);
  sliderG.append("text").attr("x",sliderW).attr("y",22).style("font-size","12px").style("fill","#555")
    .style("text-anchor","middle").text(maxYear);
  const handle=sliderG.append("circle").attr("r",9)
    .attr("fill","#555").attr("stroke","#fff").attr("stroke-width",2).style("cursor","ew-resize");
  const playBtn=sliderG.append("g").attr("transform","translate(-28,0)").style("cursor","pointer");
  playBtn.append("circle").attr("r",14).attr("fill","#555");
  const playIcon=playBtn.append("text").attr("text-anchor","middle").attr("dy","0.35em")
    .style("font-size","14px").style("fill","#fff").text("▶");

  function updateSlider(){
    const x=sliderScale(currentYear);
    handle.attr("cx",x); activeTrack.attr("x1",0).attr("x2",x);
  }
  function stopPlay(){ playing=false; clearInterval(playInterval); playIcon.text("▶"); }
  function redraw(){
    updateSlider();
    mode==="map" ? renderMap() : renderLine();
  }

  handle.call(d3.drag().on("drag",function(event){
    stopPlay();
    currentYear=Math.max(minYear,Math.min(maxYear,Math.round(sliderScale.invert(event.x))));
    redraw();
  }));
  sliderG.append("rect").attr("x",0).attr("y",-10).attr("width",sliderW).attr("height",20)
    .attr("fill","none").attr("pointer-events","all").style("cursor","pointer")
    .on("click",function(event){
      stopPlay();
      const [mx]=d3.pointer(event);
      currentYear=Math.max(minYear,Math.min(maxYear,Math.round(sliderScale.invert(mx))));
      redraw();
    });
  playBtn.on("click",()=>{
    if(playing){stopPlay();}else{
      playing=true; playIcon.text("⏸");
      if(currentYear>=maxYear) currentYear=minYear;
      playInterval=setInterval(()=>{
        currentYear=Math.min(currentYear+1,maxYear); redraw();
        if(currentYear>=maxYear) stopPlay();
      },350);
    }
  });

  // Pie
  svg.append("text").attr("x",mapMargin.left).attr("y",H-30)
  .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
svg.append("text").attr("x",mapMargin.left+80).attr("y",H-30)
  .style("font-size","10.5px").style("fill","#333")
  .text("Chupilkin and Kóczán (2022); Correlates of War - Wars (2020) – processed by Our World in Data");
svg.append("text").attr("x",mapMargin.left).attr("y",H-16)
  .style("font-size","10px").style("fill","#555")
  .text("Note: Current country borders are used across time.");
svg.append("text").attr("x",mapMargin.left).attr("y",H-4)
  .style("font-size","10px").style("fill","#aaa").text("OurWorldInData.org/war-and-peace | CC BY");

  // Botones
  function setMode(m){
    mode=m;
    btnMap.style("background",m==="map"?"#3a6fc4":"#fff").style("color",m==="map"?"#fff":"#333");
    btnLine.style("background",m==="line"?"#3a6fc4":"#fff").style("color",m==="line"?"#fff":"#333");
    hideTooltip(); redraw();
  }
  btnMap.on("click",()=>setMode("map"));
  btnLine.on("click",()=>setMode("line"));

  currentYear = maxYear;
  redraw();
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("countries-where-interstate-or-intrastate-wars-took-place.csv").csv({typed: true})
)}

function _world(){return(
fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(r => r.json())
)}

function _topojson(require){return(
require("topojson-client@3")
)}

function _selectedCountries(){return(
["China", "Russia", "United Kingdom", "United States"]
)}

function _valueCol(){return(
"War took place"
)}

function _allYears(rawData){return(
[...new Set(rawData.map(d => d.Year))].sort((a,b) => a - b)
)}

function _minYear(allYears){return(
allYears[0]
)}

function _maxYear(allYears){return(
allYears[allYears.length - 1]
)}

function _dataByCountry(d3,rawData){return(
d3.group(rawData, d => d.Entity)
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
    ["countries-where-interstate-or-intrastate-wars-took-place.csv", {url: new URL("./files/60cd1dbdcfc91772bb42792365e71c3a1af2fa8820e3b9b1984b8bd24e5d797d40fdc7554ff80e6d84588d9fe87fd1d536bc96635471b308579bcef419aba8ea.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["maxYear","d3","topojson","world","numericEntityMap","dataByCountry","valueCol","minYear","selectedCountries"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  main.variable(observer("world")).define("world", _world);
  main.variable(observer("topojson")).define("topojson", ["require"], _topojson);
  main.variable(observer("selectedCountries")).define("selectedCountries", _selectedCountries);
  main.variable(observer("valueCol")).define("valueCol", _valueCol);
  main.variable(observer("allYears")).define("allYears", ["rawData"], _allYears);
  main.variable(observer("minYear")).define("minYear", ["allYears"], _minYear);
  main.variable(observer("maxYear")).define("maxYear", ["allYears"], _maxYear);
  main.variable(observer("dataByCountry")).define("dataByCountry", ["d3","rawData"], _dataByCountry);
  main.variable(observer("alpha3Numeric")).define("alpha3Numeric", _alpha3Numeric);
  main.variable(observer("numericEntityMap")).define("numericEntityMap", ["rawData","alpha3Numeric"], _numericEntityMap);
  return main;
}
