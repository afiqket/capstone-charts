function _1(md){return(
md`# Cotton`
)}

async function _chart(FileAttachment,html,d3)
{
  const raw = await FileAttachment("cotton@2.csv").csv();

  const fallbackPalette = [
    "#b85a0d",
    "#ff8c1a",
    "#a9c8df",
    "#5b616b",
    "#5f9ecf",
    "#8fbc8f",
    "#c77d7d",
    "#8a6fb3",
    "#4f9d9d",
    "#c9a227"
  ];

  function normalizeTitle(title) {
    const t = String(title).toLowerCase().trim();

    if (t.includes("production")) return "production";
    if (t.includes("consumption")) return "consumption";
    if (t.includes("mill use")) return "consumption";
    if (t.includes("import")) return "imports";
    if (t.includes("export")) return "exports";

    return t;
  }

  const presetConfig = {
    production: {
      order: ["India", "China", "United States", "Brazil", "Pakistan"],
      colors: new Map([
        ["India", "#a9c8df"],
        ["China", "#f57c00"],
        ["United States", "#5f96c3"],
        ["Brazil", "#c85d00"],
        ["Pakistan", "#5b616b"]
      ])
    },

    consumption: {
      order: ["China", "India", "Pakistan", "Bangladesh", "Turkey", "Vietnam"],
      colors: new Map([
        ["China", "#f57c00"],
        ["India", "#a9c8df"],
        ["Pakistan", "#5b616b"],
        ["Bangladesh", "#1f78a8"],
        ["Turkey", "#c85d00"],
        ["Vietnam", "#5f96c3"]
      ])
    },

    imports: {
      order: ["Bangladesh", "Vietnam", "China", "Turkey", "Indonesia"],
      colors: new Map([
        ["Bangladesh", "#1f78a8"],
        ["Vietnam", "#5f96c3"],
        ["China", "#f57c00"],
        ["Turkey", "#c85d00"],
        ["Indonesia", "#a7adb6"]
      ])
    },

    exports: {
      order: ["United States", "India", "Brazil", "Australia"],
      colors: new Map([
        ["United States", "#5f96c3"],
        ["India", "#a9c8df"],
        ["Brazil", "#c85d00"],
        ["Australia", "#f2b77b"]
      ])
    }
  };

  const titles = Array.from(new Set(raw.map(d => d.Title))).sort();
  let selectedTitle = "Production";

  const width = 760;
  const lineHeight = 360;
  const barHeight = 280;
  const gap = 10;
  const height = lineHeight + gap + barHeight;

  const marginTop = 30;
  const marginRight = 170;
  const marginBottom = 50;
  const marginLeft = 80;

  const barMarginTop = lineHeight + gap + 40;
  const barMarginBottom = 40;
  const barMarginLeft = marginLeft;

  const legendX = width - marginRight + 16;
  const legendRight = width - 16;

  // move right edge left a bit so percent labels are not cut off
  const barRight = legendRight - 38;

  const legendY = marginTop + 34;

  const container = html`<div style="position:relative; width:${width}px;"></div>`;

  const selectWrap = html`
    <div style="
      position:absolute;
      left:${legendX}px;
      top:0px;
      width:${legendRight - legendX}px;
      font:12px sans-serif;
    ">
      <div style="margin-bottom:4px; font-weight:600;">Title</div>
      <select style="
        width:100%;
        padding:4px 6px;
        font-size:12px;
        border:1px solid #ccc;
        border-radius:4px;
        background:white;
      ">
        ${titles.map(t => html`<option value="${t}" ${t === selectedTitle ? "selected" : null}>${t}</option>`)}
      </select>
    </div>
  `;

  const select = selectWrap.querySelector("select");
  container.appendChild(selectWrap);

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", "100%")
    .style("height", "auto")
    .style("display", "block");

  container.appendChild(svg.node());

  function render() {
    svg.selectAll("*").remove();

    const titleKey = normalizeTitle(selectedTitle);
    const preset = presetConfig[titleKey] || { order: [], colors: new Map() };

    const data = raw
      .filter(d => d.Title === selectedTitle)
      .map(d => ({
        year: +d.YearNum,
        country: d.CtrName,
        value: +String(d.Value).replace(/,/g, "")
      }))
      .filter(d => !isNaN(d.year) && !isNaN(d.value));

    const countriesInData = Array.from(new Set(data.map(d => d.country)));

    // Legend order: preset order first, then any extras
    const countries = [
      ...preset.order.filter(c => countriesInData.includes(c)),
      ...countriesInData.filter(c => !preset.order.includes(c)).sort()
    ];

    const colorMap = new Map();

    countries.forEach((c, i) => {
      colorMap.set(c, preset.colors.get(c) || fallbackPalette[i % fallbackPalette.length]);
    });

    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.year))
      .range([marginLeft, width - marginRight]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)]).nice()
      .range([lineHeight - marginBottom, marginTop]);

    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.value));

    const series = countries.map(country => ({
      country,
      values: data
        .filter(d => d.country === country)
        .sort((a, b) => d3.ascending(a.year, b.year))
    })).filter(d => d.values.length > 0);

    const barData2017 = raw
      .filter(d => d.Title === selectedTitle && +d.YearNum === 2017)
      .map(d => ({
        country: d.CtrName,
        percent: +d.Percent
      }))
      .filter(d => !isNaN(d.percent))
      .sort((a, b) => {
        const ia = countries.indexOf(a.country);
        const ib = countries.indexOf(b.country);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return d3.descending(a.percent, b.percent);
      });

    const xBar = d3.scaleLinear()
      .domain([0, d3.max(barData2017, d => d.percent) || 1]).nice()
      .range([barMarginLeft, barRight]);

    const yBar = d3.scaleBand()
      .domain(barData2017.map(d => d.country))
      .range([barMarginTop, height - barMarginBottom])
      .padding(0.25);

    // TOP TITLE
    svg.append("text")
      .attr("x", marginLeft)
      .attr("y", 18)
      .attr("fill", "black")
      .style("font-size", "16px")
      .style("font-weight", "600")
      .text(`Leading cotton ${selectedTitle.toLowerCase()}, 2000-2018`);

    // TOP GRID Y
    svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(
        d3.axisLeft(y)
          .ticks(6)
          .tickSize(-(width - marginLeft - marginRight))
          .tickFormat("")
      )
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll("line").attr("stroke", "#d9d9d9"));

    // TOP GRID X
    svg.append("g")
      .attr("transform", `translate(0,${lineHeight - marginBottom})`)
      .call(
        d3.axisBottom(x)
          .tickFormat("")
          .tickSize(-(lineHeight - marginTop - marginBottom))
      )
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll("line").attr("stroke", "#d9d9d9"));

    // TOP X AXIS
    svg.append("g")
      .attr("transform", `translate(0,${lineHeight - marginBottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    // TOP Y AXIS
    svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(",")))
      .call(g => g.select(".domain").remove());

    // Y LABEL
    svg.append("text")
      .attr("x", -lineHeight / 2)
      .attr("y", 20)
      .attr("transform", "rotate(-90)")
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .style("font-size", "13px")
      .text("1,000 480lb bales");

    // X LABEL
    svg.append("text")
      .attr("x", (marginLeft + width - marginRight) / 2)
      .attr("y", lineHeight - 10)
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .style("font-size", "13px")
      .text("Year");

    // LINES
    svg.append("g")
      .selectAll("path")
      .data(series)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", d => colorMap.get(d.country))
      .attr("stroke-width", 2.5)
      .attr("d", d => line(d.values));

    // LEGEND
    const legend = svg.append("g")
      .attr("transform", `translate(${legendX},${legendY})`);

    countries.forEach((country, i) => {
      const g = legend.append("g")
        .attr("transform", `translate(0,${i * 22})`);

      g.append("rect")
        .attr("width", 14)
        .attr("height", 14)
        .attr("fill", colorMap.get(country));

      g.append("text")
        .attr("x", 20)
        .attr("y", 11)
        .style("font-size", "12px")
        .text(country);
    });

    // BOTTOM TITLE
    svg.append("text")
      .attr("x", barMarginLeft)
      .attr("y", barMarginTop - 18)
      .attr("fill", "black")
      .style("font-size", "16px")
      .style("font-weight", "600")
      .text(`${selectedTitle}, 2017 (%)`);

    // BOTTOM GRID
    svg.append("g")
      .attr("transform", `translate(0,${height - barMarginBottom})`)
      .call(
        d3.axisBottom(xBar)
          .ticks(6)
          .tickSize(-(height - barMarginBottom - barMarginTop))
          .tickFormat("")
      )
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll("line").attr("stroke", "#d9d9d9"));

    // BOTTOM X AXIS
    svg.append("g")
      .attr("transform", `translate(0,${height - barMarginBottom})`)
      .call(d3.axisBottom(xBar).ticks(6).tickFormat(d => `${d}%`));

    // BOTTOM Y AXIS
    svg.append("g")
      .attr("transform", `translate(${barMarginLeft},0)`)
      .call(d3.axisLeft(yBar))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").remove());

    // BOTTOM X LABEL
    svg.append("text")
      .attr("x", (barMarginLeft + barRight) / 2)
      .attr("y", height - 5)
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .style("font-size", "13px")
      .text("Percent");

    // BARS
    svg.append("g")
      .selectAll("rect")
      .data(barData2017)
      .join("rect")
      .attr("x", xBar(0))
      .attr("y", d => yBar(d.country))
      .attr("width", d => xBar(d.percent) - xBar(0))
      .attr("height", yBar.bandwidth())
      .attr("fill", d => colorMap.get(d.country));

    // BAR LABELS
    svg.append("g")
      .selectAll("text.bar-label")
      .data(barData2017)
      .join("text")
      .attr("class", "bar-label")
      .attr("x", d => xBar(d.percent) + 6)
      .attr("y", d => yBar(d.country) + yBar.bandwidth() / 2)
      .attr("dy", "0.35em")
      .style("font-size", "12px")
      .text(d => `${d.percent.toFixed(2)}%`);
  }

  select.addEventListener("change", () => {
    selectedTitle = select.value;
    render();
  });

  render();
  return container;
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["cotton@2.csv", {url: new URL("./files/659e068baf38f1c566609a24afc764ea7d41c11e1d5be3c9ac308014353f615ffff342f90404ffab1a13b0fe19472a0e43c44ce8aa05172751cc2654db4328b3.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("chart")).define("chart", ["FileAttachment","html","d3"], _chart);
  return main;
}
