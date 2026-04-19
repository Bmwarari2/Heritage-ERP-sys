/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Keep these packages out of the webpack bundle — they read AFM
    // fonts / native files at runtime which next can't trace.
    serverComponentsExternalPackages: ['pdf-parse', 'pdfkit'],
  },
  images: {
    // Local SVGs in /public are trusted — enable so next/image renders them
    // without running them through the optimizer.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

module.exports = nextConfig
