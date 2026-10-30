import {
  Expense,
  ExpenseCategory,
  ExpensePayer,
  Guest,
  PrepItem,
  PrepSuggestion,
  WeddingInfo,
} from '../types';
import { removeVietnameseAccents } from './vietnameseNlp';

// ---------- Category metadata ----------

export const EXPENSE_CATEGORY_META: Record<ExpenseCategory, { label: string; emoji: string; color: string }> = {
  tiec: { label: 'Tiệc & nhà hàng', emoji: '🍽️', color: '#8e1d3d' },
  trang_phuc: { label: 'Trang phục', emoji: '👗', color: '#db2777' },
  anh_cuoi: { label: 'Ảnh & quay phim', emoji: '📸', color: '#4338ca' },
  trang_diem: { label: 'Trang điểm', emoji: '💄', color: '#e11d48' },
  nhan_cuoi: { label: 'Nhẫn & trang sức', emoji: '💍', color: '#c2923a' },
  le_vat: { label: 'Lễ vật & mâm quả', emoji: '🎁', color: '#d97706' },
  thiep: { label: 'Thiệp cưới', emoji: '💌', color: '#0891b2' },
  xe_cuoi: { label: 'Xe cưới & đưa đón', emoji: '🚗', color: '#2563eb' },
  trang_tri: { label: 'Trang trí & hoa', emoji: '💐', color: '#059669' },
  am_nhac: { label: 'MC & âm nhạc', emoji: '🎤', color: '#7c3aed' },
  giay_to: { label: 'Giấy tờ & thủ tục', emoji: '📝', color: '#475569' },
  khac: { label: 'Khác', emoji: '📦', color: '#78716c' },
};

export const EXPENSE_CATEGORY_ORDER = Object.keys(EXPENSE_CATEGORY_META) as ExpenseCategory[];

export const PAYER_LABEL: Record<ExpensePayer, string> = {
  nha_trai: 'Nhà Trai',
  nha_gai: 'Nhà Gái',
  chung: 'Hai bạn',
};

// ---------- Money helpers ----------

export function formatVnd(amount: number): string {
  return `${Math.round(amount || 0).toLocaleString('vi-VN')}đ`;
}

/** Gọn cho thẻ thống kê: 12,5tr · 1,2 tỷ · 800k */
export function formatVndShort(amount: number): string {
  const n = Math.round(amount || 0);
  const abs = Math.abs(n);
  const fmt = (v: number) => v.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
  if (abs >= 1_000_000_000) return `${fmt(n / 1_000_000_000)} tỷ`;
  if (abs >= 1_000_000) return `${fmt(n / 1_000_000)}tr`;
  if (abs >= 1_000) return `${fmt(n / 1_000)}k`;
  return `${n}đ`;
}

/** Đọc số tiền trong câu tiếng Việt: "15tr", "15tr5", "2 triệu 300", "500k", "1,2 tỷ", "2.000.000đ". */
export function parseVndAmount(text: string): number | undefined {
  const norm = removeVietnameseAccents(text);

  // 1. Số + đơn vị, có thể kèm phần lẻ phía sau: 15tr5, 2 trieu 300
  const unitRe = /(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr|cu|k|nghin|ngan)(?![a-z])\s*(\d{1,3}(?!\d))?/g;
  let match: RegExpExecArray | null;
  let best: number | undefined;
  while ((match = unitRe.exec(norm)) !== null) {
    const base = parseFloat(match[1].replace(',', '.'));
    const unit = match[2];
    const multiplier =
      unit === 'ty' ? 1_000_000_000 : unit === 'trieu' || unit === 'tr' || unit === 'cu' ? 1_000_000 : 1_000;
    let value = base * multiplier;
    if (match[3] && multiplier >= 1_000_000) {
      const frac = match[3];
      value += (parseInt(frac, 10) / Math.pow(10, frac.length)) * multiplier;
    }
    if (!best || value > best) best = value;
  }
  if (best) return Math.round(best);

  // 2. Số đầy đủ có phân cách nghìn: 2.000.000 / 2,000,000 / 2000000đ
  const fullRe = /(\d{1,3}(?:[.,]\d{3})+|\d{4,})/g;
  while ((match = fullRe.exec(norm)) !== null) {
    const raw = match[1];
    if (/^0[35789]\d{8}$/.test(raw)) continue; // bỏ qua số điện thoại
    const value = parseInt(raw.replace(/[.,]/g, ''), 10);
    if (value >= 1_000 && (!best || value > best)) best = value;
  }
  return best;
}

// ---------- Category detection ----------

const CATEGORY_KEYWORDS: [ExpenseCategory, RegExp][] = [
  ['giay_to', /dang ky ket hon|giay to|kham tien hon nhan|thu tuc/],
  ['anh_cuoi', /anh cuoi|chup anh|album|quay phim|pre ?wedding|phong su|studio|photo/],
  ['trang_diem', /trang diem|make ?up|lam toc|lam nail/],
  ['nhan_cuoi', /nhan cuoi|\bnhan\b|vang cuoi|trang suc|kieng|bong tai|day chuyen|lac vang/],
  ['thiep', /thiep|in an/],
  ['xe_cuoi', /xe hoa|xe cuoi|xe dua don|xe khach|xe 16|xe 29|xe 45/],
  ['am_nhac', /\bmc\b|ban nhac|ca si|am thanh|anh sang|\bdj\b/],
  ['trang_phuc', /ao dai|vay cuoi|ao cuoi|vest|giay cuoi|trang phuc|may do|thue vay/],
  ['trang_tri', /trang tri|hoa cuoi|hoa cam tay|backdrop|cong hoa|rap cuoi|phong cuoi|phong tan hon|ban tho|ban gia tien/],
  ['le_vat', /le vat|mam qua|trau cau|banh com|banh phu the|ruou|heo quay|lon quay|qua cuoi|sinh le|trap|hop qua|qua cam on|bung qua|phong bi|li xi|lixi/],
  ['tiec', /nha hang|tiec|co cuoi|mam co|ban tiec|thuc don|dat ban|sanh/],
];

export function detectExpenseCategory(text: string): ExpenseCategory {
  const norm = removeVietnameseAccents(text);
  for (const [cat, re] of CATEGORY_KEYWORDS) {
    if (re.test(norm)) return cat;
  }
  return 'khac';
}

// ---------- Date helpers ----------

/** Chấp nhận "15/12/2026", "15-12-2026", "2026-12-15". */
export function parseWeddingDate(raw?: string): Date | null {
  if (!raw) return null;
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  m = s.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return null;
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

export function parseIsoDate(iso?: string): Date | null {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

export function formatShortDate(iso?: string): string {
  const d = parseIsoDate(iso);
  return d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` : '';
}

const DAY_MS = 86_400_000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

export function daysUntilWedding(info: WeddingInfo, now = new Date()): number | null {
  const d = parseWeddingDate(info.weddingDate);
  return d ? daysBetween(now, d) : null;
}

export type DueState = 'overdue' | 'now' | 'soon' | 'later' | 'none';

/** overdue: đã quá hạn · now: trong 7 ngày · soon: trong 30 ngày · later: xa hơn. */
export function getDueState(dueIso: string | undefined, now = new Date()): DueState {
  const due = parseIsoDate(dueIso);
  if (!due) return 'none';
  const diff = daysBetween(now, due);
  if (diff < 0) return 'overdue';
  if (diff <= 7) return 'now';
  if (diff <= 30) return 'soon';
  return 'later';
}

// ---------- Prep templates (lịch chuẩn bị cưới kiểu Việt) ----------

interface PrepTemplate {
  key: string;
  title: string;
  category: ExpenseCategory;
  daysBefore: number; // Nên xong trước ngày cưới bao nhiêu ngày
  tip: string;
  estimatedCost?: number;
  aliases?: string[]; // Từ khoá không dấu để nhận ra mục người dùng tự thêm
}

export const PREP_TEMPLATES: PrepTemplate[] = [
  { key: 'xem_ngay', title: 'Xem ngày cưới, ngày ăn hỏi', category: 'khac', daysBefore: 180, tip: 'Chốt ngày sớm để đặt được sảnh tiệc đẹp, nhất là mùa cưới tháng 10 đến tháng 12.', aliases: ['xem ngay', 'chon ngay'] },
  { key: 'ngan_sach', title: 'Lập ngân sách và thống nhất chi với hai nhà', category: 'khac', daysBefore: 170, tip: 'Chia rõ khoản nào nhà trai, nhà gái hay hai bạn chi để tránh khó xử về sau.', aliases: ['ngan sach'] },
  { key: 'nha_hang', title: 'Khảo sát và đặt cọc nhà hàng tiệc cưới', category: 'tiec', daysBefore: 150, tip: 'Hỏi rõ phí phát sinh: bia nước, phụ thu cuối tuần, số bàn dự phòng tối thiểu.', estimatedCost: 30_000_000, aliases: ['nha hang', 'dat tiec', 'sanh tiec'] },
  { key: 'anh_cuoi', title: 'Chọn studio, chụp ảnh cưới', category: 'anh_cuoi', daysBefore: 120, tip: 'Chụp sớm để kịp in ảnh cổng, ảnh để bàn tiệc và làm thiệp có ảnh.', estimatedCost: 15_000_000, aliases: ['anh cuoi', 'chup anh', 'studio'] },
  { key: 'nhan_cuoi', title: 'Chọn và đặt nhẫn cưới', category: 'nhan_cuoi', daysBefore: 90, tip: 'Khắc tên cần thêm khoảng 1 đến 2 tuần, nên đặt sớm.', estimatedCost: 10_000_000, aliases: ['nhan cuoi'] },
  { key: 'trang_phuc', title: 'May áo dài, thuê váy cưới và vest', category: 'trang_phuc', daysBefore: 75, tip: 'Hẹn thử đồ lần cuối trước cưới khoảng 1 tuần để chỉnh số đo.', estimatedCost: 12_000_000, aliases: ['ao dai', 'vay cuoi', 'vest'] },
  { key: 'mc_nhac', title: 'Đặt MC, ban nhạc và âm thanh', category: 'am_nhac', daysBefore: 60, tip: 'Nhiều nhà hàng có gói MC sẵn, hỏi trước để không trả trùng.', estimatedCost: 5_000_000, aliases: ['mc ', 'ban nhac', 'ca si'] },
  { key: 'trang_diem', title: 'Đặt lịch trang điểm cô dâu', category: 'trang_diem', daysBefore: 60, tip: 'Nên trang điểm thử 1 lần, hỏi giá trọn gói cho cả lễ gia tiên và tiệc.', estimatedCost: 5_000_000, aliases: ['trang diem', 'makeup'] },
  { key: 'dang_ky_ket_hon', title: 'Đăng ký kết hôn tại UBND phường/xã', category: 'giay_to', daysBefore: 45, tip: 'Mang CCCD của hai bạn; người khác nơi cư trú cần giấy xác nhận tình trạng hôn nhân.', aliases: ['dang ky ket hon'] },
  { key: 'thiep', title: 'In thiệp cưới', category: 'thiep', daysBefore: 45, tip: 'In dư 10% so với danh sách khách, kiểm tra kỹ chính tả tên bố mẹ hai bên.', estimatedCost: 3_000_000, aliases: ['in thiep'] },
  { key: 'xe_cuoi', title: 'Thuê xe hoa và xe đưa đón họ hàng', category: 'xe_cuoi', daysBefore: 40, tip: 'Tính số xe theo số người đi rước dâu, thêm xe cho họ hàng ở xa.', estimatedCost: 6_000_000, aliases: ['xe hoa', 'xe cuoi', 'xe dua don'] },
  { key: 'le_vat', title: 'Đặt mâm quả lễ vật (trầu cau, bánh, trà rượu, heo quay)', category: 'le_vat', daysBefore: 30, tip: 'Hỏi nhà gái số tráp mong muốn, thường là số lẻ: 5, 7 hoặc 9 tráp.', estimatedCost: 8_000_000, aliases: ['mam qua', 'le vat', 'trap', 'trau cau'] },
  { key: 'doi_bung_qua', title: 'Chọn đội bưng quả nam và nữ', category: 'le_vat', daysBefore: 30, tip: 'Chọn người chưa lập gia đình, cao tương đương nhau; chuẩn bị sẵn phong bì cảm ơn.', aliases: ['bung qua'] },
  { key: 'trang_tri', title: 'Trang trí rạp, cổng hoa, bàn gia tiên', category: 'trang_tri', daysBefore: 30, tip: 'Thống nhất tông màu với ảnh cưới và thiệp để đồng bộ.', estimatedCost: 7_000_000, aliases: ['trang tri', 'cong hoa', 'ban gia tien', 'rap cuoi'] },
  { key: 'gui_thiep', title: 'Gửi thiệp mời cho khách', category: 'thiep', daysBefore: 21, tip: 'Người lớn nên mời trực tiếp; bạn bè ở xa có thể mời qua Zalo kèm thiệp online.', aliases: ['gui thiep', 'phat thiep'] },
  { key: 'chot_khach', title: 'Chốt số lượng khách và số bàn với nhà hàng', category: 'tiec', daysBefore: 10, tip: 'Gọi xác nhận lại những khách “chưa chắc” trước khi báo số bàn cuối cùng.', aliases: ['chot khach', 'chot ban', 'bao so ban'] },
  { key: 'hoa_cam_tay', title: 'Đặt hoa cầm tay và hoa cài áo', category: 'trang_tri', daysBefore: 10, tip: 'Hoa tươi nên nhận vào sáng ngày cưới hoặc tối hôm trước.', estimatedCost: 1_500_000, aliases: ['hoa cam tay', 'hoa cai ao'] },
  { key: 'phong_bi', title: 'Chuẩn bị phong bì lì xì, tiền lẻ và thùng tiền mừng', category: 'le_vat', daysBefore: 7, tip: 'Đổi tiền mới, chia sẵn phong bì cho đội bưng quả, tài xế và người phụ giúp.', estimatedCost: 3_000_000, aliases: ['phong bi', 'li xi', 'tien le', 'thung tien'] },
  { key: 'qua_cam_on', title: 'Quà cảm ơn khách và người phụ giúp', category: 'le_vat', daysBefore: 7, tip: 'Món nhỏ gọn, dễ mang về; nhớ quà riêng cho phù dâu, phù rể.', estimatedCost: 2_000_000, aliases: ['qua cam on', 'qua tang khach'] },
  { key: 'kich_ban', title: 'Lên kịch bản, giờ giấc lễ rước dâu và tiệc', category: 'khac', daysBefore: 7, tip: 'Gửi lịch trình cho MC, nhiếp ảnh, tài xế và người đại diện phát biểu hai họ.', aliases: ['kich ban', 'lich trinh'] },
  { key: 'phong_tan_hon', title: 'Dọn và trang trí phòng tân hôn', category: 'trang_tri', daysBefore: 3, tip: 'Thay ga gối mới, chuẩn bị sẵn đồ cá nhân cho ngày cưới.', aliases: ['phong tan hon', 'phong cuoi'] },
  { key: 'thanh_toan_cuoi', title: 'Chuẩn bị tiền thanh toán dịch vụ còn lại', category: 'khac', daysBefore: 2, tip: 'Rà lại các khoản còn nợ trong phần Tài chính và chia sẵn theo từng nhà cung cấp.', aliases: ['thanh toan con lai'] },
  { key: 'do_nghi_ngay_cuoi', title: 'Chuẩn bị túi đồ ngày cưới (kim chỉ, kẹp, sạc, thuốc)', category: 'khac', daysBefore: 1, tip: 'Giao cho một người thân giữ túi đồ dự phòng suốt ngày cưới.', aliases: ['tui do', 'do du phong'] },
];

function templateMatchesItem(t: PrepTemplate, item: PrepItem): boolean {
  if (item.templateKey === t.key) return true;
  const title = removeVietnameseAccents(item.title) + ' ';
  if (title.trim() === removeVietnameseAccents(t.title)) return true;
  return (t.aliases || []).some((a) => title.includes(a));
}

/** Việc "đặt dịch vụ" coi như đã làm khi sổ chi tiêu đã có khoản chi cùng hạng mục. */
const COVERED_BY_EXPENSE_CATEGORY: Record<string, ExpenseCategory> = {
  nha_hang: 'tiec',
  anh_cuoi: 'anh_cuoi',
  nhan_cuoi: 'nhan_cuoi',
  trang_phuc: 'trang_phuc',
  mc_nhac: 'am_nhac',
  trang_diem: 'trang_diem',
  thiep: 'thiep',
  xe_cuoi: 'xe_cuoi',
  le_vat: 'le_vat',
  trang_tri: 'trang_tri',
};

function isTemplateCovered(t: PrepTemplate, prepItems: PrepItem[], expenses: Expense[], info: WeddingInfo, hasDate: boolean): boolean {
  if (prepItems.some((item) => templateMatchesItem(t, item))) return true;
  if (t.key === 'xem_ngay' && hasDate) return true;
  if (t.key === 'ngan_sach' && (info.totalBudget || 0) > 0) return true;
  const cat = COVERED_BY_EXPENSE_CATEGORY[t.key];
  if (cat && expenses.some((e) => e.category === cat)) return true;
  return expenses.some((e) => {
    const title = removeVietnameseAccents(e.title) + ' ';
    return (t.aliases || []).some((a) => title.includes(a));
  });
}

const URGENCY_RANK: Record<PrepSuggestion['urgency'], number> = { overdue: 0, now: 1, soon: 2, later: 3 };

/**
 * Gợi ý các việc cần chuẩn bị chưa có trong checklist, xếp theo mức gấp.
 * Hạn được tính lùi từ ngày cưới trong phần cài đặt.
 */
export function getPrepSuggestions(
  prepItems: PrepItem[],
  weddingInfo: WeddingInfo,
  options: { now?: Date; limit?: number; expenses?: Expense[] } = {}
): PrepSuggestion[] {
  const now = options.now || new Date();
  const today = startOfDay(now);
  const wedding = parseWeddingDate(weddingInfo.weddingDate);
  if (wedding && daysBetween(now, wedding) < 0) return [];

  const expenses = options.expenses || [];
  const suggestions = PREP_TEMPLATES.filter((t) => !isTemplateCovered(t, prepItems, expenses, weddingInfo, !!wedding)).map(
    (t): PrepSuggestion => {
      const base = { templateKey: t.key, title: t.title, category: t.category, tip: t.tip, estimatedCost: t.estimatedCost };
      if (!wedding) return { ...base, urgency: 'later' };
      const due = new Date(wedding.getTime() - t.daysBefore * DAY_MS);
      if (due < today) {
        // Việc đã trễ mốc lý tưởng: đề xuất làm ngay hôm nay
        return { ...base, dueDate: toIsoDate(today), urgency: 'overdue' };
      }
      const dueDate = toIsoDate(due);
      const state = getDueState(dueDate, now);
      return { ...base, dueDate, urgency: state === 'none' || state === 'overdue' ? 'later' : state };
    }
  );

  suggestions.sort((a, b) => {
    const r = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
    return r !== 0 ? r : (a.dueDate || '').localeCompare(b.dueDate || '');
  });

  return options.limit ? suggestions.slice(0, options.limit) : suggestions;
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function suggestionToPrepItem(s: PrepSuggestion): PrepItem {
  const nowIso = new Date().toISOString();
  return {
    id: newId('p'),
    title: s.title,
    category: s.category,
    done: false,
    dueDate: s.dueDate,
    note: s.tip,
    estimatedCost: s.estimatedCost,
    templateKey: s.templateKey,
    source: 'assistant',
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

/** Mục chưa xong, đã quá hạn hoặc đến hạn trong 7 ngày. */
export function getUrgentPrepItems(prepItems: PrepItem[], now = new Date()): PrepItem[] {
  return prepItems
    .filter((p) => !p.done)
    .filter((p) => {
      const s = getDueState(p.dueDate, now);
      return s === 'overdue' || s === 'now';
    })
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
}

/** Khoản chi còn nợ, đã quá hạn hoặc đến hạn trong 7 ngày. */
export function getUpcomingPayments(expenses: Expense[], now = new Date()): Expense[] {
  return expenses
    .filter((e) => e.amount - e.paidAmount > 0)
    .filter((e) => {
      const s = getDueState(e.dueDate, now);
      return s === 'overdue' || s === 'now';
    })
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
}

// ---------- Finance summary ----------

export interface FinanceSummary {
  budget: number;
  planned: number; // Tổng giá trị các khoản chi
  paid: number;
  outstanding: number; // Còn phải trả
  budgetLeft: number; // Ngân sách trừ tổng dự kiến chi
  giftIncome: number; // Tiền mừng đã ghi nhận
  byCategory: { category: ExpenseCategory; planned: number; paid: number }[];
  byPayer: Record<ExpensePayer, number>;
}

export function summarizeFinance(expenses: Expense[], guests: Guest[], weddingInfo: WeddingInfo): FinanceSummary {
  const planned = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const paid = expenses.reduce((s, e) => s + (e.paidAmount || 0), 0);
  const outstanding = expenses.reduce((s, e) => s + Math.max(0, (e.amount || 0) - (e.paidAmount || 0)), 0);
  const budget = weddingInfo.totalBudget || 0;

  const catMap = new Map<ExpenseCategory, { planned: number; paid: number }>();
  const byPayer: Record<ExpensePayer, number> = { nha_trai: 0, nha_gai: 0, chung: 0 };
  for (const e of expenses) {
    const cur = catMap.get(e.category) || { planned: 0, paid: 0 };
    cur.planned += e.amount || 0;
    cur.paid += e.paidAmount || 0;
    catMap.set(e.category, cur);
    byPayer[e.payer || 'chung'] += e.amount || 0;
  }

  return {
    budget,
    planned,
    paid,
    outstanding,
    budgetLeft: budget - planned,
    giftIncome: guests.reduce((s, g) => s + (g.giftAmount || 0), 0),
    byCategory: [...catMap.entries()]
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.planned - a.planned),
    byPayer,
  };
}

// ---------- Chat intent detection ----------

export type PlannerIntent = 'add_expense' | 'finance_summary' | 'prep_suggestion' | null;

const EXPENSE_VERB_RE = /\b(chi|tra|coc|dat coc|thanh toan|mua|thue|ton|het|bao gia|du tru)\b/;
const FINANCE_RE = /chi tieu|ngan sach|tai chinh|da chi|tong chi|chi phi|con no|con phai tra|tien mung|het bao nhieu tien|con lai bao nhieu tien/;
const PREP_RE = /can chuan bi|chuan bi gi|chuan bi nhung gi|goi y chuan bi|goi y viec|nhac viec|viec can lam|checklist|con thieu gi|thieu gi|can sam|sam gi|can mua gi|viec gi/;

export function detectPlannerIntent(text: string): PlannerIntent {
  const norm = removeVietnameseAccents(text);
  const amount = parseVndAmount(text);
  if (amount && EXPENSE_VERB_RE.test(norm)) return 'add_expense';
  if (FINANCE_RE.test(norm)) return 'finance_summary';
  if (PREP_RE.test(norm)) return 'prep_suggestion';
  return null;
}

/** "Ngân sách 300tr" → 300_000_000 */
export function extractBudgetFromText(text: string): number | undefined {
  const norm = removeVietnameseAccents(text);
  if (!/ngan sach/.test(norm)) return undefined;
  if (!/(dat|la|tong|khoang|=|:)\s*\d|ngan sach\s+\d/.test(norm)) return undefined;
  return parseVndAmount(text);
}

const AMOUNT_STRIP_RE = /(\d+(?:[.,]\d+)?)\s*(tỷ|ty|triệu|trieu|tr|củ|cu|k|nghìn|nghin|ngàn|ngan)(?![a-zà-ỹ])\s*(\d{1,3}(?!\d))?/gi;
const LEADING_VERB_RE =
  /^\s*(ghi\s+)?(đã\s+)?(chi|trả|tra|đặt cọc|dat coc|cọc|coc|thanh toán|thanh toan|mua|thuê|thue|tốn|ton|hết|het|báo giá|bao gia|dự trù|du tru)\s+/i;

/** "Đặt cọc 10tr nhà hàng Melisa" → khoản chi đã trả 10tr. */
export function extractExpenseFromText(text: string): Partial<Expense> | null {
  const amount = parseVndAmount(text);
  if (!amount) return null;
  const norm = removeVietnameseAccents(text);

  const isQuote = /bao gia|du tru|du kien|uoc tinh/.test(norm);
  const isDeposit = /\bcoc\b/.test(norm);

  let payer: ExpensePayer = 'chung';
  if (/nha trai|ben trai|chu re/.test(norm)) payer = 'nha_trai';
  else if (/nha gai|ben gai|co dau/.test(norm)) payer = 'nha_gai';

  // Tiêu đề: bỏ động từ chi tiêu, số tiền và phe, giữ phần mô tả
  const title = text
    .replace(AMOUNT_STRIP_RE, ' ')
    .replace(/\d{1,3}(?:[.,]\d{3})+\s*(đ|đồng|vnd)?|\d{4,}\s*(đ|đồng|vnd)?/gi, ' ')
    .replace(LEADING_VERB_RE, '')
    .replace(LEADING_VERB_RE, '')
    .replace(/^\s*(tiền|tien)\s+/i, '')
    .replace(/,?\s*(nhà trai|nhà gái|nha trai|nha gai)\s*(trả|chi)?/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,:-]+|[\s,:-]+$/g, '')
    .trim();

  const finalTitle = title.length >= 2 ? title.charAt(0).toUpperCase() + title.slice(1) : 'Khoản chi cưới';

  return {
    title: finalTitle.slice(0, 60),
    category: detectExpenseCategory(text),
    amount,
    paidAmount: isQuote ? 0 : amount,
    payer,
    note: isDeposit ? 'Tiền đặt cọc, nhớ cập nhật tổng giá trị hợp đồng' : undefined,
  };
}

export function buildFinanceReply(summary: FinanceSummary, expenses: Expense[], now = new Date()): string {
  if (expenses.length === 0 && !summary.budget) {
    return '💰 Bạn chưa ghi khoản chi nào. Nhắn kiểu "Đặt cọc 10tr nhà hàng" hoặc "Chi 3tr in thiệp" là Mỹ Vinh ghi lại ngay. Bạn cũng có thể nhắn "Ngân sách 300tr" để đặt tổng ngân sách.';
  }
  const lines = [
    '💰 Tình hình tài chính đám cưới:',
    summary.budget ? `• Ngân sách: ${formatVnd(summary.budget)}` : '• Chưa đặt ngân sách tổng',
    `• Tổng dự kiến chi: ${formatVnd(summary.planned)} (${expenses.length} khoản)`,
    `• Đã thanh toán: ${formatVnd(summary.paid)}`,
    `• Còn phải trả: ${formatVnd(summary.outstanding)}`,
  ];
  if (summary.budget) {
    lines.push(
      summary.budgetLeft >= 0
        ? `• Ngân sách còn dư: ${formatVnd(summary.budgetLeft)}`
        : `⚠️ Vượt ngân sách: ${formatVnd(-summary.budgetLeft)}`
    );
  }
  if (summary.giftIncome > 0) lines.push(`• Tiền mừng đã ghi: ${formatVnd(summary.giftIncome)}`);
  const top = summary.byCategory.slice(0, 3);
  if (top.length) {
    lines.push('', 'Chi nhiều nhất:');
    for (const c of top) lines.push(`• ${EXPENSE_CATEGORY_META[c.category].label}: ${formatVnd(c.planned)}`);
  }
  const due = getUpcomingPayments(expenses, now);
  if (due.length) {
    lines.push('', '⏰ Sắp đến hạn thanh toán:');
    for (const e of due.slice(0, 3)) {
      lines.push(`• ${e.title}: còn ${formatVnd(e.amount - e.paidAmount)}${e.dueDate ? ` (hạn ${formatShortDate(e.dueDate)})` : ''}`);
    }
  }
  return lines.join('\n');
}

export function buildPrepReply(
  suggestions: PrepSuggestion[],
  prepItems: PrepItem[],
  weddingInfo: WeddingInfo,
  now = new Date()
): string {
  const days = daysUntilWedding(weddingInfo, now);
  const done = prepItems.filter((p) => p.done).length;
  const urgent = getUrgentPrepItems(prepItems, now);
  const lines: string[] = [];

  if (days !== null && days >= 0) lines.push(`📋 Còn ${days} ngày nữa là đến ngày cưới.`);
  if (prepItems.length) lines.push(`Checklist: đã xong ${done}/${prepItems.length} việc.`);
  if (urgent.length) {
    lines.push('', '⏰ Việc cần làm gấp trong checklist:');
    for (const p of urgent.slice(0, 4)) lines.push(`• ${p.title}${p.dueDate ? ` (hạn ${formatShortDate(p.dueDate)})` : ''}`);
  }
  if (suggestions.length) {
    lines.push('', '💡 Mỹ Vinh gợi ý nên chuẩn bị thêm:');
    for (const s of suggestions) {
      const flag = s.urgency === 'overdue' ? ' ⚠️ nên làm ngay' : s.urgency === 'now' ? ' (tuần này)' : '';
      lines.push(`• ${s.title}${flag}`);
    }
    lines.push('', 'Bấm vào từng mục bên dưới để thêm vào checklist nhé!');
  } else if (!urgent.length) {
    lines.push('', '✨ Checklist đã khá đầy đủ. Bạn vào tab Kế hoạch để đánh dấu những việc đã xong nhé!');
  }
  return lines.join('\n');
}

/** Lời nhắc chủ động mỗi ngày: việc gấp, khoản sắp đến hạn và gợi ý mới. */
export function buildDailyReminder(
  prepItems: PrepItem[],
  expenses: Expense[],
  weddingInfo: WeddingInfo,
  now = new Date()
): { text: string; suggestions: PrepSuggestion[] } | null {
  const urgent = getUrgentPrepItems(prepItems, now);
  const payments = getUpcomingPayments(expenses, now);
  const suggestions = getPrepSuggestions(prepItems, weddingInfo, { now, limit: 3, expenses }).filter(
    (s) => s.urgency === 'overdue' || s.urgency === 'now'
  );
  if (!urgent.length && !payments.length && !suggestions.length) return null;

  const days = daysUntilWedding(weddingInfo, now);
  const lines = [`🔔 Nhắc việc hôm nay${days !== null && days >= 0 ? ` · còn ${days} ngày đến ngày cưới` : ''}:`];
  if (urgent.length) {
    lines.push('', 'Việc đến hạn:');
    for (const p of urgent.slice(0, 3)) lines.push(`• ${p.title}${p.dueDate ? ` (hạn ${formatShortDate(p.dueDate)})` : ''}`);
  }
  if (payments.length) {
    lines.push('', 'Khoản cần thanh toán:');
    for (const e of payments.slice(0, 3)) lines.push(`• ${e.title}: còn ${formatVnd(e.amount - e.paidAmount)}`);
  }
  if (suggestions.length) {
    lines.push('', 'Bạn chưa có trong checklist:');
    for (const s of suggestions) lines.push(`• ${s.title}`);
  }
  return { text: lines.join('\n'), suggestions };
}
