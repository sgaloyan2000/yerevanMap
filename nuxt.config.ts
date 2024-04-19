// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  build: { transpile: ["@fawmi/vue-google-maps"] },
  nitro: {
    plugins: ["~/server/plugins/mongodb.ts"],
  },
  runtimeConfig: {
    mongodbUri: "mongodb://localhost:27017/yerevan",
  },
  devtools: { enabled: true }
})
