export interface VocabularyDeckCover {
  url: string
  fit?: 'cover' | 'contain'
  position?: string
  backgroundColor?: string
  overlay?: boolean
}

const VOCABULARY_DECK_COVERS: Record<string, VocabularyDeckCover> = {
  '1000-tu-tieng-anh-thong-dung': {
    url: 'https://media.zim.vn/681b1982d04ca1b008193a34/1000-tu-vung-tieng-anh-theo-chu-de.jpg',
    fit: 'contain',
    position: 'center',
    backgroundColor: '#52736d',
    overlay: false,
  },
}

export function getVocabularyDeckCover(slug: string): VocabularyDeckCover | undefined {
  return VOCABULARY_DECK_COVERS[slug]
}
