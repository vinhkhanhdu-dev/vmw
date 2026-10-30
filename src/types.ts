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
  actionType?: 'add_guest' | 'duplicate_warning' | 'list_summary' | 'invitation_sample' | 'delete_guest' | 'update_guest' | 'general';
  extractedGuest?: Partial<Guest>;
  duplicateCandidates?: DuplicateCandidate[];
  suggestedQuickReplies?: string[];
  resolved?: boolean; // For duplicate warning cards
}

export interface WeddingInfo {
  groomName: string;
  brideName: string;
  weddingDate: string;
  ceremonyTime: string;
  venueName: string;
  venueAddress: string;
  tableCapacity: number; // Default 10 guests / table
}
