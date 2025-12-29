/**
 * Device Information Parser
 * Extracts browser, OS, and device information from User-Agent
 */

export interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
}

/**
 * Parse User-Agent string to extract device information
 */
export function parseUserAgent(userAgent: string): DeviceInfo {
  if (!userAgent) {
    return {
      browser: 'Unknown Browser',
      os: 'Unknown OS',
      device: 'Unknown Device',
      deviceType: 'unknown',
    };
  }

  const browser = getBrowser(userAgent);
  const os = getOS(userAgent);
  const deviceType = getDeviceType(userAgent);
  const device = `${browser} on ${os}`;

  return {
    browser,
    os,
    device,
    deviceType,
  };
}

/**
 * Extract browser name and version
 */
function getBrowser(ua: string): string {
  if (ua.includes('Edg/')) {
    const match = ua.match(/Edg\/([\d.]+)/);
    return match ? `Edge ${match[1]}` : 'Edge';
  }
  if (ua.includes('Chrome/')) {
    const match = ua.match(/Chrome\/([\d.]+)/);
    return match ? `Chrome ${match[1].split('.')[0]}` : 'Chrome';
  }
  if (ua.includes('Firefox/')) {
    const match = ua.match(/Firefox\/([\d.]+)/);
    return match ? `Firefox ${match[1]}` : 'Firefox';
  }
  if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    const match = ua.match(/Version\/([\d.]+)/);
    return match ? `Safari ${match[1]}` : 'Safari';
  }
  if (ua.includes('Opera/') || ua.includes('OPR/')) {
    return 'Opera';
  }
  return 'Unknown Browser';
}

/**
 * Extract operating system
 */
function getOS(ua: string): string {
  if (ua.includes('Windows NT 10.0')) return 'Windows 10';
  if (ua.includes('Windows NT 6.3')) return 'Windows 8.1';
  if (ua.includes('Windows NT 6.2')) return 'Windows 8';
  if (ua.includes('Windows NT 6.1')) return 'Windows 7';
  if (ua.includes('Windows')) return 'Windows';
  
  if (ua.includes('Mac OS X')) {
    const match = ua.match(/Mac OS X ([\d_]+)/);
    if (match) {
      const version = match[1].replace(/_/g, '.');
      return `macOS ${version}`;
    }
    return 'macOS';
  }
  
  if (ua.includes('Android')) {
    const match = ua.match(/Android ([\d.]+)/);
    return match ? `Android ${match[1]}` : 'Android';
  }
  
  if (ua.includes('iPhone') || ua.includes('iPad')) {
    const match = ua.match(/OS ([\d_]+)/);
    if (match) {
      const version = match[1].replace(/_/g, '.');
      return `iOS ${version}`;
    }
    return 'iOS';
  }
  
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Ubuntu')) return 'Ubuntu';
  if (ua.includes('CrOS')) return 'Chrome OS';
  
  return 'Unknown OS';
}

/**
 * Determine device type
 */
function getDeviceType(ua: string): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
  if (ua.includes('Mobile') || ua.includes('iPhone') || ua.includes('Android')) {
    if (ua.includes('iPad') || ua.includes('Tablet')) {
      return 'tablet';
    }
    return 'mobile';
  }
  if (ua.includes('Windows') || ua.includes('Mac OS X') || ua.includes('Linux')) {
    return 'desktop';
  }
  return 'unknown';
}

/**
 * Get a short device description
 */
export function getDeviceDescription(deviceInfo: DeviceInfo): string {
  return `${deviceInfo.browser} on ${deviceInfo.os}`;
}
