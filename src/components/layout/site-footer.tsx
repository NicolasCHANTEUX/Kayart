import Link from "next/link";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div>
          <strong>{siteConfig.name}</strong>
          <div>{siteConfig.description}</div>
        </div>

        <div>
          <div>{siteConfig.email}</div>
          <div>{siteConfig.phone}</div>
        </div>

        <div>
          <Link href="/mentions-legales">Mentions légales</Link>
          {" / "}
          <Link href="/confidentialite">Confidentialité</Link>
          {" / "}
          <Link href="/cgv">CGV</Link>
        </div>
      </div>
    </footer>
  );
}
