import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export const authOptions: NextAuthOptions = {
  // https://next-auth.js.org/configuration/providers/oauth
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      authorization: { params: {
        scope: "openid email profile https://gdata.youtube.com",
        // access_type: "offline"
      } },
    }),
  ],
  theme: {
    colorScheme: "light",
  },
  callbacks: {
    // @ts-ignore
    async jwt({token, user, account}) {
      if (!token) {
        token = {}
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      token.userRole = "admin"
      return token;
    },
    // @ts-ignore
    async session({session, token}) {
      // @ts-ignore
      session.accessToken = token.accessToken;
      return session;
    },
  },
  // callbacks: {
  //   async jwt({ token }) {
  //     token.userRole = "admin"
  //     return token
  //   },
  // },
}

export default NextAuth(authOptions)
