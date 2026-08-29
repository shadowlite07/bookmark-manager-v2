import { useState, useMemo, useCallback, useRef } from 'react'
import type { Bookmark, SortOption, BookmarkMetadata } from '@/types/bookmark'
import { useBrowserBookmarks } from '@/hooks/use-browser-bookmarks'
import { BookmarkCard } from '@/components/bookmark-card'
import { BookmarkForm } from '@/components/bookmark-form'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { folderAccent } from '@/lib/utils'
import { getIconByName } from '@/components/icon-picker'
import {
  ChevronRight,
  ChevronDown,
  Download,
  Folder,
  FolderOpen,
  FolderPlus,
  Home,
  Heart,
  Plus,
  Search,
  Star,
  Tag,
  Upload,
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
  const [filterFavorite, setFilterFavorite] = useState(false)
  const [filterTag, setFilterTag] = useState('')
  const importFileRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      bookmarks: bookmarks.map((b) => ({
        ...b,
        metadata: metadata[b.id],
      })),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookmarks-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data.bookmarks || !Array.isArray(data.bookmarks)) {
        alert('Invalid bookmark file format')
        return
      }

      let imported = 0
      for (const item of data.bookmarks) {
        if (item.isFolder) {
          const existing = bookmarks.find((b) => b.id === item.id)
          if (!existing) {
            await createFolder(item.parentId || '1', item.title)
            imported++
          }
        } else {
          const existing = bookmarks.find((b) => b.id === item.id)
          if (!existing) {
            await addBookmark({ title: item.title, url: item.url, parentId: item.parentId || '1' })
            imported++
          }
        }
        if (item.metadata) {
          await setMeta(item.id, {
            tags: item.metadata.tags ?? [],
            description: item.metadata.description ?? '',
            icon: item.metadata.icon,
            favorite: item.metadata.favorite,
          })
        }
      }
      alert(`Imported ${imported} new bookmarks`)
    } catch {
      alert('Failed to parse bookmark file')
    }
  }

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
    let items: Bookmark[]

    if (currentFolderId === 'favorites') {
      items = bookmarks.filter((b) => metadata[b.id]?.favorite)
    } else {
      items = getChildren(currentFolderId)
    }

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

    if (filterFavorite) {
      items = items.filter((b) => metadata[b.id]?.favorite)
    }

    if (filterTag) {
      const tq = filterTag.toLowerCase()
      items = items.filter((b) => metadata[b.id]?.tags?.some((t) => t.toLowerCase().includes(tq)))
    }

    const sortFn = (a: Bookmark, b: Bookmark) => {
      switch (sort) {
        case 'newest': return (b.dateAdded ?? 0) - (a.dateAdded ?? 0)
        case 'oldest': return (a.dateAdded ?? 0) - (b.dateAdded ?? 0)
        case 'alpha': return a.title.localeCompare(b.title)
        case 'alpha-reverse': return b.title.localeCompare(a.title)
        default: return 0
      }
    }

    const foldersList = items.filter((b) => b.isFolder).sort(sortFn)
    const bookmarksList = items.filter((b) => !b.isFolder).sort(sortFn)
    return [...foldersList, ...bookmarksList]
  }, [bookmarks, currentFolderId, getChildren, metadata, search, sort, filterFavorite, filterTag])

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

  async function handleSaveBookmark(data: { title: string; url: string; parentId?: string }) {
    if (editingItem) {
      await updateBookmark(editingItem.id, { title: data.title, url: data.url })
      setEditingItem(undefined)
      return editingItem.id
    } else {
      const id = await addBookmark({ title: data.title, url: data.url, parentId: data.parentId })
      setEditingItem(undefined)
      return id
    }
  }

  function handleSaveMetadata(id: string, meta: BookmarkMetadata) {
    setMeta(id, meta)
  }

  async function handleSaveFolder(parentId: string, title: string) {
    if (editingItem) {
      await updateBookmark(editingItem.id, { title })
      setEditingItem(undefined)
      return editingItem.id
    } else {
      const id = await createFolder(parentId, title)
      setEditingItem(undefined)
      return id
    }
  }

  function handleOpenChange(open: boolean) {
    setFormOpen(open)
    if (!open) setEditingItem(undefined)
  }

  function handleNavigate(folderId: string) {
    setCurrentFolderId(folderId)
    setSearch('')
    setFilterFavorite(false)
    setFilterTag('')
  }

  function handleToggleFavorite(id: string, favorite: boolean) {
    const existing = metadata[id]
    setMeta(id, {
      tags: existing?.tags ?? [],
      description: existing?.description ?? '',
      icon: existing?.icon,
      favorite,
    })
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
                allMetadata={metadata}
                currentFolderId={currentFolderId}
                depth={0}
                onNavigate={handleNavigate}
                onToggle={toggleFolderExpand}
                onToggleFavorite={handleToggleFavorite}
                expandedFolders={expandedFolders}
                getChildFolders={getChildFolders}
              />
            ))}
          </div>
        </nav>

        {/* Footer */}
      </aside>

      {/* ===== MAIN ===== */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="shrink-0 bg-white/80 backdrop-blur-sm border-b border-[#e2e8f0]/80 px-8 py-5">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-[22px] font-bold text-[#0f172a] tracking-tight">
                  {currentFolderId === 'favorites'
                    ? 'Favorites'
                    : breadcrumbs.length > 0
                      ? breadcrumbs[breadcrumbs.length - 1].title || 'Untitled'
                      : 'Bookmarks Bar'}
                </h1>
                <div className="flex items-center gap-1">
                  <input
                    type="file"
                    ref={importFileRef}
                    className="hidden"
                    accept=".json"
                    onChange={handleImportFile}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg text-[#94a3b8] hover:text-[#6366f1] hover:bg-[#f1f5f9]"
                    title="Export bookmarks"
                    onClick={handleExport}
                  >
                    <Download className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg text-[#94a3b8] hover:text-[#6366f1] hover:bg-[#f1f5f9]"
                    title="Import bookmarks"
                    onClick={() => importFileRef.current?.click()}
                  >
                    <Upload className="size-4" />
                  </Button>
                </div>
              </div>
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
              <Button
                variant="ghost"
                size="icon"
                className={`size-10 rounded-xl transition-all duration-200 ${
                  currentFolderId === '1'
                    ? 'bg-[#6366f1]/10 text-[#6366f1]'
                    : 'text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#334155]'
                }`}
                title="Bookmarks Bar"
                onClick={() => handleNavigate('1')}
              >
                <Home className="size-4.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`size-10 rounded-xl transition-all duration-200 ${
                  currentFolderId === '2'
                    ? 'bg-[#6366f1]/10 text-[#6366f1]'
                    : 'text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#334155]'
                }`}
                title="Other Bookmarks"
                onClick={() => handleNavigate('2')}
              >
                <Star className="size-4.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`size-10 rounded-xl transition-all duration-200 ${
                  currentFolderId === 'favorites'
                    ? 'bg-[#ef4444]/10 text-[#ef4444]'
                    : 'text-[#64748b] hover:bg-[#fef2f2] hover:text-[#ef4444]'
                }`}
                title="Favorites"
                onClick={() => handleNavigate('favorites')}
              >
                <Heart className="size-4.5" />
              </Button>
              <div className="w-px h-6 bg-[#e2e8f0] mx-1" />
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
                placeholder={currentFolderId === 'favorites' ? 'Search favorites...' : 'Search bookmarks...'}
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="w-full h-11 rounded-xl bg-[#f1f5f9]/80 border border-transparent pl-10 pr-4 text-[13px] text-[#0f172a] placeholder-[#94a3b8] outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:bg-white focus:border-[#6366f1]/30 transition-all duration-200"
              />
            </div>
            <button
              onClick={() => setFilterFavorite((f) => !f)}
              className={`h-11 px-4 rounded-xl text-[13px] font-medium flex items-center gap-2 border transition-all duration-200 ${
                filterFavorite
                  ? 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]'
                  : 'bg-white border-[#e2e8f0] text-[#64748b] hover:border-[#ef4444]/30 hover:text-[#ef4444]'
              }`}
            >
              <Heart className={`size-3.5 ${filterFavorite ? 'fill-[#ef4444]' : ''}`} />
              Favourite
            </button>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#94a3b8] pointer-events-none" />
              <input
                type="text"
                placeholder="Filter by tag..."
                value={filterTag}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterTag(e.target.value)}
                className="h-11 w-44 rounded-xl border border-[#e2e8f0] bg-white pl-9 pr-3 text-[13px] text-[#334155] placeholder-[#94a3b8] outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]/30 transition-all duration-200"
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
                setFormMode('folder')
                setFormOpen(true)
              }}
              className="h-11 px-5 bg-gradient-to-r from-[#059669] to-[#10b981] hover:from-[#047857] hover:to-[#059669] text-white rounded-xl shadow-lg shadow-[#059669]/25 hover:shadow-xl hover:shadow-[#059669]/30 transition-all duration-200 font-medium"
            >
              <FolderPlus className="size-4 mr-2" strokeWidth={2.5} />
              New Folder
            </Button>
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
                {currentFolderId === 'favorites' ? (
                  <Heart className="size-10 text-[#cbd5e1]" />
                ) : (
                  <Folder className="size-10 text-[#cbd5e1]" />
                )}
              </div>
              <p className="text-[#334155] font-semibold text-[16px]">
                {search || filterFavorite || filterTag
                  ? 'No results found'
                  : currentFolderId === 'favorites'
                    ? 'No favorites yet'
                    : 'This folder is empty'}
              </p>
              <p className="text-[#94a3b8] text-[13px] mt-1.5 max-w-[300px] leading-relaxed">
                {search || filterFavorite || filterTag
                  ? 'Try adjusting your search terms or filters'
                  : currentFolderId === 'favorites'
                    ? 'Click the heart icon on any bookmark to add it to favorites'
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
                  onToggleFavorite={handleToggleFavorite}
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
  allMetadata,
  currentFolderId,
  depth,
  onNavigate,
  onToggle,
  onToggleFavorite,
  expandedFolders,
  getChildFolders,
}: {
  folder: Bookmark
  allMetadata: Record<string, BookmarkMetadata>
  currentFolderId: string
  depth: number
  onNavigate: (id: string) => void
  onToggle: (id: string) => void
  onToggleFavorite: (id: string, favorite: boolean) => void
  expandedFolders: Set<string>
  getChildFolders: (parentId: string) => Bookmark[]
}) {
  const isActive = folder.id === currentFolderId
  const isExpanded = expandedFolders.has(folder.id)
  const childFolders = getChildFolders(folder.id)
  const hasChildren = childFolders.length > 0
  const accent = folderAccent(folder.id)
  const FolderIcon = getIconByName(allMetadata[folder.id]?.icon)
  const isFavorite = !!allMetadata[folder.id]?.favorite

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
          <FolderIcon className="size-4 shrink-0" style={{ color: accent.icon }} />
        )}
        <span className="truncate font-medium flex-1">{folder.title || 'Untitled'}</span>
        <span
          className={`shrink-0 cursor-pointer rounded-md p-0.5 transition-all ${
            isActive ? 'hover:bg-white/20' : 'hover:bg-[#e2e8f0] opacity-0 group-hover:opacity-100'
          }`}
          style={{ opacity: isFavorite ? 1 : undefined }}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
            onToggleFavorite(folder.id, !isFavorite)
          }}
        >
          <Heart
            className={`size-3.5 transition-colors ${
              isFavorite
                ? 'fill-[#ef4444] text-[#ef4444]'
                : isActive ? 'text-white/50 hover:text-[#ef4444]' : 'text-[#cbd5e1] hover:text-[#ef4444]'
            }`}
          />
        </span>
      </button>
      {isExpanded &&
        childFolders.map((child) => (
          <FolderTreeItem
            key={child.id}
            folder={child}
            allMetadata={allMetadata}
            currentFolderId={currentFolderId}
            depth={depth + 1}
            onNavigate={onNavigate}
            onToggle={onToggle}
            onToggleFavorite={onToggleFavorite}
            expandedFolders={expandedFolders}
            getChildFolders={getChildFolders}
          />
        ))}
    </div>
  )
}

export default App
