function _1(md){return(
md`# Child Poverty in California`
)}

function _2(d3,data)
{
  const CENTRAL_VALLEY = new Set([
    "California","Fresno","Kern","Kings","Madera",
    "Merced","Sacramento","San Joaquin",
    "Stanislaus","Sutter","Tulare","Yolo","Yuba"
  ]);

  let activeFilter = "Central Valley";

  const W = 900, H = 440;
  const margin = { top: 30, right: 20, bottom: 70, left: 65 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const container = d3.create("div").style("font-family","sans-serif");

  // ── Filter buttons ────────────────────────────────────────────────────────
  const btnRow = container.append("div").style("margin-bottom","10px");

  const buttons = ["Central Valley","All California"].map(label => {
    const btn = btnRow.append("button")
      .text(label)
      .style("padding","5px 14px").style("margin-right","6px")
      .style("border","1px solid #ccc").style("border-radius","4px")
      .style("cursor","pointer").style("font-size","12px")
      .style("background", label === activeFilter ? "#1a3a5c" : "#f5f5f5")
      .style("color",       label === activeFilter ? "#fff"    : "#333");
    btn.on("click", () => {
      activeFilter = label;
      buttons.forEach(b => {
        b.style("background", b.text() === activeFilter ? "#1a3a5c" : "#f5f5f5")
         .style("color",      b.text() === activeFilter ? "#fff"    : "#333");
      });
      redraw();
    });
    return btn;
  });

  const svg = container.append("svg")
    .attr("viewBox",`0 0 ${W} ${H}`)
    .attr("width",W).attr("height",H)
    .style("background","#fff");

  const g = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().range([0, innerW]).padding(0.22);
  const y = d3.scaleLinear().range([innerH, 0]);

  const gridG  = g.append("g");
  const xAxisG = g.append("g").attr("transform",`translate(0,${innerH})`);
  const yAxisG = g.append("g");

  g.append("text")
    .attr("transform","rotate(-90)")
    .attr("x",-innerH/2).attr("y",-54)
    .attr("text-anchor","middle")
    .style("font-size","11px").style("fill","#666")
    .text("Percentage of Children (Age 0–17) in Poverty and Deep Poverty");

  const barsG = g.append("g");

  // ── Legend ────────────────────────────────────────────────────────────────
  const legendG = svg.append("g").attr("transform",`translate(${margin.left},${H-18})`);
  [{color:"#1a3a5c",label:"Deep Poverty"},{color:"#4a9b8e",label:"Total Poverty (incl. deep)"}]
    .forEach((item,i) => {
      legendG.append("rect").attr("x",i*200).attr("y",0).attr("width",12).attr("height",12)
        .attr("rx",2).attr("fill",item.color);
      legendG.append("text").attr("x",i*200+16).attr("y",10)
        .style("font-size","11px").style("fill","#333").text(item.label);
    });

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const ttG = svg.append("g").style("display","none").style("pointer-events","none");
  const ttBg = ttG.append("rect").attr("rx",6).attr("fill","#1e2d3d")
    .attr("filter","drop-shadow(0 2px 6px rgba(0,0,0,0.25))");
  ttG.append("text").attr("class","tt-county").attr("x",12).attr("y",20)
    .style("font-size","13px").style("font-weight","bold").style("fill","#fff");
  ttG.append("text").attr("class","tt-deep").attr("x",12).attr("y",38)
    .style("font-size","11px").style("fill","#8ecae6");
  ttG.append("text").attr("class","tt-total").attr("x",12).attr("y",54)
    .style("font-size","11px").style("fill","#4a9b8e");
  ttG.append("text").attr("class","tt-nond").attr("x",12).attr("y",70)
    .style("font-size","11px").style("fill","#aaccdd");

  function showTT(event, d) {
    ttG.select(".tt-county").text(d.county);
    ttG.select(".tt-deep").text(`Deep Poverty: ${d3.format(".1%")(d.deep)}`);
    ttG.select(".tt-total").text(`Total Poverty: ${d3.format(".1%")(d.total)}`);
    ttG.select(".tt-nond").text(`Non-deep portion: ${d3.format(".1%")(d.poverty)}`);
    ttBg.attr("width",210).attr("height",82);
    ttG.style("display",null);
    const [mx,my] = d3.pointer(event, svg.node());
    const tx = mx+220>W ? mx-220 : mx+12;
    const ty = Math.max(0, Math.min(my-20, H-90));
    ttG.attr("transform",`translate(${tx},${ty})`);
  }
  function hideTT() { ttG.style("display","none"); }

  // ── Redraw ────────────────────────────────────────────────────────────────
  function redraw() {
    const activeData = activeFilter === "Central Valley"
      ? data.filter(d => CENTRAL_VALLEY.has(d.county))
      : data;

    x.domain(activeData.map(d => d.county));
    y.domain([0, d3.max(activeData, d => d.total) * 1.08]);

    gridG.call(d3.axisLeft(y).ticks(6).tickSize(-innerW).tickFormat(""))
      .call(gg => gg.select(".domain").remove())
      .call(gg => gg.selectAll(".tick line")
        .attr("stroke","#e8e8e8").attr("stroke-dasharray","3,3"));

    xAxisG.call(d3.axisBottom(x))
      .call(ax => ax.select(".domain").attr("stroke","#ccc"))
      .call(ax => ax.selectAll(".tick line").remove())
      .selectAll("text")
        .style("text-anchor","middle").style("font-size","11px");

    yAxisG.call(d3.axisLeft(y).ticks(6).tickFormat(v => d3.format(".0%")(v)))
      .call(ax => ax.select(".domain").remove())
      .call(ax => ax.selectAll(".tick line").remove());

    const groups = barsG.selectAll(".bar-group")
      .data(activeData, d => d.county);

    groups.exit().remove();

    const entering = groups.enter().append("g")
      .attr("class","bar-group")
      .attr("transform", d => `translate(${x(d.county)},0)`);

    entering.append("rect").attr("class","bar-poverty");
    entering.append("rect").attr("class","bar-deep");
    entering.append("text").attr("class","bar-label")
      .attr("text-anchor","middle")
      .style("font-size","9px").style("fill","#333");

    const all = entering.merge(groups);

    all.attr("transform", d => `translate(${x(d.county)},0)`);

    all.select(".bar-poverty")
      .attr("x",0).attr("width",x.bandwidth())
      .attr("y", d => y(d.total))
      .attr("height", d => innerH - y(d.total))
      .attr("fill","#4a9b8e");

    all.select(".bar-deep")
      .attr("x",0).attr("width",x.bandwidth())
      .attr("y", d => y(d.deep))
      .attr("height", d => innerH - y(d.deep))
      .attr("fill","#1a3a5c");

    all.select(".bar-label")
      .attr("x", x.bandwidth()/2)
      .attr("y", d => y(d.total) - 4)
      .text(d => d3.format(".1%")(d.total));

    all.selectAll("rect")
      .on("mousemove", (event,d) => showTT(event,d))
      .on("mouseleave", hideTT);
  }

  redraw();
  return container.node();
}


function _data()
{
  const raw = [
    { county: "Alameda",         deep: 0.058985, poverty: 0.065409 },
    { county: "Butte",           deep: 0.069171, poverty: 0.150822 },
    { county: "California",      deep: 0.080781, poverty: 0.118442 },
    { county: "Contra Costa",    deep: 0.040934, poverty: 0.061332 },
    { county: "El Dorado",       deep: 0.011970, poverty: 0.046250 },
    { county: "Fresno",          deep: 0.190797, poverty: 0.187995 },
    { county: "Humboldt",        deep: 0.044260, poverty: 0.126287 },
    { county: "Imperial",        deep: 0.161810, poverty: 0.175344 },
    { county: "Kern",            deep: 0.140649, poverty: 0.181997 },
    { county: "Kings",           deep: 0.078207, poverty: 0.122584 },
    { county: "Los Angeles",     deep: 0.089131, poverty: 0.145090 },
    { county: "Madera",          deep: 0.137757, poverty: 0.185982 },
    { county: "Marin",           deep: 0.029463, poverty: 0.066775 },
    { county: "Mendocino",       deep: 0.156189, poverty: 0.117628 },
    { county: "Merced",          deep: 0.121500, poverty: 0.149692 },
    { county: "Monterey",        deep: 0.042380, poverty: 0.146488 },
    { county: "Napa",            deep: 0.025909, poverty: 0.026250 },
    { county: "Nevada",          deep: 0.032079, poverty: 0.051188 },
    { county: "Orange",          deep: 0.054647, poverty: 0.088966 },
    { county: "Placer",          deep: 0.048511, poverty: 0.024539 },
    { county: "Riverside",       deep: 0.079866, poverty: 0.131467 },
    { county: "Sacramento",      deep: 0.100615, poverty: 0.137173 },
    { county: "San Bernardino",  deep: 0.107151, poverty: 0.152499 },
    { county: "San Diego",       deep: 0.068348, poverty: 0.095215 },
    { county: "San Francisco",   deep: 0.029323, poverty: 0.061136 },
    { county: "San Joaquin",     deep: 0.082303, poverty: 0.103670 },
    { county: "San Luis Obispo", deep: 0.044485, poverty: 0.021405 },
    { county: "San Mateo",       deep: 0.026641, poverty: 0.049755 },
    { county: "Santa Barbara",   deep: 0.032855, poverty: 0.120407 },
    { county: "Santa Clara",     deep: 0.055042, poverty: 0.055703 },
    { county: "Santa Cruz",      deep: 0.046824, poverty: 0.102326 },
    { county: "Shasta",          deep: 0.072273, poverty: 0.192183 },
    { county: "Solano",          deep: 0.106082, poverty: 0.082768 },
    { county: "Sonoma",          deep: 0.031396, poverty: 0.068679 },
    { county: "Stanislaus",      deep: 0.072868, poverty: 0.109095 },
    { county: "Sutter",          deep: 0.118536, poverty: 0.184471 },
    { county: "Tulare",          deep: 0.130019, poverty: 0.209393 },
    { county: "Ventura",         deep: 0.035679, poverty: 0.080424 },
    { county: "Yolo",            deep: 0.059473, poverty: 0.094875 },
    { county: "Yuba",            deep: 0.098238, poverty: 0.095056 },
  ].map(d => ({ ...d, total: d.deep + d.poverty }));

  raw.sort((a,b) => {
    if (a.county === "California") return -1;
    if (b.county === "California") return  1;
    return a.county.localeCompare(b.county);
  });
  return raw;
}


function _d3(require){return(
require("d3@7")
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["d3","data"], _2);
  main.variable(observer("data")).define("data", _data);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  return main;
}
