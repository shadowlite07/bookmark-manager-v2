import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// A small rotating palette used to give folders a distinct, recognizable
// color so a screen full of similarly-named folders stays scannable.
const FOLDER_ACCENTS = [
  { bg: 'from-[#eef2ff] to-[#e0e7ff]', icon: '#6366f1', dot: '#6366f1' }, // indigo
  { bg: 'from-[#fdf2f8] to-[#fce7f3]', icon: '#db2777', dot: '#db2777' }, // pink
  { bg: 'from-[#f0fdf4] to-[#dcfce7]', icon: '#16a34a', dot: '#16a34a' }, // green
  { bg: 'from-[#fffbeb] to-[#fef3c7]', icon: '#d97706', dot: '#d97706' }, // amber
  { bg: 'from-[#ecfeff] to-[#cffafe]', icon: '#0891b2', dot: '#0891b2' }, // cyan
  { bg: 'from-[#faf5ff] to-[#f3e8ff]', icon: '#9333ea', dot: '#9333ea' }, // purple
  { bg: 'from-[#fff1f2] to-[#ffe4e6]', icon: '#e11d48', dot: '#e11d48' }, // rose
  { bg: 'from-[#f0f9ff] to-[#e0f2fe]', icon: '#0284c7', dot: '#0284c7' }, // sky
]

export function folderAccent(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return FOLDER_ACCENTS[hash % FOLDER_ACCENTS.length]
}
