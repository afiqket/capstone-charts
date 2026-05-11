function _1(md){return(
md`# data health bar 2
`
)}

async function _2(FileAttachment,d3,html)
{
  const raw = await FileAttachment("health data.csv").csv();

  const data = Array.from(
    d3.rollup(
      raw.filter(d => d["TypeofBreach"]),
      v => v.length,
      d => d["TypeofBreach"]
    ),
    ([category, value]) => ({ category, value })
  ).sort((a, b) => d3.descending(a.value, b.value));

  const width = 1000;
  const height = 520;
  const margin = { top: 50, right: 100, bottom: 30, left: 180 };

  const container = html`<div style="position:relative; font:12px sans-serif;"></div>`;

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", "100%")
    .style("height", "auto")
    .style("display", "block")
    .style("font", "12px sans-serif");

  container.appendChild(svg.node());

  // Tooltip
  const tooltip = html`<div style="
    position:absolute;
    pointer-events:none;
    background:white;
    border:1px solid #ccc;
    border-radius:6px;
    padding:10px 12px;
    font:12px sans-serif;
    box-shadow:0 2px 10px rgba(0,0,0,0.15);
    opacity:0;
    max-width:260px;
  "></div>`;

  container.appendChild(tooltip);

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)]).nice()
    .range([margin.left, width - margin.right]);

  const y = d3.scaleBand()
    .domain(data.map(d => d.category))
    .range([margin.top, height - margin.bottom])
    .padding(0.2);

  // X axis
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  // Y axis
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // Title
  svg.append("text")
    .attr("x", 20)
    .attr("y", 28)
    .attr("font-size", 16)
    .attr("font-weight", "bold")
    .text("Cause of Data Breach");

  // Bars
  svg.append("g")
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", margin.left)
    .attr("y", d => y(d.category))
    .attr("width", d => x(d.value) - margin.left)
    .attr("height", y.bandwidth())
    .attr("fill", "#4e79a7")
    .on("mousemove", function(event, d) {
      d3.select(this)
        .attr("fill", "#2f5f8f");

      const [mx, my] = d3.pointer(event, container);

      tooltip.style.opacity = 1;
      tooltip.style.left = `${mx + 15}px`;
      tooltip.style.top = `${my - 10}px`;
      tooltip.innerHTML = `
        <div style="font-weight:700; margin-bottom:6px;">Cause of Breach</div>
        <div style="margin-bottom:4px;">${d.category}</div>
        <div><strong>No. of Cases:</strong> ${d3.format(",")(d.value)}</div>
      `;
    })
    .on("mouseleave", function() {
      d3.select(this)
        .attr("fill", "#4e79a7");

      tooltip.style.opacity = 0;
    });

  // Value labels
  svg.append("g")
    .selectAll("text.value")
    .data(data)
    .join("text")
    .attr("class", "value")
    .attr("x", d => x(d.value) + 6)
    .attr("y", d => y(d.category) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .text(d => d3.format(",")(d.value));

  return container;
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["health data.csv", {url: new URL("./files/4d979e6b89f18f96833d58be7b56ff2d699c4ac47ac91776f85ea280021843a91aadc6d0385200dd1e2bfc597773f2c0a8903f219d78de5b8693675cffccefec.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment","d3","html"], _2);
  return main;
}
