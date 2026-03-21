import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { getContract } from "../ethers";

function extractRevertReason(err) {
  if (!err) return "";
  if (err.code === "ACTION_REJECTED" || err.code === 4001) return "Bạn đã từ chối giao dịch";
  const reason = err?.reason || err?.info?.error?.message || err?.data?.message || "";
  if (reason) return reason;
  const m = err?.message || "";
  const match = m.match(/reverted[^"]*"([^"]+)"/);
  if (match) return match[1];
  return m.slice(0, 120);
}

export default function Dividends({ projectId, pushToast, adminMode = false }) {
  const [loading, setLoading] = useState(false);
  const [walletAddr, setWalletAddr] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [dividendsFinalized, setDividendsFinalized] = useState(false);
  const [claimableWei, setClaimableWei] = useState(0n);
  const [totalDonatedWei, setTotalDonatedWei] = useState(0n);
  const [withdrawVotes, setWithdrawVotes] = useState(0);
  const [iocEnded, setIocEnded] = useState(false);
  const [goalReached, setGoalReached] = useState(false);

  const [treasuryAddr, setTreasuryAddr] = useState("");
  const [dividendAmountEth, setDividendAmountEth] = useState("");
  const [finalizing, setFinalizing] = useState(false);

  const fmtEth = useCallback((wei) => {
    try {
      return wei > 0n ? Number(ethers.formatEther(wei)).toFixed(6).replace(/\.?0+$/, "") : "0";
    } catch {
      return "0";
    }
  }, []);

  const loadAccount = useCallback(async () => {
    try {
      if (!window.ethereum) return "";
      const acc = await window.ethereum.request({ method: "eth_accounts" });
      return acc?.[0] || "";
    } catch {
      return "";
    }
  }, []);

  const load = useCallback(async () => {
    if (projectId === null || projectId === undefined) return;
    try {
      setLoading(true);
      const c = await getContract(true);
      const p = await c.projects(projectId);

      const finalized = Boolean(p.dividendsFinalized);
      setDividendsFinalized(finalized);
      setTotalDonatedWei(BigInt(p.totalDonated));
      setWithdrawVotes(Number(p.withdrawVotes));
      setIocEnded(Math.floor(Date.now() / 1000) > Number(p.iocEnd));
      setGoalReached(BigInt(p.totalDonated) >= BigInt(p.goal));

      const addr = await loadAccount();
      setWalletAddr(addr);

      if (adminMode && addr) {
        const o = await c.owner();
        setIsOwner(addr.toLowerCase() === o.toLowerCase());
        setTreasuryAddr((prev) => prev || addr);
      }

      if (finalized && addr) {
        const claimable = BigInt(await c.getClaimableDividends(projectId, addr));
        setClaimableWei(claimable);
      } else {
        setClaimableWei(0n);
      }
    } catch (e) {
      console.warn("Load dividends:", e?.message || e);
      setClaimableWei(0n);
    } finally {
      setLoading(false);
    }
  }, [projectId, adminMode, loadAccount]);

  useEffect(() => {
    load();
  }, [load]);

  const canClaim = useMemo(
    () => dividendsFinalized && !!walletAddr && claimableWei > 0n,
    [dividendsFinalized, walletAddr, claimableWei]
  );

  const claim = async () => {
    if (!walletAddr) {
      pushToast?.("Vui lòng kết nối ví", "error");
      return;
    }
    try {
      setLoading(true);
      const c = await getContract();
      const tx = await c.claimDividends(projectId);
      await tx.wait();
      pushToast?.("Hoàn trả cổ tức thành công!", "success");
      await load();
    } catch (err) {
      const reason = extractRevertReason(err);
      const msg = reason.includes("Nothing to claim")
        ? "Bạn không có cổ tức để nhận"
        : reason || "Claim cổ tức thất bại";
      pushToast?.(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const parsedDividendWei = useMemo(() => {
    try {
      if (!dividendAmountEth || Number(dividendAmountEth) <= 0) return null;
      return ethers.parseEther(dividendAmountEth);
    } catch {
      return null;
    }
  }, [dividendAmountEth]);

  const canFinalize = useMemo(() => {
    if (!adminMode || !isOwner || dividendsFinalized || !walletAddr || !treasuryAddr) return false;
    if (!parsedDividendWei) return false;
    return BigInt(parsedDividendWei) > 0n && BigInt(parsedDividendWei) <= totalDonatedWei;
  }, [adminMode, isOwner, dividendsFinalized, walletAddr, treasuryAddr, parsedDividendWei, totalDonatedWei]);

  const finalize = async () => {
    if (!canFinalize) return;
    try {
      setFinalizing(true);
      setLoading(true);
      const c = await getContract();
      const tx = await c.finalizeDividends(projectId, treasuryAddr, parsedDividendWei);
      await tx.wait();
      pushToast?.("Đã chốt cổ tức, nhà đầu tư có thể nhận!", "success");
      setDividendAmountEth("");
      await load();
    } catch (err) {
      const reason = extractRevertReason(err);
      const msg = reason.includes("Invalid dividend amount") || reason.includes("No dividends")
        ? "Số tiền cổ tức không hợp lệ (phải > 0 và ≤ tổng đã donate)"
        : reason.includes("Not enough votes")
        ? "Chưa đủ phiếu giải ngân"
        : reason.includes("Goal not reached")
        ? "Dự án chưa đạt mục tiêu gọi vốn"
        : reason.includes("IOC not ended")
        ? "IOC chưa kết thúc"
        : reason || "Chốt cổ tức thất bại";
      pushToast?.(msg, "error");
    } finally {
      setFinalizing(false);
      setLoading(false);
    }
  };

  const maxDividendEth = totalDonatedWei > 0n ? ethers.formatEther(totalDonatedWei) : "0";
  const treasuryAmountEth =
    parsedDividendWei && totalDonatedWei > 0n
      ? fmtEth(totalDonatedWei - BigInt(parsedDividendWei < totalDonatedWei ? parsedDividendWei : totalDonatedWei))
      : "—";

  return (
    <div className="card h-100">
      <div className="card-header">
        <i className="fas fa-coins me-2 text-warning"></i>Hoàn trả cổ tức
      </div>
      <div className="card-body">

        {adminMode && (
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-2">
                <i className="fas fa-gavel me-1" />Admin chốt cổ tức
              </span>
              <span className="text-muted" style={{ fontSize: ".82rem" }}>
                {isOwner ? (
                  <><i className="fas fa-check-circle text-success me-1" />Bạn là owner</>
                ) : (
                  <><i className="fas fa-lock text-danger me-1" />Chỉ owner mới chốt được</>
                )}
              </span>
            </div>

            {!dividendsFinalized && (
              <div className="d-flex gap-3 mb-3 flex-wrap">
                <span className={`badge ${iocEnded ? "bg-success-subtle text-success border border-success-subtle" : "bg-secondary-subtle text-secondary border border-secondary-subtle"}`}>
                  <i className={`fas ${iocEnded ? "fa-check" : "fa-clock"} me-1`} />
                  IOC {iocEnded ? "đã kết thúc" : "chưa kết thúc"}
                </span>
                <span className={`badge ${goalReached ? "bg-success-subtle text-success border border-success-subtle" : "bg-secondary-subtle text-secondary border border-secondary-subtle"}`}>
                  <i className={`fas ${goalReached ? "fa-check" : "fa-times"} me-1`} />
                  Mục tiêu {goalReached ? "đạt" : "chưa đạt"}
                </span>
                <span className={`badge ${withdrawVotes >= 1 ? "bg-success-subtle text-success border border-success-subtle" : "bg-secondary-subtle text-secondary border border-secondary-subtle"}`}>
                  <i className="fas fa-vote-yea me-1" />
                  {withdrawVotes} phiếu giải ngân
                </span>
              </div>
            )}

            {!dividendsFinalized && (
              <div className="row g-2">
                <div className="col-12">
                  <label className="form-label fw-semibold mb-1">Treasury address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={treasuryAddr}
                    onChange={(e) => setTreasuryAddr(e.target.value)}
                    placeholder="0x... (địa chỉ nhận phần treasury)"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold mb-1">
                    Số tiền cổ tức (ETH)
                    <span className="text-muted fw-normal ms-2" style={{ fontSize: ".8rem" }}>
                      tối đa {maxDividendEth} ETH
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    className="form-control"
                    value={dividendAmountEth}
                    onChange={(e) => setDividendAmountEth(e.target.value)}
                    placeholder={`0 → ${maxDividendEth}`}
                  />
                  {parsedDividendWei && totalDonatedWei > 0n && (
                    <div className="text-muted mt-1" style={{ fontSize: ".8rem" }}>
                      Treasury nhận: <strong>{treasuryAmountEth} ETH</strong> · Nhà đầu tư nhận: <strong>{dividendAmountEth} ETH</strong>
                    </div>
                  )}
                </div>

                <div className="col-12">
                  <button
                    className="btn btn-warning w-100"
                    disabled={!canFinalize || finalizing || loading}
                    onClick={finalize}
                  >
                    {finalizing ? (
                      <><i className="fas fa-spinner fa-spin me-2" />Đang chốt...</>
                    ) : (
                      <><i className="fas fa-gavel me-2" />Chốt cổ tức</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {dividendsFinalized && (
              <div className="alert alert-success py-2 mb-0">
                <i className="fas fa-check-circle me-2" />Cổ tức đã được chốt thành công.
              </div>
            )}

            <hr className="my-3" />
          </div>
        )}

        <p className="text-muted mb-3" style={{ fontSize: ".85rem" }}>
          {dividendsFinalized
            ? "Cổ tức đã được chốt. Bạn có thể nhận phần của mình."
            : "Chờ cho đến khi dự án đạt điều kiện và cổ tức được chốt."}
        </p>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="text-muted">Cổ tức có thể nhận</span>
          <span className="fw-bold text-success fs-6">{fmtEth(claimableWei)} ETH</span>
        </div>

        {!walletAddr && (
          <div className="text-center text-muted mb-3" style={{ fontSize: ".85rem" }}>
            <i className="fas fa-wallet me-1" />Kết nối ví để xem phần cổ tức của bạn.
          </div>
        )}

        <button
          className="btn btn-success w-100"
          disabled={!canClaim || loading}
          onClick={claim}
        >
          {loading && !finalizing ? (
            <><i className="fas fa-spinner fa-spin me-2"></i>Đang xử lý...</>
          ) : (
            <><i className="fas fa-hand-holding-usd me-2"></i>Nhận cổ tức</>
          )}
        </button>
      </div>
    </div>
  );
}
