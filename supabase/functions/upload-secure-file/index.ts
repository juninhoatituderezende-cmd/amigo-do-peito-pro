import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Token de autorização obrigatório");

    const token = authHeader.replace("Bearer ", "");
    
    // Initialize Supabase with service role for secure operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify user authentication
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("Usuário não autenticado");
    }

    const user = userData.user;
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const fileType = formData.get("type") as string || "document";
    const category = formData.get("category") as string || "general";

    if (!file) throw new Error("Arquivo obrigatório");

    // Validate file type and size
    const allowedTypes = {
      image: ["image/jpeg", "image/png", "image/webp"],
      document: ["application/pdf", "image/jpeg", "image/png"],
      video: ["video/mp4", "video/mov", "video/avi"]
    };

    const maxSizes = {
      image: 5 * 1024 * 1024, // 5MB
      document: 10 * 1024 * 1024, // 10MB
      video: 100 * 1024 * 1024 // 100MB
    };

    const fileTypeKey = fileType as keyof typeof allowedTypes;
    if (!allowedTypes[fileTypeKey]?.includes(file.type)) {
      throw new Error(`Tipo de arquivo não permitido: ${file.type}`);
    }

    if (file.size > maxSizes[fileTypeKey]) {
      throw new Error(`Arquivo muito grande. Máximo: ${maxSizes[fileTypeKey] / 1024 / 1024}MB`);
    }

    // Generate secure file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${user.id}/${category}/${fileName}`;

    // Choose appropriate bucket
    const bucketMap = {
      image: "avatars",
      document: "documents", 
      video: "videos"
    };

    const bucket = bucketMap[fileTypeKey];
    
    // Convert file to ArrayBuffer
    const fileBuffer = await file.arrayBuffer();

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`);

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(filePath);

    // Log upload in database
    const { error: logError } = await supabaseClient
      .from("file_uploads")
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_type: fileType,
        file_size: file.size,
        bucket: bucket,
        public_url: urlData.publicUrl,
        category: category
      });

    if (logError) {
      console.error("Error logging upload:", logError);
      // Don't fail the upload if logging fails
    }

    return new Response(JSON.stringify({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      bucket: bucket,
      file_name: file.name,
      file_size: file.size
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Upload error:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});