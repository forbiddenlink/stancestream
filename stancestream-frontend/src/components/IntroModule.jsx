// IntroModule.jsx - Professional User Onboarding Experience
import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { Button, Modal, ModalHeader, ModalContent, Card, CardHeader, CardContent } from './ui';

const IntroModule = ({ onComplete, showIntro = false }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(showIntro);

  // Sync visibility with showIntro prop
  useEffect(() => {
    setIsVisible(showIntro);
  }, [showIntro]);

  const steps = [
    {
      title: "Welcome to StanceStream",
      subtitle: "Redis-Powered AI Intelligence Platform",
      content: (
        <div className="text-center">
          <div className="mb-6">
            <Icon name="zap" className="w-16 h-16 mx-auto text-green-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Enterprise AI Debate Platform</h3>
            <p className="text-gray-300 text-lg">
              Experience real-time AI agents powered by all 4 Redis modules working together
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-800/50 rounded-lg p-4 border border-green-500/30">
              <Icon name="database" className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-green-300">66.7% Cache Hit Rate</div>
              <div className="text-xs text-gray-400">Live semantic caching</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 border border-green-500/30">
              <Icon name="activity" className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-green-300">Sub-3s Response</div>
              <div className="text-xs text-gray-400">Enterprise performance</div>
            </div>
          </div>
        </div>
      ),
      icon: "home",
      color: "green"
    },
    {
      title: "4 Redis Modules in Action",
      subtitle: "Multi-Modal Database Excellence",
      content: (
        <div>
          <p className="text-gray-300 mb-6">
            StanceStream showcases all 4 Redis modules working together in a sophisticated AI application:
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
              <Icon name="database" className="w-8 h-8 text-blue-400" />
              <div>
                <div className="font-bold text-blue-300">RedisJSON</div>
                <div className="text-sm text-gray-400">Complex agent personalities & emotional states</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
              <Icon name="message-circle" className="w-8 h-8 text-purple-400" />
              <div>
                <div className="font-bold text-purple-300">Redis Streams</div>
                <div className="text-sm text-gray-400">Real-time messaging & memory formation</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-green-900/20 rounded-lg border border-green-500/30">
              <Icon name="trending-up" className="w-8 h-8 text-green-400" />
              <div>
                <div className="font-bold text-green-300">RedisTimeSeries</div>
                <div className="text-sm text-gray-400">Stance evolution & performance tracking</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-orange-900/20 rounded-lg border border-orange-500/30">
              <Icon name="search" className="w-8 h-8 text-orange-400" />
              <div>
                <div className="font-bold text-orange-300">Redis Vector</div>
                <div className="text-sm text-gray-400">Semantic caching & fact verification</div>
              </div>
            </div>
          </div>
        </div>
      ),
      icon: "layers",
      color: "blue"
    },
    {
      title: "Navigation Modes",
      subtitle: "4 Professional Views",
      content: (
        <div>
          <p className="text-gray-300 mb-6">
            Choose your view mode to explore different aspects of the platform:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
              <Icon name="target" className="w-6 h-6 text-blue-400 mb-2" />
              <div className="font-bold text-blue-300 mb-1">Standard</div>
              <div className="text-xs text-gray-400">Single debate with fact-checking & stance evolution</div>
            </div>
            <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/30">
              <Icon name="layers" className="w-6 h-6 text-purple-400 mb-2" />
              <div className="font-bold text-purple-300 mb-1">Multi-Debate</div>
              <div className="text-xs text-gray-400">Concurrent debates with aggregated analytics</div>
            </div>
            <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
              <Icon name="bar-chart-3" className="w-6 h-6 text-green-400 mb-2" />
              <div className="font-bold text-green-300 mb-1">Analytics</div>
              <div className="text-xs text-gray-400">Performance metrics & Redis optimization</div>
            </div>
            <div className="bg-orange-900/20 rounded-lg p-4 border border-orange-500/30">
              <Icon name="trending-up" className="w-6 h-6 text-orange-400 mb-2" />
              <div className="font-bold text-orange-300 mb-1">Platform</div>
              <div className="text-xs text-gray-400">Executive showcase & business value</div>
            </div>
          </div>
        </div>
      ),
      icon: "navigation",
      color: "purple"
    },
    {
      title: "Semantic Caching Innovation",
      subtitle: "The Heart of Cost Optimization",
      content: (
        <div>
          <div className="bg-green-900/20 rounded-lg p-6 border border-green-500/30 mb-6">
            <div className="text-center mb-4">
              <Icon name="target" className="w-12 h-12 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-300">70%+ Cache Hit Rate</div>
              <div className="text-sm text-gray-400">Live semantic similarity matching</div>
            </div>
          </div>
          <p className="text-gray-300 mb-4">
            Our breakthrough semantic caching system uses Redis Vector Search to:
          </p>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-center gap-2">
              <Icon name="check" className="w-4 h-4 text-green-400" />
              <span>Cache AI responses with 85% similarity threshold</span>
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" className="w-4 h-4 text-green-400" />
              <span>Reduce OpenAI API costs by 60%+</span>
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" className="w-4 h-4 text-green-400" />
              <span>Deliver sub-second cached responses</span>
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" className="w-4 h-4 text-green-400" />
              <span>Scale to thousands of requests efficiently</span>
            </li>
          </ul>
        </div>
      ),
      icon: "database",
      color: "green"
    },
    {
      title: "Get Started",
      subtitle: "Ready to Experience AI-Powered Debates",
      content: (
        <div className="text-center">
          <Icon name="play" className="w-16 h-16 mx-auto text-green-400 mb-4" />
          <h3 className="text-xl font-bold text-white mb-4">You're Ready to Begin!</h3>
          <p className="text-gray-300 mb-6">
            Start exploring StanceStream's capabilities. The platform is optimized and ready for demonstration.
          </p>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-green-500/30">
            <h4 className="font-bold text-green-300 mb-2">Quick Start Tips:</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Try Standard mode first to see basic debate functionality</li>
              <li>• Switch to Analytics to see Redis performance metrics</li>
              <li>• Watch the Semantic Cache Engine for live cost savings</li>
              <li>• Click Matrix button for Redis operations visualization</li>
            </ul>
          </div>
        </div>
      ),
      icon: "rocket",
      color: "green"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    if (onComplete) {
      onComplete();
    }
  };

  if (!isVisible) {
    return null;
  }

  const currentStepData = steps[currentStep];

  return (
    <Modal 
      isOpen={isVisible} 
      onClose={handleSkip} 
      className="max-w-4xl max-h-[90vh]"
      closeOnOverlay={true}
    >
      <ModalHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Icon name={currentStepData.icon} className={`w-6 h-6 text-${currentStepData.color}-400`} />
            <div>
              <h2 className="text-xl font-bold text-white">{currentStepData.title}</h2>
              <p className="text-sm text-gray-400">{currentStepData.subtitle}</p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-white transition-colors"
            title="Skip intro"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>
      </ModalHeader>

      <ModalContent>
        <div className="min-h-[400px] flex flex-col">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Step {currentStep + 1} of {steps.length}</span>
              <span className="text-sm text-gray-400">{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step content */}
          <div className="flex-1">
            {currentStepData.content}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <Icon name="arrow-left" className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-green-400' : 
                    index < currentStep ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              <Icon name={currentStep === steps.length - 1 ? "play" : "arrow-right"} className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
};

export default IntroModule;
