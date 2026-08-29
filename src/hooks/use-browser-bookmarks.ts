import { useState, useEffect, useCallback } from 'react'
import type { Bookmark, BookmarkMetadata, BackgroundMessage } from '@/types/bookmark'

const isExtension = typeof chrome !== 'undefined' && chrome.runtime?.id

function sendMessage(msg: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    if (!isExtension) {
      resolve(null)
      return
    }
    chrome.runtime!.sendMessage(msg, (response: unknown) => {
      resolve(response)
    })
  })
}

export function useBrowserBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [metadata, setMetadata] = useState<Record<string, BookmarkMetadata>>({})
  const [loading, setLoading] = useState(true)

  const fetchBookmarks = useCallback(async () => {
    if (!isExtension) {
      setLoading(false)
      return
    }
    const tree = (await sendMessage({ type: 'GET_BOOKMARK_TREE' })) as Bookmark[] | null
    if (tree) {
      setBookmarks(tree)
      const ids = tree.filter((b) => !b.isFolder).map((b) => b.id)
      if (ids.length > 0) {
        const meta = (await sendMessage({
          type: 'GET_METADATA',
          payload: ids,
        })) as Record<string, BookmarkMetadata> | null
        if (meta) setMetadata(meta)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!isExtension) return
    fetchBookmarks()

    const listener = (message: unknown) => {
      const msg = message as BackgroundMessage
      if (msg.type === 'BOOKMARK_CHANGED') {
        fetchBookmarks()
      }
    }

    chrome.runtime!.onMessage.addListener(listener)
    return () => {
      chrome.runtime!.onMessage.removeListener(listener)
    }
  }, [fetchBookmarks])

  useEffect(() => {
    if (!isExtension) return

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange }
    ) => {
      if ('bookmarkTree' in changes) {
        const newValue = changes['bookmarkTree'].newValue as Bookmark[] | undefined
        if (newValue) setBookmarks(newValue)
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  const addBookmark = useCallback(
    async (data: { title: string; url: string; parentId?: string }) => {
      const parent = data.parentId ?? '1'
      await sendMessage({
        type: 'CREATE_BOOKMARK',
        payload: { parentId: parent, title: data.title, url: data.url },
      })
      // Re-fetch immediately so UI updates without reload
      await fetchBookmarks()
    },
    [fetchBookmarks]
  )

  const deleteBookmark = useCallback(
    async (id: string) => {
      await sendMessage({
        type: 'REMOVE_BOOKMARK',
        payload: { id },
      })
      await fetchBookmarks()
    },
    [fetchBookmarks]
  )

  const updateBookmark = useCallback(
    async (id: string, data: { title?: string; url?: string }) => {
      await sendMessage({
        type: 'UPDATE_BOOKMARK',
        payload: { id, title: data.title ?? '', url: data.url },
      })
      await fetchBookmarks()
    },
    [fetchBookmarks]
  )

  const createFolder = useCallback(
    async (parentId: string, title: string) => {
      await sendMessage({
        type: 'CREATE_FOLDER',
        payload: { parentId, title },
      })
      await fetchBookmarks()
    },
    [fetchBookmarks]
  )

  const moveBookmark = useCallback(
    async (id: string, parentId: string, index: number) => {
      await sendMessage({
        type: 'MOVE_BOOKMARK',
        payload: { id, parentId, index },
      })
      await fetchBookmarks()
    },
    [fetchBookmarks]
  )

  const setMeta = useCallback(
    async (id: string, meta: BookmarkMetadata) => {
      setMetadata((prev) => ({ ...prev, [id]: meta }))
      await sendMessage({
        type: 'SET_METADATA',
        payload: { id, metadata: meta },
      })
    },
    []
  )

  const folders = bookmarks.filter((b) => b.isFolder)

  const getChildren = useCallback(
    (parentId: string): Bookmark[] => {
      return bookmarks.filter((b) => b.parentId === parentId)
    },
    [bookmarks]
  )

  return {
    bookmarks,
    metadata,
    loading,
    folders,
    addBookmark,
    deleteBookmark,
    updateBookmark,
    createFolder,
    moveBookmark,
    getChildren,
    setMeta,
    refresh: fetchBookmarks,
  }
}
