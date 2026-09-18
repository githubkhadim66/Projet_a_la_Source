/**
 * Client API · À la Source
 * ------------------------
 * Client HTTP typé pour le backend FastAPI.
 * En dev, Vite proxifie `/api` vers http://localhost:8000 (voir vite.config.ts).
 * En production, nginx proxifie `/api` vers le service backend.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

// ─── Jetons (localStorage) ───────────────────────────────────────────────────

const ADMIN_TOKEN_KEY = "als-admin-token";
const SUPPLIER_TOKEN_KEY = "als-supplier-token";

export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);
export const setAdminToken = (t: string | null) =>
  t ? localStorage.setItem(ADMIN_TOKEN_KEY, t) : localStorage.removeItem(ADMIN_TOKEN_KEY);

export const getSupplierToken = () => localStorage.getItem(SUPPLIER_TOKEN_KEY);
export const setSupplierToken = (t: string | null) =>
  t ? localStorage.setItem(SUPPLIER_TOKEN_KEY, t) : localStorage.removeItem(SUPPLIER_TOKEN_KEY);

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Libellés lisibles des champs, pour transformer les erreurs de validation FastAPI
// (renvoyées en tableau technique) en un message clair pour l'utilisateur.
const FIELD_LABELS: Record<string, string> = {
  company: "Société", contact_name: "Nom du contact", contact: "Contact", name: "Nom",
  email: "E-mail", phone: "Téléphone", country: "Pays", city: "Ville",
  products: "Produits", product_types: "Catégories", sector: "Domaine d'activité",
  volume: "Volume", incoterm: "Incoterm", subject: "Objet", message: "Message",
  price_per_kg: "Prix au kilo", moq: "Quantité minimum (MOQ)", packaging: "Conditionnement",
  description: "Description", origin: "Origine", category: "Catégorie",
};

/** Convertit un tableau d'erreurs de validation FastAPI en phrase lisible. */
function humanizeValidation(errors: Array<{ loc?: unknown[]; msg?: string }>): string {
  const fields = errors.map(e => {
    const key = Array.isArray(e.loc) && e.loc.length ? String(e.loc[e.loc.length - 1]) : "";
    return FIELD_LABELS[key] ?? key;
  }).filter(Boolean);
  const uniq = [...new Set(fields)];
  if (uniq.length) return `Merci de vérifier ${uniq.length > 1 ? "ces champs" : "ce champ"} : ${uniq.join(", ")}.`;
  return "Certaines informations sont invalides ou manquantes.";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { headers, ...rest } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: { "Content-Type": "application/json", ...(headers ?? {}) },
  });
  if (!res.ok) {
    let detail: unknown = res.statusText;
    try {
      const body = await res.json();
      // FastAPI : erreurs de validation = tableau ; erreurs simples = chaîne.
      detail = Array.isArray(body.detail) ? humanizeValidation(body.detail) : (body.detail ?? JSON.stringify(body));
    } catch { /* corps non-JSON */ }
    throw new ApiError(res.status, typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const adminHeaders = () => ({ Authorization: `Bearer ${getAdminToken() ?? ""}` });
const supplierHeaders = () => ({ Authorization: `Bearer ${getSupplierToken() ?? ""}` });

// ─── Types ───────────────────────────────────────────────────────────────────

export type ApiStockStatus = "En stock" | "Sur commande" | "Rupture";
export type ApiLeadStatus = "Nouveau" | "En cours" | "Traité" | "Clos" | "Téléchargé" | "Référencé" | "Devis envoyé" | "Gagné" | "Perdu";
export type ApiQueue = "catalogue" | "devis" | "sourcing" | "candidature";

export interface ApiLead {
  id: number;
  queue: ApiQueue;
  status: ApiLeadStatus;
  language: string;
  company: string;
  contact_name: string;
  email: string;
  phone: string | null;
  country: string;
  payload: Record<string, unknown>;
  catalogue_downloaded_at: string | null;
  catalogue_download_count: number;
  created_at: string;
  updated_at: string;
}

export interface ApiPublicProduct {
  ref: string;
  name: string;
  category: string | null;
  origin: string | null;
  packaging: string;
  moq: string;
  image: string;
  description: string;
  benefits: string;
  featured: boolean;
}

export interface ApiProduct {
  id: number;
  supplier_id: number;
  ref: string;
  name: string;
  category: string | null;
  origin: string | null;
  packaging: string;
  moq: string;
  image: string;
  description: string;
  benefits: string;
  visible: boolean;
  featured: boolean;
  in_catalogue: boolean;
  catalogue_position: number;
  stock_kg: number;
  status: ApiStockStatus;
  delay: string;
  price_per_kg: string;
  bulk_price: string;
  harvest_period: string;
  available_until: string | null;
  updated_at: string;
}

export interface ApiAdminProduct extends ApiProduct {
  supplier_name: string;
  stale: boolean;
  archived_at: string | null;
}

export interface ApiSupplier {
  id: number;
  name: string;
  contact_name: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  categories: string[];
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  products_count: number;
  products_in_stock: number;
  detention_rate: number | null;
  ratings: Record<string, number>;
  rating_note: string;
  rating_avg: number | null;
  rated_at: string | null;
}

export interface ApiProposal {
  id: number;
  supplier_id: number;
  name: string;
  description: string;
  benefits: string;
  origin: string;
  category: string;
  packaging: string;
  moq: string;
  image: string;
  volumes: string | null;
  price_per_kg: string;
  bulk_price: string;
  harvest_period: string;
  certifications: string[];
  available_until: string | null;
  status: "En attente" | "Approuvé" | "Refusé";
  created_at: string;
  supplier_name: string;
}

export interface ApiAppointment {
  id: number;
  name: string;
  company: string;
  email: string;
  duration_minutes: number;
  motif: string | null;
  day: string;
  slot: string;
  timezone: string;
  status: string;
  created_at: string;
}

export interface ApiDashboard {
  leads: Record<ApiQueue, number>;
  leads_total: number;
  leads_new: number;
  leads_in_progress: number;
  suppliers_total: number;
  suppliers_active: number;
  products_total: number;
  products_visible: number;
  products_featured: number;
  stock_ruptures: number;
  stock_stale: number;
  proposals_pending: number;
  appointments_total: number;
}

// ─── Connexion unifiée (/login) ──────────────────────────────────────────────

export const auth = {
  login: (email: string, password: string) =>
    request<{ access_token: string; role: "admin" | "supplier"; must_change_password: boolean }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
    ),
};

// ─── Catalogue public (vitrine) ──────────────────────────────────────────────

export const catalogue = {
  products: (featured?: boolean) =>
    request<ApiPublicProduct[]>(`/catalogue/produits${featured !== undefined ? `?featured=${featured}` : ""}`),
};

// ─── Leads (4 files) ─────────────────────────────────────────────────────────

export const leads = {
  catalogue: (p: {
    first_name: string; last_name: string; company: string; email: string;
    country: string; role?: string; phone?: string; rgpd_consent: boolean; language?: "fr" | "en";
  }) => request<{ id: number; download_url: string }>("/leads/catalogue", { method: "POST", body: JSON.stringify(p) }),

  devis: (p: {
    company: string; contact: string; email: string; country: string; products: string[];
    sector?: string; volume?: string; packaging?: string; incoterm?: string; forecast?: string;
    certifications: string[]; transport_needed: boolean;
    delivery_delay?: string; delivery_continent?: string; delivery_place?: string; delivery_contact?: string;
    language?: "fr" | "en";
  }) => request<{ id: number }>("/leads/devis", { method: "POST", body: JSON.stringify(p) }),

  sourcing: (p: {
    company: string; contact: string; email: string; country: string; product: string;
    description: string; sector?: string; origin?: string; volume?: string; budget?: string;
    quality_level?: string; forecast?: string; incoterm?: string; other_need?: string;
    certifications: string[]; transport_needed: boolean;
    delivery_delay?: string; delivery_continent?: string; delivery_place?: string; delivery_contact?: string;
    language?: "fr" | "en";
  }) => request<{ id: number }>("/leads/sourcing", { method: "POST", body: JSON.stringify(p) }),

  candidature: (p: {
    company: string; contact_name: string; email: string; phone?: string; country: string;
    city?: string; product_types: string[]; products: string[]; certifications: string[];
    rgpd_consent: boolean; language?: "fr" | "en";
  }) => request<{ id: number }>("/leads/candidature", { method: "POST", body: JSON.stringify(p) }),
};

// ─── Rendez-vous expert ──────────────────────────────────────────────────────

export const rdv = {
  slots: (day: string) => request<{ day: string; slots: string[] }>(`/rdv/slots?day=${encodeURIComponent(day)}`),
  book: (p: {
    duration_minutes: 15 | 30; motif?: string; day: string; slot: string;
    name: string; company: string; email: string; timezone?: string; language?: "fr" | "en";
  }) => request<{ id: number; status: string }>("/rdv", { method: "POST", body: JSON.stringify(p) }),
};

// ─── Espace fournisseurs ─────────────────────────────────────────────────────

export const supplier = {
  login: (email: string, password: string) =>
    request<{ access_token: string }>("/suppliers/auth/login", {
      method: "POST", body: JSON.stringify({ email, password }),
    }),
  me: () => request<ApiSupplier>("/suppliers/me", { headers: supplierHeaders() }),
  updateProfile: (data: Partial<{ name: string; contact_name: string; phone: string; country: string; city: string }>) =>
    request<ApiSupplier>("/suppliers/me", {
      method: "PATCH", body: JSON.stringify(data), headers: supplierHeaders(),
    }),
  changePassword: (current_password: string, new_password: string) =>
    request<{ message: string }>("/suppliers/me/password", {
      method: "POST", body: JSON.stringify({ current_password, new_password }), headers: supplierHeaders(),
    }),
  myProducts: (archived = false) =>
    request<ApiProduct[]>(`/suppliers/me/products${archived ? "?archived=true" : ""}`, { headers: supplierHeaders() }),
  archiveProduct: (id: number) =>
    request<ApiProduct>(`/suppliers/me/products/${id}/archive`, { method: "POST", headers: supplierHeaders() }),
  restoreProduct: (id: number) =>
    request<ApiProduct>(`/suppliers/me/products/${id}/restore`, { method: "POST", headers: supplierHeaders() }),
  updateProduct: (id: number, data: {
    stock_kg?: number; status?: ApiStockStatus; delay?: string;
    name?: string; category?: string; origin?: string; packaging?: string; moq?: string;
    image?: string; description?: string; benefits?: string;
    price_per_kg?: string; bulk_price?: string; harvest_period?: string;
    available_until?: string | null;
  }) =>
    request<ApiProduct>(`/suppliers/me/products/${id}`, {
      method: "PATCH", body: JSON.stringify(data), headers: supplierHeaders(),
    }),
  proposeProduct: (data: {
    name: string; description: string; benefits?: string; origin?: string; category?: string;
    packaging?: string; moq?: string; image?: string; volumes?: string; certifications: string[];
    price_per_kg?: string; bulk_price?: string; harvest_period?: string;
    available_until?: string | null;
  }) =>
    request<ApiProposal>("/suppliers/me/proposals", {
      method: "POST", body: JSON.stringify(data), headers: supplierHeaders(),
    }),
  /** Téléverse une photo pour une proposition (S3 ou serveur). */
  uploadImage: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE_URL}/suppliers/me/uploads/image`, {
      method: "POST", body: form, headers: supplierHeaders(),
    });
    if (!res.ok) {
      let detail = res.statusText;
      try { detail = (await res.json()).detail ?? detail; } catch { /* non-JSON */ }
      throw new ApiError(res.status, detail);
    }
    return (await res.json()).url as string;
  },
};

// ─── Administration ──────────────────────────────────────────────────────────

export const admin = {
  login: (email: string, password: string) =>
    request<{ access_token: string }>("/admin/auth/login", {
      method: "POST", body: JSON.stringify({ email, password }),
    }),
  me: () => request<{ id: number; email: string; full_name: string | null }>("/admin/me", { headers: adminHeaders() }),
  dashboard: () => request<ApiDashboard>("/admin/dashboard", { headers: adminHeaders() }),

  leads: (params?: { queue?: string; lead_status?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.queue) q.set("queue", params.queue);
    if (params?.lead_status) q.set("lead_status", params.lead_status);
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return request<ApiLead[]>(`/admin/leads${qs ? `?${qs}` : ""}`, { headers: adminHeaders() });
  },
  updateLeadStatus: (id: number, status: ApiLeadStatus) =>
    request<ApiLead>(`/admin/leads/${id}`, {
      method: "PATCH", body: JSON.stringify({ status }), headers: adminHeaders(),
    }),
  replyLead: async (id: number, subject: string, message: string, files: File[] = []) => {
    const form = new FormData();
    form.append("subject", subject);
    form.append("message", message);
    files.forEach(f => form.append("files", f));
    const res = await fetch(`${BASE_URL}/admin/leads/${id}/reply`, {
      method: "POST", body: form, headers: adminHeaders(),
    });
    if (!res.ok) {
      let detail = res.statusText;
      try { const b = await res.json(); detail = Array.isArray(b.detail) ? "Objet et message sont requis." : (b.detail ?? detail); } catch { /* non-JSON */ }
      throw new ApiError(res.status, detail);
    }
    return (await res.json()) as { message: string };
  },
  deleteLead: (id: number) =>
    request<void>(`/admin/leads/${id}`, { method: "DELETE", headers: adminHeaders() }),

  suppliers: () => request<ApiSupplier[]>("/admin/suppliers", { headers: adminHeaders() }),
  createSupplier: (data: {
    name: string; contact_name?: string; email: string; phone?: string;
    country?: string; city?: string; categories?: string[];
  }) => request<ApiSupplier & { temp_password: string }>("/admin/suppliers", {
    method: "POST", body: JSON.stringify(data), headers: adminHeaders(),
  }),
  resetSupplierPassword: (id: number) =>
    request<ApiSupplier & { temp_password: string }>(`/admin/suppliers/${id}/reset-password`, {
      method: "POST", headers: adminHeaders(),
    }),
  rateSupplier: (id: number, data: { ratings: Record<string, number>; rating_note: string }) =>
    request<ApiSupplier>(`/admin/suppliers/${id}/rating`, {
      method: "PUT", body: JSON.stringify(data), headers: adminHeaders(),
    }),
  updateSupplier: (id: number, data: Partial<{
    name: string; contact_name: string; phone: string; country: string; city: string;
    is_active: boolean; categories: string[];
  }>) =>
    request<ApiSupplier>(`/admin/suppliers/${id}`, {
      method: "PATCH", body: JSON.stringify(data), headers: adminHeaders(),
    }),

  products: (archived = false) =>
    request<ApiAdminProduct[]>(`/admin/products${archived ? "?archived=true" : ""}`, { headers: adminHeaders() }),
  archiveProduct: (id: number) =>
    request<ApiAdminProduct>(`/admin/products/${id}/archive`, { method: "POST", headers: adminHeaders() }),
  restoreProduct: (id: number) =>
    request<ApiAdminProduct>(`/admin/products/${id}/restore`, { method: "POST", headers: adminHeaders() }),
  createProduct: (data: {
    supplier_id: number; ref: string; name: string; category?: string; origin?: string;
    packaging?: string; moq?: string; image?: string; description?: string; benefits?: string;
    visible?: boolean; featured?: boolean; in_catalogue?: boolean;
    stock_kg?: number; status?: ApiStockStatus; delay?: string;
    price_per_kg?: string; bulk_price?: string; harvest_period?: string;
  }) => request<ApiAdminProduct>("/admin/products", {
    method: "POST", body: JSON.stringify(data), headers: adminHeaders(),
  }),
  updateProduct: (id: number, data: Partial<{
    name: string; category: string; origin: string; packaging: string; moq: string; image: string;
    description: string; benefits: string;
    visible: boolean; featured: boolean; in_catalogue: boolean;
    stock_kg: number; status: ApiStockStatus; delay: string;
    price_per_kg: string; bulk_price: string; harvest_period: string;
    available_until: string | null;
  }>) => request<ApiAdminProduct>(`/admin/products/${id}`, {
    method: "PATCH", body: JSON.stringify(data), headers: adminHeaders(),
  }),

  /** Téléverse une photo produit (S3 si configuré, disque serveur sinon) et renvoie son URL. */
  uploadImage: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE_URL}/admin/uploads/image`, {
      method: "POST", body: form, headers: adminHeaders(), // pas de Content-Type : le navigateur pose la limite multipart
    });
    if (!res.ok) {
      let detail = res.statusText;
      try { detail = (await res.json()).detail ?? detail; } catch { /* non-JSON */ }
      throw new ApiError(res.status, detail);
    }
    return (await res.json()).url as string;
  },

  // ─── Catalogue PDF ─────────────────────────────────────────────────────────
  catalogueProducts: () =>
    request<ApiAdminProduct[]>("/admin/catalogue/products", { headers: adminHeaders() }),
  catalogueReorder: (product_ids: number[]) =>
    request<ApiAdminProduct[]>("/admin/catalogue/reorder", {
      method: "POST", body: JSON.stringify({ product_ids }), headers: adminHeaders(),
    }),
  catalogueRequests: () =>
    request<ApiLead[]>("/admin/catalogue/requests", { headers: adminHeaders() }),
  resendCatalogue: (leadId: number) =>
    request<{ message: string }>(`/admin/catalogue/requests/${leadId}/send`, {
      method: "POST", headers: adminHeaders(),
    }),
  /** Télécharge le PDF généré tel que le reçoivent les prospects (jamais depuis le cache). */
  downloadCataloguePreview: async () => {
    const res = await fetch(`${BASE_URL}/admin/catalogue/preview`, {
      headers: adminHeaders(), cache: "no-store",
    });
    if (!res.ok) {
      let detail = res.statusText;
      try { detail = (await res.json()).detail ?? detail; } catch { /* non-JSON */ }
      throw new ApiError(res.status, detail);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "catalogue-a-la-source.pdf";
    a.click();
    URL.revokeObjectURL(url);
  },
  deleteProduct: (id: number) =>
    request<void>(`/admin/products/${id}`, { method: "DELETE", headers: adminHeaders() }),

  proposals: (pendingOnly = false) =>
    request<ApiProposal[]>(`/admin/proposals${pendingOnly ? "?pending_only=true" : ""}`, { headers: adminHeaders() }),
  decideProposal: (id: number, status: "Approuvé" | "Refusé", reason?: string) =>
    request<ApiProposal>(`/admin/proposals/${id}`, {
      method: "PATCH", body: JSON.stringify({ status, reason }), headers: adminHeaders(),
    }),

  appointments: () => request<ApiAppointment[]>("/admin/appointments", { headers: adminHeaders() }),
  updateAppointment: (id: number, status: "confirmé" | "annulé") =>
    request<ApiAppointment>(`/admin/appointments/${id}`, {
      method: "PATCH", body: JSON.stringify({ status }), headers: adminHeaders(),
    }),

  remindSupplierStock: (id: number) =>
    request<{ message: string; count: number }>(`/admin/suppliers/${id}/remind-stock`, {
      method: "POST", headers: adminHeaders(),
    }),

  /** Télécharge un export CSV (REF-04) et déclenche l'enregistrement dans le navigateur. */
  downloadExport: async (dataset: "leads" | "products" | "suppliers") => {
    const res = await fetch(`${BASE_URL}/admin/export/${dataset}`, { headers: adminHeaders() });
    if (!res.ok) throw new ApiError(res.status, res.statusText);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = { leads: "leads.csv", products: "produits.csv", suppliers: "fournisseurs.csv" }[dataset];
    a.click();
    URL.revokeObjectURL(url);
  },
};

export const health = () => request<{ status: string }>("/health");
