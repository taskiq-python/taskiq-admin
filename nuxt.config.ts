import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  srcDir: 'app',
  imports: {
    autoImport: false
  },
  vite: {
    plugins: [tailwindcss()]
  },
  typescript: {
    strict: true
  },
  nitro: {
    experimental: {
      tasks: true
    },
    scheduledTasks: {
      '* * * * *': ['settings-dispatcher']
    }
  },
  modules: ['@nuxt/fonts']
})
