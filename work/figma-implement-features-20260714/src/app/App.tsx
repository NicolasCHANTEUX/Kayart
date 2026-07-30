import { useState, useEffect, useRef, createContext, useContext } from "react";
import {
  ShoppingCart, Menu, X, Search, ChevronDown, ChevronRight, ChevronLeft,
  Package, FileText, BarChart2, LogOut, Plus, Edit2, Trash2, Eye,
  Check, AlertCircle, ArrowLeft, MapPin, Phone, Mail, Instagram,
  Facebook, Linkedin, Bell, ZoomIn, Tag, Clock, MessageSquare,
  ShoppingBag, Settings, Layers, Archive, Users, RefreshCw
} from "lucide-react";
import * as Accordion from "@radix-ui/react-accordion";

// ============================================================
// TYPES
// ============================================================
type Page =
  | "home" | "products" | "product-detail" | "services" | "contact"
  | "blog" | "blog-post" | "cart" | "checkout" | "checkout-success"
  | "login" | "admin" | "admin-products" | "admin-product-form"
  | "admin-orders" | "admin-order-detail" | "admin-reservations"
  | "admin-demandes" | "admin-demande-detail" | "admin-blog"
  | "admin-blog-form" | "admin-comments" | "legal" | "faq";

type ProductCondition = "new" | "used" | "service";
type OrderStatus = "new" | "processing" | "shipped" | "completed" | "cancelled";
type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
type ReservationStatus = "new" | "contacted" | "confirmed" | "completed" | "cancelled";
type ContactStatus = "new" | "in_progress" | "done" | "archived";
type CommentStatus = "pending" | "approved" | "rejected";

interface Category { id: number; name: string; slug: string; }
interface Product {
  id: number; title: string; slug: string; sku: string; description: string;
  price: number; discount: number; category: string; categorySlug: string;
  condition: ProductCondition; stock: number; weight?: number; dimensions?: string;
  image: string; images: string[]; active: boolean; createdAt: string;
}
interface CartItem {
  productId: number; title: string; sku: string; price: number;
  discount: number; quantity: number; image: string;
}
interface Order {
  id: number; ref: string; customerName: string; customerEmail: string;
  total: number; status: OrderStatus; paymentStatus: PaymentStatus;
  createdAt: string; items: { title: string; qty: number; price: number }[];
  notes?: string;
}
interface Reservation {
  id: number; productTitle: string; customerName: string; customerEmail: string;
  phone?: string; message?: string; status: ReservationStatus; createdAt: string;
}
interface ContactRequest {
  id: number; name: string; email: string; phone?: string; subject: string;
  message: string; status: ContactStatus; createdAt: string; reply?: string;
}
interface BlogBlock { type: "paragraph" | "image"; subtitle?: string; content?: string; image?: string; }
interface BlogPost {
  id: number; title: string; slug: string; excerpt: string; cover: string;
  publishedAt: string; commentsCount: number; published: boolean; blocks: BlogBlock[];
}
interface Comment {
  id: number; postTitle: string; author: string; email: string;
  content: string; status: CommentStatus; createdAt: string;
}

// ============================================================
// MOCK DATA
// ============================================================
const CATEGORIES: Category[] = [
  { id: 1, name: "Pagaies", slug: "pagaies" },
  { id: 2, name: "Kayaks", slug: "kayaks" },
  { id: 3, name: "Carbone", slug: "carbone" },
  { id: 4, name: "Services", slug: "services" },
];

const INIT_PRODUCTS: Product[] = [
  {
    id: 1, title: "Pagaie Carbone Elite Pro", slug: "pagaie-carbone-elite-pro", sku: "PAG-C-001",
    description: "Pagaie en carbone haute performance, légère et rigide. Conçue pour les kayakistes exigeants cherchant à optimiser chaque coup de pagaie. Poids ultra-réduit de 620 g pour une efficacité maximale sur les longues distances côtières.",
    price: 485, discount: 0, category: "Pagaies", categorySlug: "pagaies", condition: "new", stock: 8,
    weight: 0.62, dimensions: "210 cm × 8 cm",
    image: "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800&h=600&fit=crop&auto=format",
    images: ["https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800&h=600&fit=crop&auto=format",
             "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&auto=format"],
    active: true, createdAt: "2026-06-15",
  },
  {
    id: 2, title: "Kayak Monocoque Artisanal", slug: "kayak-monocoque-artisanal", sku: "KAY-M-001",
    description: "Kayak monocoque fabriqué entièrement à la main dans notre atelier. Structure en fibre de verre renforcée, coque optimisée pour la randonnée côtière. Chaque unité est unique et numérotée.",
    price: 2800, discount: 10, category: "Kayaks", categorySlug: "kayaks", condition: "new", stock: 2,
    weight: 18, dimensions: "520 cm × 58 cm × 32 cm",
    image: "https://images.unsplash.com/photo-1502791451862-7bd8c1df43a7?w=800&h=600&fit=crop&auto=format",
    images: ["https://images.unsplash.com/photo-1502791451862-7bd8c1df43a7?w=800&h=600&fit=crop&auto=format",
             "https://images.unsplash.com/photo-1533371452382-d45a9da51ad9?w=800&h=600&fit=crop&auto=format"],
    active: true, createdAt: "2026-05-20",
  },
  {
    id: 3, title: "Pagaie Fibre Touring", slug: "pagaie-fibre-touring", sku: "PAG-FV-002",
    description: "Pagaie en fibre de verre idéale pour le tourisme nautique. Bonne rigidité et poids maîtrisé pour des sorties longue distance.",
    price: 220, discount: 0, category: "Pagaies", categorySlug: "pagaies", condition: "new", stock: 15,
    weight: 0.9, dimensions: "220 cm × 9 cm",
    image: "https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=800&h=600&fit=crop&auto=format",
    images: ["https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=800&h=600&fit=crop&auto=format"],
    active: true, createdAt: "2026-04-10",
  },
  {
    id: 4, title: "Pièce Carbone Sur Mesure", slug: "piece-carbone-sur-mesure", sku: "CAR-SM-001",
    description: "Fabrication d'une pièce en carbone sur mesure selon vos spécifications. Devis établi après discussion technique.",
    price: 150, discount: 0, category: "Carbone", categorySlug: "carbone", condition: "service", stock: 999,
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&h=600&fit=crop&auto=format",
    images: ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&h=600&fit=crop&auto=format"],
    active: true, createdAt: "2026-03-01",
  },
  {
    id: 5, title: "Réparation Coque Kayak", slug: "reparation-coque-kayak", sku: "SRV-REP-001",
    description: "Service de réparation de coque en fibre ou carbone. Diagnostic inclus. Prix indicatif, un devis définitif sera établi après examen.",
    price: 90, discount: 0, category: "Services", categorySlug: "services", condition: "service", stock: 999,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&auto=format",
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&auto=format"],
    active: true, createdAt: "2026-02-15",
  },
  {
    id: 6, title: "Kayak Biplace Occasion", slug: "kayak-biplace-occasion", sku: "KAY-OCC-001",
    description: "Kayak biplace en bon état, quelques marques d'usure superficielles. Idéal pour la découverte en famille. Vendu sans accessoires.",
    price: 650, discount: 0, category: "Kayaks", categorySlug: "kayaks", condition: "used", stock: 1,
    weight: 22, dimensions: "480 cm × 72 cm × 30 cm",
    image: "https://images.unsplash.com/photo-1526507867740-f27f56b0df41?w=800&h=600&fit=crop&auto=format",
    images: ["https://images.unsplash.com/photo-1526507867740-f27f56b0df41?w=800&h=600&fit=crop&auto=format"],
    active: true, createdAt: "2026-06-01",
  },
  {
    id: 7, title: "Pagaie Carbone Racing", slug: "pagaie-carbone-racing", sku: "PAG-C-002",
    description: "Pagaie de compétition en carbone pur, asymétrique, conçue pour maximiser la puissance de traction. Pour pratiquants avancés.",
    price: 720, discount: 15, category: "Pagaies", categorySlug: "pagaies", condition: "new", stock: 0,
    weight: 0.54, dimensions: "210 cm × 7 cm",
    image: "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800&h=600&fit=crop&auto=format",
    images: ["https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800&h=600&fit=crop&auto=format"],
    active: true, createdAt: "2026-01-10",
  },
  {
    id: 8, title: "Optimisation Gouvernail", slug: "optimisation-gouvernail", sku: "SRV-OPT-001",
    description: "Service d'optimisation du système de gouvernail de votre kayak. Réglage, remplacement de câbles, ajustement du pied de gouvernail.",
    price: 60, discount: 0, category: "Services", categorySlug: "services", condition: "service", stock: 999,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&auto=format",
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&auto=format"],
    active: true, createdAt: "2026-01-05",
  },
];

const INIT_ORDERS: Order[] = [
  { id: 1, ref: "CMD-2026-001", customerName: "Marie Dupont", customerEmail: "marie.dupont@email.fr", total: 485, status: "completed", paymentStatus: "paid", createdAt: "2026-06-20", items: [{ title: "Pagaie Carbone Elite Pro", qty: 1, price: 485 }] },
  { id: 2, ref: "CMD-2026-002", customerName: "Jean-Pierre Martin", customerEmail: "jp.martin@gmail.com", total: 2520, status: "processing", paymentStatus: "paid", createdAt: "2026-07-02", items: [{ title: "Kayak Monocoque Artisanal", qty: 1, price: 2520 }] },
  { id: 3, ref: "CMD-2026-003", customerName: "Isabelle Roux", customerEmail: "isabelle.roux@hotmail.fr", total: 310, status: "new", paymentStatus: "paid", createdAt: "2026-07-08", items: [{ title: "Pagaie Fibre Touring", qty: 1, price: 220 }, { title: "Réparation Coque Kayak", qty: 1, price: 90 }] },
  { id: 4, ref: "CMD-2026-004", customerName: "Thomas Lefevre", customerEmail: "thomas.lefevre@ymail.com", total: 150, status: "shipped", paymentStatus: "paid", createdAt: "2026-07-05", items: [{ title: "Pièce Carbone Sur Mesure", qty: 1, price: 150 }] },
];

const INIT_RESERVATIONS: Reservation[] = [
  { id: 1, productTitle: "Kayak Biplace Occasion", customerName: "Lucas Bernard", customerEmail: "lucas.bernard@email.fr", phone: "+33 6 12 34 56 78", message: "Je suis très intéressé, disponible ce week-end.", status: "new", createdAt: "2026-07-09" },
  { id: 2, productTitle: "Kayak Biplace Occasion", customerName: "Sophie Lemaire", customerEmail: "sophie.lemaire@gmail.com", status: "contacted", createdAt: "2026-07-01" },
];

const INIT_CONTACT_REQUESTS: ContactRequest[] = [
  { id: 1, name: "Antoine Garnier", email: "a.garnier@gmail.com", phone: "+33 6 98 76 54 32", subject: "Demande de devis", message: "Bonjour, je souhaiterais un devis pour une pagaie carbone sur mesure en 215 cm.", status: "new", createdAt: "2026-07-10" },
  { id: 2, name: "Clara Morin", email: "c.morin@outlook.com", subject: "Réparation", message: "Ma coque a subi un choc lors d'un transport. Fissure d'environ 10 cm. Quel délai ?", status: "in_progress", createdAt: "2026-07-05" },
  { id: 3, name: "Paul Fontaine", email: "paul.fontaine@pro.fr", subject: "Autre", message: "Je représente un club de 45 membres. Faites-vous des tarifs groupe pour une flotte ?", status: "done", createdAt: "2026-06-28" },
];

const INIT_BLOG_POSTS: BlogPost[] = [
  {
    id: 1, title: "Les vertus du carbone dans la construction de pagaies", slug: "vertus-carbone-pagaies",
    excerpt: "Pourquoi le carbone s'est-il imposé comme matériau de référence ? Analyse technique et retour d'expérience de l'atelier.",
    cover: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&h=500&fit=crop&auto=format",
    publishedAt: "2026-06-10", commentsCount: 4, published: true,
    blocks: [
      { type: "paragraph", subtitle: "Une rigidité sans équivalent", content: "Le carbone offre un rapport rigidité/poids inégalé dans la fabrication de pagaies. À épaisseur équivalente, une pale en carbone transmet l'énergie de propulsion avec une efficacité bien supérieure à la fibre de verre traditionnelle." },
      { type: "paragraph", content: "Dans notre atelier à Saint-Aubin-des-Coudrais, chaque pagaie est stratifiée à la main selon des techniques éprouvées sur plusieurs saisons de compétition et de randonnée côtière." },
      { type: "image", image: "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800&h=400&fit=crop&auto=format" },
      { type: "paragraph", subtitle: "Le process de stratification", content: "Nous utilisons un pre-preg carbone basse température pour garantir une finition homogène et une tenue mécanique durable. Le moule est traité sous vide pendant 8 heures minimum." },
    ],
  },
  {
    id: 2, title: "Réparation de coque : ce qu'il faut savoir", slug: "reparation-coque-guide",
    excerpt: "Choc, fissure, délaminage... Voici comment évaluer l'état de votre coque avant de nous confier votre bateau.",
    cover: "https://images.unsplash.com/photo-1533371452382-d45a9da51ad9?w=1200&h=500&fit=crop&auto=format",
    publishedAt: "2026-05-22", commentsCount: 2, published: true,
    blocks: [
      { type: "paragraph", subtitle: "Identifier les dommages", content: "Une rayure superficielle ne nécessite souvent qu'un polissage. Une fissure traversant la structure ou un délaminage demande une intervention sérieuse." },
      { type: "paragraph", content: "Apportez votre bateau vidé et nettoyé. Nous effectuons un diagnostic visuel dans les 48h et vous proposons un devis avant tout travail." },
    ],
  },
  {
    id: 3, title: "Raid côtier Bretagne-Normandie 2026 : retour d'expérience", slug: "raid-cotier-2026",
    excerpt: "Cinq membres de l'atelier ont participé au raid de 320 km cet été. Récit et bilan matériel sur nos pagaies carbone.",
    cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=500&fit=crop&auto=format",
    publishedAt: "2026-07-01", commentsCount: 7, published: true,
    blocks: [
      { type: "paragraph", subtitle: "320 km le long des côtes", content: "Partis de Saint-Malo le 14 juin, nous avons rejoint Le Havre en 11 jours. Les conditions ont été capricieuses : mer belle les 4 premiers jours, puis force 4-5 à partir du cap de Carteret." },
      { type: "paragraph", content: "Nos pagaies Elite Pro ont tenu sans le moindre problème. Zéro casse, zéro délaminage malgré les conditions chargées. Un beau test en conditions réelles." },
    ],
  },
];

const INIT_COMMENTS: Comment[] = [
  { id: 1, postTitle: "Les vertus du carbone...", author: "Marc Dubois", email: "marc.d@gmail.com", content: "Excellent article ! Je me pose la question depuis longtemps du passage au carbone. Vous m'avez convaincu.", status: "approved", createdAt: "2026-06-12" },
  { id: 2, postTitle: "Les vertus du carbone...", author: "Nathalie Perrin", email: "", content: "Bravo pour la qualité technique de vos articles. On sent l'expertise.", status: "approved", createdAt: "2026-06-15" },
  { id: 3, postTitle: "Les vertus du carbone...", author: "spammer123", email: "spam@spam.com", content: "Acheter des pagaies pas chères ici: http://spam.example.com", status: "rejected", createdAt: "2026-06-18" },
  { id: 4, postTitle: "Les vertus du carbone...", author: "Pierre Gallois", email: "p.gallois@kayak.fr", content: "Question : quelle est la durée de vie d'une pagaie carbone avec une utilisation intensive (5 jours/semaine) ?", status: "pending", createdAt: "2026-07-10" },
  { id: 5, postTitle: "Réparation de coque...", author: "Julie Maret", email: "julie.maret@gmail.com", content: "Merci pour ces informations claires ! J'arrive la semaine prochaine avec mon kayak.", status: "approved", createdAt: "2026-05-25" },
  { id: 6, postTitle: "Raid côtier...", author: "Romain Costa", email: "r.costa@live.fr", content: "Superbe aventure ! Quelle autonomie prenez-vous pour un tel raid ?", status: "pending", createdAt: "2026-07-03" },
];

// ============================================================
// UTILS
// ============================================================
const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
const fmtDate = (d: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d));
const finalPrice = (price: number, discount: number) => discount > 0 ? price * (1 - discount / 100) : price;
const cartTotal = (items: CartItem[]) => items.reduce((s, i) => s + finalPrice(i.price, i.discount) * i.quantity, 0);
const cartCount = (items: CartItem[]) => items.reduce((s, i) => s + i.quantity, 0);

const stockInfo = (p: Product) => {
  if (p.condition === "service") return { label: "Disponible", cls: "bg-green-100 text-green-700" };
  if (p.stock === 0) return { label: "Rupture de stock", cls: "bg-red-100 text-red-700" };
  if (p.stock <= 3) return { label: `${p.stock} en stock`, cls: "bg-orange-100 text-orange-700" };
  return { label: "En stock", cls: "bg-green-100 text-green-700" };
};

const statusLabels: Record<string, { label: string; cls: string }> = {
  new: { label: "Nouvelle", cls: "bg-blue-100 text-blue-700" },
  processing: { label: "En cours", cls: "bg-yellow-100 text-yellow-700" },
  shipped: { label: "Expédiée", cls: "bg-purple-100 text-purple-700" },
  completed: { label: "Terminée", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "Annulée", cls: "bg-red-100 text-red-700" },
  pending: { label: "En attente", cls: "bg-yellow-100 text-yellow-700" },
  paid: { label: "Payée", cls: "bg-green-100 text-green-700" },
  failed: { label: "Échouée", cls: "bg-red-100 text-red-700" },
  refunded: { label: "Remboursée", cls: "bg-gray-100 text-gray-700" },
  contacted: { label: "Contactée", cls: "bg-blue-100 text-blue-700" },
  confirmed: { label: "Confirmée", cls: "bg-green-100 text-green-700" },
  in_progress: { label: "En cours", cls: "bg-yellow-100 text-yellow-700" },
  done: { label: "Terminée", cls: "bg-green-100 text-green-700" },
  archived: { label: "Archivée", cls: "bg-gray-100 text-gray-700" },
  approved: { label: "Approuvé", cls: "bg-green-100 text-green-700" },
  rejected: { label: "Rejeté", cls: "bg-red-100 text-red-700" },
};

// ============================================================
// CONTEXT
// ============================================================
interface AppCtxType {
  page: Page; pageParams: Record<string, unknown>;
  navigate: (p: Page, params?: Record<string, unknown>) => void;
  cart: CartItem[]; addToCart: (product: Product, qty: number) => void;
  updateCart: (id: number, qty: number) => void; removeFromCart: (id: number) => void;
  isAdmin: boolean; setIsAdmin: (v: boolean) => void;
  products: Product[]; setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: Order[]; setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  reservations: Reservation[]; setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
  contactRequests: ContactRequest[]; setContactRequests: React.Dispatch<React.SetStateAction<ContactRequest[]>>;
  blogPosts: BlogPost[]; setBlogPosts: React.Dispatch<React.SetStateAction<BlogPost[]>>;
  comments: Comment[]; setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
}

const AppCtx = createContext<AppCtxType>(null as unknown as AppCtxType);
const useApp = () => useContext(AppCtx);

// ============================================================
// SMALL UI
// ============================================================
function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>{children}</span>;
}

function Btn({ children, onClick, variant = "primary", size = "md", className = "", disabled = false, type = "button" }: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "outline" | "ghost" | "danger" | "accent";
  size?: "sm" | "md" | "lg"; className?: string; disabled?: boolean; type?: "button" | "submit";
}) {
  const base = "inline-flex items-center gap-2 font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded";
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" };
  const variants = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    outline: "border border-border text-foreground hover:bg-muted",
    ghost: "text-foreground hover:bg-muted",
    danger: "bg-destructive text-destructive-foreground hover:opacity-90",
    accent: "bg-accent text-accent-foreground hover:opacity-90",
  };
  return <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>{children}</button>;
}

function Input({ label, type = "text", value, onChange, placeholder, required = false, className = "" }: {
  label?: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-sm font-medium text-foreground">{label}{required && <span className="text-accent ml-1">*</span>}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full px-3 py-2 rounded border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 4, required = false }: {
  label?: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-foreground">{label}{required && <span className="text-accent ml-1">*</span>}</label>}
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} required={required}
        className="w-full px-3 py-2 rounded border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none" />
    </div>
  );
}

function Select({ label, value, onChange, options, required = false }: {
  label?: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-foreground">{label}{required && <span className="text-accent ml-1">*</span>}</label>}
      <select value={value} onChange={e => onChange(e.target.value)} required={required}
        className="w-full px-3 py-2 rounded border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { navigate } = useApp();
  const fp = finalPrice(product.price, product.discount);
  const stock = stockInfo(product);
  return (
    <div onClick={() => navigate("product-detail", { slug: product.slug })}
      className="bg-card rounded-lg overflow-hidden border border-border cursor-pointer hover:shadow-md transition-shadow group">
      <div className="relative overflow-hidden bg-secondary aspect-[4/3]">
        <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {product.discount > 0 && (
          <span className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded">-{product.discount}%</span>
        )}
        {product.condition === "used" && (
          <span className="absolute top-2 right-2 bg-secondary text-secondary-foreground text-xs font-medium px-2 py-1 rounded">Occasion</span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2 leading-tight">{product.title}</h3>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-lg text-primary">{fmt(fp)}</span>
            {product.discount > 0 && <span className="text-sm text-muted-foreground line-through ml-2">{fmt(product.price)}</span>}
          </div>
          <Badge className={stock.cls}>{stock.label}</Badge>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// NAVBAR
// ============================================================
function Navbar() {
  const { navigate, page, cart, isAdmin } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const count = cartCount(cart);

  const links = [
    { label: "Accueil", p: "home" as Page },
    { label: "Produits", p: "products" as Page },
    { label: "Services", p: "services" as Page },
    { label: "Actualités", p: "blog" as Page },
    { label: "Contact", p: "contact" as Page },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <button onClick={() => navigate("home")} className="font-display text-xl font-semibold text-primary tracking-tight">
          Kay<span className="text-accent">Art</span>
        </button>

        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <button key={l.p} onClick={() => navigate(l.p)}
              className={`text-sm transition-colors ${page === l.p ? "text-accent font-medium" : "text-muted-foreground hover:text-foreground"}`}>
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button onClick={() => navigate("admin")} className="hidden md:flex text-sm text-muted-foreground hover:text-foreground transition-colors items-center gap-1">
              <Settings size={14} /> Admin
            </button>
          )}
          <button onClick={() => navigate("cart")} className="relative p-2 hover:bg-muted rounded transition-colors">
            <ShoppingCart size={20} className="text-foreground" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">{count}</span>
            )}
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 hover:bg-muted rounded transition-colors">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 flex flex-col gap-3">
          {links.map(l => (
            <button key={l.p} onClick={() => { navigate(l.p); setMenuOpen(false); }}
              className={`text-left text-sm py-1.5 ${page === l.p ? "text-accent font-medium" : "text-foreground"}`}>
              {l.label}
            </button>
          ))}
          {isAdmin && <button onClick={() => { navigate("admin"); setMenuOpen(false); }} className="text-left text-sm py-1.5 text-muted-foreground">Administration</button>}
        </div>
      )}
    </nav>
  );
}

// ============================================================
// FOOTER
// ============================================================
function Footer() {
  const { navigate } = useApp();
  return (
    <footer className="bg-primary text-primary-foreground mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <div className="font-display text-2xl font-semibold mb-2">Kay<span className="text-accent">Art</span></div>
          <p className="text-sm opacity-70 leading-relaxed">Fabrication artisanale de pagaies et kayaks en carbone et fibre. Atelier basé à Saint-Aubin-des-Coudrais.</p>
          <div className="flex gap-3 mt-4">
            {[Instagram, Facebook, Linkedin].map((Icon, i) => (
              <a key={i} href="#" className="opacity-60 hover:opacity-100 transition-opacity"><Icon size={18} /></a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider opacity-50">Navigation</h4>
          <div className="flex flex-col gap-2">
            {[["home", "Accueil"], ["products", "Produits"], ["services", "Services"], ["blog", "Actualités"], ["contact", "Contact"], ["faq", "FAQ"]].map(([p, label]) => (
              <button key={p} onClick={() => navigate(p as Page)} className="text-left text-sm opacity-70 hover:opacity-100 transition-opacity">{label}</button>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider opacity-50">Contact</h4>
          <div className="flex flex-col gap-2 text-sm opacity-70">
            <span className="flex items-center gap-2"><MapPin size={14} /> 12 Route des Coudrais, 72400 Saint-Aubin</span>
            <span className="flex items-center gap-2"><Phone size={14} /> +33 2 43 00 00 00</span>
            <span className="flex items-center gap-2"><Mail size={14} /> contact@kayart.fr</span>
          </div>
          <div className="mt-4 flex gap-2 text-xs opacity-50">
            {["✓ Paiement Stripe sécurisé", "✓ Expédition suivie", "✓ Accompagnement humain"].map(t => (
              <span key={t} className="bg-white/10 rounded px-2 py-1">{t}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2 text-xs opacity-40">
        <span>© 2026 KayArt. Tous droits réservés.</span>
        <div className="flex gap-4">
          <button onClick={() => navigate("legal")} className="hover:opacity-100">Mentions légales</button>
          <button onClick={() => navigate("legal")} className="hover:opacity-100">CGV</button>
          <button onClick={() => navigate("legal")} className="hover:opacity-100">Politique de confidentialité</button>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// ADMIN LAYOUT
// ============================================================
function AdminLayout({ children }: { children: React.ReactNode }) {
  const { navigate, page, setIsAdmin } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { label: "Dashboard", p: "admin" as Page, icon: BarChart2 },
    { label: "Produits", p: "admin-products" as Page, icon: Package },
    { label: "Commandes", p: "admin-orders" as Page, icon: ShoppingBag },
    { label: "Réservations", p: "admin-reservations" as Page, icon: Archive },
    { label: "Demandes", p: "admin-demandes" as Page, icon: MessageSquare },
    { label: "Blog", p: "admin-blog" as Page, icon: FileText },
    { label: "Commentaires", p: "admin-comments" as Page, icon: Users },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className={`${collapsed ? "w-16" : "w-56"} flex-shrink-0 bg-sidebar flex flex-col transition-all duration-200`}>
        <div className={`h-16 flex items-center ${collapsed ? "justify-center" : "px-5"} border-b border-sidebar-border`}>
          {!collapsed && <span className="font-display text-lg font-semibold text-sidebar-foreground">Kay<span className="text-sidebar-primary">Art</span></span>}
          <button onClick={() => setCollapsed(!collapsed)} className={`${collapsed ? "" : "ml-auto"} text-sidebar-foreground opacity-50 hover:opacity-100`}>
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto">
          {navItems.map(({ label, p, icon: Icon }) => (
            <button key={p} onClick={() => navigate(p)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all w-full text-left ${page === p || (p === "admin" && page === "admin") ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : "text-sidebar-foreground opacity-70 hover:opacity-100 hover:bg-sidebar-accent"}`}>
              <Icon size={17} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-sidebar-border">
          <button onClick={() => navigate("home")} className="flex items-center gap-3 px-3 py-2 rounded text-sm text-sidebar-foreground opacity-50 hover:opacity-100 w-full">
            <Eye size={17} className="flex-shrink-0" />
            {!collapsed && <span>Voir le site</span>}
          </button>
          <button onClick={() => { setIsAdmin(false); navigate("home"); }} className="flex items-center gap-3 px-3 py-2 rounded text-sm text-sidebar-foreground opacity-50 hover:opacity-100 w-full">
            <LogOut size={17} className="flex-shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}

// ============================================================
// HOME PAGE
// ============================================================
function HomePage() {
  const { navigate, products } = useApp();
  const featured = products.filter(p => p.active && p.condition !== "used").slice(0, 3);
  const [openFaq, setOpenFaq] = useState<string>("");

  const faqs = [
    { q: "Quels matériaux utilisez-vous pour vos pagaies ?", a: "Nous travaillons principalement avec du carbone pre-preg et de la fibre de verre haute qualité. Chaque pagaie est stratifiée à la main dans notre atelier normand." },
    { q: "Proposez-vous des pagaies sur mesure ?", a: "Oui, nous réalisons des pagaies sur mesure selon votre morphologie, votre style de pagayage et votre niveau. Contactez-nous pour un devis personnalisé." },
    { q: "Quels sont les délais de fabrication ?", a: "Pour une pagaie standard en stock, la livraison est sous 5-7 jours ouvrés. Pour une pièce sur mesure, comptez 3 à 6 semaines selon la charge de l'atelier." },
    { q: "Réparez-vous les kayaks toutes marques ?", a: "Oui, nous intervenons sur tous types de coques : polyéthylène, fibre de verre, carbone ou kevlar. Diagnostic gratuit à l'atelier." },
    { q: "Comment puis-je visiter l'atelier ?", a: "Visites sur rendez-vous uniquement. Appelez-nous ou utilisez le formulaire de contact pour convenir d'un créneau." },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="relative h-[90vh] min-h-[500px] flex items-center overflow-hidden bg-primary">
        <img src="https://images.unsplash.com/photo-1502791451862-7bd8c1df43a7?w=1600&h=900&fit=crop&auto=format"
          alt="Kayak sur l'eau" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <p className="text-accent text-sm font-medium tracking-widest uppercase mb-4">Atelier artisanal · Normandie</p>
          <h1 className="font-display text-5xl md:text-7xl font-semibold text-primary-foreground leading-none mb-6 max-w-3xl">
            L'art du carbone, au service de l'eau.
          </h1>
          <p className="text-primary-foreground/70 text-lg max-w-xl mb-10 leading-relaxed">
            Fabrication sur mesure de pagaies et kayaks en carbone. Réparation et optimisation de votre matériel. Depuis 2014.
          </p>
          <div className="flex flex-wrap gap-4">
            <Btn size="lg" onClick={() => navigate("products")} className="!bg-accent !text-accent-foreground">Découvrir nos produits</Btn>
            <Btn size="lg" variant="outline" onClick={() => navigate("contact")} className="!border-white/30 !text-white hover:!bg-white/10">Nous contacter</Btn>
          </div>
        </div>
      </div>

      {/* Welcome */}
      <section className="max-w-7xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-accent text-sm font-medium tracking-widest uppercase mb-3">Notre savoir-faire</p>
          <h2 className="font-display text-4xl font-semibold text-foreground mb-5 leading-tight">Pièces uniques taillées pour l'excellence</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">Depuis plus de dix ans, l'atelier KayArt conçoit et fabrique des pagaies et kayaks artisanaux destinés aux pratiquants exigeants. Chaque pièce quitte l'atelier après un contrôle qualité rigoureux.</p>
          <p className="text-muted-foreground leading-relaxed mb-8">Nous maîtrisons l'ensemble de la chaîne de fabrication : de la stratification carbone à la finition, en passant par les traitements de surface et l'optimisation hydrodynamique.</p>
          <Btn onClick={() => navigate("services")}>Nos services <ChevronRight size={16} /></Btn>
        </div>
        <div className="relative">
          <img src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&h=600&fit=crop&auto=format"
            alt="Atelier carbone" className="rounded-lg w-full aspect-[4/3] object-cover" />
          <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-lg p-4 shadow-lg hidden md:block">
            <p className="text-3xl font-display font-bold text-primary">10+</p>
            <p className="text-sm text-muted-foreground">années d'expertise</p>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-muted py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-accent text-sm font-medium tracking-widest uppercase mb-2">Catalogue</p>
              <h2 className="font-display text-3xl font-semibold">Nos produits phares</h2>
            </div>
            <Btn variant="outline" onClick={() => navigate("products")}>Tout voir <ChevronRight size={16} /></Btn>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* Services preview */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <p className="text-accent text-sm font-medium tracking-widest uppercase mb-2">Ce que nous faisons</p>
          <h2 className="font-display text-3xl font-semibold">Quatre expertises à votre service</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: "🔨", title: "Fabrication sur mesure", desc: "Pagaies et kayaks conçus selon vos spécifications exactes." },
            { icon: "🔧", title: "Réparation & Rénovation", desc: "Toutes coques, toutes marques. Diagnostic gratuit." },
            { icon: "⚡", title: "Optimisation", desc: "Amélioration des performances hydrodynamiques." },
            { icon: "🎯", title: "Conseil & Expertise", desc: "Accompagnement personnalisé dans le choix du matériel." },
          ].map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
              <span className="text-3xl mb-4 block">{s.icon}</span>
              <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-accent text-sm font-medium tracking-widest uppercase mb-2">FAQ</p>
            <h2 className="font-display text-3xl font-semibold">Questions fréquentes</h2>
          </div>
          <Accordion.Root type="single" collapsible value={openFaq} onValueChange={setOpenFaq}>
            {faqs.map((f, i) => (
              <Accordion.Item key={i} value={`faq-${i}`} className="border-b border-border">
                <Accordion.Trigger className="flex w-full items-center justify-between py-4 text-left font-medium text-foreground hover:text-accent transition-colors group">
                  {f.q}
                  <ChevronDown size={16} className={`flex-shrink-0 transition-transform ml-4 ${openFaq === `faq-${i}` ? "rotate-180" : ""}`} />
                </Accordion.Trigger>
                <Accordion.Content className="overflow-hidden data-[state=open]:animate-[accordion-down_200ms_ease] data-[state=closed]:animate-[accordion-up_200ms_ease]">
                  <p className="pb-4 text-muted-foreground leading-relaxed text-sm">{f.a}</p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// PRODUCTS PAGE
// ============================================================
function ProductsPage() {
  const { products, navigate } = useApp();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showUsed, setShowUsed] = useState(false);
  const [visible, setVisible] = useState(6);

  const filtered = products.filter(p => {
    if (!p.active) return false;
    if (showUsed) return p.condition === "used";
    if (selectedCategory && p.categorySlug !== selectedCategory) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-semibold mb-2">Catalogue</h1>
        <p className="text-muted-foreground">Pagaies, kayaks, carbone et services.</p>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="md:w-52 flex-shrink-0">
          <div className="bg-card border border-border rounded-lg p-4 sticky top-24">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Catégories</h3>
            <div className="flex flex-col gap-1">
              <button onClick={() => { setSelectedCategory(""); setShowUsed(false); }}
                className={`text-left text-sm px-2 py-1.5 rounded transition-colors ${!selectedCategory && !showUsed ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted"}`}>
                Tous les produits
              </button>
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => { setSelectedCategory(c.slug); setShowUsed(false); }}
                  className={`text-left text-sm px-2 py-1.5 rounded transition-colors ${selectedCategory === c.slug && !showUsed ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted"}`}>
                  {c.name}
                </button>
              ))}
            </div>
            <div className="border-t border-border mt-3 pt-3">
              <button onClick={() => { setShowUsed(!showUsed); setSelectedCategory(""); }}
                className={`w-full text-left text-sm px-2 py-1.5 rounded transition-colors font-medium ${showUsed ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}>
                🔄 Seconde Main
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          {/* Search */}
          <div className="relative mb-6">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un produit..."
              className="w-full pl-9 pr-9 py-2.5 rounded border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={14} /></button>}
          </div>

          <p className="text-sm text-muted-foreground mb-4">{filtered.length} produit{filtered.length > 1 ? "s" : ""}</p>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p>Aucun produit ne correspond à votre recherche.</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.slice(0, visible).map(p => <ProductCard key={p.id} product={p} />)}
              </div>
              {visible < filtered.length && (
                <div className="text-center mt-8">
                  <Btn variant="outline" onClick={() => setVisible(v => v + 6)}>Voir plus de produits</Btn>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PRODUCT DETAIL PAGE
// ============================================================
function ProductDetailPage() {
  const { pageParams, products, navigate, addToCart } = useApp();
  const product = products.find(p => p.slug === pageParams.slug);
  const [qty, setQty] = useState(1);
  const [mainImg, setMainImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [added, setAdded] = useState(false);
  const [reserveForm, setReserveForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [alertEmail, setAlertEmail] = useState("");
  const [reserveSent, setReserveSent] = useState(false);
  const [alertSent, setAlertSent] = useState(false);

  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <p className="text-muted-foreground">Produit introuvable.</p>
      <Btn className="mt-4" onClick={() => navigate("products")}><ArrowLeft size={16} /> Retour au catalogue</Btn>
    </div>
  );

  const fp = finalPrice(product.price, product.discount);
  const stock = stockInfo(product);
  const related = products.filter(p => p.categorySlug === product.categorySlug && p.id !== product.id && p.active).slice(0, 4);

  const handleAddToCart = () => {
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <button onClick={() => navigate("home")} className="hover:text-foreground">Accueil</button>
        <ChevronRight size={14} />
        <button onClick={() => navigate("products")} className="hover:text-foreground">Produits</button>
        <ChevronRight size={14} />
        <span className="text-foreground">{product.title}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-12 mb-16">
        {/* Gallery */}
        <div>
          <div className="relative rounded-lg overflow-hidden bg-secondary aspect-[4/3] mb-3">
            <img src={product.images[mainImg]} alt={product.title} className="w-full h-full object-cover" />
            <button onClick={() => setLightbox(true)} className="absolute bottom-3 right-3 bg-black/50 text-white p-2 rounded-lg hover:bg-black/70 transition-colors">
              <ZoomIn size={18} />
            </button>
            {product.discount > 0 && <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-sm font-bold px-3 py-1 rounded">-{product.discount}%</span>}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setMainImg(i)}
                  className={`w-16 h-16 rounded overflow-hidden border-2 transition-colors ${mainImg === i ? "border-accent" : "border-transparent"}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className={stock.cls}>{stock.label}</Badge>
            {product.condition === "new" && <Badge className="bg-blue-100 text-blue-700">Neuf</Badge>}
            {product.condition === "used" && <Badge className="bg-orange-100 text-orange-700">Occasion</Badge>}
            {product.condition === "service" && <Badge className="bg-purple-100 text-purple-700">Service</Badge>}
            {new Date(product.createdAt) > new Date(Date.now() - 30 * 864e5) && (
              <Badge className="bg-accent text-accent-foreground">Nouveau</Badge>
            )}
          </div>

          <h1 className="font-display text-3xl font-semibold text-foreground mb-2">{product.title}</h1>
          <p className="text-sm text-muted-foreground mb-4">Réf. {product.sku}</p>

          <div className="mb-5">
            <span className="text-3xl font-bold text-primary">{fmt(fp)}</span>
            {product.discount > 0 && <span className="text-lg text-muted-foreground line-through ml-3">{fmt(product.price)}</span>}
            <span className="text-sm text-muted-foreground ml-2">TTC</span>
          </div>

          <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>

          {(product.weight || product.dimensions) && (
            <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
              {product.weight && <div className="bg-muted rounded p-3"><span className="text-muted-foreground">Poids</span><p className="font-medium">{product.weight} kg</p></div>}
              {product.dimensions && <div className="bg-muted rounded p-3"><span className="text-muted-foreground">Dimensions</span><p className="font-medium">{product.dimensions}</p></div>}
            </div>
          )}

          {/* Action area */}
          {product.condition === "new" && product.stock > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Quantité :</label>
                <div className="flex items-center border border-border rounded overflow-hidden">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-muted transition-colors text-foreground">−</button>
                  <span className="px-4 py-2 min-w-[3rem] text-center font-medium">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="px-3 py-2 hover:bg-muted transition-colors text-foreground">+</button>
                </div>
              </div>
              <div className="flex gap-3">
                <Btn size="lg" onClick={handleAddToCart} className="flex-1">
                  {added ? <><Check size={16} /> Ajouté !</> : <><ShoppingCart size={16} /> Ajouter au panier</>}
                </Btn>
                <Btn size="lg" variant="accent" onClick={() => { addToCart(product, qty); navigate("checkout"); }}>
                  Acheter maintenant
                </Btn>
              </div>
            </div>
          )}

          {product.condition === "service" && (
            <div className="space-y-3">
              <Btn size="lg" onClick={handleAddToCart} className="w-full">
                {added ? <><Check size={16} /> Ajouté !</> : <><ShoppingCart size={16} /> Ajouter au panier</>}
              </Btn>
              <p className="text-xs text-muted-foreground text-center">Prix indicatif. Un devis définitif sera établi après diagnostic.</p>
            </div>
          )}

          {product.condition === "new" && product.stock === 0 && (
            alertSent ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm"><Check size={16} className="inline mr-2" />Vous serez averti dès le retour en stock.</div>
            ) : (
              <div className="bg-muted rounded-lg p-4">
                <p className="font-medium mb-3 flex items-center gap-2"><Bell size={16} /> Recevoir une alerte retour en stock</p>
                <div className="flex gap-2">
                  <input value={alertEmail} onChange={e => setAlertEmail(e.target.value)} placeholder="votre@email.fr" type="email"
                    className="flex-1 px-3 py-2 rounded border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  <Btn onClick={() => setAlertSent(true)}>M'alerter</Btn>
                </div>
              </div>
            )
          )}

          {product.condition === "used" && (
            reserveSent ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm"><Check size={16} className="inline mr-2" />Votre demande a été transmise. Nous vous contacterons rapidement.</div>
            ) : (
              <div className="bg-muted rounded-lg p-5">
                <h3 className="font-semibold mb-4">Réserver ce produit</h3>
                <div className="space-y-3">
                  <Input label="Nom complet" value={reserveForm.name} onChange={v => setReserveForm(f => ({ ...f, name: v }))} required />
                  <Input label="Email" type="email" value={reserveForm.email} onChange={v => setReserveForm(f => ({ ...f, email: v }))} required />
                  <Input label="Téléphone (optionnel)" value={reserveForm.phone} onChange={v => setReserveForm(f => ({ ...f, phone: v }))} />
                  <Textarea label="Message (optionnel)" value={reserveForm.message} onChange={v => setReserveForm(f => ({ ...f, message: v }))} rows={3} />
                  <Btn size="lg" onClick={() => setReserveSent(true)} className="w-full">Envoyer ma demande de réservation</Btn>
                  <p className="text-xs text-muted-foreground text-center">Vos données sont utilisées uniquement pour traiter votre réservation.</p>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div>
          <h2 className="font-display text-2xl font-semibold mb-6">Produits similaires</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300"><X size={28} /></button>
          <img src={product.images[mainImg]} alt={product.title} className="max-w-full max-h-full object-contain rounded" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

// ============================================================
// SERVICES PAGE
// ============================================================
function ServicesPage() {
  const { navigate } = useApp();
  const services = [
    { icon: "🔨", title: "Fabrication sur mesure", desc: "Pagaies et kayaks entièrement fabriqués selon vos spécifications. Choix des matériaux, dimensions, finitions et personnalisations graphiques. Du prototype unique aux petites séries." },
    { icon: "🔧", title: "Réparation & Rénovation", desc: "Reprise de coques en polyéthylène, fibre de verre, carbone ou kevlar. Réparation de fissures, délaminage, impact, oxydation. Diagnostic gratuit à l'atelier sur rendez-vous." },
    { icon: "⚡", title: "Optimisation", desc: "Amélioration des performances hydrodynamiques de votre matériel existant. Ponçage, traitement anti-UV, remplacement de gouvernail, modification de cockpit." },
    { icon: "🎯", title: "Conseil & Expertise", desc: "Accompagnement personnalisé dans le choix de votre matériel, que vous débutiez ou souhaitiez progresser. Essai en eau possible sur rendez-vous." },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-14">
        <p className="text-accent text-sm font-medium tracking-widest uppercase mb-3">Ce que nous faisons</p>
        <h1 className="font-display text-5xl font-semibold mb-4">Nos services</h1>
        <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">De la fabrication à l'expertise, notre atelier vous accompagne à chaque étape de votre pratique nautique.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {services.map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-shadow">
            <span className="text-5xl mb-5 block">{s.icon}</span>
            <h2 className="font-display text-2xl font-semibold mb-3">{s.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
      <div className="bg-primary text-primary-foreground rounded-2xl p-10 text-center">
        <h2 className="font-display text-3xl font-semibold mb-3">Un projet en tête ?</h2>
        <p className="opacity-70 mb-6 max-w-md mx-auto">Décrivez-nous votre besoin et nous reviendrons vers vous sous 48h avec une proposition adaptée.</p>
        <Btn size="lg" onClick={() => navigate("contact")} className="!bg-accent !text-white">Nous contacter <ChevronRight size={16} /></Btn>
      </div>
    </div>
  );
}

// ============================================================
// CONTACT PAGE
// ============================================================
function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", phoneCode: "+33", subject: "devis", message: "" });
  const [sent, setSent] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="mb-12">
        <p className="text-accent text-sm font-medium tracking-widest uppercase mb-3">Nous écrire</p>
        <h1 className="font-display text-5xl font-semibold">Contact</h1>
      </div>
      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          {sent ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-10 text-center">
              <Check size={48} className="text-green-500 mx-auto mb-4" />
              <h2 className="font-display text-2xl font-semibold text-green-800 mb-2">Message envoyé !</h2>
              <p className="text-green-700">Nous vous répondrons dans les 48h ouvrées.</p>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); setSent(true); }} className="bg-card border border-border rounded-xl p-8 space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <Input label="Nom complet" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required placeholder="Jean Dupont" />
                <Input label="Email" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} required placeholder="vous@example.com" />
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col gap-1 w-28 flex-shrink-0">
                  <label className="text-sm font-medium">Indicatif</label>
                  <select value={form.phoneCode} onChange={e => setForm(f => ({ ...f, phoneCode: e.target.value }))}
                    className="px-2 py-2 rounded border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {["+33 🇫🇷", "+32 🇧🇪", "+41 🇨🇭", "+44 🇬🇧", "+1 🇺🇸", "+49 🇩🇪"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <Input label="Téléphone (optionnel)" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="06 12 34 56 78" className="flex-1" />
              </div>
              <Select label="Sujet" value={form.subject} onChange={v => setForm(f => ({ ...f, subject: v }))}
                options={[{ value: "devis", label: "Demande de devis" }, { value: "reparation", label: "Réparation" }, { value: "autre", label: "Autre" }]} />
              <Textarea label="Message" value={form.message} onChange={v => setForm(f => ({ ...f, message: v }))} required rows={5} placeholder="Décrivez votre projet ou votre question..." />
              <input type="text" className="hidden" tabIndex={-1} aria-hidden="true" />
              <Btn type="submit" size="lg" className="w-full">Envoyer le message</Btn>
            </form>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Informations</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-start gap-3"><MapPin size={16} className="mt-0.5 flex-shrink-0 text-accent" />12 Route des Coudrais<br />72400 Saint-Aubin-des-Coudrais</p>
              <p className="flex items-center gap-3"><Phone size={16} className="text-accent flex-shrink-0" />+33 2 43 00 00 00</p>
              <p className="flex items-center gap-3"><Mail size={16} className="text-accent flex-shrink-0" />contact@kayart.fr</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-3">Horaires atelier</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="flex justify-between"><span>Lundi – Vendredi</span><span>9h – 18h</span></p>
              <p className="flex justify-between"><span>Samedi</span><span>Sur RDV</span></p>
              <p className="flex justify-between"><span>Dimanche</span><span>Fermé</span></p>
            </div>
          </div>
          <div className="bg-muted rounded-xl p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><MapPin size={16} /> Nous trouver</h3>
            <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center text-muted-foreground text-sm">
              <div className="text-center">
                <MapPin size={32} className="mx-auto mb-2 opacity-30" />
                <p>Carte interactive</p>
                <p className="text-xs mt-1 opacity-60">(Leaflet / OpenStreetMap)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// BLOG PAGE
// ============================================================
function BlogPage() {
  const { blogPosts, navigate } = useApp();
  const published = blogPosts.filter(p => p.published);

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="mb-12">
        <p className="text-accent text-sm font-medium tracking-widest uppercase mb-3">Actualités</p>
        <h1 className="font-display text-5xl font-semibold">Le blog KayArt</h1>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {published.map(post => (
          <article key={post.id} onClick={() => navigate("blog-post", { slug: post.slug })}
            className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow group">
            <div className="aspect-video overflow-hidden bg-secondary">
              <img src={post.cover} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-6">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-3">
                <span><Clock size={12} className="inline mr-1" />{fmtDate(post.publishedAt)}</span>
                <span><MessageSquare size={12} className="inline mr-1" />{post.commentsCount} commentaire{post.commentsCount > 1 ? "s" : ""}</span>
              </p>
              <h2 className="font-display text-xl font-semibold text-foreground mb-2 leading-snug group-hover:text-accent transition-colors">{post.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{post.excerpt}</p>
              <p className="text-sm text-accent font-medium mt-4 flex items-center gap-1">Lire l'article <ChevronRight size={14} /></p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// BLOG POST PAGE
// ============================================================
function BlogPostPage() {
  const { pageParams, blogPosts, navigate, comments } = useApp();
  const post = blogPosts.find(p => p.slug === pageParams.slug);
  const [commentForm, setCommentForm] = useState({ name: "", email: "", content: "" });
  const [commentSent, setCommentSent] = useState(false);
  const postComments = comments.filter(c => c.postTitle.startsWith(post?.title?.substring(0, 20) ?? "X") && c.status === "approved");

  if (!post) return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-muted-foreground">Article introuvable.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <button onClick={() => navigate("home")} className="hover:text-foreground">Accueil</button>
        <ChevronRight size={14} />
        <button onClick={() => navigate("blog")} className="hover:text-foreground">Actualités</button>
        <ChevronRight size={14} />
        <span className="text-foreground line-clamp-1">{post.title}</span>
      </div>

      <p className="text-muted-foreground text-sm mb-2 flex items-center gap-4">
        <span><Clock size={13} className="inline mr-1" />{fmtDate(post.publishedAt)}</span>
        <span><MessageSquare size={13} className="inline mr-1" />{post.commentsCount} commentaire{post.commentsCount > 1 ? "s" : ""}</span>
      </p>
      <h1 className="font-display text-4xl font-semibold text-foreground mb-6 leading-tight">{post.title}</h1>
      <img src={post.cover} alt={post.title} className="w-full rounded-xl mb-8 aspect-[16/7] object-cover" />

      <div className="prose max-w-none text-foreground">
        {post.blocks.map((block, i) => (
          <div key={i} className="mb-6">
            {block.type === "paragraph" && (
              <>
                {block.subtitle && <h2 className="font-display text-2xl font-semibold mt-8 mb-3">{block.subtitle}</h2>}
                <p className="text-muted-foreground leading-relaxed">{block.content}</p>
              </>
            )}
            {block.type === "image" && block.image && (
              <img src={block.image} alt="" className="w-full rounded-lg my-6 aspect-video object-cover" />
            )}
          </div>
        ))}
      </div>

      <button onClick={() => navigate("blog")} className="mt-8 text-sm text-accent font-medium flex items-center gap-1 hover:underline">
        <ArrowLeft size={14} /> Retour aux actualités
      </button>

      {/* Comments */}
      <div className="mt-12 border-t border-border pt-10">
        <h2 className="font-display text-2xl font-semibold mb-6">Commentaires ({postComments.length})</h2>
        {postComments.length === 0 && <p className="text-muted-foreground text-sm">Soyez le premier à commenter cet article.</p>}
        <div className="space-y-5 mb-10">
          {postComments.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium text-sm">{c.author}</p>
                <p className="text-xs text-muted-foreground">{fmtDate(c.createdAt)}</p>
              </div>
              <p className="text-sm text-muted-foreground">{c.content}</p>
            </div>
          ))}
        </div>

        <h3 className="font-semibold mb-4">Laisser un commentaire</h3>
        {commentSent ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm">
            <Check size={16} className="inline mr-2" />Commentaire soumis. Il sera publié après modération.
          </div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); setCommentSent(true); }} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Nom" value={commentForm.name} onChange={v => setCommentForm(f => ({ ...f, name: v }))} required />
              <Input label="Email (optionnel)" type="email" value={commentForm.email} onChange={v => setCommentForm(f => ({ ...f, email: v }))} />
            </div>
            <Textarea label="Commentaire" value={commentForm.content} onChange={v => setCommentForm(f => ({ ...f, content: v }))} required placeholder="Votre commentaire (max 1000 caractères)..." />
            <p className="text-xs text-muted-foreground text-right">{commentForm.content.length}/1000</p>
            <Btn type="submit">Envoyer le commentaire</Btn>
          </form>
        )}
      </div>
    </div>
  );
}

// ============================================================
// CART PAGE
// ============================================================
function CartPage() {
  const { cart, updateCart, removeFromCart, navigate } = useApp();
  const subtotal = cartTotal(cart);
  const ht = subtotal / 1.2;
  const tva = subtotal - ht;

  if (cart.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <ShoppingCart size={56} className="mx-auto mb-4 text-muted-foreground opacity-30" />
      <h2 className="font-display text-2xl font-semibold mb-2">Panier vide</h2>
      <p className="text-muted-foreground mb-6">Votre panier ne contient aucun article pour le moment.</p>
      <Btn size="lg" onClick={() => navigate("products")}>Découvrir nos produits <ChevronRight size={16} /></Btn>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="font-display text-4xl font-semibold mb-8">Mon panier <span className="text-muted-foreground text-2xl font-normal">({cartCount(cart)} article{cartCount(cart) > 1 ? "s" : ""})</span></h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.map(item => {
            const fp = finalPrice(item.price, item.discount);
            return (
              <div key={item.productId} className="bg-card border border-border rounded-lg p-4 flex gap-4">
                <img src={item.image} alt={item.title} className="w-20 h-20 rounded object-cover flex-shrink-0 bg-secondary" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground line-clamp-2">{item.title}</p>
                  <p className="text-xs text-muted-foreground mb-2">{item.sku}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">{fmt(fp)}</span>
                    {item.discount > 0 && <span className="text-xs text-muted-foreground line-through">{fmt(item.price)}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => removeFromCart(item.productId)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={16} />
                  </button>
                  <div className="flex items-center border border-border rounded overflow-hidden">
                    <button onClick={() => updateCart(item.productId, item.quantity - 1)} className="px-2 py-1 hover:bg-muted text-sm">−</button>
                    <span className="px-2 py-1 text-sm min-w-[2rem] text-center">{item.quantity}</span>
                    <button onClick={() => updateCart(item.productId, item.quantity + 1)} className="px-2 py-1 hover:bg-muted text-sm">+</button>
                  </div>
                  <span className="font-semibold text-sm">{fmt(fp * item.quantity)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
            <h3 className="font-semibold mb-4">Récapitulatif</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-muted-foreground"><span>Sous-total HT</span><span>{fmt(ht)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>TVA (20%)</span><span>{fmt(tva)}</span></div>
              <div className="flex justify-between font-bold text-foreground text-base border-t border-border pt-3 mt-3"><span>Total TTC</span><span>{fmt(subtotal)}</span></div>
            </div>
            <Btn size="lg" className="w-full mb-3" onClick={() => navigate("checkout")}>Procéder au paiement <ChevronRight size={16} /></Btn>
            <button onClick={() => navigate("products")} className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">Continuer mes achats</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CHECKOUT PAGE
// ============================================================
function CheckoutPage() {
  const { cart, navigate } = useApp();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", address: "", city: "", postal: "", country: "France", sameAsBilling: true });
  const [loading, setLoading] = useState(false);
  const subtotal = cartTotal(cart);
  const ht = subtotal / 1.2;
  const tva = subtotal - ht;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate("checkout-success"); }, 2000);
  };

  if (cart.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-muted-foreground">Votre panier est vide.</p>
      <Btn className="mt-4" onClick={() => navigate("products")}>Retour au catalogue</Btn>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="font-display text-4xl font-semibold mb-8">Paiement</h1>
      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="font-semibold mb-4">Informations client</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Input label="Prénom" value={form.firstName} onChange={v => setForm(f => ({ ...f, firstName: v }))} required />
                <Input label="Nom" value={form.lastName} onChange={v => setForm(f => ({ ...f, lastName: v }))} required />
                <Input label="Email" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} required className="md:col-span-2" />
                <Input label="Téléphone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} required />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="font-semibold mb-4">Adresse de livraison</h2>
              <div className="space-y-4">
                <Input label="Adresse" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} required />
                <div className="grid md:grid-cols-2 gap-4">
                  <Input label="Ville" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} required />
                  <Input label="Code postal" value={form.postal} onChange={v => setForm(f => ({ ...f, postal: v }))} required />
                </div>
                <Select label="Pays" value={form.country} onChange={v => setForm(f => ({ ...f, country: v }))}
                  options={["France", "Belgique", "Suisse", "Luxembourg", "Monaco"].map(c => ({ value: c, label: c }))} />
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.sameAsBilling} onChange={e => setForm(f => ({ ...f, sameAsBilling: e.target.checked }))}
                    className="rounded border-border" />
                  Adresse de facturation identique
                </label>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
              <h3 className="font-semibold mb-4">Commande</h3>
              <div className="space-y-3 mb-4">
                {cart.map(item => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex-1 mr-2 line-clamp-2">{item.title} × {item.quantity}</span>
                    <span className="font-medium flex-shrink-0">{fmt(finalPrice(item.price, item.discount) * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 space-y-2 text-sm mb-5">
                <div className="flex justify-between text-muted-foreground"><span>HT</span><span>{fmt(ht)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>TVA 20%</span><span>{fmt(tva)}</span></div>
                <div className="flex justify-between font-bold text-base"><span>TTC</span><span>{fmt(subtotal)}</span></div>
              </div>
              <div className="bg-muted rounded p-3 text-xs text-muted-foreground mb-5 flex items-center gap-2">
                <AlertCircle size={14} className="text-accent flex-shrink-0" />
                Paiement sécurisé par Stripe. Vous serez redirigé vers la plateforme de paiement.
              </div>
              <Btn type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <><RefreshCw size={16} className="animate-spin" /> Redirection…</> : <>Payer {fmt(subtotal)}</>}
              </Btn>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// CHECKOUT SUCCESS
// ============================================================
function CheckoutSuccessPage() {
  const { navigate } = useApp();
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <Check size={36} className="text-green-600" />
      </div>
      <h1 className="font-display text-4xl font-semibold mb-3">Commande confirmée !</h1>
      <p className="text-muted-foreground mb-2 leading-relaxed">Merci pour votre commande. Un email de confirmation avec votre facture vous a été envoyé.</p>
      <p className="text-sm text-muted-foreground mb-10">Référence : <strong className="text-foreground">CMD-2026-005</strong></p>
      <div className="flex justify-center gap-4">
        <Btn size="lg" onClick={() => navigate("products")}>Continuer mes achats</Btn>
        <Btn size="lg" variant="outline" onClick={() => navigate("home")}>Retour à l'accueil</Btn>
      </div>
    </div>
  );
}

// ============================================================
// LOGIN PAGE
// ============================================================
function LoginPage() {
  const { navigate, setIsAdmin } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === "admin@kayart.fr" && password === "admin1234") {
      setIsAdmin(true);
      navigate("admin");
    } else {
      setError("Identifiants incorrects.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-display text-3xl font-semibold text-primary mb-1">Kay<span className="text-accent">Art</span></div>
          <p className="text-sm text-muted-foreground">Espace administrateur</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-8 space-y-4">
          <h1 className="font-semibold text-lg mb-2">Connexion</h1>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">{error}</div>}
          <Input label="Email" type="email" value={email} onChange={setEmail} required placeholder="admin@kayart.fr" />
          <Input label="Mot de passe" type="password" value={password} onChange={setPassword} required placeholder="••••••••" />
          <Btn type="submit" size="lg" className="w-full">Se connecter</Btn>
          <p className="text-xs text-muted-foreground text-center">admin@kayart.fr / admin1234</p>
        </form>
        <button onClick={() => navigate("home")} className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground">← Retour au site</button>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================
function AdminDashboardPage() {
  const { products, orders, reservations, contactRequests, navigate } = useApp();
  const stats = [
    { label: "Produits actifs", value: products.filter(p => p.active).length, icon: Package, color: "bg-blue-50 text-blue-600" },
    { label: "Commandes", value: orders.length, icon: ShoppingBag, color: "bg-green-50 text-green-600" },
    { label: "Réservations", value: reservations.length, icon: Archive, color: "bg-purple-50 text-purple-600" },
    { label: "Demandes", value: contactRequests.filter(r => r.status === "new").length, icon: MessageSquare, color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-8">Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {stats.map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-5">
            <div className={`inline-flex p-2 rounded-lg ${s.color} mb-3`}><s.icon size={20} /></div>
            <p className="text-3xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold">Commandes récentes</h2>
            <button onClick={() => navigate("admin-orders")} className="text-sm text-accent hover:underline">Voir tout</button>
          </div>
          <div className="divide-y divide-border">
            {orders.slice(0, 4).map(o => (
              <div key={o.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{o.ref}</p>
                  <p className="text-muted-foreground text-xs">{o.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{fmt(o.total)}</p>
                  <Badge className={statusLabels[o.status]?.cls}>{statusLabels[o.status]?.label}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold">Demandes récentes</h2>
            <button onClick={() => navigate("admin-demandes")} className="text-sm text-accent hover:underline">Voir tout</button>
          </div>
          <div className="divide-y divide-border">
            {contactRequests.map(r => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-muted-foreground text-xs">{r.subject}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">{r.createdAt}</p>
                  <Badge className={statusLabels[r.status]?.cls}>{statusLabels[r.status]?.label}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN PRODUCTS
// ============================================================
function AdminProductsPage() {
  const { products, setProducts, navigate } = useApp();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");

  const filtered = products.filter(p => {
    if (catFilter && p.categorySlug !== catFilter) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.sku.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const deleteProduct = (id: number) => {
    if (confirm("Supprimer ce produit ?")) setProducts(ps => ps.filter(p => p.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-semibold">Produits</h1>
        <Btn onClick={() => navigate("admin-product-form", { mode: "create" })}><Plus size={16} /> Nouveau produit</Btn>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Titre ou SKU..."
            className="w-full pl-9 pr-4 py-2 rounded border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-3 py-2 rounded border border-border bg-card text-sm focus:outline-none">
          <option value="">Toutes catégories</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Produit</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Catégorie</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Prix</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Stock</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">État</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt="" className="w-10 h-10 rounded object-cover bg-secondary flex-shrink-0" />
                    <div>
                      <p className="font-medium line-clamp-1">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.category}</td>
                <td className="px-4 py-3 text-right">
                  <p className="font-medium">{fmt(finalPrice(p.price, p.discount))}</p>
                  {p.discount > 0 && <p className="text-xs text-muted-foreground line-through">{fmt(p.price)}</p>}
                </td>
                <td className="px-4 py-3 text-center hidden lg:table-cell">
                  <Badge className={stockInfo(p).cls}>{stockInfo(p).label}</Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge className={p.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                    {p.active ? "Actif" : "Inactif"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => navigate("admin-product-form", { mode: "edit", productId: p.id })}
                      className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors" title="Modifier">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => deleteProduct(p.id)}
                      className="p-1.5 hover:bg-red-50 rounded text-muted-foreground hover:text-destructive transition-colors" title="Supprimer">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package size={36} className="mx-auto mb-2 opacity-30" />
            <p>Aucun produit trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ADMIN PRODUCT FORM (4-STEP WIZARD)
// ============================================================
function AdminProductFormPage() {
  const { pageParams, products, setProducts, navigate } = useApp();
  const isEdit = pageParams.mode === "edit";
  const existing = isEdit ? products.find(p => p.id === pageParams.productId) : undefined;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: existing?.title ?? "",
    sku: existing?.sku ?? "",
    category: existing?.categorySlug ?? "pagaies",
    description: existing?.description ?? "",
    price: existing?.price?.toString() ?? "",
    discount: existing?.discount?.toString() ?? "0",
    condition: (existing?.condition ?? "new") as ProductCondition,
    weight: existing?.weight?.toString() ?? "",
    dimensions: existing?.dimensions ?? "",
    stock: existing?.stock?.toString() ?? "",
    active: existing?.active ?? true,
  });
  const [saved, setSaved] = useState(false);

  const steps = ["Informations générales", "Tarification", "Caractéristiques", "Images"];

  const handleSave = () => {
    const newProduct: Product = {
      id: existing?.id ?? Date.now(),
      title: form.title, slug: form.title.toLowerCase().replace(/\s+/g, "-"),
      sku: form.sku, description: form.description,
      price: parseFloat(form.price) || 0, discount: parseFloat(form.discount) || 0,
      category: CATEGORIES.find(c => c.slug === form.category)?.name ?? "",
      categorySlug: form.category, condition: form.condition,
      stock: parseFloat(form.stock) || 999, weight: parseFloat(form.weight) || undefined,
      dimensions: form.dimensions || undefined,
      image: "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800&h=600&fit=crop&auto=format",
      images: ["https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800&h=600&fit=crop&auto=format"],
      active: form.active, createdAt: existing?.createdAt ?? new Date().toISOString().slice(0, 10),
    };

    if (isEdit) {
      setProducts(ps => ps.map(p => p.id === existing?.id ? newProduct : p));
    } else {
      setProducts(ps => [...ps, newProduct]);
    }
    setSaved(true);
    setTimeout(() => navigate("admin-products"), 1200);
  };

  if (saved) return (
    <div className="text-center py-20">
      <Check size={48} className="text-green-500 mx-auto mb-4" />
      <p className="font-semibold text-lg">Produit {isEdit ? "modifié" : "créé"} avec succès !</p>
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate("admin-products")} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={20} /></button>
        <h1 className="font-display text-3xl font-semibold">{isEdit ? "Modifier le produit" : "Nouveau produit"}</h1>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex-1">
            <div className={`h-1.5 rounded-full mb-1 ${i + 1 <= step ? "bg-primary" : "bg-border"}`} />
            <p className={`text-xs ${i + 1 === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>{i + 1}. {s}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        {step === 1 && (
          <>
            <h2 className="font-semibold text-lg">{steps[0]}</h2>
            <Input label="Titre" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} required placeholder="Pagaie Carbone Elite" />
            <Input label="SKU" value={form.sku} onChange={v => setForm(f => ({ ...f, sku: v }))} required placeholder="PAG-C-001" />
            <Select label="Catégorie" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))}
              options={CATEGORIES.map(c => ({ value: c.slug, label: c.name }))} />
            <Textarea label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} rows={4} placeholder="Décrivez ce produit..." />
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="font-semibold text-lg">{steps[1]}</h2>
            <Input label="Prix TTC (€)" type="number" value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} required placeholder="485" />
            <Input label="Réduction (%)" type="number" value={form.discount} onChange={v => setForm(f => ({ ...f, discount: v }))} placeholder="0" />
            <Select label="État" value={form.condition} onChange={v => setForm(f => ({ ...f, condition: v as ProductCondition }))}
              options={[{ value: "new", label: "Neuf" }, { value: "used", label: "Occasion" }, { value: "service", label: "Service" }]} />
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="font-semibold text-lg">{steps[2]}</h2>
            <Input label="Poids (kg)" type="number" value={form.weight} onChange={v => setForm(f => ({ ...f, weight: v }))} placeholder="0.62" />
            <Input label="Dimensions" value={form.dimensions} onChange={v => setForm(f => ({ ...f, dimensions: v }))} placeholder="210 cm × 8 cm" />
            {form.condition !== "service" && (
              <Input label="Stock" type="number" value={form.stock} onChange={v => setForm(f => ({ ...f, stock: v }))} placeholder="10" />
            )}
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="rounded border-border" />
              Produit actif (visible sur le site)
            </label>
          </>
        )}
        {step === 4 && (
          <>
            <h2 className="font-semibold text-lg">{steps[3]}</h2>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
              <Upload size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm mb-1">Glissez vos images ici ou cliquez pour sélectionner</p>
              <p className="text-xs opacity-60">JPEG, PNG ou WebP — max 10 Mo — 6 images max</p>
              <Btn size="sm" variant="outline" className="mt-4">Sélectionner des images</Btn>
            </div>
            <p className="text-sm text-muted-foreground">Image de démonstration utilisée pour l'aperçu.</p>
          </>
        )}

        <div className="flex justify-between pt-4 border-t border-border">
          <Btn variant="outline" onClick={() => step > 1 ? setStep(s => s - 1) : navigate("admin-products")}>
            <ArrowLeft size={16} /> {step === 1 ? "Annuler" : "Précédent"}
          </Btn>
          {step < 4 ? (
            <Btn onClick={() => setStep(s => s + 1)}>Suivant <ChevronRight size={16} /></Btn>
          ) : (
            <Btn onClick={handleSave}><Check size={16} /> {isEdit ? "Enregistrer" : "Créer le produit"}</Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN ORDERS
// ============================================================
function AdminOrdersPage() {
  const { orders, navigate } = useApp();
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = orders.filter(o => !statusFilter || o.status === statusFilter);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-8">Commandes</h1>
      <div className="flex gap-3 mb-5">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded border border-border bg-card text-sm focus:outline-none">
          <option value="">Tous les statuts</option>
          {["new", "processing", "shipped", "completed", "cancelled"].map(s => (
            <option key={s} value={s}>{statusLabels[s]?.label}</option>
          ))}
        </select>
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Référence</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Client</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Commande</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Paiement</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(o => (
              <tr key={o.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{o.ref}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                  <p>{o.customerName}</p>
                  <p className="text-xs">{o.customerEmail}</p>
                </td>
                <td className="px-4 py-3 text-right font-medium">{fmt(o.total)}</td>
                <td className="px-4 py-3 text-center"><Badge className={statusLabels[o.status]?.cls}>{statusLabels[o.status]?.label}</Badge></td>
                <td className="px-4 py-3 text-center"><Badge className={statusLabels[o.paymentStatus]?.cls}>{statusLabels[o.paymentStatus]?.label}</Badge></td>
                <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell">{o.createdAt}</td>
                <td className="px-4 py-3">
                  <button onClick={() => navigate("admin-order-detail", { orderId: o.id })}
                    className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><Eye size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN ORDER DETAIL
// ============================================================
function AdminOrderDetailPage() {
  const { pageParams, orders, setOrders, navigate } = useApp();
  const order = orders.find(o => o.id === pageParams.orderId);
  const [note, setNote] = useState("");

  if (!order) return <div className="text-muted-foreground">Commande introuvable.</div>;

  const updateStatus = (status: OrderStatus) => setOrders(os => os.map(o => o.id === order.id ? { ...o, status } : o));
  const updatePayment = (paymentStatus: PaymentStatus) => setOrders(os => os.map(o => o.id === order.id ? { ...o, paymentStatus } : o));
  const addNote = () => { if (!note.trim()) return; setOrders(os => os.map(o => o.id === order.id ? { ...o, notes: `${o.notes ? o.notes + "\n" : ""}[${new Date().toLocaleDateString("fr-FR")}] ${note}` } : o)); setNote(""); };

  const ht = order.total / 1.2;
  const tva = order.total - ht;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate("admin-orders")} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={20} /></button>
        <h1 className="font-display text-3xl font-semibold">{order.ref}</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="font-semibold mb-3">Client</h3>
          <p className="font-medium">{order.customerName}</p>
          <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="font-semibold mb-3">Statuts</h3>
          <div className="flex gap-3 flex-wrap">
            <Badge className={statusLabels[order.status]?.cls}>{statusLabels[order.status]?.label}</Badge>
            <Badge className={statusLabels[order.paymentStatus]?.cls}>{statusLabels[order.paymentStatus]?.label}</Badge>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 mb-5">
        <h3 className="font-semibold mb-3">Articles</h3>
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm py-2 border-b border-border last:border-0">
            <span>{item.title} × {item.qty}</span>
            <span className="font-medium">{fmt(item.price * item.qty)}</span>
          </div>
        ))}
        <div className="pt-3 space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground"><span>HT</span><span>{fmt(ht)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>TVA 20%</span><span>{fmt(tva)}</span></div>
          <div className="flex justify-between font-bold text-base"><span>Total TTC</span><span>{fmt(order.total)}</span></div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 mb-5">
        <h3 className="font-semibold mb-3">Changer le statut</h3>
        <div className="flex flex-wrap gap-2">
          {(["new", "processing", "shipped", "completed", "cancelled"] as OrderStatus[]).map(s => (
            <Btn key={s} size="sm" variant={order.status === s ? "primary" : "outline"} onClick={() => updateStatus(s)}>
              {statusLabels[s]?.label}
            </Btn>
          ))}
        </div>
        <h4 className="font-medium mt-4 mb-2 text-sm">Statut paiement</h4>
        <div className="flex flex-wrap gap-2">
          {(["pending", "paid", "failed", "refunded"] as PaymentStatus[]).map(s => (
            <Btn key={s} size="sm" variant={order.paymentStatus === s ? "primary" : "outline"} onClick={() => updatePayment(s)}>
              {statusLabels[s]?.label}
            </Btn>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="font-semibold mb-3">Notes internes</h3>
        {order.notes && <p className="text-sm text-muted-foreground bg-muted p-3 rounded mb-3 whitespace-pre-wrap">{order.notes}</p>}
        <div className="flex gap-2">
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ajouter une note..."
            className="flex-1 px-3 py-2 rounded border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <Btn size="sm" onClick={addNote}>Ajouter</Btn>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN RESERVATIONS
// ============================================================
function AdminReservationsPage() {
  const { reservations, setReservations } = useApp();
  const [tab, setTab] = useState("all");
  const tabs = [{ value: "all", label: "Toutes" }, { value: "new", label: "Nouvelles" }, { value: "contacted", label: "Contactées" }, { value: "confirmed", label: "Confirmées" }];
  const filtered = tab === "all" ? reservations : reservations.filter(r => r.status === tab);

  const updateStatus = (id: number, status: ReservationStatus) =>
    setReservations(rs => rs.map(r => r.id === id ? { ...r, status } : r));

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-6">Réservations</h1>
      <div className="flex gap-2 mb-5">
        {tabs.map(t => <Btn key={t.value} size="sm" variant={tab === t.value ? "primary" : "outline"} onClick={() => setTab(t.value)}>{t.label}</Btn>)}
      </div>
      <div className="space-y-3">
        {filtered.map(r => (
          <div key={r.id} className="bg-card border border-border rounded-lg p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{r.productTitle}</p>
                <p className="text-sm text-muted-foreground">{r.customerName} · {r.customerEmail}{r.phone ? ` · ${r.phone}` : ""}</p>
                {r.message && <p className="text-sm text-muted-foreground mt-2 italic">"{r.message}"</p>}
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Clock size={11} />{r.createdAt}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={statusLabels[r.status]?.cls}>{statusLabels[r.status]?.label}</Badge>
                <div className="flex gap-1">
                  {(["new", "contacted", "confirmed", "completed", "cancelled"] as ReservationStatus[]).filter(s => s !== r.status).map(s => (
                    <Btn key={s} size="sm" variant="outline" onClick={() => updateStatus(r.id, s)} className="text-xs">{statusLabels[s]?.label}</Btn>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground">Aucune réservation</p>}
      </div>
    </div>
  );
}

// ============================================================
// ADMIN DEMANDES
// ============================================================
function AdminDemandesPage() {
  const { contactRequests, setContactRequests } = useApp();
  const [tab, setTab] = useState("all");
  const tabs = [{ value: "all", label: "Toutes" }, { value: "new", label: "Nouvelles" }, { value: "in_progress", label: "En cours" }, { value: "done", label: "Terminées" }];
  const filtered = tab === "all" ? contactRequests : contactRequests.filter(r => r.status === tab);

  const updateStatus = (id: number, status: ContactStatus) =>
    setContactRequests(rs => rs.map(r => r.id === id ? { ...r, status } : r));

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-6">Demandes de contact</h1>
      <div className="flex gap-2 mb-5">
        {tabs.map(t => <Btn key={t.value} size="sm" variant={tab === t.value ? "primary" : "outline"} onClick={() => setTab(t.value)}>{t.label}</Btn>)}
      </div>
      <div className="space-y-3">
        {filtered.map(r => (
          <div key={r.id} className="bg-card border border-border rounded-lg p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold">{r.name}</p>
                  <Badge className={statusLabels[r.status]?.cls}>{statusLabels[r.status]?.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{r.email}{r.phone ? ` · ${r.phone}` : ""}</p>
                <p className="text-sm font-medium mt-2">{r.subject}</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{r.message}</p>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Clock size={11} />{r.createdAt}</p>
              </div>
              <div className="flex gap-1 flex-wrap">
                {(["new", "in_progress", "done", "archived"] as ContactStatus[]).filter(s => s !== r.status).map(s => (
                  <Btn key={s} size="sm" variant="outline" onClick={() => updateStatus(r.id, s)} className="text-xs">{statusLabels[s]?.label}</Btn>
                ))}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground">Aucune demande</p>}
      </div>
    </div>
  );
}

// ============================================================
// ADMIN BLOG
// ============================================================
function AdminBlogPage() {
  const { blogPosts, setBlogPosts, navigate } = useApp();

  const deletePost = (id: number) => {
    if (confirm("Supprimer cet article ?")) setBlogPosts(ps => ps.filter(p => p.id !== id));
  };

  const togglePublish = (id: number) =>
    setBlogPosts(ps => ps.map(p => p.id === id ? { ...p, published: !p.published } : p));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-semibold">Articles de blog</h1>
        <Btn onClick={() => navigate("admin-blog-form", { mode: "create" })}><Plus size={16} /> Nouvel article</Btn>
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Article</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Commentaires</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Date</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {blogPosts.map(p => (
              <tr key={p.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.cover} alt="" className="w-12 h-10 rounded object-cover bg-secondary flex-shrink-0" />
                    <p className="font-medium line-clamp-2">{p.title}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">{p.commentsCount}</td>
                <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell">{p.publishedAt}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => togglePublish(p.id)}>
                    <Badge className={p.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                      {p.published ? "Publié" : "Brouillon"}
                    </Badge>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => navigate("admin-blog-form", { mode: "edit", postId: p.id })}
                      className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><Edit2 size={15} /></button>
                    <button onClick={() => deletePost(p.id)}
                      className="p-1.5 hover:bg-red-50 rounded text-muted-foreground hover:text-destructive"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN BLOG FORM
// ============================================================
function AdminBlogFormPage() {
  const { pageParams, blogPosts, setBlogPosts, navigate } = useApp();
  const isEdit = pageParams.mode === "edit";
  const existing = isEdit ? blogPosts.find(p => p.id === pageParams.postId) : undefined;

  const [form, setForm] = useState({ title: existing?.title ?? "", excerpt: existing?.excerpt ?? "", published: existing?.published ?? false });
  const [blocks, setBlocks] = useState<BlogBlock[]>(existing?.blocks ?? [{ type: "paragraph", content: "" }]);
  const [saved, setSaved] = useState(false);

  const addParagraph = () => setBlocks(bs => [...bs, { type: "paragraph", content: "" }]);
  const addImage = () => setBlocks(bs => [...bs, { type: "image", image: "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800&h=400&fit=crop&auto=format" }]);
  const removeBlock = (i: number) => setBlocks(bs => bs.filter((_, bi) => bi !== i));
  const updateBlock = (i: number, updates: Partial<BlogBlock>) => setBlocks(bs => bs.map((b, bi) => bi === i ? { ...b, ...updates } : b));

  const handleSave = () => {
    const post: BlogPost = {
      id: existing?.id ?? Date.now(),
      title: form.title, slug: form.title.toLowerCase().replace(/\s+/g, "-"),
      excerpt: form.excerpt, cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=500&fit=crop&auto=format",
      publishedAt: existing?.publishedAt ?? new Date().toISOString().slice(0, 10),
      commentsCount: existing?.commentsCount ?? 0, published: form.published, blocks,
    };
    if (isEdit) setBlogPosts(ps => ps.map(p => p.id === existing?.id ? post : p));
    else setBlogPosts(ps => [...ps, post]);
    setSaved(true);
    setTimeout(() => navigate("admin-blog"), 1000);
  };

  if (saved) return (
    <div className="text-center py-20">
      <Check size={48} className="text-green-500 mx-auto mb-4" />
      <p className="font-semibold text-lg">Article {isEdit ? "modifié" : "créé"} !</p>
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate("admin-blog")} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={20} /></button>
        <h1 className="font-display text-3xl font-semibold">{isEdit ? "Modifier l'article" : "Nouvel article"}</h1>
      </div>

      <div className="space-y-5">
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <Input label="Titre" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} required placeholder="Titre de l'article" />
          <Textarea label="Extrait (optionnel)" value={form.excerpt} onChange={v => setForm(f => ({ ...f, excerpt: v }))} rows={2} placeholder="Résumé court affiché dans la liste..." />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} className="rounded" />
            Publier immédiatement
          </label>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="font-semibold mb-4">Contenu par blocs</h2>
          <div className="space-y-4">
            {blocks.map((block, i) => (
              <div key={i} className="border border-border rounded-lg p-4 relative group">
                <button onClick={() => removeBlock(i)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={15} />
                </button>
                {block.type === "paragraph" && (
                  <>
                    <input value={block.subtitle ?? ""} onChange={e => updateBlock(i, { subtitle: e.target.value })}
                      placeholder="Sous-titre (optionnel)" className="w-full text-sm font-medium mb-2 bg-transparent border-none outline-none placeholder:text-muted-foreground" />
                    <textarea value={block.content ?? ""} onChange={e => updateBlock(i, { content: e.target.value })}
                      placeholder="Contenu du paragraphe..." rows={4}
                      className="w-full text-sm text-muted-foreground bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground" />
                  </>
                )}
                {block.type === "image" && (
                  <div className="text-center">
                    <img src={block.image} alt="" className="w-full h-32 object-cover rounded mb-2" />
                    <p className="text-xs text-muted-foreground">Image de bloc · Cliquez pour modifier</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <Btn size="sm" variant="outline" onClick={addParagraph}><Plus size={14} /> Paragraphe</Btn>
            <Btn size="sm" variant="outline" onClick={addImage}><Plus size={14} /> Image</Btn>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Btn variant="outline" onClick={() => navigate("admin-blog")}>Annuler</Btn>
          <Btn onClick={handleSave}><Check size={16} /> {isEdit ? "Enregistrer" : "Créer l'article"}</Btn>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN COMMENTS
// ============================================================
function AdminCommentsPage() {
  const { comments, setComments } = useApp();
  const [tab, setTab] = useState("pending");
  const tabs = [{ value: "pending", label: "En attente" }, { value: "approved", label: "Approuvés" }, { value: "rejected", label: "Rejetés" }];
  const filtered = comments.filter(c => c.status === tab);

  const approve = (id: number) => setComments(cs => cs.map(c => c.id === id ? { ...c, status: "approved" as CommentStatus } : c));
  const reject = (id: number) => setComments(cs => cs.map(c => c.id === id ? { ...c, status: "rejected" as CommentStatus } : c));
  const remove = (id: number) => setComments(cs => cs.filter(c => c.id !== id));

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-6">Commentaires</h1>
      <div className="flex gap-2 mb-5">
        {tabs.map(t => (
          <Btn key={t.value} size="sm" variant={tab === t.value ? "primary" : "outline"} onClick={() => setTab(t.value)}>
            {t.label} {t.value === "pending" && <span className="ml-1 bg-accent text-accent-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">{comments.filter(c => c.status === "pending").length}</span>}
          </Btn>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map(c => (
          <div key={c.id} className="bg-card border border-border rounded-lg p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm">{c.author}</p>
                  {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                  <Badge className={statusLabels[c.status]?.cls}>{statusLabels[c.status]?.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Article : {c.postTitle} · {c.createdAt}</p>
                <p className="text-sm text-foreground leading-relaxed">{c.content}</p>
              </div>
              <div className="flex gap-2">
                {c.status !== "approved" && (
                  <button onClick={() => approve(c.id)} className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors" title="Approuver">
                    <Check size={16} />
                  </button>
                )}
                {c.status !== "rejected" && (
                  <button onClick={() => reject(c.id)} className="p-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition-colors" title="Rejeter">
                    <X size={16} />
                  </button>
                )}
                <button onClick={() => remove(c.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors" title="Supprimer">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground">Aucun commentaire dans cet onglet.</p>}
      </div>
    </div>
  );
}

// ============================================================
// LEGAL & FAQ
// ============================================================
function LegalPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="font-display text-4xl font-semibold mb-8">Mentions légales</h1>
      <div className="prose text-muted-foreground space-y-6">
        <section><h2 className="font-semibold text-foreground text-xl mb-2">Éditeur du site</h2><p>KayArt SARL — 12 Route des Coudrais, 72400 Saint-Aubin-des-Coudrais. SIRET : 000 000 000 00000. contact@kayart.fr</p></section>
        <section><h2 className="font-semibold text-foreground text-xl mb-2">Hébergement</h2><p>Ce site est hébergé par un prestataire d'hébergement web certifié ISO 27001.</p></section>
        <section><h2 className="font-semibold text-foreground text-xl mb-2">Propriété intellectuelle</h2><p>L'ensemble des contenus (textes, images, logos) est la propriété exclusive de KayArt et est protégé par le droit d'auteur.</p></section>
      </div>
    </div>
  );
}

function FaqPage() {
  const [open, setOpen] = useState("");
  const faqs = [
    { q: "Quels matériaux utilisez-vous ?", a: "Principalement du carbone pre-preg et de la fibre de verre haute qualité. Chaque pagaie est stratifiée à la main." },
    { q: "Proposez-vous des pagaies sur mesure ?", a: "Oui. Contactez-nous pour un devis selon votre morphologie, style de pagayage et niveau." },
    { q: "Quels sont les délais de fabrication ?", a: "5-7 jours pour une pagaie en stock. 3 à 6 semaines pour une pièce sur mesure." },
    { q: "Réparez-vous les kayaks toutes marques ?", a: "Oui, polyéthylène, fibre de verre, carbone ou kevlar. Diagnostic gratuit à l'atelier." },
    { q: "Comment visiter l'atelier ?", a: "Sur rendez-vous uniquement. Appelez-nous ou utilisez le formulaire de contact." },
    { q: "Livrez-vous à l'international ?", a: "Nous livrons en France métropolitaine, Belgique, Suisse, Luxembourg et Monaco." },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="font-display text-4xl font-semibold mb-8">FAQ</h1>
      <Accordion.Root type="single" collapsible value={open} onValueChange={setOpen}>
        {faqs.map((f, i) => (
          <Accordion.Item key={i} value={`faq-${i}`} className="border-b border-border">
            <Accordion.Trigger className="flex w-full items-center justify-between py-4 text-left font-medium hover:text-accent transition-colors">
              {f.q}
              <ChevronDown size={16} className={`flex-shrink-0 transition-transform ml-4 ${open === `faq-${i}` ? "rotate-180" : ""}`} />
            </Accordion.Trigger>
            <Accordion.Content className="overflow-hidden">
              <p className="pb-4 text-muted-foreground text-sm leading-relaxed">{f.a}</p>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
  );
}

// ============================================================
// APP
// ============================================================
export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [pageParams, setPageParams] = useState<Record<string, unknown>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>(INIT_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INIT_ORDERS);
  const [reservations, setReservations] = useState<Reservation[]>(INIT_RESERVATIONS);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>(INIT_CONTACT_REQUESTS);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(INIT_BLOG_POSTS);
  const [comments, setComments] = useState<Comment[]>(INIT_COMMENTS);

  const navigate = (newPage: Page, params: Record<string, unknown> = {}) => {
    setPage(newPage);
    setPageParams(params);
    window.scrollTo(0, 0);
  };

  const addToCart = (product: Product, qty: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, { productId: product.id, title: product.title, sku: product.sku, price: product.price, discount: product.discount, quantity: qty, image: product.image }];
    });
  };

  const updateCart = (id: number, qty: number) => {
    if (qty <= 0) { removeFromCart(id); return; }
    setCart(prev => prev.map(i => i.productId === id ? { ...i, quantity: qty } : i));
  };

  const removeFromCart = (id: number) => setCart(prev => prev.filter(i => i.productId !== id));

  const ctx: AppCtxType = {
    page, pageParams, navigate, cart, addToCart, updateCart, removeFromCart,
    isAdmin, setIsAdmin, products, setProducts, orders, setOrders,
    reservations, setReservations, contactRequests, setContactRequests,
    blogPosts, setBlogPosts, comments, setComments,
  };

  const isAdminPage = page.startsWith("admin") || page === "login";

  const renderContent = () => {
    switch (page) {
      case "home": return <HomePage />;
      case "products": return <ProductsPage />;
      case "product-detail": return <ProductDetailPage />;
      case "services": return <ServicesPage />;
      case "contact": return <ContactPage />;
      case "blog": return <BlogPage />;
      case "blog-post": return <BlogPostPage />;
      case "cart": return <CartPage />;
      case "checkout": return <CheckoutPage />;
      case "checkout-success": return <CheckoutSuccessPage />;
      case "login": return <LoginPage />;
      case "admin": return <AdminDashboardPage />;
      case "admin-products": return <AdminProductsPage />;
      case "admin-product-form": return <AdminProductFormPage />;
      case "admin-orders": return <AdminOrdersPage />;
      case "admin-order-detail": return <AdminOrderDetailPage />;
      case "admin-reservations": return <AdminReservationsPage />;
      case "admin-demandes": return <AdminDemandesPage />;
      case "admin-blog": return <AdminBlogPage />;
      case "admin-blog-form": return <AdminBlogFormPage />;
      case "admin-comments": return <AdminCommentsPage />;
      case "legal": return <LegalPage />;
      case "faq": return <FaqPage />;
      default: return <HomePage />;
    }
  };

  return (
    <AppCtx.Provider value={ctx}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&display=swap');
        .font-display { font-family: 'Fraunces', Georgia, serif; }
        body { font-family: 'DM Sans', system-ui, sans-serif; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 9999px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }
      `}</style>

      {page === "login" ? (
        <LoginPage />
      ) : page.startsWith("admin") ? (
        isAdmin ? (
          <AdminLayout>{renderContent()}</AdminLayout>
        ) : (
          <div className="min-h-screen flex items-center justify-center text-center px-4">
            <div>
              <p className="text-muted-foreground mb-4">Accès réservé aux administrateurs.</p>
              <Btn onClick={() => navigate("login")}>Se connecter</Btn>
            </div>
          </div>
        )
      ) : (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          <Navbar />
          <main className="flex-1">{renderContent()}</main>
          <Footer />
        </div>
      )}
    </AppCtx.Provider>
  );
}
