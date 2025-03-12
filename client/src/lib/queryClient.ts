import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  options: {
    path: string;
    method?: string;
    data?: unknown;
    params?: Record<string, string | number | boolean | undefined>;
  } | string,
  url?: string,
  data?: unknown,
): Promise<T> {
  // Support both new object style and old parameter style
  let method: string;
  let path: string;
  let bodyData: unknown | undefined;
  let queryParams: Record<string, string | number | boolean | undefined> | undefined;

  if (typeof options === 'object') {
    // New style with object parameter
    method = options.method || 'GET';
    path = options.path;
    bodyData = options.data;
    queryParams = options.params;
  } else {
    // Old style with positional parameters
    method = options; // first param was method
    path = url!; // second param was url
    bodyData = data; // third param was data
  }

  // Append query parameters to the URL if they exist
  if (queryParams && Object.keys(queryParams).length > 0) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      path += (path.includes('?') ? '&' : '?') + queryString;
    }
  }

  const res = await fetch(path, {
    method: method.toUpperCase(),
    headers: bodyData ? { "Content-Type": "application/json" } : {},
    body: bodyData ? JSON.stringify(bodyData) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: 60000, // Refetch data every minute
      refetchOnWindowFocus: true, // Refetch when window gets focus
      staleTime: 30000, // Consider data stale after 30 seconds
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});