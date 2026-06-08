function _1(md){return(
md`# Uber Usage Trends in Pakistan: Bookings and Revenue, 2024–2025`
)}

async function _2(FileAttachment,d3)
{
  const width = 980;
  const height = 520;

  const margin = {
    top: 75,
    right: 30,
    bottom: 55,
    left: 65
  };

  const gap = 100;
  const chartWidth = (width - margin.left - margin.right - gap) / 2;
  const chartHeight = height - margin.top - margin.bottom;

  // Load only 2 files now
  const bookingsRaw = await FileAttachment("Total Bookings (Trend)_Full Data_data.csv").csv({ typed: true });
  const revenueRaw = await FileAttachment("Total Revenue (Trend)_Full Data_data.csv").csv({ typed: true });

  const parseMonth = d3.timeParse("%b-%y");
  const formatMonth = d3.timeFormat("%b %Y");

  function aggregateByMonth(data, valueColumn, vehicleCategory) {
    return Array.from(
      d3.rollup(
        data.filter(d => d["Vehicle Type (Calc)"] === vehicleCategory),
        v => d3.sum(v, d => +d[valueColumn]),
        d => d["Month of Date"]
      ),
      ([month, value]) => ({
        month,
        date: parseMonth(month),
        value
      })
    ).sort((a, b) => d3.ascending(a.date, b.date));
  }

  const dataset = {
    bookings: {
      title: "Total Bookings Trend",
      yLabel: "Total Bookings",
      mini: aggregateByMonth(bookingsRaw, "Total Bookings", "Mini"),
      premium: aggregateByMonth(bookingsRaw, "Total Bookings", "Premium")
    },
    revenue: {
      title: "Total Revenue Trend",
      yLabel: "Total Revenue",
      mini: aggregateByMonth(revenueRaw, "Total Revenue", "Mini"),
      premium: aggregateByMonth(revenueRaw, "Total Revenue", "Premium")
    }
  };

  const colors = {
    mini: "#2563eb",
    premium: "#dc2626"
  };

  const container = d3.create("div")
    .style("font-family", "Inter, system-ui, sans-serif")
    .style("width", `${width}px`)
    .style("position", "relative");

  const tabBar = container.append("div")
    .style("display", "flex")
    .style("gap", "10px")
    .style("margin-bottom", "16px");

  const chartArea = container.append("div");

  function drawPage(pageKey) {
    chartArea.selectAll("*").remove();

    const pageData = dataset[pageKey];

    tabBar.selectAll("button")
      .style("background", d => d.key === pageKey ? "#111827" : "#f3f4f6")
      .style("color", d => d.key === pageKey ? "white" : "#111827");

    const svg = chartArea.append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background", "#ffffff")
      .style("border", "1px solid #e5e7eb")
      .style("border-radius", "16px");

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 28)
      .attr("text-anchor", "middle")
      .attr("font-size", 20)
      .attr("font-weight", 700)
      .text("Uber Usage Trends in Pakistan: Bookings and Revenue, 2024–2025");
    
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 56)
      .attr("text-anchor", "middle")
      .attr("font-size", 15)
      .attr("font-weight", 600)
      .attr("fill", "#4b5563")
      .text(pageData.title);

    const tooltip = container.append("div")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "rgba(17, 24, 39, 0.92)")
      .style("color", "white")
      .style("padding", "8px 10px")
      .style("border-radius", "10px")
      .style("font-size", "12px")
      .style("opacity", 0)
      .style("z-index", 10);

    function drawSmallChart(group, data, type, xOffset) {
      const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, chartWidth]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value) * 1.15])
        .nice()
        .range([chartHeight, 0]);

      const g = group.append("g")
        .attr("transform", `translate(${margin.left + xOffset}, ${margin.top})`);

      const area = d3.area()
        .x(d => x(d.date))
        .y0(chartHeight)
        .y1(d => y(d.value))
        .curve(d3.curveMonotoneX);

      const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX);

      const gradientId = `gradient-${type}-${pageKey}`;

      const defs = svg.append("defs");

      const gradient = defs.append("linearGradient")
        .attr("id", gradientId)
        .attr("x1", "0%")
        .attr("x2", "0%")
        .attr("y1", "0%")
        .attr("y2", "100%");

      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colors[type])
        .attr("stop-opacity", 0.35);

      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colors[type])
        .attr("stop-opacity", 0.03);

      // grid lines
      g.selectAll(".grid-line")
        .data(y.ticks(5))
        .join("line")
        .attr("class", "grid-line")
        .attr("x1", 0)
        .attr("x2", chartWidth)
        .attr("y1", d => y(d))
        .attr("y2", d => y(d))
        .attr("stroke", "#e5e7eb")
        .attr("stroke-dasharray", "3,3");

      // area
      g.append("path")
        .datum(data)
        .attr("fill", `url(#${gradientId})`)
        .attr("d", area);

      // line
      g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", colors[type])
        .attr("stroke-width", 3)
        .attr("d", line);

      // points
      g.selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.value))
        .attr("r", 4.5)
        .attr("fill", "white")
        .attr("stroke", colors[type])
        .attr("stroke-width", 2)
        .on("mouseover", function(event, d) {
          d3.select(this)
            .attr("r", 7)
            .attr("fill", colors[type]);

          tooltip
            .style("opacity", 1)
            .html(`
              <strong>${type === "mini" ? "Mini" : "Premium"}</strong><br>
              Month: ${formatMonth(d.date)}<br>
              ${pageData.yLabel}: ${d3.format(",")(d.value)}
            `);
        })
        .on("mousemove", function(event) {
          const [mx, my] = d3.pointer(event, container.node());

          tooltip
            .style("left", `${mx + 14}px`)
            .style("top", `${my - 36}px`);
        })
        .on("mouseout", function() {
          d3.select(this)
            .attr("r", 4.5)
            .attr("fill", "white");

          tooltip.style("opacity", 0);
        });

      // x-axis
      g.append("g")
        .attr("transform", `translate(0, ${chartHeight})`)
        .call(
          d3.axisBottom(x)
            .ticks(5)
            .tickFormat(d3.timeFormat("%b %y"))
        )
        .selectAll("text")
        .style("font-size", "11px");

      // y-axis
      g.append("g")
        .call(
          d3.axisLeft(y)
            .ticks(5)
            .tickFormat(d3.format(","))
        )
        .selectAll("text")
        .style("font-size", "11px");

      // small chart title
      g.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", -24)
        .attr("text-anchor", "middle")
        .attr("font-size", 15)
        .attr("font-weight", 700)
        .attr("fill", colors[type])
        .text(type === "mini" ? "Mini" : "Premium");

      // x-axis label
      g.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", chartHeight + 42)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("fill", "#374151")
        .text("Month");

      // y-axis label
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -chartHeight / 2)
        .attr("y", -47)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("fill", "#374151")
        .text(pageData.yLabel);
    }

    // Mini left, Premium right
    drawSmallChart(svg, pageData.mini, "mini", 0);
    drawSmallChart(svg, pageData.premium, "premium", chartWidth + gap);
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 8)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("fill", "#6b7280")
      .text("Hover over each point to see the exact monthly value.");
  }

  const tabs = [
    { key: "bookings", label: "Total Bookings" },
    { key: "revenue", label: "Total Revenue" }
  ];

  tabBar.selectAll("button")
    .data(tabs)
    .join("button")
    .text(d => d.label)
    .style("border", "none")
    .style("border-radius", "999px")
    .style("padding", "10px 18px")
    .style("font-size", "14px")
    .style("font-weight", 600)
    .style("cursor", "pointer")
    .style("box-shadow", "0 2px 8px rgba(0,0,0,0.08)")
    .on("click", (event, d) => drawPage(d.key));

  drawPage("bookings");

  return container.node();
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["Total Revenue (Trend)_Full Data_data.csv", {url: new URL("./files/ea1d154c8c153c64469697d8025cd49be857bdd3051b2d58fe2f3967829c3db2f8a7444ab15876d6b7f84a95afa0f3fbc7f7303ebb174a7f2ecaf313be3ecb74.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["Total Bookings (Trend)_Full Data_data.csv", {url: new URL("./files/2b56d5e7521181130acba24be49cdfad0edc0a8c464572fdcfe8c88a19b4580b2b55c518d0124fa1d9e970ffbc2e4afce8ead36206c4a63443dbcf4503af8f07.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment","d3"], _2);
  return main;
}
