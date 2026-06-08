function _1(md){return(
md`# ARBES
by International Food Policy Research Institute (IFPRI)`
)}

function _tab(html,Event)
{
  const wrapper = html`
    <div style="width:100%;">
      <div style="
        display: flex;
        justify-content: center;
        gap: 16px;
        width: 100%;
        margin: 12px 0 12px 0;
      ">
        <button>SOIL CONSERVATION PRACTICES</button>
        <button>CROPS MOST COMMONLY GROWN</button>
      </div>

      <div style="
        text-align: center;
        font-size: 30px;
        font-weight: 700;
        margin-top: 6px;
        margin-bottom: 10px;
      "></div>
    </div>
  `;

  let value = "SOIL CONSERVATION PRACTICES";
  const buttons = wrapper.querySelectorAll("button");
  const title = wrapper.querySelector("div:last-child");

  function update() {
    for (const b of buttons) {
      const selected = b.textContent === value;

      b.style.width = "30%";
      b.style.padding = "12px 0";
      b.style.border = "none";
      b.style.borderRadius = "10px";
      b.style.fontSize = "15px";
      b.style.fontWeight = "600";
      b.style.color = "white";
      b.style.background = selected ? "#6cab72" : "#7a7a7a";
      b.style.cursor = "pointer";
      b.style.transition = "all 0.2s ease";
      b.style.boxShadow = selected
        ? "0 3px 8px rgba(0,0,0,0.18)"
        : "0 2px 5px rgba(0,0,0,0.12)";
    }

    title.textContent =
      value === "SOIL CONSERVATION PRACTICES"
        ? "Soil Conservation Practices in Program and Control Communities"
        : "Five Crops Most Commonly Grown in Program and Control Communities";

    wrapper.value = value;
  }

  for (const b of buttons) {
    b.onclick = () => {
      value = b.textContent;
      update();
      wrapper.dispatchEvent(new Event("input"));
    };

    b.onmouseover = () => {
      if (b.textContent !== value) {
        b.style.background = "#666666";
      }
    };

    b.onmouseout = () => {
      update();
    };
  }

  update();
  return wrapper;
}


async function _tabbedChart(tab,chart1,chart2){return(
await (tab === "SOIL CONSERVATION PRACTICES" ? chart1() : chart2())
)}

function _4(md){return(
md`Original Tableau Viz: https://public.tableau.com/app/profile/ifpri.td7290/viz/ARBES/SOILCONSERVATIONPRACTICES`
)}

function _chart1(FileAttachment,html,d3){return(
async() => {
  const raw = await FileAttachment("arbes_soil_percent.csv").csv();

  const categories = [
    "Households with erosion in their fields",
    "Households that practice crop rotation in their fields",
    "Households that practice fallowing in their fields",
    "Households that irrigate their fields",
    "Households that use manure in their fields"
  ];

  const countryOrder = ["Ethiopia", "Ghana", "Mali", "Malawi", "Tanzania"];

  const colorMap = new Map([
    ["Ethiopia", "#e0c55a"],
    ["Ghana", "#6cab72"],
    ["Mali", "#a24a5d"],
    ["Malawi", "#666666"],
    ["Tanzania", "#6f9fd1"]
  ]);

  const chartWidth = 760;
  const chartHeight = 180;
  const gap = -25;

  const marginTop = 14;
  const marginRight = 36;
  const marginBottom = 10;
  const marginLeft = 16;

  const titleWidth = 150;
  const labelWidth = 72;
  const axisShift = 130;
  const lineWidth = 1.2;

  function createMultiSelect(labelText, options, defaultSelected = options) {
    const wrapper = html`<div style="position:relative; min-width:280px; font:12px sans-serif;"></div>`;

    const label = html`<div style="font-size:14px; margin-bottom:4px;">${labelText}</div>`;

    const button = html`<button type="button" style="
      width:100%;
      text-align:left;
      padding:4px 28px 4px 8px;
      border:1px solid #999;
      background:white;
      cursor:pointer;
      position:relative;
      font:12px sans-serif;
    "></button>`;

    const arrow = html`<span style="
      position:absolute;
      right:8px;
      top:50%;
      transform:translateY(-50%);
      pointer-events:none;
      font-size:10px;
    ">▼</span>`;
    button.appendChild(arrow);

    const panel = html`<div style="
      display:none;
      position:absolute;
      top:100%;
      left:0;
      width:100%;
      max-height:220px;
      overflow:auto;
      background:white;
      border:1px solid #999;
      box-shadow:0 2px 6px rgba(0,0,0,0.15);
      padding:6px 8px;
      z-index:1000;
    "></div>`;

    const allId = `${labelText}-all-${Math.random().toString(36).slice(2)}`;
    const allRow = html`<label style="display:flex; align-items:center; gap:6px; margin:2px 0;">
      <input type="checkbox" id="${allId}">
      <span>(All)</span>
    </label>`;
    panel.appendChild(allRow);

    const rows = options.map(option => {
      const id = `${labelText}-${option}-${Math.random().toString(36).slice(2)}`;
      const row = html`<label style="display:flex; align-items:center; gap:6px; margin:2px 0;">
        <input type="checkbox" value="${option}" id="${id}">
        <span>${option}</span>
      </label>`;
      panel.appendChild(row);
      return row.querySelector("input");
    });

    function getSelected() {
      return rows.filter(input => input.checked).map(input => input.value);
    }

    function updateButtonText() {
      const selected = getSelected();
      if (selected.length === options.length) {
        button.childNodes[0] ? null : null;
        button.firstChild && button.firstChild.nodeType === 3
          ? button.firstChild.remove()
          : null;
        button.prepend("(All)");
      } else if (selected.length === 0) {
        button.firstChild && button.firstChild.nodeType === 3
          ? button.firstChild.remove()
          : null;
        button.prepend("(None)");
      } else if (selected.length === 1) {
        button.firstChild && button.firstChild.nodeType === 3
          ? button.firstChild.remove()
          : null;
        button.prepend(selected[0]);
      } else {
        button.firstChild && button.firstChild.nodeType === 3
          ? button.firstChild.remove()
          : null;
        button.prepend(`(${selected.length} selected)`);
      }
    }

    function syncAllBox() {
      const selected = getSelected();
      allRow.querySelector("input").checked = selected.length === options.length;
    }

    rows.forEach(input => {
      input.checked = defaultSelected.includes(input.value);
      input.addEventListener("input", () => {
        syncAllBox();
        updateButtonText();
        wrapper.dispatchEvent(new CustomEvent("input"));
      });
    });

    allRow.querySelector("input").checked = defaultSelected.length === options.length;

    allRow.querySelector("input").addEventListener("input", e => {
      const checked = e.target.checked;
      rows.forEach(input => {
        input.checked = checked;
      });
      updateButtonText();
      wrapper.dispatchEvent(new CustomEvent("input"));
    });

    button.addEventListener("click", e => {
      e.stopPropagation();
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    });

    document.addEventListener("click", e => {
      if (!wrapper.contains(e.target)) {
        panel.style.display = "none";
      }
    });

    wrapper.value = getSelected;
    wrapper.getSelected = getSelected;

    updateButtonText();

    wrapper.append(label, button, panel);
    return wrapper;
  }

  const selectedCountries = createMultiSelect(
    "Country",
    countryOrder,
    countryOrder
  );

  const selectedCategories = createMultiSelect(
    "Soil Conservation Practices",
    categories,
    categories
  );

  const controls = html`<div style="
    display:flex;
    gap:32px;
    align-items:flex-start;
    margin-bottom:16px;
  "></div>`;

  controls.append(selectedCountries, selectedCategories);

  const container = html`<div></div>`;
  const chartHolder = html`<div></div>`;
  container.append(controls, chartHolder);

  function render() {
    const shownCountries = selectedCountries.getSelected();
    const shownCategories = selectedCategories.getSelected();

    chartHolder.innerHTML = "";

    if (shownCategories.length === 0 || shownCountries.length === 0) {
      const emptySvg = d3.create("svg")
        .attr("width", chartWidth)
        .attr("height", 80)
        .attr("viewBox", [0, 0, chartWidth, 80])
        .style("max-width", "100%")
        .style("height", "auto")
        .style("font", "12px sans-serif");

      emptySvg.append("text")
        .attr("x", 16)
        .attr("y", 40)
        .attr("fill", "black")
        .text("No data selected. Please choose at least one country and one soil conservation practice.");

      chartHolder.append(emptySvg.node());
      return;
    }

    const totalHeight =
      shownCategories.length * chartHeight + (shownCategories.length - 1) * gap;

    const svg = d3.create("svg")
      .attr("width", chartWidth)
      .attr("height", totalHeight)
      .attr("viewBox", [0, 0, chartWidth, totalHeight])
      .style("max-width", "100%")
      .style("height", "auto")
      .style("font", "10px sans-serif");

    shownCategories.forEach((category, i) => {
      const yOffset = i * (chartHeight + gap);

      const filtered = raw
        .filter(row => row.Col3 === category && shownCountries.includes(row.Country))
        .map(row => ({
          country: row.Country,
          percent: +String(row.YesPercent).replace("%", "")
        }))
        .sort((a, b) => shownCountries.indexOf(a.country) - shownCountries.indexOf(b.country));

      const axisX = marginLeft + titleWidth + labelWidth + axisShift;
      const chartRight = chartWidth - marginRight;

      const x = d3.scaleLinear()
        .domain([0, d3.max(filtered, row => row.percent) || 0])
        .nice()
        .range([axisX, chartRight]);

      const y = d3.scaleBand()
        .domain(shownCountries)
        .range([yOffset + marginTop, yOffset + chartHeight - marginBottom])
        .padding(0.55);

      svg.append("line")
        .attr("x1", axisX)
        .attr("x2", axisX)
        .attr("y1", yOffset + marginTop)
        .attr("y2", yOffset + chartHeight - marginBottom)
        .attr("stroke", "black")
        .attr("stroke-width", lineWidth);

      svg.append("g")
        .selectAll(`text.country-${i}`)
        .data(filtered)
        .join("text")
        .attr("x", axisX - 6)
        .attr("y", row => y(row.country) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .attr("fill", "black")
        .attr("font-size", 10)
        .text(row => row.country);

      svg.append("g")
        .selectAll(`rect.bar-${i}`)
        .data(filtered)
        .join("rect")
        .attr("x", axisX)
        .attr("y", row => y(row.country))
        .attr("width", row => x(row.percent) - axisX)
        .attr("height", y.bandwidth())
        .attr("fill", row => colorMap.get(row.country));

      svg.append("g")
        .selectAll(`text.value-${i}`)
        .data(filtered)
        .join("text")
        .attr("x", row => x(row.percent) + 4)
        .attr("y", row => y(row.country) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("fill", "black")
        .attr("font-size", 9)
        .text(row => row.percent + "%");

      const firstCountry = shownCountries[0];

      svg.append("text")
        .attr("x", marginLeft)
        .attr("y", y(firstCountry) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .attr("font-size", 11)
        .attr("fill", "black")
        .text(category);

      if (i < shownCategories.length - 1) {
        svg.append("line")
          .attr("x1", marginLeft)
          .attr("x2", chartWidth - marginRight)
          .attr("y1", yOffset + chartHeight + gap / 2)
          .attr("y2", yOffset + chartHeight + gap / 2)
          .attr("stroke", "black")
          .attr("stroke-width", lineWidth);
      }
    });

    chartHolder.append(svg.node());
  }

  selectedCountries.addEventListener("input", render);
  selectedCategories.addEventListener("input", render);

  render();
  return container;
}
)}

function _chart2(FileAttachment,html,d3){return(
async() => {
  const raw = await FileAttachment("arbes_crop_percent.csv").csv();

  const countryOrder = ["Ethiopia", "Ghana", "Mali", "Malawi", "Tanzania"];

  const colorMap = new Map([
    ["Ethiopia", "#e0c55a"],
    ["Ghana", "#6cab72"],
    ["Mali", "#a24a5d"],
    ["Malawi", "#666666"],
    ["Tanzania", "#6f9fd1"]
  ]);

  const width = 900;
  const rowHeight = 22;
  const groupGap = 12;
  const marginTop = 12;
  const marginBottom = 12;

  function createMultiSelect(labelText, options, defaultSelected = options) {
    const wrapper = html`<div style="position:relative; min-width:280px; font:12px sans-serif;"></div>`;

    const label = html`<div style="font-size:14px; margin-bottom:4px;">${labelText}</div>`;

    const button = html`<button type="button" style="
      width:100%;
      text-align:left;
      padding:4px 28px 4px 8px;
      border:1px solid #999;
      background:white;
      cursor:pointer;
      position:relative;
      font:12px sans-serif;
    "></button>`;

    const arrow = html`<span style="
      position:absolute;
      right:8px;
      top:50%;
      transform:translateY(-50%);
      pointer-events:none;
      font-size:10px;
    ">▼</span>`;
    button.appendChild(arrow);

    const panel = html`<div style="
      display:none;
      position:absolute;
      top:100%;
      left:0;
      width:100%;
      max-height:220px;
      overflow:auto;
      background:white;
      border:1px solid #999;
      box-shadow:0 2px 6px rgba(0,0,0,0.15);
      padding:6px 8px;
      z-index:1000;
    "></div>`;

    const allId = `${labelText}-all-${Math.random().toString(36).slice(2)}`;
    const allRow = html`<label style="display:flex; align-items:center; gap:6px; margin:2px 0;">
      <input type="checkbox" id="${allId}">
      <span>(All)</span>
    </label>`;
    panel.appendChild(allRow);

    const rows = options.map(option => {
      const id = `${labelText}-${option}-${Math.random().toString(36).slice(2)}`;
      const row = html`<label style="display:flex; align-items:center; gap:6px; margin:2px 0;">
        <input type="checkbox" value="${option}" id="${id}">
        <span>${option}</span>
      </label>`;
      panel.appendChild(row);
      return row.querySelector("input");
    });

    function getSelected() {
      return rows.filter(input => input.checked).map(input => input.value);
    }

    function setButtonText(text) {
      while (button.firstChild && button.firstChild !== arrow) {
        button.removeChild(button.firstChild);
      }
      button.insertBefore(document.createTextNode(text), arrow);
    }

    function updateButtonText() {
      const selected = getSelected();
      if (selected.length === options.length) setButtonText("(All)");
      else if (selected.length === 0) setButtonText("(None)");
      else if (selected.length === 1) setButtonText(selected[0]);
      else setButtonText(`(${selected.length} selected)`);
    }

    function syncAllBox() {
      const selected = getSelected();
      allRow.querySelector("input").checked = selected.length === options.length;
    }

    rows.forEach(input => {
      input.checked = defaultSelected.includes(input.value);
      input.addEventListener("input", () => {
        syncAllBox();
        updateButtonText();
        wrapper.dispatchEvent(new CustomEvent("input"));
      });
    });

    allRow.querySelector("input").checked = defaultSelected.length === options.length;

    allRow.querySelector("input").addEventListener("input", e => {
      const checked = e.target.checked;
      rows.forEach(input => {
        input.checked = checked;
      });
      updateButtonText();
      wrapper.dispatchEvent(new CustomEvent("input"));
    });

    button.addEventListener("click", e => {
      e.stopPropagation();
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    });

    document.addEventListener("click", e => {
      if (!wrapper.contains(e.target)) {
        panel.style.display = "none";
      }
    });

    wrapper.getSelected = getSelected;

    updateButtonText();

    wrapper.append(label, button, panel);
    return wrapper;
  }

  const selectedCountries = createMultiSelect(
    "Country",
    countryOrder,
    countryOrder
  );

  const controls = html`<div style="
    display:flex;
    gap:32px;
    align-items:flex-start;
    margin-bottom:16px;
  "></div>`;

  controls.append(selectedCountries);

  const container = html`<div></div>`;
  const chartHolder = html`<div></div>`;
  container.append(controls, chartHolder);

  function render() {
    const shownCountries = selectedCountries.getSelected();

    chartHolder.innerHTML = "";

    if (shownCountries.length === 0) {
      const emptySvg = d3.create("svg")
        .attr("width", width)
        .attr("height", 80)
        .attr("viewBox", [0, 0, width, 80])
        .style("max-width", "100%")
        .style("height", "auto")
        .style("font", "12px sans-serif");

      emptySvg.append("text")
        .attr("x", 16)
        .attr("y", 40)
        .attr("fill", "black")
        .text("No data selected. Please choose at least one country.");

      chartHolder.append(emptySvg.node());
      return;
    }

    const grouped = countryOrder
      .filter(country => shownCountries.includes(country))
      .map(country => ({
        country,
        values: raw
          .filter(d => d.Country === country)
          .map(d => ({
            crop: d.Crop,
            value: +String(d["%HHcrops"]).replace("%", "")
          }))
      }))
      .filter(d => d.values.length > 0);

    const totalRows = d3.sum(grouped, d => d.values.length);
    const totalGap = groupGap * (grouped.length - 1);
    const height = marginTop + marginBottom + totalRows * rowHeight + totalGap;

    const countryW = width * 0.15;
    const cropW = width * 0.15;
    const barAreaW = width * 0.70;
    const barW = barAreaW * 0.90;

    const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("max-width", "100%")
      .style("height", "auto")
      .style("font", "12px sans-serif");

    const xBar = d3.scaleLinear()
      .domain([0, 100])
      .range([0, barW]);

    svg.append("line")
      .attr("x1", countryW)
      .attr("x2", countryW)
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#ccc");

    svg.append("line")
      .attr("x1", countryW + cropW)
      .attr("x2", countryW + cropW)
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#ccc");

    const g = svg.append("g")
      .attr("transform", `translate(0, ${marginTop})`);

    let yOffset = 0;

    grouped.forEach((group, groupIndex) => {
      const blockHeight = group.values.length * rowHeight;
      const countryY = yOffset + blockHeight / 2;

      g.append("text")
        .attr("x", countryW / 2)
        .attr("y", countryY)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", 14)
        .attr("font-weight", 600)
        .attr("fill", "black")
        .text(group.country);

      group.values.forEach((d, i) => {
        const y = yOffset + i * rowHeight + rowHeight / 2;
        const barX = countryW + cropW + 10;

        g.append("text")
          .attr("x", countryW + 10)
          .attr("y", y)
          .attr("dominant-baseline", "middle")
          .attr("font-size", 12)
          .attr("fill", "black")
          .text(d.crop);

        g.append("rect")
          .attr("x", barX)
          .attr("y", y - 6)
          .attr("width", barW)
          .attr("height", 12)
          .attr("fill", "#f2f2f2")
          .attr("rx", 2);

        g.append("rect")
          .attr("x", barX)
          .attr("y", y - 6)
          .attr("width", xBar(d.value))
          .attr("height", 12)
          .attr("fill", colorMap.get(group.country) || "#999")
          .attr("rx", 2);

        g.append("text")
          .attr("x", barX + xBar(d.value) + 6)
          .attr("y", y)
          .attr("dominant-baseline", "middle")
          .attr("font-size", 11)
          .attr("fill", "black")
          .text(`${d.value}%`);
      });

      yOffset += blockHeight;

      if (groupIndex < grouped.length - 1) {
        g.append("line")
          .attr("x1", 0)
          .attr("x2", width)
          .attr("y1", yOffset + groupGap / 2)
          .attr("y2", yOffset + groupGap / 2)
          .attr("stroke", "black")
          .attr("stroke-width", 1);

        yOffset += groupGap;
      }
    });

    chartHolder.append(svg.node());
  }

  selectedCountries.addEventListener("input", render);

  render();
  return container;
}
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["arbes_soil_percent.csv", {url: new URL("./files/c2589633280e7a8ad7e48b7da8c6f7fc4e62b91046b12187d91c198eff2bc6b82847fab290cd61e79686a598102fb81a027de0f06a35b159020410d6b3c692ff.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["arbes_crop_percent.csv", {url: new URL("./files/3f00dd076acdf1ff6b5ecb2f0618b0ebb3941f23e744a3c6b2b49f736849122b66ccec1b3b46916190c13d3054c510f5b7e786eaeaa9234d8acfb50e7dadb789.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("viewof tab")).define("viewof tab", ["html","Event"], _tab);
  main.variable(observer("tab")).define("tab", ["Generators", "viewof tab"], (G, _) => G.input(_));
  main.variable(observer("tabbedChart")).define("tabbedChart", ["tab","chart1","chart2"], _tabbedChart);
  main.variable(observer()).define(["md"], _4);
  main.variable(observer("chart1")).define("chart1", ["FileAttachment","html","d3"], _chart1);
  main.variable(observer("chart2")).define("chart2", ["FileAttachment","html","d3"], _chart2);
  return main;
}
