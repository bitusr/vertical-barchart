// CONSTANTS
const MILLISECS_PER_SEC = 1000;
const SECS_PER_MIN = 60;
const MINS_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_YEAR = 365;
const DETAILS_BARCHART_TABS = [`profit`, `revenue`, `taxes`, `employee_count`];

// UTILS
const getLastYears = (currentTimeInMillisecs, numberOfYears) => {
  return [...Array(numberOfYears)].map((it, i) => {
    if (i === 0) return getYear(currentTimeInMillisecs);
    else if (i > 0) {
      const numberOfYearsInMillisecs = getOneYearInMillisecs() * i;
      const timeInMillisecs = currentTimeInMillisecs - numberOfYearsInMillisecs;
      return getYear(timeInMillisecs);
    }
  });
};

const getYear = currentTimeInMillisecs => new Date(currentTimeInMillisecs).getFullYear();

// DATA HANDLING
const getLastTenYearsData = (data, tab, years) => {
  const orderedData = years.map(it => data.hasOwnProperty(tab) && data[tab][`${unwrapFromQuotes(it)}`]);
  return cleanData(orderedData);
};

const getOneYearInMillisecs = () => MILLISECS_PER_SEC * SECS_PER_MIN * MINS_PER_HOUR * HOURS_PER_DAY * DAYS_PER_YEAR;

const unwrapFromQuotes = entry => {
  if (typeof entry === `number`) return entry;
  if (typeof entry !== 'string') return;
  const it = entry.trim();
  const quote = `"`;
  if (it[0] === quote && it[it.length - 1] === quote) return it.slice(1, -1);
};

const cleanData = data => data.filter(it => it !== undefined);

// GRAPH
// =====================================================================================================================
const margin = { top: 20, right: 40, bottom: 20, left: 50 };
const width = 860 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select(`#wrapper`)
  .append(`svg`)
  .attr(`width`, width + margin.left + margin.right)
  .attr(`height`, height + margin.top + margin.bottom)
  .append(`g`)
  .attr(`transform`, `translate(${margin.left}, ${margin.top})`);

// SCALES
const xScale = d3.scaleBand()
  .range([0, width])
  .padding(0.5);

const yScale = d3.scaleLinear()
  .range([height, 0]);

// AXIS
svg.append(`g`)
  .attr(`id`, `x-axis`)
  .attr(`transform`, `translate(0, ${height})`);

svg.append(`g`)
  .attr(`id`, `y-axis`);

const xAxis = d3.axisBottom(xScale);

const yAxis = d3.axisLeft(yScale)
  .tickSize(-width);

const customXAxis = g => {
  g.call(xAxis)
    .select(`.domain`).remove();

  g.selectAll(`.tick line`).remove()
};

const customYAxis = g => {
  g.call(yAxis)
    .select(`.domain`).remove();

  g.selectAll(`.tick line`)
    .attr(`stroke`, `#d8d8d8`);

  g.selectAll(`.tick text`)
    .attr(`x`, -20)
    .attr(`dy`, 4)
};

const update = (rawData, tab, years) => {
  const data = getLastTenYearsData(rawData, tab, years);

  xScale.domain(years);

  yScale.domain(d3.extent(data, d => +d.value));

  let bar = svg.selectAll(`.bar`)
    .data(data, d => d.value);

  bar.exit().remove();

  const barEnter = bar.enter()
    .append(`g`)
    .attr(`class`, `bar`)
    .attr(`transform`, d => `translate(${xScale(+d.year)}, 0)`);

  barEnter.append(`rect`)
    .attr(`class`, `bar-rect`)
    .attr(`y`, d => d.value >= 0 ? yScale(d.value) : yScale(0))
    .attr(`height`, d => Math.abs(yScale(d.value) - yScale(0)))
    .attr(`width`, 32);

  d3.select(`#x-axis`).call(customXAxis);

  d3.select(`#y-axis`).call(customYAxis);
};


const years = getLastYears(Date.now(), 10).reverse();
update(DUMMY_DATA_NEW, `profit`, years);
