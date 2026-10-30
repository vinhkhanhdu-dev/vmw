import {
  initDb,
  getDatabaseStatus,
  getAllGuests,
  saveGuest,
  deleteGuest,
  getWeddingInfo,
  saveWeddingInfo,
  getChatMessages,
  saveChatMessage,
  verifyPin,
} from './db';
import { processUserMessage } from './botHandler';

// Lazy initialize DB on first API request to avoid hanging build scripts
let dbInitPromise: Promise<boolean> | null = null;
export function ensureDbInit() {
  if (!dbInitPromise) {
    dbInitPromise = initDb().catch((err) => {
      console.warn('Database initialization note:', err);
      return false;
    });
  }
  return dbInitPromise;
}

export async function handleApiRequest(
  method: string,
  pathname: string,
  body: any,
  query?: any
): Promise<{ status: number; data: any }> {
  await ensureDbInit();
  try {
    // 1. PIN verification
    if (pathname === '/api/auth/verify-pin' && method === 'POST') {
      const { pin } = body || {};
      const isValid = verifyPin(pin);
      return {
        status: isValid ? 200 : 401,
        data: { success: isValid, message: isValid ? 'Mã PIN chính xác' : 'Mã PIN không đúng' },
      };
    }

    // 2. Health & DB Status
    if (pathname === '/api/status' && method === 'GET') {
      const status = await getDatabaseStatus();
      return { status: 200, data: status };
    }

    // 3. Fetch all initial data from MongoDB
    if (pathname === '/api/data' && method === 'GET') {
      const [guests, weddingInfo, messages, dbStatus] = await Promise.all([
        getAllGuests(),
        getWeddingInfo(),
        getChatMessages(),
        getDatabaseStatus(),
      ]);
      return {
        status: 200,
        data: { guests, weddingInfo, messages, dbStatus },
      };
    }

    // 4. Save Guest to MongoDB
    if (pathname === '/api/guests' && method === 'POST') {
      const saved = await saveGuest(body);
      return { status: 200, data: saved };
    }

    // 5. Delete Guest from MongoDB
    if (pathname.startsWith('/api/guests/') && method === 'DELETE') {
      const id = pathname.replace('/api/guests/', '');
      await deleteGuest(id);
      return { status: 200, data: { success: true, id } };
    }

    // 6. Save Wedding Info to MongoDB
    if (pathname === '/api/wedding-info' && method === 'POST') {
      const saved = await saveWeddingInfo(body);
      return { status: 200, data: saved };
    }

    // 7. Save Chat Message to MongoDB
    if (pathname === '/api/chat/messages' && method === 'POST') {
      const saved = await saveChatMessage(body);
      return { status: 200, data: saved };
    }

    // 8. Bot Chat Processing
    if (pathname === '/api/chat' && method === 'POST') {
      const { message, existingGuests, weddingInfo } = body || {};
      const guests = existingGuests || (await getAllGuests());
      const info = weddingInfo || (await getWeddingInfo());
      const result = await processUserMessage(message, guests, info);

      // If a guest was extracted and automatically accepted or prompt recorded
      return { status: 200, data: result };
    }

    return { status: 404, data: { error: 'Endpoint not found' } };
  } catch (error: any) {
    console.error(`API Error on ${method} ${pathname}:`, error);
    return { status: 500, data: { error: error?.message || 'Server processing error' } };
  }
}
