function _1(md){return(
md`# Medicine`
)}

function _2(d3,topojson,world,numericEntityMap,dataByCountry,selectedCountries)
{
  // ── Dimensiones ───────────────────────────────────────────────────────────
  const W = 900, H = 560;
  const mapMargin = { top: 65, right: 20, bottom: 100, left: 20 };
  const mapW = W - mapMargin.left - mapMargin.right;
  const mapH = H - mapMargin.top - mapMargin.bottom;

  const BAR_COLOR = "#6b8cbf";

  // ── Estado ────────────────────────────────────────────────────────────────
  let mode = "map";

  // ── Escala de color: crema → naranja → marrón oscuro (igual que OWID) ────
  const colorScale = d3.scaleSequential()
    .domain([0, 100])
    .interpolator(d3.interpolateRgbBasis([
      "#fff7ec", "#fee8c8", "#fdd49e", "#fdbb84",
      "#fc8d59", "#e34a33", "#b30000", "#7f0000"
    ]));

  // ── Proyección ────────────────────────────────────────────────────────────
  const projection = d3.geoNaturalEarth1()
    .scale(145)
    .translate([mapW / 2, mapH / 2 + 10]);

  const pathGen = d3.geoPath().projection(projection);
  const countries = topojson.feature(world, world.objects.countries);

  // ── Container ─────────────────────────────────────────────────────────────
  const container = d3.create("div")
    .style("font-family", "sans-serif").style("user-select", "none");

  // Botones
  const btnRow = container.append("div")
    .style("display", "flex").style("gap", "6px").style("margin-bottom", "6px");

  const mkBtn = (label, active) => btnRow.append("button").text(label)
    .style("padding", "4px 14px").style("border", "1px solid #ccc")
    .style("border-radius", "4px").style("cursor", "pointer").style("font-size", "13px")
    .style("background", active ? "#3a6fc4" : "#fff")
    .style("color", active ? "#fff" : "#333");

  const btnMap = mkBtn("🌍 Map", true);
  const btnBar = mkBtn("📊 Bar", false);

  // SVG
  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", W).attr("height", H)
    .style("background", "#fff");

  // Definiciones (patrón rayas + gradiente)
  const defs = svg.append("defs");

  defs.append("pattern")
    .attr("id", "hatch").attr("patternUnits", "userSpaceOnUse")
    .attr("width", 6).attr("height", 6)
    .attr("patternTransform", "rotate(45)")
    .append("line")
      .attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 6)
      .attr("stroke", "#bbb").attr("stroke-width", 2);

  const grad = defs.append("linearGradient")
    .attr("id", "mapGrad").attr("x1", "0%").attr("x2", "100%");
  d3.range(0, 101, 10).forEach(v => {
    grad.append("stop").attr("offset", `${v}%`).attr("stop-color", colorScale(v));
  });

  // Título
  svg.append("text")
    .attr("x", mapMargin.left).attr("y", 24)
    .style("font-size", "18px").style("font-weight", "bold").style("fill", "#111")
    .text("Dealt with anxiety or depression by taking prescribed medication, 2020");

  svg.append("foreignObject")
    .attr("x", mapMargin.left).attr("y", 30)
    .attr("width", W - mapMargin.left - 20).attr("height", 34)
    .append("xhtml:div")
      .style("font-size", "11px").style("color", "#555").style("line-height", "1.4")
      .text("Respondents who reported that they 'felt so anxious or depressed that they could not continue their regular daily activities as they normally would for two weeks or longer' were asked whether they ever took prescribed medication to make themselves feel better.");

  // Grupo principal
  const mainG = svg.append("g").attr("transform", `translate(${mapMargin.left}, ${mapMargin.top})`);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display", "none");
  const ttBg = ttG.append("rect").attr("rx", 6).attr("fill", "white")
    .attr("stroke", "#ddd").attr("stroke-width", 1)
    .attr("filter", "drop-shadow(0 2px 6px rgba(0,0,0,0.13))");
  const ttCountry = ttG.append("text").attr("x", 14).attr("y", 24)
    .style("font-size", "14px").style("font-weight", "bold").style("fill", "#111");
  const ttSub = ttG.append("text").attr("x", 14).attr("y", 40)
    .style("font-size", "11px").style("fill", "#888").text("2020 · % took prescribed medication");
  const ttVal = ttG.append("text").attr("x", 14).attr("y", 68)
    .style("font-size", "22px").style("font-weight", "bold").style("fill", "#b30000");

  function showTooltip(entity, value, mx, my) {
    ttCountry.text(entity);
    ttVal.text(`${d3.format(".1f")(value)}%`);
    const ttW = 260, ttH = 84;
    ttBg.attr("width", ttW).attr("height", ttH);
    ttG.style("display", null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 12;
    const ty = Math.max(0, Math.min(my - 20, H - ttH - 10));
    ttG.attr("transform", `translate(${tx},${ty})`);
  }

  function hideTooltip() { ttG.style("display", "none"); }

  // ── RENDER MAP ────────────────────────────────────────────────────────────
  function renderMap() {
    mainG.selectAll("*").remove();

    mainG.selectAll(".country")
      .data(countries.features)
      .join("path")
        .attr("class", "country")
        .attr("d", pathGen)
        .attr("fill", d => {
          const entity = numericEntityMap.get(String(d.id).padStart(3, "0"));
          if (!entity) return "#e0e0e0";
          const val = dataByCountry.get(entity);
          return val != null ? colorScale(val) : "url(#hatch)";
        })
        .attr("stroke", "#fff").attr("stroke-width", 0.4)
        .on("mousemove", function(event, d) {
          const entity = numericEntityMap.get(String(d.id).padStart(3, "0"));
          if (!entity) return hideTooltip();
          const val = dataByCountry.get(entity);
          if (val == null) return hideTooltip();
          d3.selectAll(".country").attr("stroke", "#fff").attr("stroke-width", 0.4);
          d3.select(this).attr("stroke", "#333").attr("stroke-width", 1.5).raise();
          const [mx, my] = d3.pointer(event, svg.node());
          showTooltip(entity, val, mx, my);
        })
        .on("mouseleave", function() {
          d3.selectAll(".country").attr("stroke", "#fff").attr("stroke-width", 0.4);
          hideTooltip();
        });

    // ── Leyenda ───────────────────────────────────────────────────────────
    const legW = 560, legH = 14;
    const legX = (mapW - legW) / 2 + 40;
    const legY = mapH + 18;
    const legG = mainG.append("g").attr("transform", `translate(${legX}, ${legY})`);

    // "No data"
    legG.append("rect").attr("x", -96).attr("width", 50).attr("height", legH)
      .attr("fill", "url(#hatch)").attr("stroke", "#ccc").attr("stroke-width", 0.5);
    legG.append("text").attr("x", -96).attr("y", legH + 16)
      .style("font-size", "11px").style("fill", "#555").text("No data");

    // Gradiente
    legG.append("rect").attr("width", legW).attr("height", legH)
      .attr("fill", "url(#mapGrad)");

    // Ticks
    [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].forEach(v => {
      const x = (v / 100) * legW;
      legG.append("text").attr("x", x).attr("y", legH + 16)
        .style("font-size", "11px").style("fill", "#555").style("text-anchor", "middle")
        .text(`${v}%`);
    });
  }

  // ── RENDER BAR ────────────────────────────────────────────────────────────
  function renderBar() {
    mainG.selectAll("*").remove();
    hideTooltip();

    const barData = selectedCountries
      .map(entity => ({ entity, value: dataByCountry.get(entity) }))
      .filter(d => d.value != null)
      .sort((a, b) => b.value - a.value);

    const bMargin = { left: 130, right: 80 };
    const bW = mapW - bMargin.left - bMargin.right;
    const rowH = Math.min(48, (mapH - 20) / barData.length);

    const xB = d3.scaleLinear().domain([0, 100]).range([0, bW]);
    const yB = d3.scaleBand()
      .domain(barData.map(d => d.entity))
      .range([10, barData.length * rowH + 10])
      .padding(0.28);

    const bG = mainG.append("g").attr("transform", `translate(${bMargin.left}, 0)`);

    // Grid vertical sutil
    [25, 50, 75, 100].forEach(v => {
      bG.append("line")
        .attr("x1", xB(v)).attr("x2", xB(v))
        .attr("y1", 10).attr("y2", barData.length * rowH + 10)
        .attr("stroke", "#ececec").attr("stroke-dasharray", "3,3");
    });

    // Labels país
    bG.selectAll(".clabel").data(barData).join("text")
      .attr("class", "clabel")
      .attr("x", -10).attr("y", d => yB(d.entity) + yB.bandwidth() / 2)
      .attr("dy", "0.35em").attr("text-anchor", "end")
      .style("font-size", "13px").style("font-weight", "bold").style("fill", "#333")
      .text(d => d.entity);

    // Barras
    bG.selectAll(".bar").data(barData).join("rect")
      .attr("class", "bar")
      .attr("x", 0).attr("y", d => yB(d.entity))
      .attr("width", d => xB(d.value))
      .attr("height", yB.bandwidth())
      .attr("fill", BAR_COLOR).attr("rx", 2)
      .on("mousemove", function(event, d) {
        const [mx, my] = d3.pointer(event, svg.node());
        showTooltip(d.entity, d.value, mx, my);
      })
      .on("mouseleave", hideTooltip);

    // Labels valor
    bG.selectAll(".vlabel").data(barData).join("text")
      .attr("class", "vlabel")
      .attr("x", d => xB(d.value) + 7)
      .attr("y", d => yB(d.entity) + yB.bandwidth() / 2)
      .attr("dy", "0.35em")
      .style("font-size", "13px").style("fill", "#444")
      .text(d => `${d3.format(".1f")(d.value)}%`);
  }

  // ── Pie ───────────────────────────────────────────────────────────────────
  svg.append("text").attr("x", mapMargin.left).attr("y", H - 24)
    .style("font-size", "10.5px").style("font-weight", "bold").style("fill", "#333")
    .text("Data source: ");
  svg.append("text").attr("x", mapMargin.left + 80).attr("y", H - 24)
    .style("font-size", "10.5px").style("fill", "#333")
    .text("Wellcome Global Monitor (2021) – processed by Our World in Data");
  svg.append("text").attr("x", mapMargin.left).attr("y", H - 10)
    .style("font-size", "10px").style("fill", "#aaa")
    .text("OurWorldInData.org/mental-health | CC BY");

  // ── Botones ───────────────────────────────────────────────────────────────
  function setMode(m) {
    mode = m;
    btnMap.style("background", m === "map" ? "#3a6fc4" : "#fff").style("color", m === "map" ? "#fff" : "#333");
    btnBar.style("background", m === "bar" ? "#3a6fc4" : "#fff").style("color", m === "bar" ? "#fff" : "#333");
    if (m === "map") renderMap(); else renderBar();
  }

  btnMap.on("click", () => setMode("map"));
  btnBar.on("click", () => setMode("bar"));

  // ── Init ──────────────────────────────────────────────────────────────────
  renderMap();

  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("dealt-with-anxiety-depression-took-prescribed-medication.csv").csv({typed: true})
)}

function _world(){return(
fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(r => r.json())
)}

function _topojson(require){return(
require("topojson-client@3")
)}

function _selectedCountries(){return(
[
  "Kenya", "Germany", "United Kingdom", "Egypt", "Ethiopia",
  "Argentina", "China", "Spain", "Russia"
]
)}

function _valueCol(){return(
"Took prescribed medication"
)}

function _dataByCountry(rawData,valueCol){return(
new Map(rawData.map(d => [d.Entity, d[valueCol]]))
)}

function _alpha3Numeric(){return(
{"AFG":"004","ALB":"008","DZA":"012","AND":"020","AGO":"024","ARG":"032","ARM":"051","AUS":"036","AUT":"040","AZE":"031","BHS":"044","BHR":"048","BGD":"050","BLR":"112","BEL":"056","BLZ":"084","BEN":"204","BTN":"064","BOL":"068","BIH":"070","BWA":"072","BRA":"076","BRN":"096","BGR":"100","BFA":"854","BDI":"108","CPV":"132","KHM":"116","CMR":"120","CAN":"124","CAF":"140","TCD":"148","CHL":"152","CHN":"156","COL":"170","COM":"174","COG":"178","COD":"180","CRI":"188","CIV":"384","HRV":"191","CUB":"192","CYP":"196","CZE":"203","DNK":"208","DJI":"262","DOM":"214","ECU":"218","EGY":"818","SLV":"222","GNQ":"226","ERI":"232","EST":"233","SWZ":"748","ETH":"231","FJI":"242","FIN":"246","FRA":"250","GAB":"266","GMB":"270","GEO":"268","DEU":"276","GHA":"288","GRC":"300","GTM":"320","GIN":"324","GNB":"624","HTI":"332","HND":"340","HUN":"348","ISL":"352","IND":"356","IDN":"360","IRN":"364","IRQ":"368","IRL":"372","ISR":"376","ITA":"380","JAM":"388","JPN":"392","JOR":"400","KAZ":"398","KEN":"404","PRK":"408","KOR":"410","KWT":"414","KGZ":"417","LAO":"418","LVA":"428","LBN":"422","LSO":"426","LBR":"430","LBY":"434","LTU":"440","LUX":"442","MDG":"450","MWI":"454","MYS":"458","MDV":"462","MLI":"466","MLT":"470","MRT":"478","MUS":"480","MEX":"484","MDA":"498","MNG":"496","MNE":"499","MAR":"504","MOZ":"508","MMR":"104","NAM":"516","NPL":"524","NLD":"528","NZL":"554","NIC":"558","NER":"562","NGA":"566","MKD":"807","NOR":"578","OMN":"512","PAK":"586","PAN":"591","PNG":"598","PRY":"600","PER":"604","PHL":"608","POL":"616","PRT":"620","QAT":"634","ROU":"642","RUS":"643","RWA":"646","SAU":"682","SEN":"686","SRB":"688","SLE":"694","SGP":"702","SVK":"703","SVN":"705","SOM":"706","ZAF":"710","SSD":"728","ESP":"724","LKA":"144","SDN":"729","SUR":"740","SWE":"752","CHE":"756","SYR":"760","TWN":"158","TJK":"762","TZA":"834","THA":"764","TLS":"626","TGO":"768","TTO":"780","TUN":"788","TUR":"792","TKM":"795","UGA":"800","UKR":"804","ARE":"784","GBR":"826","USA":"840","URY":"858","UZB":"860","VEN":"862","VNM":"704","PSE":"275","YEM":"887","ZMB":"894","ZWE":"716"}
)}

function _numericEntityMap(rawData,alpha3Numeric)
{
  const m = new Map()
  rawData.forEach(d => {
    if (d.Code && alpha3Numeric[d.Code]) {
      m.set(alpha3Numeric[d.Code], d.Entity)
    }
  })
  return m
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["dealt-with-anxiety-depression-took-prescribed-medication.csv", {url: new URL("./files/638350ffe4b7e405984bb25ef7d82c1a53ffb2d89b0d91763c99eff4b55e8b221dc6c232ca921f3c595987b9da7f14b60c7e2458febfca4107fbcd0616c636bb.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["d3","topojson","world","numericEntityMap","dataByCountry","selectedCountries"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  main.variable(observer("world")).define("world", _world);
  main.variable(observer("topojson")).define("topojson", ["require"], _topojson);
  main.variable(observer("selectedCountries")).define("selectedCountries", _selectedCountries);
  main.variable(observer("valueCol")).define("valueCol", _valueCol);
  main.variable(observer("dataByCountry")).define("dataByCountry", ["rawData","valueCol"], _dataByCountry);
  main.variable(observer("alpha3Numeric")).define("alpha3Numeric", _alpha3Numeric);
  main.variable(observer("numericEntityMap")).define("numericEntityMap", ["rawData","alpha3Numeric"], _numericEntityMap);
  return main;
}
