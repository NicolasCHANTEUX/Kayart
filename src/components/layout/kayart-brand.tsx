import Image from "next/image";

/** Vector interpretation of the brand references, kept separate from product imagery. */
export function KayartBrand() {
  return <>
    <Image className="brand__mark" src="/brand/kayart-mark.svg" alt="" width={36} height={36} unoptimized />
    <span className="brand__type"><span className="brand__name">KAYART</span><span className="brand__tagline">Kayak · Art · Composite · Sport</span></span>
  </>;
}

export function KayartHeroMark() {
  return <Image
    className="hero-brand-mark"
    src="/brand/Emile_photo_principale.webp"
    alt=""
    fill
    sizes="(max-width:540px) 100vw, (max-width:1100px) 48vw, 610px"
    quality={100}
    priority
  />;
}
