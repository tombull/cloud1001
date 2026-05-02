import { TinaNodeBackend, LocalBackendAuthProvider } from '@tinacms/datalayer'
import databaseClient from '../../../../tina/database'

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true'

const tinaHandler = TinaNodeBackend({
  authProvider: isLocal
    ? (LocalBackendAuthProvider as any)()
    : {
        isAuthorized: async (req: any, _res: any) => {
          let email, user, groupsStr

          if (req?.headers?.get) {
            email = req.headers.get('remote-email') || req.headers.get('Remote-Email')
            user = req.headers.get('remote-user') || req.headers.get('Remote-User')
            groupsStr = req.headers.get('remote-groups') || req.headers.get('Remote-Groups') || ''
          } else if (req?.headers) {
            email = req.headers['remote-email']
            user = req.headers['remote-user']
            groupsStr = req.headers['remote-groups'] || ''
          }

          if (!email || !user) {
            return {
              isAuthorized: false,
              errorMessage: 'Missing identity headers',
              errorCode: 401
            } as const
          }

          const groups = groupsStr.split(',').map((g: string) => g.trim())
          
          if (groups.includes('cloud1001-admin')) {
            return { isAuthorized: true } as const
          }

          return {
            isAuthorized: false,
            errorMessage: 'User is not in the cloud1001-admin group',
            errorCode: 403
          } as const
        },
      },
  databaseClient: databaseClient as any,
})

export const prerender = process.env.ENABLE_CMS === 'true' ? false : true;

export const getStaticPaths = () => {
  return []
}

export const ALL = async (context: any) => {
  const req = context.request;
  
  // Transform web Request to a pseudo Node.js IncomingMessage
  // so that TinaNodeBackend doesn't crash on standard node methods
  const urlObj = new URL(req.url);
  const nodeReq = {
    method: req.method,
    url: urlObj.pathname + urlObj.search,
    headers: Object.fromEntries(req.headers.entries()),
    body: (req.method !== 'GET' && req.method !== 'HEAD') ? await req.text() : '',
    on: function(event: string, callback: any) {
      if (event === 'data' && this.body) {
        callback(Buffer.from(this.body));
      }
      if (event === 'end') {
        callback();
      }
      return this;
    }
  };

  let statusCode = 200;
  let headers: Record<string, string> = {};
  let bodyData: any = '';

  const nodeRes = {
    statusCode: 200,
    setHeader: (key: string, value: string) => { headers[key] = value; },
    writeHead: (code: number, incomingHeaders: any) => {
      statusCode = code;
      headers = { ...headers, ...incomingHeaders };
    },
    end: (data: any) => { if (data) bodyData = data; },
    write: (data: any) => { if (data) bodyData += data; }
  };

  await (tinaHandler as any)(nodeReq, nodeRes);

  return new Response(bodyData || null, {
    status: statusCode,
    headers: headers as any
  });
}
