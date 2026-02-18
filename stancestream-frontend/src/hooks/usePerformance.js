// Performance optimization hook - Debouncing and memoization utilities
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Debounce hook for performance optimization
export const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

// Throttle hook for limiting function calls
export const useThrottle = (callback, delay) => {
    const lastRun = useRef(Date.now());

    return useCallback((...args) => {
        if (Date.now() - lastRun.current >= delay) {
            callback(...args);
            lastRun.current = Date.now();
        }
    }, [callback, delay]);
};

// Local storage hook with error handling
export const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    return [storedValue, setValue];
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName) => {
    const renderCount = useRef(0);
    const startTime = useRef(Date.now());

    useEffect(() => {
        renderCount.current += 1;

        if (import.meta.env.DEV) {
            console.log(`${componentName} rendered ${renderCount.current} times`);

            // Log slow renders (> 16ms for 60fps)
            const renderTime = Date.now() - startTime.current;
            if (renderTime > 16) {
                console.warn(`Slow render detected in ${componentName}: ${renderTime}ms`);
            }
        }

        startTime.current = Date.now();
    });

    return {
        renderCount: renderCount.current,
        logPerformance: (operation, duration) => {
            if (import.meta.env.DEV) {
                console.log(`${componentName} - ${operation}: ${duration}ms`);
            }
        }
    };
};

// Intersection observer hook for lazy loading
export const useIntersectionObserver = (options = {}) => {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const [hasIntersected, setHasIntersected] = useState(false);
    const elementRef = useRef(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
            if (entry.isIntersecting && !hasIntersected) {
                setHasIntersected(true);
            }
        }, options);

        observer.observe(element);

        return () => {
            observer.unobserve(element);
        };
    }, [options, hasIntersected]);

    return [elementRef, isIntersecting, hasIntersected];
};

// Window size hook for responsive design
export const useWindowSize = () => {
    const [windowSize, setWindowSize] = useState({
        width: undefined,
        height: undefined,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Set initial size

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = useMemo(() => windowSize.width && windowSize.width < 768, [windowSize.width]);
    const isTablet = useMemo(() => windowSize.width && windowSize.width >= 768 && windowSize.width < 1024, [windowSize.width]);
    const isDesktop = useMemo(() => windowSize.width && windowSize.width >= 1024, [windowSize.width]);

    return {
        ...windowSize,
        isMobile,
        isTablet,
        isDesktop
    };
};

export default {
    useDebounce,
    useThrottle,
    useLocalStorage,
    usePerformanceMonitor,
    useIntersectionObserver,
    useWindowSize
};
