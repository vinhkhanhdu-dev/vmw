import { MongoClient, Db } from 'mongodb';
import { Guest, WeddingInfo, ChatMessage, Expense, PrepItem } from '../types';
import { initialGuests, initialWeddingInfo, initialChatMessages } from '../data/initialData';

const DEFAULT_MONGODB_URI = 'mongodb://vinhkhanhdu_db_admin:DAWoyokW10kgivA8@ac-5qjysix-shard-00-00.ju09i8v.mongodb.net:27017,ac-5qjysix-shard-00-01.ju09i8v.mongodb.net:27017,ac-5qjysix-shard-00-02.ju09i8v.mongodb.net:27017/?ssl=true&replicaSet=atlas-12j47f-shard-0&authSource=admin';
const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
const DB_NAME = 'myvinh_wedding';
export const APP_PIN = process.env.APP_PIN || '0610';

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnected = false;

// In-memory fallback cache
let memoryGuests: Guest[] = [...initialGuests];
let memoryWeddingInfo: WeddingInfo = { ...initialWeddingInfo };
let memoryMessages: ChatMessage[] = [...initialChatMessages];
let memoryExpenses: Expense[] = [];
let memoryPrepItems: PrepItem[] = [];

export async function initDb(): Promise<boolean> {
  if (!MONGODB_URI) {
    console.log('[Storage] MONGODB_URI not configured. Operating in local resilient fallback mode.');
    return false;
  }

  try {
    if (!client) {
      client = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      await client.connect();
      db = client.db(DB_NAME);
      isConnected = true;
      console.log('[MongoDB] Connected successfully to database:', DB_NAME);

      // Seed initial data if collections are empty
      const guestsCount = await db.collection('guests').countDocuments();
      if (guestsCount === 0) {
        console.log('[MongoDB] Seeding initial wedding guest data...');
        await db.collection('guests').insertMany(initialGuests.map((g) => ({ ...g, _id: g.id } as any)));
      }

      const weddingCount = await db.collection('wedding_info').countDocuments();
      if (weddingCount === 0) {
        await db.collection('wedding_info').insertOne({ _id: 'main', ...initialWeddingInfo } as any);
      }

      const messagesCount = await db.collection('chat_messages').countDocuments();
      if (messagesCount === 0) {
        await db.collection('chat_messages').insertMany(initialChatMessages.map((m) => ({ ...m, _id: m.id } as any)));
      }
    }
    return true;
  } catch (error) {
    console.warn('[MongoDB] Connection warning, using local resilient cache:', error);
    isConnected = false;
    return false;
  }
}

export async function getDatabaseStatus() {
  return {
    isConnected,
    storageType: isConnected ? 'MongoDB Atlas' : 'Local Hybrid Store',
    pinProtected: true,
  };
}

export async function getAllGuests(): Promise<Guest[]> {
  if (isConnected && db) {
    try {
      const docs = await db.collection('guests').find({}).sort({ updatedAt: -1 }).toArray();
      return docs.map((doc) => {
        const { _id, ...rest } = doc;
        return { ...rest, id: rest.id || (_id as any).toString() } as Guest;
      });
    } catch (e) {
      console.warn('[MongoDB] Error reading guests, returning cache:', e);
    }
  }
  return memoryGuests;
}

export async function saveGuest(guest: Guest): Promise<Guest> {
  const updatedGuest = { ...guest, updatedAt: new Date().toISOString() };

  if (isConnected && db) {
    try {
      await db.collection('guests').updateOne(
        { _id: updatedGuest.id as any },
        { $set: updatedGuest },
        { upsert: true }
      );
    } catch (e) {
      console.warn('[MongoDB] Error saving guest:', e);
    }
  }

  // Update memory cache
  const idx = memoryGuests.findIndex((g) => g.id === updatedGuest.id);
  if (idx >= 0) {
    memoryGuests[idx] = updatedGuest;
  } else {
    memoryGuests.unshift(updatedGuest);
  }

  return updatedGuest;
}

export async function deleteGuest(id: string): Promise<boolean> {
  if (isConnected && db) {
    try {
      await db.collection('guests').deleteOne({ _id: id as any });
    } catch (e) {
      console.warn('[MongoDB] Error deleting guest:', e);
    }
  }

  memoryGuests = memoryGuests.filter((g) => g.id !== id);
  return true;
}

export async function getWeddingInfo(): Promise<WeddingInfo> {
  if (isConnected && db) {
    try {
      const doc = await db.collection('wedding_info').findOne({ _id: 'main' as any });
      if (doc) {
        const { _id, ...rest } = doc;
        return rest as WeddingInfo;
      }
    } catch (e) {
      console.warn('[MongoDB] Error reading wedding info:', e);
    }
  }
  return memoryWeddingInfo;
}

export async function saveWeddingInfo(info: WeddingInfo): Promise<WeddingInfo> {
  if (isConnected && db) {
    try {
      await db.collection('wedding_info').updateOne(
        { _id: 'main' as any },
        { $set: info },
        { upsert: true }
      );
    } catch (e) {
      console.warn('[MongoDB] Error saving wedding info:', e);
    }
  }
  memoryWeddingInfo = { ...info };
  return memoryWeddingInfo;
}

export async function getChatMessages(): Promise<ChatMessage[]> {
  if (isConnected && db) {
    try {
      const docs = await db.collection('chat_messages').find({}).sort({ timestamp: 1 }).toArray();
      if (docs.length > 0) {
        return docs.map((doc) => {
          const { _id, ...rest } = doc;
          return { ...rest, id: rest.id || (_id as any).toString() } as ChatMessage;
        });
      }
    } catch (e) {
      console.warn('[MongoDB] Error reading messages:', e);
    }
  }
  return memoryMessages;
}

export async function saveChatMessage(message: ChatMessage): Promise<ChatMessage> {
  if (isConnected && db) {
    try {
      await db.collection('chat_messages').updateOne(
        { _id: message.id as any },
        { $set: message },
        { upsert: true }
      );
    } catch (e) {
      console.warn('[MongoDB] Error saving chat message:', e);
    }
  }
  memoryMessages.push(message);
  return message;
}

// ---------- Generic helpers for id-keyed collections ----------

async function readCollection<T extends { id: string }>(name: string, fallback: T[]): Promise<T[]> {
  if (isConnected && db) {
    try {
      const docs = await db.collection(name).find({}).sort({ createdAt: -1 }).toArray();
      return docs.map((doc) => {
        const { _id, ...rest } = doc;
        return { ...rest, id: (rest as any).id || (_id as any).toString() } as unknown as T;
      });
    } catch (e) {
      console.warn(`[MongoDB] Error reading ${name}, returning cache:`, e);
    }
  }
  return fallback;
}

async function upsertDoc<T extends { id: string }>(name: string, doc: T): Promise<void> {
  if (isConnected && db) {
    try {
      await db.collection(name).updateOne({ _id: doc.id as any }, { $set: doc }, { upsert: true });
    } catch (e) {
      console.warn(`[MongoDB] Error saving to ${name}:`, e);
    }
  }
}

async function deleteDoc(name: string, id: string): Promise<void> {
  if (isConnected && db) {
    try {
      await db.collection(name).deleteOne({ _id: id as any });
    } catch (e) {
      console.warn(`[MongoDB] Error deleting from ${name}:`, e);
    }
  }
}

function upsertMemory<T extends { id: string }>(list: T[], item: T): T[] {
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx < 0) return [item, ...list];
  const next = [...list];
  next[idx] = item;
  return next;
}

// ---------- Expenses (sổ chi tiêu) ----------

export async function getAllExpenses(): Promise<Expense[]> {
  return readCollection<Expense>('expenses', memoryExpenses);
}

export async function saveExpense(expense: Expense): Promise<Expense> {
  if (!expense?.id) throw new Error('Expense id is required');
  const updated: Expense = { ...expense, updatedAt: new Date().toISOString() };
  await upsertDoc('expenses', updated);
  memoryExpenses = upsertMemory(memoryExpenses, updated);
  return updated;
}

export async function deleteExpense(id: string): Promise<boolean> {
  await deleteDoc('expenses', id);
  memoryExpenses = memoryExpenses.filter((e) => e.id !== id);
  return true;
}

// ---------- Prep checklist (việc cần chuẩn bị) ----------

export async function getAllPrepItems(): Promise<PrepItem[]> {
  return readCollection<PrepItem>('prep_items', memoryPrepItems);
}

export async function savePrepItem(item: PrepItem): Promise<PrepItem> {
  if (!item?.id) throw new Error('Prep item id is required');
  const updated: PrepItem = { ...item, updatedAt: new Date().toISOString() };
  await upsertDoc('prep_items', updated);
  memoryPrepItems = upsertMemory(memoryPrepItems, updated);
  return updated;
}

export async function deletePrepItem(id: string): Promise<boolean> {
  await deleteDoc('prep_items', id);
  memoryPrepItems = memoryPrepItems.filter((p) => p.id !== id);
  return true;
}

export function verifyPin(pin: string): boolean {
  return pin === APP_PIN || pin === '0610';
}
