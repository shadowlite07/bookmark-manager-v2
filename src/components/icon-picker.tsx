import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Folder, FolderOpen, FileText, File, Archive, Bookmark, BookmarkPlus, Clipboard,
  Code, Terminal, GitBranch, GitMerge, Database, Server, Cloud, Zap,
  Music, Image, Video, Camera, Mic, Headphones, Film,
  ShoppingCart, ShoppingBag, DollarSign, CreditCard, Package, Tag, Gift,
  Mail, MessageCircle, MessageSquare, Phone, Send, Bell, BellRing,
  Leaf, Mountain, Sun, Moon, Star, Heart, Flame, Droplets,
  Rocket, Key, Lock, Shield, Eye, Compass, Map, Flag,
  Home, Building, GraduationCap, Briefcase, Users, User, Globe,
  Settings, Wrench, Hammer, Cog, Paintbrush, Palette, Brush,
  BookOpen, Book, Library, Pen, Pencil, Ruler,
  Clock, Calendar, Timer, History, AlertTriangle, CheckCircle,
  Brain, Bot, Cpu, Fingerprint, Network, Wifi, Smartphone, Monitor, Laptop,
  HardDrive, ScanLine, Sparkles, Wand2,
  BadgePercent, Receipt, Banknote, Coins, PiggyBank, Store, Truck,
  Apple, Coffee, Cookie, Cake, Pizza, Sandwich, IceCreamCone, Egg, Beef, Wine, Beer,
  Baby, HeartHandshake, HeartPulse, Circle, Stethoscope,
  Bike, Dumbbell, Trophy, Medal, Sailboat, Waves, Anchor,
  CloudDrizzle, CloudLightning, CloudRain, Snowflake, Thermometer, Wind, Umbrella, Rainbow,
  Bus, Car, Fuel, Plane, Ship, TrainFront, TrafficCone,
  Disc3, Guitar, Radio, Piano,
  type LucideIcon,
} from 'lucide-react'

export const ICON_CATEGORIES = [
  {
    label: 'General',
    icons: [
      { name: 'Folder', icon: Folder },
      { name: 'FolderOpen', icon: FolderOpen },
      { name: 'Home', icon: Home },
      { name: 'Star', icon: Star },
      { name: 'Heart', icon: Heart },
      { name: 'Bookmark', icon: Bookmark },
      { name: 'BookmarkPlus', icon: BookmarkPlus },
      { name: 'Flag', icon: Flag },
      { name: 'Globe', icon: Globe },
      { name: 'Compass', icon: Compass },
      { name: 'Sparkles', icon: Sparkles },
      { name: 'Wand2', icon: Wand2 },
    ],
  },
  {
    label: 'AI & Tech',
    icons: [
      { name: 'Brain', icon: Brain },
      { name: 'Bot', icon: Bot },
      { name: 'Cpu', icon: Cpu },
      { name: 'Fingerprint', icon: Fingerprint },
      { name: 'Network', icon: Network },
      { name: 'Wifi', icon: Wifi },
      { name: 'Smartphone', icon: Smartphone },
      { name: 'Monitor', icon: Monitor },
      { name: 'Laptop', icon: Laptop },
      { name: 'HardDrive', icon: HardDrive },
      { name: 'ScanLine', icon: ScanLine },
      { name: 'Code', icon: Code },
      { name: 'Terminal', icon: Terminal },
      { name: 'GitBranch', icon: GitBranch },
      { name: 'GitMerge', icon: GitMerge },
      { name: 'Database', icon: Database },
      { name: 'Server', icon: Server },
      { name: 'Cloud', icon: Cloud },
      { name: 'Zap', icon: Zap },
      { name: 'Settings', icon: Settings },
    ],
  },
  {
    label: 'Files',
    icons: [
      { name: 'File', icon: File },
      { name: 'FileText', icon: FileText },
      { name: 'Archive', icon: Archive },
      { name: 'Clipboard', icon: Clipboard },
      { name: 'Book', icon: Book },
      { name: 'BookOpen', icon: BookOpen },
      { name: 'Library', icon: Library },
      { name: 'Pen', icon: Pen },
      { name: 'Pencil', icon: Pencil },
      { name: 'Ruler', icon: Ruler },
    ],
  },
  {
    label: 'Love & Family',
    icons: [
      { name: 'Heart', icon: Heart },
      { name: 'HeartPulse', icon: HeartPulse },
      { name: 'HeartHandshake', icon: HeartHandshake },
      { name: 'Baby', icon: Baby },
      { name: 'Circle', icon: Circle },
      { name: 'Stethoscope', icon: Stethoscope },
      { name: 'Users', icon: Users },
      { name: 'User', icon: User },
      { name: 'Kiss', icon: Heart },
      { name: 'HandHeart', icon: HeartHandshake },
    ],
  },
  {
    label: 'Shopping',
    icons: [
      { name: 'ShoppingCart', icon: ShoppingCart },
      { name: 'ShoppingBag', icon: ShoppingBag },
      { name: 'Store', icon: Store },
      { name: 'DollarSign', icon: DollarSign },
      { name: 'CreditCard', icon: CreditCard },
      { name: 'Banknote', icon: Banknote },
      { name: 'Coins', icon: Coins },
      { name: 'PiggyBank', icon: PiggyBank },
      { name: 'Package', icon: Package },
      { name: 'Truck', icon: Truck },
      { name: 'Tag', icon: Tag },
      { name: 'Gift', icon: Gift },
      { name: 'BadgePercent', icon: BadgePercent },
      { name: 'Receipt', icon: Receipt },
      { name: 'Briefcase', icon: Briefcase },
    ],
  },
  {
    label: 'Food & Drink',
    icons: [
      { name: 'Coffee', icon: Coffee },
      { name: 'Apple', icon: Apple },
      { name: 'Pizza', icon: Pizza },
      { name: 'Cake', icon: Cake },
      { name: 'Cookie', icon: Cookie },
      { name: 'Sandwich', icon: Sandwich },
      { name: 'IceCreamCone', icon: IceCreamCone },
      { name: 'Egg', icon: Egg },
      { name: 'Beef', icon: Beef },
      { name: 'Wine', icon: Wine },
      { name: 'Beer', icon: Beer },
    ],
  },
  {
    label: 'Communication',
    icons: [
      { name: 'Mail', icon: Mail },
      { name: 'MessageCircle', icon: MessageCircle },
      { name: 'MessageSquare', icon: MessageSquare },
      { name: 'Phone', icon: Phone },
      { name: 'Send', icon: Send },
      { name: 'Bell', icon: Bell },
      { name: 'BellRing', icon: BellRing },
    ],
  },
  {
    label: 'Media',
    icons: [
      { name: 'Music', icon: Music },
      { name: 'Image', icon: Image },
      { name: 'Video', icon: Video },
      { name: 'Camera', icon: Camera },
      { name: 'Mic', icon: Mic },
      { name: 'Headphones', icon: Headphones },
      { name: 'Film', icon: Film },
      { name: 'Palette', icon: Palette },
      { name: 'Paintbrush', icon: Paintbrush },
      { name: 'Brush', icon: Brush },
      { name: 'Disc3', icon: Disc3 },
      { name: 'Guitar', icon: Guitar },
      { name: 'Radio', icon: Radio },
      { name: 'Piano', icon: Piano },
    ],
  },
  {
    label: 'Nature',
    icons: [
      { name: 'Leaf', icon: Leaf },
      { name: 'Mountain', icon: Mountain },
      { name: 'Sun', icon: Sun },
      { name: 'Moon', icon: Moon },
      { name: 'Flame', icon: Flame },
      { name: 'Droplets', icon: Droplets },
      { name: 'Snowflake', icon: Snowflake },
      { name: 'Rainbow', icon: Rainbow },
    ],
  },
  {
    label: 'Weather',
    icons: [
      { name: 'CloudDrizzle', icon: CloudDrizzle },
      { name: 'CloudLightning', icon: CloudLightning },
      { name: 'CloudRain', icon: CloudRain },
      { name: 'Wind', icon: Wind },
      { name: 'Thermometer', icon: Thermometer },
      { name: 'Umbrella', icon: Umbrella },
    ],
  },
  {
    label: 'Objects',
    icons: [
      { name: 'Rocket', icon: Rocket },
      { name: 'Key', icon: Key },
      { name: 'Lock', icon: Lock },
      { name: 'Shield', icon: Shield },
      { name: 'Eye', icon: Eye },
      { name: 'Map', icon: Map },
      { name: 'Building', icon: Building },
      { name: 'GraduationCap', icon: GraduationCap },
      { name: 'Wrench', icon: Wrench },
      { name: 'Hammer', icon: Hammer },
      { name: 'Cog', icon: Cog },
    ],
  },
  {
    label: 'Sports',
    icons: [
      { name: 'Trophy', icon: Trophy },
      { name: 'Medal', icon: Medal },
      { name: 'Dumbbell', icon: Dumbbell },
      { name: 'Bike', icon: Bike },
      { name: 'Sailboat', icon: Sailboat },
      { name: 'Waves', icon: Waves },
      { name: 'Anchor', icon: Anchor },
    ],
  },
  {
    label: 'Transport',
    icons: [
      { name: 'Car', icon: Car },
      { name: 'Bus', icon: Bus },
      { name: 'TrainFront', icon: TrainFront },
      { name: 'Plane', icon: Plane },
      { name: 'Ship', icon: Ship },
      { name: 'Fuel', icon: Fuel },
      { name: 'TrafficCone', icon: TrafficCone },
    ],
  },
  {
    label: 'Time',
    icons: [
      { name: 'Clock', icon: Clock },
      { name: 'Calendar', icon: Calendar },
      { name: 'Timer', icon: Timer },
      { name: 'History', icon: History },
      { name: 'AlertTriangle', icon: AlertTriangle },
      { name: 'CheckCircle', icon: CheckCircle },
    ],
  },
]

export const ALL_ICONS = ICON_CATEGORIES.flatMap((cat) => cat.icons)

export function getIconByName(name: string | undefined): LucideIcon {
  if (!name) return Folder
  return ALL_ICONS.find((i) => i.name === name)?.icon ?? Folder
}

interface IconPickerProps {
  value?: string
  onChange: (iconName: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return ICON_CATEGORIES
    const q = search.toLowerCase()
    return ICON_CATEGORIES.map((cat) => ({
      ...cat,
      icons: cat.icons.filter((i) => i.name.toLowerCase().includes(q)),
    })).filter((cat) => cat.icons.length > 0)
  }, [search])

  const CurrentIcon = getIconByName(value)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 h-11 px-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] hover:bg-[#f1f5f9] hover:border-[#c7d2fe] transition-all duration-200 cursor-pointer group"
      >
        <div className="size-8 rounded-lg bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <CurrentIcon className="size-4 text-[#6366f1]" strokeWidth={2} />
        </div>
        <span className="text-[13px] text-[#64748b] font-medium">{value || 'Choose icon'}</span>
      </button>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); setSearch('') }}>
        <DialogContent className="sm:max-w-[520px] p-0 gap-0 rounded-2xl border-[#e2e8f0]/80 shadow-2xl overflow-hidden max-h-[70vh] flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <DialogTitle className="text-[17px] font-bold text-[#0f172a] tracking-tight">
              Choose Folder Icon
            </DialogTitle>
            <div className="relative mt-3">
              <input
                type="text"
                placeholder="Search icons..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-[13px] text-[#0f172a] placeholder-[#94a3b8] outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all duration-200"
                autoFocus
              />
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {filtered.map((cat) => (
              <div key={cat.label} className="mb-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2">
                  {cat.label}
                </p>
                <div className="grid grid-cols-10 gap-1">
                  {cat.icons.map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      type="button"
                      title={name}
                      onClick={() => { onChange(name); setOpen(false) }}
                      className={`size-10 rounded-xl flex items-center justify-center transition-all duration-150 ${
                        value === name
                          ? 'bg-[#6366f1] text-white shadow-md shadow-[#6366f1]/30 scale-110'
                          : 'text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#6366f1] hover:scale-105'
                      }`}
                    >
                      <Icon className="size-5" strokeWidth={1.8} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-[13px] text-[#94a3b8] py-8">No icons found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
