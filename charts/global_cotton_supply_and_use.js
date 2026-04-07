function _1(md){return(
md`# Global cotton supply and use`
)}

function _2(d3,data,html,invalidation)
{
  // ── CONFIG ───────────────────────────────────────────────
  const variables = ["Imports", "Exports", "Production", "Domestic Consumption"]

  const titleMap = {
    "Imports":              "Leading cotton importers, 2000-2018",
    "Exports":              "Leading cotton exporters, 2000-2018",
    "Production":           "Leading cotton producers, 2000-2018",
    "Domestic Consumption": "Leading cotton domestic consumers, 2000-2018",
  }
  const shareYearMap = {
    "Imports":              2017,
    "Exports":              2017,
    "Production":           2018,
    "Domestic Consumption": 2017,
  }

  // Country color palettes per variable (matching original chart)
  const colorMap = {
    "Imports": {
      "Bangladesh": "#1a5fa8",
      "Vietnam":    "#7ec8e3",
      "China":      "#f5a623",
      "Turkey":     "#c0392b",
      "Indonesia":  "#aaaaaa",
    },
    "Exports": {
      "United States": "#1a5fa8",
      "India":         "#7ec8e3",
      "Brazil":        "#f5a623",
      "Australia":     "#c0392b",
    },
    "Production": {
      "India":         "#1a5fa8",
      "China":         "#7ec8e3",
      "United States": "#f5a623",
      "Brazil":        "#c0392b",
      "Pakistan":      "#aaaaaa",
    },
    "Domestic Consumption": {
      "China":      "#1a5fa8",
      "India":      "#7ec8e3",
      "Pakistan":   "#f5a623",
      "Bangladesh": "#c0392b",
      "Turkey":     "#aaaaaa",
      "Vietnam":    "#5a9e6f",
    },
  }

  // ── STATE ────────────────────────────────────────────────
  let selectedVar = "Imports"

  // ── TOOLTIP ──────────────────────────────────────────────
  const tip = d3.select("body").append("div")
    .style("position","fixed").style("background","white")
    .style("border","1px solid #ccc").style("border-radius","4px")
    .style("padding","8px 12px").style("font-size","12px")
    .style("pointer-events","none").style("display","none")
    .style("box-shadow","2px 2px 6px rgba(0,0,0,0.2)")
    .style("line-height","1.8")

  // ── CHART DIMENSIONS ─────────────────────────────────────
  const W  = 680, H1 = 380, H2 = 220
  const ml = { top:40, right:30, bottom:40, left:70 }
  const iW = W - ml.left - ml.right

  // ── SVG ELEMENTS ─────────────────────────────────────────
  const svgLine = d3.create("svg").attr("width", W).attr("height", H1).style("font-family","sans-serif")
  const svgBar  = d3.create("svg").attr("width", W).attr("height", H2).style("font-family","sans-serif")

  // ── DRAW ─────────────────────────────────────────────────
  function draw() {
    svgLine.selectAll("*").remove()
    svgBar.selectAll("*").remove()

    const colors    = colorMap[selectedVar]
    const countries = Object.keys(colors)
    const shareYear = shareYearMap[selectedVar]
    const filtered  = data.filter(d => d.variable === selectedVar && countries.includes(d.country))
    const years     = [...new Set(filtered.map(d => d.year))].sort((a,b) => a-b)

    // ── LINE CHART ──────────────────────────────────────────
    {
      const iH = H1 - ml.top - ml.bottom
      const g  = svgLine.append("g").attr("transform",`translate(${ml.left},${ml.top})`)

      const xScale = d3.scaleLinear().domain([d3.min(years), d3.max(years)]).range([0, iW])
      const yMax   = d3.max(filtered, d => d.value)
      const yScale = d3.scaleLinear().domain([0, yMax * 1.08]).range([iH, 0])

      // Title
      svgLine.append("text")
        .attr("x", W/2).attr("y", 22)
        .attr("text-anchor","middle").attr("font-size",15).attr("font-weight","700").attr("fill","#222")
        .text(titleMap[selectedVar])

      // Gridlines
      g.append("g").selectAll("line")
        .data(yScale.ticks(5)).join("line")
        .attr("x1",0).attr("x2",iW)
        .attr("y1", d => yScale(d)).attr("y2", d => yScale(d))
        .attr("stroke","#e0e0e0")

      // Lines per country
      countries.forEach(country => {
        const pts = filtered.filter(d => d.country === country).sort((a,b) => a.year - b.year)
        if (!pts.length) return
        const color = colors[country]
        const line  = d3.line().x(d => xScale(d.year)).y(d => yScale(d.value)).curve(d3.curveMonotoneX)

        g.append("path").datum(pts)
          .attr("fill","none").attr("stroke", color).attr("stroke-width", 2)
          .attr("d", line)

        // Hover dots (invisible, for tooltip)
        pts.forEach(d => {
          g.append("circle")
            .attr("cx", xScale(d.year)).attr("cy", yScale(d.value))
            .attr("r", 4).attr("fill", color).attr("opacity", 0)
            .on("mouseover", function() { d3.select(this).attr("opacity",1) })
            .on("mouseout",  function() { d3.select(this).attr("opacity",0); tip.style("display","none") })
            .on("mousemove", function(event) {
              tip.style("display","block")
                .style("left",(event.clientX+14)+"px")
                .style("top",(event.clientY-10)+"px")
                .html(`<strong>${country}</strong><br>
                  <span style="color:#555">Year:</span> ${d.year}<br>
                  <span style="color:#555">Value:</span> <strong>${d3.format(",.0f")(d.value)}</strong>`)
            })
        })
      })

      // X axis
      g.append("g").attr("transform",`translate(0,${iH})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(10))
        .call(ax => ax.select(".domain").attr("stroke","#aaa"))
        .call(ax => ax.selectAll(".tick line").attr("stroke","#aaa"))

      // Y axis
      g.append("g")
        .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => d >= 1000 ? d3.format(",")(d) : d))
        .call(ax => ax.select(".domain").remove())
        .call(ax => ax.selectAll(".tick line").remove())

      // Y label
      g.append("text").attr("transform","rotate(-90)")
        .attr("x",-iH/2).attr("y",-58)
        .attr("text-anchor","middle").attr("font-size",11).attr("fill","#555")
        .text("1,000 480lb bales")
    }

    // ── BAR CHART (share) ───────────────────────────────────
    {
      const mb  = { top:40, right:30, bottom:40, left:90 }
      const iHb = H2 - mb.top - mb.bottom
      const iWb = W  - mb.left - mb.right
      const g   = svgBar.append("g").attr("transform",`translate(${mb.left},${mb.top})`)

      const shareData = filtered
        .filter(d => d.year === shareYear)
        .map(d => ({ country: d.country, value: d.value }))

      const total = d3.sum(shareData, d => d.value)
      const shares = shareData
        .map(d => ({ country: d.country, pct: d.value / total * 100, color: colors[d.country] }))
        .sort((a,b) => b.pct - a.pct)

      const yScale = d3.scaleBand()
        .domain(shares.map(d => d.country))
        .range([0, iHb]).padding(0.3)

      const xMax  = d3.max(shares, d => d.pct)
      const xScale = d3.scaleLinear().domain([0, xMax * 1.1]).range([0, iWb])

      // Title
      svgBar.append("text")
        .attr("x", W/2).attr("y", 22)
        .attr("text-anchor","middle").attr("font-size",14).attr("font-weight","700").attr("fill","#222")
        .text(`Share of global ${selectedVar.toLowerCase()}, ${shareYear}`)

      // Gridlines
      g.append("g").selectAll("line")
        .data(xScale.ticks(6)).join("line")
        .attr("x1", d => xScale(d)).attr("x2", d => xScale(d))
        .attr("y1", 0).attr("y2", iHb)
        .attr("stroke","#e0e0e0")

      // Bars
      g.selectAll("rect").data(shares).join("rect")
        .attr("y",    d => yScale(d.country))
        .attr("x",    0)
        .attr("width", d => xScale(d.pct))
        .attr("height", yScale.bandwidth())
        .attr("fill", d => d.color)
        .on("mousemove", function(event, d) {
          tip.style("display","block")
            .style("left",(event.clientX+14)+"px")
            .style("top",(event.clientY-10)+"px")
            .html(`<strong>${d.country}</strong><br>
              <span style="color:#555">Share:</span> <strong>${d.pct.toFixed(1)}%</strong>`)
        })
        .on("mouseleave", () => tip.style("display","none"))

      // Country labels
      g.selectAll(".clabel").data(shares).join("text").attr("class","clabel")
        .attr("x", -6).attr("y", d => yScale(d.country) + yScale.bandwidth()/2)
        .attr("text-anchor","end").attr("dominant-baseline","middle")
        .attr("font-size",12).attr("fill","#333")
        .text(d => d.country)

      // X axis
      g.append("g").attr("transform",`translate(0,${iHb})`)
        .call(d3.axisBottom(xScale).ticks(6).tickFormat(d => d))
        .call(ax => ax.select(".domain").attr("stroke","#aaa"))
        .call(ax => ax.selectAll(".tick line").attr("stroke","#aaa"))

      g.append("text").attr("x", iWb/2).attr("y", iHb + 34)
        .attr("text-anchor","middle").attr("font-size",12).attr("fill","#555")
        .text("Percent")
    }
  }

  // ── LEGEND ───────────────────────────────────────────────
  const legendDiv = html`<div style="font-size:13px;font-family:sans-serif;
    display:flex;flex-direction:column;gap:5px;padding-top:60px;padding-left:16px"></div>`

  function updateLegend() {
    legendDiv.innerHTML = ""
    Object.entries(colorMap[selectedVar]).forEach(([country, color]) => {
      legendDiv.append(html`<div style="display:flex;align-items:center;gap:8px">
        <span style="width:24px;height:3px;background:${color};display:inline-block;flex-shrink:0"></span>
        <span style="color:#333">${country}</span>
      </div>`)
    })
  }

  // ── DROPDOWN ─────────────────────────────────────────────
  const selEl = html`<select style="padding:5px 8px;border:1px solid #bbb;
    border-radius:3px;font-size:13px;min-width:200px">
    ${variables.map(v => `<option ${v===selectedVar?"selected":""}>${v}</option>`).join("")}
  </select>`
  selEl.addEventListener("change", e => {
    selectedVar = e.target.value
    updateLegend()
    draw()
  })

  const ctrlRow = html`<div style="display:flex;align-items:center;gap:10px;
    font-family:sans-serif;font-size:13px;margin-bottom:12px">
    <strong>Select a variable</strong>
    ${selEl}
  </div>`

  // ── LAYOUT ───────────────────────────────────────────────
  const chartsCol = html`<div style="display:flex;flex-direction:column;gap:16px"></div>`
  chartsCol.append(svgLine.node(), svgBar.node())

  const topRow = html`<div style="display:flex;align-items:flex-start;gap:0"></div>`
  topRow.append(chartsCol, legendDiv)

  updateLegend()
  draw()

  const root = html`<div style="font-family:sans-serif;max-width:860px"></div>`
  root.append(ctrlRow, topRow)
  root.append(html`<p style="font-size:12px;color:#888;margin-top:12px">
    Source: USDA, Foreign Agricultural Service</p>`)

  invalidation.then(() => tip.remove())
  return root
}


function _d3(require){return(
require("d3@7")
)}

function _data(FileAttachment){return(
FileAttachment("cotton_data.csv").csv({ typed: true })
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["cotton_data.csv", {url: new URL("./files/e389bbdb4274af857dd59ef1b39c3dcce96eadef5026afc03df68208fa2f6ac86baf9cee096409a02891b21118be299fce55363f78b60183710d679befcc0a05.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["d3","data","html","invalidation"], _2);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  return main;
}
