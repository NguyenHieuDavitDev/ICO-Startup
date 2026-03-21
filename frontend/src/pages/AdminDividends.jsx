import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ethers } from "ethers";
import { getContract } from "../ethers";
import Dividends from "../components/Dividends";

export default function AdminDividends() {
  const { pushToast } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const initialSelectionDone = useRef(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const c = await getContract(true);
      const count = Number(await c.projectCount());
      const list = [];
      const now = Math.floor(Date.now() / 1000);

      for (let i = 0; i < count; i++) {
        const p = await c.projects(i);
        list.push({
          id: i,
          title: p.title,
          active: Boolean(p.active),
          dividendsFinalized: Boolean(p.dividendsFinalized),
          totalDonated: ethers.formatEther(p.totalDonated),
          goal: ethers.formatEther(p.goal),
          withdrawVotes: Number(p.withdrawVotes),
          iocEnd: Number(p.iocEnd),
          readyForFinalize:
            Boolean(p.active) &&
            !Boolean(p.dividendsFinalized) &&
            now > Number(p.iocEnd) &&
            Number(p.withdrawVotes) >= 1 &&
            BigInt(p.totalDonated) >= BigInt(p.goal),
        });
      }

      setRows(list);

      if (!initialSelectionDone.current && list.length > 0) {
        initialSelectionDone.current = true;
        const firstReady = list.find((r) => r.readyForFinalize);
        setSelectedId(firstReady ? firstReady.id : list[0].id);
      }
    } catch (e) {
      console.warn("Load admin dividends:", e?.message || e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) || null,
    [rows, selectedId]
  );

  return (
    <div>
      <div className="content-header">
        <div>
          <h1>
            <i className="fas fa-coins me-2 text-warning"></i>Chia cổ tức
          </h1>
          <div className="breadcrumb-wrap">
            <i className="fas fa-home me-1"></i>Admin
            <i className="fas fa-chevron-right mx-1" style={{ fontSize: ".6rem" }}></i>
            Chia cổ tức
          </div>
        </div>
        <button className="btn btn-sm btn-outline-primary" onClick={load} disabled={loading}>
          <i className="fas fa-sync-alt me-1"></i>Làm mới
        </button>
      </div>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span><i className="fas fa-list me-2 text-muted"></i>Chọn dự án</span>
              {rows.length > 0 && (
                <span className="text-muted" style={{ fontSize: ".8rem" }}>
                  {rows.filter((r) => r.readyForFinalize).length} sẵn sàng
                </span>
              )}
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-4">
                  <i className="fas fa-spinner fa-spin text-primary fa-2x" />
                </div>
              ) : rows.length === 0 ? (
                <div className="text-center py-4 text-muted">Chưa có dự án</div>
              ) : (
                <div className="list-group list-group-flush">
                  {rows.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                        selectedId === r.id ? "active" : ""
                      }`}
                      onClick={() => setSelectedId(r.id)}
                    >
                      <div className="text-truncate" style={{ maxWidth: 200 }}>
                        <div className="fw-semibold text-truncate">{r.title}</div>
                        <div style={{ fontSize: ".78rem", opacity: 0.7 }}>
                          {r.totalDonated} / {r.goal} ETH · {r.withdrawVotes} phiếu
                        </div>
                      </div>
                      <span
                        className={`badge ${
                          r.dividendsFinalized
                            ? "bg-secondary-subtle text-secondary border border-secondary-subtle"
                            : r.readyForFinalize
                            ? "bg-success-subtle text-success border border-success-subtle"
                            : "bg-warning-subtle text-warning border border-warning-subtle"
                        }`}
                      >
                        {r.dividendsFinalized
                          ? "Đã chốt"
                          : r.readyForFinalize
                          ? "Sẵn sàng"
                          : "Chưa sẵn"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          {selectedId === null ? (
            <div className="card h-100">
              <div className="card-body text-muted text-center py-5">
                <i className="fas fa-mouse-pointer fa-2x mb-3 d-block" />
                Chọn một dự án để quản lý cổ tức
              </div>
            </div>
          ) : (
            <>
              {selected && !selected.readyForFinalize && !selected.dividendsFinalized && (
                <div className="alert alert-warning d-flex gap-2 align-items-start mb-3">
                  <i className="fas fa-exclamation-triangle mt-1" />
                  <div>
                    <strong>Dự án chưa đủ điều kiện chốt cổ tức.</strong>
                    <ul className="mb-0 mt-1" style={{ paddingLeft: "1.2rem", fontSize: ".85rem" }}>
                      {!selected.active && <li>Dự án không còn active</li>}
                      {Math.floor(Date.now() / 1000) <= selected.iocEnd && (
                        <li>IOC chưa kết thúc</li>
                      )}
                      {BigInt(Math.round(Number(selected.totalDonated) * 1e18)) <
                        BigInt(Math.round(Number(selected.goal) * 1e18)) && (
                        <li>Chưa đạt mục tiêu ({selected.totalDonated}/{selected.goal} ETH)</li>
                      )}
                      {selected.withdrawVotes < 1 && (
                        <li>Chưa có phiếu giải ngân (nhà đầu tư cần vote sau khi IOC kết thúc)</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
              <Dividends projectId={selectedId} pushToast={pushToast} adminMode />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
