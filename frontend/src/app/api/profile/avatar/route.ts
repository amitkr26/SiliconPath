import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  let user = null;
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseAdmin.auth.getUser(token);
    user = data.user;
  } else {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    // 1. Direct avatar URL update
    if (contentType.includes("application/json")) {
      const { avatar_url } = await request.json();
      if (!avatar_url || typeof avatar_url !== "string") {
        return NextResponse.json({ error: "Invalid avatar URL" }, { status: 400 });
      }

      await supabaseAdmin
        .from("user_profiles")
        .update({ avatar_url, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      return NextResponse.json({ avatar_url });
    }

    // 2. Multipart file upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("avatar") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No image file provided" }, { status: 400 });
      }

      // Validate size (max 3MB)
      if (file.size > 3 * 1024 * 1024) {
        return NextResponse.json({ error: "Image size must be less than 3MB" }, { status: 400 });
      }

      const rawExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const allowedExts = ["jpg", "jpeg", "png", "webp"];
      const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

      if (!allowedExts.includes(rawExt) || !allowedMimes.includes(file.type)) {
        return NextResponse.json({ error: "Only JPG, PNG, and WebP images are allowed" }, { status: 400 });
      }

      const ext = rawExt === "jpeg" ? "jpg" : rawExt;
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${user.id}/avatar-${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("avatars")
        .upload(filename, buffer, {
          contentType: file.type || "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from("avatars")
        .getPublicUrl(uploadData.path);

      const avatarUrl = publicUrlData.publicUrl;

      // Update user_profiles
      await supabaseAdmin
        .from("user_profiles")
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      return NextResponse.json({ avatar_url: avatarUrl });
    }

    return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to upload avatar" }, { status: 500 });
  }
}
