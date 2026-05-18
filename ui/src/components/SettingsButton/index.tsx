import { Settings } from "lucide-react";
import "./index.css";

const SettingsButton = () => (
  <a
    href="/admin"
    className="settings-button"
    title="管理后台"
    aria-label="管理后台"
  >
    <Settings size={18} />
  </a>
);

export default SettingsButton;
