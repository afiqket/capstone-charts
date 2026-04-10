// Import Observable runtime tools.
// Runtime runs the notebook/module,
// Library provides standard Observable built-ins,
// Inspector mounts each cell's output into normal DOM elements.
import {
  Runtime,
  Library,
  Inspector
} from "https://cdn.jsdelivr.net/npm/@observablehq/runtime@5/dist/runtime.js";

// Used to parse charts.csv.
import { csvParseRows } from "https://cdn.jsdelivr.net/npm/d3-dsv@3/+esm";

// Native <select> menus are not reliable for screenshot-based agents.
// Their open popup may close on focus changes or not appear correctly in screenshots.
// If isCustomSelect is true, this script will replace them with custom DOM dropdowns 
// so the that options stay visible and clickable as normal page content.
const isCustomSelect = true;

// Main container where the selected chart will be rendered.
const app = document.getElementById("app");

// Dropdown element used to choose which chart file to load.
const chartSelect = document.getElementById("chartSelect");

// Keep track of the currently running Observable runtime
// so we can properly dispose of it before loading another chart.
let currentRuntime = null;

// Stores the list of discovered chart files.
let chartFiles = [];

// Used to watch for newly inserted native selects inside rendered charts.
let selectEnhancerObserver = null;

// Creates the outer DOM structure for one loaded chart module.
// Returns the inner container where individual Observable cells will be placed.
function createModuleShell() {
  const section = document.createElement("section");
  section.className = "chart-module";

  const cells = document.createElement("div");
  cells.className = "chart-cells";

  section.appendChild(cells);
  app.appendChild(section);

  return cells;
}

// Creates a wrapper for a single Observable cell.
// Each cell gets its own container, and the Inspector renders into `output`.
function createCellContainer(name) {
  const wrapper = document.createElement("div");
  wrapper.className = `cell${name ? " cell--named" : ""}`;

  const output = document.createElement("div");
  wrapper.appendChild(output);

  return { wrapper, output };
}

// Displays a user-friendly error box inside the app area.
// If a title is provided, it is shown above the actual error message.
function showError(title, error) {
  const section = document.createElement("section");
  section.className = "chart-module";

  const box = document.createElement("div");
  box.className = "error-box";
  box.textContent = title
    ? `${title}\n\n${String(error)}`
    : String(error);

  section.appendChild(box);
  app.appendChild(section);
}

// Removes the currently rendered chart and disposes the old runtime.
// This is important so old Observable modules do not keep running in memory.
function clearCurrentChart() {
  if (currentRuntime) {
    currentRuntime.dispose();
    currentRuntime = null;
  }

  if (selectEnhancerObserver) {
    selectEnhancerObserver.disconnect();
    selectEnhancerObserver = null;
  }

  app.innerHTML = "";
}

// Gets the chart slug from a chart object.
// Example:
// "./charts/playspace.js" becomes "playspace"
function getChartSlug(chart) {
  return chart.path
    .split("/")
    .pop()
    .replace(".js", "")
    .toLowerCase();
}

// Reads the selected chart from the URL query.
// Example:
// index.html?chart=playspace
// returns "playspace"
function getChartQueryFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const chartName = params.get("chart");

  return chartName ? chartName.toLowerCase() : null;
}

// Finds which chart should be loaded first based on the URL.
// If the URL has no valid chart, fall back to the first chart.
function getInitialChartIndex(charts) {
  const chartQuery = getChartQueryFromUrl();

  if (!chartQuery) {
    return 0;
  }

  const index = charts.findIndex(chart => getChartSlug(chart) === chartQuery);
  return index >= 0 ? index : 0;
}

// Updates the browser URL to match the currently selected chart.
// This keeps the page shareable and reload-safe.
function updateUrlForChart(chart) {
  const params = new URLSearchParams(window.location.search);
  params.set("chart", getChartSlug(chart));

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  history.replaceState(null, "", newUrl);
}

function injectCustomSelectStyles() {
  if (document.getElementById("custom-select-styles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "custom-select-styles";
  style.textContent = `
    .sr-only-native-select {
      position: absolute !important;
      opacity: 0 !important;
      pointer-events: none !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
    }

    .custom-select {
      position: relative;
      display: inline-block;
      width: max-content;
      max-width: min(90vw, 100%);
      font-size: 13px;
      vertical-align: middle;
    }

    .custom-select__button {
      width: 100%;
      min-width: 0;
      padding: 5px 24px 5px 8px;
      border: 1px solid #bbb;
      border-radius: 3px;
      background: #fff;
      font: inherit;
      text-align: left;
      cursor: pointer;
      line-height: 1.4;
      position: relative;
      white-space: nowrap;
    }

    .custom-select__button::after {
      content: "▼";
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 10px;
      pointer-events: none;
      opacity: 0.7;
    }

    .custom-select__button:focus-visible {
      outline: 2px solid #4c9ffe;
      outline-offset: 1px;
    }

    .custom-select__list {
      position: absolute;
      top: calc(100% + 2px);
      left: 0;
      min-width: 100%;
      width: max-content;
      max-width: min(90vw, calc(100vw - 16px));
      z-index: 9999;
      background: #fff;
      border: 1px solid #bbb;
      border-radius: 3px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      padding: 4px 0;
      display: none;
      overflow-y: auto;
      overflow-x: hidden;
      box-sizing: border-box;
    }

    .custom-select.open-upward .custom-select__list {
      top: auto;
      bottom: calc(100% + 2px);
    }

    .custom-select.is-open .custom-select__list {
      display: block;
    }

    .custom-select__option {
      padding: 6px 8px;
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
    }

    .custom-select__option:hover,
    .custom-select__option.is-selected {
      background: #e8f0fe;
    }
  `;
  document.head.appendChild(style);
}

function measureTextWidth(text, referenceElement) {
  const measurer = document.createElement("span");
  const computed = window.getComputedStyle(referenceElement);

  measurer.textContent = text;
  measurer.style.position = "absolute";
  measurer.style.visibility = "hidden";
  measurer.style.whiteSpace = "nowrap";
  measurer.style.font = computed.font;
  measurer.style.fontSize = computed.fontSize;
  measurer.style.fontFamily = computed.fontFamily;
  measurer.style.fontWeight = computed.fontWeight;
  measurer.style.letterSpacing = computed.letterSpacing;
  measurer.style.padding = "0";
  measurer.style.margin = "0";

  document.body.appendChild(measurer);
  const width = measurer.getBoundingClientRect().width;
  measurer.remove();

  return width;
}

function getLongestOptionWidth(select, referenceElement) {
  let maxWidth = 0;

  Array.from(select.options).forEach((option) => {
    const label = (option.textContent || option.label || "").trim();
    maxWidth = Math.max(maxWidth, measureTextWidth(label, referenceElement));
  });

  return Math.ceil(maxWidth);
}

function fitDropdownHeightToViewport(wrapper, list, maxVisibleOptions = 20) {
  const optionElements = Array.from(
    list.querySelectorAll(".custom-select__option")
  );

  if (optionElements.length === 0) {
    list.style.maxHeight = "";
    return;
  }

  const wrapperRect = wrapper.getBoundingClientRect();
  const firstOptionRect = optionElements[0].getBoundingClientRect();
  const optionHeight = firstOptionRect.height || 30;

  const listStyles = window.getComputedStyle(list);
  const borderTop = parseFloat(listStyles.borderTopWidth) || 0;
  const borderBottom = parseFloat(listStyles.borderBottomWidth) || 0;
  const paddingTop = parseFloat(listStyles.paddingTop) || 0;
  const paddingBottom = parseFloat(listStyles.paddingBottom) || 0;
  const listExtraHeight = borderTop + borderBottom + paddingTop + paddingBottom;

  const desiredVisible = Math.min(maxVisibleOptions, optionElements.length);
  const desiredHeight = desiredVisible * optionHeight + listExtraHeight;

  const gap = 8;
  const spaceBelow = window.innerHeight - wrapperRect.bottom - gap;
  const spaceAbove = wrapperRect.top - gap;

  let openUpward = false;
  let availableSpace = spaceBelow;

  if (spaceBelow < desiredHeight && spaceAbove > spaceBelow) {
    openUpward = true;
    availableSpace = spaceAbove;
  }

  wrapper.classList.toggle("open-upward", openUpward);

  const finalHeight = Math.max(
    optionHeight + listExtraHeight,
    Math.min(desiredHeight, availableSpace)
  );

  list.style.maxHeight = `${Math.floor(finalHeight)}px`;
}

function syncNativeSelect(select, optionIndex) {
  const oldValue = select.value;
  select.selectedIndex = optionIndex;
  const newValue = select.value;

  if (newValue !== oldValue) {
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
  } else {
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function closeAllCustomSelects(exceptWrapper = null) {
  document.querySelectorAll(".custom-select").forEach((wrapper) => {
    if (wrapper !== exceptWrapper) {
      wrapper.classList.remove("is-open");
      const button = wrapper.querySelector(".custom-select__button");
      if (button) {
        button.setAttribute("aria-expanded", "false");
      }
    }
  });
}

function createCustomSelect(select) {
  if (!(select instanceof HTMLSelectElement)) {
    return null;
  }

  if (select.dataset.customized === "1") {
    return null;
  }

  select.dataset.customized = "1";
  select.classList.add("sr-only-native-select");

  const wrapper = document.createElement("div");
  wrapper.className = "custom-select";

  const sourceRect = select.getBoundingClientRect();
  if (sourceRect.width > 0) {
    wrapper.style.minWidth = `${Math.ceil(sourceRect.width)}px`;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "custom-select__button";
  button.setAttribute("aria-haspopup", "listbox");
  button.setAttribute("aria-expanded", "false");

  const list = document.createElement("div");
  list.className = "custom-select__list";
  list.setAttribute("role", "listbox");

  function getOptionLabel(option) {
    return (option.textContent || option.label || "").trim();
  }

  function refreshButtonLabel() {
    const selectedOption = select.options[select.selectedIndex];
    button.textContent = selectedOption ? getOptionLabel(selectedOption) : "";
  }

  function refreshSelectedState() {
    const items = list.querySelectorAll(".custom-select__option");
    items.forEach((item, index) => {
      item.classList.toggle("is-selected", index === select.selectedIndex);
      item.setAttribute(
        "aria-selected",
        index === select.selectedIndex ? "true" : "false"
      );
    });
  }

  function applyNaturalWidth() {
    const longestTextWidth = getLongestOptionWidth(select, button);
    const contentWidth = longestTextWidth + 8 + 24 + 8;

    const sourceRectNow = select.getBoundingClientRect();
    const minWidth = sourceRectNow.width > 0 ? Math.ceil(sourceRectNow.width) : 0;
    const finalWidth = Math.max(minWidth, Math.ceil(contentWidth));

    wrapper.style.width = `${finalWidth}px`;
  }

  function closeList() {
    wrapper.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
  }

  function openList() {
    closeAllCustomSelects(wrapper);
    wrapper.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
    fitDropdownHeightToViewport(wrapper, list, 20);
  }

  function toggleList() {
    if (wrapper.classList.contains("is-open")) {
      closeList();
    } else {
      openList();
    }
  }

  Array.from(select.options).forEach((option, index) => {
    const item = document.createElement("div");
    item.className = "custom-select__option";
    item.setAttribute("role", "option");
    item.textContent = getOptionLabel(option);

    item.addEventListener("click", () => {
      syncNativeSelect(select, index);
      refreshButtonLabel();
      refreshSelectedState();
      closeList();
    });

    list.appendChild(item);
  });

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleList();
  });

  document.addEventListener("click", (event) => {
    if (!wrapper.contains(event.target)) {
      closeAllCustomSelects();
    }
  });

  select.addEventListener("change", () => {
    refreshButtonLabel();
    refreshSelectedState();
    applyNaturalWidth();
  });

  refreshButtonLabel();
  refreshSelectedState();
  applyNaturalWidth();

  wrapper.appendChild(button);
  wrapper.appendChild(list);

  select.insertAdjacentElement("afterend", wrapper);
  return wrapper;
}

function replaceAllNativeSelects(root = document) {
  injectCustomSelectStyles();
  const selects = root.querySelectorAll("#app select");

  selects.forEach((select) => {
    createCustomSelect(select);
  });
}

function startSelectEnhancerObserver(root = app) {
  if (selectEnhancerObserver) {
    selectEnhancerObserver.disconnect();
  }

  selectEnhancerObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) {
          return;
        }

        if (node.matches("#app select")) {
          createCustomSelect(node);
        }

        replaceAllNativeSelects(node);
      });
    }
  });

  selectEnhancerObserver.observe(root, {
    childList: true,
    subtree: true
  });
}

window.addEventListener("resize", () => {
  document.querySelectorAll(".custom-select.is-open").forEach((wrapper) => {
    const list = wrapper.querySelector(".custom-select__list");
    if (list) {
      fitDropdownHeightToViewport(wrapper, list, 20);
    }
  });
});

// Loads one chart JS file dynamically and mounts all of its Observable cells.
// `chartFile` is expected to look like:
// { title: "Play Space", path: "./charts/playspace.js" }
async function mountChartFile(chartFile) {
  clearCurrentChart();

  const cellsHost = createModuleShell();

  try {
    const mod = await import(chartFile.path);
    const define = mod.default;

    if (typeof define !== "function") {
      throw new Error(
        `File "${chartFile.path}" does not export a default define(runtime, observer) function.`
      );
    }

    const runtime = new Runtime(new Library());
    currentRuntime = runtime;

    runtime.module(define, (name) => {
      const { wrapper, output } = createCellContainer(name);
      cellsHost.appendChild(wrapper);
      return new Inspector(output);
    });

    if (isCustomSelect) {
      replaceAllNativeSelects(app);
      startSelectEnhancerObserver(app);
    }
  } catch (error) {
    app.innerHTML = "";
    showError(chartFile.title, error);
  }
}

// Reads the list of chart files from ./charts.csv.
// Expected format per line:
// Display Name,filename.js
async function loadChartList() {
  const response = await fetch("./charts.csv");

  if (!response.ok) {
    throw new Error(`Unable to read ./charts.csv (${response.status})`);
  }

  const text = await response.text();

  const rows = csvParseRows(text)
    .map(([title, file]) => ({
      title: (title || "").trim(),
      file: (file || "").trim()
    }))
    .filter(row => row.title && row.file);

  if (rows.length === 0) {
    throw new Error('No valid chart entries found in "./charts.csv".');
  }

  return rows
    .map(({ title, file }) => ({
      title,
      path: `./charts/${file}`
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

// Fills the dropdown with available chart names.
// When the user changes the selection, the chosen chart is loaded
// and the URL is updated.
function populateDropdown(charts) {
  chartSelect.innerHTML = "";

  charts.forEach((chart, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = chart.title;
    chartSelect.appendChild(option);
  });

  chartSelect.onchange = async () => {
    const selectedChart = charts[Number(chartSelect.value)];
    updateUrlForChart(selectedChart);
    await mountChartFile(selectedChart);
  };
}

// Main startup flow:
// 1. Read chart files from charts.csv
// 2. Fill the dropdown
// 3. Check if ?chart=... exists in the URL
// 4. Load that chart if found, otherwise load the first chart
async function main() {
  try {
    chartFiles = await loadChartList();
    populateDropdown(chartFiles);

    const initialIndex = getInitialChartIndex(chartFiles);
    chartSelect.value = String(initialIndex);

    // Also update the URL on first load so it stays consistent.
    updateUrlForChart(chartFiles[initialIndex]);
    await mountChartFile(chartFiles[initialIndex]);
  } catch (error) {
    clearCurrentChart();
    showError("Chart loader error", error);
  }
}

// Start the app.
main();

// Clean up the Observable runtime when the page is being closed or refreshed.
window.addEventListener("beforeunload", () => {
  if (currentRuntime) {
    currentRuntime.dispose();
  }
  if (selectEnhancerObserver) {
    selectEnhancerObserver.disconnect();
  }
});