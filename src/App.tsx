import { useState, useMemo, useCallback } from 'react'
import type { Bookmark, SortOption, BookmarkMetadata } from '@/types/bookmark'
import { useBrowserBookmarks } from '@/hooks/use-browser-bookmarks'
import { BookmarkCard } from '@/components/bookmark-card'
import { BookmarkForm } from '@/components/bookmark-form'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { folderAccent } from '@/lib/utils'
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
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#f0f4ff]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="size-12 border-3 border-[#e2e8f0] border-t-[#6366f1] rounded-full animate-spin" />
            <div className="absolute inset-0 size-12 border-3 border-transparent border-b-[#818cf8] rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[#334155]">Loading bookmarks</p>
            <p className="text-xs text-[#94a3b8] mt-0.5">Syncing with your browser...</p>
          </div>
        </div>
      </div>
    )
  }

  const bookmarkCount = currentItems.filter((b) => !b.isFolder).length
  const folderCount = currentItems.filter((b) => b.isFolder).length

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#f8fafc] via-[#f8fafc] to-[#f0f4ff]/50 overflow-hidden">
      {/* ===== SIDEBAR ===== */}
      <aside className="w-[280px] shrink-0 bg-white/80 backdrop-blur-sm border-r border-[#e2e8f0]/80 flex flex-col shadow-sm">
        {/* Logo area */}
        <div className="px-5 py-5 border-b border-[#e2e8f0]/80">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#818cf8] flex items-center justify-center shadow-lg shadow-[#6366f1]/20">
              <Folder className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-[#0f172a] tracking-tight">Bookmark Manager</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[11px] text-[#94a3b8] font-medium">Synced with Brave</p>
              </div>
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
              className="w-full h-9 rounded-xl bg-[#f1f5f9]/80 border border-transparent pl-9 pr-3 text-[13px] text-[#0f172a] placeholder-[#94a3b8] outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:bg-white focus:border-[#6366f1]/30 transition-all duration-200"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 text-[13px] min-h-0">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#94a3b8]">
            Quick Access
          </p>
          <div className="space-y-1">
            <button
              className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                currentFolderId === '1'
                  ? 'bg-gradient-to-r from-[#6366f1] to-[#818cf8] text-white shadow-lg shadow-[#6366f1]/25'
                  : 'text-[#334155] hover:bg-[#f1f5f9] hover:text-[#0f172a]'
              }`}
              onClick={() => handleNavigate('1')}
            >
              <Home className="size-4 shrink-0" />
              <span className="font-medium">Bookmarks Bar</span>
            </button>
            <button
              className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                currentFolderId === '2'
                  ? 'bg-gradient-to-r from-[#6366f1] to-[#818cf8] text-white shadow-lg shadow-[#6366f1]/25'
                  : 'text-[#334155] hover:bg-[#f1f5f9] hover:text-[#0f172a]'
              }`}
              onClick={() => handleNavigate('2')}
            >
              <Star className="size-4 shrink-0" />
              <span className="font-medium">Other Bookmarks</span>
            </button>
          </div>

          <div className="my-5 mx-3 border-t border-[#e2e8f0]/60" />

          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#94a3b8]">
            Folders
          </p>
          {sidebarFolders.length === 0 && (
            <div className="px-3 py-6 text-center">
              <div className="size-10 rounded-xl bg-[#f1f5f9] flex items-center justify-center mx-auto mb-2">
                <Folder className="size-5 text-[#cbd5e1]" />
              </div>
              <p className="text-[12px] text-[#94a3b8]">No custom folders yet</p>
            </div>
          )}
          <div className="space-y-1">
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
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[#e2e8f0]/80 shrink-0 bg-white/50">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2.5 h-10 border-[#e2e8f0] text-[#334155] hover:bg-[#f1f5f9] hover:border-[#6366f1]/30 rounded-xl transition-all duration-200"
            onClick={() => {
              setFormMode('folder')
              setFormOpen(true)
            }}
          >
            <FolderPlus className="size-4 shrink-0" />
            <span className="font-medium">New Folder</span>
          </Button>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="shrink-0 bg-white/80 backdrop-blur-sm border-b border-[#e2e8f0]/80 px-8 py-5">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="min-w-0 flex-1">
              <h1 className="text-[22px] font-bold text-[#0f172a] tracking-tight">
                {breadcrumbs.length > 0
                  ? breadcrumbs[breadcrumbs.length - 1].title || 'Untitled'
                  : 'Bookmarks Bar'}
              </h1>
              <nav className="flex items-center gap-1 text-[12px] text-[#94a3b8] mt-1.5">
                <button
                  className="hover:text-[#6366f1] transition-colors font-medium"
                  onClick={() => handleNavigate('1')}
                >
                  Home
                </button>
                {breadcrumbs.map((b) => (
                  <span key={b.id} className="flex items-center gap-1">
                    <ChevronRight className="size-3 text-[#cbd5e1]" />
                    <button
                      className="hover:text-[#6366f1] transition-colors truncate max-w-[200px] font-medium"
                      onClick={() => handleNavigate(b.id)}
                    >
                      {b.title || 'Untitled'}
                    </button>
                  </span>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2">
              {folderCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-[#f0f4ff] text-[#6366f1] text-[11px] px-2.5 py-1 rounded-lg font-medium"
                >
                  {folderCount} {folderCount === 1 ? 'folder' : 'folders'}
                </Badge>
              )}
              <Badge
                variant="secondary"
                className="bg-[#f1f5f9] text-[#64748b] text-[11px] px-2.5 py-1 rounded-lg font-medium"
              >
                {bookmarkCount} {bookmarkCount === 1 ? 'bookmark' : 'bookmarks'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8] pointer-events-none" />
              <input
                type="text"
                placeholder="Search bookmarks..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="w-full h-11 rounded-xl bg-[#f1f5f9]/80 border border-transparent pl-10 pr-4 text-[13px] text-[#0f172a] placeholder-[#94a3b8] outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:bg-white focus:border-[#6366f1]/30 transition-all duration-200"
              />
            </div>
            <select
              value={sort}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSort(e.target.value as SortOption)}
              className="h-11 rounded-xl border border-[#e2e8f0] bg-white px-4 text-[13px] font-medium text-[#334155] outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]/30 cursor-pointer transition-all duration-200"
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
              className="h-11 px-5 bg-gradient-to-r from-[#6366f1] to-[#818cf8] hover:from-[#4f46e5] hover:to-[#6366f1] text-white rounded-xl shadow-lg shadow-[#6366f1]/25 hover:shadow-xl hover:shadow-[#6366f1]/30 transition-all duration-200 font-medium"
            >
              <Plus className="size-4 mr-2" strokeWidth={2.5} />
              Add Bookmark
            </Button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-8 py-7">
          {currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="size-20 rounded-2xl bg-gradient-to-br from-[#f1f5f9] to-[#f0f4ff] flex items-center justify-center mb-5 shadow-inner">
                <Folder className="size-10 text-[#cbd5e1]" />
              </div>
              <p className="text-[#334155] font-semibold text-[16px]">
                {search ? 'No results found' : 'This folder is empty'}
              </p>
              <p className="text-[#94a3b8] text-[13px] mt-1.5 max-w-[300px] leading-relaxed">
                {search
                  ? 'Try adjusting your search terms or check a different folder'
                  : 'Add bookmarks or create folders to organize your links'}
              </p>
              {!search && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-5 border-[#e2e8f0] text-[#334155] hover:bg-[#f1f5f9] hover:border-[#6366f1]/30 rounded-xl h-10 px-5 font-medium"
                  onClick={() => {
                    setFormMode('bookmark')
                    setFormOpen(true)
                  }}
                >
                  <Plus className="size-4 mr-2" />
                  Add your first bookmark
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start max-w-[1600px]">
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
  const accent = folderAccent(folder.id)

  return (
    <div>
      <button
        className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
          isActive
            ? 'bg-gradient-to-r from-[#6366f1] to-[#818cf8] text-white shadow-md shadow-[#6366f1]/20'
            : 'text-[#334155] hover:bg-[#f1f5f9] hover:text-[#0f172a]'
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
            <div className={`size-5 rounded-md flex items-center justify-center transition-colors ${
              isActive ? 'bg-white/20' : 'hover:bg-[#e2e8f0]'
            }`}>
              {isExpanded ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
            </div>
          ) : (
            <span className="size-3.5 inline-block" />
          )}
        </span>
        {isActive ? (
          <FolderOpen className="size-4 shrink-0" />
        ) : (
          <Folder className="size-4 shrink-0" style={{ color: accent.icon }} />
        )}
        <span className="truncate font-medium">{folder.title || 'Untitled'}</span>
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
