import browser from 'webextension-polyfill'
import CryptoJS from 'crypto-js'

export const signIn = (identityURL: string, clientID: string): null => {
  browser.runtime.sendMessage({
    action: 'sign-in',
    details: {
      identityURL: identityURL,
      clientID: clientID
    }
  })
}

export const signOut = (): null => {
  browser.runtime.sendMessage({
    action: 'sign-out'
  })
}

export const getUser = async (): { me: string, profile: string, code: string,
  accessToken: string, expiresIn: string, refreshToken: string } => {
  return await browser.storage.local.get([
    'me', 'profile', 'endpoints', 'code', 'accessToken', 'expiresIn', 'refreshToken'
  ])
}

let stateCheckerSignIn
let stateCheckerSignOut

async function checkStateSignIn () {
  const user = await getUser()
  if (Object.keys(user).length) {
    window.postSignIn(user)
    clearInterval(stateCheckerSignIn)
  }
}

async function checkStateSignOut () {
  const user = await getUser()
  if (Object.keys(user).length === 0) {
    window.postSignOut(user)
    clearInterval(stateCheckerSignOut)
  }
}

if (window.location.pathname === '/_generated_background_page.html') {
  browser.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'sign-in') {
      _signIn(msg.details.identityURL, msg.details.clientID)
      stateCheckerSignIn = setInterval(checkStateSignIn, 250)
    } else if (msg.action === 'sign-out') {
      _signOut()
      stateCheckerSignOut = setInterval(checkStateSignOut, 250)
    }
  })
}

const _signIn = (identityURL, clientID) => {
  const state = generateCode(16)
  const codeVerifier = generateCode(128)
  const scopes = ['create', 'draft', 'update', 'delete', 'media', 'profile', 'email']
  let endpoints
  let redirectURL

  fetch(identityURL).then((response) => {
    if (response.status !== 200) {
      console.log("couldn't resolve identity URL")
      return
    }
    response.text().then((text) => {
      const doc = parse(text, identityURL)
      endpoints = {
        authorization: getRel(doc, 'authorization_endpoint'),
        token: getRel(doc, 'token_endpoint'),
        ticket: getRel(doc, 'ticket_endpoint'),
        micropub: getRel(doc, 'micropub'),
        microsub: getRel(doc, 'microsub'),
        webmention: getRel(doc, 'webmention')
      }
      redirectURL = browser.identity.getRedirectURL() // *.allizom.org
      const challenge = CryptoJS.SHA256(codeVerifier).toString(CryptoJS.enc.Base64)
        .replace(/\+/g, '-').replace(/\//g, '_').replace('=', '')
      const authURL = endpoints.authorization +
        '?response_type=code' +
        `&client_id=${clientID}` +
        `&redirect_uri=${redirectURL}` +
        `&state=${state}` +
        `&code_challenge=${challenge}` +
        '&code_challenge_method=S256' +
        `&scope=${encodeURIComponent(scopes.join(' '))}` +
        `&me=${identityURL}`
      browser.identity.launchWebAuthFlow({
        interactive: true,
        url: authURL
      }).then(validate).catch(err => {
        console.error('error during WebAuthFlow', err)
      })
    })
  })

  const validate = (validationURL) => {
    const url = new URL(validationURL)
    if (url.searchParams.get('state') !== state) {
      console.log('state mismatch')
      return
    }
    const code = url.searchParams.get('code')
    fetch(endpoints.token, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=authorization_code&code=${code}&client_id=${clientID}&` +
        `redirect_uri=${redirectURL}&code_verifier=${codeVerifier}`
    }).then((response) => {
      if (response.status !== 200) {
        console.log("couldn't validate authorization")
        return
      }
      response.json().then((json) => {
        browser.storage.local.set({
          me: identityURL,
          profile: json.profile,
          endpoints: endpoints,
          code: code,
          accessToken: json.access_token,
          expiresIn: '',
          refreshToken: ''
        })
      })
    })
  }
}

const _signOut = async () => {
  const user = await getUser()
  fetch(user.endpoints.token, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: `action=revoke&token=${user.accessToken}`
  }).then((response) => {
    if (response.status !== 200) {
      console.log("couldn't sign you out")
      return
    }
    browser.storage.local.clear()
  })
}

const parse = (html, baseURL) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  if (baseURL) {
    const base = document.createElement('base')
    base.href = baseURL
    doc.querySelector('head').append(base)
  }
  return doc
}

const getRel = (doc, rel) => {
  const link = doc.querySelector(`link[rel=${rel}]`)
  if (link) {
    return link.href
  }
}

const generateCode = (length) => {
  const chars = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefg' +
                    'hijklmnopqrstuvwxyz0123456789-._~']
  let code = ''
  for (let i = 0; i < length; i++) {
    const randomInt = crypto.getRandomValues(new Uint32Array(1))[0]
    code += chars[Math.floor(randomInt / 2 ** 32 * chars.length)]
  }
  return code
}
