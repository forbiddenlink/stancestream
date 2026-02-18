import React from 'react';
import Icon from './Icon';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            isRetrying: false
        };
    }

    static getDerivedStateFromError(error) {
        void error; // Required by React but not used here
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Log error to console for debugging
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ isRetrying: true });

        // Simulate retry delay
        setTimeout(() => {
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
                isRetrying: false
            });
        }, 1000);
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full">
                        <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 backdrop-blur-sm border border-red-500/30 rounded-xl p-8 text-center">
                            {/* Error Icon */}
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Icon name="alert-triangle" size={32} className="text-red-400" />
                            </div>

                            {/* Error Title */}
                            <h1 className="text-2xl font-bold text-red-300 mb-4">
                                System Error Detected
                            </h1>

                            {/* Error Description */}
                            <p className="text-gray-300 mb-6 leading-relaxed">
                                StanceStream encountered an unexpected error. This is likely a temporary issue
                                that can be resolved by retrying the operation or refreshing the application.
                            </p>

                            {/* Error Details (Development Mode) */}
                            {import.meta.env.DEV && this.state.error && (
                                <div className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-4 mb-6 text-left">
                                    <h3 className="text-sm font-semibold text-red-300 mb-2">Error Details:</h3>
                                    <pre className="text-xs text-gray-400 overflow-auto max-h-32">
                                        {this.state.error.toString()}
                                    </pre>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={this.handleRetry}
                                    disabled={this.state.isRetrying}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {this.state.isRetrying ? (
                                        <>
                                            <Icon name="loading" size={16} className="animate-spin" />
                                            Retrying...
                                        </>
                                    ) : (
                                        <>
                                            <Icon name="refresh-cw" size={16} />
                                            Try Again
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={this.handleReload}
                                    className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-medium hover:from-gray-700 hover:to-gray-800 transition-all duration-200 flex items-center gap-2"
                                >
                                    <Icon name="external-link" size={16} />
                                    Reload Application
                                </button>
                            </div>

                            {/* Help Text */}
                            <p className="text-sm text-gray-400 mt-6">
                                If this error persists, please check your connection and try again.
                                For technical support, contact your system administrator.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
