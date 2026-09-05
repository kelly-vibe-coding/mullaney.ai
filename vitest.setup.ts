import "@testing-library/jest-dom/vitest";

Element.prototype.scrollIntoView = function scrollIntoView() {
  // jsdom stub — ShortsFeed recenters the looped list with scrollIntoView.
};
