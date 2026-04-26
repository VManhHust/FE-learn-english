/**
 * useAutoScroll Hook
 * 
 * Manages automatic scrolling to keep the highlighted transcript segment visible.
 * Detects manual scrolling and pauses auto-scroll for 3 seconds.
 * Only scrolls when the segment is not already in the viewport.
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**
 */

import { useEffect, useRef, useCallback, RefObject } from 'react';

/**
 * Return type for useAutoScroll hook
 */
interface AutoScrollResult {
  /** Function to scroll to a specific segment by ID */
  scrollToSegment: (segmentId: number) => void;
  /** Function to manually pause auto-scroll */
  pauseAutoScroll: () => void;
}

/**
 * Check if an element is fully visible within its container's viewport
 * 
 * @param element - The element to check
 * @param container - The scrollable container
 * @returns true if element is fully visible, false otherwise
 */
function isElementInViewport(
  element: HTMLElement,
  container: HTMLElement
): boolean {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  // Check if element is fully visible within container
  return (
    elementRect.top >= containerRect.top &&
    elementRect.bottom <= containerRect.bottom &&
    elementRect.left >= containerRect.left &&
    elementRect.right <= containerRect.right
  );
}

/**
 * Hook to manage automatic scrolling for transcript segments
 * 
 * Features:
 * - Auto-scrolls to highlighted segment when it changes
 * - Detects manual scroll and pauses auto-scroll for 3 seconds
 * - Uses smooth scroll animation (300ms)
 * - Only scrolls if segment is not already in viewport
 * - Centers segment in viewport when scrolling
 * 
 * @param containerRef - Reference to the scrollable container element
 * @param currentSegmentId - ID of the currently highlighted segment
 * @param pauseDuration - Duration to pause auto-scroll after manual scroll (default: 3000ms)
 * @returns Object with scrollToSegment and pauseAutoScroll functions
 */
export function useAutoScroll(
  containerRef: RefObject<HTMLDivElement | null>,
  currentSegmentId: number | null,
  pauseDuration: number = 3000
): AutoScrollResult {
  const isPausedRef = useRef<boolean>(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const isAutoScrollingRef = useRef<boolean>(false);

  /**
   * Pause auto-scroll for the configured duration
   * Called when manual scroll is detected
   */
  const pauseAutoScroll = useCallback(() => {
    // Clear any existing pause timeout
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }

    // Set paused flag
    isPausedRef.current = true;

    // Resume auto-scroll after pause duration (Requirement 4.3, 4.4)
    pauseTimeoutRef.current = setTimeout(() => {
      isPausedRef.current = false;
      pauseTimeoutRef.current = null;
    }, pauseDuration);
  }, [pauseDuration]);

  /**
   * Scroll to a specific segment by ID
   * 
   * @param segmentId - The ID of the segment to scroll to
   */
  const scrollToSegment = useCallback((segmentId: number) => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    // Find the segment element by data-segment-id attribute
    const segmentElement = container.querySelector(
      `[data-segment-id="${segmentId}"]`
    ) as HTMLElement;

    if (!segmentElement) {
      return;
    }

    // Check if segment is already in viewport (Requirement 4.6)
    if (isElementInViewport(segmentElement, container)) {
      return;
    }

    // Mark that we're auto-scrolling to avoid triggering pause
    isAutoScrollingRef.current = true;
    lastScrollTimeRef.current = Date.now();

    // Scroll to center the segment in viewport (Requirement 4.2, 4.5)
    segmentElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });

    // Reset auto-scrolling flag after animation completes (300ms)
    setTimeout(() => {
      isAutoScrollingRef.current = false;
    }, 300);
  }, [containerRef]);

  /**
   * Handle scroll events to detect manual scrolling
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleScroll = () => {
      // Ignore scroll events triggered by auto-scroll
      if (isAutoScrollingRef.current) {
        return;
      }

      // Check if this is a manual scroll (not triggered by our auto-scroll)
      const timeSinceLastScroll = Date.now() - lastScrollTimeRef.current;
      
      // If more than 100ms has passed since last auto-scroll, consider it manual
      if (timeSinceLastScroll > 100) {
        pauseAutoScroll();
      }
    };

    // Add scroll event listener
    container.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, pauseAutoScroll]);

  /**
   * Auto-scroll when current segment changes
   */
  useEffect(() => {
    // Don't scroll if paused or no segment selected
    if (isPausedRef.current || currentSegmentId === null) {
      return;
    }

    // Scroll to the new segment (Requirement 4.1)
    scrollToSegment(currentSegmentId);
  }, [currentSegmentId, scrollToSegment]);

  /**
   * Cleanup pause timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, []);

  return {
    scrollToSegment,
    pauseAutoScroll,
  };
}
