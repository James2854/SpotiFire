const crypto = require('crypto')
const {BrowserWindow} = require('electron');
const Store = require('electron-store');
//const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
store = new Store();


// store env variables in local storage
store.set('client_id', '5bf42059515f42068e0b53ea4ae0d6c5')
store.set('redirect_uri', 'http://google.com')


// generate random bytes of n length
function randomBytes(n) {
  return crypto.randomBytes(n)
}

// encode string buffer to base64url
function base64url(a) {
  return a.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// generate code challenge using code verifier
function generateCodeChallenge(code_verifier) {
  const hashBuffer = crypto.createHash('sha256').update(code_verifier).digest()
  return base64url(hashBuffer)
}

// fetch json from response
async function fetchJSON(input, init) {
  const response = await fetch(input, init)
  const body = await response.json()
  console.log(body)
  if (!response.ok) {
    throw new ErrorResponse(response, body)
  }
  return body
}

// cheeky hack, just delete the tokenset when we want to logout
function logout() {
  store.delete('tokenSet')
}


// fetch access token from spotify api using the authentication code and code verifier
async function createAccessToken(params) {
  const response = await fetchJSON('https://accounts.spotify.com/api/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: store.get('client_id'),
      ...params,
    }),
  })
  
  const accessToken = response.access_token
  const expires_at = Date.now() + 1000 * response.expires_in

  store.set('tokenSet', JSON.stringify({ ...response, expires_at }))

  return accessToken
}

// return the access token if it is valid, otherwise fetch a new one using refresh token
async function getAccessToken() {
  let tokenSet = JSON.parse(store.get('tokenSet'))

  if (!tokenSet) return false

  if (tokenSet.expires_at < Date.now()) {
    tokenSet = await createAccessToken({
      grant_type: 'refresh_token',
      refresh_token: tokenSet.refresh_token,
    })
  }

  return tokenSet.access_token
}

// initial auth flow
// implementation using Authentication Code Flow and PKCE
// https://developer.spotify.com/documentation/general/guides/authorization-guide/#authorization-code-flow-with-pkce
function userAuthentication(){  
  authWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    alwaysOnTop: true
  })

  // https://tools.ietf.org/html/rfc7636#section-4.1
  const code_verifier = base64url(randomBytes(96))
  const state = base64url(randomBytes(96))

  const params = new URLSearchParams({
    client_id: store.get("client_id"),
    response_type: 'code',
    redirect_uri: store.get('redirect_uri'),
    code_challenge_method: 'S256',
    code_challenge: generateCodeChallenge(code_verifier),
    state: state,
    scope: 'user-read-private user-read-email',
  })

  store.set('code_verifier', code_verifier)
  store.set('state', state)

  authWindow.loadURL(`https://accounts.spotify.com/authorize?${params}`)
  authWindow.show()

  // detect the redirect to redirect_uri; extract the code and close the window
  // also state detection to prevent CSRF
  authWindow.webContents.on("will-redirect", async (e, url) => 
  {
    const code = url.split('=')[1].split('&')[0]
    const state = url.split('&')[1].split('=')[1]
    if (store.get('state') != state) {
      throw new Error('State does not match')
    }

    authWindow.close();
    await createAccessToken({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: store.get('redirect_uri'),
      code_verifier: code_verifier,
    })
  })
}
// export for use in main.js
module.exports = {userAuthentication, logout, getAccessToken}