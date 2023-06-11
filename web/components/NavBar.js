import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import "../flow/config";
import styles from "../styles/Navbar.module.css";


export default function NavBar() {
    const { currentUser, logOut, logIn } = useAuth();

    return (
        <div className={styles.navbar}>
            <Link href="/">Home</Link>
            <Link href="/purchase">Purchase</Link>
            <Link href="/manage">Manage</Link>
            <button onClick={currentUser.addr ? logOut : logIn}>
                {currentUser.addr ? "Log Out" : "Log In"}
            </button>
        </div>
    );
}