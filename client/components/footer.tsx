import Link from "next/link"
import styles from "./footer.module.css"
import packageJSON from "../package.json"

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <ul className={styles.navItems}>
        {/* <li className={styles.navItem}>
          <a href="https://next-auth.js.org">Documentation</a>
        </li> */}
        <li className={styles.navItem}>
          <Link href="https://web3.storage/" target="_blank">Powered by Web3</Link>
        </li>
        <li className={styles.navItem}>
          BeeFree v{packageJSON.version}
        </li>
      </ul>
    </footer>
  )
}
