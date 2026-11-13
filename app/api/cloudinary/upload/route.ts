import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Aucun fichier image n'a été envoyé." }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      return NextResponse.json({ message: "Format non supporté. Utilisez JPG, JPEG, PNG ou WEBP." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: "Image trop volumineuse. La taille maximale est de 5 Mo." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await new Promise<{ secure_url?: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "barro-tv-international", resource_type: "image" },
        (error, uploaded) => {
          if (error) {
            reject(error);
            return;
          }

          if (!uploaded || !uploaded.secure_url) {
            reject(new Error("Aucune URL de retour Cloudinary."));
            return;
          }

          resolve(uploaded);
        }
      );

      uploadStream.end(buffer);
    });

    return NextResponse.json({ url: result.secure_url || "", message: "Image importée avec succès." }, { status: 200 });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json({
      message: error instanceof Error ? error.message : "Impossible de téléverser l'image.",
    }, { status: 500 });
  }
}
