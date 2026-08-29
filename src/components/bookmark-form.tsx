import { useState, useEffect } from 'react'
import type { Bookmark, BookmarkMetadata } from '@/types/bookmark'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { IconPicker } from '@/components/icon-picker'

interface BookmarkFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveBookmark: (data: { title: string; url: string; parentId?: string }) => void
  onSaveMetadata?: (id: string, metadata: BookmarkMetadata) => void
  onSaveFolder?: (parentId: string, title: string) => void
  folders: Bookmark[]
  currentFolderId: string
  initialData?: Bookmark
  initialMetadata?: BookmarkMetadata
  mode: 'bookmark' | 'folder'
}

export function BookmarkForm({
  open,
  onOpenChange,
  onSaveBookmark,
  onSaveMetadata,
  onSaveFolder,
  folders,
  currentFolderId,
  initialData,
  initialMetadata,
  mode,
}: BookmarkFormProps) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [parentId, setParentId] = useState(currentFolderId)
  const [icon, setIcon] = useState('')

  useEffect(() => {
    if (open) {
      setTitle(initialData?.title ?? '')
      setUrl(initialData?.url ?? '')
      setDescription(initialMetadata?.description ?? '')
      setTags(initialMetadata?.tags?.join(', ') ?? '')
      setParentId(initialData?.parentId ?? currentFolderId)
      setIcon(initialMetadata?.icon ?? '')
    }
  }, [open, initialData, initialMetadata, currentFolderId])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (mode === 'folder') {
      onSaveFolder?.(parentId, title)
      if (initialData && onSaveMetadata) {
        onSaveMetadata(initialData.id, {
          tags: initialMetadata?.tags ?? [],
          description: initialMetadata?.description ?? '',
          icon: icon || undefined,
        })
      }
    } else {
      onSaveBookmark({ title, url, parentId })
      if (initialData && onSaveMetadata) {
        onSaveMetadata(initialData.id, {
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          description,
        })
      }
    }

    setTitle('')
    setUrl('')
    setDescription('')
    setTags('')
    setIcon('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 gap-0 rounded-2xl border-[#e2e8f0]/80 shadow-2xl overflow-hidden">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-[17px] font-bold text-[#0f172a] tracking-tight">
              {mode === 'folder'
                ? initialData ? 'Edit Folder' : 'Create New Folder'
                : initialData ? 'Edit Bookmark' : 'Add New Bookmark'}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#94a3b8]">
              {mode === 'folder'
                ? 'Organize your bookmarks into folders.'
                : 'Save a new bookmark to your collection.'}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-4 space-y-4">
            {mode === 'folder' && (
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#334155] uppercase tracking-wide">
                  Icon
                </label>
                <IconPicker value={icon} onChange={setIcon} />
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="title" className="text-[12px] font-bold text-[#334155] uppercase tracking-wide">
                Name
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                placeholder={mode === 'folder' ? 'Folder name' : 'My Bookmark'}
                required
                className="w-full h-11 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-[13px] text-[#0f172a] placeholder-[#94a3b8] outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
              />
            </div>

            {mode === 'bookmark' && (
              <div className="space-y-2">
                <label htmlFor="url" className="text-[12px] font-bold text-[#334155] uppercase tracking-wide">
                  URL
                </label>
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  className="w-full h-11 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-[13px] text-[#0f172a] placeholder-[#94a3b8] outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                />
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="parent" className="text-[12px] font-bold text-[#334155] uppercase tracking-wide">
                Location
              </label>
              <select
                id="parent"
                value={parentId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setParentId(e.target.value)}
                className="w-full h-11 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-[13px] text-[#334155] outline-none focus:ring-2 focus:ring-[#6366f1]/20 cursor-pointer transition-all duration-200"
              >
                <option value="1">Bookmarks Bar</option>
                <option value="2">Other Bookmarks</option>
                {folders
                  .filter((f) => f.id !== '1' && f.id !== '2')
                  .map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.title || 'Untitled Folder'}
                    </option>
                  ))}
              </select>
            </div>

            {mode === 'bookmark' && (
              <>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-[12px] font-bold text-[#334155] uppercase tracking-wide">
                    Description <span className="text-[#94a3b8] font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    id="description"
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                    placeholder="A brief description"
                    className="w-full h-11 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-[13px] text-[#0f172a] placeholder-[#94a3b8] outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="tags" className="text-[12px] font-bold text-[#334155] uppercase tracking-wide">
                    Tags <span className="text-[#94a3b8] font-normal lowercase">(comma separated)</span>
                  </label>
                  <input
                    id="tags"
                    value={tags}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTags(e.target.value)}
                    placeholder="react, typescript, web"
                    className="w-full h-11 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-[13px] text-[#0f172a] placeholder-[#94a3b8] outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="px-6 py-4 bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]/50 border-t border-[#e2e8f0]/80 gap-3">
            <Button
              type="button"
              variant="ghost"
              className="text-[#64748b] hover:text-[#334155] hover:bg-[#f1f5f9] rounded-xl h-10 px-5 font-medium"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-[#6366f1] to-[#818cf8] hover:from-[#4f46e5] hover:to-[#6366f1] text-white rounded-xl shadow-lg shadow-[#6366f1]/25 h-10 px-5 font-medium transition-all duration-200"
            >
              {initialData ? 'Save Changes' : mode === 'folder' ? 'Create Folder' : 'Add Bookmark'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
