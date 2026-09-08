import { NextResponse } from "next/server";
// Direct public uploads are retired: all pixels must be validated server-side.
export async function POST() {
  return NextResponse.json({ error: "Rechargez la page pour utiliser l'envoi sécurisé des images." }, { status: 410 });
}
