/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import {
    Globe,
    Bot,
    Heart,
    Users,
    GraduationCap,
    DollarSign,
    Lock,
    Rocket,
    BarChart3,
    Search,
    Clock,
    CheckCircle,
    X,
    XCircle,
    Target,
    Square,
    AlertTriangle,
    AlertCircle,
    MessageCircle,
    Play,
    Pause,
    Plus,
    Minus,
    ChevronDown,
    ChevronUp,
    Settings,
    Database,
    Zap,
    Eye,
    Activity,
    TrendingUp,
    Shield,
    Lightbulb,
    BookOpen,
    Scale,
    Cpu,
    Network,
    Timer,
    Sparkles,
    Brain,
    Gauge,
    Layers,
    Grid3X3,
    MessageSquare,
    Users2,
    Megaphone,
    Mic,
    UserCircle,
    Crown,
    Gavel,
    Loader2,
    Circle,
    Save,
    Maximize2,
    Minimize2,
    Award,
    Star,
    RefreshCw,
    User,
    ShieldCheck,
    ExternalLink,
    PlayCircle,
    Trash2,
    HelpCircle,
    ArrowLeft,
    ArrowRight
} from 'lucide-react';

// Icon mapping for topics and general use
const iconMap = {
    // Topic icons
    'climate': Globe,
    'ai': Bot,
    'healthcare': Heart,
    'immigration': Users,
    'education': GraduationCap,
    'taxation': DollarSign,
    'privacy': Lock,
    'space': Rocket,

    // Action icons
    'analytics': BarChart3,
    'bar-chart': BarChart3,  // Add alias for bar-chart
    'chart': BarChart3,      // Additional alias
    'stats': BarChart3,      // Additional alias
    'search': Search,
    'loading': Loader2,
    'loader': Loader2,  // Add alias for loading
    'success': CheckCircle,
    'error': X,
    'target': Target,
    'stop': Square,
    'warning': AlertTriangle,
    'message': MessageCircle,
    'play': Play,
    'pause': Pause,
    'add': Plus,
    'remove': Minus,
    'expand': ChevronDown,
    'collapse': ChevronUp,
    'settings': Settings,
    'save': Save,
    'award': Award,
    'star': Star,
    'refresh': RefreshCw,
    'clock': Clock,

    // Tech icons
    'database': Database,
    'performance': Zap,
    'monitor': Eye,
    'activity': Activity,
    'trending': TrendingUp,
    'security': Shield,
    'idea': Lightbulb,
    'fact': BookOpen,
    'balance': Scale,
    'ai-chip': Cpu,
    'network': Network,
    'timer': Timer,
    'enhance': Sparkles,
    'brain': Brain,
    'gauge': Gauge,
    'multi-debate': Grid3X3,
    'layers': Layers,
    'debate': MessageSquare,
    'group': Users2,
    'announce': Megaphone,
    'speak': Mic,

    // Missing icon mappings
    'user': User,
    'users': Users,
    'message-circle': MessageCircle,
    'shield-check': ShieldCheck,
    'trending-up': TrendingUp,
    'zap': Zap,
    'cpu': Cpu,
    'check-circle': CheckCircle,
    'dollar-sign': DollarSign,
    'play-circle': PlayCircle,
    'loader-2': Loader2,
    'file-text': BookOpen,
    'git-branch': Network,
    'users2': Users2,
    'alert-circle': AlertCircle,
    'refresh-cw': RefreshCw,
    'external-link': ExternalLink,

    // Missing icons that were causing errors
    'help-circle': HelpCircle,
    'arrow-left': ArrowLeft,
    'arrow-right': ArrowRight,
    'alert-triangle': AlertTriangle,
    'shield': Shield,
    'trash': Trash2,
    'x-circle': XCircle,

    // Chart and UI controls
    'maximize2': Maximize2,
    'minimize2': Minimize2,
    'Maximize2': Maximize2,  // Support both cases
    'Activity': Activity,    // Support both cases

    // Agent personas
    'senator': Gavel,
    'reformer': Lightbulb,
    'citizen': UserCircle,
    'leader': Crown,

    // Stance indicators
    'against': X,
    'neutral': Circle,
    'support': CheckCircle
};

const Icon = ({
    name,
    size = 16,
    className = '',
    color = 'currentColor',
    ...props
}) => {
    const IconComponent = iconMap[name];

    if (!IconComponent) {
        console.warn(`Icon "${name}" not found in iconMap`);
        return null;
    }

    return (
        <IconComponent
            size={size}
            className={className}
            color={color}
            {...props}
        />
    );
};

export default Icon;
export { iconMap };
