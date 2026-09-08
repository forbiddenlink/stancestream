// Loading States Component - Professional loading indicators
import { Stack } from './ui/Layout';
import { Card, CardContent } from './ui/Card';
import Icon from './Icon';

export const DashboardLoader = () => (
  <div className="w-full h-full min-h-[400px] bg-gray-900/90 border border-green-500/30 rounded-lg backdrop-blur-sm p-6 flex items-center justify-center">
    <div className="text-center">
      <Icon name="loading" className="w-8 h-8 animate-spin text-green-400 mx-auto mb-4" />
      <div className="text-green-300 text-sm font-mono">LOADING DASHBOARD...</div>
    </div>
  </div>
);

export const ChartLoader = () => (
  <div className="w-full h-96 bg-gray-900/90 border border-green-500/30 rounded-lg backdrop-blur-sm p-6 flex items-center justify-center">
    <div className="text-center">
      <Icon name="loading" className="w-8 h-8 animate-spin text-green-400 mx-auto mb-4" />
      <div className="text-green-300 text-sm font-mono">LOADING CHART...</div>
    </div>
  </div>
);

export const PanelLoader = () => (
  <div className="w-full min-h-[300px] bg-gray-900/90 border border-green-500/30 rounded-lg backdrop-blur-sm p-6 flex items-center justify-center">
    <div className="text-center">
      <Icon name="loading" className="w-8 h-8 animate-spin text-green-400 mx-auto mb-4" />
      <div className="text-green-300 text-sm font-mono">LOADING...</div>
    </div>
  </div>
);

export const ModalLoader = () => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
    <div className="text-center">
      <Icon name="loading" className="w-12 h-12 animate-spin text-green-400 mx-auto mb-4" />
      <div className="text-green-300 text-sm font-mono">LOADING MATRIX...</div>
    </div>
  </div>
);

export const OverlayLoader = () => (
  <div className="w-full bg-gray-900/90 border border-green-500/30 rounded-lg backdrop-blur-sm p-4 flex items-center justify-center min-h-[200px]">
    <div className="text-center">
      <Icon name="loading" className="w-6 h-6 animate-spin text-green-400 mx-auto mb-2" />
      <div className="text-green-300 text-xs font-mono">LOADING METRICS...</div>
    </div>
  </div>
);

export const LoadingSpinner = ({ size = 16, text = "Loading..." }) => (
    <div className="flex items-center justify-center gap-2 text-green-400 animate-fade-in-up">
        <Icon name="loading" size={size} className="animate-spin" />
        <span className="text-sm">{text}</span>
    </div>
);

// Enhanced Page Loading Component
export const PageLoader = ({ title = "Loading StanceStream..." }) => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center animate-fade-in-up">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-green-500 via-emerald-600 to-green-700 rounded-xl flex items-center justify-center animate-pulse-gentle">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
            <p className="text-slate-400">Initializing AI debate system...</p>
        </div>
    </div>
);

export const LoadingSkeleton = ({ className = "", lines = 3 }) => (
    <div className={`space-y-3 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className="animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-full"></div>
            </div>
        ))}
    </div>
);

export const LoadingCard = ({ title = "Loading...", description = "Please wait while we fetch the data" }) => (
    <div className="bg-gradient-to-br from-slate-900/50 to-gray-900/50 backdrop-blur-sm border border-slate-600/30 rounded-xl p-6">
        <div className="flex items-center justify-center h-40 flex-col gap-4">
            <LoadingSpinner size={24} text="" />
            <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400">{description}</p>
            </div>
        </div>
    </div>
);

export const LoadingOverlay = ({ isVisible, text = "Processing..." }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in-up">
            <div className="bg-slate-800 border border-slate-600 rounded-xl p-8 flex items-center gap-4 animate-scale-in">
                <Icon name="loading" size={24} className="animate-spin text-green-400" />
                <span className="text-white font-medium">{text}</span>
            </div>
        </div>
    );
};

// Message Loading Component
export const MessageLoader = ({ count = 3 }) => (
    <Stack spacing="space-y-4" className="animate-fade-in-up">
        {Array.from({ length: count }).map((_, index) => (
            <Card key={index} className={`animate-shimmer stagger-${Math.min(index + 1, 5)}`}>
                <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                        <div aria-hidden="true" className="animate-pulse bg-neutral-700 w-8 h-8 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <div aria-hidden="true" className="animate-pulse bg-neutral-700 h-4 w-1/4" />
                            <div aria-hidden="true" className="animate-pulse bg-neutral-700 h-3 w-full" />
                            <div aria-hidden="true" className="animate-pulse bg-neutral-700 h-3 w-3/4" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        ))}
    </Stack>
);

// Typing Indicator
export const TypingIndicator = ({ agent = "AI" }) => (
    <div className="flex items-center space-x-2 animate-fade-in-up">
        <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <span className="text-sm text-slate-400">{agent} is typing...</span>
    </div>
);

export default {
    Spinner: LoadingSpinner,
    Skeleton: LoadingSkeleton,
    Card: LoadingCard,
    Overlay: LoadingOverlay,
    PageLoader,
    MessageLoader,
    TypingIndicator
};
