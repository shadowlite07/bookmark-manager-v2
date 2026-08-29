import type { Bookmark, BookmarkMetadata } from '@/types/bookmark'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardHeader } from '@/components/ui/card'
import { Folder, Pencil, Trash2, Globe } from 'lucide-react'

interface BookmarkCardProps {
  bookmark: Bookmark
  metadata?: BookmarkMetadata
  onEdit: (bookmark: Bookmark) => void
  onDelete: (id: string) => void
  onNavigate?: (folderId: string) => void
}

function getFavicon(url: string) {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return null
  }
}

export function BookmarkCard({ bookmark, metadata, onEdit, onDelete, onNavigate }: BookmarkCardProps) {
  if (bookmark.isFolder) {
    return (
      <Card
        className="group cursor-pointer hover:shadow-lg hover:shadow-[#6366f1]/10 hover:border-[#6366f1]/30 transition-all duration-200 bg-white border-[#e2e8f0]"
        onClick={() => onNavigate?.(bookmark.id)}
      >
        <CardHeader className="p-5">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="size-12 rounded-xl bg-[#f0f4ff] flex items-center justify-center shrink-0 group-hover:bg-[#6366f1]/10 transition-colors">
              <Folder className="size-6 text-[#6366f1]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-[#0f172a] line-clamp-2 leading-snug">
                {bookmark.title || 'Untitled Folder'}
              </h3>
              <p className="text-xs text-[#94a3b8] mt-1">
                {bookmark.children.length} {bookmark.children.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <CardAction className="gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg hover:bg-[#f1f5f9]"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                onEdit(bookmark)
              }}
            >
              <Pencil className="size-4 text-[#64748b]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg hover:bg-red-50"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                onDelete(bookmark.id)
              }}
            >
              <Trash2 className="size-4 text-[#ef4444]" />
            </Button>
          </CardAction>
        </CardHeader>
      </Card>
    )
  }

  const favicon = getFavicon(bookmark.url)

  return (
    <Card className="group hover:shadow-lg hover:shadow-[#6366f1]/10 hover:border-[#6366f1]/30 transition-all duration-200 bg-white border-[#e2e8f0]">
      <CardHeader className="p-5">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="size-12 rounded-xl bg-[#f1f5f9] flex items-center justify-center shrink-0 overflow-hidden group-hover:bg-[#f0f4ff] transition-colors">
            {favicon ? (
              <img
                src={favicon}
                alt=""
                className="size-6"
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : null}
            <Globe className={`size-6 text-[#94a3b8] ${favicon ? 'hidden' : ''}`} />
          </div>
          <div className="flex-1 min-w-0">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group/link"
            >
              <h3 className="text-sm font-semibold text-[#0f172a] leading-snug line-clamp-2 group-hover/link:text-[#6366f1] transition-colors">
                {bookmark.title || bookmark.url}
              </h3>
            </a>
          </div>
        </div>
        <CardAction className="gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg hover:bg-[#f1f5f9]"
            onClick={() => onEdit(bookmark)}
          >
            <Pencil className="size-4 text-[#64748b]" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg hover:bg-red-50"
            onClick={() => onDelete(bookmark.id)}
          >
            <Trash2 className="size-4 text-[#ef4444]" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        <div className="flex flex-col gap-2">
          {metadata?.description && (
            <p className="text-xs text-[#64748b] line-clamp-2 leading-relaxed">
              {metadata.description}
            </p>
          )}
          <p
            className="text-[11px] text-[#94a3b8] break-words line-clamp-1 font-mono"
            title={bookmark.url}
          >
            {bookmark.url}
          </p>
          {metadata?.tags && metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {metadata.tags.map((tag) => (
                <Badge
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-[#f0f4ff] text-[#6366f1] border-0 font-medium"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
