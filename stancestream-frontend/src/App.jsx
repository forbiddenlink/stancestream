import { useState, useEffect, useLayoutEffect, useRef, Suspense, lazy } from 'react';
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
import { ToastProvider } from './components/ui';
import wsManager from './services/websocketManager';
import api from './services/api';
import { getWebSocketUrl } from './utils/url';
import { connectionSentence, messageFromEvent } from './utils/record';
import './pages/arena.css';

export default function App() {
  const [debateMessages, setDebateMessages] = useState([]);
  const [_agents, setAgents] = useState({});
  const [factChecks, setFactChecks] = useState([]);
  const [connectionHealth, setConnectionHealth] = useState('checking');
  const [viewMode, setViewMode] = useState('standard'); // 'standard', 'multi-debate', 'analytics', 'business', or 'showcase'
  const [metricsUpdateTrigger, setMetricsUpdateTrigger] = useState(0);
  const [activeDebates, setActiveDebates] = useState(new Map()); // Track multiple debates
  const [currentDebateId, setCurrentDebateId] = useState(null); // Track current single debate
  const [stanceData, setStanceData] = useState([]); // Track stance evolution for chart
  const [_currentStances, setCurrentStances] = useState({ senatorbot: 0, reformerbot: 0 }); // Track current stance values
  const [showMatrixModal, setShowMatrixModal] = useState(false); // Matrix modal state
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return localStorage.getItem('stancestream-intro-seen') !== 'true';
    } catch {
      return true;
    }
  }); // Intro module state
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [roundMeta, setRoundMeta] = useState(null); // { round, totalRounds } from debate:stance_update metadata
  const messageSeq = useRef(0);
  const webSocketMessageHandlerRef = useRef(() => {});

  // WebSocket connection using centralized manager
  useEffect(() => {
    const wsUrl = getWebSocketUrl();

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
      webSocketMessageHandlerRef.current(message);
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
      wsManager.disconnect({ clearListeners: false });
    };
  }, []);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (data) => {
    const { type, ...messageData } = data;

    switch (type) {
      case 'new_message': {
        // Raw 0..1 stance is kept on the message; the record reads this, not the -1..1 chart state.
        const newMessage = messageFromEvent(messageData, `${Date.now()}-${messageSeq.current++}`);

        // Keep last 100 messages to prevent memory issues
        setDebateMessages(prev => {
            const messages = [...prev, newMessage];
            return messages.slice(-100); // FIFO with 100 message cap
        });

        // Keep the -1..1 current stances for the chart state. The chart's points come from
        // debate:stance_update (both bots' values each turn), so new_message does not add a
        // second point per turn.
        if (messageData.stance && messageData.agentId && messageData.debateId) {
          setCurrentStances(prev => ({
            ...prev,
            [messageData.agentId]: (messageData.stance.value - 0.5) * 2 // Convert 0-1 to -1 to 1
          }));
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
      }

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
            setRoundMeta(null);
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

        case 'debate:stance_update': {
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

          if (messageData.metadata?.round) {
            setRoundMeta({ round: messageData.metadata.round, totalRounds: messageData.metadata.totalRounds });
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
        }

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
  useLayoutEffect(() => {
    webSocketMessageHandlerRef.current = handleWebSocketMessage;
  });

  // Check backend health on mount
  // Note: WebSocket connection also sets connectionHealth to 'healthy' when connected,
  // so we only set 'error' if the health check fails AND WebSocket isn't connected
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.getHealth();
        setConnectionHealth('healthy');
      } catch (error) {
        // Only set error if WebSocket isn't already connected (avoid race condition)
        // Check wsManager directly to get current state without dependency issues
        if (!wsManager.isConnected()) {
          setConnectionHealth('error');
        }
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
        <div className="arena flex flex-col animate-fade-in-up">
        <Header />

        <div className="arena-wrap w-full">
          <section className="arena-controls" aria-label="Debate controls">
            <div className="mode-tabs" role="group" aria-label="View">
              {[
                ['standard', 'Standard'],
                ['multi-debate', 'Multi-debate'],
                ['analytics', 'Analytics'],
                ['business', 'Business'],
                ['platform-showcase', 'Platform'],
              ].map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  aria-current={viewMode === mode ? 'true' : undefined}
                >
                  {label}
                </button>
              ))}
            </div>

            <EnhancedControls
              viewMode={viewMode}
              activeDebates={activeDebates}
              currentDebateId={currentDebateId}
              debateMessages={debateMessages}
              isDebating={!!currentDebateId && activeDebates.has(currentDebateId)}
              onMetricsUpdate={handleMetricsUpdate}
              onStopCurrentDebate={handleStopCurrentDebate}
              onShowMatrix={() => setShowMatrixModal(true)}
              onShowIntro={() => setShowIntro(true)}
              onClearConversation={() => {
                setDebateMessages([]);
                setCurrentDebateId(null);
              }}
              onDebateStarted={(debateId) => {
                if (viewMode === 'standard') {
                  // Clear previous messages when starting a new debate
                  setDebateMessages([]);
                  setCurrentDebateId(debateId);
                }
              }}
            />

            <p className="conn-line" role="status">
              {connectionSentence(connectionStatus, connectionHealth)}
            </p>
          </section>
        </div>

        {/* Dynamic Main Content Based on View Mode */}
        <main id="main" className="flex-1 arena-wrap w-full">
            {viewMode === 'standard' ? (
              <>
                <DebatePanel
                  messages={getFilteredMessages()}
                  topicText={activeDebates.get(currentDebateId)?.topic}
                  roundMeta={roundMeta}
                  factCheckCount={factChecks.filter(fc => !currentDebateId || fc.debateId === currentDebateId).length}
                />

                <div className="arena-sections">
                  <section className="arena-section" aria-labelledby="km-title">
                    <h2 id="km-title">Key moments</h2>
                    <Suspense fallback={<PanelLoader />}>
                      <KeyMomentsPanel debateId={currentDebateId} viewMode="standard" />
                    </Suspense>
                  </section>
                  <section className="arena-section" aria-labelledby="fc-title">
                    <h2 id="fc-title">Fact checks</h2>
                    <FactChecker
                      connected={connectionStatus === 'Connected'}
                      factChecks={factChecks.filter(fc => !currentDebateId || fc.debateId === currentDebateId)}
                    />
                  </section>
                  <section className="arena-section" aria-labelledby="st-title">
                    <h2 id="st-title">Stance over time</h2>
                    <Suspense fallback={<ChartLoader />}>
                      <StanceEvolutionChart
                        stanceData={currentDebateId ?
                          stanceData.filter(entry => entry.debateId === currentDebateId) :
                          stanceData
                        }
                      />
                    </Suspense>
                  </section>
                </div>
              </>
            ) : viewMode === 'multi-debate' ? (
              <>
                <Suspense fallback={<PanelLoader />}>
                  <TrueMultiDebateViewer
                    messages={debateMessages}
                    activeDebates={activeDebates}
                    onMetricsUpdate={handleMetricsUpdate}
                  />
                </Suspense>
                <div className="arena-sections">
                  <section className="arena-section" aria-labelledby="km-title">
                    <h2 id="km-title">Key moments</h2>
                    <Suspense fallback={<PanelLoader />}>
                      <KeyMomentsPanel viewMode="multi-debate" />
                    </Suspense>
                  </section>
                  <section className="arena-section" aria-labelledby="fc-title">
                    <h2 id="fc-title">Fact checks</h2>
                    <FactChecker connected={connectionStatus === 'Connected'} factChecks={factChecks} />
                  </section>
                  <section className="arena-section" aria-labelledby="st-title">
                    <h2 id="st-title">Stance over time</h2>
                    <Suspense fallback={<ChartLoader />}>
                      <StanceEvolutionChart stanceData={stanceData} />
                    </Suspense>
                  </section>
                </div>
              </>
            ) : viewMode === 'platform-showcase' ? (
              /* Platform Showcase - Premium Full Screen Experience */
              <Suspense fallback={<PanelLoader />}>
                <PlatformShowcaseDashboard />
              </Suspense>
            ) : viewMode === 'business' ? (
              /* Business Intelligence Dashboard */
              <Suspense fallback={<PanelLoader />}>
                <BusinessValueDashboard />
              </Suspense>
            ) : (
              <section className="view-pane" aria-labelledby="an-title">
                <h2 id="an-title" className="pane-title">Analytics</h2>
                <dl className="stat-list">
                  <div className="stat"><dt>Active debates</dt><dd>{activeDebates.size}</dd></div>
                  <div className="stat"><dt>Messages this session</dt><dd>{debateMessages.length}</dd></div>
                  <div className="stat"><dt>Fact checks this session</dt><dd>{factChecks.length}</dd></div>
                </dl>
                <p className="ctl-actions">
                  <button type="button" className="btn-plain" onClick={handleMetricsUpdate}>Refresh</button>
                  <button type="button" className="btn-plain" onClick={() => setViewMode('standard')}>Back to the record</button>
                </p>
                <div className="arena-sections">
                  <section className="arena-section" aria-labelledby="an-cache">
                    <h2 id="an-cache">Cache engine</h2>
                    <Suspense fallback={<OverlayLoader />}>
                      <LivePerformanceOverlay position="embedded" size="small" className="relative w-full" />
                    </Suspense>
                  </section>
                  <section className="arena-section" aria-labelledby="an-km">
                    <h2 id="an-km">Key moments</h2>
                    <Suspense fallback={<PanelLoader />}>
                      <KeyMomentsPanel viewMode="analytics" />
                    </Suspense>
                  </section>
                  <section className="arena-section" aria-labelledby="an-sys">
                    <h2 id="an-sys">System</h2>
                    <Suspense fallback={<DashboardLoader />}>
                      <EnhancedPerformanceDashboard key={metricsUpdateTrigger} />
                    </Suspense>
                  </section>
                </div>
              </section>
            )}
        </main>

        <footer className="arena-wrap w-full">
          <div className="arena-foot">
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
            <a href="/privacy-policy">Privacy policy</a>
          </div>
        </footer>

        {/* Redis Matrix Modal - wrapped in Suspense since it's lazy-loaded */}
        {showMatrixModal && (
          <Suspense fallback={<ModalLoader />}>
            <RedisMatrixModal
              isOpen={showMatrixModal}
              onClose={() => setShowMatrixModal(false)}
            />
          </Suspense>
        )}

        {/* Intro Module - wrapped in Suspense since it's lazy-loaded */}
        {showIntro && (
          <Suspense fallback={<ModalLoader />}>
            <IntroModule
              showIntro={showIntro}
              onComplete={() => {
                setShowIntro(false);
                try {
                  localStorage.setItem('stancestream-intro-seen', 'true');
                } catch {
                  // localStorage unavailable - intro will show again next visit
                }
              }}
            />
          </Suspense>
        )}
        </div>
      </ErrorBoundary>
    </ToastProvider>
  );
}
