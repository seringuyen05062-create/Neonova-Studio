/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Handle .glb, .gltf, .vrm files
    config.module.rules.push({
      test: /\.(glb|gltf|vrm)$/,
      type: 'asset/resource',
    });
    return config;
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['three', '@react-three/fiber', '@react-three/drei'],
  },
};

module.exports = nextConfig;
