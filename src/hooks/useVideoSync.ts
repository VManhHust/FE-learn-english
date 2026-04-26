/**
 * useVideoSync Hook
 * 
 * Synchronizes video playback time with transcript segments.
 * Polls video time every 100ms and uses binary search to find the matching segment.
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 */

import { useEffect, useState, useRef, RefObject } from 'react';
import { TranscriptSegment } from '@/types/transcript';

/**
 * YouTube Player interface (minimal subset needed for sync)
 */
interface YouTubePlayer {
  getCurrentTime?: () => number;
  getPlayerState?: () => number;
}

/**
 * Return type for useVideoSync hook
 */
interface VideoSyncResult {
  /** ID of the currently active segment, or null if no match */
  currentSegmentId: number | null;
  /** Current video time in milliseconds */
  currentTime: number;
}

/**
 * Binary search to find the segment that contains the given time
 * 
 * @param segments - Array of transcript segments sorted by startTimeMs
 * @param timeMs - Current video time in milliseconds
 * @param offsetMs - Offset to apply (negative = highlight earlier)
 * @returns The matching segment or null if no match found
 */
function findSegmentByTime(
  segments: TranscriptSegment[],
  timeMs: number,
  offsetMs: number = -200
): TranscriptSegment | null {
  if (segments.length === 0) {
    return null;
  }

  // Apply offset to highlight earlier (e.g., -200ms means highlight 200ms before audio)
  const adjustedTime = timeMs + offsetMs;

  let left = 0;
  let right = segments.length - 1;

  // Binary search for the segment containing adjustedTime
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const segment = segments[mid];

    if (adjustedTime >= segment.startTimeMs && adjustedTime < segment.endTimeMs) {
      // Found the matching segment
      return segment;
    } else if (adjustedTime < segment.startTimeMs) {
      // Search in the left half
      right = mid - 1;
    } else {
      // adjustedTime >= segment.endTimeMs, search in the right half
      left = mid + 1;
    }
  }

  // No segment contains this time
  return null;
}

/**
 * Hook to synchronize video playback with transcript segments
 * 
 * Polls the video player every 50ms to get the current time,
 * then uses binary search to find the matching transcript segment.
 * Applies a -200ms offset to highlight segments slightly before audio plays.
 * 
 * @param videoRef - Reference to the YouTube player instance
 * @param segments - Array of transcript segments sorted by startTimeMs
 * @returns Current segment ID and video time
 */
export function useVideoSync(
  videoRef: RefObject<YouTubePlayer | null>,
  segments: TranscriptSegment[]
): VideoSyncResult {
  const [currentSegmentId, setCurrentSegmentId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Don't start polling if no video player or no segments
    if (!videoRef.current || segments.length === 0) {
      return;
    }

    // Poll video time every 50ms for better responsiveness
    intervalRef.current = setInterval(() => {
      const player = videoRef.current;
      
      if (!player) {
        return;
      }

      try {
        // Check if getCurrentTime is a function
        if (typeof player.getCurrentTime !== 'function') {
          return;
        }

        // Get current time in seconds from YouTube player
        const timeInSeconds = player.getCurrentTime();
        const timeInMs = Math.floor(timeInSeconds * 1000);
        
        setCurrentTime(timeInMs);

        // Find matching segment using binary search with -200ms offset
        // This makes the highlight appear slightly before the audio
        const matchingSegment = findSegmentByTime(segments, timeInMs, -200);

        // Update segment ID if changed
        if (matchingSegment) {
          setCurrentSegmentId(prevId => 
            prevId !== matchingSegment.id ? matchingSegment.id : prevId
          );
        } else {
          setCurrentSegmentId(null);
        }
      } catch (error) {
        console.error('Error getting video time:', error);
      }
    }, 50); // Reduced from 100ms to 50ms for better sync

    // Cleanup interval on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [videoRef, segments]);

  return {
    currentSegmentId,
    currentTime,
  };
}
