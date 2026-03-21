import { ethers } from "ethers";
import { getContract } from "../ethers";
import { useCallback, useEffect, useState } from "react";

function extractRevertReason(err) {
  if (!err) return "";
  if (err.code === "ACTION_REJECTED" || err.code === 4001) return "user_rejected";
  const reason = err?.reason || err?.info?.error?.message || err?.data?.message || "";
  if (reason) return reason;
  const m = err?.message || "";
  const match = m.match(/reverted[^"]*"([^"]+)"/);
  if (match) return match[1];
  return m.slice(0, 200);
}

export default function Donate({ projectId, pushToast }) {
  const [amount,    setAmount]    = useState("");
  const [loading,   setLoading]   = useState(false);
  const [fetching,  setFetching]  = useState(true);
  const [iocStart,  setIocStart]  = useState(0);
  const [iocEnd,    setIocEnd]    = useState(0);
  const [active,    setActive]    = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [myDonated, setMyDonated] = useState(0n);
  const [walletAddr, setWalletAddr] = useState("");

  const loadAccount = useCallback(async () => {
    try {
      if (!window.ethereum) return "";
      const acc = await window.ethereum.request({ method: "eth_accounts" });
      return acc?.[0] || "";
    } catch { return ""; }
  }, []);

  const load = useCallback(async () => {
    if (projectId === null || projectId === undefined) return;
    try {
      setFetching(true);
      const c    = await getContract(true);
      const p    = await c.projects(projectId);
      const addr = await loadAccount();
      setIocStart(Number(p.iocStart));
      setIocEnd(Number(p.iocEnd));
      setActive(Boolean(p.active));
      setFinalized(Boolean(p.dividendsFinalized));
      setWalletAddr(addr);
      if (addr) {
        const d = await c.donatedByUser(projectId, addr);
        setMyDonated(BigInt(d));
      }
    } catch (e) {
      console.warn("Donate load:", e?.message || e);
    } finally {
      setFetching(false);
    }
  }, [projectId, loadAccount]);

  useEffect(() => { load(); }, [load]);

  const now   = Math.floor(Date.now() / 1000);
  const inIOC = now >= iocStart && now <= iocEnd;
  const canDonate = active && !finalized && inIOC;

  const donate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      pushToast?.("Nhập số ETH hợp lệ", "error");
      return;
    }
    if (!walletAddr) {
      pushToast?.("Vui lòng kết nối ví trước", "error");
      return;
    }
    try {
      setLoading(true);
      const c  = await getContract();
      const tx = await c.donate(projectId, { value: ethers.parseEther(amount) });
      await tx.wait();
      pushToast?.("Ủng hộ thành công!", "success");
      setAmount("");
      await load();
    } catch (err) {
      const r = extractRevertReason(err);
      let msg;
      if      (r === "user_rejected")        msg = "Giao dịch đã bị huỷ";
      else if (r.includes("Not in IOC"))     msg = "Ngoài thời gian gọi vốn IOC";
      else if (r.includes("inactive"))       msg = "Dự án không còn hoạt động";
      else if (r.includes("finalized"))      msg = "Cổ tức đã được chốt, không còn nhận donate";
      else if (r.includes("Amount must"))    msg = "Số tiền phải lớn hơn 0";
      else                                   msg = r || "Ủng hộ thất bại";
      pushToast?.(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card h-100">
      <div className="card-header d-flex justify-content-between align-items-center">
        <span><i className="fas fa-hand-holding-usd me-2 text-success"></i>Ủng hộ dự án</span>
        {!fetching && myDonated > 0n && (
          <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: ".75rem" }}>
            Bạn đã donate: {Number(ethers.formatEther(myDonated)).toFixed(4)} ETH
          </span>
        )}
      </div>
      <div className="card-body d-flex flex-column">
        {fetching ? (
          <div className="text-center py-3 text-muted">
            <i className="fas fa-spinner fa-spin me-1" /> Đang tải...
          </div>
        ) : (
          <>
            {!canDonate && (
              <div className={`alert py-2 mb-3 ${
                finalized ? "alert-secondary" :
                !active   ? "alert-danger"    :
                !inIOC    ? "alert-warning"   : "alert-info"
              }`} style={{ fontSize: ".83rem" }}>
                <i className="fas fa-info-circle me-1" />
                {finalized  ? "Cổ tức đã chốt, dự án không còn nhận donate." :
                 !active    ? "Dự án hiện không hoạt động." :
                 now < iocStart ? "Chưa đến thời gian gọi vốn IOC." :
                                  "Thời gian gọi vốn IOC đã kết thúc."}
              </div>
            )}

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
                disabled={!canDonate || loading}
              />
              <span className="input-group-text">ETH</span>
            </div>

            <button
              className="btn btn-success w-100 mt-auto"
              onClick={donate}
              disabled={loading || !amount || !canDonate || !walletAddr}
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin me-2"></i>Đang gửi...</>
              ) : (
                <><i className="fas fa-heart me-2"></i>Donate ngay</>
              )}
            </button>

            {!walletAddr && (
              <div className="text-center text-muted mt-2" style={{ fontSize: ".78rem" }}>
                <i className="fas fa-wallet me-1" />Kết nối ví để donate.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
