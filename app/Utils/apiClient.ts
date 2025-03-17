const API_BASE_ADDRESS = process.env.NEXT_PUBLIC_API_BASE_ADDRESS;

if (!API_BASE_ADDRESS) {
  throw new Error("API base address is not defined in environment variables.");
}

/**
 * Makes an API request by constructing the URL using the base address
 * from environment variables and the provided endpoint.
 *
 * @param endpoint - The API endpoint to append to the base address.
 * @param options - Optional fetch options (e.g., method, headers, body).
 * @returns A promise that resolves with the parsed JSON response.
 */
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  // Construct the full URL
  const url = constructURL(endpoint);

  console.log(url);
  
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function constructURL(endpoint: string) {
  return (new URL(`${API_BASE_ADDRESS}/${endpoint}`)).href;
}