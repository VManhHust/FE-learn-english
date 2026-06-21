import type {
  CreateParams,
  DataProvider,
  DeleteParams,
  GetListParams,
  GetOneParams,
  UpdateParams,
} from "react-admin";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";
const TOKEN_KEY = "learn_english_cms_token";
const USER_KEY = "learn_english_cms_user";

type PageResponse<T> = {
  content: T[];
  totalElements: number;
};

type LoginResponse = {
  accessToken: string;
  user: CmsUser;
};

export type CmsUser = {
  id: number;
  email: string;
  displayName?: string;
  role: string;
};

const getErrorMessage = async (response: Response) => {
  const body = await response.text();
  if (!body) return `Request failed (${response.status})`;
  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string };
    return parsed.message ?? parsed.error ?? body;
  } catch {
    return body;
  }
};

export const apiFetch = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = new Error(await getErrorMessage(response)) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
};

const resourcePath = (resource: string) => `/admin/${resource}`;

const toIsoInstant = (value: unknown) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? trimmed : parsed.toISOString();
};

const buildUpdatePayload = (resource: string, data: Record<string, unknown>) => {
  if (resource === "lessons") {
    return {
      title: data.title,
      level: data.vocabularyLevel,
    };
  }

  if (resource === "users") {
    const proEnabled = Boolean(data.pro);
    return {
      displayName: data.displayName,
      role: data.role,
      proStartsAt: proEnabled ? toIsoInstant(data.proStartsAt) : null,
      proExpiresAt: proEnabled ? toIsoInstant(data.proExpiresAt) : null,
    };
  }

  return data;
};

export const dataProvider = {
  getList: async (resource: string, params: GetListParams) => {
    const { page = 1, perPage = 25 } = params.pagination ?? {};
    const { field = "id", order = "DESC" } = params.sort ?? {};
    const query = new URLSearchParams({
      page: String(page - 1),
      size: String(perPage),
      sort: field,
      order,
    });
    const search = params.filter?.q;
    if (search) query.set("q", search);
    Object.entries(params.filter ?? {}).forEach(([key, value]) => {
      if (key !== "q" && value !== undefined && value !== null && value !== "") {
        query.set(key, String(value));
      }
    });

    const result = await apiFetch<PageResponse<Record<string, unknown>>>(
      `${resourcePath(resource)}?${query}`,
    );
    return { data: result.content, total: result.totalElements };
  },

  getOne: async (resource: string, params: GetOneParams) => ({
    data: await apiFetch(`${resourcePath(resource)}/${params.id}`),
  }),

  getMany: async (resource, params) => {
    const records = await Promise.all(
      params.ids.map((id) => apiFetch<Record<string, unknown>>(`${resourcePath(resource)}/${id}`)),
    );
    return { data: records };
  },

  getManyReference: async (resource, params) =>
    dataProvider.getList(resource, {
      ...params,
      filter: { ...params.filter, [params.target]: params.id },
    }),

  create: async (resource: string, params: CreateParams) => ({
    data: await apiFetch(resourcePath(resource), {
      method: "POST",
      body: JSON.stringify(params.data),
    }),
  }),

  update: async (resource: string, params: UpdateParams) => ({
    data: await apiFetch(`${resourcePath(resource)}/${params.id}`, {
      method: "PUT",
      body: JSON.stringify(buildUpdatePayload(resource, params.data)),
    }),
  }),

  updateMany: async () => {
    throw new Error("Bulk update is not supported");
  },

  delete: async (resource: string, params: DeleteParams) => {
    await apiFetch(`${resourcePath(resource)}/${params.id}`, { method: "DELETE" });
    return { data: params.previousData };
  },

  deleteMany: async () => {
    throw new Error("Bulk delete is not supported");
  },
} as DataProvider;

export const authProvider = {
  login: async ({ username, password }: { username: string; password: string }) => {
    const result = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: username, password }),
    });

    if (result.user.role !== "ADMIN") {
      throw new Error("Tài khoản này không có quyền quản trị");
    }

    localStorage.setItem(TOKEN_KEY, result.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
  },

  logout: async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  checkAuth: async () => {
    if (!localStorage.getItem(TOKEN_KEY)) throw new Error("Authentication required");
  },

  checkError: async (error: { status?: number }) => {
    if (error.status === 401 || error.status === 403) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      throw error;
    }
  },

  getIdentity: async () => {
    const rawUser = localStorage.getItem(USER_KEY);
    if (!rawUser) throw new Error("User identity is missing");
    const user = JSON.parse(rawUser) as CmsUser;
    return {
      id: user.id,
      fullName: user.displayName || user.email,
    };
  },

  getPermissions: async () => {
    const rawUser = localStorage.getItem(USER_KEY);
    return rawUser ? (JSON.parse(rawUser) as CmsUser).role : null;
  },
};
