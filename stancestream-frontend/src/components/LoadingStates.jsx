// Loading fallbacks for lazy views: one plain status line each.
const Loading = ({ what }) => (
  <p className="section-note" role="status">Loading {what}.</p>
);

export const DashboardLoader = () => <Loading what="the dashboard" />;
export const ChartLoader = () => <Loading what="the chart" />;
export const PanelLoader = () => <Loading what="this section" />;
export const ModalLoader = () => <Loading what="the dialog" />;
export const OverlayLoader = () => <Loading what="the cache measurements" />;
