function _1(md){return(
md`# Stroke statistics - leading cause of death`
)}

function _2(d3,deathsByYear)
{
  // ── Colour palette (matches screenshot exactly) ───────────────────────────────
  const causeColor = {
    "Cerebrovascular diseases":                          "#4472c4",  // blue
    "Chronic lower respiratory diseases":                "#ed7d31",  // orange
    "Dementia and Alzheimer disease":                    "#e84040",  // red
    "Influenza and pneumonia":                           "#4bc9c4",  // teal
    "Ischaemic heart diseases":                          "#4ea72a",  // green
    "Malignant neoplasm of trachea, bronchus and lung":  "#c9a227",  // gold
  };
 
  const allCauses = Object.keys(causeColor);
  const nations   = ["UK", "England", "Scotland", "Wales", "Northern Ireland"];
  const years     = d3.range(2001, 2019);  // 2001–2018
 
  // ── State ─────────────────────────────────────────────────────────────────────
  let selectedNation = "UK";
  let selectedYear   = 2018;
 
  // ── Layout ────────────────────────────────────────────────────────────────────
  const totalW = 900;
 
  // Bar chart dims
  const bm = { top: 40, right: 20, bottom: 50, left: 40 };
  const bW  = 600 - bm.left - bm.right;
  const bH  = 260 - bm.top  - bm.bottom;
 
  // Line chart dims
  const lm = { top: 20, right: 200, bottom: 60, left: 60 };
  const lW  = 720 - lm.left - lm.right;
  const lH  = 320 - lm.top  - lm.bottom;
 
  // ── Root container ────────────────────────────────────────────────────────────
  const root = d3.create("div")
    .style("font-family", "Arial, sans-serif")
    .style("width", `${totalW}px`);
 
  // ── Title ─────────────────────────────────────────────────────────────────────
  root.append("div")
    .style("font-size", "20px").style("font-weight", "bold").style("margin-bottom", "12px")
    .text("Stroke statistics - leading cause of death");
 
  // ── Nation dropdown ───────────────────────────────────────────────────────────
  const nationRow = root.append("div").style("margin-bottom", "24px");
  nationRow.append("label")
    .style("font-size", "13px").style("font-weight", "bold").style("display", "block")
    .style("margin-bottom", "4px").text("Nation");
  const nationSel = nationRow.append("select")
    .style("width", "460px").style("font-size", "13px").style("padding", "5px 8px")
    .style("border", "1px solid #aaa").style("border-radius", "3px").style("background", "white");
  nationSel.selectAll("option").data(nations).join("option")
    .attr("value", d => d).text(d => d)
    .property("selected", d => d === selectedNation);
 
  // ── Bar chart section ─────────────────────────────────────────────────────────
  root.append("div")
    .style("font-size", "13px").style("color", "#333").style("margin-bottom", "6px")
    .text("Change the year to see how leading causes of death have changed over time.");
 
  const barRow = root.append("div")
    .style("display", "flex").style("align-items", "flex-start").style("margin-bottom", "28px");
 
  const barSvg = barRow.append("svg")
    .attr("width",  bm.left + bW + bm.right)
    .attr("height", bm.top  + bH + bm.bottom);
  const barG = barSvg.append("g").attr("transform", `translate(${bm.left},${bm.top})`);
 
  // Bar X axis label
  barSvg.append("text")
    .attr("x", bm.left + bW / 2).attr("y", bm.top + bH + bm.bottom - 4)
    .attr("text-anchor", "middle").style("font-size", "12px").style("font-weight", "bold")
    .text("Deaths");
 
  // Bar Y label
  barSvg.append("text")
    .attr("x", bm.left - 36).attr("y", bm.top - 16)
    .style("font-size", "11px").style("fill", "#555")
    .text("Rank");
 
  // Year selector (right of bar chart)
  const yearCtrl = barRow.append("div")
    .style("display", "flex").style("flex-direction", "column")
    .style("padding-left", "20px").style("padding-top", "30px");
 
  const yearSelRow = yearCtrl.append("div")
    .style("display", "flex").style("align-items", "center").style("margin-bottom", "8px");
  yearSelRow.append("button").text("◀")
    .style("font-size", "12px").style("padding", "2px 6px").style("cursor", "pointer")
    .style("border", "1px solid #aaa").style("border-radius", "2px").style("background", "white")
    .attr("id", "year-prev");
  const yearSel = yearSelRow.append("select")
    .style("font-size", "13px").style("padding", "3px 6px").style("margin", "0 4px")
    .style("border", "1px solid #aaa").style("border-radius", "3px").style("background", "white")
    .style("min-width", "70px");
  yearSel.selectAll("option").data(years).join("option")
    .attr("value", d => d).text(d => d)
    .property("selected", d => d === selectedYear);
  yearSelRow.append("button").text("▶")
    .style("font-size", "12px").style("padding", "2px 6px").style("cursor", "pointer")
    .style("border", "1px solid #aaa").style("border-radius", "2px").style("background", "white")
    .attr("id", "year-next");
 
  // ── Line chart section ────────────────────────────────────────────────────────
  root.append("div")
    .style("font-size", "18px").style("font-weight", "bold").style("margin-bottom", "10px")
    .text("Cause of death by year");
 
  const lineWrap = root.append("div").style("display", "flex").style("align-items", "flex-start");
  const lineSvg  = lineWrap.append("svg")
    .attr("width",  lm.left + lW + lm.right)
    .attr("height", lm.top  + lH + lm.bottom);
  const lineG = lineSvg.append("g").attr("transform", `translate(${lm.left},${lm.top})`);
 
  // Note text (right of line chart)
  lineWrap.append("div")
    .style("font-size", "12px").style("color", "#555").style("max-width", "180px")
    .style("padding-left", "12px").style("padding-top", "20px").style("line-height", "1.5")
    .text("There were changes to the coding framework in 2011 and 2014 which attributed more deaths to Dementia and Alzheimer disease from other groupings.");
 
  // Line X axis label
  lineSvg.append("text")
    .attr("x", lm.left + lW / 2).attr("y", lm.top + lH + lm.bottom - 4)
    .attr("text-anchor", "middle").style("font-size", "12px").style("font-weight", "bold")
    .text("Leading cause");
 
  // Line Y label
  lineSvg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(lm.top + lH / 2)).attr("y", 14)
    .attr("text-anchor", "middle").style("font-size", "11px").style("fill", "#555")
    .text("Deaths");
 
  // ── Legend (below line chart) ─────────────────────────────────────────────────
  const legendWrap = root.append("div")
    .style("display", "flex").style("flex-wrap", "wrap")
    .style("gap", "8px 28px").style("margin-top", "12px").style("padding-left", `${lm.left}px`);
 
  for (const cause of allCauses) {
    const item = legendWrap.append("div")
      .style("display", "flex").style("align-items", "center").style("min-width", "240px");
    item.append("div")
      .style("width", "14px").style("height", "14px").style("border-radius", "2px")
      .style("background", causeColor[cause]).style("margin-right", "6px").style("flex-shrink", "0");
    item.append("span").style("font-size", "12px").text(cause);
  }
 
  // ── Draw functions ────────────────────────────────────────────────────────────
 
  function drawBar(nation, year) {
    barG.selectAll("*").remove();
 
    // Filter rank data for this nation; build snapshot from deathsByYear for the chosen year
    const rows = deathsByYear
      .filter(d => d.Nation === nation && +d.Year === year && d.Deaths)
      .map(d => ({ cause: d.Leading_cause, deaths: +d.Deaths, rank: +d.Rank }))
      .filter(d => !isNaN(d.rank))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 6);
 
    if (!rows.length) return;
 
    const maxDeaths = d3.max(rows, d => d.deaths);
    // Round up to nearest 20K for axis
    const axisMax = Math.ceil(maxDeaths / 20000) * 20000;
 
    const xBar = d3.scaleLinear().domain([0, axisMax]).range([0, bW]);
    const yBar = d3.scaleBand()
      .domain(rows.map(d => String(d.rank)))
      .range([0, bH]).padding(0.25);
 
    // Gridlines
    barG.append("g").selectAll("line")
      .data(xBar.ticks(10))
      .join("line")
        .attr("x1", d => xBar(d)).attr("x2", d => xBar(d))
        .attr("y1", 0).attr("y2", bH)
        .attr("stroke", "#e8e8e8").attr("stroke-width", 1);
 
    // Bars
    barG.selectAll("rect").data(rows).join("rect")
      .attr("x", 0)
      .attr("y", d => yBar(String(d.rank)))
      .attr("width", d => xBar(d.deaths))
      .attr("height", yBar.bandwidth())
      .attr("fill", d => causeColor[d.cause] || "#999");
 
    // Bar labels
    barG.selectAll(".bar-label").data(rows).join("text")
      .attr("class", "bar-label")
      .attr("x", d => xBar(d.deaths) + 5)
      .attr("y", d => yBar(String(d.rank)) + yBar.bandwidth() / 2 + 4)
      .style("font-size", "11px").style("fill", "#333")
      .text(d => d.cause);
 
    // X axis
    barG.append("g").attr("transform", `translate(0,${bH})`)
      .call(d3.axisBottom(xBar).ticks(10).tickFormat(d => `${d/1000|0}K`))
      .call(ax => ax.select(".domain").attr("stroke","#aaa"))
      .call(ax => ax.selectAll(".tick line").attr("stroke","#ddd"))
      .call(ax => ax.selectAll(".tick text").style("font-size","10px"));
 
    // Y axis (rank numbers)
    barG.append("g")
      .call(d3.axisLeft(yBar).tickSize(0))
      .call(ax => ax.select(".domain").remove())
      .call(ax => ax.selectAll(".tick text").style("font-size","11px").attr("dx","-4px"));
  }
 
  function drawLines(nation) {
    lineG.selectAll("*").remove();
 
    const rows = deathsByYear.filter(d => d.Nation === nation && d.Deaths !== "" && !isNaN(+d.Deaths));
    const byC  = d3.group(rows, d => d.Leading_cause);
 
    const maxD = d3.max(rows, d => +d.Deaths);
    const axisMax = Math.ceil(maxD / 20000) * 20000;
 
    const xL = d3.scaleLinear().domain([2001, 2018]).range([0, lW]);
    const yL = d3.scaleLinear().domain([0, axisMax]).range([lH, 0]);
 
    // Gridlines
    lineG.append("g").selectAll("line")
      .data(yL.ticks(6))
      .join("line")
        .attr("x1", 0).attr("x2", lW)
        .attr("y1", d => yL(d)).attr("y2", d => yL(d))
        .attr("stroke", "#e8e8e8").attr("stroke-width", 1);
 
    // Lines
    const lineGen = d3.line()
      .x(d => xL(+d.Year))
      .y(d => yL(+d.Deaths))
      .defined(d => d.Deaths !== "" && !isNaN(+d.Deaths));
 
    for (const [cause, pts] of byC) {
      const sorted = pts.slice().sort((a,b) => +a.Year - +b.Year);
      lineG.append("path")
        .datum(sorted)
        .attr("fill", "none")
        .attr("stroke", causeColor[cause] || "#999")
        .attr("stroke-width", 2)
        .attr("stroke-linejoin", "round")
        .attr("d", lineGen);
    }
 
    // X axis
    const xTicks = [2001,2002,2004,2006,2008,2010,2012,2014,2016,2018];
    lineG.append("g").attr("transform", `translate(0,${lH})`)
      .call(d3.axisBottom(xL).tickValues(xTicks).tickFormat(d3.format("d")))
      .call(ax => ax.select(".domain").attr("stroke","#aaa"))
      .call(ax => ax.selectAll(".tick line").attr("stroke","#ddd"))
      .call(ax => ax.selectAll(".tick text").style("font-size","11px"));
 
    // Y axis
    lineG.append("g")
      .call(d3.axisLeft(yL).ticks(6).tickFormat(d => `${d/1000|0}K`))
      .call(ax => ax.select(".domain").remove())
      .call(ax => ax.selectAll(".tick line").remove())
      .call(ax => ax.selectAll(".tick text").style("font-size","11px"));
  }
 
  // ── Render both charts ────────────────────────────────────────────────────────
  function render() {
    drawBar(selectedNation, selectedYear);
    drawLines(selectedNation);
  }
 
  // ── Event listeners ───────────────────────────────────────────────────────────
  nationSel.on("change", function() {
    selectedNation = this.value;
    render();
  });
 
  yearSel.on("change", function() {
    selectedYear = +this.value;
    render();
  });
 
  // Prev/next year buttons — attach after DOM is ready via setTimeout
  setTimeout(() => {
    const prevBtn = root.select("#year-prev").node();
    const nextBtn = root.select("#year-next").node();
    if (prevBtn) prevBtn.addEventListener("click", () => {
      const idx = years.indexOf(selectedYear);
      if (idx > 0) {
        selectedYear = years[idx - 1];
        yearSel.node().value = selectedYear;
        render();
      }
    });
    if (nextBtn) nextBtn.addEventListener("click", () => {
      const idx = years.indexOf(selectedYear);
      if (idx < years.length - 1) {
        selectedYear = years[idx + 1];
        yearSel.node().value = selectedYear;
        render();
      }
    });
  }, 0);
 
  render();
  return root.node();
}


function _d3(require){return(
require("d3@7")
)}

function _deathsByYear(FileAttachment){return(
FileAttachment("stroke_deaths_clean.csv").csv({ typed: true })
)}

function _rankData(FileAttachment){return(
FileAttachment("stroke_ranks_clean.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["stroke_ranks_clean.csv", {url: new URL("./files/86765bea67e280167fa5bdaaccfec6bd5412b428b7a3270a4c87e959fc45da9acbc853f9e54e387bd3253ae7e3bac3f727e7752e97a93d4d5b82fcf33b9cade7.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["stroke_deaths_clean.csv", {url: new URL("./files/2f7dfcb8230fce7ea2304ecd061a59156f1310aebfb3c6efe2e1c7a7a25047fd698597978dd528de8d3566301e1ed209b31e15242af6611c7444f88219ec8e03.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["d3","deathsByYear"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("deathsByYear")).define("deathsByYear", ["FileAttachment"], _deathsByYear);
  main.variable(observer("rankData")).define("rankData", ["FileAttachment"], _rankData);
  return main;
}
