/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      }
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.(mp4|webm)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/media/',
          outputPath: 'static/media/',
          name: '[name].[hash].[ext]',
        },
      },
    });
    return config;
  },
};

export default nextConfig;
