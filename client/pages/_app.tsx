import { SessionProvider } from "next-auth/react"
import "./styles.css"

import type { AppProps } from "next/app"
import type { Session } from "next-auth"
import Head from "next/head"

// Use of the <SessionProvider> is mandatory to allow components that call
// `useSession()` anywhere in your application to access the `session` object.
export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<{ session: Session }>) {
  return (<>
    <Head>
      <title>BEEFREE</title>
      <link rel="shortcut icon" href="/static/favicon.ico" />
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap" rel="stylesheet" />
    </Head>
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
    </>)
}
