/**
 * Transcript Types
 * 
 * Type definitions for the bilingual transcript sync feature.
 * These types match the backend API response structure.
 */

/**
 * Language display mode for transcript viewer
 */
export type LanguageMode = 'both' | 'en' | 'vi';

/**
 * Represents a single transcript segment with timing information
 */
export interface TranscriptSegment {
  /** Unique identifier for the segment */
  id: number;
  
  /** Start time in milliseconds */
  startTimeMs: number;
  
  /** End time in milliseconds */
  endTimeMs: number;
  
  /** English transcript text */
  text: string;
  
  /** Vietnamese translation (nullable if not available) */
  vietnameseText: string | null;
}

/**
 * API response structure for transcript data
 */
export interface TranscriptApiResponse {
  /** Learning topic ID this transcript belongs to */
  learningTopicId: number;
  
  /** Array of transcript segments sorted by startTimeMs */
  segments: TranscriptSegment[];
  
  /** Total number of segments */
  totalSegments: number;
}
