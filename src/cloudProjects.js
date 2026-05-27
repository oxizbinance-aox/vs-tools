import { supabase } from "./supabaseClient";

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;

  return data.user;
}

export async function saveCloudProject({
  title,
  projectData
}) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("User belum login.");
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      title,
      data: projectData
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateCloudProject({
  id,
  title,
  projectData
}) {
  const { data, error } = await supabase
    .from("projects")
    .update({
      title,
      data: projectData,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function listCloudProjects() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("User belum login.");
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", {
      ascending: false
    });

  if (error) throw error;

  return data;
}

export async function deleteCloudProject(id) {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);

  if (error) throw error;

  return true;
}

export async function listTemplates() {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("is_public", true)
    .order("created_at", {
      ascending: false
    });

  if (error) throw error;

  return data;
}

export async function uploadTemplate({
  title,
  category,
  preview_url,
  data
}) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Login required.");
  }

  const { data: inserted, error } = await supabase
    .from("templates")
    .insert({
      title,
      category,
      preview_url,
      data,
      is_public: true
    })
    .select()
    .single();

  if (error) throw error;

  return inserted;
}