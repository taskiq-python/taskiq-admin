import { defineEventHandler } from '#imports'

export default defineEventHandler((event) => {
  const { method, url } = event.node.req
  console.log(`[API] ${method} ${url}`)
})
