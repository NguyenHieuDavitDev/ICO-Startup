import { Outlet, Link, useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import Toast from "../components/Toast";

let _id = 0;

export default function PublicLayout() {
  const [toasts,     setToasts]     = useState([]);
  const [walletAddr, setWalletAddr] = useState("");
  const navigate = useNavigate();

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
      if (accounts[0]) {
        const short = `${accounts[0].slice(0,6)}...${accounts[0].slice(-4)}`;
        setWalletAddr(short);
        pushToast(`Đã kết nối: ${short}`, "success");
      }
    } catch { pushToast("Kết nối ví thất bại", "error"); }
  };

  return (
    <div className="pub-layout">
      {/* ═══ HEADER ═══ */}
      <header className="pub-header">
        <div className="pub-header-inner">
          {/* Logo */}
          <Link to="/" className="pub-logo">
            <i className="fas fa-seedling"></i>
            <span>Quỹ Startup Sinh Viên</span>
          </Link>

          {/* Nav */}
          <nav className="pub-nav d-none d-md-flex">
            <Link to="/" className="pub-nav-link">
              <i className="fas fa-home me-1"></i>Trang chủ
            </Link>
            <a href="#projects" className="pub-nav-link">
              <i className="fas fa-layer-group me-1"></i>Dự án
            </a>
            <a href="#about" className="pub-nav-link">
              <i className="fas fa-info-circle me-1"></i>Giới thiệu
            </a>
          </nav>

          {/* Right */}
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 d-none d-sm-inline-flex align-items-center gap-1">
              <span className="net-dot"></span>Sepolia
            </span>
            <button className="btn btn-sm btn-outline-primary" onClick={connectWallet}>
              <i className="fas fa-wallet me-1"></i>
              {walletAddr || "Kết nối ví"}
            </button>
            <button
              className="btn btn-sm btn-primary d-none d-md-inline-flex align-items-center gap-1"
              onClick={() => navigate("/admin")}
            >
              <i className="fas fa-lock"></i>
              <span>Quản trị</span>
            </button>
          </div>
        </div>
      </header>

      {/* ═══ MAIN ═══ */}
      <main className="pub-main">
        <Outlet context={{ pushToast, walletAddr }} />
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="pub-footer">
        <div className="pub-footer-inner">
          <div className="row g-4">
            <div className="col-md-4">
              <div className="pub-logo mb-2">
                <i className="fas fa-seedling"></i>
                <span>Quỹ Startup Sinh Viên</span>
              </div>
              <p className="text-muted mb-0" style={{ fontSize:".85rem" }}>
                Nền tảng gây quỹ &amp; bình chọn dự án khởi nghiệp sinh viên trên blockchain Ethereum.
              </p>
            </div>
            <div className="col-md-3 offset-md-1">
              <h6 className="fw-bold mb-3">Liên kết</h6>
              <ul className="list-unstyled" style={{ fontSize:".87rem" }}>
                <li><Link to="/" className="footer-link"><i className="fas fa-chevron-right me-1" style={{ fontSize:".65rem" }}></i>Trang chủ</Link></li>
                <li><a href="#projects" className="footer-link"><i className="fas fa-chevron-right me-1" style={{ fontSize:".65rem" }}></i>Danh sách dự án</a></li>
                <li><Link to="/admin" className="footer-link"><i className="fas fa-chevron-right me-1" style={{ fontSize:".65rem" }}></i>Quản trị</Link></li>
              </ul>
            </div>
            <div className="col-md-4">
              <h6 className="fw-bold mb-3">Thông tin</h6>
              <ul className="list-unstyled" style={{ fontSize:".87rem" }}>
                <li className="text-muted mb-1"><i className="fas fa-link me-2 text-primary"></i>Mạng: Sepolia Testnet</li>
                <li className="text-muted mb-1"><i className="fab fa-ethereum me-2 text-primary"></i>Smart Contract on-chain</li>
                <li className="text-muted"><i className="fas fa-shield-alt me-2 text-primary"></i>Giao dịch bảo mật qua MetaMask</li>
              </ul>
            </div>
          </div>
          <hr className="mt-4 mb-3" style={{ borderColor:"#ffffff15" }} />
          <div className="d-flex flex-wrap justify-content-between align-items-center" style={{ fontSize:".82rem" }}>
            <span className="text-muted">© 2025 Quỹ Hỗ Trợ Startup Sinh Viên. All rights reserved.</span>
            <div className="d-flex gap-3 mt-2 mt-md-0">
              <a href="#" className="footer-link"><i className="fab fa-github fa-lg"></i></a>
              <a href="#" className="footer-link"><i className="fab fa-twitter fa-lg"></i></a>
              <a href="#" className="footer-link"><i className="fab fa-discord fa-lg"></i></a>
            </div>
          </div>
        </div>
      </footer>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
