function _1(md){return(
md`# Olympic Games Medals over Time`
)}

async function _2(FileAttachment,d3)
{
  const raw = await FileAttachment("Olympic Games Medals over Time.csv").csv({ typed: true });

  const keys = [
    "United States",
    "China",
    "Russia",
    "Germany",
    "Great Britain",
    "Australia",
    "France",
    "Italy",
    "Other Europe",
    "Other Asia",
    "Other North America",
    "Middle East & North Africa",
    "Africa",
    "South America",
    "Latin America & Caribbean"
  ];

  const width = 1000;
  const height = 720;
  const margin = { top: 140, right: 40, bottom: 70, left: 40 };

  const colors = new Map([
    ["United States", "#86d19e"],              // green
    ["China", "#7fb3d5"],                     // soft blue
    ["Russia", "#d9a36f"],                    // orange-brown
    ["Germany", "#47c8d2"],                   // teal
    ["Great Britain", "#c39bd3"],             // purple
    ["Australia", "#d9c36a"],                 // yellow
    ["France", "#f1948a"],                    // soft red
    ["Italy", "#82e0aa"],                     // light green
    ["Other Europe", "#d1b07e"],              // beige
    ["Other Asia", "#76d7c4"],                // aqua
    ["Other North America", "#d98ea3"],       // pink
    ["Middle East & North Africa", "#f7dc6f"],// light gold
    ["Africa", "#af7ac5"],                    // violet
    ["South America", "#5dade2"],             // blue
    ["Latin America & Caribbean", "#f5b7b1"]  // pastel pink
  ]);

  const container = d3.create("div")
    .style("background", "#1f1f1f")
    .style("color", "#f2f2f2")
    .style("font-family", "Inter, system-ui, sans-serif")
    .style("padding", "18px 20px 10px 20px")
    .style("border", "1px solid #444")
    .style("max-width", `${width}px`);

  container.append("div")
    .style("font-size", "24px")
    .style("font-weight", "800")
    .style("margin-bottom", "6px")
    .text("Which countries have dominated the Olympics");

  container.append("div")
    .style("font-size", "14px")
    .style("font-weight", "600")
    .style("color", "#d9d9d9")
    .style("margin-bottom", "16px")
    .text("Olympic games medals by country/region");

  const controls = container.append("div")
    .style("display", "flex")
    .style("gap", "6px")
    .style("margin-bottom", "16px");

  let currentType = "Summer";

  const summerBtn = controls.append("button")
    .text("Summer")
    .style("padding", "7px 12px")
    .style("border-radius", "3px")
    .style("border", "1px solid #777")
    .style("background", "#3a3a3a")
    .style("color", "#fff")
    .style("font-weight", "700")
    .style("cursor", "pointer");

  const winterBtn = controls.append("button")
    .text("Winter")
    .style("padding", "7px 12px")
    .style("border-radius", "3px")
    .style("border", "1px solid #777")
    .style("background", "#1f1f1f")
    .style("color", "#fff")
    .style("font-weight", "700")
    .style("cursor", "pointer");

  const legend = container.append("div")
    .style("display", "flex")
    .style("flex-wrap", "wrap")
    .style("gap", "14px")
    .style("align-items", "center")
    .style("margin-bottom", "10px");

  for (const k of keys) {
    const item = legend.append("div")
      .style("display", "flex")
      .style("align-items", "center")
      .style("gap", "4px")
      .style("font-size", "12px")
      .style("font-weight", "600");

    item.append("div")
      .style("width", "24px")
      .style("height", "3px")
      .style("background", colors.get(k));

    item.append("div").text(k);
  }

  const svg = container.append("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("display", "block")
    .style("background", "#1f1f1f");

  const chart = svg.append("g");

  const tooltip = container.append("div")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("background", "rgba(20,20,20,0.95)")
    .style("border", "1px solid #666")
    .style("border-radius", "6px")
    .style("padding", "8px 10px")
    .style("font-size", "12px")
    .style("line-height", "1.4")
    .style("color", "#fff")
    .style("opacity", 0);

  function buttonState() {
    summerBtn
      .style("background", currentType === "Summer" ? "#4a4a4a" : "#1f1f1f");
    winterBtn
      .style("background", currentType === "Winter" ? "#4a4a4a" : "#1f1f1f");
  }

  function draw(type) {
    chart.selectAll("*").remove();

    const data = raw
      .filter(d => d.Type === type)
      .map(d => {
        const row = { year: +d.year };
        for (const k of keys) row[k] = +d[k] || 0;
        return row;
      })
      .sort((a, b) => d3.ascending(a.year, b.year));

    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.year))
      .range([margin.left, width - margin.right]);

    const stack = d3.stack()
      .keys(keys)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetSilhouette);
  
    const series = stack(data);

    const y = d3.scaleLinear()
      .domain([
        d3.min(series, layer => d3.min(layer, d => d[0])),
        d3.max(series, layer => d3.max(layer, d => d[1]))
      ])
      .range([margin.top, height - margin.bottom]);
    
    const area = d3.area()
      .x(d => x(d.data.year))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveBasis);
    
    chart.selectAll("path.layer")
      .data(series)
      .join("path")
      .attr("class", "layer")
      .attr("fill", d => colors.get(d.key))
      .attr("d", area)
      .attr("opacity", 0.95)
      .on("mousemove", function(event, layer) {
        const [mx] = d3.pointer(event, this);
        const year = Math.round(x.invert(mx));
        const closest = data.reduce((a, b) =>
          Math.abs(b.year - year) < Math.abs(a.year - year) ? b : a
        );
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${layer.key}</strong><br>
             Year: ${closest.year}<br>
             Medals: ${closest[layer.key]}`
          )
          .style("left", `${event.pageX + 14}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseleave", () => tooltip.style("opacity", 0));

    const xAxis = g => g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3.axisBottom(x)
          .tickValues(d3.range(
            Math.ceil(d3.min(data, d => d.year) / 10) * 10,
            d3.max(data, d => d.year) + 1,
            10
          ))
          .tickFormat(d3.format("d"))
      )
      .call(g => g.select(".domain").attr("stroke", "#e0e0e0"))
      .call(g => g.selectAll(".tick line").attr("stroke", "#e0e0e0"))
      .call(g => g.selectAll(".tick text")
        .attr("fill", "#f0f0f0")
        .attr("font-size", 12));

    chart.append("g").call(xAxis);

    const annotations = type === "Summer"
      ? [
          { year: 1916, label: "World War I" },
          { year: 1942, label: "No Olympic\nGames held\nduring World\nWar II" }
        ]
      : [
          { year: 1942, label: "No Winter Games\nheld during\nWorld War II" }
        ];

    chart.selectAll("line.anno")
      .data(annotations)
      .join("line")
      .attr("class", "anno")
      .attr("x1", d => x(d.year))
      .attr("x2", d => x(d.year))
      .attr("y1", margin.top + 10)
      .attr("y2", height - margin.bottom)
      .attr("stroke", "#d8d8d8")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3")
      .attr("opacity", 0.9);

    const annoText = chart.selectAll("text.anno-label")
      .data(annotations)
      .join("text")
      .attr("class", "anno-label")
      .attr("x", d => x(d.year) - 6)
      .attr("y", margin.top + 35)
      .attr("fill", "#f0f0f0")
      .attr("font-size", 12)
      .attr("font-weight", 700)
      .attr("text-anchor", "end");

    annoText.each(function(d) {
      const text = d3.select(this);
      const lines = d.label.split("\n");
      lines.forEach((line, i) => {
        text.append("tspan")
          .attr("x", x(d.year) - 6)
          .attr("dy", i === 0 ? 0 : 14)
          .text(line);
      });
    });

    svg.selectAll("text.source").remove();
    svg.append("text")
      .attr("class", "source")
      .attr("x", 0)
      .attr("y", height - 10)
      .attr("fill", "#d9d9d9")
      .attr("font-size", 12)
      .attr("font-weight", 600)
      .text("Source: Olympedia • Recreated in D3");
  }

  summerBtn.on("click", () => {
    currentType = "Summer";
    buttonState();
    draw(currentType);
  });

  winterBtn.on("click", () => {
    currentType = "Winter";
    buttonState();
    draw(currentType);
  });

  buttonState();
  draw(currentType);

  return container.node();
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["Olympic Games Medals over Time.csv", {url: new URL("./files/1321d779fc9703d297ca695a37dd800e4709db0ee42ddd2b36ab1a13235ad838dfe30695ae76bda7ade60276fad63f2868eab004514a80581f2101215fdc3db3.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment","d3"], _2);
  return main;
}
