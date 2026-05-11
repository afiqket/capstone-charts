function _1(md){return(
md`# UK's 2019 Annual Business Report`
)}

async function _2(FileAttachment,d3)
{
  const raw = await FileAttachment("business.csv").csv({typed: true});
  const icons = await FileAttachment("icons.csv").csv({typed: true});

  // -----------------------------
  // SETTINGS
  // -----------------------------
  const unitPerIcon = 5000;

  const categoryOrder = [
    "11-50 employees",
    "2-4 employees",
    "250+ employees",
    "4-11 employees",
    "50-250 employees"
  ];

  const categoryColors = new Map([
    ["11-50 employees", "#cf6b68"],
    ["2-4 employees", "#e8b1ab"],
    ["250+ employees", "#cfcfcf"],
    ["4-11 employees", "#9ea8c8"],
    ["50-250 employees", "#4f5b8a"]
  ]);

  const industryOrder = [
    "Education",
    "Human health and social work activities",
    "Transport and storage",
    "Real estate activities",
    "Information and communication",
    "Administrative and support service activities",
    "Accommodation and food service activities",
    "Construction",
    "Wholesale and retail trade; repair of motor vehicles and motor cycles"
  ];

  // -----------------------------
  // ICON
  // -----------------------------
  const iconPath = icons[0].icon;
  const iconW = +icons[0].width || 576;
  const iconH = +icons[0].height || 512;

  // -----------------------------
  // PREP DATA
  // -----------------------------
  const cleaned = raw.map(d => ({
    industry: d.Industry,
    category: d["Number of employees"],
    value: +d["Number of Reporting Units"]
  }));

  const totals = new Map(
    d3.rollups(
      cleaned,
      v => d3.sum(v, d => d.value),
      d => d.industry
    )
  );

  const grouped = d3.group(cleaned, d => d.industry);

  const expandedByIndustry = industryOrder.map(industry => {
    const rows = (grouped.get(industry) || [])
      .slice()
      .sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category));

    let iconsExpanded = [];
    for (const row of rows) {
      const n = Math.round(row.value / unitPerIcon);
      for (let i = 0; i < n; i++) {
        iconsExpanded.push({
          industry,
          category: row.category,
          value: row.value
        });
      }
    }

    return {
      industry,
      total: totals.get(industry) || 0,
      icons: iconsExpanded
    };
  });

  // -----------------------------
  // LAYOUT
  // -----------------------------
  const width = 1280;
  const margin = {top: 145, right: 120, bottom: 40, left: 20};

  const cols = 22;
  const stepX = 12;
  const stepY = 18;
  const iconScale = 0.022;

  const rowHeights = expandedByIndustry.map(d => Math.ceil(d.icons.length / cols) * stepY + 22);
  const contentHeight = d3.sum(rowHeights);
  const height = margin.top + contentHeight + margin.bottom + 50;

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", "100%")
    .style("height", "auto")
    .style("background", "#f5f5f5")
    .style("font-family", "Inter, system-ui, sans-serif");

  // Tooltip
  const tooltip = d3.select(document.body)
    .append("div")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("background", "#2f2f2f")
    .style("color", "white")
    .style("padding", "14px 16px")
    .style("border-radius", "6px")
    .style("font", "14px sans-serif")
    .style("line-height", "1.4")
    .style("box-shadow", "0 4px 14px rgba(0,0,0,0.25)");

  // -----------------------------
  // TITLES
  // -----------------------------
  svg.append("text")
    .attr("x", 18)
    .attr("y", 44)
    .attr("font-size", 37)
    .attr("font-weight", 700)
    .attr("fill", "#24344d")
    .text("The UK's 2019 Annual Business Survey");

  svg.append("text")
    .attr("x", 18)
    .attr("y", 102)
    .attr("font-size", 24)
    .attr("font-weight", 400)
    .attr("fill", "#24344d")
    .text("Selected industries by number of employees per company");

  // -----------------------------
  // LEGEND KEY: icon = 5000
  // -----------------------------
  const keyY = 138;
  const keyG = svg.append("g").attr("transform", `translate(18, ${keyY})`);

  keyG.append("path")
    .attr("d", iconPath)
    .attr("transform", `translate(0, -10) scale(0.04)`)
    .attr("fill", "black");

  keyG.append("text")
    .attr("x", 28)
    .attr("y", 10)
    .attr("font-size", 22)
    .attr("fill", "#24344d")
    .text("= 5000");

  // -----------------------------
  // LEGEND CATEGORIES
  // -----------------------------
  const legendX = 150;
  const legendY = 138;

  const legendItems = [
    {label: "11-50 employees", x: 0, y: 0},
    {label: "2-4 employees", x: 245, y: 0},
    {label: "250+ employees", x: 455, y: 0},
    {label: "4-11 employees", x: 0, y: 36},
    {label: "50-250 employees", x: 245, y: 36}
  ];

  const legend = svg.append("g").attr("transform", `translate(${legendX}, ${legendY})`);

  for (const item of legendItems) {
    const g = legend.append("g").attr("transform", `translate(${item.x}, ${item.y})`);

    g.append("circle")
      .attr("cx", 0)
      .attr("cy", -2)
      .attr("r", 7)
      .attr("fill", categoryColors.get(item.label));

    g.append("path")
      .attr("d", iconPath)
      .attr("transform", `translate(18, -8) scale(0.018)`)
      .attr("fill", categoryColors.get(item.label));

    g.append("text")
      .attr("x", 44)
      .attr("y", 8)
      .attr("font-size", 18)
      .attr("fill", "#24344d")
      .text(item.label);
  }

  // -----------------------------
  // MAIN CHART
  // -----------------------------
  const labelX = 570;
  const chartX = 590;

  let yCursor = margin.top + 70;

  for (let idx = 0; idx < expandedByIndustry.length; idx++) {
    const row = expandedByIndustry[idx];
    const nRows = Math.ceil(row.icons.length / cols);
    const blockHeight = nRows * stepY;

    const rowTop = yCursor;
    const rowMid = rowTop + blockHeight / 2;

    // Industry label
    svg.append("text")
      .attr("x", labelX)
      .attr("y", rowMid)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("font-size", 24)
      .attr("fill", "#a5a5a5")
      .text(row.industry);

    // Icons
    const g = svg.append("g");

    g.selectAll(`.icon-${idx}`)
      .data(row.icons)
      .join("path")
      .attr("d", iconPath)
      .attr("transform", (d, i) => {
        const col = i % cols;
        const r = Math.floor(i / cols);
        const x = chartX + col * stepX;
        const y = rowTop + r * stepY;
        return `translate(${x}, ${y}) scale(${iconScale})`;
      })
      .attr("fill", d => categoryColors.get(d.category))
      .on("mousemove", function(event, d) {
        tooltip
          .style("opacity", 1)
          .html(`
            <div style="font-size:18px;font-weight:700;margin-bottom:6px;">${d.industry}</div>
            <div style="font-size:16px;color:#d7d7d7;margin-bottom:10px;">${d.category}</div>
            <div style="background:#f4f4f4;color:#222;padding:10px 12px;border-radius:4px;">
              Number of Reporting Units: ${d.value.toLocaleString()}
            </div>
          `)
          .style("left", `${event.pageX + 16}px`)
          .style("top", `${event.pageY - 20}px`);
      })
      .on("mouseleave", function() {
        tooltip.style("opacity", 0);
      });

    // total labels at right
    const lastRowCount = row.icons.length % cols === 0 ? cols : row.icons.length % cols;
    const totalX = chartX + Math.min(cols, Math.max(lastRowCount, cols)) * stepX + 22;

    svg.append("text")
      .attr("x", chartX + cols * stepX + 36)
      .attr("y", rowMid)
      .attr("dominant-baseline", "middle")
      .attr("font-size", 20)
      .attr("font-weight", 700)
      .attr("fill", "#a5a5a5")
      .text(row.total.toLocaleString());

    yCursor += blockHeight + 8;
  }

  // -----------------------------
  // SOURCE
  // -----------------------------
  svg.append("text")
    .attr("x", 18)
    .attr("y", height - 18)
    .attr("font-size", 16)
    .attr("fill", "#24344d")
    .text("Source: Office of National Statistics");

  return svg.node();
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["icons.csv", {url: new URL("./files/7800f372be4e69397b15c2a30f265d5891eb32521c59ce4972b5ec15c6761d1ac21aaa0d0639b5d5cafd1b60ffa4bc7289460f0a32a82342ad8b6414b49c7cc9.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["business.csv", {url: new URL("./files/924350d4f632953f90030a35cee008dd76b5399e0fa055b1101a6d64f70ebeba3dfb5a9780392ec2da4e97512b8f7ce5151406197d1a8b39aa9d11951cdba36b.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment","d3"], _2);
  return main;
}
