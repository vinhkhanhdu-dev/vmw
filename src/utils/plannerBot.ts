import { ChatActionType, Expense, Guest, PrepItem, PrepSuggestion, WeddingInfo } from '../types';
import {
  buildFinanceReply,
  buildPrepReply,
  detectPlannerIntent,
  extractBudgetFromText,
  extractExpenseFromText,
  formatVnd,
  getPrepSuggestions,
  summarizeFinance,
  EXPENSE_CATEGORY_META,
  PAYER_LABEL,
} from './weddingPlanner';

export interface PlannerBotResult {
  replyText: string;
  actionType: ChatActionType;
  extractedExpense?: Partial<Expense>;
  suggestedPrepItems?: PrepSuggestion[];
  budgetUpdate?: number;
  suggestedQuickReplies?: string[];
}

export interface PlannerContext {
  expenses?: Expense[];
  prepItems?: PrepItem[];
}

/**
 * Xử lý các câu về chi tiêu, ngân sách và việc cần chuẩn bị.
 * Chạy cục bộ, không cần Gemini, nên dùng được cả ở server lẫn client khi offline.
 */
export function processPlannerMessage(
  userMessage: string,
  existingGuests: Guest[],
  weddingInfo: WeddingInfo | undefined,
  ctx: PlannerContext = {}
): PlannerBotResult | null {
  const expenses = ctx.expenses || [];
  const prepItems = ctx.prepItems || [];
  const info: WeddingInfo = weddingInfo || ({ weddingDate: '' } as WeddingInfo);

  const budget = extractBudgetFromText(userMessage);
  if (budget) {
    const summary = summarizeFinance(expenses, existingGuests, { ...info, totalBudget: budget });
    const balance =
      summary.budgetLeft >= 0 ? `còn dư ${formatVnd(summary.budgetLeft)}` : `vượt ${formatVnd(-summary.budgetLeft)}`;
    return {
      replyText: `✅ Đã đặt tổng ngân sách đám cưới là ${formatVnd(budget)}.\n\nHiện đã lên kế hoạch chi ${formatVnd(summary.planned)}, ${balance}.`,
      actionType: 'finance_summary',
      budgetUpdate: budget,
      suggestedQuickReplies: ['Tình hình chi tiêu', 'Cần chuẩn bị gì?', 'Đặt cọc 10tr nhà hàng'],
    };
  }

  const intent = detectPlannerIntent(userMessage);
  if (!intent) return null;

  if (intent === 'add_expense') {
    const expense = extractExpenseFromText(userMessage);
    if (!expense) return null;
    const meta = EXPENSE_CATEGORY_META[expense.category || 'khac'];
    const status = expense.paidAmount ? 'đã thanh toán' : 'dự kiến, chưa trả';
    return {
      replyText: `🧾 Mỹ Vinh ghi nhận khoản chi "${expense.title}" ${formatVnd(expense.amount || 0)} (${status}), nhóm ${meta.label}, ${PAYER_LABEL[expense.payer || 'chung']} chi.\n\nBạn bấm xác nhận bên dưới để lưu vào sổ chi tiêu nhé!`,
      actionType: 'add_expense',
      extractedExpense: expense,
      suggestedQuickReplies: ['Tình hình chi tiêu', 'Cần chuẩn bị gì?'],
    };
  }

  if (intent === 'finance_summary') {
    const summary = summarizeFinance(expenses, existingGuests, info);
    return {
      replyText: buildFinanceReply(summary, expenses),
      actionType: 'finance_summary',
      suggestedQuickReplies: ['Cần chuẩn bị gì?', 'Ngân sách 300tr', 'Chi 3tr in thiệp'],
    };
  }

  const suggestions = getPrepSuggestions(prepItems, info, { limit: 5 });
  return {
    replyText: buildPrepReply(suggestions, prepItems, info),
    actionType: 'prep_suggestion',
    suggestedPrepItems: suggestions,
    suggestedQuickReplies: ['Tình hình chi tiêu', 'Tổng kết cỗ & khách'],
  };
}

