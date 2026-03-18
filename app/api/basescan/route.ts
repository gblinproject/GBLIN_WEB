import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mod = searchParams.get("module");
  const action = searchParams.get("action");
  const contractaddress = searchParams.get("contractaddress");
  const address = searchParams.get("address");
  const tag = searchParams.get("tag");
  const page = searchParams.get("page");
  const offset = searchParams.get("offset");
  const sort = searchParams.get("sort");

  // Costruisci l'URL per BaseScan
  let url = `https://api.basescan.org/api?module=${mod}&action=${action}`;
  
  if (contractaddress) url += `&contractaddress=${contractaddress}`;
  if (address) url += `&address=${address}`;
  if (tag) url += `&tag=${tag}`;
  if (page) url += `&page=${page}`;
  if (offset) url += `&offset=${offset}`;
  if (sort) url += `&sort=${sort}`;
  
  if (process.env.BASESCAN_API_KEY) {
    url += `&apikey=${process.env.BASESCAN_API_KEY}`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch from BaseScan" }, { status: 500 });
  }
}
