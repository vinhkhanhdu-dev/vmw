import { Guest, WeddingInfo, ChatMessage } from '../types';

export const initialWeddingInfo: WeddingInfo = {
  groomName: 'Khánh Vinh',
  brideName: 'Ngọc Mỹ',
  weddingDate: '15/12/2026',
  ceremonyTime: '11:00',
  venueName: 'Trung Tâm Tiệc Cưới Melisa Center',
  venueAddress: 'Số 85 Thoại Ngọc Hầu, P. Hòa Thạnh, Q. Tân Phú, TP. HCM',
  tableCapacity: 10,
};

export const initialGuests: Guest[] = [
  {
    id: 'g-1',
    name: 'Anh Nguyễn Hoàng Nam',
    relationshipCategory: 'ban_be',
    relationshipDetail: 'Bạn cấp 3 Chuyên Lê Hồng Phong',
    side: 'nha_trai',
    count: 2,
    phone: '0903123456',
    status: 'xac_nhan',
    note: 'Đi cùng vợ',
    tableNumber: 'Bàn 01 (Bạn C3)',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'g-2',
    name: 'Chị Trần Thu Hà',
    relationshipCategory: 'dong_nghiep',
    relationshipDetail: 'Đồng nghiệp team Marketing',
    side: 'nha_gai',
    count: 1,
    phone: '0918765432',
    status: 'da_gui',
    note: 'Đã gửi thiệp qua công ty',
    tableNumber: 'Bàn 05 (Đồng Nghiệp)',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'g-3',
    name: 'Bác Trần Văn Tuấn',
    relationshipCategory: 'ho_hang',
    relationshipDetail: 'Bác ruột họ nội',
    side: 'nha_trai',
    count: 3,
    childCount: 1,
    phone: '0988665544',
    status: 'xac_nhan',
    note: 'Ở quê lên sớm 1 ngày, cần xếp bàn gia đình',
    tableNumber: 'Bàn VIP 01 (Họ Nội)',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'g-4',
    name: 'Anh Lê Quang Tuấn',
    relationshipCategory: 'ban_be',
    relationshipDetail: 'Bạn đại học Bách Khoa',
    side: 'nha_trai',
    count: 2,
    phone: '0977112233',
    status: 'chua_gui',
    note: 'Kèm người yêu',
    tableNumber: 'Bàn 02 (Bạn ĐH)',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'g-5',
    name: 'Anh Đỗ Thanh Bình',
    relationshipCategory: 'vip',
    relationshipDetail: 'Sếp / Trưởng phòng kỹ thuật',
    side: 'nha_trai',
    count: 2,
    phone: '0933445566',
    status: 'da_gui',
    note: 'Khách VIP cơ quan',
    tableNumber: 'Bàn VIP 02',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const initialChatMessages: ChatMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'bot',
    text: `Chào hai bạn Khánh Vinh & Ngọc Mỹ! 🎉\n\nMình là Mỹ Vinh - Trợ lý thông minh phụ trách lập danh sách và mời khách cưới. Bạn chỉ cần nhắn tin tự nhiên như trên điện thoại, ví dụ:\n• "Mời anh Nam bạn cấp 3 đi kèm vợ"\n• "Thêm chị Mai đồng nghiệp FPT 0912345678, nhà gái"\n• "Bác Ba họ nội ở quê 2 suất"\n\nMình sẽ tự động lưu thông tin, tính số bàn cỗ và đặc biệt là phát hiện ngay nếu có khách bị TRÙNG LẶP nhé!`,
    timestamp: 'Vừa xong',
    actionType: 'general',
    suggestedQuickReplies: [
      'Mời anh Nam bạn cấp 3 đi 2 người',
      'Chị Hương đồng nghiệp Tech, nhà gái',
      'Kiểm tra trùng lặp',
      'Tổng kết cỗ & khách'
    ]
  }
];
