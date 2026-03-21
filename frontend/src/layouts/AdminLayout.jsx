import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useState, useCallback, useEffect, useRef } from "react";
import Toast from "../components/Toast";

let _id = 0;

const SIDEBAR_NAV = [
  { to: "/admin",          icon: "fa-tachometer-alt", label: "Tổng quan",     end: true },
  { to: "/admin/projects", icon: "fa-folder-open",    label: "Quản lý dự án", end: false },
  { to: "/admin/dividends", icon: "fa-coins",         label: "Chia cổ tức",    end: false },
];

export default function AdminLayout() {
  const [toasts,     setToasts]     = useState([]);
  const [walletAddr, setWalletAddr] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const isConnectedRef = useRef(false);
  const navigate = useNavigate();

  const formatAddr = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  const pushToast = useCallback((message, type = "info") => {
    const id = ++_id;
    setToasts((p) => [...p, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) { pushToast("Vui lòng cài MetaMask", "error"); return; }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const a = accounts?.[0] || "";
      if (!a) return;
      isConnectedRef.current = true;
      setIsConnected(true);
      const short = formatAddr(a);
      setWalletAddr(short);
      pushToast(`Đã kết nối: ${short}`, "success");
    } catch { pushToast("Kết nối ví thất bại", "error"); }
  };

  const disconnectWallet = () => {
    isConnectedRef.current = false;
    setIsConnected(false);
    setWalletAddr("");
    pushToast("Đã ngắt kết nối", "info");
  };

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (!isConnectedRef.current) return;
      const a = accounts?.[0] || "";
      setWalletAddr(formatAddr(a));
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        const a = accounts?.[0] || "";
        if (!a) return;
        isConnectedRef.current = true;
        setIsConnected(true);
        setWalletAddr(formatAddr(a));
      })
      .catch(() => {});

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  return (
    <div>
      {/* ═══ SIDEBAR ═══ */}
      <aside className="sidebar">
        <Link to="/admin" className="sidebar-logo" style={{ textDecoration:"none" }}>
          <i className="fas fa-seedling"></i>
          <span>Quỹ Startup</span>
        </Link>

        <div className="sidebar-section">Quản lý</div>
        {SIDEBAR_NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `sidebar-item${isActive ? " active" : ""}`
            }
          >
            <i className={`fas ${n.icon}`}></i>
            <span>{n.label}</span>
          </NavLink>
        ))}

        <div style={{ marginTop:"auto" }}>
          <div className="sidebar-section">Điều hướng</div>
          <div className="sidebar-item" onClick={() => navigate("/")}>
            <i className="fas fa-globe"></i>
            <span>Về trang chủ</span>
          </div>
          <div className="sidebar-item" onClick={() => navigate("/my-dividends")}>
            <i className="fas fa-coins"></i>
            <span>Cổ tức của tôi</span>
          </div>
          <div
            className="sidebar-item"
            onClick={isConnected ? disconnectWallet : connectWallet}
          >
            <i className={`fas ${isConnected ? "fa-right-from-bracket" : "fa-wallet"}`}></i>
            <span style={{ fontSize:".82rem" }}>
              {isConnected ? "Ngắt kết nối" : (walletAddr || "Kết nối ví")}
            </span>
          </div>
        </div>
      </aside>

      {/* ═══ TOPBAR ═══ */}
      <header className="topbar">
        <span className="topbar-brand d-none d-md-block">
          <i className="fas fa-rocket me-2 text-primary"></i>
          Quỹ Hỗ Trợ Startup Sinh Viên — Admin
        </span>
        <div className="ms-auto d-flex align-items-center gap-2">
          <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">
            <i className="fas fa-user-shield me-1"></i>Admin
          </span>
          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 d-none d-sm-inline-flex align-items-center gap-1">
            <span className="net-dot"></span>Sepolia
          </span>
          {isConnected ? (
            <button className="btn btn-sm btn-outline-danger" onClick={disconnectWallet}>
              <i className="fas fa-right-from-bracket me-1"></i>
              Ngắt kết nối
            </button>
          ) : (
            <button className="btn btn-sm btn-outline-primary" onClick={connectWallet}>
              <i className="fas fa-wallet me-1"></i>
              {walletAddr || "Kết nối ví"}
            </button>
          )}
        </div>
      </header>

      {/* ═══ MAIN ═══ */}
      <main className="main-content">
        <Outlet context={{ pushToast, walletAddr }} />
      </main>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
