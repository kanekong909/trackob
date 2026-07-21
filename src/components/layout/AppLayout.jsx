import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import MobileTopBar from './MobileTopBar';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.content}>
        <MobileTopBar />
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
