// CONSTANTS
const TAB_PROFIT = `profit`;
const TAB_REVENUE = `revenue`;
const TAB_EMPLOYEES = `employee_count`;
const TAB_TAXES = `taxes`;
const CURRENCY_TO_SYMBOL = {
  USD: `$`, // US Dollar
  CAD: `C$`, // Canadian Dollar
  AUD: `A$`, // Australian Dollar
  ZAR: `R`, // South African Rand
  EUR: `€`, // Euro
  GBP: `£`, // British Pound Sterling
  CHF: `SFr.`, // Swiss Franc
  JPY: `¥`, // Japanese Yen
  CNY: `¥`, // Chinese Yuan
  KRW: `₩`, // South Korean Won
  RUB: `₽` // Russian Ruble
};

// DOM CONSTANTS
const Tabs = {
  [TAB_PROFIT]: document.querySelector(`#tab-profit`),
  [TAB_REVENUE]: document.querySelector(`#tab-revenue`),
  [TAB_EMPLOYEES]: document.querySelector(`#tab-employees`),
  [TAB_TAXES]: document.querySelector(`#tab-taxes`)
};

const TAB_ELEMENTS = document.querySelectorAll(`.tab`);

// UTILS
const getNumberOfYearsPriorTo = (date, numberOfYears) => {
  const lastYear = new Date(date).getFullYear();
  return Array.from(Array(numberOfYears), (it, i) => i === 0 ? lastYear : lastYear - i);
};

const removeClass = (elements, className) => [...elements].forEach(it => it.classList.remove(className));

const buildArrayOfIntsWithin = ([min, max]) => {
  const numberToIncludeMaxValue = 1;
  const length = max - min + numberToIncludeMaxValue;
  return Array.from(Array(length), (it, i) => min + i);
};

const getValsWithinExtentOrBounds = ([min, max], [minBound, maxBound]) => {
  const minAllowed = Math.max(min, minBound);
  const maxAllowed = Math.min(max, maxBound);
  const isAllowedValNaN = Number.isNaN(minAllowed) || Number.isNaN(maxAllowed);
  if (minAllowed > maxAllowed || isAllowedValNaN) {
    return buildArrayOfIntsWithin([minBound, maxBound]);
  }
  return buildArrayOfIntsWithin([minAllowed, maxAllowed]);
};

// GRAPH
const margin = { top: 20, right: 0, bottom: 30, left: 50 };
const width = 860 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;
const barWidth = 32;
const lastTenYears = getNumberOfYearsPriorTo(Date.now(), 10).reverse();

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

const getYDomainExtent = ([min, max]) => [Math.min(min, 0), Math.max(0, max)];

// FORMATTERS
const formatNumber = d => d3.format(`.2s`)(d)
  .replace(`k`, `K`)
  .replace(`M`, `Mio`)
  .replace(`G`, `Bn`);

// AXIS
svg.append(`g`)
  .attr(`id`, `tabbed-bar-chart__x-axis`)
  .attr(`transform`, `translate(0, ${height})`);

svg.append(`g`)
  .attr(`id`, `tabbed-bar-chart__y-axis`);

const xAxis = d3.axisBottom(xScale);

const yAxis = d3.axisLeft(yScale)
  .tickSize(-width)
  .tickFormat(formatNumber);

const zeroPseudoAxis = svg.append(`g`)
  .attr(`id`, `tabbed-bar-chart__zero-axis`);

zeroPseudoAxis
  .append(`line`)
  .attr(`class`, `zero-axis`)
  .attr(`x2`, width);

const update = (data) => {
  const yearsExtent = d3.extent(data, ({ year }) => year);
  const amountExtent = d3.extent(data, ({ value }) => value);
  const valsWithinExtentOrBounds = getValsWithinExtentOrBounds(yearsExtent, allowedExtent);
  const noDataYears = getNoDataYears(data, valsWithinExtentOrBounds);

  xScale.domain(valsWithinExtentOrBounds);

  yScale.domain(getYDomainExtent(amountExtent));

  let bar = svg.selectAll(`.bar`)
    .data(data, ({ value }) => value);

  bar.exit().remove();

  const barEnter = bar.enter()
    .append(`g`)
    .attr(`class`, `bar`)
    .attr(`transform`, ({ year }) => {
      const halfBarWidth = barWidth / 2;
      const halfBandWidth = xScale.bandwidth() / 2;
      const xStartingPointForBar = xScale(year) + halfBandWidth - halfBarWidth;
      return `translate(${xStartingPointForBar}, 0)`
    });

  barEnter.append(`rect`)
    .attr(`class`, ({ value }) => `bar-rect ${value < 0 ? `bar-rect--negative` : `bar-rect--positive`}`)
    .attr(`y`, ({ value }) => value >= 0 ? yScale(value) : yScale(0))
    .attr(`width`, barWidth) // hack for FF
    .attr(`height`, ({ value }) => Math.abs(yScale(value) - yScale(0)));

  barEnter
    .append(`text`)
    .attr(`class`, ({ value }) => `bar-text ${value < 0 ? `bar-text--negative` : `bar-text--positive`}`)
    .attr(`y`, ({ value }) => value >= 0 ? yScale(value) - 5 : yScale(value) + 12)
    .attr(`x`, barWidth / 2)
    .attr(`text-anchor`, `middle`)
    .text(({ unit, value}) => {
      const s = CURRENCY_TO_SYMBOL[unit] ? CURRENCY_TO_SYMBOL[unit] : '';
      return `${formatNumber(value)} ${s}`;
    });

  bar = barEnter.merge(bar);

  bar.select(`.bar-rect`)
    .attr(`height`, ({ value }) => Math.abs(yScale(value) - yScale(0)));

  const customXAxis = g => {
    g.call(xAxis)
      .select(`.domain`)
      .attr(`class`, `visibilityHidden`);

    g.selectAll(`.tick line`)
      .attr(`class`, `visibilityHidden`);

    g.selectAll(`.tick text`)
      .attr(`class`, d => noDataYears.includes(d) ? `no-data` : ``)
      .attr(`dy`, 20);
  };

  const customYAxis = g => {
    g.call(yAxis)
      .select(`.domain`)
      .attr(`class`, `visibilityHidden`);

    g.selectAll(`.tick line`)
      .attr(`stroke`, `#d8d8d8`)
      .attr(`visibility`, d => d === 0 ? `hidden` : `unset`);

    g.selectAll(`.tick text`)
      .attr(`x`, -5)
      .attr(`dy`, 4);
  };

  d3.select(`#tabbed-bar-chart__x-axis`).call(customXAxis);

  d3.select(`#tabbed-bar-chart__y-axis`).call(customYAxis);

  zeroPseudoAxis
    .attr(`transform`, () => {
      const yScaleZero = yScale(0);
      const y = Number.isNaN(yScaleZero) ? height : yScaleZero;
      return `translate(0, ${y})`;
    });
};

// DATA HANDLING
const allowedExtent = d3.extent(lastTenYears);

const getNoDataYears = (data, allowedYears) => {
  const copy = [...allowedYears];
  data.forEach(({ year }) => {
    const index = copy.indexOf(year);
    if (index !== -1) copy.splice(index, 1);
  });
  return copy;
};

const getDataConverter = data => tab => {
  const tabData = data[tab] || {};
  const extent = d3.extent(Object.keys(tabData), d => +d);
  const allowedYears = getValsWithinExtentOrBounds(extent, allowedExtent);
  return allowedYears
    .reduce((acc, it) => {
      if (tabData.hasOwnProperty(it)) {
        return acc.concat({
          ...tabData[it],
          year: +tabData[it].year,
          value: +tabData[it].value
        });
      }
      return acc;
    }, []);
};

// INITIAL CALL
const getTabData = getDataConverter(DUMMY_DATA);
const data = getTabData(TAB_PROFIT);
update(data);

// TODO refactor
Tabs.profit.classList.add(`tab--selected`);

// TODO refactor
// EVENTS
Tabs.profit.addEventListener(`click`, e => {
  removeClass(TAB_ELEMENTS, `tab--selected`);
  e.target.classList.add(`tab--selected`);
  const data = getTabData(TAB_PROFIT);
  update(data);
});

Tabs.revenue.addEventListener(`click`, e => {
  removeClass(TAB_ELEMENTS, `tab--selected`);
  e.target.classList.add(`tab--selected`);
  const data = getTabData(TAB_REVENUE);
  update(data);
});

Tabs.employee_count.addEventListener(`click`, e => {
  removeClass(TAB_ELEMENTS, `tab--selected`);
  e.target.classList.add(`tab--selected`);
  const data = getTabData(TAB_EMPLOYEES);
  update(data);
});

Tabs.taxes.addEventListener(`click`, e => {
  removeClass(TAB_ELEMENTS, `tab--selected`);
  e.target.classList.add(`tab--selected`);
  const data = getTabData(TAB_TAXES);
  update(data);
});
