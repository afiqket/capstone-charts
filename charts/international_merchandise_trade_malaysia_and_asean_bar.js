function _1(md){return(
md`# International Merchandise Trade Malaysia and ASEAN - bar`
)}

async function _2(FileAttachment,d3)
{
  const data = await FileAttachment("International Merchandise Trade Malaysia and ASEAN@1.csv").csv();

  // Ignore the Year column and reshape the data
  const cleaned = data.map(d => ({
    country: d.Country,
    category: d.Category,
    total: +d["Total RM"]
  }));

  const countries = [...new Set(cleaned.map(d => d.country))];
  const categories = [...new Set(cleaned.map(d => d.category))];

  const width = 1000;
  const height = 500;
  const marginTop = 40;
  const marginRight = 20;
  const marginBottom = 100;
  const marginLeft = 80;

  const x0 = d3.scaleBand()
    .domain(countries)
    .range([marginLeft, width - marginRight])
    .paddingInner(0.2);

  const x1 = d3.scaleBand()
    .domain(categories)
    .range([0, x0.bandwidth()])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(cleaned, d => d.total)]).nice()
    .range([height - marginBottom, marginTop]);

  const color = d3.scaleOrdinal()
    .domain(categories)
    .range(d3.schemeTableau10);

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height)
    .style("max-width", "100%")
    .style("height", "auto");

  // Bars
  svg.append("g")
    .selectAll("g")
    .data(d3.group(cleaned, d => d.country))
    .join("g")
      .attr("transform", ([country]) => `translate(${x0(country)},0)`)
    .selectAll("rect")
    .data(([, values]) => values)
    .join("rect")
      .attr("x", d => x1(d.category))
      .attr("y", d => y(d.total))
      .attr("width", x1.bandwidth())
      .attr("height", d => y(0) - y(d.total))
      .attr("fill", d => color(d.category))
    .append("title")
      .text(d => `${d.country}\n${d.category}: RM ${d.total.toLocaleString()}`);

  // X axis
  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x0))
    .selectAll("text")
      .attr("transform", "rotate(-35)")
      .style("text-anchor", "end");

  // Y axis
  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).tickFormat(d3.format(",")));

  // Y label
  svg.append("text")
    .attr("x", -height / 2)
    .attr("y", 20)
    .attr("transform", "rotate(-90)")
    .attr("fill", "currentColor")
    .attr("text-anchor", "middle")
    .text("Total RM");

  // Title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .attr("font-size", 18)
    .attr("font-weight", "bold")
    .text("International Merchandise Trade: Malaysia and ASEAN");

  // Legend
  const legend = svg.append("g")
    .attr("transform", `translate(${width - 150},${marginTop})`);

  categories.forEach((cat, i) => {
    const g = legend.append("g")
      .attr("transform", `translate(0,${i * 22})`);

    g.append("rect")
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", color(cat));

    g.append("text")
      .attr("x", 20)
      .attr("y", 11)
      .text(cat);
  });

  return svg.node();
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["International Merchandise Trade Malaysia and ASEAN@1.csv", {url: new URL("./files/fc5a32c324e1f14e69876f73c6c4c468a2649fef8437d1542170707fd0e07a0eaf27b7a75f69df003d78e39c8b12a2e61e0d051d1830996a5b0a15d638c904b7.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment","d3"], _2);
  return main;
}
