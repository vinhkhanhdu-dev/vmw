import { Guest, DuplicateCandidate, GuestSide, RelationshipCategory } from '../types';

/**
 * Remove Vietnamese accents for loose search / matching
 */
export function removeVietnameseAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Honorific prefixes commonly used in Vietnamese conversation
 */
const HONORIFICS = [
  'anh', 'chị', 'chi', 'em', 'bác', 'bac', 'cô', 'co', 'chú', 'chu',
  'ông', 'ong', 'bà', 'ba', 'dì', 'di', 'cậu', 'cau', 'bạn', 'ban'
];

/**
 * Clean up name by extracting clean display name and honorific
 */
export function cleanName(rawName: string): { clean: string; honorific: string } {
  let trimmed = rawName.trim();
  const lower = trimmed.toLowerCase();
  
  for (const h of HONORIFICS) {
    if (lower.startsWith(h + ' ')) {
      return {
        clean: trimmed.substring(h.length).trim(),
        honorific: h.charAt(0).toUpperCase() + h.slice(1)
      };
    }
  }

  return { clean: trimmed, honorific: '' };
}

/**
 * Calculate Levenshtein similarity (0 to 1)
 */
function levenshteinSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;

  const costs = [];
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[shorter.length] = lastValue;
  }
  return (longerLength - costs[shorter.length]) / longerLength;
}

/**
 * Check duplicate against existing guest list
 */
export function findDuplicateCandidates(
  candidate: { name: string; phone?: string; relationshipDetail?: string; side?: GuestSide },
  existingGuests: Guest[]
): DuplicateCandidate[] {
  const duplicates: DuplicateCandidate[] = [];
  if (!candidate.name) return duplicates;

  const candNorm = removeVietnameseAccents(candidate.name);
  const { clean: candClean } = cleanName(candidate.name);
  const candCleanNorm = removeVietnameseAccents(candClean);

  for (const guest of existingGuests) {
    let score = 0;
    const reasons: string[] = [];

    // 1. Phone number match
    if (candidate.phone && guest.phone) {
      const p1 = candidate.phone.replace(/\D/g, '');
      const p2 = guest.phone.replace(/\D/g, '');
      if (p1 && p2 && p1 === p2) {
        score = 100;
        reasons.push('Trùng số điện thoại (' + guest.phone + ')');
      }
    }

    // 2. Name match (exact accent)
    const guestNorm = removeVietnameseAccents(guest.name);
    const { clean: guestClean } = cleanName(guest.name);
    const guestCleanNorm = removeVietnameseAccents(guestClean);

    if (candidate.name.trim().toLowerCase() === guest.name.trim().toLowerCase()) {
      score = Math.max(score, 98);
      reasons.push('Tên hoàn toàn giống nhau');
    } else if (candNorm === guestNorm) {
      score = Math.max(score, 92);
      reasons.push('Tên giống nhau (khác dấu hoặc danh xưng)');
    } else if (candCleanNorm.length > 2 && candCleanNorm === guestCleanNorm) {
      score = Math.max(score, 88);
      reasons.push(`Cùng tên chính "${candClean}"`);
    } else {
      // Containment check
      const candTokens = candNorm.split(/\s+/).filter(t => t.length > 1);
      const guestTokens = guestNorm.split(/\s+/).filter(t => t.length > 1);
      
      const commonTokens = candTokens.filter(t => guestTokens.includes(t));
      if (candTokens.length >= 2 && commonTokens.length >= 2 && commonTokens.length === Math.min(candTokens.length, guestTokens.length)) {
        score = Math.max(score, 82);
        reasons.push('Tên chứa các từ giống nhau (' + commonTokens.join(' ') + ')');
      } else {
        // Levenshtein similarity on cleaned names
        const lev = levenshteinSimilarity(candCleanNorm, guestCleanNorm);
        if (lev >= 0.75 && candCleanNorm.length >= 3) {
          const calculated = Math.round(lev * 85);
          if (calculated > score) {
            score = calculated;
            reasons.push(`Tên phát âm/viết rất gần (${Math.round(lev * 100)}% tương đồng)`);
          }
        }
      }
    }

    // Context booster: If relationship details also match
    if (candidate.relationshipDetail && guest.relationshipDetail && score >= 70) {
      const rel1 = removeVietnameseAccents(candidate.relationshipDetail);
      const rel2 = removeVietnameseAccents(guest.relationshipDetail);
      if (rel1 === rel2 || rel1.includes(rel2) || rel2.includes(rel1)) {
        score = Math.min(100, score + 10);
        reasons.push(`Cùng mối quan hệ (${guest.relationshipDetail})`);
      }
    }

    if (score >= 70) {
      duplicates.push({
        existingGuest: guest,
        similarityScore: score,
        reason: reasons.join(' · ')
      });
    }
  }

  // Sort highest similarity first
  return duplicates.sort((a, b) => b.similarityScore - a.similarityScore);
}

/**
 * Smart Vietnamese text extractor for wedding guests
 */
export function extractGuestInfoFromText(text: string): {
  isAddIntent: boolean;
  isCheckDuplicateIntent: boolean;
  isSummaryIntent: boolean;
  isInvitationIntent: boolean;
  guest?: Partial<Guest>;
} {
  const norm = removeVietnameseAccents(text);

  // Check intents
  const isCheckDuplicateIntent = /trung|kiem tra trung|trung lap|soat trung|loc trung/i.test(norm);
  const isSummaryIntent = /tong ket|thong ke|bao nhieu|may ban|may mam|tong so|bao cao/i.test(norm);
  const isInvitationIntent = /mau thiep|loi moi|thiep moi|tin nhan moi|soan loi moi|nhan gi/i.test(norm);

  // Extract phone number
  const phoneMatch = text.match(/(0[35789]\d{8})/);
  const phone = phoneMatch ? phoneMatch[1] : undefined;

  // Extract count / headcount
  let count = 1;
  let childCount = 0;

  // Pattern: "X người" or "X vé" or "X suất" or "X mam"
  const countMatch = norm.match(/(\d+)\s*(nguoi|ve|suat|khach|cho)/i);
  if (countMatch) {
    count = parseInt(countMatch[1], 10);
  } else if (/ca nha|gia dinh/i.test(norm)) {
    count = 3;
  } else if (/kem vo|kem chong|kem ban gai|kem nguoi yeu|hai vo chong|2 vo chong|di 2/i.test(norm)) {
    count = 2;
  } else if (/kem con|kem be|1 be|1 con/i.test(norm)) {
    count = Math.max(count, 2);
    childCount = 1;
  }

  // Extract side
  let side: GuestSide = 'chung';
  if (/nha trai|ben trai|chu re|ben nha trai/i.test(norm)) {
    side = 'nha_trai';
  } else if (/nha gai|ben gai|co dau|ben nha gai/i.test(norm)) {
    side = 'nha_gai';
  }

  // Extract relationship
  let relationshipCategory: RelationshipCategory = 'ban_be';
  let relationshipDetail = 'Bạn bè';

  if (/cap 3|thpt/i.test(norm)) {
    relationshipCategory = 'ban_be';
    relationshipDetail = 'Bạn cấp 3';
  } else if (/dai hoc|cd|dh|cao dang/i.test(norm)) {
    relationshipCategory = 'ban_be';
    relationshipDetail = 'Bạn đại học';
  } else if (/dong nghiep|cong ty|phong|sep|cong su|cty/i.test(norm)) {
    relationshipCategory = 'dong_nghiep';
    relationshipDetail = 'Đồng nghiệp';
    const ctyMatch = text.match(/(công ty|cty)\s+([A-Za-z0-9_\s]+)/i);
    if (ctyMatch) {
      relationshipDetail = `Đồng nghiệp ${ctyMatch[2].trim().slice(0, 20)}`;
    }
  } else if (/ho hang|bac|chu|co|di|ong|ba|cau|mo|ho noi|ho ngoai/i.test(norm)) {
    relationshipCategory = 'ho_hang';
    if (/ho noi/i.test(norm)) relationshipDetail = 'Họ nội';
    else if (/ho ngoai/i.test(norm)) relationshipDetail = 'Họ ngoại';
    else relationshipDetail = 'Họ hàng';
  } else if (/vip|doi tac|khach quy/i.test(norm)) {
    relationshipCategory = 'vip';
    relationshipDetail = 'Đối tác / VIP';
  }

  // Extract Name: remove keywords like "mời", "thêm", "bổ sung", "đi", "vé", "người", phone
  let cleaned = text
    .replace(/^(mời|thêm|bổ sung|cho mình thêm|ghi nhận|lập danh sách|khách)\s+/i, '')
    .replace(/(0[35789]\d{8})/g, '')
    .trim();

  // Try to find name before context words like "bạn", "đồng nghiệp", "đi", "kèm"
  const splitKeywords = /(?:,\s*|\s+(?:bạn|đồng nghiệp|cty|công ty|họ|bác|nhà trai|nhà gái|đi|kèm|suất|vé|\d+\s*người))/i;
  const nameParts = cleaned.split(splitKeywords);
  let rawName = nameParts[0].trim();

  // If rawName still starts with "anh", "chị", etc., that's good!
  if (rawName.length < 2) {
    rawName = cleaned.slice(0, 30);
  }

  // Capitalize properly
  const formattedName = rawName
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  const isAddIntent = formattedName.length >= 2 && !isSummaryIntent && !isCheckDuplicateIntent;

  return {
    isAddIntent,
    isCheckDuplicateIntent,
    isSummaryIntent,
    isInvitationIntent,
    guest: isAddIntent ? {
      name: formattedName,
      relationshipCategory,
      relationshipDetail,
      side,
      count,
      childCount: childCount > 0 ? childCount : undefined,
      phone,
      status: 'chua_gui',
      note: text.length > 50 ? text.slice(0, 80) : undefined
    } : undefined
  };
}

/**
 * Generate culturally respectful Vietnamese wedding invitation templates
 */
export function generateInvitationMessage(
  guest: Guest,
  weddingInfo: { groomName: string; brideName: string; weddingDate: string; venueName: string; venueAddress: string; ceremonyTime: string }
): { style: string; message: string }[] {
  const name = guest.name;
  const { groomName, brideName, weddingDate, venueName, venueAddress, ceremonyTime } = weddingInfo;

  return [
    {
      style: 'Thân mật & Ấm cúng (Bạn bè, bạn thân)',
      message: `Thân gửi ${name}! 🎉\n\nNgày trọng đại của tụi mình đã đến gần! ${groomName} & ${brideName} rất mong được đón tiếp ${name} đến chung vui và nâng ly chúc phúc cùng tụi mình nhé.\n\n⏰ Thời gian: ${ceremonyTime}, ngày ${weddingDate}\n📍 Địa điểm: ${venueName} (${venueAddress})\n\nSự hiện diện của ${name} là niềm hạnh phúc lớn nhất của tụi mình! Rất mong được gặp bạn hôm đó nha! ❤️`
    },
    {
      style: 'Trang trọng & Lịch sự (Người lớn tuổi, họ hàng, VIP)',
      message: `Kính gửi ${name},\n\nGia đình chúng cháu xin trân trọng kính mời ${name} tới dự bữa cơm thân mật chung vui cùng hai cháu ${groomName} & ${brideName} nhân ngày lễ thành hôn.\n\n⏰ Thời gian: ${ceremonyTime}, ngày ${weddingDate}\n📍 Địa điểm: ${venueName}\nĐịa chỉ: ${venueAddress}\n\nSự hiện diện của ${name} là niềm vinh hạnh lớn cho hai gia đình chúng cháu. Rất hân hạnh được đón tiếp!`
    },
    {
      style: 'Nhã nhặn & Chuyên nghiệp (Đồng nghiệp, đối tác)',
      message: `Gửi ${name} thân mến,\n\nSau chặng đường đồng hành và gắn bó, ${groomName} & ${brideName} chuẩn bị bước sang một chặng đường mới. Mình xin trân trọng gửi lời mời đến ${name} tới tham dự lễ cưới ấm cúng của tụi mình.\n\n⏰ Thời gian: ${ceremonyTime}, ngày ${weddingDate}\n📍 Địa điểm: ${venueName} (${venueAddress})\n\nSự hiện diện và lời chúc mừng từ ${name} sẽ là món quà vô cùng ý nghĩa đối với tụi mình. Cảm ơn ${name} rất nhiều!`
    }
  ];
}
