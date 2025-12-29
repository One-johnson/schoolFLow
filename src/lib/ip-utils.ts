/**
 * IP Address Extraction Utility
 * Extracts real IP addresses from request headers
 */

/**
 * Extract real IP address from Next.js request headers
 * Checks multiple headers in order of preference
 */
export function extractIpAddress(headers: Headers): string {
  // Try x-forwarded-for first (most common for proxied requests)
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ips = forwardedFor.split(',').map((ip: string) => ip.trim());
    if (ips[0]) return ips[0];
  }

  // Try x-real-ip (used by some proxies/CDNs)
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp;

  // Try CF-Connecting-IP (Cloudflare)
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  // Try X-Client-IP
  const clientIp = headers.get('x-client-ip');
  if (clientIp) return clientIp;

  // Fallback to localhost if no IP found
  return '127.0.0.1';
}

/**
 * Validate if an IP address is valid
 */
export function isValidIp(ip: string): boolean {
  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 regex (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Check if IP is localhost
 */
export function isLocalhost(ip: string): boolean {
  return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost';
}
