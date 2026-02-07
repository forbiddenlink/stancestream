// src/App.jsx
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL); // Log env variable
import { useState, useEffect, Suspense, lazy } from 'react';
import Header from './components/Header';
import DebatePanel from './components/DebatePanel';
import FactChecker from './components/FactChecker';
import EnhancedControls from './components/EnhancedControls';
// Import loading states
import { DashboardLoader, ChartLoader, PanelLoader, ModalLoader, OverlayLoader } from './components/LoadingStates';

// Lazy-loaded components
const EnhancedPerformanceDashboard = lazy(() => import('./components/EnhancedPerformanceDashboard'));
const TrueMultiDebateViewer = lazy(() => import('./components/TrueMultiDebateViewer'));
const StanceEvolutionChart = lazy(() => import('./components/StanceEvolutionChart'));
const KeyMomentsPanel = lazy(() => import('./components/KeyMomentsPanel'));
const BusinessValueDashboard = lazy(() => import('./components/BusinessValueDashboard'));
const PlatformShowcaseDashboard = lazy(() => import('./components/PlatformShowcaseDashboard'));
const LivePerformanceOverlay = lazy(() => import('./components/LivePerformanceOverlay'));
const RedisMatrixModal = lazy(() => import('./components/RedisMatrixModal'));
const IntroModule = lazy(() => import('./components/IntroModule'));
import ErrorBoundary from './components/ErrorBoundary';
import Icon from './components/Icon';
import { ViewModeSelector, ToastProvider, useNotification, Container, Stack, Grid } from './components/ui';
import wsManager from './services/websocketManager';
import api from './services/api';

export default function App() {
  const [debateMessages, setDebateMessages] = useState([]);
  const [agents, setAgents] = useState({});
  const [factChecks, setFactChecks] = useState([]);
  const [connectionHealth, setConnectionHealth] = useState('checking');
  const [viewMode, setViewMode] = useState('standard'); // 'standard', 'multi-debate', 'analytics', 'business', or 'showcase'
  const [metricsUpdateTrigger, setMetricsUpdateTrigger] = useState(0);
  const [activeDebates, setActiveDebates] = useState(new Map()); // Track multiple debates
  const [currentDebateId, setCurrentDebateId] = useState(null); // Track current single debate
  const [stanceData, setStanceData] = useState([]); // Track stance evolution for chart
  const [currentStances, setCurrentStances] = useState({ senatorbot: 0, reformerbot: 0 }); // Track current stance values
  const [showMatrixModal, setShowMatrixModal] = useState(false); // Matrix modal state
  const [showIntro, setShowIntro] = useState(false); // Intro module state
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');

  // WebSocket connection using centralized manager
  useEffect(() => {
    // Use deployed backend URL for WebSocket (with wss:// for HTTPS)
    const wsUrl = import.meta.env.VITE_API_URL 
      ? `wss://${new URL(import.meta.env.VITE_API_URL).host}`
      : `ws://${window.location.hostname}:3001`;

    const handleIncomingMessage = (data) => {
      const message = typeof data === 'string' ? JSON.parse(data) : data;

      // Dispatch to LivePerformanceOverlay for visualization
      if (['cache_hit', 'metrics_updated', 'live_performance_update'].includes(message.type)) {
        window.dispatchEvent(new CustomEvent('metrics-update', { 
          detail: message
        }));
        return;
      }

      // Process other messages for app state
      handleWebSocketMessage(message);
    };

    // Set up event listeners
    const cleanup = [
      wsManager.addEventListener('connected', () => {
        setConnectionStatus('Connected');
        setConnectionHealth('healthy');
      }),
      
      wsManager.addEventListener('disconnected', () => {
        setConnectionStatus('Disconnected');
        setConnectionHealth('unhealthy');
      }),
      
      wsManager.addEventListener('error', () => {
        setConnectionStatus('Error');
        setConnectionHealth('error');
      }),
      
      wsManager.addEventListener('message', handleIncomingMessage)
    ];

    // Connect to WebSocket
    wsManager.connect(wsUrl);

    // Cleanup on unmount
    return () => {
      cleanup.forEach(fn => fn());
    };
  }, []);

  // Check for first-time user and show intro
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('stancestream-intro-seen');
    // Set showIntro to true by default for first-time users
    setShowIntro(hasSeenIntro !== 'true');
  }, []);

  // Set initial state on component mount
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('stancestream-intro-seen');
    if (!hasSeenIntro) {
      localStorage.setItem('stancestream-intro-seen', 'false');
      setShowIntro(true);
    }
  }, []);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (data) => {
    const { type, ...messageData } = data;

    switch (type) {
      case 'new_message':
        const newMessage = {
          id: Date.now(),
          sender: messageData.agentName,
          agentId: messageData.agentId,
          text: messageData.message,
          timestamp: messageData.timestamp,
          debateId: messageData.debateId,
          factCheck: messageData.factCheck,
          sentiment: messageData.sentiment
        };

        // Keep last 100 messages to prevent memory issues
        setDebateMessages(prev => {
            const messages = [...prev, newMessage];
            return messages.slice(-100); // FIFO with 100 message cap
        });

        // Extract stance data from new_message and create stance update
        if (messageData.stance && messageData.agentId && messageData.debateId) {
          console.log('📊 Extracting stance from new_message:', messageData.stance);

          // Update current stances state
          setCurrentStances(prev => {
            const updated = {
              ...prev,
              [messageData.agentId]: (messageData.stance.value - 0.5) * 2 // Convert 0-1 to -1 to 1
            };

            // Create new stance entry with both agents' current values
            const newStanceEntry = {
              timestamp: messageData.timestamp,
              turn: Date.now(), // Use timestamp as unique turn identifier
              debateId: messageData.debateId,
              topic: messageData.stance.topic,
              senatorbot: updated.senatorbot,
              reformerbot: updated.reformerbot
            };

            console.log('📊 Created stance entry from message:', newStanceEntry);

            // Add to stance data with memory management
            setStanceData(prev => {
              // Filter to current debate in standard mode
              if (viewMode === 'standard' && currentDebateId) {
                return [...prev.filter(entry => entry.debateId === currentDebateId), newStanceEntry];
              }
              // In multi-debate mode, keep last 100 entries to prevent memory bloat
              return [...prev, newStanceEntry].slice(-100);
            });

            return updated;
          });
        }

        // Track active debates
        if (messageData.debateId) {
          setActiveDebates(prev => {
            const updated = new Map(prev);
            const existing = updated.get(messageData.debateId) || {
              topic: 'Unknown Topic',
              messageCount: 0,
              startTime: new Date().toISOString()
            };
            existing.messageCount = (existing.messageCount || 0) + 1;
            existing.lastActivity = messageData.timestamp;
            updated.set(messageData.debateId, existing);
            return updated;
          });
        }

        if (messageData.factCheck) {
          setFactChecks(prev => [...prev.slice(-4), {
            id: Date.now(),
            message: messageData.message,
            fact: messageData.factCheck.fact,
            score: messageData.factCheck.score,
            timestamp: messageData.timestamp,
            debateId: messageData.debateId
          }]);
        }
        break;

      case 'debate_started':
        // Track the new debate with proper topic info
        if (messageData.debateId && messageData.topic) {
          setActiveDebates(prev => {
            const updated = new Map(prev);
            updated.set(messageData.debateId, {
              topic: messageData.topic,
              agents: messageData.agents,
              startTime: messageData.timestamp,
              messageCount: 0,
              status: 'running'
            });
            return updated;
          });

          // If this is a single debate (standard mode), set it as current and clear stance data
          if (viewMode === 'standard') {
            setCurrentDebateId(messageData.debateId);
            setStanceData([]); // Clear previous stance data for new debate
            setCurrentStances({ senatorbot: 0, reformerbot: 0 }); // Reset current stances
          }
        }
        break;

      case 'debate_stopped':
        if (messageData.debateId) {
          setActiveDebates(prev => {
            const updated = new Map(prev);
            updated.delete(messageData.debateId);
            return updated;
          });

          // Don't clear currentDebateId immediately to keep messages visible
          // The user can manually start a new debate or switch modes
          console.log(`⏹️ Debate ${messageData.debateId} stopped - messages remain visible`);
        }
        break;

      case 'all_debates_stopped':
        // Handle stopping all debates at once
        console.log('🛑 All debates stopped');
        setActiveDebates(new Map());
        // Keep messages visible for review
        break;

      case 'debate_ended':
        if (messageData.debateId) {
          setActiveDebates(prev => {
            const updated = new Map(prev);
            updated.delete(messageData.debateId);
            return updated;
          });

          // Don't clear currentDebateId immediately to keep messages visible
          // The completed debate messages should remain visible
          console.log(`🏁 Debate ${messageData.debateId} ended - messages remain visible`);
        }
        break;

      case 'stance_update':
        // Handle dedicated stance updates
        if (messageData.agentId && messageData.stance && messageData.debateId) {
          console.log('📊 Dedicated stance update:', messageData);

          // Dispatch custom event for LivePerformanceOverlay
          window.dispatchEvent(new CustomEvent('websocket-message', {
            detail: { type: 'stance_update', ...messageData }
          }));

          // Update current stances
          setCurrentStances(prev => {
            const updated = {
              ...prev,
              [messageData.agentId]: (messageData.stance.value - 0.5) * 2 // Convert 0-1 to -1 to 1
            };

            // Create new stance entry with both agents' current values
            const newStanceEntry = {
              timestamp: messageData.timestamp || new Date().toISOString(),
              turn: Date.now(),
              debateId: messageData.debateId,
              topic: messageData.stance.topic || 'Unknown Topic',
              senatorbot: updated.senatorbot || 0,
              reformerbot: updated.reformerbot || 0
            };

            console.log('📊 New stance entry:', newStanceEntry); // Debug log

            setStanceData(prev => {
              if (viewMode === 'standard' && currentDebateId) {
                const filtered = [...prev.filter(entry => entry.debateId === currentDebateId), newStanceEntry];
                console.log('📊 Filtered stance data for current debate:', filtered);
                return filtered;
              }
              const updated = [...prev, newStanceEntry].slice(-100);
              console.log('📊 Updated stance data (all debates):', updated);
              return updated;
            });

            return updated;
          });
        }
        break;

      case 'error':
        console.error('WebSocket error:', messageData.message);
        break;

      case 'fact_check':
        // Handle fact check results
        console.log('🔍 Fact check result:', messageData);

        // Dispatch custom event for LivePerformanceOverlay
        window.dispatchEvent(new CustomEvent('websocket-message', {
          detail: { type: 'fact_check', ...messageData }
        }));
        break;

      case 'cache_hit':
        // Handle cache hit events
        console.log('💾 Cache hit event:', messageData);
        // Dispatch custom event for LivePerformanceOverlay
        window.dispatchEvent(new CustomEvent('websocket-message', {
          detail: { type: 'cache_hit', ...messageData }
        }));
        break;

        case 'multi_debates_started':
          // Visual feedback for multiple debates started
          console.log(`🚀 Multi-debate session started: ${messageData.debates.length} debates`);
          break;

        case 'metrics_updated':
          // Trigger metrics refresh in dashboard
          setMetricsUpdateTrigger(prev => prev + 1);
          
          // Dispatch custom event for LivePerformanceOverlay
          window.dispatchEvent(new CustomEvent('websocket-message', {
            detail: { type: 'metrics_updated', ...messageData }
          }));
          break;

        case 'agent_updated':
          setAgents(prev => ({
            ...prev,
            [messageData.agentId]: messageData.profile
          }));
          break;

        case 'debate:stance_update':
          // Handle real-time stance evolution for election-night style chart
          console.log('📊 Received stance update:', messageData); // Debug log

          // Prevent duplicate stance updates by checking if we already have this turn data
          const isDuplicate = stanceData.some(entry =>
            entry.debateId === messageData.debateId &&
            entry.turn === messageData.turn &&
            entry.timestamp === messageData.timestamp
          );

          if (isDuplicate) {
            console.log('⚠️ Duplicate stance update detected, skipping...');
            break;
          }

          const newStanceEntry = {
            senatorbot: messageData.senatorbot,
            reformerbot: messageData.reformerbot,
            timestamp: messageData.timestamp,
            turn: messageData.turn,
            debateId: messageData.debateId,
            topic: messageData.topic
          };

          setStanceData(prev => {
            console.log('📊 Previous stance data:', prev); // Debug log
            console.log('📊 New stance entry:', newStanceEntry); // Debug log
            // Filter to current debate in standard mode, keep all in multi-debate mode
            if (viewMode === 'standard' && currentDebateId) {
              const filtered = [...prev.filter(entry => entry.debateId === currentDebateId), newStanceEntry];
              console.log('📊 Filtered stance data:', filtered); // Debug log
              return filtered;
            }
            // In multi-debate mode, keep last 100 entries to prevent memory issues
            const updated = [...prev, newStanceEntry].slice(-100);
            console.log('📊 Updated stance data:', updated); // Debug log
            return updated;
          });

          console.log(`📊 Stance update: SenatorBot(${messageData.senatorbot.toFixed(2)}), ReformerBot(${messageData.reformerbot.toFixed(2)}) - Turn ${messageData.turn}`);
          break;

        case 'key_moment_created':
          // Handle new key moment creation
          console.log('🔍 Key moment created:', messageData.moment);

          // Dispatch custom event for KeyMomentsPanel to listen to
          window.dispatchEvent(new CustomEvent('websocket-message', {
            detail: { type: 'key_moment_created', ...messageData }
          }));
          break;

        case 'live_performance_update':
          // Handle live performance metrics for mission control overlay
          console.log('⚡ Live performance update:', messageData.metrics);

          // Dispatch custom event for LivePerformanceOverlay
          window.dispatchEvent(new CustomEvent('websocket-message', {
            detail: { type: 'live_performance_update', ...messageData }
          }));
          break;
      }
  };

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.getHealth();
        setConnectionHealth('healthy');
      } catch (error) {
        setConnectionHealth('error');
        console.error('Backend health check failed:', error);
      }
    };

    checkHealth();
  }, []);

  // Helper function to trigger metrics updates
  const handleMetricsUpdate = () => {
    setMetricsUpdateTrigger(prev => prev + 1);
  };

  // Helper function to stop current debate
  const handleStopCurrentDebate = async () => {
    if (currentDebateId) {
      try {
        console.log(`🛑 Attempting to stop debate: ${currentDebateId}`);
        await api.stopDebate(currentDebateId);

        // Update activeDebates state to reflect stopped status
        setActiveDebates(prev => {
          const updated = new Map(prev);
          updated.delete(currentDebateId);
          return updated;
        });

        // Keep the messages visible but stop generating new ones
        console.log(`✅ Successfully stopped debate ${currentDebateId} - messages remain visible`);

      } catch (error) {
        console.error('❌ Failed to stop current debate:', error);
        // Force update the UI state even if API call failed
        setActiveDebates(prev => {
          const updated = new Map(prev);
          updated.delete(currentDebateId);
          return updated;
        });
      }
    } else {
      console.warn('⚠️ No current debate ID to stop');
    }
  };

  // Get messages for current view mode
  const getFilteredMessages = () => {
    if (viewMode === 'standard') {
      if (currentDebateId) {
        // Show messages from the current active debate
        return debateMessages.filter(msg => msg.debateId === currentDebateId);
      } else {
        // If no current debate but we have messages, show the most recent debate's messages
        // This prevents messages from disappearing when a debate ends
        if (debateMessages.length > 0) {
          const latestDebateId = debateMessages[debateMessages.length - 1].debateId;
          return debateMessages.filter(msg => msg.debateId === latestDebateId);
        }
        return debateMessages; // Show all messages if no debate ID filtering is possible
      }
    } else if (viewMode === 'multi-debate') {
      // In multi-debate mode, show all messages
      return debateMessages;
    }
    return [];
  };

  return (
    <ToastProvider>
      <ErrorBoundary componentName="StanceStream Main Application">
        <div className="min-h-screen bg-black text-green-300 flex flex-col animate-fade-in-up overflow-x-hidden font-mono">
        {/* Matrix Rain Background Effect */}
        <div className="fixed inset-0 opacity-5 pointer-events-none z-0">
          <div className="matrix-rain"></div>
        </div>

        <Header 
          connectionStatus={connectionStatus} 
          backendHealth={connectionHealth} 
          onShowIntro={() => {
            console.log('Opening intro module...');
            localStorage.removeItem('stancestream-intro-seen');
            setShowIntro(true);
          }}
        />

        {/* Enhanced Controls Bar - Matrix Style */}
        <div className="flex-shrink-0 border-b border-green-500/30 bg-gradient-to-r from-black/95 to-gray-900/95 backdrop-blur-md overflow-x-hidden relative z-10">
          <Container maxWidth="max-w-7xl" padding="px-2 sm:px-4 py-3">
            <Stack spacing="space-y-4">
              {/* Top Row: Enhanced Controls - Full Width */}
              <div className="w-full animate-slide-in-left">
                <EnhancedControls
                  viewMode={viewMode}
                  activeDebates={activeDebates}
                  currentDebateId={currentDebateId}
                  debateMessages={debateMessages}
                  isDebating={currentDebateId && activeDebates.has(currentDebateId)}
                  onMetricsUpdate={handleMetricsUpdate}
                  onStopCurrentDebate={handleStopCurrentDebate}
                  onClearConversation={() => {
                    setDebateMessages([]);
                    setCurrentDebateId(null);
                    console.log('🧹 Conversation cleared from Enhanced Controls');
                  }}
                  onDebateStarted={(debateId) => {
                    if (viewMode === 'standard') {
                      // Clear previous messages when starting a new debate
                      setDebateMessages([]);
                      setCurrentDebateId(debateId);
                      console.log(`🚀 Started new debate ${debateId} - cleared previous messages`);
                    }
                  }}
                />
              </div>

              {/* Bottom Row: Mode Toggle + Enhanced Quick Stats */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                {/* Left: Enhanced Quick Stats with System Health - Matrix Style */}
                <div className="flex items-center gap-3 flex-1 w-full lg:w-auto overflow-hidden">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="text-center px-3 py-2 bg-blue-500/10 rounded-lg border border-blue-500/30 flex-shrink-0">
                      <div className="text-lg font-bold text-blue-400 font-mono">{activeDebates.size}</div>
                      <div className="text-xs text-gray-400">Sessions</div>
                    </div>
                    <div className="text-center px-3 py-2 bg-green-500/10 rounded-lg border border-green-500/30 flex-shrink-0">
                      <div className="text-lg font-bold text-green-400 font-mono">{debateMessages.length}</div>
                      <div className="text-xs text-gray-400">Messages</div>
                    </div>
                    <div className="text-center px-3 py-2 bg-purple-500/10 rounded-lg border border-purple-500/30 flex-shrink-0">
                      <div className="text-lg font-bold text-purple-400 font-mono">{factChecks.length}</div>
                      <div className="text-xs text-gray-400">Facts</div>
                    </div>
                    {/* System Health Indicator - Matrix Style */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-900/50 rounded-lg border border-green-500/30 flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${connectionStatus === 'Connected' && connectionHealth === 'healthy'
                        ? 'bg-green-400 animate-pulse'
                        : 'bg-red-400'
                        }`}></div>
                      <span className="text-xs text-green-300 whitespace-nowrap font-mono">
                        {connectionStatus === 'Connected' && connectionHealth === 'healthy' ? 'ONLINE' : 'ERROR'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Matrix Style Mode Selector */}
                <div className="flex-shrink-0 w-full lg:w-auto mt-2 lg:mt-0">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setViewMode('standard')}
                      className={`px-4 py-2 text-sm rounded-lg border transition-all duration-200 hover:scale-105 font-mono ${viewMode === 'standard'
                          ? 'bg-blue-600/30 border-blue-500/30 text-blue-300 shadow-lg shadow-blue-500/20'
                          : 'bg-gray-900/50 border-green-500/30 text-green-300 hover:bg-blue-600/20 hover:border-blue-500/30'
                        }`}
                    >
                      STANDARD
                    </button>
                    <button
                      onClick={() => setViewMode('multi-debate')}
                      className={`px-4 py-2 text-sm rounded-lg border transition-all duration-200 hover:scale-105 font-mono ${viewMode === 'multi-debate'
                          ? 'bg-purple-600/30 border-purple-500/30 text-purple-300 shadow-lg shadow-purple-500/20'
                          : 'bg-gray-900/50 border-green-500/30 text-green-300 hover:bg-purple-600/20 hover:border-purple-500/30'
                        }`}
                    >
                      MULTI-DEBATE
                    </button>
                    <button
                      onClick={() => setViewMode('analytics')}
                      className={`px-4 py-2 text-sm rounded-lg border transition-all duration-200 hover:scale-105 font-mono ${viewMode === 'analytics'
                          ? 'bg-green-600/30 border-green-500/30 text-green-300 shadow-lg shadow-green-500/20'
                          : 'bg-gray-900/50 border-green-500/30 text-green-300 hover:bg-green-600/20 hover:border-green-500/30'
                        }`}
                    >
                      ANALYTICS
                    </button>
                    <button
                      onClick={() => setViewMode('business')}
                      className={`px-4 py-2 text-sm rounded-lg border transition-all duration-200 hover:scale-105 font-mono ${viewMode === 'business'
                          ? 'bg-emerald-600/30 border-emerald-500/30 text-emerald-300 shadow-lg shadow-emerald-500/20'
                          : 'bg-gray-900/50 border-green-500/30 text-green-300 hover:bg-emerald-600/20 hover:border-emerald-500/30'
                        }`}
                    >
                      BUSINESS
                    </button>
                    <button
                      onClick={() => setViewMode('platform-showcase')}
                      className={`px-4 py-2 text-sm rounded-lg border transition-all duration-200 hover:scale-105 font-mono ${viewMode === 'platform-showcase'
                                                  ? 'bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-500/30 text-green-300 shadow-lg shadow-green-500/20'
                        : 'bg-gray-900/50 border-green-500/30 text-green-300 hover:bg-gradient-to-r hover:from-green-600/20 hover:to-emerald-600/20 hover:border-green-500/30'
                        }`}
                    >
                      PLATFORM
                    </button>
                    <button
                      onClick={() => setShowMatrixModal(true)}
                      className="px-4 py-2 text-sm rounded-lg border bg-gradient-to-r from-black/70 to-green-900/70 border-green-500/30 text-green-300 hover:from-black/90 hover:to-green-900/90 transition-all duration-200 hover:scale-105 shadow-lg shadow-green-500/20 font-mono"
                      title="Redis Operations Matrix - Live visualization of all 4 modules"
                    >
                      <Icon name="activity" className="w-4 h-4 inline mr-1" />
                      MATRIX
                    </button>
                    <button
                      onClick={() => setShowIntro(true)}
                      className="px-4 py-2 text-sm rounded-lg border bg-gradient-to-r from-blue-700/70 to-purple-900/70 border-blue-500/30 text-blue-300 hover:from-blue-600/90 hover:to-purple-800/90 transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/20 font-mono"
                      title="Platform Introduction & Feature Tour"
                    >
                      <Icon name="help-circle" className="w-4 h-4 inline mr-1" />
                      INTRO
                    </button>
                  </div>
                </div>
              </div>
            </Stack>
          </Container>
        </div>

        {/* Dynamic Main Content Based on View Mode */}
        <main className="flex-1 overflow-x-hidden relative z-10">
          <Container maxWidth="max-w-7xl" padding="px-2 sm:px-4 py-4" className="h-full">
            {viewMode === 'standard' ? (
              /* Standard Single-Debate Layout - Matrix Style */
              <div className="flex flex-col gap-4 h-full pb-32 animate-fade-in-up">
                {/* Main content row: 2-column layout with Matrix styling */}
                <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
                  {/* Left Column: Debate Panel (70% width) - Matrix Style */}
                  <div className="flex-1 lg:flex-[7] min-w-0 min-h-[500px] bg-gray-900/90 border border-green-500/30 rounded-lg backdrop-blur-sm">
                    <DebatePanel messages={getFilteredMessages()} />
                  </div>

                  {/* Right Column: Semantic Cache Engine + Key Moments + Fact Checker (30% width) */}
                  <div className="w-full lg:w-[30%] lg:flex-[3] flex-shrink-0 min-h-[800px] flex flex-col">
                    {/* Semantic Cache Engine - Business Value Showcase */}
                    <div className="flex-shrink-0 mb-4 animate-slide-in-right stagger-1">
                      <Suspense fallback={<OverlayLoader />}>
                        <LivePerformanceOverlay 
                          position="embedded" 
                          size="small"
                          className="relative w-full"
                        />
                      </Suspense>
                    </div>

                    {/* Key Moments - Matrix Style */}
                    <div className="flex-1 mb-4 min-h-[400px] max-h-[500px] animate-slide-in-right stagger-2">
                      <Suspense fallback={<PanelLoader />}>
                        <KeyMomentsPanel debateId={currentDebateId} viewMode="standard" />
                      </Suspense>
                    </div>

                    {/* Fact Checker - Matrix Style */}
                    <div className="flex-1 min-h-[300px] max-h-[350px] animate-slide-in-right stagger-3">
                      <FactChecker factChecks={factChecks.filter(fc => !currentDebateId || fc.debateId === currentDebateId)} />
                    </div>
                  </div>
                </div>

                {/* Bottom row: Stance Evolution Chart - Matrix Style */}
                <div className="h-96 flex-shrink-0 mt-6 animate-fade-in-up stagger-3 bg-gray-900/90 border border-green-500/30 rounded-lg backdrop-blur-sm p-4">
                  <StanceEvolutionChart
                    stanceData={currentDebateId ?
                      stanceData.filter(entry => entry.debateId === currentDebateId) :
                      stanceData
                    }
                  />
                </div>
              </div>
            ) : viewMode === 'multi-debate' ? (
              /* Multi-Debate Layout - Matrix Style */
              <div className="space-y-6 p-6 pb-32">
                {/* Top row: Key Moments - Matrix Container */}
                <div className="min-h-[400px] bg-gray-900/90 border border-green-500/30 rounded-lg backdrop-blur-sm p-4">
                  <KeyMomentsPanel viewMode="multi-debate" />
                </div>

                {/* Middle row: Multi-debate viewer and fact checker - Matrix Containers */}
                <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6">
                  {/* Main: Multi-Debate Viewer - Matrix Container */}
                  <div className="flex-1 lg:flex-[7] min-h-[600px] bg-gray-900/90 border border-green-500/30 rounded-lg backdrop-blur-sm p-4 animate-slide-in-left">
                    <TrueMultiDebateViewer
                      messages={debateMessages}
                      activeDebates={activeDebates}
                      onMetricsUpdate={handleMetricsUpdate}
                    />
                  </div>

                  {/* Side Panel: Fact Checker - Matrix Container */}
                  <div className="w-full lg:w-[450px] lg:flex-[3] min-h-[600px] bg-gray-900/90 border border-green-500/30 rounded-lg backdrop-blur-sm p-4 animate-slide-in-right">
                    <FactChecker factChecks={factChecks} />
                  </div>
                </div>

                {/* Bottom row: Stance Evolution Chart - Matrix Container */}
                <div className="h-96 bg-gray-900/90 border border-green-500/30 rounded-lg backdrop-blur-sm p-4">
                  <StanceEvolutionChart stanceData={stanceData} />
                </div>
              </div>
            ) : viewMode === 'platform-showcase' ? (
              /* Platform Showcase - Premium Full Screen Experience */
              <div className="animate-fade-in-up">
                <PlatformShowcaseDashboard />
              </div>
            ) : viewMode === 'business' ? (
              /* Business Intelligence Dashboard */
              <div className="space-y-6">
                <BusinessValueDashboard />
              </div>
            ) : (
              /* Analytics Dashboard Layout - Matrix Style */
              <Stack spacing="space-y-6" className="animate-fade-in-up">
                {/* Top Row: Key Moments Analytics - Matrix Style */}
                <div className="w-full animate-slide-in-down stagger-1 bg-gray-900/90 border border-green-500/30 rounded-lg backdrop-blur-sm p-4">
                  <KeyMomentsPanel viewMode="analytics" />
                </div>

                {/* Middle Row: Performance Dashboard - Matrix Style */}
                <div className="w-full animate-scale-in stagger-2 bg-gray-900/90 border border-green-500/30 rounded-lg backdrop-blur-sm p-4">
                  <EnhancedPerformanceDashboard key={metricsUpdateTrigger} />
                </div>

                {/* Bottom Row: Quick Actions and Stats - Matrix Grid */}
                <Grid columns={2} gap="gap-6" className="animate-fade-in-up stagger-3">
                  {/* Quick Actions - Matrix Style */}
                  <div className="bg-gray-900/90 border border-green-500/30 rounded-lg backdrop-blur-sm p-4">
                    <h3 className="text-lg font-semibold text-green-300 flex items-center gap-2 mb-4 font-mono">
                      <Icon name="analytics" size={20} className="text-blue-400" />
                      QUICK ACTIONS
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setViewMode('multi-debate')}
                        className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-sm text-purple-300 transition-colors font-mono"
                      >
                        <Icon name="multi-debate" size={16} className="mr-1" />
                        MULTI-DEBATE
                      </button>
                      <button
                        onClick={() => setViewMode('standard')}
                        className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-sm text-blue-300 transition-colors font-mono"
                      >
                        <Icon name="target" size={16} className="mr-1" />
                        STANDARD
                      </button>
                      <button
                        onClick={handleMetricsUpdate}
                        className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg text-sm text-green-300 transition-colors font-mono"
                      >
                        <Icon name="refresh" size={16} className="mr-1" />
                        REFRESH
                      </button>
                    </div>
                  </div>

                  {/* Live Stats - Matrix Style */}
                  <div className="bg-gray-900/90 border border-green-500/30 rounded-lg backdrop-blur-sm p-4">
                    <h3 className="text-lg font-semibold text-green-300 flex items-center gap-2 mb-4 font-mono">
                      <Icon name="bar-chart" size={20} className="text-green-400" />
                      LIVE STATISTICS
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400 font-mono">{activeDebates.size}</div>
                        <div className="text-xs text-gray-400">Active Debates</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400 font-mono">{debateMessages.length}</div>
                        <div className="text-xs text-gray-400">Total Messages</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400 font-mono">{factChecks.length}</div>
                        <div className="text-xs text-gray-400">Fact Checks</div>
                      </div>
                    </div>
                  </div>
                </Grid>
              </Stack>
            )}
          </Container>
        </main>

        <footer className="relative z-10 border-t border-green-500/30 bg-gray-900/95 px-4 py-4 text-sm text-green-200">
          <Container maxWidth="max-w-7xl" padding="px-2 sm:px-4">
            <div className="flex flex-wrap items-center gap-4">
              <a className="hover:text-green-100 underline" href="/about/">
                About
              </a>
              <a className="hover:text-green-100 underline" href="/contact/">
                Contact
              </a>
              <a className="hover:text-green-100 underline" href="/privacy-policy/">
                Privacy Policy
              </a>
              <a
                className="hover:text-green-100 underline"
                href="https://docs.squirrelscan.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Audit Docs
              </a>
            </div>
          </Container>
        </footer>

        {/* Redis Matrix Modal */}
        <RedisMatrixModal 
          isOpen={showMatrixModal} 
          onClose={() => setShowMatrixModal(false)} 
        />

        {/* Intro Module */}
        <IntroModule 
          showIntro={showIntro}
          onComplete={() => {
            setShowIntro(false);
            localStorage.setItem('stancestream-intro-seen', 'true');
          }}
        />
        </div>
      </ErrorBoundary>
    </ToastProvider>
  );
}
