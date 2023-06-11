/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
    },
    output: 'export',
    eslint: {
        ignoreDuringBuilds: true,
    },

}

module.exports = nextConfig
