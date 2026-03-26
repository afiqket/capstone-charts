function _1(md){return(
md`# Malaysia Direct Investment Abroad DIA by Sector`
)}

async function _2(FileAttachment,d3,html)
{
  const raw = await FileAttachment("Malaysia Direct Investment Abroad DIA by Sector.csv").csv({ typed: true });

  // Aggregate in case there are multiple rows per Year + Sector
  const data = Array.from(
    d3.rollup(
      raw,
      v => ({
        valueRM: d3.sum(v, d => +d["Measure Value"]),
        valueUSD: d3.sum(v, d => +d["Measure Value (US$)"])
      }),
      d => d.Sector,
      d => d.Year
    ),
    ([sector, years]) =>
      Array.from(years, ([year, vals]) => ({
        sector,
        year,
        valueRM: vals.valueRM,
        valueUSD: vals.valueUSD
      }))
  ).flat();

  const sectors = Array.from(new Set(data.map(d => d.sector))).sort(d3.ascending);
  const years = Array.from(new Set(data.map(d => d.year)));

  let selectedSector = sectors.includes("Manufacturing") ? "Manufacturing" : sectors[0];
  let selectedYears = new Set(years);

  const width = 1365;
  const height = 714;
  const sidebarWidth = 240;
  const chartWidth = width - sidebarWidth - 40;
  const chartHeight = height - 70;
  const margin = { top: 80, right: 20, bottom: 40, left: 90 };

  const barColor = "#847b7b";
  const accent = "#5a9b99";
  const gridColor = "#d9d9d9";
  const axisColor = "#d0d0d0";
  const bg = "#f3f3f3";

  const container = html`<div style="
    font-family: system-ui, sans-serif;
    background: ${bg};
    width: ${width}px;
    height: ${height}px;
    position: relative;
    color: #333;
  "></div>`;

  const title = html`<div style="
    position: absolute;
    left: 0;
    top: 10px;
    width: ${chartWidth}px;
    text-align: center;
    font-size: 18px;
    font-weight: 700;
  ">
    Malaysia's Direct Investment Abroad (DIA) by Sector
  </div>`;

  const subtitle = html`<div style="
    position: absolute;
    left: 0;
    top: 54px;
    width: ${chartWidth}px;
    text-align: center;
    font-size: 14px;
  ">
    Year
  </div>`;

  const panel = html`<div style="
    position: absolute;
    right: 18px;
    top: 10px;
    width: ${sidebarWidth - 30}px;
    font-size: 14px;
  "></div>`;

  panel.innerHTML = `
    <div style="font-style: italic; color: #7d7d7d; margin-bottom: 8px;">View more:</div>
    <div style="
      background: #a8c8df;
      color: white;
      text-align: center;
      font-weight: 700;
      padding: 16px 0;
      margin-bottom: 14px;
      user-select: none;
    ">QUARTERLY</div>

    <div style="margin-bottom: 6px;">Sector</div>
    <select id="sectorSelect" style="width: 100%; padding: 2px 4px; margin-bottom: 20px;"></select>

    <div style="margin-bottom: 6px;">Year</div>
    <select id="yearSelect" multiple size="6" style="width: 100%; padding: 2px 4px; margin-bottom: 22px;"></select>

    <div style="line-height: 1.25;">
      <span>Source:</span>
      <strong> Department of<br>Statistics Malaysia<br>(DOSM)</strong>
    </div>
  `;

  const sectorSelect = panel.querySelector("#sectorSelect");
  const yearSelect = panel.querySelector("#yearSelect");

  sectors.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    if (s === selectedSector) opt.selected = true;
    sectorSelect.appendChild(opt);
  });

  years.forEach(y => {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    opt.selected = true;
    yearSelect.appendChild(opt);
  });

  const svg = d3.create("svg")
    .attr("width", chartWidth)
    .attr("height", height)
    .style("position", "absolute")
    .style("left", "0px")
    .style("top", "0px");

  const tooltip = html`<div style="
    position: absolute;
    pointer-events: none;
    opacity: 0;
    background: rgba(245,245,245,0.98);
    border: 1px solid #bfbfbf;
    box-shadow: 3px 3px 0 rgba(0,0,0,0.12);
    padding: 14px 16px;
    min-width: 230px;
    font-family: system-ui, sans-serif;
  "></div>`;

  container.appendChild(svg.node());
  container.appendChild(title);
  container.appendChild(subtitle);
  container.appendChild(panel);
  container.appendChild(tooltip);

  function render() {
    const filtered = data
      .filter(d => d.sector === selectedSector && selectedYears.has(d.year));

    const x = d3.scaleBand()
      .domain(filtered.map(d => d.year))
      .range([margin.left, chartWidth - margin.right])
      .padding(0.25);

    const minY = d3.min(filtered, d => d.valueRM) ?? 0;
    const maxY = d3.max(filtered, d => d.valueRM) ?? 0;

    const y = d3.scaleLinear()
      .domain([
        Math.min(minY, 0),
        Math.max(maxY, 0)
      ])
      .nice()
      .range([chartHeight - margin.bottom, margin.top]);

    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Gridlines
    g.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(
        d3.axisLeft(y)
          .tickSize(-(chartWidth - margin.left - margin.right))
          .tickFormat("")
      )
      .call(g => g.selectAll(".tick line").attr("stroke", gridColor))
      .call(g => g.select(".domain").remove());

    // Zero line
    g.append("line")
      .attr("x1", margin.left)
      .attr("x2", chartWidth - margin.right)
      .attr("y1", y(0))
      .attr("y2", y(0))
      .attr("stroke", "#c6c6c6")
      .attr("stroke-dasharray", "2,2");

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${chartHeight - margin.bottom})`)
      .call(d3.axisBottom(x))
      .call(g => g.select(".domain").attr("stroke", axisColor))
      .call(g => g.selectAll(".tick line").attr("stroke", axisColor))
      .call(g => g.selectAll("text").attr("fill", "#5a6770").style("font-size", "12px"));

    // Y axis
    g.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(
        d3.axisLeft(y)
          .tickValues(d3.range(Math.ceil(minY / 5) * 5, Math.floor(maxY / 5) * 5 + 5, 5))
          .tickFormat(d3.format(".1f"))
      )
      .call(g => g.select(".domain").attr("stroke", axisColor))
      .call(g => g.selectAll(".tick line").attr("stroke", axisColor))
      .call(g => g.selectAll("text").attr("fill", "#5a6770").style("font-size", "12px"));

    // Y label
    g.append("text")
      .attr("transform", `translate(${24},${chartHeight / 2}) rotate(-90)`)
      .attr("text-anchor", "middle")
      .attr("fill", "#333")
      .style("font-size", "14px")
      .text("RM/bil");

    // Bars
    g.selectAll("rect.bar")
      .data(filtered)
      .join("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.year))
      .attr("width", x.bandwidth())
      .attr("y", d => d.valueRM >= 0 ? y(d.valueRM) : y(0))
      .attr("height", d => Math.abs(y(d.valueRM) - y(0)))
      .attr("fill", barColor)
      .attr("stroke", "none")
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .attr("stroke", "#222")
          .attr("stroke-width", 1.2);

        tooltip.style.opacity = 1;
        tooltip.innerHTML = `
          <div style="color:${accent}; font-size:18px; font-weight:700; margin-bottom:2px;">
            ${d.sector}
          </div>
          <div style="font-weight:700; font-size:14px; margin-bottom:4px;">${d.year}</div>
          <div style="font-size:15px;">
            <span style="color:#999;">Value (bil)</span> :
            <strong>RM ${d.valueRM.toFixed(1)}</strong>
            &nbsp;|&nbsp;
            <strong>US$ ${d.valueUSD.toFixed(1)}</strong>
          </div>
        `;
      })
      .on("mousemove", function (event) {
        const [mx, my] = d3.pointer(event, container);
        tooltip.style.left = `${Math.min(mx + 18, width - 280)}px`;
        tooltip.style.top = `${Math.max(20, my - 30)}px`;
      })
      .on("mouseleave", function () {
        d3.select(this).attr("stroke", "none");
        tooltip.style.opacity = 0;
      });
  }

  sectorSelect.addEventListener("change", () => {
    selectedSector = sectorSelect.value;
    render();
  });

  yearSelect.addEventListener("change", () => {
    selectedYears = new Set(Array.from(yearSelect.selectedOptions, d => d.value));
    render();
  });

  render();
  return container;
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["Malaysia Direct Investment Abroad DIA by Sector.csv", {url: new URL("./files/e31ba05813a942683c3a2eb4e0669cf8cc18f6285b4c2feebd2e249240f26c3877a184a99360dcb8211d62642d689c96e35456abee56ba700ef1fa7989043719.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment","d3","html"], _2);
  return main;
}
