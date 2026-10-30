import React, { useEffect, useMemo, useState } from 'react';
import {
  Wallet,
  ListChecks,
  Plus,
  Pencil,
  Check,
  Trash2,
  Sparkles,
  AlertTriangle,
  Gift,
  ChevronDown,
  CalendarClock,
  Receipt,
} from 'lucide-react';
import { Expense, ExpenseCategory, ExpensePayer, Guest, PrepItem, PrepSuggestion, WeddingInfo } from '../types';
import { Modal, TabHeader, IconTile } from './ui';
import {
  EXPENSE_CATEGORY_META,
  EXPENSE_CATEGORY_ORDER,
  PAYER_LABEL,
  daysUntilWedding,
  formatShortDate,
  formatVnd,
  formatVndShort,
  getDueState,
  getPrepSuggestions,
  getUpcomingPayments,
  newId,
  parseVndAmount,
  summarizeFinance,
  DueState,
} from '../utils/weddingPlanner';

export type PlannerView = 'finance' | 'prep';

interface PlannerTabProps {
  guests: Guest[];
  weddingInfo: WeddingInfo;
  expenses: Expense[];
  prepItems: PrepItem[];
  view: PlannerView;
  onViewChange: (view: PlannerView) => void;
  onSaveExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onSavePrepItem: (item: PrepItem) => void;
  onDeletePrepItem: (id: string) => void;
  onAddSuggestions: (suggestions: PrepSuggestion[]) => void;
  onUpdateBudget: (budget: number) => void;
}

// ---------- Small helpers ----------

/** "15tr", "15.000.000", "500k" → số; rỗng → 0 */
function parseMoneyInput(raw: string): number {
  const s = raw.trim();
  if (!s) return 0;
  if (/^[\d.,\s]+$/.test(s)) return parseInt(s.replace(/[.,\s]/g, ''), 10) || 0;
  return parseVndAmount(s) || 0;
}

const DUE_PILL: Record<DueState, string> = {
  overdue: 'bg-rose-50 text-rose-700 border-rose-200',
  now: 'bg-amber-50 text-amber-700 border-amber-200',
  soon: 'bg-sky-50 text-sky-700 border-sky-200',
  later: 'bg-stone-100 text-stone-600 border-stone-200',
  none: 'bg-stone-100 text-stone-500 border-stone-200',
};

const URGENCY_LABEL: Record<PrepSuggestion['urgency'], string> = {
  overdue: 'Nên làm ngay',
  now: 'Tuần này',
  soon: 'Tháng này',
  later: 'Sắp tới',
};

const DueChip: React.FC<{ due?: string; done?: boolean }> = ({ due, done }) => {
  if (!due) return null;
  const state = done ? 'later' : getDueState(due);
  return (
    <span className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${DUE_PILL[state]}`}>
      <CalendarClock className="w-3 h-3" />
      {state === 'overdue' ? 'Trễ · ' : ''}
      {formatShortDate(due)}
    </span>
  );
};

const MoneyField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => {
  const parsed = parseMoneyInput(value);
  return (
    <div>
      <label className="label">{label}</label>
      <input
        className="field"
        value={value}
        placeholder={placeholder || 'VD: 15tr, 500k'}
        onChange={(e) => onChange(e.target.value)}
      />
      {value.trim() && <div className="text-[11px] text-stone-500 mt-1">= {formatVnd(parsed)}</div>}
    </div>
  );
};

// ---------- Expense modal ----------

const ExpenseModal: React.FC<{
  open: boolean;
  expense: Expense | null;
  onClose: () => void;
  onSave: (e: Expense) => void;
  onDelete: (id: string) => void;
}> = ({ open, expense, onClose, onSave, onDelete }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('tiec');
  const [amount, setAmount] = useState('');
  const [paid, setPaid] = useState('');
  const [payer, setPayer] = useState<ExpensePayer>('chung');
  const [vendor, setVendor] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle(expense?.title || '');
    setCategory(expense?.category || 'tiec');
    setAmount(expense?.amount ? String(expense.amount) : '');
    setPaid(expense?.paidAmount ? String(expense.paidAmount) : '');
    setPayer(expense?.payer || 'chung');
    setVendor(expense?.vendor || '');
    setDueDate(expense?.dueDate || '');
    setNote(expense?.note || '');
  }, [open, expense]);

  const amountNum = parseMoneyInput(amount);
  const paidNum = parseMoneyInput(paid);
  const canSave = title.trim().length > 0 && (amountNum > 0 || paidNum > 0);
  // Form điền sẵn từ checklist có createdAt rỗng: coi là khoản chi mới
  const isExisting = !!expense?.createdAt;

  const handleSave = () => {
    if (!canSave) return;
    const nowIso = new Date().toISOString();
    onSave({
      id: expense?.id || newId('e'),
      title: title.trim(),
      category,
      amount: Math.max(amountNum, paidNum),
      paidAmount: paidNum,
      payer,
      vendor: vendor.trim() || undefined,
      dueDate: dueDate || undefined,
      note: note.trim() || undefined,
      createdAt: expense?.createdAt || nowIso,
      updatedAt: nowIso,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isExisting ? 'Sửa khoản chi' : 'Thêm khoản chi'}
      subtitle="Ghi lại tổng giá trị và số đã thanh toán"
      icon={
        <IconTile className="bg-wine-50 text-wine-700">
          <Receipt className="w-4.5 h-4.5" />
        </IconTile>
      }
      footer={
        <div className="flex items-center gap-2">
          {expense && isExisting && (
            <button
              className="btn btn-ghost btn-md text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={() => {
                if (window.confirm(`Xóa khoản chi "${expense.title}"?`)) {
                  onDelete(expense.id);
                  onClose();
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
              Xóa
            </button>
          )}
          <div className="flex-1" />
          <button className="btn btn-secondary btn-md" onClick={onClose}>
            Hủy
          </button>
          <button className="btn btn-primary btn-md" disabled={!canSave} onClick={handleSave}>
            <Check className="w-4 h-4" />
            Lưu
          </button>
        </div>
      }
    >
      <div className="px-5 py-4 space-y-3.5">
        <div>
          <label className="label">Nội dung</label>
          <input
            className="field"
            value={title}
            placeholder="VD: Đặt cọc nhà hàng, chụp ảnh cưới"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Hạng mục</label>
          <select className="field select" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
            {EXPENSE_CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>
                {EXPENSE_CATEGORY_META[c].emoji} {EXPENSE_CATEGORY_META[c].label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MoneyField label="Tổng giá trị" value={amount} onChange={setAmount} />
          <div>
            <MoneyField label="Đã thanh toán" value={paid} onChange={setPaid} placeholder="Cọc / đã trả" />
            {amountNum > 0 && paidNum < amountNum && (
              <button type="button" className="text-[11px] font-semibold text-wine-700 mt-1" onClick={() => setPaid(String(amountNum))}>
                Đã trả đủ
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="label">Ai chi</label>
          <div className="seg">
            {(Object.keys(PAYER_LABEL) as ExpensePayer[]).map((p) => (
              <button key={p} type="button" className={`seg-btn ${payer === p ? 'seg-on' : ''}`} onClick={() => setPayer(p)}>
                {PAYER_LABEL[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Nhà cung cấp</label>
            <input className="field" value={vendor} placeholder="Tên, SĐT" onChange={(e) => setVendor(e.target.value)} />
          </div>
          <div>
            <label className="label">Hạn trả còn lại</label>
            <input className="field" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Ghi chú</label>
          <textarea
            className="field py-2.5 min-h-20"
            value={note}
            placeholder="Điều khoản hợp đồng, phát sinh..."
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
};

// ---------- Prep item modal ----------

const PrepItemModal: React.FC<{
  open: boolean;
  item: PrepItem | null;
  onClose: () => void;
  onSave: (p: PrepItem) => void;
  onDelete: (id: string) => void;
  onConvertToExpense: (p: PrepItem) => void;
}> = ({ open, item, onClose, onSave, onDelete, onConvertToExpense }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('khac');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [cost, setCost] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle(item?.title || '');
    setCategory(item?.category || 'khac');
    setDueDate(item?.dueDate || '');
    setNote(item?.note || '');
    setCost(item?.estimatedCost ? String(item.estimatedCost) : '');
  }, [open, item]);

  const build = (): PrepItem => {
    const nowIso = new Date().toISOString();
    return {
      id: item?.id || newId('p'),
      title: title.trim(),
      category,
      done: item?.done || false,
      dueDate: dueDate || undefined,
      note: note.trim() || undefined,
      estimatedCost: parseMoneyInput(cost) || undefined,
      templateKey: item?.templateKey,
      source: item?.source || 'user',
      createdAt: item?.createdAt || nowIso,
      updatedAt: nowIso,
    };
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? 'Chi tiết việc chuẩn bị' : 'Thêm việc chuẩn bị'}
      subtitle="Ghi chú, hạn chót và chi phí dự kiến"
      icon={
        <IconTile className="bg-gold-50 text-gold-700">
          <ListChecks className="w-4.5 h-4.5" />
        </IconTile>
      }
      footer={
        <div className="flex items-center gap-2">
          {item && (
            <button
              className="btn btn-ghost btn-icon text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              aria-label="Xóa khỏi checklist"
              onClick={() => {
                if (window.confirm(`Xóa "${item.title}" khỏi checklist?`)) {
                  onDelete(item.id);
                  onClose();
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {item && (
            <button
              className="btn btn-soft btn-md"
              disabled={!title.trim()}
              onClick={() => {
                const built = build();
                onSave(built);
                onConvertToExpense(built);
              }}
            >
              <Receipt className="w-4 h-4" />
              Ghi chi phí
            </button>
          )}
          <div className="flex-1" />
          <button
            className="btn btn-primary btn-md"
            disabled={!title.trim()}
            onClick={() => {
              onSave(build());
              onClose();
            }}
          >
            <Check className="w-4 h-4" />
            Lưu
          </button>
        </div>
      }
    >
      <div className="px-5 py-4 space-y-3.5">
        <div>
          <label className="label">Việc cần làm / món cần chuẩn bị</label>
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Hạng mục</label>
            <select className="field select" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {EXPENSE_CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>
                  {EXPENSE_CATEGORY_META[c].emoji} {EXPENSE_CATEGORY_META[c].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Hạn chót</label>
            <input className="field" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <MoneyField label="Chi phí dự kiến" value={cost} onChange={setCost} />
        <div>
          <label className="label">Ghi chú</label>
          <textarea
            className="field py-2.5 min-h-28"
            value={note}
            placeholder="Danh sách món, số lượng, liên hệ, lưu ý..."
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
};

// ---------- Finance view ----------

const FinanceView: React.FC<{
  guests: Guest[];
  weddingInfo: WeddingInfo;
  expenses: Expense[];
  onEdit: (e: Expense | null) => void;
  onUpdateBudget: (budget: number) => void;
}> = ({ guests, weddingInfo, expenses, onEdit, onUpdateBudget }) => {
  const summary = useMemo(() => summarizeFinance(expenses, guests, weddingInfo), [expenses, guests, weddingInfo]);
  const due = useMemo(() => getUpcomingPayments(expenses), [expenses]);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetText, setBudgetText] = useState('');
  const [filter, setFilter] = useState<ExpenseCategory | 'all' | 'owing'>('all');

  const giftGuests = guests.filter((g) => (g.giftAmount || 0) > 0).length;
  const usedPct = summary.budget > 0 ? Math.min(100, (summary.planned / summary.budget) * 100) : 0;
  const paidPct = summary.budget > 0 ? Math.min(100, (summary.paid / summary.budget) * 100) : 0;
  const over = summary.budget > 0 && summary.budgetLeft < 0;
  const balance = summary.giftIncome - summary.paid;

  const sorted = useMemo(() => {
    const list = expenses.filter((e) =>
      filter === 'all' ? true : filter === 'owing' ? e.amount - e.paidAmount > 0 : e.category === filter
    );
    return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [expenses, filter]);

  const usedCategories = summary.byCategory.map((c) => c.category);
  const maxCat = Math.max(1, ...summary.byCategory.map((c) => c.planned));

  return (
    <div className="space-y-3.5">
      {/* Budget overview */}
      <div className="rounded-2xl p-4 bg-linear-to-br from-wine-700 via-wine-800 to-wine-900 text-white shadow-wine">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-200">Ngân sách cưới</div>
            {editingBudget ? (
              <form
                className="mt-1.5 flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  onUpdateBudget(parseMoneyInput(budgetText));
                  setEditingBudget(false);
                }}
              >
                <input
                  autoFocus
                  className="w-36 bg-white/15 border border-white/30 rounded-lg px-2.5 py-1.5 text-sm text-white placeholder:text-white/60 outline-none"
                  placeholder="VD: 300tr"
                  value={budgetText}
                  onChange={(e) => setBudgetText(e.target.value)}
                />
                <button className="btn btn-sm bg-white text-wine-800" type="submit">
                  Lưu
                </button>
              </form>
            ) : (
              <div className="font-serif text-2xl mt-1">{summary.budget ? formatVnd(summary.budget) : 'Chưa đặt'}</div>
            )}
          </div>
          {!editingBudget && (
            <button
              className="btn btn-icon bg-white/15 hover:bg-white/25 text-white"
              aria-label="Sửa ngân sách"
              onClick={() => {
                setBudgetText(summary.budget ? String(summary.budget) : '');
                setEditingBudget(true);
              }}
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>

        {summary.budget > 0 && (
          <div className="mt-3">
            <div className="relative h-2 rounded-full bg-white/20 overflow-hidden">
              <div className={`absolute inset-y-0 left-0 ${over ? 'bg-amber-300' : 'bg-white/45'}`} style={{ width: `${usedPct}%` }} />
              <div className="absolute inset-y-0 left-0 bg-white" style={{ width: `${paidPct}%` }} />
            </div>
            <div className="text-[11px] text-white/80 mt-1.5">
              {over ? `⚠️ Vượt ngân sách ${formatVnd(-summary.budgetLeft)}` : `Còn dư ${formatVnd(summary.budgetLeft)} so với dự kiến chi`}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-white/15">
          {[
            { label: 'Dự kiến chi', value: summary.planned },
            { label: 'Đã trả', value: summary.paid },
            { label: 'Còn phải trả', value: summary.outstanding },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-[10.5px] text-white/70">{s.label}</div>
              <div className="font-semibold text-[15px] tabular-nums">{formatVndShort(s.value)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment reminders */}
      {due.length > 0 && (
        <div className="card p-3.5 border-amber-200 bg-amber-50/60">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 mb-2">
            <AlertTriangle className="w-4 h-4" />
            Sắp đến hạn thanh toán
          </div>
          <div className="space-y-1.5">
            {due.map((e) => (
              <button key={e.id} className="w-full flex items-center justify-between gap-2 text-left text-xs" onClick={() => onEdit(e)}>
                <span className="text-stone-800 font-medium truncate">{e.title}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="tabular-nums font-semibold text-stone-900">{formatVndShort(e.amount - e.paidAmount)}</span>
                  <DueChip due={e.dueDate} />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gift income */}
      <div className="card p-3.5 flex items-center gap-3">
        <IconTile className="bg-emerald-50 text-emerald-700">
          <Gift className="w-4.5 h-4.5" />
        </IconTile>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-stone-500">Tiền mừng đã ghi nhận</div>
          <div className="font-semibold text-stone-900 tabular-nums">
            {formatVnd(summary.giftIncome)}
            <span className="text-[11px] font-normal text-stone-500"> · {giftGuests} khách</span>
          </div>
        </div>
        {summary.giftIncome > 0 && (
          <div className="text-right">
            <div className="text-[10.5px] text-stone-500">So với đã trả</div>
            <div className={`text-sm font-semibold tabular-nums ${balance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {balance >= 0 ? '+' : ''}
              {formatVndShort(balance)}
            </div>
          </div>
        )}
      </div>

      {/* Category breakdown */}
      {summary.byCategory.length > 0 && (
        <div className="card p-3.5">
          <div className="eyebrow mb-2.5">Chi theo hạng mục</div>
          <div className="space-y-2">
            {summary.byCategory.map((c) => {
              const meta = EXPENSE_CATEGORY_META[c.category];
              return (
                <div key={c.category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-stone-700 font-medium">
                      {meta.emoji} {meta.label}
                    </span>
                    <span className="tabular-nums text-stone-900 font-semibold">{formatVndShort(c.planned)}</span>
                  </div>
                  <div className="relative h-1.5 rounded-full bg-stone-100 overflow-hidden">
                    <div className="absolute inset-y-0 left-0 opacity-35" style={{ width: `${(c.planned / maxCat) * 100}%`, background: meta.color }} />
                    <div className="absolute inset-y-0 left-0" style={{ width: `${(c.paid / maxCat) * 100}%`, background: meta.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-stone-100">
            {(Object.keys(PAYER_LABEL) as ExpensePayer[]).map((p) => (
              <div key={p} className="rounded-lg bg-stone-50 border border-stone-200/60 px-2 py-1.5 text-center">
                <div className="text-[10.5px] text-stone-500">{PAYER_LABEL[p]}</div>
                <div className="text-xs font-semibold tabular-nums text-stone-900">{formatVndShort(summary.byPayer[p])}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense list */}
      <div className="card overflow-hidden">
        <div className="px-3.5 pt-3.5 pb-2 flex items-center justify-between">
          <div className="eyebrow">Sổ chi tiêu ({expenses.length})</div>
          <button className="btn btn-soft btn-sm" onClick={() => onEdit(null)}>
            <Plus className="w-3.5 h-3.5" />
            Khoản chi
          </button>
        </div>

        {expenses.length > 0 && (
          <div className="px-3.5 pb-2 flex gap-1.5 overflow-x-auto scrollbar-none">
            <button className={`chip ${filter === 'all' ? 'chip-on' : 'chip-off'}`} onClick={() => setFilter('all')}>
              Tất cả
            </button>
            <button className={`chip ${filter === 'owing' ? 'chip-on' : 'chip-off'}`} onClick={() => setFilter('owing')}>
              Còn nợ
            </button>
            {usedCategories.map((c) => (
              <button key={c} className={`chip ${filter === c ? 'chip-on' : 'chip-off'}`} onClick={() => setFilter(c)}>
                {EXPENSE_CATEGORY_META[c].emoji} {EXPENSE_CATEGORY_META[c].label}
              </button>
            ))}
          </div>
        )}

        {expenses.length === 0 ? (
          <div className="px-4 pb-5 pt-2 text-center text-xs text-stone-500 leading-relaxed">
            Chưa có khoản chi nào.
            <br />
            Bấm “Khoản chi” hoặc nhắn trợ lý: <span className="font-semibold text-stone-700">“Đặt cọc 10tr nhà hàng”</span>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {sorted.map((e) => {
              const meta = EXPENSE_CATEGORY_META[e.category];
              const owing = e.amount - e.paidAmount;
              return (
                <li key={e.id}>
                  <button className="w-full px-3.5 py-2.5 flex items-center gap-3 text-left hover:bg-stone-50" onClick={() => onEdit(e)}>
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                      style={{ background: `${meta.color}14` }}
                    >
                      {meta.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-stone-900 truncate">{e.title}</div>
                      <div className="text-[11px] text-stone-500 truncate">
                        {[meta.label, PAYER_LABEL[e.payer], e.vendor].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[13px] font-semibold tabular-nums text-stone-900">{formatVndShort(e.amount)}</div>
                      {owing > 0 ? (
                        <div className="text-[10.5px] text-amber-700 font-medium">
                          Còn {formatVndShort(owing)}
                          {e.dueDate ? ` · ${formatShortDate(e.dueDate)}` : ''}
                        </div>
                      ) : (
                        <div className="text-[10.5px] text-emerald-700 font-medium">Đã trả đủ</div>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

// ---------- Prep view ----------

type PrepGroupKey = 'overdue' | 'now' | 'soon' | 'later' | 'none';

const PREP_GROUPS: { key: PrepGroupKey; label: string; tone: string }[] = [
  { key: 'overdue', label: 'Quá hạn', tone: 'text-rose-700' },
  { key: 'now', label: 'Trong 7 ngày tới', tone: 'text-amber-700' },
  { key: 'soon', label: 'Trong tháng này', tone: 'text-sky-700' },
  { key: 'later', label: 'Sau này', tone: 'text-stone-600' },
  { key: 'none', label: 'Chưa đặt hạn', tone: 'text-stone-500' },
];

const PrepView: React.FC<{
  weddingInfo: WeddingInfo;
  prepItems: PrepItem[];
  expenses: Expense[];
  onEdit: (p: PrepItem | null) => void;
  onToggle: (p: PrepItem) => void;
  onQuickAdd: (title: string, dueDate?: string) => void;
  onAddSuggestions: (s: PrepSuggestion[]) => void;
}> = ({ weddingInfo, prepItems, expenses, onEdit, onToggle, onQuickAdd, onAddSuggestions }) => {
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDue, setNewDue] = useState('');

  const suggestions = useMemo(
    () => getPrepSuggestions(prepItems, weddingInfo, { expenses }),
    [prepItems, weddingInfo, expenses]
  );
  const visibleSuggestions = showAllSuggestions ? suggestions : suggestions.slice(0, 4);
  const done = prepItems.filter((p) => p.done);
  const pct = prepItems.length ? Math.round((done.length / prepItems.length) * 100) : 0;
  const days = daysUntilWedding(weddingInfo);

  const grouped = useMemo(() => {
    const map: Record<PrepGroupKey, PrepItem[]> = { overdue: [], now: [], soon: [], later: [], none: [] };
    for (const p of prepItems) if (!p.done) map[getDueState(p.dueDate)].push(p);
    for (const k of Object.keys(map) as PrepGroupKey[]) map[k].sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    return map;
  }, [prepItems]);

  const renderRow = (p: PrepItem) => {
    const meta = EXPENSE_CATEGORY_META[p.category];
    return (
      <li key={p.id} className="flex items-start gap-3 px-3.5 py-2.5">
        <button
          onClick={() => onToggle(p)}
          aria-label={p.done ? 'Bỏ đánh dấu xong' : 'Đánh dấu đã xong'}
          className={`mt-0.5 w-5.5 h-5.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
            p.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-stone-300 hover:border-wine-400'
          }`}
        >
          {p.done && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
        </button>
        <button className="flex-1 min-w-0 text-left" onClick={() => onEdit(p)}>
          <div className={`text-[13px] font-medium leading-snug ${p.done ? 'text-stone-400 line-through' : 'text-stone-900'}`}>
            {p.title}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="text-[10.5px] text-stone-500">
              {meta.emoji} {meta.label}
            </span>
            <DueChip due={p.dueDate} done={p.done} />
            {p.estimatedCost ? <span className="text-[10.5px] text-stone-500 tabular-nums">~{formatVndShort(p.estimatedCost)}</span> : null}
            {p.source === 'assistant' && <Sparkles className="w-3 h-3 text-gold-500" aria-label="Gợi ý từ trợ lý" />}
          </div>
          {p.note && !p.done && <div className="text-[11px] text-stone-500 mt-1 line-clamp-2 whitespace-pre-line">{p.note}</div>}
        </button>
      </li>
    );
  };

  return (
    <div className="space-y-3.5">
      {/* Progress */}
      <div className="card p-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="eyebrow">Tiến độ chuẩn bị</div>
            <div className="font-serif text-2xl text-stone-900 mt-1">
              {done.length}
              <span className="text-stone-400 text-base">/{prepItems.length} việc</span>
            </div>
          </div>
          {days !== null && days >= 0 && (
            <div className="text-right">
              <div className="text-[11px] text-stone-500">Còn</div>
              <div className="text-xl font-semibold text-wine-700 tabular-nums">{days} ngày</div>
            </div>
          )}
        </div>
        <div className="h-2 rounded-full bg-stone-100 overflow-hidden mt-3">
          <div className="h-full bg-linear-to-r from-wine-600 to-gold-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Assistant suggestions */}
      {suggestions.length > 0 && (
        <div className="card overflow-hidden border-gold-200">
          <div className="px-3.5 py-2.5 flex items-center justify-between gap-2 bg-gold-50/70 border-b border-gold-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gold-700">
              <Sparkles className="w-4 h-4" />
              Mỹ Vinh gợi ý cần chuẩn bị
            </div>
            <button className="btn btn-sm btn-secondary" onClick={() => onAddSuggestions(visibleSuggestions)}>
              <Plus className="w-3.5 h-3.5" />
              Thêm {visibleSuggestions.length} mục
            </button>
          </div>
          <ul className="divide-y divide-stone-100">
            {visibleSuggestions.map((s) => (
              <li key={s.templateKey} className="px-3.5 py-2.5 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-stone-900 leading-snug">
                    {EXPENSE_CATEGORY_META[s.category].emoji} {s.title}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">{s.tip}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${DUE_PILL[s.urgency]}`}>
                      {URGENCY_LABEL[s.urgency]}
                      {s.dueDate && s.urgency !== 'overdue' ? ` · ${formatShortDate(s.dueDate)}` : ''}
                    </span>
                    {s.estimatedCost ? <span className="text-[10.5px] text-stone-500">~{formatVndShort(s.estimatedCost)}</span> : null}
                  </div>
                </div>
                <button className="btn btn-soft btn-icon" aria-label={`Thêm ${s.title}`} onClick={() => onAddSuggestions([s])}>
                  <Plus className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
          {suggestions.length > 4 && (
            <button
              className="w-full py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 border-t border-stone-100 flex items-center justify-center gap-1"
              onClick={() => setShowAllSuggestions((v) => !v)}
            >
              {showAllSuggestions ? 'Thu gọn' : `Xem thêm ${suggestions.length - 4} gợi ý`}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllSuggestions ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}

      {/* Quick add */}
      <form
        className="card p-3 flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newTitle.trim()) return;
          onQuickAdd(newTitle.trim(), newDue || undefined);
          setNewTitle('');
          setNewDue('');
        }}
      >
        <input
          className="field field-sm basis-full"
          placeholder="Ghi thêm việc / món cần chuẩn bị..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <input
          className="field field-sm flex-1 min-w-0"
          type="date"
          aria-label="Hạn chót"
          value={newDue}
          onChange={(e) => setNewDue(e.target.value)}
        />
        <button className="btn btn-primary btn-icon shrink-0" type="submit" disabled={!newTitle.trim()} aria-label="Thêm vào checklist">
          <Plus className="w-4 h-4" />
        </button>
      </form>

      {/* Checklist */}
      {prepItems.length === 0 ? (
        <div className="card p-5 text-center text-xs text-stone-500 leading-relaxed">
          Checklist đang trống. Thêm từ gợi ý của Mỹ Vinh ở trên,
          <br />
          hoặc nhắn trợ lý <span className="font-semibold text-stone-700">“Cần chuẩn bị gì?”</span>
        </div>
      ) : (
        <>
          {PREP_GROUPS.filter((g) => grouped[g.key].length > 0).map((g) => (
            <div key={g.key} className="card overflow-hidden">
              <div className={`px-3.5 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider ${g.tone}`}>
                {g.label} ({grouped[g.key].length})
              </div>
              <ul className="divide-y divide-stone-100">{grouped[g.key].map(renderRow)}</ul>
            </div>
          ))}

          {done.length > 0 && (
            <div className="card overflow-hidden">
              <button
                className="w-full px-3.5 py-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-700"
                onClick={() => setShowDone((v) => !v)}
              >
                Đã xong ({done.length})
                <ChevronDown className={`w-4 h-4 transition-transform ${showDone ? 'rotate-180' : ''}`} />
              </button>
              {showDone && <ul className="divide-y divide-stone-100 border-t border-stone-100">{done.map(renderRow)}</ul>}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ---------- Main tab ----------

export const PlannerTab: React.FC<PlannerTabProps> = ({
  guests,
  weddingInfo,
  expenses,
  prepItems,
  view,
  onViewChange,
  onSaveExpense,
  onDeleteExpense,
  onSavePrepItem,
  onDeletePrepItem,
  onAddSuggestions,
  onUpdateBudget,
}) => {
  const [expenseModal, setExpenseModal] = useState<{ open: boolean; expense: Expense | null }>({ open: false, expense: null });
  const [prepModal, setPrepModal] = useState<{ open: boolean; item: PrepItem | null }>({ open: false, item: null });

  const days = daysUntilWedding(weddingInfo);
  const pendingCount = prepItems.filter((p) => !p.done).length;

  return (
    <div className="flex flex-col h-full bg-cream text-stone-800 overflow-hidden">
      <TabHeader
        title="Kế hoạch cưới"
        subtitle={
          days !== null && days >= 0
            ? `Còn ${days} ngày · ${weddingInfo.weddingDate}`
            : `Ngày cưới ${weddingInfo.weddingDate || 'chưa đặt'}`
        }
        leading={
          <IconTile className="bg-wine-50 text-wine-700">
            {view === 'finance' ? <Wallet className="w-4.5 h-4.5" /> : <ListChecks className="w-4.5 h-4.5" />}
          </IconTile>
        }
        actions={
          <button
            className="btn btn-primary btn-sm"
            onClick={() =>
              view === 'finance' ? setExpenseModal({ open: true, expense: null }) : setPrepModal({ open: true, item: null })
            }
          >
            <Plus className="w-3.5 h-3.5" />
            {view === 'finance' ? 'Khoản chi' : 'Việc mới'}
          </button>
        }
      >
        <div className="seg">
          <button className={`seg-btn ${view === 'finance' ? 'seg-on' : ''}`} onClick={() => onViewChange('finance')}>
            💰 Tài chính
          </button>
          <button className={`seg-btn ${view === 'prep' ? 'seg-on' : ''}`} onClick={() => onViewChange('prep')}>
            📋 Chuẩn bị {pendingCount > 0 ? `(${pendingCount})` : ''}
          </button>
        </div>
      </TabHeader>

      <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-8">
        {view === 'finance' ? (
          <FinanceView
            guests={guests}
            weddingInfo={weddingInfo}
            expenses={expenses}
            onEdit={(expense) => setExpenseModal({ open: true, expense })}
            onUpdateBudget={onUpdateBudget}
          />
        ) : (
          <PrepView
            weddingInfo={weddingInfo}
            prepItems={prepItems}
            expenses={expenses}
            onEdit={(item) => setPrepModal({ open: true, item })}
            onToggle={(p) => onSavePrepItem({ ...p, done: !p.done, updatedAt: new Date().toISOString() })}
            onQuickAdd={(title, dueDate) => {
              const nowIso = new Date().toISOString();
              onSavePrepItem({
                id: newId('p'),
                title,
                category: 'khac',
                done: false,
                dueDate,
                source: 'user',
                createdAt: nowIso,
                updatedAt: nowIso,
              });
            }}
            onAddSuggestions={onAddSuggestions}
          />
        )}
      </div>

      <ExpenseModal
        open={expenseModal.open}
        expense={expenseModal.expense}
        onClose={() => setExpenseModal({ open: false, expense: null })}
        onSave={onSaveExpense}
        onDelete={onDeleteExpense}
      />

      <PrepItemModal
        open={prepModal.open}
        item={prepModal.item}
        onClose={() => setPrepModal({ open: false, item: null })}
        onSave={onSavePrepItem}
        onDelete={onDeletePrepItem}
        onConvertToExpense={(p) => {
          setPrepModal({ open: false, item: null });
          onViewChange('finance');
          // Mở form khoản chi được điền sẵn từ việc chuẩn bị (chưa lưu cho tới khi bấm Lưu)
          setExpenseModal({
            open: true,
            expense: {
              id: newId('e'),
              title: p.title,
              category: p.category,
              amount: p.estimatedCost || 0,
              paidAmount: 0,
              payer: 'chung',
              dueDate: p.dueDate,
              createdAt: '',
              updatedAt: '',
            },
          });
        }}
      />
    </div>
  );
};
