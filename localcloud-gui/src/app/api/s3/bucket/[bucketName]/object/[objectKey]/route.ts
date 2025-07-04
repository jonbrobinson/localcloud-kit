import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3031";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ bucketName: string; objectKey: string }> }
) {
  try {
    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const projectName = searchParams.get("projectName");

    if (!projectName) {
      return NextResponse.json(
        { success: false, error: "projectName is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/s3/bucket/${encodeURIComponent(
        params.bucketName
      )}/object/${encodeURIComponent(
        params.objectKey
      )}?projectName=${encodeURIComponent(projectName)}`
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "Failed to download object" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error downloading S3 object:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ bucketName: string; objectKey: string }> }
) {
  try {
    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const projectName = searchParams.get("projectName");

    if (!projectName) {
      return NextResponse.json(
        { success: false, error: "projectName is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/s3/bucket/${encodeURIComponent(
        params.bucketName
      )}/object/${encodeURIComponent(
        params.objectKey
      )}?projectName=${encodeURIComponent(projectName)}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "Failed to delete object" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error deleting S3 object:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
