import { NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/auth-guard";
import { getNetworkTree, getNodeChildren } from "@/lib/network-tree";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const nodeId = searchParams.get("nodeId");

    if (!userId && !nodeId) {
      return NextResponse.json({ error: "userId or nodeId is required" }, { status: 400 });
    }

    if (nodeId) {
      const children = await getNodeChildren(nodeId, 2);
      return NextResponse.json({ children });
    }

    const tree = await getNetworkTree(userId!, 4);
    return NextResponse.json(tree);
  } catch (error) {
    return handleApiError(error);
  }
}
