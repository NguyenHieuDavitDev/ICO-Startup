import { useCallback, useEffect, useState } from "react";
import { getContract } from "../ethers";

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

export default function Vote({ projectId, pushToast }) {
  const [loadingTrust,    setLoadingTrust]    = useState(false);
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);
  const [fetching,        setFetching]        = useState(true);

  // Trạng thái project
  const [active,             setActive]             = useState(false);
  const [dividendsFinalized, setDividendsFinalized] = useState(false);
  const [iocStart,           setIocStart]           = useState(0);
  const [iocEnd,             setIocEnd]             = useState(0);
  const [trustVotes,         setTrustVotes]         = useState(0);
  const [withdrawVotes,      setWithdrawVotes]      = useState(0);

  // Trạng thái của user
  const [walletAddr,       setWalletAddr]       = useState("");
  const [alreadyTrust,     setAlreadyTrust]     = useState(false);
  const [alreadyWithdraw,  setAlreadyWithdraw]  = useState(false);
  const [isDonor,          setIsDonor]          = useState(false);

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

      setActive(Boolean(p.active));
      setDividendsFinalized(Boolean(p.dividendsFinalized));
      setIocStart(Number(p.iocStart));
      setIocEnd(Number(p.iocEnd));
      setTrustVotes(Number(p.trustVotes));
      setWithdrawVotes(Number(p.withdrawVotes));
      setWalletAddr(addr);

      if (addr) {
        const [vt, vw, donated] = await Promise.all([
          c.votedTrust(projectId, addr),
          c.votedWithdraw(projectId, addr),
          c.donatedByUser(projectId, addr),
        ]);
        setAlreadyTrust(Boolean(vt));
        setAlreadyWithdraw(Boolean(vw));
        setIsDonor(BigInt(donated) > 0n);
      } else {
        setAlreadyTrust(false);
        setAlreadyWithdraw(false);
        setIsDonor(false);
      }
    } catch (e) {
      console.warn("Vote load:", e?.message || e);
    } finally {
      setFetching(false);
    }
  }, [projectId, loadAccount]);

  useEffect(() => { load(); }, [load]);

  const now = Math.floor(Date.now() / 1000);
  const inIOC      = now >= iocStart && now <= iocEnd;
  const afterIOC   = now > iocEnd && iocEnd > 0;

  const handleVote = async (type) => {
    if (!walletAddr) {
      pushToast?.("Vui lòng kết nối ví trước", "error");
      return;
    }
    const setLoading = type === "trust" ? setLoadingTrust : setLoadingWithdraw;
    try {
      setLoading(true);
      const c  = await getContract();
      const tx = type === "trust"
        ? await c.voteTrust(projectId)
        : await c.voteWithdraw(projectId);
      await tx.wait();
      pushToast?.(
        type === "trust"
          ? "Vote tín nhiệm thành công!"
          : "Vote giải ngân thành công!",
        "success"
      );
      await load();
    } catch (err) {
      const r = extractRevertReason(err);
      let msg;
      if      (r === "user_rejected")        msg = "Giao dịch đã bị huỷ";
      else if (r.includes("Already voted"))  msg = "Bạn đã vote rồi";
      else if (r.includes("Not in IOC"))     msg = "Không trong thời gian gọi vốn IOC";
      else if (r.includes("IOC not ended"))  msg = "IOC chưa kết thúc, chưa thể vote giải ngân";
      else if (r.includes("Not a donor"))    msg = "Chỉ nhà đầu tư đã donate mới được vote giải ngân";
      else if (r.includes("inactive"))       msg = "Dự án không còn hoạt động";
      else if (r.includes("finalized"))      msg = "Cổ tức đã được chốt";
      else                                   msg = r || "Vote thất bại";
      pushToast?.(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Phase label ──
  let phaseLabel, phaseClass;
  if (dividendsFinalized) {
    phaseLabel = "Cổ tức đã chốt";
    phaseClass = "bg-secondary-subtle text-secondary border border-secondary-subtle";
  } else if (!active) {
    phaseLabel = "Dự án không hoạt động";
    phaseClass = "bg-danger-subtle text-danger border border-danger-subtle";
  } else if (inIOC) {
    phaseLabel = "Đang gọi vốn IOC";
    phaseClass = "bg-success-subtle text-success border border-success-subtle";
  } else if (afterIOC) {
    phaseLabel = "IOC đã kết thúc";
    phaseClass = "bg-warning-subtle text-warning border border-warning-subtle";
  } else {
    phaseLabel = "Chưa mở gọi vốn";
    phaseClass = "bg-info-subtle text-info border border-info-subtle";
  }

  return (
    <div className="card h-100">
      <div className="card-header d-flex justify-content-between align-items-center">
        <span><i className="fas fa-poll me-2 text-info"></i>Vote cộng đồng</span>
        <button
          className="btn btn-sm btn-outline-secondary"
          style={{ padding: "1px 8px", fontSize: ".78rem" }}
          onClick={load}
          disabled={fetching}
        >
          <i className={`fas fa-sync-alt ${fetching ? "fa-spin" : ""}`} />
        </button>
      </div>

      <div className="card-body d-flex flex-column gap-3">

        {/* Phase badge */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <span className={`badge px-3 py-2 ${phaseClass}`}>
            <i className="fas fa-circle me-1" style={{ fontSize: ".6rem" }} />
            {phaseLabel}
          </span>
          <span className="text-muted" style={{ fontSize: ".8rem" }}>
            <i className="fas fa-thumbs-up me-1 text-info" />{trustVotes} tín nhiệm
            &nbsp;·&nbsp;
            <i className="fas fa-money-bill-wave me-1 text-warning" />{withdrawVotes} giải ngân
          </span>
        </div>

        {fetching ? (
          <div className="text-center py-3 text-muted">
            <i className="fas fa-spinner fa-spin me-1" /> Đang tải trạng thái...
          </div>
        ) : (
          <>
            {/* ── Vote tín nhiệm (chỉ trong IOC) ── */}
            <div>
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="fw-semibold" style={{ fontSize: ".88rem" }}>
                  Vote tín nhiệm
                </span>
                {alreadyTrust && (
                  <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: ".75rem" }}>
                    <i className="fas fa-check me-1" />Đã vote
                  </span>
                )}
              </div>
              <div className="text-muted mb-2" style={{ fontSize: ".8rem" }}>
                Thể hiện tin tưởng vào dự án trong thời gian gọi vốn IOC.
              </div>
              <button
                className={`btn w-100 ${alreadyTrust ? "btn-outline-success" : "btn-success"}`}
                disabled={loadingTrust || !inIOC || !active || dividendsFinalized || alreadyTrust || !walletAddr}
                onClick={() => handleVote("trust")}
              >
                {loadingTrust ? (
                  <><i className="fas fa-spinner fa-spin me-2" />Đang xử lý...</>
                ) : alreadyTrust ? (
                  <><i className="fas fa-check me-2" />Đã vote tín nhiệm</>
                ) : (
                  <><i className="fas fa-thumbs-up me-2" />Vote tín nhiệm</>
                )}
              </button>
              {!inIOC && !alreadyTrust && (
                <div className="text-muted mt-1" style={{ fontSize: ".78rem" }}>
                  <i className="fas fa-info-circle me-1" />
                  {afterIOC ? "IOC đã kết thúc, không còn nhận vote tín nhiệm." : "Chưa trong thời gian IOC."}
                </div>
              )}
            </div>

            <hr className="my-1" />

            {/* ── Vote giải ngân (sau khi IOC kết thúc, chỉ donor) ── */}
            <div>
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="fw-semibold" style={{ fontSize: ".88rem" }}>
                  Vote giải ngân
                </span>
                {alreadyWithdraw && (
                  <span className="badge bg-warning-subtle text-warning border border-warning-subtle" style={{ fontSize: ".75rem" }}>
                    <i className="fas fa-check me-1" />Đã vote
                  </span>
                )}
              </div>
              <div className="text-muted mb-2" style={{ fontSize: ".8rem" }}>
                Sau khi IOC kết thúc, nhà đầu tư đã donate có thể vote đồng ý giải ngân cổ tức.
              </div>
              <button
                className={`btn w-100 ${alreadyWithdraw ? "btn-outline-warning" : "btn-warning"}`}
                disabled={loadingWithdraw || !afterIOC || !active || dividendsFinalized || alreadyWithdraw || !isDonor || !walletAddr}
                onClick={() => handleVote("withdraw")}
              >
                {loadingWithdraw ? (
                  <><i className="fas fa-spinner fa-spin me-2" />Đang xử lý...</>
                ) : alreadyWithdraw ? (
                  <><i className="fas fa-check me-2" />Đã vote giải ngân</>
                ) : (
                  <><i className="fas fa-money-bill-wave me-2" />Vote giải ngân</>
                )}
              </button>

              {/* Hint messages */}
              {!walletAddr && (
                <div className="text-muted mt-1" style={{ fontSize: ".78rem" }}>
                  <i className="fas fa-wallet me-1" />Kết nối ví để vote.
                </div>
              )}
              {walletAddr && afterIOC && !isDonor && !alreadyWithdraw && (
                <div className="text-warning mt-1" style={{ fontSize: ".78rem" }}>
                  <i className="fas fa-exclamation-triangle me-1" />
                  Chỉ nhà đầu tư đã donate mới được vote giải ngân.
                </div>
              )}
              {walletAddr && !afterIOC && !inIOC && iocEnd === 0 && (
                <div className="text-muted mt-1" style={{ fontSize: ".78rem" }}>
                  <i className="fas fa-clock me-1" />Chờ IOC bắt đầu và kết thúc trước khi vote giải ngân.
                </div>
              )}
              {walletAddr && inIOC && (
                <div className="text-muted mt-1" style={{ fontSize: ".78rem" }}>
                  <i className="fas fa-clock me-1" />IOC đang diễn ra, vote giải ngân sau khi IOC kết thúc.
                </div>
              )}
              {dividendsFinalized && (
                <div className="text-muted mt-1" style={{ fontSize: ".78rem" }}>
                  <i className="fas fa-lock me-1" />Cổ tức đã chốt, không cần vote thêm.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
