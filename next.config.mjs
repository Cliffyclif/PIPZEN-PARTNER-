/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Runs src/instrumentation.ts on boot (starts the CryMad CRM background worker).
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
