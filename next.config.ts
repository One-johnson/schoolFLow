import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaSyDdEt90BYxkmlomk7AeOdRWfOXq7HY5O14",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "schoolflow-731q1.firebaseapp.com",
    NEXT_PUBLIC_FIREBASE_DATABASE_URL: "https://schoolflow-731q1-default-rtdb.firebaseio.com",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "schoolflow-731q1",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "schoolflow-731q1.firebasestorage.app",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "349830314157",
    NEXT_PUBLIC_FIREBASE_APP_ID: "1:349830314157:web:e0bc3133825a7c34586e24",
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "",
  }
};

export default nextConfig;
