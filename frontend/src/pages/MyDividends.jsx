import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { getContract } from "../ethers";

function fmtEth(wei) {
  try {
    return wei > 0n
      ? Number(ethers.formatEther(wei)).toFixed(6).replace(/\.?0+$/, "")
      : "0";
  } catch {
    return "0";
  }
}

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

export default function MyDividends() {
  const { pushToast, walletAddr } = useOutletContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [fullAddr, setFullAddr] = useState("");
  const [claimingId, setClaimingId] = useState(null);

  const loadAccount = useCallback(async () => {
    try {
      if (!window.ethereum) return "";
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      return accounts?.[0] || "";
    } catch {
      return "";
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const addr = await loadAccount();
      setFullAddr(addr);
      if (!addr) {
        setRows([]);
        return;
      }

      const c = await getContract(true);
      const count = Number(await c.projectCount());
      const list = [];

      for (let i = 0; i < count; i++) {
        const p = await c.projects(i);
        if (!Boolean(p.dividendsFinalized)) continue;

        const claimable = BigInt(await c.getClaimableDividends(i, addr));
        if (claimable <= 0n) continue;

        list.push({
          projectId: i,
          title: p.title,
          claimableWei: claimable,
        });
      }

      setRows(list);
    } catch (e) {
      console.warn("Load my dividends:", e?.message || e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [loadAccount]);

  useEffect(() => {
    load();
  }, [load, walletAddr]);

  const totalClaimable = useMemo(
    () => rows.reduce((s, r) => s + r.claimableWei, 0n),
    [rows]
  );

  const claimOne = async (projectId) => {
    if (!window.ethereum) {
      pushToast?.("Vui lòng cài MetaMask", "error");
      return;
    }
    if (!fullAddr) {
      pushToast?.("Bạn cần kết nối ví để nhận cổ tức", "error");
      return;
    }
    try {
      setClaimingId(projectId);
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
      setClaimingId(null);
    }
  };

  return (
    <div className="content-header">
      <div style={{ width: "100%" }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
          <div>
            <h1><i className="fas fa-coins me-2 text-warning" />Cổ tức của tôi</h1>
            <div className="breadcrumb-wrap">
              <i className="fas fa-home me-1" />
              Cổ tức của tôi
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            {rows.length > 0 && (
              <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2">
                <i className="fas fa-coins me-1" />
                Tổng có thể nhận: {fmtEth(totalClaimable)} ETH
              </span>
            )}
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={load}
              disabled={loading}
            >
              <i className={`fas fa-sync-alt me-1 ${loading ? "fa-spin" : ""}`} />
              Làm mới
            </button>
          </div>
        </div>

        {!window.ethereum && (
          <div className="alert alert-warning">
            <i className="fas fa-exclamation-triangle me-2" />
            Vui lòng cài MetaMask để nhận cổ tức.
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <i className="fas fa-spinner fa-spin fa-2x text-primary" />
            <p className="mt-2 text-muted">Đang tải cổ tức...</p>
          </div>
        ) : !fullAddr ? (
          <div className="card">
            <div className="card-body text-center py-5">
              <i className="fas fa-wallet fa-3x text-muted mb-3 d-block" />
              <p className="text-muted mb-3">Kết nối ví để xem cổ tức của bạn.</p>
              <button
                className="btn btn-primary"
                onClick={() => pushToast?.("Hãy bấm Kết nối ví ở header trước", "info")}
              >
                <i className="fas fa-wallet me-2" />Kết nối ví
              </button>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-5">
              <i className="fas fa-inbox fa-3x text-muted mb-3 d-block" />
              <p className="text-muted mb-3">Chưa có cổ tức để nhận.</p>
              <button className="btn btn-primary" onClick={() => navigate("/")}>
                <i className="fas fa-search me-2" />Xem dự án
              </button>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body p-0">
              <table className="table mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Dự án</th>
                    <th style={{ width: 200 }}>Cổ tức có thể nhận</th>
                    <th style={{ width: 160 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.projectId}>
                      <td>
                        <div className="fw-semibold text-truncate" style={{ maxWidth: 360 }}>
                          {r.title}
                        </div>
                        <div className="text-muted" style={{ fontSize: ".8rem" }}>
                          Project #{r.projectId + 1}
                        </div>
                      </td>
                      <td>
                        <span className="fw-bold text-success">{fmtEth(r.claimableWei)} ETH</span>
                      </td>
                      <td>
                        <button
                          className="btn btn-success btn-sm w-100"
                          onClick={() => claimOne(r.projectId)}
                          disabled={claimingId !== null}
                        >
                          {claimingId === r.projectId ? (
                            <><i className="fas fa-spinner fa-spin me-1" />Đang nhận...</>
                          ) : (
                            <><i className="fas fa-hand-holding-usd me-1" />Nhận cổ tức</>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
