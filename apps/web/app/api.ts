export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
    credentials: "same-origin",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      typeof body?.detail === "string"
        ? body.detail
        : response.status >= 500
          ? "Suzanne est momentanément indisponible. Vérifie que l’API est démarrée."
          : "Cette demande n’a pas pu aboutir.",
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
