// Background service worker for Memex extension
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
  // getTree() always returns a single-element array: [trueRoot]. trueRoot's
  // own id is browser-specific and irrelevant to us — Chrome/Edge use "0",
  // Firefox uses a different id entirely (not "0"). Rather than guess at
  // that id, we skip trueRoot itself and flatten starting from ITS
  // children, explicitly normalizing them onto our own universal parent id
  // "0" — the id every part of this extension actually keys off of.
  const trueRoot = tree[0]
  const flat = trueRoot?.children ? flattenTree(trueRoot.children, '0') : []
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
  icon?: string
  favorite?: boolean
}

function flattenTree(
  nodes: chrome.bookmarks.BookmarkTreeNode[],
  parentId: string
): FlatBookmark[] {
  const result: FlatBookmark[] = []
  for (const node of nodes) {
    result.push({
      id: node.id,
      // Always use the parentId we recursed down with, not node.parentId —
      // we're reconstructing the tree top-down from `children` arrays
      // ourselves, so we already know the correct parent at every level.
      // Trusting the browser's own node.parentId here is what let Firefox's
      // real (non-"0") root id leak in and break everything downstream.
      parentId,
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
      // Promise form (no callback) works in both Chrome MV3 and Firefox, and
      // lets us actually catch and report failures — e.g. an invalid
      // parentId — instead of a callback that silently never fires.
      chrome.bookmarks
        .create({ parentId, title, url })
        .then((node: chrome.bookmarks.BookmarkTreeNode) => sendResponse(node))
        .catch((err: unknown) =>
          sendResponse({ error: err instanceof Error ? err.message : String(err) })
        )
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
      chrome.bookmarks
        .update(id, changes)
        .then((node: chrome.bookmarks.BookmarkTreeNode) => sendResponse(node))
        .catch((err: unknown) =>
          sendResponse({ error: err instanceof Error ? err.message : String(err) })
        )
      return true
    }

    if (message.type === 'REMOVE_BOOKMARK') {
      const { id } = message.payload as { id: string }
      setAppActionFlag()
      chrome.bookmarks
        .remove(id)
        .then(() => sendResponse({ ok: true }))
        .catch((err: unknown) =>
          sendResponse({ error: err instanceof Error ? err.message : String(err) })
        )
      return true
    }

    if (message.type === 'CREATE_FOLDER') {
      const { parentId, title } = message.payload as {
        parentId: string
        title: string
      }
      setAppActionFlag()
      chrome.bookmarks
        .create({ parentId, title })
        .then((node: chrome.bookmarks.BookmarkTreeNode) => sendResponse(node))
        .catch((err: unknown) =>
          sendResponse({ error: err instanceof Error ? err.message : String(err) })
        )
      return true
    }

    if (message.type === 'MOVE_BOOKMARK') {
      const { id, parentId, index } = message.payload as {
        id: string
        parentId: string
        index: number
      }
      setAppActionFlag()
      chrome.bookmarks
        .move(id, { parentId, index })
        .then((node: chrome.bookmarks.BookmarkTreeNode) => sendResponse(node))
        .catch((err: unknown) =>
          sendResponse({ error: err instanceof Error ? err.message : String(err) })
        )
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
