import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { ProductPrice } from "@/components/catalog/product-price";
import { productAvailabilityLabels, productConditionLabels } from "@/lib/catalog";
import { formatStock, getDiscountPercent } from "@/lib/format";
import { findProductBySlug, listStaticProductParams } from "@/server/catalog/catalog.service";
import type { Product } from "@/types/catalog";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return listStaticProductParams();
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await findProductBySlug(slug);

  if (!product) {
    return {};
  }

  return {
    title: product.name,
    description: product.shortDescription || product.description
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await findProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const isImperfect = product.condition === "imperfect";
  const model = product.baseProduct;
  const modelImages = model?.images ?? [];
  const defectImages = isImperfect ? product.images : [];
  const galleryImages = isImperfect && modelImages.length > 0 ? modelImages : product.images;
  const description = isImperfect && model ? model.description : product.description;
  const discountPercent = getDiscountPercent(product);
  const primaryAction = getPrimaryAction(product);

  return (
    <section className="section product-detail-section">
      <div className="container product-detail-layout">
        <ProductGallery images={galleryImages} title={isImperfect && model ? model.name : product.name} />

        <article className="product-summary-card">
          <div className="product-badges" aria-label="Informations rapides">
            <span className={`product-pill product-pill--condition-${product.condition}`}>
              {productConditionLabels[product.condition]}
            </span>
            <span className={`product-pill product-pill--availability-${product.availability}`}>
              {productAvailabilityLabels[product.availability]}
            </span>
            <span className={`product-pill product-pill--stock-${getStockTone(product)}`}>
              {formatStock(product)}
            </span>
            {discountPercent ? <span className="product-pill product-pill--discount">-{discountPercent}%</span> : null}
          </div>

          <div>
            <div className="eyebrow">{product.categoryName}</div>
            <h1 className="page-title product-title">{product.name}</h1>
          </div>

          <p className="product-lead">{product.shortDescription || description}</p>

          <div className="product-price-panel">
            <ProductPrice product={product} />
            <p>{getPriceHint(product)}</p>
          </div>

          {isImperfect ? (
            <div className="product-alert">
              <strong>Produit neuf imparfait</strong>
              <span>Défaut visuel documenté, sans impact fonctionnel annoncé.</span>
            </div>
          ) : null}

          <dl className="product-facts">
            <div>
              <dt>Référence</dt>
              <dd>{product.sku || "Non renseignée"}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{productConditionLabels[product.condition]}</dd>
            </div>
            <div>
              <dt>Disponibilité</dt>
              <dd>{productAvailabilityLabels[product.availability]}</dd>
            </div>
            <div>
              <dt>Stock</dt>
              <dd>{formatStock(product)}</dd>
            </div>
          </dl>

          <div className="actions-row product-actions">
            <Link className="button button--primary" href={primaryAction.href}>
              {primaryAction.label}
            </Link>
            <Link className="button button--ghost" href="/contact">
              Poser une question
            </Link>
          </div>
        </article>
      </div>

      <div className="container product-content-grid">
        <section className="product-info-panel product-info-panel--wide">
          <span className="panel-kicker">Présentation</span>
          <h2>Description</h2>
          <p>{description}</p>
        </section>

        <section className="product-info-panel">
          <span className="panel-kicker">Détails</span>
          <h2>Caractéristiques</h2>
          {product.attributes.length > 0 ? (
            <dl className="product-spec-grid">
              {product.attributes.map((attribute) => (
                <div key={`${attribute.label}-${attribute.value}`}>
                  <dt>{attribute.label}</dt>
                  <dd>
                    {attribute.value}
                    {attribute.unit ? ` ${attribute.unit}` : ""}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p>Les caractéristiques détaillées seront ajoutées prochainement.</p>
          )}
        </section>

        {isImperfect ? (
          <>
            {model ? (
              <section className="product-info-panel product-info-panel--model">
                <span className="panel-kicker">Modèle d'origine</span>
                <h2>{model.name}</h2>
                <p>{model.shortDescription || model.description}</p>
                <Link className="button button--ghost" href={`/boutique/${model.slug}`}>
                  Voir le modèle
                </Link>
              </section>
            ) : null}

            <section className="product-info-panel product-info-panel--warning product-info-panel--wide">
              <span className="panel-kicker">Transparence atelier</span>
              <h2>Défauts constatés</h2>
              <p>{product.defectDescription || product.description}</p>
              {defectImages.length > 0 ? (
                <div className="defect-gallery" aria-label="Photos des défauts">
                  {defectImages.map((image) => (
                    <img alt={image.altText ?? `Défaut ${product.name}`} key={image.id} src={image.url} />
                  ))}
                </div>
              ) : (
                <p className="muted-note">Les photos du défaut seront ajoutées prochainement.</p>
              )}
            </section>
          </>
        ) : null}
      </div>
    </section>
  );
}

function getPrimaryAction(product: Product) {
  if (product.condition === "service") {
    return {
      href: "/contact",
      label: "Demander ce service"
    };
  }

  if (product.availability === "made-to-order" || product.isCustomizable || product.priceCents === null) {
    return {
      href: "/contact",
      label: "Demander un devis"
    };
  }

  if (product.stockQuantity === 0) {
    return {
      href: "/contact",
      label: "Être prévenu"
    };
  }

  return {
    href: "/panier",
    label: "Ajouter au panier"
  };
}

function getPriceHint(product: Product) {
  if (product.condition === "service") {
    return "Le tarif dépend du diagnostic et du niveau d'intervention.";
  }

  if (product.availability === "made-to-order" || product.isCustomizable || product.priceCents === null) {
    return "Un échange permet d'ajuster le prix selon le besoin exact.";
  }

  if (product.condition === "imperfect") {
    return "Prix remisé pour une pièce unique neuve avec défaut visuel.";
  }

  return "Prix TTC indicatif pour le produit présenté.";
}

function getStockTone(product: Product) {
  if (product.condition === "service" || product.availability === "made-to-order" || product.stockQuantity === null) {
    return "neutral";
  }

  if (product.stockQuantity === 0) {
    return "out";
  }

  if (product.stockQuantity <= 2) {
    return "low";
  }

  return "available";
}
