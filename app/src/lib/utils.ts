import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the full URL for an IPFS resource.
 * If the uri is already a full URL (starts with http/https), return it as-is.
 * Otherwise, prepend the IPFS gateway URL.
 */
export function getIpfsUrl(uri: string | undefined | null): string {
  if (!uri) return "";

  // Check if it's already a full URL
  if (uri.startsWith("http://") || uri.startsWith("https://") || uri.startsWith("data:")) {
    return uri;
  }

  // Check if it starts with ipfs:// protocol
  if (uri.startsWith("ipfs://")) {
    const cid = uri.replace("ipfs://", "");
    return `${process.env.NEXT_PUBLIC_IPFS_URL || ""}${cid}`;
  }

  // Otherwise, assume it's a CID and prepend the IPFS gateway URL
  return `${process.env.NEXT_PUBLIC_IPFS_URL || ""}${uri}`;
}
