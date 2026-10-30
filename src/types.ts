export type TabId = 'chat' | 'guests' | 'invitations' | 'tables' | 'planner';

export type GuestSide = 'nha_trai' | 'nha_gai' | 'chung';

export type RelationshipCategory = 'ban_be' | 'dong_nghiep' | 'ho_hang' | 'vip' | 'khac';

export type InvitationStatus = 'chua_gui' | 'da_gui' | 'xac_nhan' | 'chua_chac' | 'tu_choi';

export interface Guest {
  id: string;
  name: string;
  relationshipCategory: RelationshipCategory;
  relationshipDetail: string; // e.g. "Bạn cấp 3", "Đồng nghiệp FPT", "Bác ruột chú rể"
  side: GuestSide;
  count: number; // Tổng số người (suất)
  childCount?: number;
  phone?: string;
  status: InvitationStatus;
  note?: string;
  tableNumber?: string;
  giftAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DuplicateCandidate {
  existingGuest: Guest;
  similarityScore: number; // 0 - 100
  reason: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  actionType?: ChatActionType;
  extractedGuest?: Partial<Guest>;
  duplicateCandidates?: DuplicateCandidate[];
  suggestedQuickReplies?: string[];
  resolved?: boolean; // For duplicate warning cards
  extractedExpense?: Partial<Expense>;
  suggestedPrepItems?: PrepSuggestion[];
  budgetUpdate?: number; // Bot nhận diện "Ngân sách 300tr"
}

export interface WeddingInfo {
  groomName: string;
  brideName: string;
  weddingDate: string;
  ceremonyTime: string;
  venueName: string;
  venueAddress: string;
  tableCapacity: number; // Default 10 guests / table
  totalBudget?: number; // Tổng ngân sách dự kiến (VND)
}

export type ChatActionType =
  | 'add_guest'
  | 'duplicate_warning'
  | 'list_summary'
  | 'invitation_sample'
  | 'delete_guest'
  | 'update_guest'
  | 'general'
  | 'add_expense'
  | 'finance_summary'
  | 'prep_suggestion';

// ---------- Tài chính & chi tiêu ----------

export type ExpenseCategory =
  | 'tiec'
  | 'trang_phuc'
  | 'anh_cuoi'
  | 'trang_diem'
  | 'nhan_cuoi'
  | 'le_vat'
  | 'thiep'
  | 'xe_cuoi'
  | 'trang_tri'
  | 'am_nhac'
  | 'giay_to'
  | 'khac';

export type ExpensePayer = 'nha_trai' | 'nha_gai' | 'chung';

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number; // Tổng giá trị (hợp đồng / dự kiến), VND
  paidAmount: number; // Đã thanh toán (gồm cọc), VND
  payer: ExpensePayer;
  vendor?: string;
  dueDate?: string; // YYYY-MM-DD: hạn thanh toán phần còn lại
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------- Checklist chuẩn bị ----------

export interface PrepItem {
  id: string;
  title: string;
  category: ExpenseCategory;
  done: boolean;
  dueDate?: string; // YYYY-MM-DD
  note?: string;
  estimatedCost?: number;
  templateKey?: string; // Liên kết với gợi ý mẫu của trợ lý
  source: 'user' | 'assistant';
  createdAt: string;
  updatedAt: string;
}

export interface PrepSuggestion {
  templateKey: string;
  title: string;
  category: ExpenseCategory;
  dueDate?: string; // YYYY-MM-DD
  tip: string;
  estimatedCost?: number;
  urgency: 'overdue' | 'now' | 'soon' | 'later';
}
