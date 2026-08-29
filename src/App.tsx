import { useState, useMemo, useCallback } from 'react'
import type { Bookmark, SortOption, BookmarkMetadata } from '@/types/bookmark'
import { useBrowserBookmarks } from '@/hooks/use-browser-bookmarks'
import { BookmarkCard } from '@/components/bookmark-card'
import { BookmarkForm } from '@/components/bookmark-form'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FolderPlus,
  Home,
  Plus,
  Search,
  Star,
} from 'lucide-react'

function App() {
  const {
    bookmarks,
    metadata,
    loading,
    folders,
    addBookmark,
    deleteBookmark,
    updateBookmark,
    createFolder,
    getChildren,
    setMeta,
  } = useBrowserBookmarks()

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [currentFolderId, setCurrentFolderId] = useState('1')
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'bookmark' | 'folder'>('bookmark')
  const [editingItem, setEditingItem] = useState<Bookmark | undefined>()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['1', '2']))
  const [sidebarSearch, setSidebarSearch] = useState('')

  const breadcrumbs = useMemo(() => {
    const path: Bookmark[] = []
    let current: Bookmark | undefined = bookmarks.find((b) => b.id === currentFolderId)
    while (current) {
      path.unshift(current)
      const parentId = current.parentId
      current = parentId ? bookmarks.find((b) => b.id === parentId) : undefined
    }
    return path
  }, [bookmarks, currentFolderId])

  const currentItems = useMemo(() => {
    let items = getChildren(currentFolderId)

    if (search) {
      const q = search.toLowerCase()
      items = items.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          (metadata[b.id]?.description?.toLowerCase().includes(q) ?? false) ||
          (metadata[b.id]?.tags?.some((t) => t.toLowerCase().includes(q)) ?? false)
      )
    }

    const foldersList = items.filter((b) => b.isFolder)
    const bookmarksList = items.filter((b) => !b.isFolder)

    const sortFn = (a: Bookmark, b: Bookmark) => {
      switch (sort) {
        case 'newest': return (b.dateAdded ?? 0) - (a.dateAdded ?? 0)
        case 'oldest': return (a.dateAdded ?? 0) - (b.dateAdded ?? 0)
        case 'alpha': return a.title.localeCompare(b.title)
        case 'alpha-reverse': return b.title.localeCompare(a.title)
        default: return 0
      }
    }

    foldersList.sort(sortFn)
    bookmarksList.sort(sortFn)
    return [...foldersList, ...bookmarksList]
  }, [bookmarks, currentFolderId, getChildren, metadata, search, sort])

  const sidebarFolders = useMemo(() => {
    let filtered = bookmarks.filter((b) => b.parentId === '0' && b.isFolder)
    if (sidebarSearch) {
      const q = sidebarSearch.toLowerCase()
      filtered = bookmarks.filter((b) => b.isFolder && b.title.toLowerCase().includes(q))
    }
    return filtered.sort((a, b) => a.title.localeCompare(b.title))
  }, [bookmarks, sidebarSearch])

  const getChildFolders = useCallback(
    (parentId: string): Bookmark[] => {
      return bookmarks
        .filter((b) => b.parentId === parentId && b.isFolder)
        .sort((a, b) => a.title.localeCompare(b.title))
    },
    [bookmarks]
  )

  function toggleFolderExpand(folderId: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) next.delete(folderId)
      else next.add(folderId)
      return next
    })
  }

  function handleEdit(bookmark: Bookmark) {
    setEditingItem(bookmark)
    setFormMode(bookmark.isFolder ? 'folder' : 'bookmark')
    setFormOpen(true)
  }

  function handleSaveBookmark(data: { title: string; url: string; parentId?: string }) {
    if (editingItem) {
      updateBookmark(editingItem.id, { title: data.title, url: data.url })
    } else {
      addBookmark({ title: data.title, url: data.url, parentId: data.parentId })
    }
    setEditingItem(undefined)
  }

  function handleSaveMetadata(id: string, meta: BookmarkMetadata) {
    setMeta(id, meta)
  }

  function handleSaveFolder(parentId: string, title: string) {
    if (editingItem) {
      updateBookmark(editingItem.id, { title })
    } else {
      createFolder(parentId, title)
    }
    setEditingItem(undefined)
  }

  function handleOpenChange(open: boolean) {
    setFormOpen(open)
    if (!open) setEditingItem(undefined)
  }

  function handleNavigate(folderId: string) {
    setCurrentFolderId(folderId)
    setSearch('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-3 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#64748b]">Loading bookmarks...</p>
        </div>
      </div>
    )
  }

  const bookmarkCount = currentItems.filter((b) => !b.isFolder).length

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden gap-4 p-4">
      {/* ===== SIDEBAR ===== */}
      <aside className="w-[260px] shrink-0 bg-white border-r border-[#e2e8f0] flex flex-col">
        {/* Logo area */}
        <div className="px-5 py-4 border-b border-[#e2e8f0]">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-[#6366f1] flex items-center justify-center">
              <Folder className="size-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-[#0f172a]">Bookmark Manager</h1>
              <p className="text-[11px] text-[#94a3b8]">Synced with Brave</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8] pointer-events-none" />
            <input
              type="text"
              placeholder="Search folders..."
              value={sidebarSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSidebarSearch(e.target.value)}
              className="w-full h-9 rounded-lg bg-[#f1f5f9] border-0 pl-9 pr-3 text-[13px] text-[#0f172a] placeholder-[#94a3b8] outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 text-[13px] min-h-0">
          <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">
            Quick Access
          </p>
          <button
            className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left transition-all ${
              currentFolderId === '1'
                ? 'bg-[#6366f1] text-white shadow-md shadow-[#6366f1]/25'
                : 'text-[#334155] hover:bg-[#f1f5f9]'
            }`}
            onClick={() => handleNavigate('1')}
          >
            <Home className="size-4 shrink-0" />
            Bookmarks Bar
          </button>
          <button
            className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left transition-all ${
              currentFolderId === '2'
                ? 'bg-[#6366f1] text-white shadow-md shadow-[#6366f1]/25'
                : 'text-[#334155] hover:bg-[#f1f5f9]'
            }`}
            onClick={() => handleNavigate('2')}
          >
            <Star className="size-4 shrink-0" />
            Other Bookmarks
          </button>

          <div className="my-3 border-t border-[#e2e8f0]" />

          <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">
            Folders
          </p>
          {sidebarFolders.length === 0 && (
            <p className="px-3 py-4 text-[12px] text-[#94a3b8] text-center">
              No custom folders yet
            </p>
          )}
          {sidebarFolders.map((folder) => (
            <FolderTreeItem
              key={folder.id}
              folder={folder}
              currentFolderId={currentFolderId}
              depth={0}
              onNavigate={handleNavigate}
              onToggle={toggleFolderExpand}
              expandedFolders={expandedFolders}
              getChildFolders={getChildFolders}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[#e2e8f0] shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 h-9 border-[#e2e8f0] text-[#334155] hover:bg-[#f1f5f9]"
            onClick={() => {
              setFormMode('folder')
              setFormOpen(true)
            }}
          >
            <FolderPlus className="size-4 shrink-0" />
            New Folder
          </Button>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="shrink-0 bg-white border-b border-[#e2e8f0] px-8 py-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-[#0f172a] tracking-tight">
                {breadcrumbs.length > 0
                  ? breadcrumbs[breadcrumbs.length - 1].title || 'Untitled'
                  : 'Bookmarks Bar'}
              </h1>
              <nav className="flex items-center gap-1 text-[12px] text-[#94a3b8] mt-1">
                <button
                  className="hover:text-[#6366f1] transition-colors"
                  onClick={() => handleNavigate('1')}
                >
                  Home
                </button>
                {breadcrumbs.map((b) => (
                  <span key={b.id} className="flex items-center gap-1">
                    <ChevronRight className="size-3" />
                    <button
                      className="hover:text-[#6366f1] transition-colors truncate max-w-[200px]"
                      onClick={() => handleNavigate(b.id)}
                    >
                      {b.title || 'Untitled'}
                    </button>
                  </span>
                ))}
              </nav>
            </div>
            <Badge
              variant="secondary"
              className="bg-[#f1f5f9] text-[#64748b] text-[11px] px-2.5 py-1 rounded-full"
            >
              {bookmarkCount} {bookmarkCount === 1 ? 'item' : 'items'}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8] pointer-events-none" />
              <input
                type="text"
                placeholder="Search bookmarks..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="w-full h-10 rounded-lg bg-[#f1f5f9] border-0 pl-10 pr-4 text-[13px] text-[#0f172a] placeholder-[#94a3b8] outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:bg-white transition-all"
              />
            </div>
            <select
              value={sort}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSort(e.target.value as SortOption)}
              className="h-10 rounded-lg border border-[#e2e8f0] bg-white px-3 text-[13px] text-[#334155] outline-none focus:ring-2 focus:ring-[#6366f1]/30 cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="alpha">A to Z</option>
              <option value="alpha-reverse">Z to A</option>
            </select>
            <Button
              onClick={() => {
                setFormMode('bookmark')
                setFormOpen(true)
              }}
              className="h-10 px-4 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-lg shadow-sm shadow-[#6366f1]/30 transition-all"
            >
              <Plus className="size-4 mr-1.5" />
              Add Bookmark
            </Button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-8">
          {currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="size-16 rounded-2xl bg-[#f1f5f9] flex items-center justify-center mb-4">
                <Folder className="size-8 text-[#cbd5e1]" />
              </div>
              <p className="text-[#334155] font-medium text-[15px]">
                {search ? 'No results found' : 'This folder is empty'}
              </p>
              <p className="text-[#94a3b8] text-[13px] mt-1.5 max-w-[280px]">
                {!search && 'Add bookmarks or create folders to organize your links'}
              </p>
              {!search && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 border-[#e2e8f0] text-[#334155]"
                  onClick={() => {
                    setFormMode('bookmark')
                    setFormOpen(true)
                  }}
                >
                  <Plus className="size-3.5 mr-1.5" />
                  Add your first bookmark
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {currentItems.map((item) => (
                <BookmarkCard
                  key={item.id}
                  bookmark={item}
                  metadata={metadata[item.id]}
                  onEdit={handleEdit}
                  onDelete={deleteBookmark}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <BookmarkForm
        open={formOpen}
        onOpenChange={handleOpenChange}
        onSaveBookmark={handleSaveBookmark}
        onSaveMetadata={handleSaveMetadata}
        onSaveFolder={handleSaveFolder}
        folders={folders}
        currentFolderId={currentFolderId}
        initialData={editingItem}
        initialMetadata={editingItem ? metadata[editingItem.id] : undefined}
        mode={formMode}
      />
    </div>
  )
}

function FolderTreeItem({
  folder,
  currentFolderId,
  depth,
  onNavigate,
  onToggle,
  expandedFolders,
  getChildFolders,
}: {
  folder: Bookmark
  currentFolderId: string
  depth: number
  onNavigate: (id: string) => void
  onToggle: (id: string) => void
  expandedFolders: Set<string>
  getChildFolders: (parentId: string) => Bookmark[]
}) {
  const isActive = folder.id === currentFolderId
  const isExpanded = expandedFolders.has(folder.id)
  const childFolders = getChildFolders(folder.id)
  const hasChildren = childFolders.length > 0

  return (
    <div>
      <button
        className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left transition-all ${
          isActive
            ? 'bg-[#6366f1] text-white shadow-md shadow-[#6366f1]/25'
            : 'text-[#334155] hover:bg-[#f1f5f9]'
        }`}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={() => onNavigate(folder.id)}
      >
        <span
          className="shrink-0"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
            onToggle(folder.id)
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )
          ) : (
            <span className="size-3.5 inline-block" />
          )}
        </span>
        {isActive ? (
          <FolderOpen className="size-4 shrink-0" />
        ) : (
          <Folder className="size-4 shrink-0" />
        )}
        <span className="truncate">{folder.title || 'Untitled'}</span>
      </button>
      {isExpanded &&
        childFolders.map((child) => (
          <FolderTreeItem
            key={child.id}
            folder={child}
            currentFolderId={currentFolderId}
            depth={depth + 1}
            onNavigate={onNavigate}
            onToggle={onToggle}
            expandedFolders={expandedFolders}
            getChildFolders={getChildFolders}
          />
        ))}
    </div>
  )
}

export default App
