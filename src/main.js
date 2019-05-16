// CONSTANTS
const TAB_PROFIT = `profit`;
const TAB_REVENUE = `revenue`;
const TAB_EMPLOYEES = `employee_count`;
const TAB_TAXES = `taxes`;

// DOM CONSTANTS
const Tabs = {
  [TAB_PROFIT]: document.querySelector(`#tab-profit`),
  [TAB_REVENUE]: document.querySelector(`#tab-revenue`),
  [TAB_EMPLOYEES]: document.querySelector(`#tab-employees`),
  [TAB_TAXES]: document.querySelector(`#tab-taxes`)
};

const TAB_ELEMENTS = document.querySelectorAll(`.tab`);

// UTILS
const getLastYears = (date, numberOfYears) => {
  const lastYear = getYear(date);
  return [...Array(numberOfYears)].map((it, i) => i === 0 ? lastYear : lastYear - i);
};

const getYear = date => new Date(date).getFullYear();

const removeClass = (elements, className) => [...elements].forEach(it => it.classList.remove(className));

const clampToNumOrLowerBound = (val, minBound) => val > minBound ? val : minBound;

const clampToNumOrUpperBound = (val, maxBound) => val < maxBound ? val : maxBound;

const buildArrayOfIntsWithin = (min, max) => {
  const numberToIncludeMaxValue = 1;
  const amount = max - min + numberToIncludeMaxValue;
  return [...Array(amount)].map((it, i) => min + i);
};

// DATA HANDLING
const dataHandler = (data, years) => tab => {
  return years
    .map(it => data.hasOwnProperty(tab) && data[tab][it])
    .filter(value => value !== undefined);
};

// GRAPH
const margin = { top: 20, right: 0, bottom: 20, left: 50 };
const width = 860 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;
const barWidth = 32;
const lastTenYears = getLastYears(Date.now(), 10).reverse();

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

const getXDomainValues = (data, allowedLastYears) => {
  const [min, max] = d3.extent(data, d => +d.year);
  const [minBound, maxBound] = d3.extent(allowedLastYears);
  const oldestYearAllowed = clampToNumOrLowerBound(min, minBound);
  const newestYearAllowed = clampToNumOrUpperBound(max, maxBound);
  return buildArrayOfIntsWithin(oldestYearAllowed, newestYearAllowed);
};

const yScale = d3.scaleLinear()
  .range([height, 0]);

const getYDomainExtent = data => {
  const [min, max] = d3.extent(data, d => +d.value);
  if (min >= 0) return [0, max];
  if (max <= 0) return [min, 0];
  return [min, max];
};

// AXIS
svg.append(`g`)
  .attr(`id`, `x-axis`)
  .attr(`transform`, `translate(0, ${height})`);

svg.append(`g`)
  .attr(`id`, `y-axis`);

const xAxis = d3.axisBottom(xScale);

const formatTicks = d => d3.format('.2s')(d)
  .replace(`M`, `Mio`)
  .replace(`G`, `B`);

const yAxis = d3.axisLeft(yScale)
  .tickSize(-width)
  .tickFormat(formatTicks);

const customXAxis = g => {
  g.call(xAxis)
    .select(`.domain`)
    .attr(`class`, `visibilityHidden`);

  g.selectAll(`.tick line`)
    .attr(`class`, `visibilityHidden`);
};

const customYAxis = g => {
  g.call(yAxis)
    .select(`.domain`)
    .attr(`class`, `visibilityHidden`);

  g.selectAll(`.tick line`)
    .attr(`stroke`, `#d8d8d8`);

  g.selectAll(`.tick text`)
    .attr(`x`, -5)
    .attr(`dy`, 4)
};

const update = (getTabData, tab) => {
  const data = getTabData(tab);

  xScale.domain(getXDomainValues(data, lastTenYears));

  yScale.domain(getYDomainExtent(data));

  let bar = svg.selectAll(`.bar`)
    .data(data, d => +d.value);

  bar.exit().remove();

  const barEnter = bar.enter()
    .append(`g`)
    .attr(`class`, `bar`)
    .attr(`transform`, d => {
      const halfBarWidth = barWidth / 2;
      const halfBandWidth = xScale.bandwidth() / 2;
      const xStartingPointForBar = xScale(+d.year) + halfBandWidth - halfBarWidth;
      return `translate(${xStartingPointForBar}, 0)`
    });

  barEnter.append(`rect`)
    .attr(`class`, d => `bar-rect ${+d.value < 0 ? `bar-rect--negative` : `bar-rect--positive`}`)
    .attr(`y`, d => +d.value >= 0 ? yScale(+d.value) : yScale(0))
    .attr(`width`, barWidth) // hack for FF
    .attr(`height`, d => Math.abs(yScale(+d.value) - yScale(0)));

  bar = barEnter.merge(bar);

  bar.select(`.bar-rect`)
    .attr(`height`, d => Math.abs(yScale(+d.value) - yScale(0)));

  d3.select(`#x-axis`).call(customXAxis);

  d3.select(`#y-axis`).call(customYAxis);
};

// INITIAL CALL
const getTabData = dataHandler(DUMMY_DATA, lastTenYears);
update(getTabData, TAB_PROFIT);
// TODO refactor
Tabs.profit.classList.add(`tab--selected`);

// TODO refactor
// EVENTS
Tabs.profit.addEventListener(`click`, e => {
  removeClass(TAB_ELEMENTS, `tab--selected`);
  e.target.classList.add(`tab--selected`);
  update(getTabData, TAB_PROFIT);
});

Tabs.revenue.addEventListener(`click`, e => {
  removeClass(TAB_ELEMENTS, `tab--selected`);
  e.target.classList.add(`tab--selected`);
  update(getTabData, TAB_REVENUE);
});

Tabs.employee_count.addEventListener(`click`, e => {
  removeClass(TAB_ELEMENTS, `tab--selected`);
  e.target.classList.add(`tab--selected`);
  update(getTabData, TAB_EMPLOYEES);
});

Tabs.taxes.addEventListener(`click`, e => {
  removeClass(TAB_ELEMENTS, `tab--selected`);
  e.target.classList.add(`tab--selected`);
  update(getTabData, TAB_TAXES);
});
