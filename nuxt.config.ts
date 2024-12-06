export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  srcDir: "src/",
  modules: ["@nuxtjs/tailwindcss"],
  typescript: {
    strict: true,
  },
})
