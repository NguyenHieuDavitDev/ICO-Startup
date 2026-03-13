import { ethers } from "ethers";
import { getContract } from "../ethers";
import { useState } from "react";

export default function Donate({ projectId, pushToast }) {
  const [amount,  setAmount]  = useState("");
  const [loading, setLoading] = useState(false);

  const donate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      if (pushToast) pushToast("Nhập số ETH hợp lệ", "error");
      return;
    }
    try {
      setLoading(true);
      const c = await getContract();
      const tx = await c.donate(projectId, { value: ethers.parseEther(amount) });
      await tx.wait();
      if (pushToast) pushToast("Ủng hộ thành công!", "success");
      setAmount("");
    } catch (err) {
      const m = err?.message || "";
      const msg = m.includes("MetaMask")
        ? "Vui lòng cài MetaMask"
        : m.includes("Not in IOC time")
        ? "Ngoài thời gian gọi vốn IOC"
        : m.includes("user rejected") || m.includes("ACTION_REJECTED")
        ? "Giao dịch đã bị huỷ"
        : "Ủng hộ thất bại";
      if (pushToast) pushToast(msg, "error"); else alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card h-100">
      <div className="card-header">
        <i className="fas fa-hand-holding-usd me-2 text-success"></i>Ủng hộ dự án
      </div>
      <div className="card-body">
        <p className="text-muted mb-3" style={{ fontSize: ".85rem" }}>
          <i className="fas fa-info-circle me-1"></i>
          Góp vốn ETH cho dự án trong thời gian IOC.
        </p>
        <label className="form-label fw-semibold">Số ETH muốn ủng hộ</label>
        <div className="input-group mb-3">
          <span className="input-group-text">
            <i className="fab fa-ethereum text-primary"></i>
          </span>
          <input
            type="number"
            min="0"
            step="0.001"
            className="form-control"
            placeholder="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <span className="input-group-text">ETH</span>
        </div>
        <button
          className="btn btn-success w-100"
          onClick={donate}
          disabled={loading || !amount}
        >
          {loading ? (
            <><i className="fas fa-spinner fa-spin me-2"></i>Đang gửi...</>
          ) : (
            <><i className="fas fa-heart me-2"></i>Donate ngay</>
          )}
        </button>
      </div>
    </div>
  );
}
