function _1(md){return(
md`# The pursuit of happiness`
)}

async function _2(FileAttachment,width)
{
  const d3 = await import("https://cdn.jsdelivr.net/npm/d3@7/+esm");

  const raw = await FileAttachment("Data.1778511338451.csv").csv({ typed: false });

  const yearKeys = ["'14", "'15", "'16", "'17", "'18", "'19", "'20", "'21", "'22", "'23", "'24"];
  const firstYear = "'14";
  const lastYear = "'24";

  const colors = {
    up: "#ff8b45",
    down: "#5b94ff",
    faintUp: "#f1b27a",
    faintDown: "#9bbdff",
    text: "#111111",
    grid: "#e0e0e0"
  };

  function cleanNumber(value) {
    const n = +value;
    if (!Number.isFinite(n) || Math.abs(n) < 1e-8) return 0;
    return n;
  }

  const countries = raw
    .filter(d => d.Country && d.Country.trim() !== "Israel")
    .map(d => {
      const direction = String(d["Up or down"]).trim().toLowerCase();
      const pctChange = String(d["% change"]).trim();

      const values = {};
      for (const key of yearKeys) {
        values[key] = cleanNumber(d[key]);
      }

      return {
        country: d.Country.trim(),
        direction,
        pctChange,
        values,
        points: yearKeys.map(key => ({
          key,
          year: key.replace("'", "20"),
          value: values[key]
        })),
        ranks: {}
      };
    })
    .filter(d => yearKeys.every(key => Number.isFinite(d.values[key])));

  for (const key of yearKeys) {
    countries
      .slice()
      .sort((a, b) => d3.descending(a.values[key], b.values[key]))
      .forEach((d, i) => {
        d.ranks[key] = i + 1;
      });
  }

  const byCountry = new Map(countries.map(d => [d.country, d]));

  const fullWidth = 720;
  const fullHeight = 553;

  const fitWidth = Math.min(width, fullWidth);
  const scale = fitWidth / fullWidth;
  const fitHeight = fullHeight * scale;

  const margin = {
    top: 100,
    right: 166,
    bottom: 26,
    left: 125
  };

  const chartW = fullWidth - margin.left - margin.right;
  const chartH = fullHeight - margin.top - margin.bottom;

  const wrapper = d3.create("div")
    .style("position", "relative")
    .style("width", `${fitWidth}px`)
    .style("height", `${fitHeight}px`)
    .style("overflow", "hidden");

  const root = wrapper.append("div")
    .style("position", "absolute")
    .style("left", 0)
    .style("top", 0)
    .style("width", `${fullWidth}px`)
    .style("height", `${fullHeight}px`)
    .style("background", "#ffffff")
    .style("font-family", "Arial, Helvetica, sans-serif")
    .style("transform", `scale(${scale})`)
    .style("transform-origin", "top left");

  root.append("div")
    .style("position", "absolute")
    .style("left", "18px")
    .style("top", "0px")
    .style("font-size", "27px")
    .style("font-weight", "800")
    .style("color", colors.text)
    .text("The pursuit of happiness");

  root.append("div")
    .style("position", "absolute")
    .style("left", "18px")
    .style("top", "35px")
    .style("font-size", "15px")
    .style("color", colors.text)
    .html(`Tracking the <span style="text-decoration: underline; text-decoration-color:${colors.up};">ups</span> and <span style="text-decoration: underline; text-decoration-color:${colors.down};">downs</span> of global mood`);

  const svg = root.append("svg")
    .attr("width", fullWidth)
    .attr("height", fullHeight)
    .style("position", "absolute")
    .style("left", 0)
    .style("top", 0);

  const x = d3.scalePoint()
    .domain(yearKeys)
    .range([margin.left, margin.left + chartW]);

  const allValues = countries.flatMap(d => yearKeys.map(key => d.values[key]));

  const y = d3.scaleLinear()
    .domain([d3.min(allValues) - 0.15, d3.max(allValues) + 0.15])
    .range([margin.top + chartH, margin.top]);

  const line = d3.line()
    .x(d => x(d.key))
    .y(d => y(d.value));

  svg.selectAll(".year-grid")
    .data(yearKeys)
    .join("line")
    .attr("x1", d => x(d))
    .attr("x2", d => x(d))
    .attr("y1", margin.top)
    .attr("y2", margin.top + chartH)
    .attr("stroke", colors.grid)
    .attr("stroke-width", 1)
    .attr("opacity", 0.75);

  svg.selectAll(".year-label")
    .data(yearKeys)
    .join("text")
    .attr("x", d => x(d))
    .attr("y", margin.top - 20)
    .attr("text-anchor", "middle")
    .attr("font-size", 9)
    .attr("fill", "#111")
    .text(d => d);

  const faintLayer = svg.append("g");
  const selectedLayer = svg.append("g");
  const selectedLabelLayer = svg.append("g");
  const hoverLayer = svg.append("g");

  faintLayer.selectAll(".faint-line")
    .data(countries)
    .join("path")
    .attr("class", "faint-line")
    .attr("fill", "none")
    .attr("stroke", d => d.direction === "up" ? colors.faintUp : colors.faintDown)
    .attr("stroke-width", 0.85)
    .attr("opacity", 0.13)
    .attr("d", d => line(d.points));

  const tooltipW = 230;
  const tooltipH = 54;

  const tooltip = svg.append("g")
    .style("display", "none")
    .style("pointer-events", "none");

  tooltip.append("rect")
    .attr("width", tooltipW)
    .attr("height", tooltipH)
    .attr("rx", 2)
    .attr("fill", "#ffffff")
    .attr("filter", "drop-shadow(0px 2px 6px rgba(0,0,0,0.25))");

  tooltip.append("text")
    .attr("class", "tooltip-line-1")
    .attr("x", 9)
    .attr("y", 21)
    .attr("font-size", 12)
    .attr("font-weight", 700)
    .attr("fill", "#111");

  tooltip.append("text")
    .attr("class", "tooltip-line-2")
    .attr("x", 9)
    .attr("y", 39)
    .attr("font-size", 11)
    .attr("fill", "#111");

  function colorFor(d) {
    return d.direction === "up" ? colors.up : colors.down;
  }

  function directionWord(d) {
    return d.direction === "up" ? "up" : "down";
  }

  function placeTooltip(px, py) {
    let tx = px + 14;
    let ty = py - tooltipH / 2;

    if (tx + tooltipW > fullWidth - 8) {
      tx = px - tooltipW - 14;
    }

    if (tx < 8) {
      tx = 8;
    }

    if (ty < margin.top + 4) {
      ty = margin.top + 4;
    }

    if (ty + tooltipH > margin.top + chartH - 4) {
      ty = margin.top + chartH - tooltipH - 4;
    }

    tooltip
      .attr("transform", `translate(${tx}, ${ty})`)
      .style("display", null)
      .raise();
  }

  const selectedCountries = new Set();

  function adjustLabelPositions(labels, minGap = 11) {
    labels.sort((a, b) => d3.ascending(a.y, b.y));

    for (let i = 1; i < labels.length; i++) {
      if (labels[i].y - labels[i - 1].y < minGap) {
        labels[i].y = labels[i - 1].y + minGap;
      }
    }

    for (let i = labels.length - 2; i >= 0; i--) {
      if (
        labels[i + 1].y > margin.top + chartH - 3 &&
        labels[i].y > labels[i + 1].y - minGap
      ) {
        labels[i].y = labels[i + 1].y - minGap;
      }
    }

    for (const d of labels) {
      d.y = Math.max(margin.top + 5, Math.min(margin.top + chartH - 4, d.y));
    }

    return labels;
  }

  function renderSelected() {
    const selectedData = Array.from(selectedCountries)
      .map(name => byCountry.get(name))
      .filter(Boolean);

    selectedLayer.selectAll(".selected-line")
      .data(selectedData, d => d.country)
      .join(
        enter => enter.append("path")
          .attr("class", "selected-line")
          .attr("fill", "none")
          .attr("stroke-width", 2.4)
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("stroke", d => colorFor(d))
          .attr("d", d => line(d.points)),
        update => update
          .attr("stroke", d => colorFor(d))
          .attr("d", d => line(d.points)),
        exit => exit.remove()
      );

    selectedLayer.selectAll(".selected-dot")
      .data(selectedData.flatMap(d => d.points.map(p => ({ ...p, country: d.country, direction: d.direction }))), d => `${d.country}-${d.key}`)
      .join(
        enter => enter.append("circle")
          .attr("class", "selected-dot")
          .attr("cx", d => x(d.key))
          .attr("cy", d => y(d.value))
          .attr("r", 2.1)
          .attr("fill", d => d.direction === "up" ? colors.up : colors.down),
        update => update
          .attr("cx", d => x(d.key))
          .attr("cy", d => y(d.value))
          .attr("fill", d => d.direction === "up" ? colors.up : colors.down),
        exit => exit.remove()
      );

    const leftLabels = adjustLabelPositions(selectedData.map(d => ({
      side: "left",
      country: d.country,
      direction: d.direction,
      rank: d.ranks[firstYear],
      y: y(d.values[firstYear])
    })));

    const rightLabels = adjustLabelPositions(selectedData.map(d => ({
      side: "right",
      country: d.country,
      direction: d.direction,
      rank: d.ranks[lastYear],
      y: y(d.values[lastYear])
    })));

    const allLabels = [...leftLabels, ...rightLabels];

    selectedLabelLayer.selectAll(".selected-country-label")
      .data(allLabels, d => `${d.side}-${d.country}`)
      .join(
        enter => enter.append("text")
          .attr("class", "selected-country-label")
          .attr("x", d => d.side === "left" ? margin.left - 8 : margin.left + chartW + 10)
          .attr("y", d => d.y + 3)
          .attr("text-anchor", d => d.side === "left" ? "end" : "start")
          .attr("font-size", 9.8)
          .attr("font-weight", 500)
          .attr("fill", d => d.direction === "up" ? colors.up : colors.down)
          .style("cursor", "pointer")
          .text(d => d.side === "left" ? `${d.country} ${d.rank}` : `${d.rank} ${d.country}`)
          .on("click", (event, d) => {
            event.stopPropagation();
            selectedCountries.delete(d.country);
            renderSelected();
          }),
        update => update
          .attr("x", d => d.side === "left" ? margin.left - 8 : margin.left + chartW + 10)
          .attr("y", d => d.y + 3)
          .attr("text-anchor", d => d.side === "left" ? "end" : "start")
          .attr("fill", d => d.direction === "up" ? colors.up : colors.down)
          .text(d => d.side === "left" ? `${d.country} ${d.rank}` : `${d.rank} ${d.country}`),
        exit => exit.remove()
      );

    selectedLayer.raise();
    selectedLabelLayer.raise();
    hoverLayer.raise();
    tooltip.raise();
  }

  function showTooltip(event, d) {
    const [px] = d3.pointer(event, svg.node());

    const nearestKey = yearKeys.reduce((best, key) => {
      return Math.abs(x(key) - px) < Math.abs(x(best) - px) ? key : best;
    }, yearKeys[0]);

    const point = d.points.find(p => p.key === nearestKey) || d.points[d.points.length - 1];

    hoverLayer.selectAll("*").remove();

    hoverLayer.append("circle")
      .attr("cx", x(point.key))
      .attr("cy", y(point.value))
      .attr("r", 3.5)
      .attr("fill", colorFor(d))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1.5)
      .style("pointer-events", "none");

    tooltip.select(".tooltip-line-1")
      .text(`${d.country}'s happiness score is ${directionWord(d)}`);

    tooltip.select(".tooltip-line-2")
      .text(`by ${String(d.pctChange).replace("-", "")} since 2014`);

    placeTooltip(x(point.key), y(point.value));

    hoverLayer.raise();
    tooltip.raise();
  }

  function hideTooltip() {
    tooltip.style("display", "none");
    hoverLayer.selectAll("*").remove();
  }

  function selectCountry(event, d) {
    event.preventDefault();
    event.stopPropagation();

    selectedCountries.add(d.country);
    renderSelected();
  }

  svg.append("g")
    .selectAll(".click-line")
    .data(countries)
    .join("path")
    .attr("class", "click-line")
    .attr("fill", "none")
    .attr("stroke", "transparent")
    .attr("stroke-width", 12)
    .attr("d", d => line(d.points))
    .style("cursor", "pointer")
    .on("mouseenter", showTooltip)
    .on("mousemove", showTooltip)
    .on("mouseleave", hideTooltip)
    .on("click", selectCountry);

  return wrapper.node();
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["Data.1778511338451.csv", {url: new URL("./files/a1497450fb157c5edb6972d601ffbcac176b6c7962371792e4919257656ac608ce9d3d61ed13380f1a6a039a00ebc08a91f691d287329b5f0a40102438fb8f2f.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment","width"], _2);
  return main;
}
