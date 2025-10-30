import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import crypto from "crypto";
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

// Generates a unique random filename
const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");

export async function POST(request: Request) {
  // TODO: Secure with Better Auth
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { contentType, fileExtension } = await request.json();
    if (!contentType || !fileExtension) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const bucketName = process.env.AWS_S3_BUCKET_NAME!;
    const region = process.env.AWS_REGION!;

    // Create a unique key. You could prefix with userId:
    // const fileName = `${session.user.id}/${generateFileName()}.${fileExtension}`;
    const fileName = `${generateFileName()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      ContentType: contentType,
    });

    // Generate the presigned URL for PUT (upload)
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 600, // URL is valid for 10 minutes
    });

    // This is the permanent URL you will store in your database
    const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;

    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (error) {
    console.error("Presign URL generation failed", error);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
