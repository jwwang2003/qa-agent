/**
 * Splits a string of names by ";" and returns an array of trimmed names.
 *
 * @param namesString - A string containing names separated by semicolons.
 * @returns An array of non-empty, trimmed names.
 */
export function splitNames(namesString: string): string[] {
  if (!namesString) return [];
  return namesString
    .split(/[;；]/) // Splits on both ASCII ";" and full-width "；"
    .map(name => name.trim())
    .filter(name => name.length > 0);
}

/**
 * Constructs a URL for a file using a backend API endpoint from environment variables.
 *
 * @param fileName - The filename including its extension.
 * @returns A URL string composed of the API endpoint and the fileName.
 * @throws Will throw an error if the BACKEND_API_ENDPOINT is not set.
 */
export function constructFileUrl(fileName: string, base="http://localhost:3000"): string {
  const apiEndpoint: string | undefined = base || process.env.NEXT_PUBLIC_STATIC_BASE_ADDRESS;
  if (!apiEndpoint) {
    throw new Error("BACKEND_API_ENDPOINT is not set in the environment variables.");
  }
  // Remove trailing slash if present.
  const normalizedEndpoint = apiEndpoint.endsWith("/") ? apiEndpoint.slice(0, -1) : apiEndpoint;
  return `${normalizedEndpoint}/${fileName}`;
}
