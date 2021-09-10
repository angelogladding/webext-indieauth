# WebExtension-IndieAuth
WebExtension support for IndieAuth sign-in

This package leverages the WebExtensions [`identity` API][0] and
[IndieAuth][1] to sign the user in to a browser extension and optionally
acquire an access token for future [Micropub][2] and [Microsub][3] requests.

    npm install webextension-indieauth

## Usage

You must include the following in a background context:

    require("webextension-indieauth")

Then you can call the following from any context (eg. popup, sidebar, ..):

    const { signIn, signOut } = requires("webextension-indieauth")
    signIn("exampleuser.com", "exampleclient.com");  // acquire auth
    signOut();  // revoke auth

### User Data

User data is stored in the following format:

    {
      me: "https://exampleuser.com",
      profile: {
        name: "Example User",
        email: "example@exampleuser.com"
      },
      endpoints: {
        authorization: "https://exampleuser.com/auth",
        token: "https://exampleuser.com/token",
        micropub: "https://exampleuser.com/micropub",
        microsub: "https://exampleuser.com/microsub",
        webmention: "https://exampleuser.com/webmention"
      },
      code: "hf904hkfx049fkhx943ufh3094ux09ufhnhfhf",
      accessToken: "c9q8jif4l34h",
      refreshToken: "er8j3cj49f4e"
    }

Access via the `storage` API:

    browser.storage.local.get(["me", "endpoints"]).then(db => {
        console.log(db.me, db.endpoints)
    });

[0]: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/identity
[1]: https://indieauth.spec.indieweb.org
[2]: https://micropub.spec.indieweb.org
[3]: https://indieweb.org/Microsub-spec
