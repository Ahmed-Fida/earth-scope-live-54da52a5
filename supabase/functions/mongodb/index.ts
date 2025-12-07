import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MONGODB_DATA_API_KEY = Deno.env.get('MONGODB_DATA_API_KEY');
const MONGODB_APP_ID = Deno.env.get('MONGODB_APP_ID');
const DATABASE_NAME = 'envirosense';

// MongoDB Atlas Data API endpoint
const getDataApiUrl = () => `https://data.mongodb-api.com/app/${MONGODB_APP_ID}/endpoint/data/v1`;

interface MongoDBRequest {
  action: string;
  collection: string;
  data?: Record<string, unknown>;
  filter?: Record<string, unknown>;
  userId?: string;
}

async function callMongoDBDataAPI(
  action: string,
  collection: string,
  body: Record<string, unknown>
): Promise<unknown> {
  const url = `${getDataApiUrl()}/action/${action}`;
  
  console.log(`MongoDB Data API call: ${action} on ${collection}`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': MONGODB_DATA_API_KEY!,
    },
    body: JSON.stringify({
      dataSource: 'Cluster0', // Default cluster name, adjust if different
      database: DATABASE_NAME,
      collection,
      ...body,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`MongoDB Data API error: ${response.status} - ${errorText}`);
    throw new Error(`MongoDB API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log(`MongoDB Data API response:`, JSON.stringify(result).substring(0, 200));
  return result;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!MONGODB_DATA_API_KEY || !MONGODB_APP_ID) {
    console.error('MongoDB Data API credentials not configured');
    return new Response(
      JSON.stringify({ error: 'MongoDB Data API not configured. Please set MONGODB_DATA_API_KEY and MONGODB_APP_ID secrets.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { action, collection, data, filter, userId }: MongoDBRequest = await req.json();
    
    console.log(`Processing action: ${action} for collection: ${collection}`);
    
    const result = await handleAction(action, collection, data, filter, userId);

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
  collection: string, 
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
      const result = await callMongoDBDataAPI('insertOne', collection, { document });
      return result;
    }

    case 'findOne': {
      const result = await callMongoDBDataAPI('findOne', collection, { filter: filter || {} });
      return (result as { document: unknown }).document;
    }

    case 'find': {
      const result = await callMongoDBDataAPI('find', collection, { filter: filter || {} });
      return (result as { documents: unknown[] }).documents;
    }

    case 'updateOne': {
      const result = await callMongoDBDataAPI('updateOne', collection, {
        filter: filter || {},
        update: { $set: { ...data, updatedAt: now } },
      });
      return result;
    }

    case 'deleteOne': {
      const result = await callMongoDBDataAPI('deleteOne', collection, { filter: filter || {} });
      return result;
    }

    case 'upsertProfile': {
      const result = await callMongoDBDataAPI('updateOne', collection, {
        filter: { userId },
        update: {
          $set: { ...data, userId, updatedAt: now },
          $setOnInsert: { createdAt: now },
        },
        upsert: true,
      });
      return result;
    }

    case 'getProfile': {
      const result = await callMongoDBDataAPI('findOne', collection, {
        filter: { userId },
      });
      return (result as { document: unknown }).document;
    }

    case 'saveAnalysis': {
      const document = {
        userId,
        ...data,
        createdAt: now,
      };
      const result = await callMongoDBDataAPI('insertOne', collection, { document });
      return result;
    }

    case 'getAnalysisHistory': {
      const result = await callMongoDBDataAPI('find', collection, {
        filter: { userId },
        sort: { createdAt: -1 },
      });
      return (result as { documents: unknown[] }).documents;
    }

    case 'deleteAnalysis': {
      const result = await callMongoDBDataAPI('deleteOne', collection, {
        filter: { _id: { $oid: filter?._id as string }, userId },
      });
      return result;
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
