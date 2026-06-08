function _1(md){return(
md`# Late-night Snacking`
)}

async function _2(FileAttachment,d3)
{
  // 1. Data Processing with Robust Parsing
  const snackFile = await FileAttachment("2. Bar - What people reach for_Full Data_data.csv").csv({ typed: true });
  const rankFile = await FileAttachment("2. Slope - Reach vs. Sleep rankings_data.csv").csv({ typed: true });
  const sleepFile = await FileAttachment("2. Bar - Sleep hour - minutes_Full Data_data.csv").csv({ typed: true });

  const order = ["Chips/crackers/pretzels", "Ice Cream", "Candy", "Fruit", "Popcorn", "Nuts and Seeds", "Pizza"];
  const healthySnacks = ["Fruit", "Nuts and Seeds"];
  
  const emojiMap = new Map([
    ["Chips/crackers/pretzels", "🥨"], ["Ice Cream", "🍦"], ["Candy", "🍬"],
    ["Fruit", "🍎"], ["Popcorn", "🍿"], ["Nuts and Seeds", "🥜"], ["Pizza", "🍕"]
  ]);

  const normalize = s => String(s).toLowerCase().replace(/\s+/g, '').trim();

  const snackMap = new Map(snackFile.map(d => {
    const name = d["Type of Snack"];
    let pct = d["Percentage (%)"];
    if (typeof pct === "string") pct = parseFloat(pct.replace('%', ''));
    if (pct > 0 && pct <= 1) pct *= 100;
    return [normalize(name), pct];
  }));

  const sleepMap = new Map(sleepFile.map(d => {
    const name = d["Type of Snack"];
    return [normalize(name), {
      sleepText: (d["c_Sleep Duration | hour-minutes"] || "").replace(/\s+/g, " ").trim(),
      sleepMin: +d["Sleep Minutes"] || 0
    }];
  }));

  const rankRaw = Array.from(d3.rollup(rankFile, v => {
    const row = v[0];
    return {
      snack: row["Type of Snack"],
      rankPct: +row["Rank of Percentage (%)"],
      rankSleep: +row["Rank of Sleep Minutes"]
    };
  }, d => normalize(d["Type of Snack"])).values());

  const rankMap = new Map(rankRaw.map(d => [normalize(d.snack), d]));

  const data = order.map(snack => {
    const key = normalize(snack);
    const sData = sleepMap.get(key);
    const rData = rankMap.get(key);
    return {
      snack,
      emoji: emojiMap.get(snack) || "",
      pct: snackMap.get(key) ?? 0,
      sleepText: sData?.sleepText ?? "",
      sleepMin: sData?.sleepMin ?? 0,
      rankPct: rData?.rankPct ?? 1,
      rankSleep: rData?.rankSleep ?? 1
    };
  });

  // Create a second dataset ordered by sleep duration for the right side
  const sleepOrderedData = [...data].sort((a, b) => b.sleepMin - a.sleepMin);

  // 2. Constants & Container
  const width = 1350;
  const height = 900;
  
  const container = document.createElement("div");
  container.style.position = "relative";
  
  const svg = d3.select(container).append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height)
    .style("max-width", "100%")
    .style("height", "auto")
    .style("background", "#214d87")
    .style("font-family", "'Inter', sans-serif");

  const tooltip = d3.select(container)
    .append("div")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("background", "#ffffff")
    .style("color", "#223c73")
    .style("padding", "15px 20px")
    .style("font-size", "15px")
    .style("line-height", "1.6")
    .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)")
    .style("z-index", 100)
    .style("border-radius", "2px");

  // Colors
  const white = "#ffffff", divider = "#2c5a97", darkBar = "#083b6d";
  const cyan = "#1ec9f3", green = "#43d5a4", greenBar = "#3da98d";
  const offWhite = "#f5f5f5", navyText = "#07254b";

  // Layout Constants
  const leftX = 45, labelX = 110, barX = 280, barW = 330;
  const leftRankX = 675, rightRankColX = 815;
  const sleepBarX = 915, sleepBarW = 320; // Increased width for better impact
  const rowStartY = 360, rowGap = 70, barH = 38;

  // Scales
  const pctScale = d3.scaleLinear().domain([0, 100]).range([0, barW]);
  const sleepScale = d3.scaleLinear()
    .domain([d3.min(data, d => d.sleepMin) - 5, d3.max(data, d => d.sleepMin)])
    .range([220, sleepBarW]);

  const rankY = rank => rowStartY + (rank - 1) * rowGap;

  // 3. Drawing Headers
  svg.append("text").attr("x", 70).attr("y", 80).attr("fill", white).attr("font-size", 42).attr("font-weight", 500).text("late-night snacking");
  svg.append("text").attr("x", width - 70).attr("y", 80).attr("text-anchor", "end").attr("fill", white).attr("font-size", 20).attr("font-weight", 400).text("according to a 2024 survey");
  svg.append("line").attr("x1", 70).attr("x2", width - 70).attr("y1", 115).attr("y2", 115).attr("stroke", divider).attr("stroke-width", 2);

  svg.append("text").attr("x", 70).attr("y", 185).attr("fill", white).attr("font-size", 30).attr("font-weight", 700).text("what we reach for");
  svg.append("text").attr("x", width - 70).attr("y", 185).attr("text-anchor", "end").attr("fill", white).attr("font-size", 30).attr("font-weight", 700).text("how does it impact sleep");

  // Subtitles
  const topSnack = data[0];
  const leftSub = svg.append("text").attr("x", 70).attr("y", 235).attr("fill", white).attr("font-size", 20).attr("font-weight", 400);
  leftSub.append("tspan").text(`${Math.round(topSnack.pct)}% of respondants who snack late at night`);
  leftSub.append("tspan").attr("x", 70).attr("dy", "1.45em").text("choose to snack on ");
  leftSub.append("tspan").attr("font-weight", 800).text(`${topSnack.snack.toLowerCase()}.`);

  const rightSub = svg.append("text").attr("x", width - 70).attr("y", 235).attr("text-anchor", "end").attr("fill", white).attr("font-size", 20).attr("font-weight", 400);
  rightSub.append("tspan").attr("x", width - 70).text("On average, those who snack on ");
  rightSub.append("tspan").attr("fill", green).attr("font-weight", 800).text("healthier");
  rightSub.append("tspan").attr("x", width - 70).attr("dy", "1.45em").attr("fill", green).attr("font-weight", 800).text("options");
  rightSub.append("tspan").attr("fill", white).attr("font-weight", 400).text(" before bed get up to ");
  rightSub.append("tspan").attr("font-weight", 800).text("30 minutes more sleep!");

  // 4. Slope Connecting Lines
  svg.append("g").selectAll("line")
    .data(data).join("line")
    .attr("x1", leftRankX + 38)
    .attr("y1", d => rankY(d.rankPct) + 19)
    .attr("x2", rightRankColX)
    .attr("y2", d => rankY(d.rankSleep) + 19)
    .attr("stroke", d => healthySnacks.includes(d.snack) ? green : offWhite)
    .attr("stroke-width", 2.2)
    .attr("stroke-dasharray", "4,4")
    .attr("opacity", 0.9);

  // 5. Left Ranks (Popularity Order 1-7)
  const leftRankGroups = svg.append("g").selectAll("g").data(d3.range(1, 8)).join("g")
    .attr("transform", d => `translate(${leftRankX}, ${rankY(d)})`);

  leftRankGroups.append("rect").attr("width", 38).attr("height", 38)
    .attr("fill", rank => {
      const d = data.find(item => item.rankPct === rank);
      return healthySnacks.includes(d?.snack) ? greenBar : offWhite;
    });

  leftRankGroups.append("text").attr("x", 19).attr("y", 25).attr("text-anchor", "middle")
    .attr("fill", navyText).attr("font-size", 19).attr("font-weight", 700).text(d => d);

  // 6. Right Side (Ordered by Sleep Rank 1-7)
  const rightGroup = svg.append("g");
  
  const rightRows = rightGroup.selectAll("g")
    .data(sleepOrderedData)
    .join("g")
    .attr("transform", (_, i) => `translate(0, ${rankY(i + 1)})`);

  // Right Rank Boxes (Displays Popularity Rank)
  rightRows.append("rect")
    .attr("x", rightRankColX)
    .attr("width", 38).attr("height", 38)
    .attr("fill", d => healthySnacks.includes(d.snack) ? greenBar : offWhite);

  rightRows.append("text")
    .attr("x", rightRankColX + 19).attr("y", 25).attr("text-anchor", "middle")
    .attr("fill", navyText).attr("font-size", 19).attr("font-weight", 700)
    .text(d => d.rankPct);

  // Right Sleep Bars
  rightRows.append("rect")
    .attr("x", sleepBarX)
    .attr("width", d => sleepScale(d.sleepMin))
    .attr("height", 42)
    .attr("fill", d => healthySnacks.includes(d.snack) ? greenBar : darkBar);

  rightRows.append("text")
    .attr("x", sleepBarX + 15).attr("y", 27)
    .attr("fill", d => healthySnacks.includes(d.snack) ? navyText : white)
    .attr("font-size", 19).attr("font-weight", 800)
    .text(d => d.sleepText);

  // 7. Left Side (Emojis, Labels, Popularity Bars)
  const leftRows = svg.append("g").selectAll("g").data(data).join("g")
    .attr("transform", (_, i) => `translate(0, ${rowStartY + i * rowGap})`);

  leftRows.append("text").attr("x", leftX).attr("y", 30).attr("font-size", 38).text(d => d.emoji);
  
  leftRows.append("text").attr("x", labelX).attr("y", 14).attr("fill", white).attr("font-size", 19).attr("font-weight", 700)
    .text(d => d.snack === "Chips/crackers/pretzels" ? "Chips/crackers/" : d.snack);
  leftRows.filter(d => d.snack === "Chips/crackers/pretzels").append("text")
    .attr("x", labelX).attr("y", 38).attr("fill", white).attr("font-size", 19).attr("font-weight", 700).text("pretzels");

  leftRows.append("rect").attr("x", barX).attr("y", 2).attr("width", barW).attr("height", barH).attr("fill", darkBar);
  leftRows.append("rect")
    .attr("x", d => barX + (barW - pctScale(d.pct)))
    .attr("y", 2)
    .attr("width", d => pctScale(d.pct))
    .attr("height", barH)
    .attr("fill", cyan);
  
  leftRows.append("text")
    .attr("x", d => barX + (barW - pctScale(d.pct)) - 10)
    .attr("y", 28)
    .attr("text-anchor", "end")
    .attr("fill", cyan)
    .attr("font-size", 19)
    .attr("font-weight", 800)
    .text(d => `${Math.round(d.pct)}%`);

  // 8. Tooltips
  // Left side tooltips (Hovering over popularity bars)
  leftRows.append("rect").attr("x", barX).attr("y", 0).attr("width", barW).attr("height", barH + 10).attr("fill", "transparent").style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 1).html(`<b>${d.snack}</b> is chosen by <b>${Math.round(d.pct)}%</b> of late-night snackers.`);
    })
    .on("mousemove", (event) => {
      const [x, y] = d3.pointer(event, container);
      tooltip.style("left", `${x + 15}px`).style("top", `${y - 10}px`);
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  // Right side tooltips (Hovering over sleep bars)
  rightRows.append("rect").attr("x", sleepBarX).attr("y", 0).attr("width", sleepBarW).attr("height", 42).attr("fill", "transparent").style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 1).html(`People who snack on <b>${d.snack}</b> before bed average <b>${d.sleepText}</b> of sleep.`);
    })
    .on("mousemove", (event) => {
      const [x, y] = d3.pointer(event, container);
      tooltip.style("left", `${x + 15}px`).style("top", `${y - 10}px`);
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  // Rank box tooltips
  const addRankTooltip = (selection) => {
    selection.append("rect").attr("width", 38).attr("height", 38).attr("fill", "transparent").style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        tooltip.style("opacity", 1).html(`
          Those who snack on <b>${d.snack}</b> rank:<br><br>
          <b>#${d.rankPct}</b> for popularity<br><br>
          <b>#${d.rankSleep}</b> for sleep duration<br><br>
          averaging <b>${d.sleepText}</b> of sleep.
        `);
      })
      .on("mousemove", (event) => {
        const [x, y] = d3.pointer(event, container);
        tooltip.style("left", `${x + 20}px`).style("top", `${y - 15}px`);
      })
      .on("mouseout", () => tooltip.style("opacity", 0));
  };

  addRankTooltip(leftRankGroups.data(d3.range(1,8).map(r => data.find(i => i.rankPct === r))));
  addRankTooltip(rightRows);

  return container;
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["2. Bar - Sleep hour - minutes_Full Data_data.csv", {url: new URL("./files/ba24e276ab98bf5409904d7fa13c8feef0b50db8e0466f8d88012fa1d339e8faa0ff857ea78514cc52255ea8e2250b79aa817a4f4865f81a88f02ab885875c20.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["2. Bar - What people reach for_Full Data_data.csv", {url: new URL("./files/b02e994af693a8530db85c8522f4caabe6dd54a5cc33f63ecffd5fb8c1c6f11b2df62604335e2df1a28061f6c7deb194686d9d7f41e3b1e99fef95c7a21f2ad3.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["2. Slope - Reach vs. Sleep rankings_data.csv", {url: new URL("./files/a664bc64cdbe303f0e1c8757f59ed4709ae90f53f959602a9dc007706470196698ac7ab2682a54bc8b82cbb613a6ed20af141f3e0d1f0b54cc7b10f180012f04.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment","d3"], _2);
  return main;
}
