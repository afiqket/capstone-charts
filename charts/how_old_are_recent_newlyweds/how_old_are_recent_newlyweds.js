function _1(md){return(
md`# How Old Are Recent Newlyweds?`
)}

function _2(html,data,d3)
{
  // ── COLORS ──────────────────────────────────────────────
  const colorMap = { Female: "#E8703A", Male: "#3A5F8A", Overall: "#3A5F8A" }

  // ── HELPERS ─────────────────────────────────────────────
  function makeSelect(label, options, container) {
    const wrap = html`<div style="display:flex;flex-direction:column;gap:4px"></div>`
    const lbl  = html`<label style="font-weight:600;color:#333;font-size:13px">${label}</label>`
    const sel  = html`<select style="padding:5px 24px 5px 8px;border:1px solid #bbb;border-radius:3px;font-size:13px;min-width:180px">
      ${options.map(o => html`<option>${o}</option>`)}
    </select>`
    wrap.append(lbl, sel)
    container.append(wrap)
    return sel
  }

  // ── TOP FILTERS ROW ──────────────────────────────────────
  const topFilters = html`<div style="display:flex;gap:32px;flex-wrap:wrap;margin-bottom:16px;font-family:sans-serif"></div>`
  const selRegion = makeSelect("Region",  ["(All)","Midwest","Northeast","South","West"], topFilters)
  const selSex    = makeSelect("Sex",     ["(All)","Female","Male"], topFilters)
  const selEdu    = makeSelect("Educational Attainment", [
    "(All)","Less than High School Diploma",
    "High School Diploma, GED, or Equivalent",
    "Some College","Associate's degree","Bachelor's degree","Advanced degree"
  ], topFilters)

  // ── CHART CONTROLS ROW ───────────────────────────────────
  const chartControls = html`<div style="display:flex;gap:40px;flex-wrap:wrap;margin-bottom:16px;font-family:sans-serif"></div>`
  const selChartType = makeSelect("Select a Chart Type.", ["Stacked Bar","Line"], chartControls)
  const selBreakout  = makeSelect("Select a breakout.",   ["Overall","Sex","Region","Race and Ethnicity"], chartControls)

  // ── LAYOUT ───────────────────────────────────────────────
  const layout  = html`<div style="display:flex;gap:32px;align-items:flex-start;font-family:sans-serif"></div>`
  const chartDiv = html`<div></div>`
  const panelDiv = html`<div style="min-width:220px;max-width:260px;font-size:13px;color:#222;line-height:1.7;padding-top:20px"></div>`
  layout.append(chartDiv, panelDiv)

  const root = html`<div>${topFilters}${chartControls}${layout}</div>`

  // ── DRAW ─────────────────────────────────────────────────
  function draw() {
    const sexFilter  = selSex.value
    const breakout   = selBreakout.value
    const chartType  = selChartType.value

    // Determine active groups
    const groups = (breakout === "Sex" && sexFilter === "(All)")
      ? ["Female","Male"]
      : ["Overall"]

    // Filter + group data
    let rows = data
    if (sexFilter !== "(All)") rows = rows.filter(d => d.group === sexFilter)

    let filtered
    if (groups.length === 1) {
      const byAge = d3.rollup(rows, v => d3.sum(v, d => d.count), d => d.age)
      filtered = Array.from(byAge, ([age, count]) => ({ age, group: "Overall", count }))
        .sort((a,b) => a.age - b.age)
    } else {
      filtered = rows.slice().sort((a,b) => a.age - b.age || a.group.localeCompare(b.group))
    }

    // ── CHART ───────────────────────────────────────────
    const width  = 680, height = 420
    const margin = { top: 20, right: 20, bottom: 50, left: 70 }
    const iW = width  - margin.left - margin.right
    const iH = height - margin.top  - margin.bottom
    const ages = d3.range(15, 101)

    const xScale = d3.scaleBand().domain(ages).range([0, iW]).padding(0.05)

    const byAge = new Map()
    ages.forEach(a => byAge.set(a, { age: a }))
    filtered.forEach(d => {
      const row = byAge.get(d.age)
      if (row) row[d.group] = (row[d.group] || 0) + d.count
    })
    const stackData = Array.from(byAge.values())

    const maxVal = d3.max(stackData, d => groups.reduce((s,g) => s + (d[g] || 0), 0))
    const yScale = d3.scaleLinear().domain([0, maxVal * 1.05]).range([iH, 0])

    const svg = d3.create("svg").attr("width", width).attr("height", height)
    const g   = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // Gridlines
    g.append("g").selectAll("line")
      .data(yScale.ticks(7)).join("line")
      .attr("x1",0).attr("x2",iW)
      .attr("y1", d => yScale(d)).attr("y2", d => yScale(d))
      .attr("stroke","#e0e0e0")

    if (chartType === "Stacked Bar") {
      d3.stack().keys(groups)(stackData).forEach((layer, li) => {
        g.selectAll(null).data(layer).join("rect")
          .attr("x",      d => xScale(d.data.age))
          .attr("y",      d => yScale(d[1]))
          .attr("height", d => Math.max(0, yScale(d[0]) - yScale(d[1])))
          .attr("width",  xScale.bandwidth())
          .attr("fill",   colorMap[groups[li]])
          .attr("opacity", 0.9)
      })
    }

    if (chartType === "Line") {
      const line = d3.line()
        .x(d => xScale(d.age) + xScale.bandwidth() / 2)
        .y(d => yScale(d.count))
        .curve(d3.curveMonotoneX)
      groups.forEach(grp => {
        g.append("path")
          .datum(filtered.filter(d => d.group === grp))
          .attr("fill","none").attr("stroke", colorMap[grp])
          .attr("stroke-width", 2).attr("d", line)
      })
    }

    // X axis — only show multiples of 5
    g.append("g").attr("transform",`translate(0,${iH})`)
      .call(d3.axisBottom(xScale)
        .tickValues(d3.range(20, 101, 5))
        .tickFormat(d => d))
      .call(ax => ax.select(".domain").attr("stroke","#aaa"))
      .call(ax => ax.selectAll(".tick line").attr("stroke","#aaa"))

    // Y axis
    g.append("g").call(
      d3.axisLeft(yScale).ticks(7)
        .tickFormat(d => d >= 1000 ? `${Math.round(d/1000)}K` : d))
      .call(ax => ax.select(".domain").remove())
      .call(ax => ax.selectAll(".tick line").remove())

    // Axis labels
    g.append("text")
      .attr("transform",`translate(${iW/2},${iH+40})`)
      .attr("text-anchor","middle").attr("font-size",13).attr("fill","#444")
      .text("Age")
    g.append("text")
      .attr("transform","rotate(-90)")
      .attr("x",-iH/2).attr("y",-55)
      .attr("text-anchor","middle").attr("font-size",13).attr("fill","#444")
      .text("People")

    chartDiv.innerHTML = ""
    chartDiv.append(svg.node())

    // ── SIDE PANEL ──────────────────────────────────────
    const fmt  = d3.format(",")
    const modeByGroup  = {}
    const totalByGroup = {}
    groups.forEach(grp => {
      const rows = filtered.filter(d => d.group === grp)
      const best = d3.greatest(rows, d => d.count)
      modeByGroup[grp]  = best ? best.age : "—"
      totalByGroup[grp] = d3.sum(rows, d => d.count)
    })
    const totalAll = d3.sum(Object.values(totalByGroup))

    const legend = groups.map(grp =>
      `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <span style="width:13px;height:13px;background:${colorMap[grp]};display:inline-block;flex-shrink:0"></span>
        <span>${grp}</span>
      </div>`).join("")

    const modeRows = groups.map(grp =>
      `<tr>
        <td style="padding:2px 0">${grp}</td>
        <td style="padding:2px 6px;text-align:right;font-weight:600">${modeByGroup[grp]}
          <span style="font-weight:400;color:#888">years old</span></td>
      </tr>`).join("")

    const countRows = groups.map(grp =>
      `<tr>
        <td style="padding:2px 0">${grp}</td>
        <td style="padding:2px 6px;text-align:right;font-weight:600">${fmt(Math.round(totalByGroup[grp]))}</td>
      </tr>`).join("")

    panelDiv.innerHTML = `
      ${legend}
      <p style="margin:12px 0 8px">There were nearly <strong>${(totalAll/1e6).toFixed(1)} million people</strong>
      married in the last 12 months. The most common age was
      <strong>${modeByGroup[groups[0]]}</strong>. The table below shows the breakout
      by the selected characteristic and any filters you have on.</p>
      <table style="width:100%;border-collapse:collapse">${modeRows}</table>
      <p style="margin:12px 0 6px">You can also see the total number of people.</p>
      <table style="width:100%;border-collapse:collapse">${countRows}</table>`
  }

  // ── WIRE UP EVENTS ───────────────────────────────────────
  [selRegion, selSex, selEdu, selChartType, selBreakout].forEach(sel => {
    sel.addEventListener("change", draw)
  })

  draw()
  return root
}


function _d3(require){return(
require("d3@7")
)}

function _data(FileAttachment){return(
FileAttachment("newlyweds.csv").csv({typed: true})
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["newlyweds.csv", {url: new URL("./files/cac2ee1e29183483275c0f85667151da9cf4c6a7efdb70b5927b1a09db1130b2b1a3583eb8a7980725a830ef64b0245f13adceca1104f14f48c8dc4813f0582a.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["html","data","d3"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  return main;
}
