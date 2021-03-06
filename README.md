# WebExtension-IndieAuth

This package leverages the WebExtensions [`identity` API][0] and
[IndieAuth][1] to sign the user in to a browser extension and optionally
acquire an access token for future [Micropub][2] and [Microsub][3] requests.

    npm install webextension-indieauth

## Usage

You **must** include the following in a `background` context:

    require("webextension-indieauth")

Call the following from any context (eg. popup, sidebar, ..):

    const indieauth = requires("webextension-indieauth")
    indieauth.signIn("exampleuser.com", "exampleclient.com")
    indieauth.signOut()

Access user data from any context:

    const userData = await indieauth.getUser()

It is stored in the following format:

    {
      me: "https://exampleuser.com",
      profile: {
        name: "Example User",
        email: "example@exampleuser.com"
      },
      endpoints: {
        authorization: "https://exampleuser.com/auth",
        token: "https://exampleuser.com/auth/tokens",
        ticket: "https://exampleuser.com/auth/tickets",
        micropub: "https://exampleuser.com/pub",
        microsub: "https://exampleuser.com/sub",
        webmention: "https://exampleuser.com/mentions"
      },
      code: "hf904hkfx049fkhx943ufh3094ux09ufhnhfhf",
      accessToken: "secret-token:c9q8jif4l34h",
      refreshToken: "secret-token:er8j3cj49f4e"
    }

[0]: //developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/identity
[1]: //indieauth.spec.indieweb.org
[2]: //micropub.spec.indieweb.org
[3]: //indieweb.org/Microsub-spec
