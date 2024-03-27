/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                hostname: 'quirky-ibex-748.convex.cloud',
            },
        ],
    },
};

export default nextConfig;