export interface Bookmark {
  id: string
  parentId: string | null
  title: string
  url: string
  dateAdded: number
  dateGroupModified: number
  isFolder: boolean
  children: string[]
}

export interface BookmarkMetadata {
  tags: string[]
  description: string
  icon?: string
}

export type SortOption = 'newest' | 'oldest' | 'alpha' | 'alpha-reverse'

// Messages sent from side panel to background
export type PanelMessage =
  | { type: 'GET_BOOKMARK_TREE' }
  | { type: 'GET_METADATA'; payload: string[] }
  | { type: 'SET_METADATA'; payload: { id: string; metadata: BookmarkMetadata } }
  | {
      type: 'CREATE_BOOKMARK'
      payload: { parentId: string; title: string; url: string }
    }
  | {
      type: 'UPDATE_BOOKMARK'
      payload: { id: string; title: string; url?: string }
    }
  | { type: 'REMOVE_BOOKMARK'; payload: { id: string } }
  | { type: 'CREATE_FOLDER'; payload: { parentId: string; title: string } }
  | {
      type: 'MOVE_BOOKMARK'
      payload: { id: string; parentId: string; index: number }
    }

// Messages sent from background to side panel
export type BackgroundMessage = {
  type: 'BOOKMARK_CHANGED'
  payload: {
    event: 'created' | 'changed' | 'moved' | 'removed'
    bookmark?: { id: string; parentId?: string; title: string; url?: string }
    changeInfo?: { title: string; url: string }
    moveInfo?: { parentId: string; index: number }
    removeInfo?: {
      parentId: string
      index: number
      node: { id: string; parentId?: string; title: string; url?: string }
    }
  }
}
