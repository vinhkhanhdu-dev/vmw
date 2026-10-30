import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Guest, GuestSide, RelationshipCategory, InvitationStatus } from '../types';

interface EditGuestModalProps {
  guest: Guest | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (guestData: Partial<Guest>) => void;
}

export const EditGuestModal: React.FC<EditGuestModalProps> = ({
  guest,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Guest>>({
    name: '',
    side: 'nha_trai',
    relationshipCategory: 'ban_be',
    relationshipDetail: 'Bạn bè',
    count: 1,
    phone: '',
    status: 'chua_gui',
    tableNumber: '',
    note: '',
  });

  useEffect(() => {
    if (guest) {
      setFormData(guest);
    } else {
      setFormData({
        name: '',
        side: 'nha_trai',
        relationshipCategory: 'ban_be',
        relationshipDetail: 'Bạn bè',
        count: 1,
        phone: '',
        status: 'chua_gui',
        tableNumber: '',
        note: '',
      });
    }
  }, [guest, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <h2 className="font-semibold text-stone-900 text-sm">
            {guest ? 'Chỉnh Sửa Khách Mời' : 'Thêm Khách Mời Mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5 flex-1 text-xs">
          <div>
            <label className="block text-stone-600 font-medium mb-1">
              Họ tên / Danh xưng <span className="text-rose-600">*</span>:
            </label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ví dụ: Anh Nam, Chị Lan..."
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:border-rose-600 focus:outline-hidden text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-stone-600 font-medium mb-1">Phe mời:</label>
              <select
                value={formData.side || 'nha_trai'}
                onChange={(e) => setFormData({ ...formData, side: e.target.value as GuestSide })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
              >
                <option value="nha_trai">Nhà Trai (Chú rể)</option>
                <option value="nha_gai">Nhà Gái (Cô dâu)</option>
                <option value="chung">Khách chung hai bạn</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-600 font-medium mb-1">Số suất cỗ / người:</label>
              <input
                type="number"
                min={1}
                max={20}
                value={formData.count || 1}
                onChange={(e) => setFormData({ ...formData, count: Number(e.target.value) })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-stone-600 font-medium mb-1">Nhóm quan hệ:</label>
              <select
                value={formData.relationshipCategory || 'ban_be'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    relationshipCategory: e.target.value as RelationshipCategory,
                  })
                }
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
              >
                <option value="ban_be">Bạn bè</option>
                <option value="dong_nghiep">Đồng nghiệp</option>
                <option value="ho_hang">Họ hàng</option>
                <option value="vip">Đối tác / VIP</option>
                <option value="khac">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-600 font-medium mb-1">Mô tả chi tiết:</label>
              <input
                type="text"
                value={formData.relationshipDetail || ''}
                onChange={(e) => setFormData({ ...formData, relationshipDetail: e.target.value })}
                placeholder="Ví dụ: Bạn cấp 3, Họ nội..."
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-stone-600 font-medium mb-1">Số điện thoại:</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="09..."
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-stone-600 font-medium mb-1">Trạng thái RSVP:</label>
              <select
                value={formData.status || 'chua_gui'}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as InvitationStatus })
                }
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
              >
                <option value="chua_gui">⚪ Chưa gửi</option>
                <option value="da_gui">🔵 Đã gửi thiệp</option>
                <option value="xac_nhan">🟢 Đi được</option>
                <option value="chua_chac">🟡 Chưa chắc</option>
                <option value="tu_choi">🔴 Bận không đi</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-stone-600 font-medium mb-1">Xếp bàn / Mâm:</label>
            <input
              type="text"
              value={formData.tableNumber || ''}
              onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
              placeholder="Ví dụ: Bàn 02 (Bạn ĐH)..."
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-stone-600 font-medium mb-1">Ghi chú thêm:</label>
            <textarea
              rows={2}
              value={formData.note || ''}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Ví dụ: Kèm 1 bé, ăn chay, ở xa lên sớm..."
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs resize-none"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-rose-800 hover:bg-rose-900 active:scale-95 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>{guest ? 'Cập nhật' : 'Thêm vào danh sách'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
