import { NextResponse } from "next/server";
import { requirePartner, handleApiError } from "@/lib/auth-guard";
import { getNetworkTree, getNodeChildren } from "@/lib/network-tree";

export async function GET(req: Request) {
  try {
    const session = await requirePartner();
    const { searchParams } = new URL(req.url);
    const nodeId = searchParams.get("nodeId");

    if (nodeId) {
      const children = await getNodeChildren(nodeId, 2);
      return NextResponse.json({ children });
    }

    const tree = await getNetworkTree(session.user.id, 3);
    return NextResponse.json(tree);
  } catch (error) {
    return handleApiError(error);
  }
}
