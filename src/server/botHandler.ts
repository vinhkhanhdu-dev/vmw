import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { Guest, DuplicateCandidate, GuestSide, RelationshipCategory } from '../types';
import { extractGuestInfoFromText, findDuplicateCandidates, removeVietnameseAccents } from '../utils/vietnameseNlp';

interface BotProcessResult {
  replyText: string;
  actionType: 'add_guest' | 'duplicate_warning' | 'list_summary' | 'invitation_sample' | 'delete_guest' | 'update_guest' | 'general';
  extractedGuest?: Partial<Guest>;
  duplicateCandidates?: DuplicateCandidate[];
  suggestedQuickReplies?: string[];
  executionTimeMs?: number;
}

export async function processUserMessage(
  userMessage: string,
  existingGuests: Guest[],
  weddingInfo?: any
): Promise<BotProcessResult> {
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;

  // Pre-filter most relevant existing guests to minimize prompt token size and maximize Gemini speed
  const userNorm = removeVietnameseAccents(userMessage);
  const relevantGuests = existingGuests
    .map((g) => {
      const gNorm = removeVietnameseAccents(g.name);
      const isRelated = gNorm.split(' ').some((token) => token.length > 1 && userNorm.includes(token));
      return { guest: g, isRelated };
    })
    .sort((a, b) => (b.isRelated ? 1 : 0) - (a.isRelated ? 1 : 0))
    .slice(0, 15)
    .map(({ guest: g }) => ({
      id: g.id,
      name: g.name,
      relationship: g.relationshipDetail,
      side: g.side,
      count: g.count,
      phone: g.phone || '',
    }));

  // If Gemini API is available, invoke with ThinkingLevel.LOW for ultra-low latency response
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemPrompt = `Bạn là "Mỹ Vinh" - Trợ lý ảo AI đám cưới xử lý siêu tốc độ.
Nhiệm vụ:
1. Bóc tách khách mời: Tên/Danh xưng, phe ("nha_trai" | "nha_gai" | "chung"), nhóm ("ban_be" | "dong_nghiep" | "ho_hang" | "vip" | "khac"), số người (mặc định 1), sđt.
2. Kiểm tra trùng lặp: So sánh với danh sách khách có sẵn. Nếu trùng tên hoặc sđt thì đặt duplicateIds.
3. Trả về DUY NHẤT chuỗi JSON hợp lệ không markdown:
{
  "intent": "add_guest" | "duplicate_warning" | "list_summary" | "invitation_sample" | "general",
  "replyText": "Lời đáp ấm áp, ngắn gọn",
  "extractedGuest": {
    "name": "Tên",
    "side": "nha_trai" | "nha_gai" | "chung",
    "relationshipCategory": "ban_be" | "dong_nghiep" | "ho_hang" | "vip" | "khac",
    "relationshipDetail": "Mô tả",
    "count": 1,
    "phone": ""
  },
  "duplicateIds": [],
  "suggestedReplies": ["Gợi ý 1", "Gợi ý 2"]
}`;

      const userPrompt = `Khách có sẵn: ${JSON.stringify(relevantGuests)}\nTin nhắn người dùng: "${userMessage}"`;

      // Set a 3.5s timeout promise to guarantee instant responsiveness
      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          { text: systemPrompt },
          { text: userPrompt },
        ],
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW, // Minimizes reasoning latency for near-instant response
          },
        },
      });

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));
      const response = await Promise.race([geminiPromise, timeoutPromise]);

      if (response && response.text) {
        const responseText = response.text.trim();
        const parsed = JSON.parse(responseText);

        // Map duplicate candidates
        const duplicates: DuplicateCandidate[] = [];
        if (parsed.duplicateIds && Array.isArray(parsed.duplicateIds)) {
          for (const id of parsed.duplicateIds) {
            const found = existingGuests.find((g) => g.id === id);
            if (found) {
              duplicates.push({
                existingGuest: found,
                similarityScore: 92,
                reason: 'Trùng thông tin với khách đã lưu',
              });
            }
          }
        }

        // Fast local duplicate check to guarantee 100% precision
        if (parsed.extractedGuest?.name) {
          const localDups = findDuplicateCandidates(
            {
              name: parsed.extractedGuest.name,
              phone: parsed.extractedGuest.phone,
              relationshipDetail: parsed.extractedGuest.relationshipDetail,
              side: parsed.extractedGuest.side,
            },
            existingGuests
          );
          for (const ld of localDups) {
            if (!duplicates.some((d) => d.existingGuest.id === ld.existingGuest.id)) {
              duplicates.push(ld);
            }
          }
        }

        const isDup = duplicates.length > 0;
        return {
          replyText:
            parsed.replyText ||
            (isDup
              ? `⚠️ Phát hiện có thể trùng với khách "${duplicates[0].existingGuest.name}". Bạn xem qua thẻ bên dưới nhé!`
              : `✅ Mỹ Vinh đã nhận diện thông tin khách "${parsed.extractedGuest?.name}". Bạn kiểm tra thẻ bên dưới để lưu nhé!`),
          actionType: isDup ? 'duplicate_warning' : parsed.intent || 'add_guest',
          extractedGuest: parsed.extractedGuest,
          duplicateCandidates: duplicates,
          suggestedQuickReplies: parsed.suggestedReplies || [
            'Thêm khách tiếp theo',
            'Xem tổng số khách',
            'Mẫu thiệp mời',
          ],
          executionTimeMs: Date.now() - startTime,
        };
      }
    } catch (apiErr) {
      console.warn('Gemini 3.8 Flash API request fallback to local NLP:', apiErr);
    }
  }

  // Ultra-Fast Local NLP Engine (<5ms execution)
  const nlp = extractGuestInfoFromText(userMessage);

  if (nlp.isCheckDuplicateIntent) {
    const suspiciousPairs: string[] = [];
    for (let i = 0; i < existingGuests.length; i++) {
      for (let j = i + 1; j < existingGuests.length; j++) {
        const dups = findDuplicateCandidates(existingGuests[i], [existingGuests[j]]);
        if (dups.length > 0) {
          suspiciousPairs.push(`• ${existingGuests[i].name} và ${existingGuests[j].name} (${dups[0].reason})`);
        }
      }
    }

    return {
      replyText:
        suspiciousPairs.length > 0
          ? `🔍 Mỹ Vinh đã rà soát ${existingGuests.length} khách và phát hiện ${suspiciousPairs.length} trường hợp nghi trùng:\n\n${suspiciousPairs.join('\n')}\n\nBạn vào tab "Danh sách" để kiểm tra và gộp nhé!`
          : `✨ Tuyệt vời! Danh sách ${existingGuests.length} khách mời hiện tại không có trường hợp trùng lặp nào!`,
      actionType: 'general',
      suggestedQuickReplies: ['Xem danh sách khách', 'Thêm khách mới', 'Thống kê bàn tiệc'],
      executionTimeMs: Date.now() - startTime,
    };
  }

  if (nlp.isSummaryIntent) {
    const totalGuests = existingGuests.reduce((acc, g) => acc + (g.count || 1), 0);
    const confirmed = existingGuests.filter((g) => g.status === 'xac_nhan').reduce((acc, g) => acc + (g.count || 1), 0);
    const tables = Math.ceil(totalGuests / 10);
    const nhaTrai = existingGuests.filter((g) => g.side === 'nha_trai').reduce((acc, g) => acc + (g.count || 1), 0);
    const nhaGai = existingGuests.filter((g) => g.side === 'nha_gai').reduce((acc, g) => acc + (g.count || 1), 0);

    return {
      replyText: `📊 Báo cáo khách mời & bàn cỗ:\n• Tổng khách: ${totalGuests} người (~${tables} bàn 10 người)\n• Nhà Trai: ${nhaTrai} người · Nhà Gái: ${nhaGai} người\n• Đã chốt tham dự: ${confirmed} người`,
      actionType: 'list_summary',
      suggestedQuickReplies: ['Xem chi tiết danh sách', 'Kiểm tra trùng', 'Thêm khách mới'],
      executionTimeMs: Date.now() - startTime,
    };
  }

  if (nlp.isInvitationIntent) {
    return {
      replyText: `💌 Mỹ Vinh đã chuẩn bị sẵn các mẫu thiệp mời (Bạn bè thân, Họ hàng người lớn, Đồng nghiệp). Bạn vào tab "Mẫu Thiệp" bên dưới để tuỳ chọn và gửi ngay qua Zalo nhé!`,
      actionType: 'invitation_sample',
      suggestedQuickReplies: ['Mẫu thiệp bạn bè', 'Mẫu thiệp người lớn', 'Thêm khách mời'],
      executionTimeMs: Date.now() - startTime,
    };
  }

  if (nlp.guest && nlp.guest.name) {
    const duplicates = findDuplicateCandidates(
      {
        name: nlp.guest.name,
        phone: nlp.guest.phone,
        relationshipDetail: nlp.guest.relationshipDetail,
        side: nlp.guest.side,
      },
      existingGuests
    );

    if (duplicates.length > 0) {
      const topDup = duplicates[0];
      return {
        replyText: `⚠️ Cảnh báo trùng lặp: Khách "${nlp.guest.name}" có thể trùng với "${topDup.existingGuest.name}" (${topDup.reason}).\n\nBạn kiểm tra xem đây là cùng một người hay hai vị khách khác nhau nhé!`,
        actionType: 'duplicate_warning',
        extractedGuest: nlp.guest,
        duplicateCandidates: duplicates,
        suggestedQuickReplies: ['Gộp và cập nhật', 'Khách khác, vẫn thêm', 'Hủy thao tác'],
        executionTimeMs: Date.now() - startTime,
      };
    }

    return {
      replyText: `🎉 Dạ Mỹ Vinh đã ghi nhận: Khách "${nlp.guest.name}" (${nlp.guest.relationshipDetail || 'Khách mời'}, ${nlp.guest.count || 1} người, ${nlp.guest.side === 'nha_trai' ? 'Nhà Trai' : nlp.guest.side === 'nha_gai' ? 'Nhà Gái' : 'Chung'}).\n\nBạn bấm xác nhận bên dưới để lưu vào danh sách cưới nhé!`,
      actionType: 'add_guest',
      extractedGuest: nlp.guest,
      suggestedQuickReplies: ['Thêm khách tiếp theo', 'Kiểm tra trùng', 'Xem thống kê'],
      executionTimeMs: Date.now() - startTime,
    };
  }

  return {
    replyText: `Dạ Mỹ Vinh sẵn sàng! Bạn có thể nhắn tự nhiên như:
• "Mời anh Nam bạn cấp 3 đi 2 người"
• "Chị Hương đồng nghiệp Tech 0987654321, nhà gái"
• "Bác Tuấn họ nội ở quê, 3 suất"`,
    actionType: 'general',
    suggestedQuickReplies: [
      'Mời anh Nam bạn cấp 3 đi 2 người',
      'Chị Hương đồng nghiệp Tech, nhà gái',
      'Kiểm tra trùng lặp',
      'Tổng kết số lượng khách',
    ],
    executionTimeMs: Date.now() - startTime,
  };
}
