function _1(md){return(
md`# Lifetime anxiety or depression`
)}

function _2(d3,topojson,world,numericEntityMap,dataByCountry,selectedCountries)
{
  const W = 900, H = 530;
  const mapMargin = { top: 68, right: 20, bottom: 95, left: 20 };
  const mapW = W - mapMargin.left - mapMargin.right;
  const mapH = H - mapMargin.top - mapMargin.bottom;
  const BAR_COLOR = "#6b8cbf";

  let mode = "map";

  // Escala: gris lavanda → azul → verde azulado (0% → 12%), igual que OWID
  const colorScale = d3.scaleSequential()
  .domain([0, 50])
  .interpolator(d3.interpolateRgbBasis([
    "#f0f0f8","#d4d8ee","#a8b8e0","#6a96cc","#2e72b0","#1a5090","#0d3268","#061840"
  ]));

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

  const btnMap = mkBtn("🌍 Map", true);
  const btnBar = mkBtn("📊 Bar", false);

  const svg = container.append("svg")
    .attr("viewBox",`0 0 ${W} ${H}`).attr("width",W).attr("height",H).style("background","#fff");

  // Defs
  const defs = svg.append("defs");
  defs.append("pattern").attr("id","hatchHeight").attr("patternUnits","userSpaceOnUse")
    .attr("width",6).attr("height",6).attr("patternTransform","rotate(45)")
    .append("line").attr("x1",0).attr("y1",0).attr("x2",0).attr("y2",6)
    .attr("stroke","#bbb").attr("stroke-width",2);

  const grad = defs.append("linearGradient").attr("id","gradHeight").attr("x1","0%").attr("x2","100%");
  d3.range(0, 51, 5).forEach(v =>
  grad.append("stop").attr("offset",`${(v/50)*100}%`).attr("stop-color",colorScale(v))
);

  // Título
  svg.append("text").attr("x",mapMargin.left).attr("y",20)
    .style("font-size","18px").style("font-weight","bold").style("fill","#111")
    .text("Share who report lifetime anxiety or depression, 2020");

  svg.append("foreignObject").attr("x",mapMargin.left).attr("y",26)
    .attr("width",W-mapMargin.left-20).attr("height",36)
    .append("xhtml:div").style("font-size","11px").style("color","#555").style("line-height","1.4")
    .text("The relative change in mean height for adult men born in 1996 versus those born in 1896. This represents the difference in mean height for men who reached their 18th birthday in 2014 relative to 1914.");

  const mainG = svg.append("g").attr("transform",`translate(${mapMargin.left},${mapMargin.top})`);

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","white")
    .attr("stroke","#ddd").attr("stroke-width",1)
    .attr("filter","drop-shadow(0 2px 6px rgba(0,0,0,0.13))");
  const ttCountry = ttG.append("text").attr("x",14).attr("y",24)
    .style("font-size","15px").style("font-weight","bold").style("fill","#111");
  const ttSub = ttG.append("text").attr("x",14).attr("y",40)
    .style("font-size","11px").style("fill","#888").text("Change in male height, 1896 → 1996");
  const ttVal = ttG.append("text").attr("x",14).attr("y",68)
    .style("font-size","22px").style("font-weight","bold").style("fill","#1a5090");

  function showTooltip(entity, value, mx, my) {
    ttCountry.text(entity);
    ttVal.text(`${d3.format(".2f")(value)}%`);
    const ttW=260,ttH=80;
    ttBg.attr("width",ttW).attr("height",ttH);
    ttG.style("display",null);
    const tx=mx+ttW+20>W?mx-ttW-8:mx+12;
    const ty=Math.max(0,Math.min(my-20,H-ttH-10));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }
  function hideTooltip(){ ttG.style("display","none"); }

  // ── RENDER MAP ────────────────────────────────────────────────────────────
  function renderMap(){
    mainG.selectAll("*").remove();

    mainG.selectAll(".country").data(countries.features).join("path")
      .attr("class","country").attr("d",pathGen)
      .attr("fill",d=>{
        const entity=numericEntityMap.get(String(d.id).padStart(3,"0"));
        if(!entity) return "#e8e8e8";
        const val=dataByCountry.get(entity);
        return val!=null ? colorScale(Math.max(0,Math.min(50,val))) : "url(#hatchHeight)";
      })
      .attr("stroke","#fff").attr("stroke-width",0.4)
      .on("mousemove",function(event,d){
        const entity=numericEntityMap.get(String(d.id).padStart(3,"0"));
        if(!entity) return hideTooltip();
        const val=dataByCountry.get(entity);
        if(val==null) return hideTooltip();
        d3.selectAll(".country").attr("stroke","#fff").attr("stroke-width",0.4);
        d3.select(this).attr("stroke","#333").attr("stroke-width",1.5).raise();
        const [mx,my]=d3.pointer(event,svg.node());
        showTooltip(entity,val,mx,my);
      })
      .on("mouseleave",function(){
        d3.selectAll(".country").attr("stroke","#fff").attr("stroke-width",0.4);
        hideTooltip();
      });

    // Leyenda gradiente
    const legW=500,legH=14;
    const legX=(mapW-legW)/2+20,legY=mapH+18;
    const legG=mainG.append("g").attr("transform",`translate(${legX},${legY})`);
    legG.append("rect").attr("x",-80).attr("width",50).attr("height",legH)
      .attr("fill","url(#hatchHeight)").attr("stroke","#ccc").attr("stroke-width",0.5);
    legG.append("text").attr("x",-80).attr("y",legH+14).style("font-size","11px").style("fill","#555").text("No data");
    legG.append("rect").attr("width",legW).attr("height",legH).attr("fill","url(#gradHeight)");
    legG.append("rect").attr("width",legW).attr("height",legH).attr("fill","none").attr("stroke","#ccc").attr("stroke-width",0.5);
    [0,5,10,15,20,25,30,35,40,45,50].forEach(v => {
  legG.append("text").attr("x",(v/50)*legW).attr("y",legH+14)
    .style("font-size","11px").style("fill","#555").style("text-anchor","middle").text(`${v}%`);
});
  }

  // ── RENDER BAR ────────────────────────────────────────────────────────────
  function renderBar(){
    mainG.selectAll("*").remove(); hideTooltip();

    const barData=selectedCountries
      .map(entity=>({entity, value:dataByCountry.get(entity)}))
      .filter(d=>d.value!=null)
      .sort((a,b)=>b.value-a.value);

    const bMargin={left:130,right:80};
    const bW=mapW-bMargin.left-bMargin.right;
    const rowH=Math.min(52,(mapH-20)/barData.length);
    const xB=d3.scaleLinear().domain([0,d3.max(barData,d=>d.value)*1.1]).range([0,bW]);
    const yB=d3.scaleBand().domain(barData.map(d=>d.entity))
      .range([10,barData.length*rowH+10]).padding(0.28);

    const bG=mainG.append("g").attr("transform",`translate(${bMargin.left},0)`);

    // Grid vertical
    [2,4,6,8,10,12].forEach(v=>{
      bG.append("line").attr("x1",xB(v)).attr("x2",xB(v))
        .attr("y1",10).attr("y2",barData.length*rowH+10)
        .attr("stroke","#efefef").attr("stroke-dasharray","3,3");
    });

    bG.selectAll(".clabel").data(barData).join("text").attr("class","clabel")
      .attr("x",-10).attr("y",d=>yB(d.entity)+yB.bandwidth()/2).attr("dy","0.35em")
      .attr("text-anchor","end").style("font-size","13px").style("font-weight","bold").style("fill","#333")
      .text(d=>d.entity);

    bG.selectAll(".bar").data(barData).join("rect").attr("class","bar")
      .attr("x",0).attr("y",d=>yB(d.entity))
      .attr("width",d=>xB(d.value)).attr("height",yB.bandwidth())
      .attr("fill",BAR_COLOR).attr("rx",2)
      .on("mousemove",function(event,d){
        const [mx,my]=d3.pointer(event,svg.node());
        showTooltip(d.entity,d.value,mx,my);
      }).on("mouseleave",hideTooltip);

    bG.selectAll(".vlabel").data(barData).join("text").attr("class","vlabel")
      .attr("x",d=>xB(d.value)+7).attr("y",d=>yB(d.entity)+yB.bandwidth()/2)
      .attr("dy","0.35em").style("font-size","13px").style("fill","#444")
      .text(d=>`${d3.format(".1f")(d.value)}%`);
  }

  // ── Pie ───────────────────────────────────────────────────────────────────
  svg.append("text").attr("x",mapMargin.left).attr("y",H-24)
    .style("font-size","10.5px").style("font-weight","bold").style("fill","#333").text("Data source: ");
  svg.append("text").attr("x",mapMargin.left+80).attr("y",H-24)
    .style("font-size","10.5px").style("fill","#333")
    .text("Wellcome and Gallup (2021) – processed by Our World in Data");
  svg.append("text").attr("x",mapMargin.left).attr("y",H-10)
    .style("font-size","10px").style("fill","#aaa").text("OurWorldInData.org/mental-health | CC BY");

  // ── Botones ───────────────────────────────────────────────────────────────
  function setMode(m){
    mode=m;
    btnMap.style("background",m==="map"?"#3a6fc4":"#fff").style("color",m==="map"?"#fff":"#333");
    btnBar.style("background",m==="bar"?"#3a6fc4":"#fff").style("color",m==="bar"?"#fff":"#333");
    hideTooltip();
    m==="map" ? renderMap() : renderBar();
  }
  btnMap.on("click",()=>setMode("map"));
  btnBar.on("click",()=>setMode("bar"));

  renderMap();
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _rawData(FileAttachment){return(
FileAttachment("share-who-report-lifetime-anxiety-or-depression.csv").csv({typed: true})
)}

function _world(){return(
fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(r => r.json())
)}

function _selectedCountries(){return(
["Latvia","Turkey","Vietnam","Iran","Canada","Mexico","Peru","Georgia","Taiwan","South Korea","Bolivia","Ecuador","China"]
)}

function _valueCol(){return(
"Share reporting lifetime anxiety or depression"
)}

function _dataByCountry(rawData,valueCol){return(
new Map(rawData.map(d => [d.Entity, +d[valueCol]]))
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
    ["share-who-report-lifetime-anxiety-or-depression.csv", {url: new URL("./files/16abe5d282343cb29522db40d3cfc031842c626f490345e37f3106254c474609c4f94eb55cc27805e717cd77bc6e2afc8e06eec70f1c83037aeb19a04f2beab1.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["d3","topojson","world","numericEntityMap","dataByCountry","selectedCountries"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("rawData")).define("rawData", ["FileAttachment"], _rawData);
  main.variable(observer("world")).define("world", _world);
  main.variable(observer("selectedCountries")).define("selectedCountries", _selectedCountries);
  main.variable(observer("valueCol")).define("valueCol", _valueCol);
  main.variable(observer("dataByCountry")).define("dataByCountry", ["rawData","valueCol"], _dataByCountry);
  main.variable(observer("alpha3Numeric")).define("alpha3Numeric", _alpha3Numeric);
  main.variable(observer("numericEntityMap")).define("numericEntityMap", ["rawData","alpha3Numeric"], _numericEntityMap);
  return main;
}
