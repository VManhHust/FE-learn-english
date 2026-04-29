import { axiosInstance } from '../auth/authClient'
import { CreateVideoNoteRequest, VideoNoteResponse, PageResponse } from '@/types/video-note'

export async function createVideoNote(
  request: CreateVideoNoteRequest
): Promise<VideoNoteResponse> {
  const response = await axiosInstance.post<VideoNoteResponse>(
    '/api/v1/video-notes',
    request
  )
  return response.data
}

export async function fetchVideoNotes(
  page: number = 0,
  size: number = 20
): Promise<PageResponse<VideoNoteResponse>> {
  const response = await axiosInstance.get<PageResponse<VideoNoteResponse>>(
    '/api/v1/video-notes',
    {
      params: { page, size }
    }
  )
  return response.data
}

export async function fetchNoteByModule(
  exerciseModuleId: number
): Promise<VideoNoteResponse | null> {
  try {
    const response = await axiosInstance.get<VideoNoteResponse>(
      `/api/v1/video-notes/by-module/${exerciseModuleId}`
    )
    return response.data
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null
    }
    throw error
  }
}

export async function updateVideoNote(
  noteId: number,
  request: CreateVideoNoteRequest
): Promise<VideoNoteResponse> {
  const response = await axiosInstance.put<VideoNoteResponse>(
    `/api/v1/video-notes/${noteId}`,
    request
  )
  return response.data
}

export async function deleteVideoNote(noteId: number): Promise<void> {
  await axiosInstance.delete(`/api/v1/video-notes/${noteId}`)
}
