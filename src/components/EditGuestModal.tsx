import React, { useState, useEffect } from 'react';
import { Check, Minus, Plus, UserPlus, UserPen } from 'lucide-react';
import { Guest, GuestSide, RelationshipCategory, InvitationStatus } from '../types';
import { Modal, IconTile, SIDE_LABEL, CATEGORY_LABEL, STATUS_META, STATUS_ORDER } from './ui';

interface EditGuestModalProps {
  guest: Guest | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (guestData: Partial<Guest>) => void;
}

const EMPTY_FORM: Partial<Guest> = {
  name: '',
  side: 'nha_trai',
  relationshipCategory: 'ban_be',
  relationshipDetail: 'Bạn bè',
  count: 1,
  phone: '',
  status: 'chua_gui',
  tableNumber: '',
  note: '',
};

const SIDES: GuestSide[] = ['nha_trai', 'nha_gai', 'chung'];
const CATEGORIES: RelationshipCategory[] = ['ban_be', 'dong_nghiep', 'ho_hang', 'vip', 'khac'];

export const EditGuestModal: React.FC<EditGuestModalProps> = ({ guest, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Guest>>(EMPTY_FORM);

  useEffect(() => {
    setFormData(guest ? guest : EMPTY_FORM);
  }, [guest, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;
    onSave(formData);
    onClose();
  };

  const count = formData.count || 1;
  const setCount = (next: number) => setFormData({ ...formData, count: Math.min(20, Math.max(1, next)) });

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={guest ? 'Chỉnh sửa khách mời' : 'Thêm khách mời'}
      subtitle={guest ? guest.name : 'Nhập thông tin người được mời'}
      icon={
        <IconTile className="bg-wine-50 text-wine-700">
          {guest ? <UserPen className="w-[18px] h-[18px]" /> : <UserPlus className="w-[18px] h-[18px]" />}
        </IconTile>
      }
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn btn-secondary btn-md flex-1">
            Hủy
          </button>
          <button type="submit" form="guest-form" className="btn btn-primary btn-md flex-[1.4]">
            <Check className="w-4 h-4" />
            <span>{guest ? 'Lưu thay đổi' : 'Thêm vào danh sách'}</span>
          </button>
        </div>
      }
    >
      <form id="guest-form" onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="label">
            Họ tên / Danh xưng <span className="text-wine-600">*</span>
          </label>
          <input
            type="text"
            required
            autoFocus={!guest}
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ví dụ: Anh Nam, Chị Lan…"
            className="field"
          />
        </div>

        <div>
          <label className="label">Phe mời</label>
          <div className="seg">
            {SIDES.map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setFormData({ ...formData, side })}
                className={`seg-btn min-h-9 ${formData.side === side ? 'seg-on' : ''}`}
              >
                {SIDE_LABEL[side]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Nhóm quan hệ</label>
            <select
              value={formData.relationshipCategory || 'ban_be'}
              onChange={(e) => setFormData({ ...formData, relationshipCategory: e.target.value as RelationshipCategory })}
              className="field select"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Số suất cỗ</label>
            <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden min-h-11">
              <button
                type="button"
                onClick={() => setCount(count - 1)}
                className="w-11 h-11 flex items-center justify-center text-stone-500 hover:bg-stone-50 active:bg-stone-100"
                aria-label="Giảm"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="flex-1 min-w-0 text-center font-semibold text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => setCount(count + 1)}
                className="w-11 h-11 flex items-center justify-center text-stone-500 hover:bg-stone-50 active:bg-stone-100"
                aria-label="Tăng"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="label">Mô tả quan hệ</label>
          <input
            type="text"
            value={formData.relationshipDetail || ''}
            onChange={(e) => setFormData({ ...formData, relationshipDetail: e.target.value })}
            placeholder="Ví dụ: Bạn cấp 3, Họ nội, Đồng nghiệp FPT…"
            className="field"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Số điện thoại</label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="09…"
              className="field font-mono"
            />
          </div>

          <div>
            <label className="label">Trạng thái</label>
            <select
              value={formData.status || 'chua_gui'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as InvitationStatus })}
              className="field select"
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Xếp bàn / Mâm</label>
          <input
            type="text"
            value={formData.tableNumber || ''}
            onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
            placeholder="Ví dụ: Bàn 02 (Bạn ĐH)…"
            className="field"
          />
        </div>

        <div>
          <label className="label">Tiền mừng (VND)</label>
          <input
            type="text"
            inputMode="numeric"
            value={formData.giftAmount ? formData.giftAmount.toLocaleString('vi-VN') : ''}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '');
              setFormData({ ...formData, giftAmount: digits ? parseInt(digits, 10) : undefined });
            }}
            placeholder="Ví dụ: 500.000 (ghi sau đám cưới)"
            className="field"
          />
        </div>

        <div>
          <label className="label">Ghi chú</label>
          <textarea
            rows={2}
            value={formData.note || ''}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            placeholder="Ví dụ: Kèm 1 bé, ăn chay, ở xa lên sớm…"
            className="field py-2.5 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
};
