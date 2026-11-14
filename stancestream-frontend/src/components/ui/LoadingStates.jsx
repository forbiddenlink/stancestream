// Loading states for lazy-loaded components
import Icon from './Icon';

export const DashboardLoader = () => (
  <div className="w-full h-full min-h-[400px] bg-gray-900/90 border border-green-500/30 rounded-lg backdrop-blur-sm p-6 flex items-center justify-center">
    <div className="text-center">
      <Icon name="loading" className="w-8 h-8 animate-spin text-green-400 mx-auto mb-4" />
      <div className="text-green-300 text-sm font-mono">Loading dashboard...</div>
    </div>
  </div>
);

export const ChartLoader = () => (
  <div className="w-full h-96 bg-gray-900/90 border border-green-500/30 rounded-lg backdrop-blur-sm p-6 flex items-center justify-center">
    <div className="text-center">
      <Icon name="loading" className="w-8 h-8 animate-spin text-green-400 mx-auto mb-4" />
      <div className="text-green-300 text-sm font-mono">Loading chart...</div>
    </div>
  </div>
);

export const PanelLoader = () => (
  <div className="w-full min-h-[300px] bg-gray-900/90 border border-green-500/30 rounded-lg backdrop-blur-sm p-6 flex items-center justify-center">
    <div className="text-center">
      <Icon name="loading" className="w-8 h-8 animate-spin text-green-400 mx-auto mb-4" />
      <div className="text-green-300 text-sm font-mono">Loading...</div>
    </div>
  </div>
);

export const ModalLoader = () => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
    <div className="text-center">
      <Icon name="loading" className="w-12 h-12 animate-spin text-green-400 mx-auto mb-4" />
      <div className="text-green-300 text-sm font-mono">Loading matrix...</div>
    </div>
  </div>
);

export const OverlayLoader = () => (
  <div className="w-full bg-gray-900/90 border border-green-500/30 rounded-lg backdrop-blur-sm p-4 flex items-center justify-center min-h-[200px]">
    <div className="text-center">
      <Icon name="loading" className="w-6 h-6 animate-spin text-green-400 mx-auto mb-2" />
      <div className="text-green-300 text-xs font-mono">Loading metrics...</div>
    </div>
  </div>
);
