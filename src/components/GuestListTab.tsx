import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  Phone,
  MessageSquare,
  Edit2,
  Trash2,
  Users,
  ChevronDown,
  RefreshCw,
  X,
  Sparkles
} from 'lucide-react';
import { Guest, GuestSide, RelationshipCategory, InvitationStatus, DuplicateCandidate } from '../types';
import { findDuplicateCandidates } from '../utils/vietnameseNlp';

interface GuestListTabProps {
  guests: Guest[];
  onAddGuestClick: () => void;
  onEditGuest: (guest: Guest) => void;
  onDeleteGuest: (id: string) => void;
  onUpdateStatus: (id: string, status: InvitationStatus) => void;
  onOpenInvitation: (guest: Guest) => void;
  onMergeGuests: (primaryId: string, secondaryId: string) => void;
}

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
  const totalInvites = guests.length;
  const totalHeadcount = guests.reduce((sum, g) => sum + (g.count || 1), 0);
  const confirmedCount = guests
    .filter((g) => g.status === 'xac_nhan')
    .reduce((sum, g) => sum + (g.count || 1), 0);
  const pendingCount = guests
    .filter((g) => g.status === 'da_gui' || g.status === 'chua_chac')
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

  const getStatusBadge = (status: InvitationStatus) => {
    switch (status) {
      case 'xac_nhan':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Đi được</span>
          </span>
        );
      case 'da_gui':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            <span>Đã gửi thiệp</span>
          </span>
        );
      case 'chua_chac':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            <HelpCircle className="w-3 h-3 text-amber-600" />
            <span>Chưa chắc</span>
          </span>
        );
      case 'tu_choi':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
            <XCircle className="w-3 h-3 text-stone-500" />
            <span>Bận không đi</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200">
            <span>Chưa gửi</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF7F2] text-stone-800 overflow-hidden">
      {/* Top Action Bar - Pinned */}
      <div className="p-3 bg-white border-b border-stone-200/80 shrink-0 space-y-2.5 z-10 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-base font-semibold text-stone-900 flex items-center gap-1.5">
              <span>Danh Sách Khách Mời</span>
              <span className="text-xs font-normal text-stone-500">({guests.length})</span>
            </h1>
            <p className="text-[11px] text-stone-500">
              Tổng {totalHeadcount} người · {confirmedCount} đã chốt
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsDuplicateModalOpen(true)}
              className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all border ${
                duplicatePairs.length > 0
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${duplicatePairs.length > 0 ? 'text-amber-600' : 'text-stone-400'}`} />
              <span>Quét trùng {duplicatePairs.length > 0 && `(${duplicatePairs.length})`}</span>
            </button>

            <button
              onClick={onAddGuestClick}
              className="min-h-[38px] px-3 py-1.5 bg-rose-800 hover:bg-rose-900 active:scale-95 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-all shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Thêm khách</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, sđt, cơ quan, ghi chú..."
            className="w-full pl-9 pr-3.5 py-2 bg-stone-100 hover:bg-stone-50 focus:bg-white text-xs text-stone-900 placeholder:text-stone-400 rounded-xl border border-stone-200 focus:border-rose-600 focus:outline-hidden transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Segmented Buttons */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          <button
            onClick={() => setSelectedSide('all')}
            className={`whitespace-nowrap shrink-0 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              selectedSide === 'all'
                ? 'bg-rose-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Tất cả phe
          </button>
          <button
            onClick={() => setSelectedSide('nha_trai')}
            className={`whitespace-nowrap shrink-0 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              selectedSide === 'nha_trai'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Nhà Trai
          </button>
          <button
            onClick={() => setSelectedSide('nha_gai')}
            className={`whitespace-nowrap shrink-0 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              selectedSide === 'nha_gai'
                ? 'bg-pink-700 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Nhà Gái
          </button>
          <button
            onClick={() => setSelectedCategory(selectedCategory === 'ban_be' ? 'all' : 'ban_be')}
            className={`whitespace-nowrap shrink-0 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              selectedCategory === 'ban_be'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Bạn bè
          </button>
          <button
            onClick={() => setSelectedCategory(selectedCategory === 'dong_nghiep' ? 'all' : 'dong_nghiep')}
            className={`whitespace-nowrap shrink-0 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              selectedCategory === 'dong_nghiep'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Đồng nghiệp
          </button>
          <button
            onClick={() => setSelectedCategory(selectedCategory === 'ho_hang' ? 'all' : 'ho_hang')}
            className={`whitespace-nowrap shrink-0 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              selectedCategory === 'ho_hang'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Họ hàng
          </button>
        </div>
      </div>

      {/* Guest List Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 overscroll-contain pb-8">
        {filteredGuests.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-2xl border border-stone-200/80">
            <Users className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-stone-700">Chưa tìm thấy khách mời nào</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
              {searchQuery
                ? 'Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.'
                : 'Nhắn cho trợ lý ảo Mỹ Vinh để tự động thêm khách nhé!'}
            </p>
          </div>
        ) : (
          filteredGuests.map((guest) => (
            <div
              key={guest.id}
              className="bg-white rounded-xl border border-stone-200/80 p-3 shadow-2xs hover:border-rose-200 transition-all flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-stone-900 text-sm">{guest.name}</span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.2 rounded-md ${
                        guest.side === 'nha_trai'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : guest.side === 'nha_gai'
                          ? 'bg-pink-50 text-pink-700 border border-pink-200'
                          : 'bg-stone-100 text-stone-600 border border-stone-200'
                      }`}
                    >
                      {guest.side === 'nha_trai' ? 'Nhà Trai' : guest.side === 'nha_gai' ? 'Nhà Gái' : 'Chung'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5 flex-wrap">
                    <span>{guest.relationshipDetail}</span>
                    <span>·</span>
                    <span className="font-semibold text-stone-700">{guest.count} người (suất)</span>
                    {guest.tableNumber && (
                      <>
                        <span>·</span>
                        <span className="text-rose-700 font-medium">{guest.tableNumber}</span>
                      </>
                    )}
                  </div>

                  {guest.phone && (
                    <div className="flex items-center gap-1 text-[11px] text-stone-600 mt-1 font-mono">
                      <Phone className="w-3 h-3 text-stone-400" />
                      <span>{guest.phone}</span>
                    </div>
                  )}

                  {guest.note && (
                    <div className="text-[11px] text-stone-500 mt-1 bg-stone-50 p-1.5 rounded border border-stone-100 italic">
                      {guest.note}
                    </div>
                  )}
                </div>

                {/* Status Selector Dropdown */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <select
                    value={guest.status}
                    onChange={(e) => onUpdateStatus(guest.id, e.target.value as InvitationStatus)}
                    className="text-xs bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg px-2 py-1 text-stone-700 focus:outline-hidden focus:border-rose-600 transition-colors cursor-pointer"
                  >
                    <option value="chua_gui">⚪ Chưa gửi</option>
                    <option value="da_gui">🔵 Đã gửi</option>
                    <option value="xac_nhan">🟢 Đi được</option>
                    <option value="chua_chac">🟡 Chưa chắc</option>
                    <option value="tu_choi">🔴 Bận</option>
                  </select>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100 gap-1 text-xs">
                <button
                  onClick={() => onOpenInvitation(guest)}
                  className="flex-1 min-h-[36px] bg-rose-50 hover:bg-rose-100 text-rose-800 font-medium rounded-lg flex items-center justify-center gap-1 transition-colors border border-rose-200/50"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-rose-600" />
                  <span>Soạn lời mời</span>
                </button>

                <button
                  onClick={() => onEditGuest(guest)}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center text-stone-500 hover:text-stone-800 bg-stone-50 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors"
                  title="Chỉnh sửa thông tin"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onDeleteGuest(guest.id)}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center text-rose-600 hover:text-rose-800 bg-rose-50/50 hover:bg-rose-100 rounded-lg border border-rose-200/50 transition-colors"
                  title="Xóa khách này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Duplicate Scan Modal */}
      {isDuplicateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-amber-50/60">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div>
                  <h2 className="font-semibold text-stone-900 text-sm">Kết Quả Rà Soát Trùng Lặp</h2>
                  <p className="text-[11px] text-stone-500">
                    Phát hiện {duplicatePairs.length} trường hợp có khả năng trùng
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDuplicateModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
              {duplicatePairs.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-stone-800 text-sm">Danh sách sạch hoàn toàn!</h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Không tìm thấy cặp khách nào có tên, số điện thoại hoặc mối quan hệ trùng lặp.
                  </p>
                </div>
              ) : (
                duplicatePairs.map((pair, idx) => (
                  <div key={idx} className="border border-amber-200 rounded-xl p-3 bg-amber-50/40 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-amber-900 pb-1 border-b border-amber-200/60">
                      <span>Cặp nghi vấn #{idx + 1}</span>
                      <span className="font-mono text-[10px] bg-amber-200/80 px-1.5 py-0.5 rounded text-amber-900">
                        Độ tương đồng {pair.candidate.similarityScore}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Guest 1 */}
                      <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                        <div className="font-semibold text-stone-900">{pair.guestA.name}</div>
                        <div className="text-[11px] text-stone-500 mt-0.5">{pair.guestA.relationshipDetail}</div>
                        <div className="text-[11px] text-stone-600">{pair.guestA.count} suất · {pair.guestA.side === 'nha_trai' ? 'Nhà Trai' : 'Nhà Gái'}</div>
                        {pair.guestA.phone && <div className="text-[10px] font-mono text-stone-500 mt-1">{pair.guestA.phone}</div>}
                      </div>

                      {/* Guest 2 */}
                      <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                        <div className="font-semibold text-stone-900">{pair.guestB.name}</div>
                        <div className="text-[11px] text-stone-500 mt-0.5">{pair.guestB.relationshipDetail}</div>
                        <div className="text-[11px] text-stone-600">{pair.guestB.count} suất · {pair.guestB.side === 'nha_trai' ? 'Nhà Trai' : 'Nhà Gái'}</div>
                        {pair.guestB.phone && <div className="text-[10px] font-mono text-stone-500 mt-1">{pair.guestB.phone}</div>}
                      </div>
                    </div>

                    <div className="text-[11px] text-amber-800">
                      <span className="font-medium">Lý do: </span>
                      {pair.candidate.reason}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          onMergeGuests(pair.guestA.id, pair.guestB.id);
                        }}
                        className="flex-1 py-1.5 px-3 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Gộp thành 1 người (Giữ {pair.guestA.name})</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-stone-200 bg-stone-50 text-right">
              <button
                onClick={() => setIsDuplicateModalOpen(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
