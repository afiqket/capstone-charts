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

// Main container where the selected chart will be rendered.
const app = document.getElementById("app");

// Dropdown element used to choose which chart file to load.
const chartSelect = document.getElementById("chartSelect");

// Keep track of the currently running Observable runtime
// so we can properly dispose of it before loading another chart.
let currentRuntime = null;

// Stores the list of discovered chart files.
let chartFiles = [];

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
});