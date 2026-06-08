function _1(md){return(
md`# Internet`
)}

function _2(maxYear,d3,topojson,world,rawData,getValueForYear,selectedCountries,minYear)
{
  // ── Dimensiones ───────────────────────────────────────────────────────────
  const W = 900, H = 600;
  const mapMargin = { top: 65, right: 20, bottom: 130, left: 20 };
  const mapW = W - mapMargin.left - mapMargin.right;
  const mapH = H - mapMargin.top - mapMargin.bottom;

  const BAR_COLOR = "#6b8cbf";

  // ── Estado ────────────────────────────────────────────────────────────────
  let mode = "map";   // "map" | "bar"
  let currentYear = maxYear;
  let playing = false, playInterval = null;

  // ── Escala de color (igual que OWID: verde claro → azul oscuro) ───────────
  const colorScale = d3.scaleSequential()
    .domain([0, 100])
    .interpolator(d3.interpolateRgbBasis([
      "#f0f9f0", "#c6e8c3", "#86cfbe", "#4db6c4", "#2185b8", "#0d5a9e", "#08306b"
    ]));

  // ── Proyección del mapa ───────────────────────────────────────────────────
  const projection = d3.geoNaturalEarth1()
    .scale(145)
    .translate([mapW / 2, mapH / 2 + 10]);

  const pathGen = d3.geoPath().projection(projection);

  // ── Datos geográficos ─────────────────────────────────────────────────────
  const countries = topojson.feature(world, world.objects.countries);

  // Mapa numérico → nombre de país (via rawData)
  const numToEntity = new Map();
  rawData.forEach(d => {
    if (d.Code) {
      // Buscar el código numérico en world
      // Guardamos alpha3 → entity ya lo tenemos; el mapa necesita id numérico
    }
  });

  // Construimos lookup: iso_numeric (string) → entity name
  // world-atlas country ids son códigos numéricos ISO 3166-1
  // Usamos un mapeo alpha3 → numeric vía d3.geoContains no disponible directamente
  // Mejor: hardcodeamos los países seleccionados con sus codes numéricos
  const alpha3ToNumeric = {
    BRA:"076",ARG:"032",MEX:"484",FRA:"250",ITA:"380",RUS:"643",
    KOR:"410",JPN:"392",IDN:"360",ZAF:"710",EGY:"818",MOZ:"508",
    PAK:"586",ETH:"231",BDI:"108"
  };

  // Lookup global: numeric id → entity (para todos los países del CSV con Code)
  const numericToEntity = new Map();
  rawData.forEach(d => {
    if (d.Code) {
      // Usamos d3-geo-projection o simplemente cargamos desde world-atlas
      // world.objects.countries features tienen id numérico
    }
  });

  // Construir lookup completo usando los ids de world-atlas
  // Los ids en world-atlas son numéricos; los codes en CSV son alpha-3
  // Usamos una tabla de conversión básica (todos los países del dataset)
  const alpha3Numeric = {"AFG":"004","ALB":"008","DZA":"012","AND":"020","AGO":"024","ARG":"032","ARM":"051","AUS":"036","AUT":"040","AZE":"031","BHS":"044","BHR":"048","BGD":"050","BLR":"112","BEL":"056","BLZ":"084","BEN":"204","BTN":"064","BOL":"068","BIH":"070","BWA":"072","BRA":"076","BRN":"096","BGR":"100","BFA":"854","BDI":"108","CPV":"132","KHM":"116","CMR":"120","CAN":"124","CAF":"140","TCD":"148","CHL":"152","CHN":"156","COL":"170","COM":"174","COG":"178","COD":"180","CRI":"188","CIV":"384","HRV":"191","CUB":"192","CYP":"196","CZE":"203","DNK":"208","DJI":"262","DOM":"214","ECU":"218","EGY":"818","SLV":"222","GNQ":"226","ERI":"232","EST":"233","SWZ":"748","ETH":"231","FJI":"242","FIN":"246","FRA":"250","GAB":"266","GMB":"270","GEO":"268","DEU":"276","GHA":"288","GRC":"300","GTM":"320","GIN":"324","GNB":"624","HTI":"332","HND":"340","HUN":"348","ISL":"352","IND":"356","IDN":"360","IRN":"364","IRQ":"368","IRL":"372","ISR":"376","ITA":"380","JAM":"388","JPN":"392","JOR":"400","KAZ":"398","KEN":"404","PRK":"408","KOR":"410","KWT":"414","KGZ":"417","LAO":"418","LVA":"428","LBN":"422","LSO":"426","LBR":"430","LBY":"434","LTU":"440","LUX":"442","MDG":"450","MWI":"454","MYS":"458","MDV":"462","MLI":"466","MLT":"470","MRT":"478","MUS":"480","MEX":"484","MDA":"498","MNG":"496","MNE":"499","MAR":"504","MOZ":"508","MMR":"104","NAM":"516","NPL":"524","NLD":"528","NZL":"554","NIC":"558","NER":"562","NGA":"566","MKD":"807","NOR":"578","OMN":"512","PAK":"586","PAN":"591","PNG":"598","PRY":"600","PER":"604","PHL":"608","POL":"616","PRT":"620","QAT":"634","ROU":"642","RUS":"643","RWA":"646","SAU":"682","SEN":"686","SRB":"688","SLE":"694","SGP":"702","SVK":"703","SVN":"705","SOM":"706","ZAF":"710","SSD":"728","ESP":"724","LKA":"144","SDN":"729","SUR":"740","SWE":"752","CHE":"756","SYR":"760","TWN":"158","TJK":"762","TZA":"834","THA":"764","TLS":"626","TGO":"768","TTO":"780","TUN":"788","TUR":"792","TKM":"795","UGA":"800","UKR":"804","ARE":"784","GBR":"826","USA":"840","URY":"858","UZB":"860","VEN":"862","VNM":"704","PSE":"275","YEM":"887","ZMB":"894","ZWE":"716"};

  // Mapa numeric → entity para todos los países del CSV
  const numericEntityMap = new Map();
  rawData.forEach(d => {
    if (d.Code && alpha3Numeric[d.Code]) {
      numericEntityMap.set(alpha3Numeric[d.Code], d.Entity);
    }
  });

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

  // Título dinámico
  const titleEl = svg.append("text")
    .attr("x", mapMargin.left).attr("y", 24)
    .style("font-size", "19px").style("font-weight", "bold").style("fill", "#111");

  svg.append("text")
    .attr("x", mapMargin.left).attr("y", 40)
    .style("font-size", "11.5px").style("fill", "#555")
    .text("Share of the population that has a mobile phone device with at least one active SIM card for personal use.");

  // Grupo mapa/bar
  const mainG = svg.append("g").attr("transform", `translate(${mapMargin.left}, ${mapMargin.top})`);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display", "none");
  const ttBg = ttG.append("rect").attr("rx", 6).attr("fill", "white")
    .attr("stroke", "#ddd").attr("stroke-width", 1)
    .attr("filter", "drop-shadow(0 2px 6px rgba(0,0,0,0.15))");
  const ttCountry = ttG.append("text").attr("x", 14).attr("y", 22)
    .style("font-size", "14px").style("font-weight", "bold").style("fill", "#111");
  const ttYear = ttG.append("text").attr("x", 14).attr("y", 38)
    .style("font-size", "11px").style("fill", "#888");
  const ttVal = ttG.append("text").attr("x", 14).attr("y", 62)
    .style("font-size", "20px").style("font-weight", "bold").style("fill", "#2185b8");
  const ttNote = ttG.append("text").attr("x", 14).attr("y", 80)
    .style("font-size", "10px").style("fill", "#999").style("font-style", "italic");

  function showTooltip(entity, result, mx, my) {
    if (!result) return;
    ttCountry.text(entity);
    ttYear.text(`● ${result.year}`);
    ttVal.text(`${d3.format(".1f")(result.value)}%`);
    ttNote.text(result.estimated ? `ⓘ Data not available for ${currentYear}. Showing closest available data point instead` : "");
    const ttW = 280, ttH = result.estimated ? 96 : 78;
    ttBg.attr("width", ttW).attr("height", ttH);
    ttG.style("display", null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 12;
    const ty = Math.max(0, Math.min(my - 20, H - ttH - 10));
    ttG.attr("transform", `translate(${tx},${ty})`);
  }

  function hideTooltip() { ttG.style("display", "none"); }

  // ── RENDER MAP ────────────────────────────────────────────────────────────
  function renderMap() {
    titleEl.text(`Share of the population that owns a mobile phone, ${currentYear}`);
    mainG.selectAll("*").remove();

    // Países
    mainG.selectAll(".country")
      .data(countries.features)
      .join("path")
        .attr("class", "country")
        .attr("d", pathGen)
        .attr("fill", d => {
          const entity = numericEntityMap.get(String(d.id).padStart(3, "0"));
          if (!entity) return "#e0e0e0";
          const result = getValueForYear(entity, currentYear);
          return result ? colorScale(result.value) : "url(#hatch)";
        })
        .attr("stroke", "#fff").attr("stroke-width", 0.4)
        .on("mousemove", function(event, d) {
          const entity = numericEntityMap.get(String(d.id).padStart(3, "0"));
          if (!entity) return hideTooltip();
          const result = getValueForYear(entity, currentYear);
          const [mx, my] = d3.pointer(event, svg.node());
          // Resaltar país
          d3.selectAll(".country").attr("stroke", "#fff").attr("stroke-width", 0.4);
          d3.select(this).attr("stroke", "#222").attr("stroke-width", 1.5).raise();
          showTooltip(entity, result, mx, my);
        })
        .on("mouseleave", function() {
          d3.selectAll(".country").attr("stroke", "#fff").attr("stroke-width", 0.4);
          hideTooltip();
        });

    // Patrón de rayas para "sin datos"
    const defs = svg.select("defs").empty() ? svg.append("defs") : svg.select("defs");
    defs.selectAll("#hatch").data([null]).join("pattern")
      .attr("id", "hatch").attr("patternUnits", "userSpaceOnUse")
      .attr("width", 6).attr("height", 6)
      .attr("patternTransform", "rotate(45)")
      .selectAll("line").data([null]).join("line")
        .attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 6)
        .attr("stroke", "#bbb").attr("stroke-width", 2);

    // ── Leyenda de color ──────────────────────────────────────────────────
    const legW = 340, legH = 12;
    const legX = (mapW - legW) / 2 + 40;
    const legY = mapH + 10;
    const legG = mainG.append("g").attr("transform", `translate(${legX}, ${legY})`);

    // "No data" con rayas
    legG.append("rect").attr("x", -90).attr("width", 40).attr("height", legH)
      .attr("fill", "url(#hatch)").attr("stroke", "#ccc").attr("stroke-width", 0.5);
    legG.append("text").attr("x", -90).attr("y", legH + 14)
      .style("font-size", "11px").style("fill", "#555").text("No data");

    // Gradiente
    const gradId = "mapGrad";
    const defs2 = svg.select("defs");
    defs2.selectAll(`#${gradId}`).data([null]).join("linearGradient")
      .attr("id", gradId).attr("x1", "0%").attr("x2", "100%")
      .selectAll("stop")
      .data(d3.range(0, 101, 10))
      .join("stop")
        .attr("offset", d => `${d}%`)
        .attr("stop-color", d => colorScale(d));

    legG.append("rect").attr("width", legW).attr("height", legH)
      .attr("fill", `url(#${gradId})`);

    // Ticks de leyenda
    [40, 50, 60, 70, 80, 90, 100].forEach(v => {
      const x = ((v - 0) / 100) * legW;
      legG.append("text").attr("x", x).attr("y", legH + 14)
        .style("font-size", "11px").style("fill", "#555").style("text-anchor", "middle")
        .text(`${v}%`);
    });
  }

  // ── RENDER BAR ────────────────────────────────────────────────────────────
  function renderBar() {
    titleEl.text(`Share of the population that owns a mobile phone, ${currentYear}`);
    mainG.selectAll("*").remove();
    hideTooltip();

    // Datos de los países seleccionados para el año actual
    const barData = selectedCountries.map(entity => {
      const result = getValueForYear(entity, currentYear);
      return { entity, result };
    }).filter(d => d.result !== null)
      .sort((a, b) => b.result.value - a.result.value);

    const bMargin = { left: 110, right: 60 };
    const bW = mapW - bMargin.left - bMargin.right;
    const rowH = 32;
    const bH = barData.length * rowH;

    const xB = d3.scaleLinear().domain([0, 100]).range([0, bW]);
    const yB = d3.scaleBand().domain(barData.map(d => d.entity)).range([0, bH]).padding(0.25);

    const bG = mainG.append("g").attr("transform", `translate(${bMargin.left}, 10)`);

    // Eje Y (países)
    bG.selectAll(".country-label").data(barData).join("text")
      .attr("class", "country-label")
      .attr("x", -8).attr("y", d => yB(d.entity) + yB.bandwidth() / 2)
      .attr("dy", "0.35em").attr("text-anchor", "end")
      .style("font-size", "13px").style("font-weight", "bold").style("fill", "#333")
      .text(d => d.entity);

    // Barras
    bG.selectAll(".bar").data(barData).join("rect")
      .attr("class", "bar")
      .attr("x", 0).attr("y", d => yB(d.entity))
      .attr("width", d => xB(d.result.value))
      .attr("height", yB.bandwidth())
      .attr("fill", BAR_COLOR).attr("rx", 2);

    // Labels valor
    bG.selectAll(".bar-label").data(barData).join("text")
      .attr("class", "bar-label")
      .attr("x", d => xB(d.result.value) + 6)
      .attr("y", d => yB(d.entity) + yB.bandwidth() / 2)
      .attr("dy", "0.35em")
      .style("font-size", "13px").style("fill", "#444")
      .text(d => {
        const pct = `${Math.round(d.result.value)}%`;
        return d.result.estimated ? `${pct} in ${d.result.year}` : pct;
      });

    // Hover
    bG.selectAll(".bar")
      .on("mousemove", function(event, d) {
        const [mx, my] = d3.pointer(event, svg.node());
        showTooltip(d.entity, d.result, mx, my);
      })
      .on("mouseleave", hideTooltip);
  }

  // ── Slider ────────────────────────────────────────────────────────────────
  const sliderY = H - 68;
  const sliderX = 40;
  const sliderW = W - sliderX - 40;

  const sliderG = svg.append("g").attr("transform", `translate(${sliderX}, ${sliderY})`);

  sliderG.append("line").attr("x1", 0).attr("x2", sliderW)
    .attr("y1", 0).attr("y2", 0)
    .attr("stroke", "#ddd").attr("stroke-width", 4).attr("stroke-linecap", "round");

  const activeTrack = sliderG.append("line").attr("y1", 0).attr("y2", 0)
    .attr("stroke", "#ddd").attr("stroke-width", 4).attr("stroke-linecap", "round");

  const sliderScale = d3.scaleLinear()
    .domain([minYear, maxYear]).range([0, sliderW]).clamp(true);

  sliderG.append("text").attr("x", 0).attr("y", 22)
    .style("font-size", "12px").style("fill", "#555").style("text-anchor", "middle")
    .text(minYear);

  sliderG.append("text").attr("x", sliderW).attr("y", 22)
    .style("font-size", "12px").style("fill", "#555").style("text-anchor", "middle")
    .text(maxYear);

  const handle = sliderG.append("circle").attr("r", 9)
    .attr("fill", "#555").attr("stroke", "#fff").attr("stroke-width", 2)
    .style("cursor", "ew-resize");

  const playBtn = sliderG.append("g")
    .attr("transform", `translate(-28, 0)`).style("cursor", "pointer");
  playBtn.append("circle").attr("r", 14).attr("fill", "#555");
  const playIcon = playBtn.append("text")
    .attr("text-anchor", "middle").attr("dy", "0.35em")
    .style("font-size", "14px").style("fill", "#fff").text("▶");

  function updateSlider() {
    const x = sliderScale(currentYear);
    handle.attr("cx", x);
    activeTrack.attr("x1", 0).attr("x2", x).attr("stroke", "#3a6fc4");
  }

  function stopPlay() {
    playing = false; clearInterval(playInterval); playIcon.text("▶");
  }

  function redraw() {
    if (mode === "map") renderMap(); else renderBar();
    updateSlider();
  }

  handle.call(d3.drag().on("drag", function(event) {
    stopPlay();
    currentYear = Math.max(minYear, Math.min(maxYear, Math.round(sliderScale.invert(event.x))));
    redraw();
  }));

  sliderG.append("rect")
    .attr("x", 0).attr("y", -10).attr("width", sliderW).attr("height", 20)
    .attr("fill", "none").attr("pointer-events", "all").style("cursor", "pointer")
    .on("click", function(event) {
      stopPlay();
      const [mx] = d3.pointer(event);
      currentYear = Math.max(minYear, Math.min(maxYear, Math.round(sliderScale.invert(mx))));
      redraw();
    });

  playBtn.on("click", () => {
    if (playing) { stopPlay(); } else {
      playing = true; playIcon.text("⏸");
      if (currentYear >= maxYear) currentYear = minYear;
      playInterval = setInterval(() => {
        currentYear = Math.min(currentYear + 1, maxYear);
        redraw();
        if (currentYear >= maxYear) stopPlay();
      }, 400);
    }
  });

  // ── Pie ───────────────────────────────────────────────────────────────────
  svg.append("text").attr("x", mapMargin.left).attr("y", H - 24)
    .style("font-size", "10.5px").style("font-weight", "bold").style("fill", "#333")
    .text("Data source: ");
  svg.append("text").attr("x", mapMargin.left + 80).attr("y", H - 24)
    .style("font-size", "10.5px").style("fill", "#333")
    .text("International Telecommunication Union – processed by Our World in Data");
  svg.append("text").attr("x", mapMargin.left).attr("y", H - 10)
    .style("font-size", "10px").style("fill", "#aaa")
    .text("OurWorldInData.org/technological-change | CC BY");

  // ── Botones ───────────────────────────────────────────────────────────────
  function setMode(m) {
    mode = m;
    btnMap.style("background", m === "map" ? "#3a6fc4" : "#fff").style("color", m === "map" ? "#fff" : "#333");
    btnBar.style("background", m === "bar" ? "#3a6fc4" : "#fff").style("color", m === "bar" ? "#fff" : "#333");
    hideTooltip();
    redraw();
  }

  btnMap.on("click", () => setMode("map"));
  btnBar.on("click", () => setMode("bar"));

  // ── Init ──────────────────────────────────────────────────────────────────
  redraw();

  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _topojson(require){return(
require("topojson-client@3")
)}

function _rawData(FileAttachment){return(
FileAttachment("share-population-mobile-phone.csv").csv({typed: true})
)}

function _world(){return(
fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(r => r.json())
)}

function _selectedCountries(){return(
[
  "Brazil", "Argentina", "Mexico", "France", "Italy", "Russia",
  "South Korea", "Japan", "Indonesia", "South Africa",
  "Egypt", "Mozambique", "Pakistan", "Ethiopia", "Burundi"
]
)}

function _valueCol(){return(
"Proportion of individuals who own a mobile telephone"
)}

function _allYears(rawData){return(
[...new Set(rawData.map(d => d.Year))].sort()
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

function _isoAlpha3ToNum(rawData){return(
new Map(rawData.map(d => [d.Code, d.Entity]))
)}

function _getValueForYear(dataByCountry,valueCol){return(
function getValueForYear(entity, year) {
  const rows = dataByCountry.get(entity)
  if (!rows) return null
  // Valor exacto del año
  const exact = rows.find(r => r.Year === year)
  if (exact) return { value: exact[valueCol], year: exact.Year, estimated: false }
  // Si no hay dato, buscar el más cercano anterior
  const before = rows.filter(r => r.Year < year).sort((a,b) => b.Year - a.Year)
  if (before.length) return { value: before[0][valueCol], year: before[0].Year, estimated: true }
  return null
}
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["share-population-mobile-phone.csv", {url: new URL("./files/c256f9c32d377a2292e1a55c0c2d9ba7ecb2ec5720de1e3225767a13c5a4d38290ff09fba4c20d17c86ac7707f8ce7cbdfb9a6ef89c96b5ac67bd452216cc7d0.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["maxYear","d3","topojson","world","rawData","getValueForYear","selectedCountries","minYear"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("topojson")).define("topojson", ["require"], _topojson);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  main.variable(observer("world")).define("world", _world);
  main.variable(observer("selectedCountries")).define("selectedCountries", _selectedCountries);
  main.variable(observer("valueCol")).define("valueCol", _valueCol);
  main.variable(observer("allYears")).define("allYears", ["rawData"], _allYears);
  main.variable(observer("minYear")).define("minYear", ["allYears"], _minYear);
  main.variable(observer("maxYear")).define("maxYear", ["allYears"], _maxYear);
  main.variable(observer("dataByCountry")).define("dataByCountry", ["d3","rawData"], _dataByCountry);
  main.variable(observer("isoAlpha3ToNum")).define("isoAlpha3ToNum", ["rawData"], _isoAlpha3ToNum);
  main.variable(observer("getValueForYear")).define("getValueForYear", ["dataByCountry","valueCol"], _getValueForYear);
  return main;
}
