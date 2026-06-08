function _1(md){return(
md`# AI Adoption and Digital Skills:evidence of a potential mismatch in 2021-2025`
)}

async function _2(FileAttachment,d3)
{
  const aiRaw = await FileAttachment("classifica ai_DATASET_data.csv").csv({ typed: true });
  const skillRaw = await FileAttachment("andamento skill 1_DATASET_data.csv").csv({ typed: true });

  // =========================
  // DATA PREPARATION
  // =========================

  const aiCol =
    "Imprese con più di 250 dipendenti che usano almeno una tecnologia AI (% DI IMPRESE)";

  const aiData = Array.from(
    d3.rollup(
      aiRaw,
      v => d3.max(v, d => +d[aiCol]),
      d => d.Country
    ),
    ([country, value]) => ({
      country,
      value,
      group: aiRaw.find(d => d.Country === country)["colore paese"]
    })
  ).sort((a, b) => b.value - a.value);

  const digitalSkillsRanking = [
    ["Netherlands", 84], ["Ireland", 83], ["Denmark", 82], ["Finland", 81],
    ["Norway", 80], ["Czechia", 72], ["Sweden", 71], ["Austria", 70],
    ["Malta", 67], ["Spain", 66], ["France", 65], ["Croatia", 63],
    ["Estonia", 62], ["Luxembourg", 62], ["Belgium", 61],
    ["European Union", 60], ["Germany", 59], ["Portugal", 58],
    ["Hungary", 56], ["Cyprus", 55], ["Italy", 53], ["Lithuania", 52],
    ["Slovakia", 52], ["Greece", 49], ["Poland", 48], ["Latvia", 47],
    ["Slovenia", 45], ["Serbia", 41], ["Bulgaria", 37],
    ["Bosnia and Herzegovina", 35], ["Romania", 31], ["Türkiye", 30]
  ].map(([country, value]) => ({
    country,
    value,
    group:
      country === "Italy"
        ? "Italy"
        : country === "European Union"
        ? "European Union"
        : "Others"
  }));

  const skillCol =
    "Popolazione con livello base di digital skills (% di popolazione 16-74)";

  const trendData = skillRaw
    .filter(d => d.Country && d["Year of Time"] && d[skillCol] != null)
    .map(d => ({
      year: +d["Year of Time"],
      country: d.Country,
      value: +d[skillCol]
    }));

  const countries = Array.from(new Set(trendData.map(d => d.country))).sort();

  // =========================
  // CONTAINER + PAGE BAR
  // =========================

  const container = document.createElement("div");
  container.style.fontFamily = "Georgia, serif";
  container.style.background = "#f8f8f8";
  container.style.padding = "10px";
  container.style.width = "1220px";

  const pageBar = document.createElement("div");
  pageBar.style.display = "flex";
  pageBar.style.gap = "10px";
  pageBar.style.marginBottom = "12px";
  pageBar.style.alignItems = "center";

  const page1Button = document.createElement("button");
  page1Button.textContent = "Country Rankings";
  page1Button.style.padding = "8px 16px";
  page1Button.style.border = "1px solid #999";
  page1Button.style.borderRadius = "8px";
  page1Button.style.cursor = "pointer";
  page1Button.style.fontFamily = "Georgia, serif";

  const page2Button = document.createElement("button");
  page2Button.textContent = "Digital Skills Trend by Population";
  page2Button.style.padding = "8px 16px";
  page2Button.style.border = "1px solid #999";
  page2Button.style.borderRadius = "8px";
  page2Button.style.cursor = "pointer";
  page2Button.style.fontFamily = "Georgia, serif";

  pageBar.appendChild(page1Button);
  pageBar.appendChild(page2Button);

  const chartArea = document.createElement("div");
  chartArea.style.position = "relative";

  const tooltip = document.createElement("div");
  tooltip.style.position = "absolute";
  tooltip.style.background = "white";
  tooltip.style.border = "1px solid #aaa";
  tooltip.style.boxShadow = "0 2px 8px rgba(0,0,0,0.25)";
  tooltip.style.padding = "12px 16px";
  tooltip.style.fontFamily = "Georgia, serif";
  tooltip.style.fontSize = "13px";
  tooltip.style.pointerEvents = "none";
  tooltip.style.opacity = 0;
  tooltip.style.zIndex = 10;

  chartArea.appendChild(tooltip);

  container.appendChild(pageBar);
  container.appendChild(chartArea);

  let currentPage = 1;

  function setButtonStyle() {
    page1Button.style.background = currentPage === 1 ? "#4f7fae" : "white";
    page1Button.style.color = currentPage === 1 ? "white" : "black";

    page2Button.style.background = currentPage === 2 ? "#4f7fae" : "white";
    page2Button.style.color = currentPage === 2 ? "white" : "black";
  }

  page1Button.onclick = () => {
    currentPage = 1;
    render();
  };

  page2Button.onclick = () => {
    currentPage = 2;
    render();
  };

  // =========================
  // PAGE 1: BAR CHARTS
  // =========================

  function drawRankingPage() {
    const width = 1200;
    const height = 820;

    const svg = d3
      .create("svg")
      .attr("width", width)
      .attr("height", height)
      .style("font-family", "Georgia, serif")
      .style("background", "#f8f8f8");

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 42)
      .attr("text-anchor", "middle")
      .attr("font-size", 24)
      .attr("font-weight", "bold")
      .text("AI Adoption and Digital Skills: Evidence of a Potential Mismatch in 2021-2025");

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 78)
      .attr("text-anchor", "middle")
      .attr("font-size", 18)
      .text("An Analysis Across European Countries");

    svg
      .append("rect")
      .attr("x", 20)
      .attr("y", 115)
      .attr("width", width - 40)
      .attr("height", height - 140)
      .attr("rx", 30)
      .attr("fill", "#e8eef2");

    const margin = {
      top: 130,
      right: 20,
      bottom: 80,
      left: 120
    };

    const chartWidth = 360;
    const gap = 50;

    function drawBarChart(data, x0, title, color, xLabel, tooltipLabel) {
      const y = d3
        .scaleBand()
        .domain(data.map(d => d.country))
        .range([margin.top + 60, height - margin.bottom])
        .padding(0.22);

      const x = d3
        .scaleLinear()
        .domain([0, d3.max(data, d => d.value)])
        .nice()
        .range([x0, x0 + chartWidth]);

      svg
        .append("text")
        .attr("x", x0 + chartWidth / 2)
        .attr("y", margin.top + 15)
        .attr("text-anchor", "middle")
        .attr("font-size", 18)
        .attr("font-weight", "bold")
        .text(title);

      svg
        .append("g")
        .attr("transform", `translate(${x0},0)`)
        .call(d3.axisLeft(y).tickSize(0))
        .call(g => g.select(".domain").remove())
        .selectAll("text")
        .attr("font-size", 10.5)
        .attr("fill", "#555");

      svg
        .append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(8))
        .call(g => g.select(".domain").remove())
        .selectAll("text")
        .attr("font-size", 10.5)
        .attr("fill", "#555");

      svg
        .selectAll(`.bar-${title.replaceAll(" ", "-")}`)
        .data(data)
        .join("rect")
        .attr("x", x0)
        .attr("y", d => y(d.country))
        .attr("width", d => x(d.value) - x0)
        .attr("height", y.bandwidth())
        .attr("fill", d =>
          d.group === "Italy"
            ? "#f4f4f4"
            : d.group === "European Union"
            ? "#7f8790"
            : color
        )
        .attr("stroke", "#333")
        .attr("stroke-width", 1.2)
        .on("mouseover", function(event, d) {
          d3.select(this)
            .attr("opacity", 0.75)
            .attr("stroke-width", 2);

          tooltip.style.opacity = 1;
          tooltip.innerHTML = `
            <div style="font-weight:bold; font-size:16px; text-align:center; margin-bottom:6px;">
              ${d.country}
            </div>
            <div>
              ${tooltipLabel}: <b>${d.value.toFixed(2)}</b>
            </div>
          `;
        })
        .on("mousemove", function(event) {
          const [mx, my] = d3.pointer(event, chartArea);
          tooltip.style.left = mx + 15 + "px";
          tooltip.style.top = my - 30 + "px";
        })
        .on("mouseout", function() {
          d3.select(this)
            .attr("opacity", 1)
            .attr("stroke-width", 1.2);

          tooltip.style.opacity = 0;
        });

      svg
        .append("text")
        .attr("x", x0)
        .attr("y", height - 28)
        .attr("font-size", 11.5)
        .text(xLabel);
    }

    drawBarChart(
      aiData,
      190,
      "Country Ranking by AI Adoption",
      "#b57aa4",
      "Enterprises with More Than 250 Employees Using AI Technology (%)",
      "Adoption of at Least One AI Technology in Enterprises with at Least 250 Employees (% of Enterprises)"
    );

    drawBarChart(
      digitalSkillsRanking,
      190 + chartWidth + gap,
      "Country Ranking by Digital Skills",
      "#4f7fae",
      "Population with at Least Basic Digital Skills (%)",
      "Population with at Least Basic Digital Skills (% of Population Aged 16–74)"
    );

    return svg.node();
  }

  // =========================
  // PAGE 2: LINE CHART - ALL COUNTRIES ONLY
  // =========================
  
  function drawTrendPage() {
    const width = 900;
    const height = 560;
  
    const margin = {
      top: 80,
      right: 60,
      bottom: 80,
      left: 90
    };
  
    const wrapper = document.createElement("div");
  
    // Small label instead of country filter
    const control = document.createElement("div");
    control.style.margin = "0 0 12px 20px";
    control.style.fontWeight = "bold";
    control.textContent = "Country: (All)";
    wrapper.appendChild(control);
  
    const svg = d3
      .create("svg")
      .attr("width", width)
      .attr("height", height)
      .style("font-family", "Georgia, serif")
      .style("background", "#f8f8f8");
  
    svg
      .append("rect")
      .attr("x", 20)
      .attr("y", 20)
      .attr("width", width - 40)
      .attr("height", height - 40)
      .attr("rx", 22)
      .attr("fill", "#f9fbfc")
      .attr("stroke", "#cfcfcf")
      .attr("stroke-width", 2);
  
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 55)
      .attr("text-anchor", "middle")
      .attr("font-size", 22)
      .attr("font-weight", "bold")
      .text("Digital Skills Trend: All Countries");
  
    const x = d3
      .scaleLinear()
      .domain([2021, 2025])
      .range([margin.left, width - margin.right]);
  
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(trendData, d => d.value) + 5])
      .nice()
      .range([height - margin.bottom, margin.top]);
  
    // Group data by country
    const dataByCountry = d3.groups(
      trendData,
      d => d.country
    ).map(([country, values]) => ({
      country,
      values: values.sort((a, b) => a.year - b.year)
    }));
  
    // Grid lines
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(
        d3
          .axisLeft(y)
          .ticks(8)
          .tickSize(-(width - margin.left - margin.right))
          .tickFormat("")
      )
      .call(g => g.select(".domain").remove())
      .call(g =>
        g.selectAll("line")
          .attr("stroke", "#e2e2e2")
          .attr("stroke-width", 1)
      );
  
    const line = d3
      .line()
      .x(d => x(d.year))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);
  
    // Draw all country lines
    const lines = svg
      .selectAll(".country-line")
      .data(dataByCountry)
      .join("path")
      .attr("class", "country-line")
      .attr("fill", "none")
      .attr("stroke", "#4f7fae")
      .attr("stroke-width", 2)
      .attr("opacity", 0.35)
      .attr("d", d => line(d.values));
  
    // Axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues([2021, 2022, 2023, 2024, 2025])
          .tickFormat(d3.format("d"))
      )
      .call(g => g.select(".domain").attr("stroke", "#dddddd"))
      .selectAll("text")
      .attr("font-size", 12)
      .attr("fill", "#555");
  
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(8))
      .call(g => g.select(".domain").attr("stroke", "#dddddd"))
      .selectAll("text")
      .attr("font-size", 12)
      .attr("fill", "#555");
  
    // Axis labels
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 30)
      .attr("text-anchor", "middle")
      .attr("font-size", 15)
      .attr("fill", "#555")
      .text("Year");
  
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 45)
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .attr("fill", "#555")
      .text("Digital Skills (% of Population)");
  
    // Points for hover
    const points = svg
      .selectAll(".trend-point")
      .data(trendData)
      .join("circle")
      .attr("class", "trend-point")
      .attr("cx", d => x(d.year))
      .attr("cy", d => y(d.value))
      .attr("r", 4)
      .attr("fill", "#4f7fae")
      .attr("opacity", 0.35);
  
    // Invisible hover circles
    svg
      .selectAll(".trend-hover-point")
      .data(trendData)
      .join("circle")
      .attr("class", "trend-hover-point")
      .attr("cx", d => x(d.year))
      .attr("cy", d => y(d.value))
      .attr("r", 12)
      .attr("fill", "transparent")
      .on("mouseover", function(event, d) {
        lines
          .attr("opacity", lineData =>
            lineData.country === d.country ? 1 : 0.12
          )
          .attr("stroke-width", lineData =>
            lineData.country === d.country ? 4 : 2
          );
  
        points
          .attr("opacity", p =>
            p.country === d.country ? 1 : 0.12
          )
          .attr("r", p =>
            p.country === d.country && p.year === d.year ? 7 : 4
          );
  
        tooltip.style.opacity = 1;
        tooltip.innerHTML = `
          <div style="font-weight:bold; font-size:16px; text-align:center; margin-bottom:6px;">
            ${d.country}
          </div>
          <div>
            Year: <b>${d.year}</b>
          </div>
          <div style="margin-top:4px;">
            Population with at Least Basic Digital Skills (% of Population Aged 16–74): 
            <b>${d.value.toFixed(2)}</b>
          </div>
        `;
      })
      .on("mousemove", function(event) {
        const [mx, my] = d3.pointer(event, chartArea);
        tooltip.style.left = mx + 15 + "px";
        tooltip.style.top = my - 30 + "px";
      })
      .on("mouseout", function() {
        lines
          .attr("opacity", 0.35)
          .attr("stroke-width", 2);
  
        points
          .attr("opacity", 0.35)
          .attr("r", 4);
  
        tooltip.style.opacity = 0;
      });
  
    wrapper.appendChild(svg.node());
  
    return wrapper;
  }

  // =========================
  // RENDER PAGE
  // =========================

  function render() {
    setButtonStyle();

    chartArea.innerHTML = "";
    chartArea.appendChild(tooltip);
    tooltip.style.opacity = 0;

    if (currentPage === 1) {
      chartArea.appendChild(drawRankingPage());
    } else {
      chartArea.appendChild(drawTrendPage("European Union"));
    }
  }

  render();

  return container;
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["classifica ai_DATASET_data.csv", {url: new URL("./files/eceb0e4dfaec117dbc7c65fec7c20a7898d19544ae24fd3ee9f091cfc79357606964564dc1b64f0b2756193d94e39c4f7552a0863dba872ecfeb2184a57f9b76.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["andamento skill 1_DATASET_data.csv", {url: new URL("./files/95d032deed4e5ff390745bb84185c17fde8b15a50b89abbc966f79ccf1621107d8306e182868abb64e5686593c6f3e82949c457a203c84bf7f498994d9833c9f.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["FileAttachment","d3"], _2);
  return main;
}
