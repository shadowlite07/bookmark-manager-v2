import type { Bookmark, BookmarkMetadata } from '@/types/bookmark'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardHeader } from '@/components/ui/card'
import { folderAccent } from '@/lib/utils'
import { Pencil, Trash2, Globe, ChevronRight } from 'lucide-react'
import { getIconByName } from '@/components/icon-picker'

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
    const accent = folderAccent(bookmark.id)
    const FolderIcon = getIconByName(metadata?.icon)
    return (
      <Card
        className="group relative h-full cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-[#c7d2fe] transition-all duration-200 bg-white rounded-2xl overflow-hidden"
        onClick={() => onNavigate?.(bookmark.id)}
      >
        <CardHeader className="p-5">
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            <div
              className={`size-12 rounded-xl bg-gradient-to-br ${accent.bg} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105`}
            >
              <FolderIcon className="size-6" style={{ color: accent.icon }} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="text-[14px] font-semibold text-[#0f172a] line-clamp-2 leading-snug group-hover:text-[#4f46e5] transition-colors pr-6">
                {bookmark.title || 'Untitled Folder'}
              </h3>
              <p className="text-[12px] text-[#94a3b8] mt-1">
                {bookmark.children.length} {bookmark.children.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <CardAction className="gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg hover:bg-[#f1f5f9]"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                onEdit(bookmark)
              }}
            >
              <Pencil className="size-3.5 text-[#64748b]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg hover:bg-red-50"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                onDelete(bookmark.id)
              }}
            >
              <Trash2 className="size-3.5 text-[#ef4444]" />
            </Button>
          </CardAction>
          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-[#cbd5e1] group-hover:opacity-0 transition-opacity" />
        </CardHeader>
      </Card>
    )
  }

  const favicon = getFavicon(bookmark.url)

  return (
    <Card className="group h-full hover:shadow-md hover:-translate-y-0.5 hover:border-[#c7d2fe] transition-all duration-200 bg-white rounded-2xl overflow-hidden">
      <CardHeader className="p-5">
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          <div className="size-12 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center shrink-0 overflow-hidden">
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
          <div className="flex-1 min-w-0 pt-0.5">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group/link"
            >
              <h3 className="text-[14px] font-semibold text-[#0f172a] leading-snug line-clamp-2 group-hover/link:text-[#4f46e5] transition-colors">
                {bookmark.title || bookmark.url}
              </h3>
            </a>
          </div>
        </div>
        <CardAction className="gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg hover:bg-[#f1f5f9]"
            onClick={() => onEdit(bookmark)}
          >
            <Pencil className="size-3.5 text-[#64748b]" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg hover:bg-red-50"
            onClick={() => onDelete(bookmark.id)}
          >
            <Trash2 className="size-3.5 text-[#ef4444]" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        <div className="flex flex-col gap-2.5">
          {metadata?.description && (
            <p className="text-[12px] text-[#64748b] line-clamp-2 leading-relaxed">
              {metadata.description}
            </p>
          )}
          <p
            className="text-[11px] text-[#94a3b8] break-words line-clamp-1 font-mono bg-[#f8fafc] border border-[#e2e8f0]/70 px-2.5 py-1.5 rounded-lg"
            title={bookmark.url}
          >
            {bookmark.url}
          </p>
          {metadata?.tags && metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {metadata.tags.map((tag) => (
                <Badge
                  key={tag}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-[#f0f4ff] text-[#6366f1] border-0 font-semibold"
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
