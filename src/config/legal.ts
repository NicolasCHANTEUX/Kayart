import { siteConfig } from "@/config/site";

// Only confirmed business details belong here. Missing values never fall back to mock data.
export function getLegalConfig() {
  const values = {
    legalName: process.env.KAYART_LEGAL_NAME || "",
    legalForm: process.env.KAYART_LEGAL_FORM || "",
    legalAddress: process.env.KAYART_LEGAL_ADDRESS || "",
    registration: process.env.KAYART_LEGAL_REGISTRATION || "",
    taxStatement: process.env.KAYART_LEGAL_TAX_STATEMENT || "",
    publicationDirector: process.env.KAYART_PUBLICATION_DIRECTOR || "",
    mediator: process.env.KAYART_CONSUMER_MEDIATOR || "",
    standardTerms: process.env.KAYART_STANDARD_TERMS || "",
    customTerms: process.env.KAYART_CUSTOM_TERMS || "",
    privacyBasis: process.env.KAYART_PRIVACY_BASIS || "",
    privacyRetention: process.env.KAYART_PRIVACY_RETENTION || "",
    privacyRecipients: process.env.KAYART_PRIVACY_RECIPIENTS || "",
    hostingStatement: process.env.KAYART_HOSTING_STATEMENT || "",
    version: process.env.KAYART_LEGAL_VERSION || ""
  };
  const placeholder = /KayArt\s+SARL|12\s+Route\s+des\s+Coudrais|0(?:[\s.-]*0){8,}|à compléter|placeholder/i;
  const missing = Object.entries(values).filter(([,value]) => !value.trim() || placeholder.test(value)).map(([key]) => key);
  return { ...values, commercialName: "KayArt", email: siteConfig.email, phone: siteConfig.phone, missing, approved: process.env.KAYART_LEGAL_APPROVED === "true" && missing.length === 0 };
}
