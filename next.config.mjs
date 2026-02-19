/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { hostname: 'localhost' },
            { hostname: '127.0.0.1' },
            { hostname: 'placehold.co' },
            { hostname: '*.supabase.co' },
        ],
    },
};

export default nextConfig;
