import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3031";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ tableName: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { projectName, item } = body;

    if (!projectName) {
      return NextResponse.json(
        { success: false, error: "projectName is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/dynamodb/table/${encodeURIComponent(
        params.tableName
      )}/item?projectName=${encodeURIComponent(projectName)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectName, item }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "Failed to add item" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error adding DynamoDB item:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ tableName: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { projectName, partitionKey, partitionValue, sortKey, sortValue } =
      body;

    if (!projectName || !partitionKey || !partitionValue) {
      return NextResponse.json(
        {
          success: false,
          error: "projectName, partitionKey, and partitionValue are required",
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/dynamodb/table/${encodeURIComponent(
        params.tableName
      )}/item?projectName=${encodeURIComponent(projectName)}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName,
          partitionKey,
          partitionValue,
          sortKey,
          sortValue,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "Failed to delete item" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error deleting DynamoDB item:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
