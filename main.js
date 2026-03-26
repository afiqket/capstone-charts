// Import Observable runtime tools.
// Runtime runs the notebook/module,
// Library provides standard Observable built-ins,
// Inspector mounts each cell's output into normal DOM elements.
import {
  Runtime,
  Library,
  Inspector
} from "https://cdn.jsdelivr.net/npm/@observablehq/runtime@5/dist/runtime.js";

// This import is no longer used in the current version.
// It was previously useful for reading a CSV manifest of chart files.
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

// Loads one chart JS file dynamically and mounts all of its Observable cells.
// `chartFile` is expected to look like:
// { title: "someChart", path: "./charts/someChart.js" }
async function mountChartFile(chartFile) {
  // First clear whatever chart is currently on screen.
  clearCurrentChart();

  // Create the DOM area that will hold this chart's cells.
  const cellsHost = createModuleShell();

  try {
    // Dynamically import the selected JS file.
    const mod = await import(chartFile.path);
    const define = mod.default;

    // Observable exported notebook files should expose a default `define` function.
    if (typeof define !== "function") {
      throw new Error(`File "${chartFile.path}" does not export a default define(runtime, observer) function.`);
    }

    // Create a fresh Observable runtime for this chart.
    const runtime = new Runtime(new Library());
    currentRuntime = runtime;

    // Mount every cell from the Observable module into the page.
    // For each cell, create a container and hand it to Inspector.
    runtime.module(define, (name) => {
      const { wrapper, output } = createCellContainer(name);
      cellsHost.appendChild(wrapper);
      return new Inspector(output);
    });
  } catch (error) {
    // If loading fails, clear partial content and show an error box instead.
    app.innerHTML = "";
    showError(chartFile.title, error);
  }
}

// Reads the list of chart files by requesting the ./charts/ folder.
// This only works if the server allows directory listing.
async function loadChartList() {
  const response = await fetch("./charts/");

  if (!response.ok) {
    throw new Error(`Unable to read ./charts/ (${response.status})`);
  }

  // The directory listing is treated as HTML so we can extract links from it.
  const text = await response.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/html");

  // Find all anchor tags in the directory listing,
  // keep only .js files,
  // ignore main.js,
  // and convert them into { title, path } objects.
  const links = [...doc.querySelectorAll("a")]
    .map(a => a.getAttribute("href"))
    .filter(href => href && href.endsWith(".js") && href !== "main.js")
    .map(path => {
      const fileName = path.split("/").pop();
      const title = fileName.replace(/\.js$/i, "");
      return {
        title,
        path: path.startsWith(".") || path.startsWith("/") ? path : `./charts/${path}`
      };
    });

  // If no chart JS files were found, throw an error.
  if (links.length === 0) {
    throw new Error('No .js chart files found in "./charts/".');
  }

  return links;
}

// Fills the dropdown with available chart names.
// When the user changes the selection, the chosen chart is loaded.
function populateDropdown(charts) {
  chartSelect.innerHTML = "";

  charts.forEach((chart, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = chart.title;
    chartSelect.appendChild(option);
  });

  chartSelect.addEventListener("change", () => {
    const selectedChart = charts[Number(chartSelect.value)];
    mountChartFile(selectedChart);
  });
}

// Main startup flow:
// 1. Discover chart files
// 2. Fill the dropdown
// 3. Automatically load the first chart
async function main() {
  try {
    chartFiles = await loadChartList();
    populateDropdown(chartFiles);

    chartSelect.value = "0";
    await mountChartFile(chartFiles[0]);
  } catch (error) {
    // If anything goes wrong during startup, clear the app and show an error.
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