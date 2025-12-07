import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MongoClient, ObjectId } from "https://deno.land/x/mongo@v0.32.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MONGODB_URI = Deno.env.get('MONGODB_URI');
const DATABASE_NAME = 'envirosense';

interface MongoDBRequest {
  action: string;
  collection: string;
  data?: Record<string, unknown>;
  filter?: Record<string, unknown>;
  userId?: string;
}

let client: MongoClient | null = null;

async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient();
    console.log('Connecting to MongoDB...');
    await client.connect(MONGODB_URI!);
    console.log('Connected to MongoDB successfully');
  }
  return client;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!MONGODB_URI) {
    console.error('MONGODB_URI not configured');
    return new Response(
      JSON.stringify({ error: 'MongoDB not configured. Please set MONGODB_URI secret.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { action, collection, data, filter, userId }: MongoDBRequest = await req.json();
    
    console.log(`Processing action: ${action} for collection: ${collection}`);
    
    const mongoClient = await getMongoClient();
    const db = mongoClient.database(DATABASE_NAME);
    const coll = db.collection(collection);
    
    const result = await handleAction(action, coll, data, filter, userId);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('MongoDB operation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleAction(
  action: string, 
  collection: ReturnType<ReturnType<MongoClient['database']>['collection']>,
  data?: Record<string, unknown>, 
  filter?: Record<string, unknown>,
  userId?: string
): Promise<unknown> {
  
  const now = new Date().toISOString();

  switch (action) {
    case 'insertOne': {
      const document = {
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      const insertId = await collection.insertOne(document);
      console.log('Inserted document with id:', insertId);
      return { insertedId: insertId };
    }

    case 'findOne': {
      const doc = await collection.findOne(filter || {});
      return doc;
    }

    case 'find': {
      const docs = await collection.find(filter || {}).toArray();
      return docs;
    }

    case 'updateOne': {
      const result = await collection.updateOne(
        filter || {},
        { $set: { ...data, updatedAt: now } }
      );
      return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount };
    }

    case 'deleteOne': {
      const result = await collection.deleteOne(filter || {});
      return { deletedCount: result };
    }

    case 'upsertProfile': {
      const result = await collection.updateOne(
        { userId },
        {
          $set: { ...data, userId, updatedAt: now },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );
      console.log('Upserted profile:', result);
      return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount, upsertedId: result.upsertedId };
    }

    case 'getProfile': {
      const doc = await collection.findOne({ userId });
      return doc;
    }

    case 'saveAnalysis': {
      const document = {
        userId,
        ...data,
        createdAt: now,
      };
      const insertId = await collection.insertOne(document);
      return { insertedId: insertId };
    }

    case 'getAnalysisHistory': {
      const docs = await collection.find({ userId }).sort({ createdAt: -1 }).toArray();
      return docs;
    }

    case 'deleteAnalysis': {
      const result = await collection.deleteOne({
        _id: new ObjectId(filter?._id as string),
        userId,
      });
      return { deletedCount: result };
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
