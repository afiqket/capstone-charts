function _1(md){return(
md`# Life expectancy`
)}

async function _2(FileAttachment)
{
  const d3 = await import("https://cdn.jsdelivr.net/npm/d3@7/+esm");

  const data = await FileAttachment("life_expectancy.csv").csv({ typed: true });

  const width = 980;
  const height = 650;

  const margin = {
    top: 70,
    right: 40,
    bottom: 70,
    left: 140
  };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = 420;

  const years = [...new Set(data.map(d => +d.Year))].sort((a, b) => a - b);
  const minYear = d3.min(years);
  const maxYear = d3.max(years);

  let currentYear = maxYear;
  let playing = false;
  let timer = null;

  const continents = [
    "Asia",
    "Europe",
    "Africa",
    "Oceania",
    "North America",
    "South America"
  ];

  const color = d3.scaleOrdinal()
    .domain(continents)
    .range([
      "#1f6ad6",
      "#9b5edb",
      "#ea4c89",
      "#e95f0a",
      "#e6b21a",
      "#0f8b8d"
    ]);

  const x = d3.scaleLinear()
    .domain([20, 90])
    .range([0, innerWidth]);

  const y = d3.scaleLinear()
    .domain([20, 90])
    .range([innerHeight, 0]);

  const r = d3.scaleSqrt()
    .domain(d3.extent(data, d => +d["All population"]))
    .range([2.5, 34]);

  const formatPop = d3.format(",");

  const container = d3.create("div")
    .style("font-family", "Arial, Helvetica, sans-serif")
    .style("position", "relative")
    .style("width", `${width}px`)
    .style("color", "#222");

  container.append("div")
    .style("font-size", "28px")
    .style("font-weight", "700")
    .style("line-height", "1.1")
    .style("margin-left", "18px")
    .text("Life expectancy around the world more than doubled since 1950");

  container.append("div")
    .style("font-size", "24px")
    .style("line-height", "1.1")
    .style("margin-left", "18px")
    .style("margin-bottom", "22px")
    .text("Male vs female life expectancy, 1950-2021");

  const controls = container.append("div")
    .style("display", "flex")
    .style("align-items", "center")
    .style("gap", "8px")
    .style("margin-left", "18px")
    .style("margin-bottom", "22px");

  const playButton = controls.append("button")
    .style("border", "none")
    .style("background", "transparent")
    .style("font-size", "22px")
    .style("cursor", "pointer")
    .style("padding", "0")
    .style("width", "22px")
    .text("▶");

  const slider = controls.append("input")
    .attr("type", "range")
    .attr("min", minYear)
    .attr("max", maxYear)
    .attr("step", 1)
    .attr("value", currentYear)
    .style("width", "180px")
    .style("accent-color", "#333");

  const yearLabel = controls.append("span")
    .style("font-size", "18px")
    .style("font-weight", "700")
    .style("margin-left", "2px")
    .text(currentYear);

  const legend = container.append("div")
    .style("display", "flex")
    .style("align-items", "center")
    .style("gap", "7px")
    .style("font-size", "18px")
    .style("margin-left", "18px")
    .style("margin-bottom", "8px");

  legend.append("span")
    .style("font-weight", "700")
    .text("Continent");

  continents.forEach(continent => {
    const item = legend.append("span")
      .style("display", "inline-flex")
      .style("align-items", "center")
      .style("gap", "4px");

    item.append("span")
      .style("width", "14px")
      .style("height", "14px")
      .style("border-radius", "50%")
      .style("background", color(continent))
      .style("display", "inline-block");

    item.append("span")
      .text(continent);
  });

  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", 600);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(
      d3.axisBottom(x)
        .tickValues(d3.range(20, 91, 5))
        .tickSize(-innerHeight)
        .tickFormat("")
    );

  g.append("g")
    .call(
      d3.axisLeft(y)
        .tickValues(d3.range(20, 91, 10))
        .tickSize(-innerWidth)
        .tickFormat("")
    );

  g.selectAll(".tick line")
    .attr("stroke", "#e8e8e8");

  g.selectAll(".domain")
    .remove();

  g.append("line")
    .attr("x1", x(20))
    .attr("y1", y(20))
    .attr("x2", x(90))
    .attr("y2", y(90))
    .attr("stroke", "#222")
    .attr("stroke-width", 1.4)
    .attr("stroke-dasharray", "5 5");

  const watermark = g.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight / 2 + 20)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 170)
    .attr("font-weight", 800)
    .attr("fill", "#d9d9d9")
    .attr("opacity", 0.55)
    .text(currentYear);

  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(
      d3.axisBottom(x)
        .tickValues(d3.range(20, 91, 10))
        .tickFormat(d => `${d} years`)
        .tickSizeOuter(0)
    )
    .call(g => g.select(".domain").remove());

  g.append("g")
    .call(
      d3.axisLeft(y)
        .tickValues(d3.range(20, 91, 10))
        .tickFormat(d => `${d} years`)
        .tickSizeOuter(0)
    )
    .call(g => g.select(".domain").remove());

  g.selectAll(".tick text")
    .attr("font-size", 16)
    .attr("fill", "#333");

  g.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 58)
    .attr("text-anchor", "middle")
    .attr("font-size", 18)
    .attr("fill", "#333")
    .text("Male expectancy");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -90)
    .attr("text-anchor", "middle")
    .attr("font-size", 18)
    .attr("fill", "#333")
    .text("Female expectancy");

  const pointsLayer = g.append("g");

  const tooltip = container.append("div")
    .style("position", "absolute")
    .style("display", "none")
    .style("pointer-events", "none")
    .style("background", "white")
    .style("box-shadow", "0 3px 12px rgba(0,0,0,0.25)")
    .style("border-radius", "2px")
    .style("min-width", "280px")
    .style("z-index", 10)
    .style("font-size", "18px")
    .style("color", "#444");

  function showTooltip(event, d) {
    tooltip
      .style("display", "block")
      .html(`
        <div style="
          background:#2f2f32;
          color:white;
          font-weight:700;
          padding:8px 10px;
        ">
          ${d.Country}
        </div>

        <div style="padding:8px 10px 10px 10px;">
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid #eee; padding:4px 0;">
            <span>continent</span>
            <span>${d.Continent}</span>
          </div>

          <div style="display:flex; justify-content:space-between; border-bottom:1px solid #eee; padding:4px 0;">
            <span>All<br>population</span>
            <span>${formatPop(+d["All population"])}</span>
          </div>

          <div style="display:flex; justify-content:space-between; border-bottom:1px solid #eee; padding:4px 0;">
            <span>Year</span>
            <span>${d.Year}</span>
          </div>

          <div style="display:flex; justify-content:space-between; border-bottom:1px solid #eee; padding:4px 0;">
            <span>Male</span>
            <span>${(+d.Male).toFixed(1)}</span>
          </div>

          <div style="display:flex; justify-content:space-between; padding:4px 0;">
            <span>female</span>
            <span>${(+d.Female).toFixed(1)}</span>
          </div>
        </div>
      `);

    moveTooltip(event);
  }

  function moveTooltip(event) {
    const bounds = container.node().getBoundingClientRect();

    let left = event.clientX - bounds.left + 16;
    let top = event.clientY - bounds.top - 10;

    const tooltipNode = tooltip.node();
    const tooltipWidth = tooltipNode.offsetWidth;
    const tooltipHeight = tooltipNode.offsetHeight;

    if (left + tooltipWidth > width - 10) {
      left = event.clientX - bounds.left - tooltipWidth - 16;
    }

    if (top + tooltipHeight > 600) {
      top = 600 - tooltipHeight - 10;
    }

    tooltip
      .style("left", `${left}px`)
      .style("top", `${top}px`);
  }

  function hideTooltip() {
    tooltip.style("display", "none");
  }

  function dataForYear(year) {
    return data
      .filter(d =>
        +d.Year === +year &&
        Number.isFinite(+d.Male) &&
        Number.isFinite(+d.Female) &&
        Number.isFinite(+d["All population"])
      )
      .sort((a, b) => d3.descending(+a["All population"], +b["All population"]));
  }

  function update(year, animate = true) {
    currentYear = +year;

    slider.property("value", currentYear);
    yearLabel.text(currentYear);

    watermark
      .text(currentYear);

    const duration = animate ? 170 : 0;

    const circles = pointsLayer
      .selectAll("circle")
      .data(dataForYear(currentYear), d => d.Country);

    const entered = circles.enter()
      .append("circle")
      .attr("cx", d => x(+d.Male))
      .attr("cy", d => y(+d.Female))
      .attr("r", 0)
      .attr("fill", d => color(d.Continent))
      .attr("stroke", d => d3.color(color(d.Continent)).darker(0.8))
      .attr("stroke-width", 0.9)
      .attr("fill-opacity", 0.65)
      .on("mouseenter", showTooltip)
      .on("mousemove", moveTooltip)
      .on("mouseleave", hideTooltip);

    entered
      .transition()
      .duration(duration)
      .ease(d3.easeLinear)
      .attr("r", d => r(+d["All population"]));

    circles
      .transition()
      .duration(duration)
      .ease(d3.easeLinear)
      .attr("cx", d => x(+d.Male))
      .attr("cy", d => y(+d.Female))
      .attr("r", d => r(+d["All population"]))
      .attr("fill", d => color(d.Continent))
      .attr("stroke", d => d3.color(color(d.Continent)).darker(0.8));

    circles.exit()
      .transition()
      .duration(duration)
      .ease(d3.easeLinear)
      .attr("r", 0)
      .remove();
  }

  function stopPlay() {
    playing = false;
    playButton.text("▶");

    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function startPlay() {
    playing = true;
    playButton.text("❚❚");

    if (currentYear >= maxYear) {
      currentYear = minYear;
      update(currentYear, false);
    }

    const totalDuration = 12000;
    const intervalTime = totalDuration / (maxYear - minYear);

    timer = setInterval(() => {
      if (currentYear >= maxYear) {
        stopPlay();
        return;
      }

      currentYear += 1;
      update(currentYear, true);
    }, intervalTime);
  }

  playButton.on("click", () => {
    if (playing) {
      stopPlay();
    } else {
      startPlay();
    }
  });

  slider.on("input", function () {
    stopPlay();
    update(+this.value, true);
  });

  update(currentYear, false);

  return container.node();
}


function _3(md){return(
md`Original by Scott Barber (@scottb) on [Flourish](https://flourish.studio/examples/?q=Life+expectancy)`
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["life_expectancy.csv", {url: new URL("./files/bdd33362c0c0fd8d93e91c827b5c9b7057c4a89dfb37d96c4d2a1bdf42eb4c1658bde6edd223f87300475c241f8431ac679e991e263b69d156313f2fe5683a94.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment"], _2);
  main.variable(observer()).define(["md"], _3);
  return main;
}
