import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence, animate, useDragControls, useReducedMotion } from 'motion/react';
import { GuestSide, InvitationStatus, RelationshipCategory } from '../types';

// ---------- Labels & metadata shared across tabs ----------

export const SIDE_LABEL: Record<GuestSide, string> = {
  nha_trai: 'Nhà Trai',
  nha_gai: 'Nhà Gái',
  chung: 'Chung',
};

export const CATEGORY_LABEL: Record<RelationshipCategory, string> = {
  ban_be: 'Bạn bè',
  dong_nghiep: 'Đồng nghiệp',
  ho_hang: 'Họ hàng',
  vip: 'Đối tác / VIP',
  khac: 'Khác',
};

export const STATUS_META: Record<InvitationStatus, { label: string; dot: string; pill: string }> = {
  chua_gui: { label: 'Chưa gửi', dot: 'bg-stone-400', pill: 'bg-stone-100 text-stone-600 border-stone-200' },
  da_gui: { label: 'Đã gửi thiệp', dot: 'bg-sky-500', pill: 'bg-sky-50 text-sky-700 border-sky-200' },
  xac_nhan: { label: 'Đi được', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  chua_chac: { label: 'Chưa chắc', dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700 border-amber-200' },
  tu_choi: { label: 'Bận không đi', dot: 'bg-rose-400', pill: 'bg-rose-50 text-rose-600 border-rose-200' },
};

export const STATUS_ORDER: InvitationStatus[] = ['chua_gui', 'da_gui', 'xac_nhan', 'chua_chac', 'tu_choi'];

const SIDE_GRADIENT: Record<GuestSide, string> = {
  nha_trai: 'from-sky-500 to-indigo-600',
  nha_gai: 'from-pink-500 to-wine-600',
  chung: 'from-stone-500 to-stone-700',
};

const SIDE_PILL: Record<GuestSide, string> = {
  nha_trai: 'bg-sky-50 text-sky-700 border-sky-200',
  nha_gai: 'bg-pink-50 text-pink-700 border-pink-200',
  chung: 'bg-stone-100 text-stone-600 border-stone-200',
};

const HONORIFICS = new Set([
  'anh', 'chị', 'chi', 'em', 'bác', 'bac', 'cô', 'co', 'chú', 'chu', 'ông', 'ong', 'bà', 'ba',
  'bạn', 'ban', 'thầy', 'thay', 'dì', 'di', 'cậu', 'cau', 'mợ', 'mo', 'thím', 'thim',
  'vợ', 'chồng', 'gia', 'đình', 'gđ', 'gd', 'nhà',
]);

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const core = words.filter((w) => !HONORIFICS.has(w.toLowerCase()));
  const use = core.length > 0 ? core : words;
  if (use.length === 0) return '?';
  if (use.length === 1) return use[0].slice(0, 2).toUpperCase();
  return (use[0][0] + use[use.length - 1][0]).toUpperCase();
}

// ---------- Small visual atoms ----------

export const Avatar: React.FC<{ name: string; side: GuestSide; className?: string }> = ({
  name,
  side,
  className = 'w-10 h-10 text-xs',
}) => (
  <div
    className={`${className} shrink-0 rounded-full bg-linear-to-br ${SIDE_GRADIENT[side]} text-white font-bold flex items-center justify-center tracking-wide shadow-xs ring-2 ring-white`}
  >
    {getInitials(name)}
  </div>
);

export const Monogram: React.FC<{ className?: string; online?: boolean }> = ({
  className = 'w-10 h-10 text-xs',
  online,
}) => (
  <div className="relative shrink-0">
    <div
      className={`${className} rounded-full bg-linear-to-br from-wine-600 via-wine-800 to-gold-600 text-white flex items-center justify-center ring-2 ring-gold-200 shadow-wine`}
    >
      <span className="font-serif font-semibold tracking-widest">MV</span>
    </div>
    {online && (
      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
    )}
  </div>
);

export const SidePill: React.FC<{ side: GuestSide }> = ({ side }) => (
  <span className={`inline-flex items-center text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${SIDE_PILL[side]}`}>
    {SIDE_LABEL[side]}
  </span>
);

export const StatusBadge: React.FC<{ status: InvitationStatus }> = ({ status }) => {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${meta.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
};

// ---------- Layout primitives ----------

interface TabHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  leading?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export const TabHeader: React.FC<TabHeaderProps> = ({ title, subtitle, leading, actions, children }) => (
  <header className="shrink-0 z-10 bg-white/90 backdrop-blur-md border-b border-stone-200/70">
    <div className="px-4 pt-3.5 pb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {leading}
        <div className="min-w-0">
          <h1 className="font-serif text-lg leading-tight text-stone-900 truncate">{title}</h1>
          {subtitle && <div className="text-[11.5px] text-stone-500 mt-0.5 truncate">{subtitle}</div>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
    </div>
    {children && <div className="px-4 pb-3 space-y-2.5">{children}</div>}
  </header>
);

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg';
}

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mobile;
}

/**
 * Bottom sheet on mobile (spring in, drag the header down to dismiss),
 * centered dialog on larger screens. Animates out as well as in.
 */
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, subtitle, icon, children, footer, size = 'md' }) => {
  const isMobile = useIsMobile();
  const dragControls = useDragControls();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const sheetMotion = isMobile
    ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }
    : { initial: { opacity: 0, scale: 0.96, y: 8 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.97, y: 6 } };

  return (
    <AnimatePresence>
      {open && (
        <div
          key="modal"
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            className="absolute inset-0 bg-stone-900/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className={`relative w-full ${size === 'lg' ? 'md:max-w-lg' : 'md:max-w-md'} max-h-[92dvh] md:max-h-[85vh] bg-white rounded-t-3xl md:rounded-3xl shadow-lift flex flex-col overflow-hidden`}
            {...sheetMotion}
            transition={{ type: 'spring', stiffness: 420, damping: 38, mass: 0.9 }}
            drag={isMobile ? 'y' : false}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            dragSnapToOrigin
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 500) onClose();
            }}
          >
            {/* Grab area: handle + header start the drag on mobile */}
            <div
              className="md:cursor-default touch-none"
              onPointerDown={(e) => {
                if (isMobile) dragControls.start(e);
              }}
            >
              <div className="md:hidden pt-2.5 flex justify-center">
                <span className="w-10 h-1 rounded-full bg-stone-200" />
              </div>
              <div className="px-5 pt-3 pb-3.5 md:pt-5 flex items-start justify-between gap-3 border-b border-stone-100">
                <div className="flex items-center gap-3 min-w-0">
                  {icon}
                  <div className="min-w-0">
                    <h2 className="font-serif text-lg leading-tight text-stone-900">{title}</h2>
                    {subtitle && <div className="text-xs text-stone-500 mt-0.5">{subtitle}</div>}
                  </div>
                </div>
                <button onClick={onClose} className="btn btn-ghost btn-icon -mr-2 -mt-1" aria-label="Đóng">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain scroll-area">{children}</div>
            {footer && <div className="px-5 py-3.5 border-t border-stone-100 bg-stone-50/70 pb-safe">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/** Animates a number from its previous value (0 on mount) to the new one. */
export const CountUp: React.FC<{ value: number; className?: string }> = ({ value, className }) => {
  const reduce = useReducedMotion();
  const prev = useRef(0);
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (reduce || from === value) {
      setDisplay(value);
      return;
    }
    const controls = animate(from, value, {
      duration: 0.7,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, reduce]);

  return <span className={className}>{display}</span>;
};

export const IconTile: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${className}`}>{children}</div>
);
