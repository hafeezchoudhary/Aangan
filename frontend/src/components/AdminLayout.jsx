
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AdminLayout() {
    return (
        <div className="min-h-screen bg-[#f8f6f0] md:flex">
            <Sidebar />
            <div className="min-w-0 flex-1">
                <Outlet />
            </div>
        </div>
    );
}
