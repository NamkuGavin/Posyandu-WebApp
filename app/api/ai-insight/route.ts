import { handleInsightRequest } from "./insight-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleInsightRequest(request);
}
