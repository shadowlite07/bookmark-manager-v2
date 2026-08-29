// Background service worker for Bookmark Manager extension
// Handles real-time bookmark sync via chrome.bookmarks API

const METADATA_PREFIX = 'bm-meta-'
let appActionTimeout: ReturnType<typeof setTimeout> | null = null

// --- Helpers ---

async function setAppActionFlag() {
  await chrome.storage.local.set({ _isAppAction: true })
  if (appActionTimeout) clearTimeout(appActionTimeout)
  appActionTimeout = setTimeout(() => {
    chrome.storage.local.remove('_isAppAction')
  }, 500)
}

async function wasAppAction(): Promise<boolean> {
  const data = await chrome.storage.local.get('_isAppAction')
  return !!data._isAppAction
}

// --- Sync full bookmark tree to storage ---

async function syncBookmarkTree() {
  const tree = await chrome.bookmarks.getTree()
  const flat = flattenTree(tree)
  await chrome.storage.local.set({ bookmarkTree: flat })
}

interface FlatBookmark {
  id: string
  parentId: string | null
  title: string
  url: string
  dateAdded: number
  dateGroupModified: number
  isFolder: boolean
  children: string[]
}

interface BookmarkMetadata {
  tags: string[]
  description: string
}

function flattenTree(
  nodes: chrome.bookmarks.BookmarkTreeNode[],
  parentId: string | null = null
): FlatBookmark[] {
  const result: FlatBookmark[] = []
  for (const node of nodes) {
    if (node.id === '0') {
      // Root node — recurse into children without adding it
      if (node.children) result.push(...flattenTree(node.children, null))
      continue
    }
    result.push({
      id: node.id,
      parentId: node.parentId ?? parentId,
      title: node.title,
      url: node.url ?? '',
      dateAdded: node.dateAdded ?? 0,
      dateGroupModified: node.dateGroupModified ?? 0,
      isFolder: !node.url,
      children: node.children?.map((c: chrome.bookmarks.BookmarkTreeNode) => c.id) ?? [],
    })
    if (node.children) {
      result.push(...flattenTree(node.children, node.id))
    }
  }
  return result
}

// --- Message handling from side panel ---

chrome.runtime.onMessage.addListener(
  (
    message: { type: string; payload?: unknown },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => {
    if (message.type === 'GET_BOOKMARK_TREE') {
      syncBookmarkTree().then(() => {
        chrome.storage.local.get('bookmarkTree', (data: { bookmarkTree?: FlatBookmark[] }) => {
          sendResponse(data.bookmarkTree ?? [])
        })
      })
      return true // async response
    }

    if (message.type === 'GET_METADATA') {
      const keys = (message.payload as string[]).map(
        (id: string) => `${METADATA_PREFIX}${id}`
      )
      chrome.storage.local.get(keys, (data: Record<string, unknown>) => {
        const result: Record<string, BookmarkMetadata> = {}
        for (const key of Object.keys(data)) {
          const id = key.replace(METADATA_PREFIX, '')
          result[id] = data[key] as BookmarkMetadata
        }
        sendResponse(result)
      })
      return true
    }

    if (message.type === 'SET_METADATA') {
      const { id, metadata } = message.payload as {
        id: string
        metadata: BookmarkMetadata
      }
      chrome.storage.local.set({ [`${METADATA_PREFIX}${id}`]: metadata }, () => {
        sendResponse({ ok: true })
      })
      return true
    }

    if (message.type === 'CREATE_BOOKMARK') {
      const { parentId, title, url } = message.payload as {
        parentId: string
        title: string
        url: string
      }
      setAppActionFlag()
      chrome.bookmarks.create({ parentId, title, url }, (node: chrome.bookmarks.BookmarkTreeNode) => {
        sendResponse(node)
      })
      return true
    }

    if (message.type === 'UPDATE_BOOKMARK') {
      const { id, title, url } = message.payload as {
        id: string
        title: string
        url?: string
      }
      setAppActionFlag()
      const changes: { title?: string; url?: string } = {}
      if (title !== undefined) changes.title = title
      if (url !== undefined) changes.url = url
      chrome.bookmarks.update(id, changes, (node: chrome.bookmarks.BookmarkTreeNode) => {
        sendResponse(node)
      })
      return true
    }

    if (message.type === 'REMOVE_BOOKMARK') {
      const { id } = message.payload as { id: string }
      setAppActionFlag()
      chrome.bookmarks.remove(id, () => {
        sendResponse({ ok: true })
      })
      return true
    }

    if (message.type === 'CREATE_FOLDER') {
      const { parentId, title } = message.payload as {
        parentId: string
        title: string
      }
      setAppActionFlag()
      chrome.bookmarks.create({ parentId, title }, (node: chrome.bookmarks.BookmarkTreeNode) => {
        sendResponse(node)
      })
      return true
    }

    if (message.type === 'MOVE_BOOKMARK') {
      const { id, parentId, index } = message.payload as {
        id: string
        parentId: string
        index: number
      }
      setAppActionFlag()
      chrome.bookmarks.move(id, { parentId, index }, (node: chrome.bookmarks.BookmarkTreeNode) => {
        sendResponse(node)
      })
      return true
    }

    return false
  }
)

// --- Bookmark event listeners ---

chrome.bookmarks.onCreated.addListener(
  async (_id: string, bookmark: chrome.bookmarks.BookmarkTreeNode) => {
    if (await wasAppAction()) return
    await syncBookmarkTree()
    chrome.runtime.sendMessage({
      type: 'BOOKMARK_CHANGED',
      payload: { event: 'created', bookmark },
    })
  }
)

chrome.bookmarks.onChanged.addListener(
  async (_id: string, changeInfo: { title: string; url?: string }) => {
    if (await wasAppAction()) return
    await syncBookmarkTree()
    chrome.runtime.sendMessage({
      type: 'BOOKMARK_CHANGED',
      payload: { event: 'changed', changeInfo },
    })
  }
)

chrome.bookmarks.onMoved.addListener(
  async (_id: string, moveInfo: { parentId: string; index: number }) => {
    if (await wasAppAction()) return
    await syncBookmarkTree()
    chrome.runtime.sendMessage({
      type: 'BOOKMARK_CHANGED',
      payload: { event: 'moved', moveInfo },
    })
  }
)

chrome.bookmarks.onRemoved.addListener(
  async (
    _id: string,
    removeInfo: {
      parentId: string
      index: number
      node: chrome.bookmarks.BookmarkTreeNode
    }
  ) => {
    if (await wasAppAction()) return
    await syncBookmarkTree()
    chrome.runtime.sendMessage({
      type: 'BOOKMARK_CHANGED',
      payload: { event: 'removed', removeInfo },
    })
  }
)

// --- Setup ---

chrome.runtime.onInstalled.addListener(async () => {
  await syncBookmarkTree()
})

// Open full-page manager when extension icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('manager/index.html') })
})
