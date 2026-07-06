const EQ_TYPE_ICON_MARKUP = {
  bell: '<path class="eq-filter-shape-button__curve" d="M 12 3 C 13 7.5 14.5 10 19.5 12 C 14.5 14 13 16.5 12 21 C 11 16.5 9.5 14 4.5 12 C 9.5 10 11 7.5 12 3" />',
  lowShelf: `
    <path class="eq-filter-shape-button__curve" d="M 3.5 7 C 7.2 7 9.2 8.5 11.3 10.4 C 13.2 12.1 15.3 12.5 20.5 12.5" />
    <path class="eq-filter-shape-button__curve" d="M 3.5 17 C 7.2 17 9.2 15.5 11.3 13.6 C 13.2 11.9 15.3 11.5 20.5 11.5" />
  `,
  highShelf: `
    <path class="eq-filter-shape-button__curve" d="M 3.5 11.5 C 8.7 11.5 10.8 11.9 12.7 10.4 C 14.8 8.5 16.8 7 20.5 7" />
    <path class="eq-filter-shape-button__curve" d="M 3.5 12.5 C 8.7 12.5 10.8 12.1 12.7 13.6 C 14.8 15.5 16.8 17 20.5 17" />
  `,
  highPass:
    '<path class="eq-filter-shape-button__curve" d="M 4 20 C 4.4 15 6.8 11.8 10.2 10 C 12.8 8.6 15.8 8.2 20 8.2" />',
  lowPass:
    '<path class="eq-filter-shape-button__curve" d="M 4 7.8 C 8.2 7.8 11.2 8.2 13.8 10 C 17.2 12.2 19.6 15 20 20" />'
};

export function renderEqTypeIcon(filterType) {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      ${EQ_TYPE_ICON_MARKUP[filterType]}
    </svg>
  `;
}
