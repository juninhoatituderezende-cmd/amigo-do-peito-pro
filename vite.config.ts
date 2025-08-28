import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk
          vendor: ['react', 'react-dom'],
          
          // UI components chunk
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', 'lucide-react'],
          
          // Query client chunk
          query: ['@tanstack/react-query'],
          
          // Admin chunks
          admin: [
            './src/pages/admin/AdminDashboard',
            './src/pages/admin/AdminUsuarios',
            './src/pages/admin/AdminRelatorios'
          ],
          
          // User chunks
          user: [
            './src/pages/user/UserDashboard',
            './src/pages/user/UserMarketplace'
          ]
        },
      },
    },
    
    // Minification and optimization
    minify: 'esbuild',
    
    // Source maps for production debugging
    sourcemap: mode === 'development',
    
    // Remove console.logs in production
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    
    // Optimize chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'react-router-dom',
      'lucide-react'
    ],
  },
}));
