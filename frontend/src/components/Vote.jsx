import { getContract } from "../ethers";
import { useState } from "react";

export default function Vote({ projectId, pushToast }) {
  const [loading, setLoading] = useState(false);

  const vote = async (type) => {
    try {
      setLoading(true);
      const c  = await getContract();
      const tx = type === "trust"
        ? await c.voteTrust(projectId)
        : await c.voteWithdraw(projectId);
      await tx.wait();
      if (pushToast) pushToast(
        type === "trust" ? "Đã vote tín nhiệm thành công!" : "Đã vote giải ngân thành công!",
        "success"
      );
    } catch (err) {
      const m = err?.message || "";
      const msg = m.includes("MetaMask")
        ? "Vui lòng cài MetaMask"
        : m.includes("Already voted")
        ? "Bạn đã vote cho dự án này rồi"
        : m.includes("user rejected") || m.includes("ACTION_REJECTED")
        ? "Giao dịch đã bị huỷ"
        : "Vote thất bại";
      if (pushToast) pushToast(msg, "error"); else alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card h-100">
      <div className="card-header">
        <i className="fas fa-poll me-2 text-info"></i>Vote cộng đồng
      </div>
      <div className="card-body d-flex flex-column">
        <p className="text-muted mb-3" style={{ fontSize: ".85rem" }}>
          <i className="fas fa-info-circle me-1"></i>
          Mỗi ví chỉ được vote 1 lần cho mỗi loại.
        </p>

        <div className="d-grid gap-3 mt-auto">
          <button
            className="btn btn-success"
            disabled={loading}
            onClick={() => vote("trust")}
          >
            <i className="fas fa-thumbs-up me-2"></i>
            Vote tín nhiệm
          </button>
          <button
            className="btn btn-outline-danger"
            disabled={loading}
            onClick={() => vote("withdraw")}
          >
            <i className="fas fa-money-bill-wave me-2"></i>
            Vote giải ngân
          </button>
        </div>

        {loading && (
          <div className="text-center mt-3 text-muted" style={{ fontSize: ".82rem" }}>
            <i className="fas fa-spinner fa-spin me-1"></i>Đang xử lý giao dịch...
          </div>
        )}
      </div>
    </div>
  );
}
