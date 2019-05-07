// CONSTANTS
const MILLISECS_PER_SEC = 1000;
const SECS_PER_MIN = 60;
const MINS_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_YEAR = 365;
const DETAILS_BARCHART_TABS = [`profit`, `revenue`, `taxes`, `employee_count`];

// DATA HANDLING
const getLastTenYearsData = (data, tab) => {
  const years = getLastYears(Date.now(), 10).reverse();
  const orderedData = years.map(it => data.hasOwnProperty(tab) && data[tab][`${unwrapFromQuotes(it)}`]);
  return cleanData(orderedData);
};

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
const margin = { top: 20, right: 40, bottom: 20, left: 60 };
const width = 960 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select(`#wrapper`)
  .append(`svg`)
  .attr(`width`, width + margin.left + margin.right)
  .attr(`height`, height + margin.top + margin.bottom)
  .append(`g`)
  .attr(`transform`, `translate(${margin.left}, ${margin.top})`);

const yScale = d3.scaleBand()
  .range([height, 0]).padding(0.5);

svg.append(`g`)
  .attr(`id`, `x-axis`)
  .attr(`transform`, `translate(0, ${height})`);

svg.append(`g`)
  .attr(`id`, `y-axis`);

const update = (data, tab) => {
  const lastTenYearsData = getLastTenYearsData(data, tab);

  yScale.domain([0, d3.max(lastTenYearsData, d => +d.value)]);


};

update(DUMMY_DATA_NEW, `employee_count`);
