import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  Phone,
  MessageSquare,
  Edit2,
  Trash2,
  Users,
  ChevronDown,
  RefreshCw,
  X,
  UtensilsCrossed,
  ScanSearch,
} from 'lucide-react';
import { Guest, GuestSide, RelationshipCategory, InvitationStatus, DuplicateCandidate } from '../types';
import { findDuplicateCandidates } from '../utils/vietnameseNlp';
import { Avatar, SidePill, SIDE_LABEL, STATUS_META, STATUS_ORDER, TabHeader, Modal, IconTile } from './ui';

interface GuestListTabProps {
  guests: Guest[];
  onAddGuestClick: () => void;
  onEditGuest: (guest: Guest) => void;
  onDeleteGuest: (id: string) => void;
  onUpdateStatus: (id: string, status: InvitationStatus) => void;
  onOpenInvitation: (guest: Guest) => void;
  onMergeGuests: (primaryId: string, secondaryId: string) => void;
}

const StatusSelect: React.FC<{ value: InvitationStatus; onChange: (s: InvitationStatus) => void }> = ({ value, onChange }) => {
  const meta = STATUS_META[value];
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as InvitationStatus)}
        className={`appearance-none text-[11px] font-semibold pl-5 pr-6 py-1 rounded-full border cursor-pointer outline-none focus:ring-2 focus:ring-wine-500/20 transition-colors ${meta.pill}`}
        aria-label="Trạng thái thiệp mời"
      >
        {STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {STATUS_META[s].label}
          </option>
        ))}
      </select>
      <span className={`absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 opacity-60 pointer-events-none" />
    </div>
  );
};

const CATEGORY_CHIPS: { id: RelationshipCategory; label: string }[] = [
  { id: 'ban_be', label: 'Bạn bè' },
  { id: 'dong_nghiep', label: 'Đồng nghiệp' },
  { id: 'ho_hang', label: 'Họ hàng' },
  { id: 'vip', label: 'VIP' },
];

export const GuestListTab: React.FC<GuestListTabProps> = ({
  guests,
  onAddGuestClick,
  onEditGuest,
  onDeleteGuest,
  onUpdateStatus,
  onOpenInvitation,
  onMergeGuests,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSide, setSelectedSide] = useState<GuestSide | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<RelationshipCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<InvitationStatus | 'all'>('all');
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

  // Filtered guests
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      if (selectedSide !== 'all' && g.side !== selectedSide) return false;
      if (selectedCategory !== 'all' && g.relationshipCategory !== selectedCategory) return false;
      if (selectedStatus !== 'all' && g.status !== selectedStatus) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = g.name.toLowerCase().includes(query);
        const matchPhone = g.phone?.includes(query);
        const matchRel = g.relationshipDetail.toLowerCase().includes(query);
        const matchNote = g.note?.toLowerCase().includes(query);
        return matchName || matchPhone || matchRel || matchNote;
      }

      return true;
    });
  }, [guests, searchQuery, selectedSide, selectedCategory, selectedStatus]);

  // Overall list statistics
  const totalHeadcount = guests.reduce((sum, g) => sum + (g.count || 1), 0);
  const confirmedCount = guests
    .filter((g) => g.status === 'xac_nhan')
    .reduce((sum, g) => sum + (g.count || 1), 0);

  // Find all internal duplicate pairs across the entire list
  const duplicatePairs = useMemo(() => {
    const pairs: { guestA: Guest; guestB: Guest; candidate: DuplicateCandidate }[] = [];
    for (let i = 0; i < guests.length; i++) {
      for (let j = i + 1; j < guests.length; j++) {
        const dups = findDuplicateCandidates(guests[i], [guests[j]]);
        if (dups.length > 0) {
          pairs.push({
            guestA: guests[i],
            guestB: guests[j],
            candidate: dups[0],
          });
        }
      }
    }
    return pairs;
  }, [guests]);

  const noChipFilter = selectedSide === 'all' && selectedCategory === 'all' && selectedStatus === 'all';
  const hasFilter = !noChipFilter || !!searchQuery;

  return (
    <div className="flex flex-col h-full bg-cream text-stone-800 overflow-hidden">
      <TabHeader
        title="Khách mời"
        subtitle={
          <>
            <span className="font-semibold text-stone-700">{guests.length}</span> thiệp ·{' '}
            <span className="font-semibold text-stone-700">{totalHeadcount}</span> người ·{' '}
            <span className="font-semibold text-emerald-700">{confirmedCount}</span> đã chốt
          </>
        }
        actions={
          <>
            <button
              onClick={() => setIsDuplicateModalOpen(true)}
              className={`btn btn-icon relative ${
                duplicatePairs.length > 0 ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'btn-ghost'
              }`}
              title="Quét trùng lặp"
              aria-label="Quét trùng lặp"
            >
              <ScanSearch className="w-[18px] h-[18px]" />
              {duplicatePairs.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                  {duplicatePairs.length}
                </span>
              )}
            </button>
            <button onClick={onAddGuestClick} className="btn btn-primary btn-sm">
              <UserPlus className="w-3.5 h-3.5" />
              <span>Thêm</span>
            </button>
          </>
        }
      >
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, số điện thoại, ghi chú…"
            className="field field-sm pl-10 pr-9 bg-stone-50 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-4 px-4">
          <button
            onClick={() => {
              setSelectedSide('all');
              setSelectedCategory('all');
              setSelectedStatus('all');
            }}
            className={`chip ${noChipFilter ? 'chip-on' : 'chip-off'}`}
          >
            Tất cả
          </button>
          {(['nha_trai', 'nha_gai'] as GuestSide[]).map((side) => (
            <button
              key={side}
              onClick={() => setSelectedSide(selectedSide === side ? 'all' : side)}
              className={`chip ${selectedSide === side ? 'chip-on' : 'chip-off'}`}
            >
              {SIDE_LABEL[side]}
            </button>
          ))}
          <span className="w-px bg-stone-200 my-1 shrink-0" />
          {CATEGORY_CHIPS.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(selectedCategory === c.id ? 'all' : c.id)}
              className={`chip ${selectedCategory === c.id ? 'chip-on' : 'chip-off'}`}
            >
              {c.label}
            </button>
          ))}
          <span className="w-px bg-stone-200 my-1 shrink-0" />
          {(['xac_nhan', 'chua_gui', 'chua_chac'] as InvitationStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStatus(selectedStatus === s ? 'all' : s)}
              className={`chip ${selectedStatus === s ? 'chip-on' : 'chip-off'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${selectedStatus === s ? 'bg-white' : STATUS_META[s].dot}`} />
              {STATUS_META[s].label}
            </button>
          ))}
        </div>
      </TabHeader>

      {/* Guest list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain pb-8">
        {filteredGuests.length === 0 ? (
          <div className="card text-center py-14 px-6 animate-fade-up">
            <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-stone-400" />
            </div>
            <h3 className="font-serif text-base text-stone-800">Chưa có khách mời nào</h3>
            <p className="text-xs text-stone-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
              {hasFilter
                ? 'Thử từ khóa khác hoặc bỏ bớt bộ lọc.'
                : 'Nhắn cho trợ lý Mỹ Vinh để tự động thêm khách, hoặc bấm "Thêm" ở góc trên.'}
            </p>
          </div>
        ) : (
          filteredGuests.map((guest) => (
            <article key={guest.id} className="card p-3.5 transition-shadow hover:shadow-soft animate-fade-up">
              <div className="flex items-start gap-3">
                <Avatar name={guest.name} side={guest.side} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-stone-900 text-[14px] leading-tight">{guest.name}</span>
                        <SidePill side={guest.side} />
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5 truncate">{guest.relationshipDetail}</div>
                    </div>
                    <StatusSelect value={guest.status} onChange={(s) => onUpdateStatus(guest.id, s)} />
                  </div>

                  <div className="mt-2 flex items-center gap-x-3 gap-y-1 flex-wrap text-[11.5px] text-stone-600">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-stone-400" />
                      <span className="font-semibold text-stone-800">{guest.count}</span> suất
                    </span>
                    {guest.phone && (
                      <span className="inline-flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        {guest.phone}
                      </span>
                    )}
                    {guest.tableNumber && (
                      <span className="inline-flex items-center gap-1 text-wine-700 font-medium">
                        <UtensilsCrossed className="w-3.5 h-3.5" />
                        {guest.tableNumber}
                      </span>
                    )}
                  </div>

                  {guest.note && (
                    <div className="mt-2 text-[11.5px] text-stone-500 italic bg-stone-50 rounded-lg px-2.5 py-1.5 border border-stone-100">
                      {guest.note}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-1.5">
                <button onClick={() => onOpenInvitation(guest)} className="btn btn-soft btn-sm flex-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Soạn lời mời</span>
                </button>
                <button onClick={() => onEditGuest(guest)} className="btn btn-ghost btn-icon" title="Chỉnh sửa thông tin" aria-label="Chỉnh sửa">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteGuest(guest.id)}
                  className="btn btn-icon text-stone-400 hover:text-wine-700 hover:bg-wine-50"
                  title="Xóa khách này"
                  aria-label="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Duplicate scan modal */}
      <Modal
        open={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        size="lg"
        title="Rà soát trùng lặp"
        subtitle={
          duplicatePairs.length > 0
            ? `Phát hiện ${duplicatePairs.length} cặp khách có khả năng trùng`
            : 'Không phát hiện trường hợp nghi trùng'
        }
        icon={
          <IconTile className={duplicatePairs.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}>
            {duplicatePairs.length > 0 ? <AlertTriangle className="w-[18px] h-[18px]" /> : <CheckCircle2 className="w-[18px] h-[18px]" />}
          </IconTile>
        }
        footer={
          <button onClick={() => setIsDuplicateModalOpen(false)} className="btn btn-secondary btn-md w-full">
            Đóng
          </button>
        }
      >
        <div className="p-4 space-y-3">
          {duplicatePairs.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="font-serif text-base text-stone-800">Danh sách sạch hoàn toàn</h3>
              <p className="text-xs text-stone-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
                Không tìm thấy cặp khách nào có tên, số điện thoại hoặc mối quan hệ trùng lặp.
              </p>
            </div>
          ) : (
            duplicatePairs.map((pair, idx) => (
              <div key={idx} className="card overflow-hidden border-amber-200/80">
                <div className="px-4 py-2 flex items-center justify-between bg-amber-50 border-b border-amber-100 text-[11px]">
                  <span className="font-bold uppercase tracking-wider text-amber-800">Cặp nghi vấn #{idx + 1}</span>
                  <span className="font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">
                    Tương đồng {pair.candidate.similarityScore}%
                  </span>
                </div>

                <div className="p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[pair.guestA, pair.guestB].map((g) => (
                      <div key={g.id} className="rounded-xl bg-stone-50 border border-stone-100 p-2.5 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar name={g.name} side={g.side} className="w-8 h-8 text-[10px]" />
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-stone-900 truncate">{g.name}</div>
                            <div className="text-[10.5px] text-stone-500 truncate">{SIDE_LABEL[g.side]}</div>
                          </div>
                        </div>
                        <div className="text-[11px] text-stone-600 mt-2 truncate">{g.relationshipDetail}</div>
                        <div className="text-[11px] text-stone-500">
                          {g.count} suất
                          {g.phone && <span className="font-mono"> · {g.phone}</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[11.5px] text-amber-800 bg-amber-50/60 rounded-lg px-3 py-2">
                    <span className="font-semibold">Lý do: </span>
                    {pair.candidate.reason}
                  </div>

                  <button onClick={() => onMergeGuests(pair.guestA.id, pair.guestB.id)} className="btn btn-warn btn-md w-full">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="truncate">Gộp thành một (giữ {pair.guestA.name})</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};
