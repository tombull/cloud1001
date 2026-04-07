import { AbstractAuthProvider } from 'tinacms'

export class CustomAuthProvider extends AbstractAuthProvider {
  constructor() {
    super()
  }

  /**
   * Called to initiate the login process. Since Authelia acts as a reverse proxy, 
   * we simply redirect the user to the root or a dedicated login path.
   */
  async authenticate(props?: any): Promise<any> {
    // Usually handled by Traefik natively, but fallback here:
    window.location.href = '/' 
  }

  /**
   * Called by Tina to determine if the currently logged-in user is authorized to edit.
   */
  async authorize(context?: any): Promise<any> {
    try {
      const res = await fetch('/api/auth-status')
      if (res.ok) {
        const data = await res.json()
        if (data && data.user) {
          // You could optionally verify specific groups fetched from auth-status here as well.
          return true
        }
      }
    } catch (e) {
      console.error('Authorize error', e)
    }
    return false
  }

  /**
   * Returns current user identity details.
   */
  async getUser() {
    try {
      const res = await fetch('/api/auth-status')
      if (res.ok) {
        const data = await res.json()
        if (data && data.user) {
          return { name: data.defaultName || data.user, email: data.user }
        }
      }
    } catch (e) {
      console.error('GetUser error', e)
    }
    return null
  }

  /**
   * Get proxy token representation for the request
   */
  async getToken() {
    return { id_token: 'authelia-proxy-token' }
  }

  /**
   * Clears session locally and redirects
   */
  async logout() {
    window.location.href = '/authelia/api/logout'
  }
}
