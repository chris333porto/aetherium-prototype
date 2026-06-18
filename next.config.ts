import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Allow dev-mode access from LAN so the phone can connect to the Mac's
   * dev server during on-device testing. Next 16 defaults to localhost-only
   * for safety; without this, React hydration silently fails from any other
   * origin because HMR WebSocket traffic is blocked.
   *
   * If the Mac's LAN IP changes (new Wi-Fi network, DHCP reassignment), add
   * the new IP here. This setting only applies in dev mode.
   */
  allowedDevOrigins: [
    '192.168.1.168',
    '*.local',
  ],
};

export default nextConfig;
