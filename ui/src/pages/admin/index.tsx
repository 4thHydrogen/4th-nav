import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, LayoutGrid, LogOut, Package, Search, Settings, Star } from "lucide-react";
import { Sidebar, type MenuItem } from "./components/sidebar";
import "./index.css";
import { useOnce } from "../../utils/useOnce";

const menuItems: MenuItem[] = [
  {
    key: "tools",
    icon: <Package className="w-5 h-5" />,
    label: "工具管理",
    path: "/admin/tools",
  },
  {
    key: "categories",
    icon: <LayoutGrid className="w-5 h-5" />,
    label: "分类管理",
    path: "/admin/categories",
  },
  {
    key: "search-engines",
    icon: <Search className="w-5 h-5" />,
    label: "搜索引擎管理",
    path: "/admin/search-engines",
  },
  {
    key: "api-token",
    icon: <Star className="w-5 h-5" />,
    label: "API Token",
    path: "/admin/api-token",
  },
  {
    key: "settings",
    icon: <Settings className="w-5 h-5" />,
    label: "系统设置",
    path: "/admin/settings",
  },
];

export const AdminPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentKey, setCurrentKey] = useState("tools");

  useOnce(() => {
    if (!localStorage.getItem("_token")) {
      navigate("/login");
    }
  }, []);

  useEffect(() => {
    const pathname = location.pathname;
    const currentItem = menuItems.find((item) => pathname.includes(item.key));
    if (currentItem) {
      setCurrentKey(currentItem.key);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("_token");
    navigate("/");
  };

  return (
    <div className="admin-page min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">4th Nav 管理系统</h1>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900">
                <Home size={16} className="mr-2" />
                返回首页
              </Link>
              <button onClick={handleLogout} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900">
                <LogOut size={16} className="mr-2" />
                退出登录
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 w-full mx-auto h-[calc(100vh-64px)]">
        <Sidebar items={menuItems} currentKey={currentKey} onChange={setCurrentKey} />
        <main className="flex-1 overflow-auto">
          <div className="p-4 h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
