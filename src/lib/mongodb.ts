import { supabase } from "@/integrations/supabase/client";

interface ProfileData {
  email?: string;
  fullName?: string;
  avatarUrl?: string;
}

// Profile operations - now using Supabase
export async function upsertProfile(userId: string, profileData: ProfileData) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      email: profileData.email,
      full_name: profileData.fullName,
      avatar_url: profileData.avatarUrl,
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return { success: true, data };
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return {
    success: true,
    data: data ? {
      userId: data.user_id,
      email: data.email,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
    } : null,
  };
}

// Analysis history operations - now using Supabase
export async function saveAnalysis(userId: string, analysisData: {
  parameter: string;
  geometry: unknown;
  geometryType: string;
  startDate: string;
  endDate: string;
  results: unknown;
}) {
  const { data, error } = await supabase
    .from('analysis_history')
    .insert({
      user_id: userId,
      parameter: analysisData.parameter,
      geometry: analysisData.geometry as any,
      geometry_type: analysisData.geometryType,
      start_date: analysisData.startDate,
      end_date: analysisData.endDate,
      results: analysisData.results as any,
    })
    .select()
    .single();

  if (error) throw error;
  return { success: true, data };
}

export async function getAnalysisHistory(userId: string) {
  const { data, error } = await supabase
    .from('analysis_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return {
    success: true,
    data: (data || []).map(row => ({
      _id: row.id,
      parameter: row.parameter,
      geometryType: row.geometry_type,
      startDate: row.start_date,
      endDate: row.end_date,
      results: row.results,
      createdAt: row.created_at,
    })),
  };
}

export async function deleteAnalysis(userId: string, analysisId: string) {
  const { error } = await supabase
    .from('analysis_history')
    .delete()
    .eq('id', analysisId)
    .eq('user_id', userId);

  if (error) throw error;
  return { success: true };
}
