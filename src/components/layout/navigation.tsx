"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cartStorageKey, normalizeCart } from "@/lib/cart";

const links = [{ href: "/boutique", label: "La boutique" }, { href: "/sur-mesure", label: "Sur mesure" }, { href: "/reparation", label: "Réparation" }, { href: "/savoir-faire", label: "L’atelier" }];
const adminLinks = [
  { href: "/admin", label: "Tableau de bord", compactLabel: "Dashboard" },
  { href: "/admin/produits", label: "Produits", compactLabel: "Produits" },
  { href: "/admin/commandes", label: "Commandes", compactLabel: "Commandes" },
  { href: "/admin/demandes", label: "Demandes clients", compactLabel: "Demandes" },
  { href: "/admin/livraison", label: "Livraison & réglages", compactLabel: "Réglages" }
];

export function MainNavigation({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape" && open) { setOpen(false); toggle.current?.focus(); } };
    document.addEventListener("keydown", close); return () => document.removeEventListener("keydown", close);
  }, [open]);
  return <div className="main-navigation">
    <button ref={toggle} className="menu-toggle" aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(!open)} type="button"><span>{open ? "Fermer" : "Menu"}</span><span aria-hidden="true">{open ? "×" : "☰"}</span></button>
    <nav id="main-navigation" className={`main-nav${open ? " is-open" : ""}`} aria-label="Navigation principale">
      {links.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href || pathname.startsWith(link.href + "/") ? "page" : undefined} onClick={() => setOpen(false)}>{link.label}</Link>)}
      <Link className="main-nav__contact" href="/contact" onClick={() => setOpen(false)}>Parlons de votre projet ↗</Link>
      {isAdmin ? <Link className="main-nav__dashboard" href="/admin" aria-current={pathname === "/admin" ? "page" : undefined} onClick={() => setOpen(false)}>Dashboard</Link> : null}
    </nav>
  </div>;
}

export function CartLink() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => { try { setCount(normalizeCart(JSON.parse(localStorage.getItem(cartStorageKey) || "[]")).reduce((sum, item) => sum + item.quantity, 0)); } catch { setCount(0); } };
    update(); window.addEventListener("storage", update); window.addEventListener("kayart:cart-updated", update);
    return () => { window.removeEventListener("storage", update); window.removeEventListener("kayart:cart-updated", update); };
  }, []);
  return <Link className="cart-link" href="/panier" aria-label={`Panier, ${count} article${count > 1 ? "s" : ""}`}><svg width="19" height="21" viewBox="0 0 20 22" fill="none" aria-hidden="true"><path d="M3 7h14l1 13H2L3 7Z M6 8V5a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.5" /></svg><span>Panier</span><span className="cart-count">{count}</span></Link>;
}

export function AdminNavigation() {
  const pathname = usePathname();
  const navigation = useRef<HTMLElement>(null);
  useEffect(() => {
    const current = navigation.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!current || !navigation.current || window.innerWidth > 800) return;
    navigation.current.scrollLeft += current.getBoundingClientRect().left - navigation.current.getBoundingClientRect().left - 12;
  }, [pathname]);
  return <nav ref={navigation} className="admin-navigation" aria-label="Administration"><span className="admin-navigation__label">Administration</span>
    {adminLinks.map(({ href, label, compactLabel }) => <Link key={href} href={href} aria-current={pathname === href || (href !== "/admin" && pathname.startsWith(href + "/")) ? "page" : undefined}><span className="admin-navigation__full">{label}</span><span className="admin-navigation__short">{compactLabel}</span><span className="admin-navigation__arrow" aria-hidden="true">↗</span></Link>)}
    <Link className="admin-navigation__back" href="/">Voir le site ↗</Link>
  </nav>;
}
