import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './AdminLayout.module.css';

interface AdminLayoutProps {
    children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
    return (
        <div className={styles.adminLayout}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h2>Admin Panel</h2>
                </div>
                <nav className={styles.navLinks}>
                    <NavLink
                        to="/admin"
                        end
                        className={({ isActive }) => isActive ? styles.activeLink : styles.link}
                    >
                        Dashboard
                    </NavLink>
                    <NavLink
                        to="/admin/users"
                        className={({ isActive }) => isActive ? styles.activeLink : styles.link}
                    >
                        Users
                    </NavLink>
                    <NavLink
                        to="/admin/auctions"
                        className={({ isActive }) => isActive ? styles.activeLink : styles.link}
                    >
                        Auctions
                    </NavLink>
                </nav>
            </aside>
            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
};
