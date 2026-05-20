function _1(md){return(
md`# Finland Tech Job Market Top Skill Demand Tracker 2024-2026`
)}

async function _2(FileAttachment,d3)
{
  const data = await FileAttachment("Skills by Seniority_data.csv").csv(d3.autoType);

  const topSkills = [
    "SQL",
    "Python",
    "Power BI",
    "Excel",
    "Azure",
    "Tableau",
    "Statistics",
    "Machine Learning",
    "A/B Testing",
    "Spark"
  ];

  const seniorities = Array.from(new Set(data.map(d => d["Seniority"])));

  const stackedData = topSkills.map(skill => {
    const row = { skill };

    seniorities.forEach(s => {
      row[s] =
        data.find(
          d =>
            d["Skill Name"] === skill &&
            d["Seniority"] === s
        )?.["Distinct count of Job Id"] || 0;
    });

    row.total = d3.sum(seniorities, s => row[s]);
    return row;
  });

  const width = 900;
  const height = 500;
  const margin = { top: 70, right: 170, bottom: 65, left: 140 };

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .style("font-family", "sans-serif");

  svg.append("text")
    .attr("x", 20)
    .attr("y", 38)
    .attr("font-size", 26)
    .attr("fill", "#333")
    .text("Top Skills Demand 2024-2026 by Seniority");

  const x = d3.scaleLinear()
    .domain([0, d3.max(stackedData, d => d.total)])
    .nice()
    .range([margin.left, width - margin.right]);

  const y = d3.scaleBand()
    .domain(stackedData.map(d => d.skill))
    .range([margin.top, height - margin.bottom])
    .padding(0.2);

  const color = d3.scaleOrdinal()
    .domain(seniorities)
    .range(
      seniorities.map(s => {
        const level = s.toLowerCase();
  
        if (level.includes("senior")) return "#E15759"; // red
        if (level.includes("junior")) return "#4E79A7"; // blue
        if (level.includes("mid")) return "#EDC948";    // yellow
  
        return "#BAB0AC"; // gray fallback
      })
    );

  const series = d3.stack()
    .keys(seniorities)(stackedData);

  svg.append("g")
    .attr("stroke", "#eee")
    .selectAll("line")
    .data(x.ticks())
    .join("line")
    .attr("x1", d => x(d))
    .attr("x2", d => x(d))
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom);

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .call(g => g.select(".domain").remove());

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .call(g => g.select(".domain").remove());

  svg.append("text")
    .attr("x", margin.left - 120)
    .attr("y", margin.top - 12)
    .attr("font-size", 14)
    .attr("font-weight", "bold")
    .text("Skill Name");

  svg.append("text")
    .attr("x", (margin.left + width - margin.right) / 2)
    .attr("y", height - 18)
    .attr("text-anchor", "middle")
    .attr("font-size", 14)
    .attr("font-weight", "bold")
    .text("Distinct Count of Job ID");

  const tooltip = svg.append("g")
    .style("display", "none")
    .style("pointer-events", "none");

  tooltip.append("rect")
    .attr("width", 270)
    .attr("height", 95)
    .attr("fill", "white")
    .attr("stroke", "#999")
    .attr("stroke-width", 1.5)
    .attr("rx", 8)
    .attr("filter", "drop-shadow(2px 2px 3px #999)");

  const tooltipText = tooltip.append("text")
    .attr("x", 15)
    .attr("y", 25)
    .attr("font-size", 14)
    .attr("fill", "#333");

  svg.append("g")
    .selectAll("g")
    .data(series)
    .join("g")
    .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(d => d.map(v => ({ ...v, seniority: d.key })))
    .join("rect")
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d.data.skill))
    .attr("width", d => x(d[1]) - x(d[0]))
    .attr("height", y.bandwidth())
    .attr("cursor", "pointer")
    .on("mouseover", function(event, d) {
      d3.select(this)
        .attr("stroke", "#222")
        .attr("stroke-width", 2);

      tooltip.style("display", null);
      tooltip.raise();

      const value = d[1] - d[0];

      tooltipText.selectAll("tspan").remove();

      tooltipText.append("tspan")
        .attr("x", 15)
        .attr("dy", 0)
        .text("Skill: ");

      tooltipText.append("tspan")
        .attr("font-weight", "bold")
        .text(d.data.skill);

      tooltipText.append("tspan")
        .attr("x", 15)
        .attr("dy", 24)
        .text("Seniority: ");

      tooltipText.append("tspan")
        .attr("font-weight", "bold")
        .text(d.seniority);

      tooltipText.append("tspan")
        .attr("x", 15)
        .attr("dy", 24)
        .text("Distinct Job Count: ");

      tooltipText.append("tspan")
        .attr("font-weight", "bold")
        .text(value);
    })
    .on("mousemove", function(event) {
      const tooltipWidth = 270;
      const tooltipHeight = 95;

      let tx = event.offsetX + 15;
      let ty = event.offsetY - 35;

      if (tx + tooltipWidth > width) {
        tx = event.offsetX - tooltipWidth - 15;
      }

      if (ty < 10) {
        ty = event.offsetY + 15;
      }

      tooltip.attr("transform", `translate(${tx}, ${ty})`);
    })
    .on("mouseout", function() {
      d3.select(this)
        .attr("stroke", null);

      tooltip.style("display", "none");
    });

  return svg.node();
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["Skills by Seniority_data.csv", {url: new URL("./files/bc901d7579bac239b8dda28d27725ce749b832eda17d245ff0f1fa05a885db9642398384dc982af21a897d3fc3810472f9937b57592b67626db91b879088d335.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment","d3"], _2);
  return main;
}
