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

  useEffect(() => {
    if (open) {
      setTitle(initialData?.title ?? '')
      setUrl(initialData?.url ?? '')
      setDescription(initialMetadata?.description ?? '')
      setTags(initialMetadata?.tags?.join(', ') ?? '')
      setParentId(initialData?.parentId ?? currentFolderId)
    }
  }, [open, initialData, initialMetadata, currentFolderId])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (mode === 'folder') {
      onSaveFolder?.(parentId, title)
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
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 gap-0 rounded-2xl border-[#e2e8f0] shadow-xl overflow-hidden">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-[16px] font-semibold text-[#0f172a]">
              {mode === 'folder'
                ? initialData ? 'Edit Folder' : 'New Folder'
                : initialData ? 'Edit Bookmark' : 'Add Bookmark'}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#94a3b8]">
              {mode === 'folder'
                ? 'Organize your bookmarks into folders.'
                : 'Save a new bookmark to your browser.'}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-4 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="title" className="text-[12px] font-medium text-[#334155]">
                Name
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                placeholder={mode === 'folder' ? 'Folder name' : 'My Bookmark'}
                required
                className="w-full h-10 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] text-[#0f172a] placeholder-[#94a3b8] outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] transition-all"
              />
            </div>

            {mode === 'bookmark' && (
              <div className="space-y-1.5">
                <label htmlFor="url" className="text-[12px] font-medium text-[#334155]">
                  URL
                </label>
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  className="w-full h-10 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] text-[#0f172a] placeholder-[#94a3b8] outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] transition-all"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="parent" className="text-[12px] font-medium text-[#334155]">
                Location
              </label>
              <select
                id="parent"
                value={parentId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setParentId(e.target.value)}
                className="w-full h-10 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] text-[#334155] outline-none focus:ring-2 focus:ring-[#6366f1]/30 cursor-pointer"
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
                <div className="space-y-1.5">
                  <label htmlFor="description" className="text-[12px] font-medium text-[#334155]">
                    Description <span className="text-[#94a3b8] font-normal">(optional)</span>
                  </label>
                  <input
                    id="description"
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                    placeholder="A brief description"
                    className="w-full h-10 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] text-[#0f172a] placeholder-[#94a3b8] outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="tags" className="text-[12px] font-medium text-[#334155]">
                    Tags <span className="text-[#94a3b8] font-normal">(comma separated)</span>
                  </label>
                  <input
                    id="tags"
                    value={tags}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTags(e.target.value)}
                    placeholder="react, typescript, web"
                    className="w-full h-10 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] text-[#0f172a] placeholder-[#94a3b8] outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] transition-all"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="px-6 py-4 bg-[#f8fafc] border-t border-[#e2e8f0] gap-2">
            <Button
              type="button"
              variant="ghost"
              className="text-[#64748b] hover:text-[#334155] hover:bg-[#f1f5f9]"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-lg shadow-sm shadow-[#6366f1]/30"
            >
              {initialData ? 'Save Changes' : mode === 'folder' ? 'Create Folder' : 'Add Bookmark'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
