function _1(md){return(
md`# US GDP`
)}

async function _2(FileAttachment,d3,html)
{
  const data = await FileAttachment("us gdp.csv").csv(d3.autoType);

  const series = [
    { key: "Real GDP", color: "#0b2d5c", type: "line" },
    { key: "Consumption", color: "#c83b52", type: "bar" },
    { key: "Investment", color: "#7ec0df", type: "bar" },
    { key: "Net exports", color: "#d9d9d9", type: "bar" },
    { key: "Government spending", color: "#f4cf0a", type: "bar" }
  ];

  let active = new Set(series.map(d => d.key));

  const width = 1200;
  const height = 520;
  const margin = { top: 95, right: 110, bottom: 70, left: 60 };

  const bg = "#f3f3f3";
  const axisColor = "#cfcfcf";
  const textColor = "#4a4a4a";
  const mutedText = "#bfbfbf";

  const container = html`<div style="background:${bg}; position:relative; font-family:system-ui, sans-serif;"></div>`;

  const tooltip = d3.select(container)
    .append("div")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("background", "rgba(35,35,35,0.96)")
    .style("color", "white")
    .style("padding", "10px 12px")
    .style("border-radius", "6px")
    .style("font", "13px sans-serif")
    .style("line-height", "1.35")
    .style("box-shadow", "0 4px 14px rgba(0,0,0,0.25)");

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("display", "block")
    .style("max-width", "100%")
    .style("height", "auto")
    .style("background", bg);

  container.appendChild(svg.node());

  function fmtPct(v) {
    return `${d3.format(".1f")(v)}%`;
  }

  function showTooltip(event, title, label, value) {
    tooltip
      .style("opacity", 1)
      .html(`
        <div style="font-weight:700; margin-bottom:4px;">${title}</div>
        <div>${label}: <b>${fmtPct(value)}</b></div>
      `)
      .style("left", `${event.offsetX + 16}px`)
      .style("top", `${event.offsetY - 10}px`);
  }

  function hideTooltip() {
    tooltip.style("opacity", 0);
  }

  function render() {
    svg.selectAll("*").remove();

    const activeBars = series.filter(d => d.type === "bar" && active.has(d.key));
    const showLine = active.has("Real GDP");

    svg.append("text")
      .attr("x", 14)
      .attr("y", 34)
      .attr("font-size", 30)
      .attr("font-weight", 700)
      .attr("fill", textColor)
      .text("Contributions to U.S. quarterly GDP growth");

    const legend = svg.append("g")
      .attr("transform", `translate(14, 58)`);

    let lx = 0;
    series.forEach(s => {
      const isActive = active.has(s.key);

      const g = legend.append("g")
        .attr("transform", `translate(${lx}, 0)`)
        .style("cursor", "pointer")
        .on("click", () => {
          if (active.has(s.key)) {
            if (active.size > 1) active.delete(s.key);
          } else {
            active.add(s.key);
          }
          render();
        });

      g.append("rect")
        .attr("x", 0)
        .attr("y", -12)
        .attr("width", 18)
        .attr("height", 18)
        .attr("rx", 2)
        .attr("fill", isActive ? s.color : "#d8d8d8");

      g.append("text")
        .attr("x", 26)
        .attr("y", 3)
        .attr("font-size", 17)
        .attr("font-weight", isActive ? 700 : 400)
        .attr("fill", isActive ? textColor : mutedText)
        .text(s.key);

      lx += 26 + s.key.length * 9.8 + 18;
    });

    const x = d3.scaleBand()
      .domain(data.map(d => d.Month))
      .range([margin.left, width - margin.right])
      .padding(0.12);

    const allValues = [];
    data.forEach(d => {
      series.forEach(s => {
        if (active.has(s.key)) allValues.push(+d[s.key] || 0);
      });
    });

    const y = d3.scaleLinear()
      .domain([
        Math.min(-5, d3.min(allValues) - 0.5),
        Math.max(10, d3.max(allValues) + 0.5)
      ])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const yTicks = [-5, 0, 5, 10];

    svg.append("g")
      .selectAll("line")
      .data(yTicks)
      .join("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d))
      .attr("stroke", axisColor)
      .attr("stroke-width", 1);

    svg.append("g")
      .selectAll("text")
      .data(yTicks)
      .join("text")
      .attr("x", margin.left - 8)
      .attr("y", d => y(d))
      .attr("dy", "0.32em")
      .attr("text-anchor", "end")
      .attr("fill", "#7a7a7a")
      .attr("font-size", 16)
      .text(d => `${d}%`);

    svg.append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", y(0))
      .attr("y2", y(0))
      .attr("stroke", axisColor)
      .attr("stroke-width", 1.2);

    const yearTicks = data.filter((d, i) => i % 4 === 0);

    svg.append("g")
      .selectAll("text")
      .data(yearTicks)
      .join("text")
      .attr("x", d => x(d.Month) + x.bandwidth() / 2)
      .attr("y", height - margin.bottom + 38)
      .attr("text-anchor", "middle")
      .attr("fill", "#7a7a7a")
      .attr("font-size", 16)
      .text(d => d.Month.split("-")[1].length === 2 ? `20${d.Month.split("-")[1]}` : d.Month.split("-")[1]);

    const stackedData = data.map(d => {
      let pos = 0;
      let neg = 0;
      const segs = [];

      activeBars.forEach(s => {
        const v = +d[s.key] || 0;
        if (v >= 0) {
          segs.push({
            period: d.Month,
            key: s.key,
            value: v,
            y0: pos,
            y1: pos + v,
            color: s.color
          });
          pos += v;
        } else {
          segs.push({
            period: d.Month,
            key: s.key,
            value: v,
            y0: neg,
            y1: neg + v,
            color: s.color
          });
          neg += v;
        }
      });

      return { period: d.Month, segs };
    });

    const barsG = svg.append("g");

    stackedData.forEach(dp => {
      barsG.selectAll(null)
        .data(dp.segs)
        .join("rect")
        .attr("x", x(dp.period))
        .attr("width", x.bandwidth())
        .attr("y", d => y(Math.max(d.y0, d.y1)))
        .attr("height", d => Math.abs(y(d.y0) - y(d.y1)))
        .attr("fill", d => d.color)
        .attr("stroke", bg)
        .attr("stroke-width", 1.5)
        .on("mousemove", (event, d) => {
          showTooltip(event, d.period, d.key, d.value);
        })
        .on("mouseleave", hideTooltip);
    });

    stackedData.forEach(dp => {
      if (!dp.segs.length) return;

      const posSegs = dp.segs.filter(d => d.value >= 0);
      const negSegs = dp.segs.filter(d => d.value < 0);

      if (posSegs.length) {
        const top = d3.max(posSegs, d => d.y1);
        svg.append("text")
          .attr("x", x(dp.period) + x.bandwidth() / 2)
          .attr("y", y(top) - 8)
          .attr("text-anchor", "middle")
          .attr("font-size", 14)
          .attr("font-weight", 700)
          .attr("fill", textColor)
          .text(fmtPct(top).replace(".0%", "%"));
      }

      if (negSegs.length) {
        const bottom = d3.min(negSegs, d => d.y1);
        svg.append("text")
          .attr("x", x(dp.period) + x.bandwidth() / 2)
          .attr("y", y(bottom) + 22)
          .attr("text-anchor", "middle")
          .attr("font-size", 14)
          .attr("font-weight", 700)
          .attr("fill", textColor)
          .text(fmtPct(bottom).replace(".0%", "%"));
      }
    });

    if (showLine) {
      const line = d3.line()
        .x(d => x(d.Month) + x.bandwidth() / 2)
        .y(d => y(d["Real GDP"]));

      svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#0b2d5c")
        .attr("stroke-width", 3.5)
        .attr("d", line);

      svg.append("g")
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", d => x(d.Month) + x.bandwidth() / 2)
        .attr("cy", d => y(d["Real GDP"]))
        .attr("r", 6.5)
        .attr("fill", bg)
        .attr("stroke", "#0b2d5c")
        .attr("stroke-width", 3.5)
        .on("mousemove", (event, d) => {
          showTooltip(event, d.Month, "Real GDP", d["Real GDP"]);
        })
        .on("mouseleave", hideTooltip);
    }

    svg.append("text")
      .attr("x", 14)
      .attr("y", height - 16)
      .attr("font-size", 14)
      .attr("fill", textColor)
      .text("Source: U.S. Bureau of Economic Analysis");
  }

  render();
  return container;
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["us gdp.csv", {url: new URL("./files/0bb41aa56de1cbec15e314e316de91ffa0b5b96a769d6ea9cbe24ee0952cc2a1ff1f48e8da2207ccd2051de881e54bed7199db755279df14e1d54b0aa89e5056.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment","d3","html"], _2);
  return main;
}
