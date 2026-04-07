export const prerender = process.env.DEPLOY_TARGET === 'docker' ? false : true;

export const GET = async ({ request }: any) => {
  let email, user, groupsStr

  if (request.headers.get) {
    email = request.headers.get('remote-email') || request.headers.get('Remote-Email')
    user = request.headers.get('remote-user') || request.headers.get('Remote-User')
    groupsStr = request.headers.get('remote-groups') || request.headers.get('Remote-Groups') || ''
  }

  const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true'
  
  if (isLocal) {
     return new Response(JSON.stringify({ user: 'local-dev', email: 'dev@local' }), {
       status: 200,
       headers: { 'Content-Type': 'application/json' },
     })
  }

  if (email && user) {
    const groups = groupsStr.split(',').map((g: string) => g.trim())
    if (groups.includes('cloud1001-admin')) {
      return new Response(JSON.stringify({ user: email, defaultName: user }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}
