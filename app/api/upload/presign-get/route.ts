import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { imageUrl } = await request.json();
    if (!imageUrl) {
      return NextResponse.json({ error: "Missing imageUrl parameter" }, { status: 400 });
    }

    const bucketName = process.env.AWS_S3_BUCKET_NAME!;

    // Extract the key from the public URL
    // Format: https://bucket-name.s3.region.amazonaws.com/key
    try {
      const url = new URL(imageUrl);
      const key = url.pathname.substring(1); // Remove leading slash
      
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      // Generate the presigned URL for GET (read)
      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600, // URL is valid for 1 hour
      });

      return NextResponse.json({ presignedUrl });
    } catch (urlError) {
      console.error("Invalid URL format", urlError);
      return NextResponse.json({ error: "Invalid image URL format" }, { status: 400 });
    }
  } catch (error) {
    console.error("Presigned GET URL generation failed", error);
    return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 });
  }
}

