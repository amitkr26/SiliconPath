import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin, requireEmployerRole } from "@/lib/employer-auth";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await requireEmployerRole(request);
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Content type must be multipart/form-data" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("logo") as File | null;
    const orgId = formData.get("organization_id") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No logo file provided" }, { status: 400 });
    }

    // Size limit: 2MB
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Logo image must be less than 2MB" }, { status: 400 });
    }

    const rawExt = file.name.split(".").pop()?.toLowerCase() || "png";
    const allowedExts = ["jpg", "jpeg", "png", "webp"];
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

    if (!allowedExts.includes(rawExt) || !allowedMimes.includes(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, and WebP images are allowed" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Magic byte inspection (no disguised SVG/HTML/executables)
    const isPng = buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isJpg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isWebp = buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP";

    if (!isPng && !isJpg && !isWebp) {
      return NextResponse.json({ error: "Corrupted or invalid image file" }, { status: 400 });
    }

    // Authorization & Ownership Verification
    const isAdmin = isUserAdmin(user);

    // Look up employer's company page or target organization
    let targetOrgId = orgId;
    let targetCompanyPage: any = null;

    if (!targetOrgId) {
      const { data: userPage } = await supabaseAdmin
        .from("company_pages")
        .select("id, organization_id, claimed_by, is_verified")
        .eq("claimed_by", user.id)
        .maybeSingle();

      if (userPage) {
        targetOrgId = userPage.organization_id;
        targetCompanyPage = userPage;
      }
    } else {
      const { data: page } = await supabaseAdmin
        .from("company_pages")
        .select("id, organization_id, claimed_by, is_verified")
        .eq("organization_id", targetOrgId)
        .maybeSingle();
      targetCompanyPage = page;
    }

    if (targetOrgId && !isAdmin) {
      const { data: org } = await supabaseAdmin
        .from("organizations")
        .select("id, created_by")
        .eq("id", targetOrgId)
        .maybeSingle();

      const isCreator = org?.created_by === user.id;
      const isClaimant = targetCompanyPage?.claimed_by === user.id;

      if (!isCreator && !isClaimant) {
        return NextResponse.json({
          error: "Forbidden: You do not have permission to manage this organization's branding."
        }, { status: 403 });
      }
    }

    // Upload to storage
    const ext = isPng ? "png" : isWebp ? "webp" : "jpg";
    const filename = `org-${targetOrgId || user.id}-${Date.now()}.${ext}`;

    // Attempt upload to 'organization-logos' bucket, fallback to 'avatars' if necessary
    let bucketName = "organization-logos";
    let uploadRes = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filename, buffer, {
        contentType: isPng ? "image/png" : isWebp ? "image/webp" : "image/jpeg",
        upsert: true,
      });

    if (uploadRes.error && uploadRes.error.message.includes("Bucket not found")) {
      bucketName = "avatars";
      uploadRes = await supabaseAdmin.storage
        .from(bucketName)
        .upload(filename, buffer, {
          contentType: isPng ? "image/png" : isWebp ? "image/webp" : "image/jpeg",
          upsert: true,
        });
    }

    if (uploadRes.error) {
      return NextResponse.json({ error: uploadRes.error.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(uploadRes.data.path);

    const logoUrl = publicUrlData.publicUrl;

    // Persist to database
    // IMPORTANT: Under NO circumstance does uploading a logo mark the organization verified.
    if (targetOrgId) {
      await supabaseAdmin
        .from("organizations")
        .update({ logo_url: logoUrl })
        .eq("id", targetOrgId);

      await supabaseAdmin
        .from("company_pages")
        .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
        .eq("organization_id", targetOrgId);
    }

    return NextResponse.json({
      success: true,
      logo_url: logoUrl,
      message: "Logo uploaded successfully"
    });
  } catch (err: any) {
    console.error("Failed to upload company logo:", err);
    return NextResponse.json({ error: err.message || "Failed to upload logo" }, { status: 500 });
  }
}
