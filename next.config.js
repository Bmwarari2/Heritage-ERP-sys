/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  api: {
    bodyParser: false,
  },
}

module.exports = nextConfig
