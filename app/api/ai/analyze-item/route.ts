import OpenAI from "openai";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function createPresignedGetUrl(s3Url: string) {
  try {
    const url = new URL(s3Url);
    // Get the object key from the URL pathname (e.g., /key.jpg -> key.jpg)
    const key = url.pathname.substring(1);
    const bucketName = process.env.AWS_S3_BUCKET_NAME!;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    // Generate a temporary URL valid for 5 minutes (300 seconds)
    return await getSignedUrl(s3Client, command, { expiresIn: 300 });
  } catch (error) {
    console.error("Error parsing S3 URL or generating presigned URL", error);
    throw new Error(`Invalid S3 URL: ${s3Url}`);
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageUrlFront, imageUrlBack } = await request.json();

  if (!imageUrlFront || !imageUrlBack) {
    return NextResponse.json({ error: "Missing image URLs" }, { status: 400 });
  }

  const presignedGetUrlFront = await createPresignedGetUrl(imageUrlFront);
  const presignedGetUrlBack = await createPresignedGetUrl(imageUrlBack);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      // Enforce JSON output for easy parsing
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant for a capsule wardrobe app. 
                    Analyze the provided images of a clothing item (front and back).
                    Return *only* a valid JSON object with the following keys:
                    "brand": The brand name (e.g., "Nike", "Levi's"). If unknown, return "Unknown".
                    "type": The specific type of clothing (e.g., "Crewneck T-Shirt", "Slim-fit Jeans", "Running Shoes").
                    "color": The primary color (e.g., "Navy Blue", "Heather Gray", "Off-white").
                    "description": A concise, one-sentence description.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this clothing item from the front and back photos." },
            {
              type: "image_url",
              image_url: {
                url: presignedGetUrlFront,
                // Use 'low' detail: it's much faster, cheaper, and
                // perfectly sufficient for identifying clothes.
                detail: "low",
              },
            },
            {
              type: "image_url",
              image_url: {
                url: presignedGetUrlBack,
                detail: "low",
              },
            },
          ],
        },
      ],
      max_tokens: 300, // More than enough for the JSON object
    });

    const aiContent = response.choices[0].message.content;

    if (!aiContent) {
      throw new Error("No content received from AI.");
    }

    // Parse and return the JSON data
    const data = JSON.parse(aiContent);
    return NextResponse.json(data);
  } catch (error) {
    console.error("AI analysis failed", error);
    return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
  }
}
