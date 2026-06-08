function _1(md){return(
md`# Stand-alone policy or plan for mental health`
)}

function _2(rawData,valueCol,d3,topojson,world,numericEntityMap)
{
  const W = 900, H = 560;
  const mapMargin = { top: 62, right: 20, bottom: 110, left: 20 };
  const mapW = W - mapMargin.left - mapMargin.right;
  const mapH = H - mapMargin.top - mapMargin.bottom;

  const COLOR_YES    = "#6aabcf";
  const COLOR_NO     = "#e8a07a";
  const COLOR_NODATA = "url(#hatchPOL)";
  const COLOR_NONE   = "#e8e8e8";

  const years = [...new Set(rawData.map(d => d.Year))].sort((a,b) => a-b);
  let currentYear = years[years.length - 1];
  let playing = false;
  let timer = null;

  // Build lookup: Map<year, Map<entity, value>>
  const dataByYear = new Map();
  years.forEach(y => {
    dataByYear.set(y, new Map(
      rawData.filter(d => d.Year === y).map(d => [d.Entity, d[valueCol]])
    ));
  });

  const projection = d3.geoNaturalEarth1().scale(145).translate([mapW / 2, mapH / 2 + 10]);
  const pathGen = d3.geoPath().projection(projection);
  const countries = topojson.feature(world, world.objects.countries);

  const container = d3.create("div").style("font-family", "sans-serif").style("user-select", "none");

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`).attr("width", W).attr("height", H).style("background", "#fff");

  const defs = svg.append("defs");
  defs.append("pattern").attr("id", "hatchPOL").attr("patternUnits", "userSpaceOnUse")
    .attr("width", 6).attr("height", 6).attr("patternTransform", "rotate(45)")
    .append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 6)
    .attr("stroke", "#bbb").attr("stroke-width", 2);

  // Title
  svg.append("text").attr("x", mapMargin.left).attr("y", 20)
    .style("font-size", "17px").style("font-weight", "bold").style("fill", "#111")
    .text(`Stand-alone policy or plan for mental health, ${currentYear}`);

  svg.append("foreignObject").attr("x", mapMargin.left).attr("y", 26)
    .attr("width", W - mapMargin.left - 20).attr("height", 36)
    .append("xhtml:div").style("font-size", "11px").style("color", "#555").style("line-height", "1.4")
    .text("A mental health plan is a detailed plan for the promotion of mental health, the prevention of mental disorders, and treatment and rehabilitation. It specifies crucial elements such as the budget and timeframe, and specific targets that will be met.");

  const titleText = svg.select("text");

  const mainG = svg.append("g").attr("transform", `translate(${mapMargin.left},${mapMargin.top})`);

  // Tooltip
  const ttG = svg.append("g").style("display", "none");
  const ttBg = ttG.append("rect").attr("rx", 6).attr("fill", "white")
    .attr("stroke", "#ddd").attr("stroke-width", 1)
    .attr("filter", "drop-shadow(0 2px 6px rgba(0,0,0,0.13))");
  const ttCountry = ttG.append("text").attr("x", 14).attr("y", 24)
    .style("font-size", "15px").style("font-weight", "bold").style("fill", "#111");
  ttG.append("text").attr("x", 14).attr("y", 40)
    .style("font-size", "11px").style("fill", "#888").text("Stand-alone mental health policy");
  const ttVal = ttG.append("text").attr("x", 14).attr("y", 68)
    .style("font-size", "20px").style("font-weight", "bold").style("fill", "#333");

  function showTooltip(entity, value, mx, my) {
    ttCountry.text(entity);
    ttVal.text(value);
    ttVal.style("fill", value === "Yes" || value === "YES" ? COLOR_YES : COLOR_NO);
    const ttW = 260, ttH = 80;
    ttBg.attr("width", ttW).attr("height", ttH);
    ttG.style("display", null);
    const tx = mx + ttW + 20 > W ? mx - ttW - 8 : mx + 12;
    const ty = Math.max(0, Math.min(my - 20, H - ttH - 10));
    ttG.attr("transform", `translate(${tx},${ty})`);
  }
  function hideTooltip() { ttG.style("display", "none"); }

  function getFill(val) {
    if (val == null) return COLOR_NODATA;
    const v = String(val).toLowerCase();
    if (v === "yes") return COLOR_YES;
    if (v === "no")  return COLOR_NO;
    return COLOR_NODATA;
  }

  function renderMap() {
    const yearData = dataByYear.get(currentYear) || new Map();

    mainG.selectAll(".country").data(countries.features).join("path")
      .attr("class", "country").attr("d", pathGen)
      .attr("fill", d => {
        const entity = numericEntityMap.get(String(d.id).padStart(3, "0"));
        if (!entity) return COLOR_NONE;
        const val = yearData.get(entity);
        return getFill(val);
      })
      .attr("stroke", "#fff").attr("stroke-width", 0.4)
      .on("mousemove", function(event, d) {
        const entity = numericEntityMap.get(String(d.id).padStart(3, "0"));
        if (!entity) return hideTooltip();
        const val = dataByYear.get(currentYear)?.get(entity);
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
  }

  // ── Legend ──────────────────────────────────────────────────────────────
  const legY = mapH + 20;
  const legG = mainG.append("g").attr("transform", `translate(${mapW/2 - 120},${legY})`);

  // No swatch
  legG.append("rect").attr("x", 0).attr("width", 18).attr("height", 18).attr("rx", 3).attr("fill", COLOR_NO);
  legG.append("text").attr("x", 24).attr("y", 13).style("font-size", "13px").style("fill", "#333").text("No");
  // Yes swatch
  legG.append("rect").attr("x", 70).attr("width", 18).attr("height", 18).attr("rx", 3).attr("fill", COLOR_YES);
  legG.append("text").attr("x", 94).attr("y", 13).style("font-size", "13px").style("fill", "#333").text("Yes");
  // No data swatch
  legG.append("rect").attr("x", 145).attr("width", 18).attr("height", 18).attr("rx", 3)
    .attr("fill", "url(#hatchPOL)").attr("stroke", "#ccc").attr("stroke-width", 0.5);
  legG.append("text").attr("x", 169).attr("y", 13).style("font-size", "13px").style("fill", "#333").text("No data");

  // ── Time slider ─────────────────────────────────────────────────────────
  const sliderY = H - 68;
  const sliderX0 = 60, sliderX1 = W - 60;
  const sliderW = sliderX1 - sliderX0;

  // Play button
  const playBtn = svg.append("text")
    .attr("x", 24).attr("y", sliderY + 6)
    .style("font-size", "20px").style("cursor", "pointer").style("fill", "#555")
    .text("▶");

  // Year labels
  svg.append("text").attr("x", sliderX0).attr("y", sliderY + 6)
    .style("font-size", "13px").style("fill", "#888").style("text-anchor", "middle")
    .text(years[0]);
  svg.append("text").attr("x", sliderX1).attr("y", sliderY + 6)
    .style("font-size", "13px").style("fill", "#888").style("text-anchor", "middle")
    .text(years[years.length - 1]);

  // Track
  svg.append("line")
    .attr("x1", sliderX0).attr("x2", sliderX1)
    .attr("y1", sliderY).attr("y2", sliderY)
    .attr("stroke", "#ccc").attr("stroke-width", 4).attr("stroke-linecap", "round");

  const xScale = d3.scalePoint().domain(years).range([sliderX0, sliderX1]);

  const handle = svg.append("circle")
    .attr("cy", sliderY).attr("r", 10)
    .attr("fill", "#555").style("cursor", "pointer");

  function updateYear(y) {
    currentYear = y;
    handle.attr("cx", xScale(y));
    titleText.text(`Stand-alone policy or plan for mental health, ${y}`);
    renderMap();
    hideTooltip();
  }

  updateYear(currentYear);

  // Drag on track
  svg.append("rect")
    .attr("x", sliderX0).attr("y", sliderY - 12)
    .attr("width", sliderW).attr("height", 24)
    .attr("fill", "transparent").style("cursor", "pointer")
    .on("click", function(event) {
      const [mx] = d3.pointer(event);
      const closest = years.reduce((a, b) =>
        Math.abs(xScale(a) - mx) < Math.abs(xScale(b) - mx) ? a : b
      );
      updateYear(closest);
    });

  handle.call(d3.drag().on("drag", function(event) {
    const mx = Math.max(sliderX0, Math.min(sliderX1, event.x));
    const closest = years.reduce((a, b) =>
      Math.abs(xScale(a) - mx) < Math.abs(xScale(b) - mx) ? a : b
    );
    updateYear(closest);
  }));

  // Play/pause
  function stepPlay() {
    const idx = years.indexOf(currentYear);
    if (idx < years.length - 1) {
      updateYear(years[idx + 1]);
    } else {
      clearInterval(timer);
      playing = false;
      playBtn.text("▶");
    }
  }

  playBtn.on("click", () => {
    if (playing) {
      clearInterval(timer);
      playing = false;
      playBtn.text("▶");
    } else {
      if (currentYear === years[years.length - 1]) updateYear(years[0]);
      playing = true;
      playBtn.text("⏸");
      timer = setInterval(stepPlay, 900);
    }
  });

  // Footer
  svg.append("text").attr("x", mapMargin.left).attr("y", H - 24)
    .style("font-size", "10.5px").style("font-weight", "bold").style("fill", "#333").text("Data source: ");
  svg.append("text").attr("x", mapMargin.left + 80).attr("y", H - 24)
    .style("font-size", "10.5px").style("fill", "#333")
    .text("World Health Organization - Global Health Observatory (2025) – processed by Our World in Data");
  svg.append("text").attr("x", mapMargin.left).attr("y", H - 10)
    .style("font-size", "10px").style("fill", "#aaa").text("OurWorldInData.org/mental-health | CC BY");

  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _topojson(require){return(
require("topojson-client@3")
)}

function _rawData(FileAttachment){return(
FileAttachment("stand-alone-policy-or-plan-for-mental-health.csv").csv({ typed: true })
)}

function _world(){return(
fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(r => r.json())
)}

function _selectedCountries(){return(
["China"]
)}

function _valueCol(){return(
"Stand-alone policy or plan for mental health"
)}

function _dataByCountry(rawData,valueCol){return(
new Map(rawData.filter(d => d.Year === 2017).map(d => [d.Entity, d[valueCol]]))
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
    ["stand-alone-policy-or-plan-for-mental-health.csv", {url: new URL("./files/468f7d4bab0fc13756ba61acf457575c7829bb2ea23abb04eb72129261f6d05b560a791d29be98913e4d2a110910810180ec11340cb9e6fb6f8cedb38c5ff210.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["rawData","valueCol","d3","topojson","world","numericEntityMap"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("topojson")).define("topojson", ["require"], _topojson);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  main.variable(observer("world")).define("world", _world);
  main.variable(observer("selectedCountries")).define("selectedCountries", _selectedCountries);
  main.variable(observer("valueCol")).define("valueCol", _valueCol);
  main.variable(observer("dataByCountry")).define("dataByCountry", ["rawData","valueCol"], _dataByCountry);
  main.variable(observer("alpha3Numeric")).define("alpha3Numeric", _alpha3Numeric);
  main.variable(observer("numericEntityMap")).define("numericEntityMap", ["rawData","alpha3Numeric"], _numericEntityMap);
  return main;
}
