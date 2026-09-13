import fs from 'node:fs';
import path from 'node:path';

// Browser fixture lives only in the isolated copy, never in the application's routes.
// No session is forged and the real server actions retain their authorization guards.
const directory = path.resolve('work/urgent-production-check/src/app/ui-regression');
if (!fs.existsSync('work/urgent-production-check/src/app/layout.tsx')) throw new Error('Prepare the isolated copy first');
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(path.join(directory, 'page.tsx'), `"use client";
import { useEffect, useState } from "react";
import { ProductTable } from "@/components/admin/product-table";
import { products } from "@/data/products";
const fixture = { ...products[0], id: "ui-fixture-product", name: "Produit de test UI", publishedAt: "2026-09-13T00:00:00Z", availability: "available" as const, stockQuantity: 2 };
export default function Page() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return <section className="section admin-page" data-ui-ready={ready}><div className="container">
    <h1 className="page-title">Recette des actions</h1><p>Uniquement des donnees de test. Ne pas enregistrer.</p>
    <div className="admin-panel"><ProductTable products={[fixture]} canPersist /></div>
  </div></section>;
}
`);
console.log('Interactive admin fixture prepared in the isolated copy only.');
