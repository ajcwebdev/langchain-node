import { Router } from '@edgio/core/router'

const router = new Router()

router.fallback(({ renderWithApp }) => {
  renderWithApp()
})

export default router
