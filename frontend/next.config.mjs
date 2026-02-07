/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    reactStrictMode: true,
    output: 'export',
    images: {
        unoptimized: true,
    },

};

export default nextConfig;
