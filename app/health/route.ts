export async function GET() {
  return Response.json({
    ok: true,
    service: "rose-web-admin",
    product: "rose",
  });
}
