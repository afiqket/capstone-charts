function _1(md){return(
md`# UCR Violent Crime`
)}

function _2(d3,data)
{
  // ── Dimensions ────────────────────────────────────────────────────────────────
  const totalWidth  = 960;
  const totalHeight = 520;
  const margin      = { top: 30, right: 20, bottom: 40, left: 60 };
  const sidebarW    = 230;
  const chartW      = totalWidth - sidebarW - margin.left - 60; // 60 for right axis
  const chartH      = totalHeight - margin.top - margin.bottom;
 
  // ── Constants ─────────────────────────────────────────────────────────────────
  const counties = [
    "Harris County", "Montgomery County", "Brazoria County", "Fort Bend County"
  ];
  const crimeTypes = [
    "All",
    "Aggravated Assault",
    "Forcible Rape",
    "Murder and Non-negligent Manslaughter",
    "Robbery"
  ];
  const color = d3.scaleOrdinal()
    .domain(counties)
    .range(["#f5a11c", "#4caf50", "#9c55b8", "#26c6da"]);
 
  // ── Census population lookup (one population value per agency per census year) ─
  const censusPop = {};
  for (const d of data) {
    const k = `${d.Agency}|${d.Year}`;
    if (!censusPop[k] && d.Population !== "" && d.Population != null && !isNaN(+d.Population)) {
      censusPop[k] = { agency: d.Agency, year: +d.Year, pop: +d.Population };
    }
  }
  const censusRows = Object.values(censusPop);
 
  // ── Container ─────────────────────────────────────────────────────────────────
  const container = d3.create("div")
    .style("font-family", "Arial, sans-serif")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("width", `${totalWidth}px`);
 
  // Title block
  const titleDiv = container.append("div").style("padding", "4px 0 10px 0");
  titleDiv.append("div")
    .style("font-size", "16px").style("font-weight", "bold").style("color", "#c0392b")
    .text("Number of reported violent crimes");
  titleDiv.append("div")
    .style("font-size", "12px").style("color", "#333").style("max-width", "740px").style("line-height", "1.5")
    .html("<strong>Thicker lines show the number of violent crimes reported by each sheriff's department</strong> in the Houston region that serves more than 100,000 people, according to data collected by the FBI's Uniform Crime Reporting Program. <strong>Thinner lines show the population</strong> recorded in the decennial Census, which provides a rough sense of whether increases in the total number of violent crimes might be related to a growing population.");
 
  // Main row: chart + sidebar
  const mainRow = container.append("div")
    .style("display", "flex").style("align-items", "flex-start");
 
  // ── SVG ───────────────────────────────────────────────────────────────────────
  const svgW = margin.left + chartW + 60;
  const svgH = margin.top + chartH + margin.bottom;
  const svg  = mainRow.append("svg").attr("width", svgW).attr("height", svgH);
  const g    = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
 
  // ── Scales ────────────────────────────────────────────────────────────────────
  const xScale = d3.scaleLinear().domain([1990, 2012]).range([0, chartW]);
  const yLeft  = d3.scaleLinear().domain([0, 9000]).range([chartH, 0]);
  // Right axis: population 0–4.5M, labelled 0K / 500K / 1M … 4M
  const yRight = d3.scaleLinear().domain([0, 4500000]).range([chartH, 0]);
 
  // ── Gridlines ─────────────────────────────────────────────────────────────────
  g.append("g").selectAll("line")
    .data([0,1000,2000,3000,4000,5000,6000,7000,8000,9000])
    .join("line")
      .attr("x1", 0).attr("x2", chartW)
      .attr("y1", d => yLeft(d)).attr("y2", d => yLeft(d))
      .attr("stroke", "#e0e0e0").attr("stroke-width", 1);
 
  // ── X Axis ────────────────────────────────────────────────────────────────────
  g.append("g").attr("transform", `translate(0,${chartH})`)
    .call(d3.axisBottom(xScale)
      .tickValues(d3.range(1990, 2013))
      .tickFormat(d => String(d).slice(2)))
    .call(ax => ax.select(".domain").attr("stroke", "#aaa"))
    .call(ax => ax.selectAll(".tick line").attr("stroke", "#ddd"))
    .call(ax => ax.selectAll(".tick text").style("font-size", "11px").attr("fill", "#555"));
 
  // ── Left Y Axis (crimes 0K–9K) ────────────────────────────────────────────────
  g.append("g")
    .call(d3.axisLeft(yLeft)
      .tickValues([0,1000,2000,3000,4000,5000,6000,7000,8000,9000])
      .tickFormat(d => `${d/1000|0}K`))
    .call(ax => ax.select(".domain").remove())
    .call(ax => ax.selectAll(".tick line").remove())
    .call(ax => ax.selectAll(".tick text").style("font-size", "11px").attr("fill", "#555"));
 
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + chartH / 2)).attr("y", 14)
    .attr("text-anchor", "middle")
    .style("font-size", "11px").style("fill", "#666")
    .text("Violent crimes reported");
 
  // ── Right Y Axis (population 0K–4M) ──────────────────────────────────────────
  const rightTicks = [0,500000,1000000,1500000,2000000,2500000,3000000,3500000,4000000];
  const rightFmt = v => {
    if (v === 0) return "0K";
    const m = v / 1000000;
    return Number.isInteger(m) ? `${m}M` : `${m}M`;
  };
  g.append("g").attr("transform", `translate(${chartW},0)`)
    .call(d3.axisRight(yRight).tickValues(rightTicks).tickFormat(rightFmt))
    .call(ax => ax.select(".domain").remove())
    .call(ax => ax.selectAll(".tick line").remove())
    .call(ax => ax.selectAll(".tick text").style("font-size", "11px").attr("fill", "#555").attr("dx", "6px"));
 
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + chartH / 2)).attr("y", margin.left + chartW + 55)
    .attr("text-anchor", "middle")
    .style("font-size", "11px").style("fill", "#666")
    .text("Population");
 
  // ── Line layers ───────────────────────────────────────────────────────────────
  const popLinesG   = g.append("g");
  const crimeLinesG = g.append("g");
 
  // ── Draw ──────────────────────────────────────────────────────────────────────
  function drawChart(agencyFilter, crimeFilter) {
    // Filter data
    let rows = crimeFilter === "All"
      ? data
      : data.filter(d => d.Crime_Type === crimeFilter);
    if (agencyFilter !== "All")
      rows = rows.filter(d => d.Agency === agencyFilter);
 
    // Aggregate: Agency → Year → summed crimes
    const agg = d3.rollup(
      rows,
      v => d3.sum(v, d => (d.Number_reported !== "" && !isNaN(+d.Number_reported)) ? +d.Number_reported : 0),
      d => d.Agency,
      d => +d.Year
    );
 
    const visible = agencyFilter === "All" ? counties : [agencyFilter];
 
    // ── Population thin lines ─────────────────────────────────────────────────
    popLinesG.selectAll("*").remove();
    for (const agency of visible) {
      const pts = censusRows.filter(r => r.agency === agency).sort((a,b) => a.year - b.year);
      if (pts.length < 2) continue;
      popLinesG.append("path")
        .datum(pts)
        .attr("fill", "none")
        .attr("stroke", color(agency))
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 0.55)
        .attr("d", d3.line().x(d => xScale(d.year)).y(d => yRight(d.pop)));
    }
 
    // ── Crime thick lines ─────────────────────────────────────────────────────
    crimeLinesG.selectAll("*").remove();
    for (const agency of visible) {
      const yearMap = agg.get(agency);
      if (!yearMap) continue;
      // Only include years with actual data (val > 0)
      const pts = Array.from(yearMap.entries())
        .sort((a,b) => a[0] - b[0])
        .filter(([, val]) => val > 0);
      if (!pts.length) continue;
      crimeLinesG.append("path")
        .datum(pts)
        .attr("fill", "none")
        .attr("stroke", color(agency))
        .attr("stroke-width", 2.5)
        .attr("stroke-linejoin", "round")
        .attr("d", d3.line()
          .x(d => xScale(d[0]))
          .y(d => yLeft(d[1])));
    }
  }
 
  // ── Sidebar ───────────────────────────────────────────────────────────────────
  const sidebar = mainRow.append("div")
    .style("width", `${sidebarW}px`)
    .style("padding-left", "16px")
    .style("padding-top", `${margin.top}px`);
 
  // Legend
  sidebar.append("div")
    .style("font-size", "13px").style("font-weight", "bold")
    .style("color", "#c0392b").style("margin-bottom", "8px")
    .text("Sheriff Department");
 
  const legendDiv = sidebar.append("div").style("margin-bottom", "20px");
  for (const county of counties) {
    const row = legendDiv.append("div")
      .style("display", "flex").style("align-items", "center").style("margin-bottom", "6px");
    row.append("div")
      .style("width", "20px").style("height", "14px").style("border-radius", "2px")
      .style("background", color(county)).style("margin-right", "8px").style("flex-shrink", "0");
    row.append("span").style("font-size", "12px").text(county);
  }
 
  // Filter helper
  sidebar.append("div")
    .style("font-size", "13px").style("font-weight", "bold")
    .style("color", "#c0392b").style("margin-bottom", "10px")
    .text("Select chart filters");
 
  function addDropdown(label, options, defaultVal) {
    sidebar.append("div")
      .style("font-size", "12px").style("font-weight", "bold").style("margin-bottom", "4px")
      .text(label);
    const sel = sidebar.append("select")
      .style("width", "195px").style("font-size", "12px").style("padding", "4px 6px")
      .style("margin-bottom", "14px").style("border", "1px solid #aaa")
      .style("border-radius", "3px").style("background", "white");
    sel.selectAll("option").data(options).join("option")
      .attr("value", d => d)
      .text(d => d)
      .property("selected", d => d === defaultVal);
    return sel;
  }
 
  const agencySelect = addDropdown("Sheriff department",
    ["All", "Brazoria County", "Fort Bend County", "Harris County", "Montgomery County"],
    "All");
 
  const crimeSelect = addDropdown("Type of crime", crimeTypes, "All");
 
  // Year dropdown — display only, no filter logic (matches original Tableau behaviour)
  addDropdown("Year",
    ["(Multiple values)", ...d3.range(1990, 2013).map(String)],
    "(Multiple values)");
 
  sidebar.append("div")
    .style("font-size", "11px").style("color", "#bbb").style("margin-top", "4px").style("line-height", "1.4")
    .html("<strong style='color:#bbb'>Data note:</strong> Crimes reported by city police departments are not included in this chart.");
 
  // ── Events ────────────────────────────────────────────────────────────────────
  function update() {
    drawChart(agencySelect.node().value, crimeSelect.node().value);
  }
  agencySelect.on("change", update);
  crimeSelect.on("change", update);
 
  // ── Initial render ────────────────────────────────────────────────────────────
  drawChart("All", "All");
 
  return container.node();
}


function _d3(require){return(
require("d3@7")
)}

function _data(FileAttachment){return(
FileAttachment("UCR_VC_Detailed_clean-2.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["UCR_VC_Detailed_clean-2.csv", {url: new URL("./files/36d221125c8b5a54c049d8d2baf2cf92ce4b69e788f1d89fd3b400f8907d1c66106162deb2634bcdd41f28d38fc892c419568be771265e0f5d343c9cf83c3404.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["d3","data"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  return main;
}
