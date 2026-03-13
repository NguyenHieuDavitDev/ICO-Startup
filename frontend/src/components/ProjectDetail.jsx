import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getContract } from "../ethers";
import Donate from "./Donate";
import Vote from "./Vote";
import Comment from "./Comment";
import CommentList from "./CommentList";

export default function ProjectDetail({ projectId, pushToast }) {
  const [project,    setProject]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState("overview");
  const [commentKey, setCommentKey] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const c = await getContract(true);
        const p = await c.projects(projectId);

        let team = [];
        try { team = JSON.parse(p.teamJson); if (!Array.isArray(team)) team = []; } catch { /* nếu không phải JSON */ }

        setProject({
          title:        p.title,
          description:  p.description,
          image:        p.image,
          teamJson:     p.teamJson,
          team,
          tokenName:    p.tokenName,
          tokenSymbol:  p.tokenSymbol,
          tokenAddress: p.tokenAddress,
          tokenPrice:   p.tokenPrice > 0n ? ethers.formatEther(p.tokenPrice) : null,
          goal:         ethers.formatEther(p.goal),
          total:        ethers.formatEther(p.totalDonated),
          trustVotes:   Number(p.trustVotes),
          withdrawVotes:Number(p.withdrawVotes),
          projectStart: Number(p.projectStart),
          projectEnd:   Number(p.projectEnd),
          iocStart:     Number(p.iocStart),
          iocEnd:       Number(p.iocEnd),
          active:       p.active,
        });
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    if (projectId !== null && projectId !== undefined) load();
  }, [projectId]);

  const fmtDate = (ts) => ts ? new Date(ts * 1000).toLocaleString("vi-VN") : "-";
  const percent = (total, goal) => {
    const g = parseFloat(goal);
    if (!g) return 0;
    return Math.min(100, ((parseFloat(total) / g) * 100).toFixed(1));
  };
  const now = Date.now() / 1000; 
  const getStatusBadge = (p) => {
    if (!p.active) return <span className="badge bg-secondary">Ẩn</span>;
    if (now >= p.iocStart && now <= p.iocEnd) return <span className="badge bg-success">Đang gọi vốn</span>;
    if (now < p.iocStart)  return <span className="badge bg-info">Sắp mở</span>;
    return <span className="badge bg-warning text-dark">Đã kết thúc</span>;
  };

  if (loading) return (
    <div className="text-center py-5">
      <i className="fas fa-spinner fa-spin fa-2x text-primary"></i>
      <p className="mt-2 text-muted">Đang tải...</p>
    </div>
  );
  if (!project) return null;

  const pct = percent(project.total, project.goal);

  return (
    <div>
      {/* Hero banner */}
      <div className="card mb-4 overflow-hidden" style={{ borderRadius: ".9rem" }}>
        {project.image && (
          <img
            src={project.image}
            alt={project.title}
            style={{ maxHeight: 260, objectFit: "cover", width: "100%" }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
        )}
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
            {getStatusBadge(project)}
            {project.tokenSymbol && (
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2">
                <i className="fas fa-coins me-1"></i>{project.tokenSymbol}
              </span>
            )}
          </div>
          <h2 className="mb-1 fw-bold">{project.title}</h2>
          <p className="text-muted mb-3">{project.description}</p>

          {/* Progress */}
          <div className="progress-label">
            <span>
              <i className="fas fa-hand-holding-usd me-1 text-success"></i>
              Đã huy động: <strong className="text-success">{project.total} ETH</strong>
            </span>
            <span className="fw-bold text-primary">{pct}%</span>
          </div>
          <div className="progress mb-2" style={{ height: 10 }}>
            <div
              className={`progress-bar ${pct >= 100 ? "bg-success" : "bg-primary"}`}
              style={{ width: `${pct}%`, borderRadius: 5 }}
            ></div>
          </div>
          <div className="d-flex justify-content-between text-muted" style={{ fontSize: ".82rem" }}>
            <span><i className="fas fa-bullseye me-1"></i>Mục tiêu: {project.goal} ETH</span>
            <span>
              <i className="fas fa-thumbs-up me-1"></i>{project.trustVotes} vote tín nhiệm
              &nbsp;·&nbsp;
              <i className="fas fa-hand-holding-usd me-1"></i>{project.withdrawVotes} vote giải ngân
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4 no-print">
        {[
          { key: "overview", icon: "fa-info-circle",  label: "Tổng quan"   },
          { key: "team",     icon: "fa-users",         label: "Đội ngũ"     },
          { key: "interact", icon: "fa-hand-point-up", label: "Tương tác"   },
          { key: "comments", icon: "fa-comments",      label: "Bình luận"   },
        ].map((t) => (
          <li className="nav-item" key={t.key}>
            <button
              type="button"
              className={`nav-link ${activeTab === t.key ? "active fw-semibold text-primary" : "text-muted"}`}
              onClick={() => setActiveTab(t.key)}
            >
              <i className={`fas ${t.icon} me-1`}></i>{t.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Tab: Tổng quan */}
      {activeTab === "overview" && (
        <div className="row g-4">
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header">
                <i className="fas fa-chart-pie me-2 text-primary"></i>Thông tin gọi vốn
              </div>
              <div className="card-body">
                <table className="table table-sm mb-0">
                  <tbody>
                    <tr><td className="text-muted">Đã huy động</td><td className="fw-semibold text-success">{project.total} ETH</td></tr>
                    <tr><td className="text-muted">Mục tiêu</td><td className="fw-semibold">{project.goal} ETH</td></tr>
                    <tr><td className="text-muted">Tiến độ</td><td><span className="badge bg-primary">{pct}%</span></td></tr>
                    <tr><td className="text-muted">Bắt đầu IOC</td><td>{fmtDate(project.iocStart)}</td></tr>
                    <tr><td className="text-muted">Kết thúc IOC</td><td>{fmtDate(project.iocEnd)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header">
                <i className="fas fa-coins me-2 text-warning"></i>Thông tin Token
              </div>
              <div className="card-body">
                <table className="table table-sm mb-0">
                  <tbody>
                    <tr><td className="text-muted">Tên token</td><td className="fw-semibold">{project.tokenName || "-"}</td></tr>
                    <tr><td className="text-muted">Ký hiệu</td><td><span className="badge bg-warning text-dark">{project.tokenSymbol || "-"}</span></td></tr>
                    <tr>
                      <td className="text-muted">Địa chỉ contract</td>
                      <td style={{ fontSize: ".78rem", wordBreak: "break-all" }}>
                        {project.tokenAddress && project.tokenAddress !== ethers.ZeroAddress
                          ? project.tokenAddress
                          : <span className="text-muted">Chưa cập nhật</span>}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Giá IOC</td>
                      <td>{project.tokenPrice ? `${project.tokenPrice} ETH` : <span className="text-muted">-</span>}</td>
                    </tr>
                    <tr><td className="text-muted">Bắt đầu dự án</td><td>{fmtDate(project.projectStart)}</td></tr>
                    <tr><td className="text-muted">Kết thúc dự án</td><td>{fmtDate(project.projectEnd)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Đội ngũ */}
      {activeTab === "team" && (
        <div className="card">
          <div className="card-header">
            <i className="fas fa-users me-2 text-primary"></i>Đội ngũ phát triển
          </div>
          <div className="card-body">
            {project.team.length === 0 ? (
              project.teamJson ? (
                <p className="text-muted mb-0">{project.teamJson}</p>
              ) : (
                <p className="text-muted mb-0">Chưa có thông tin đội ngũ.</p>
              )
            ) : (
              <div className="row g-3">
                {project.team.map((m, i) => (
                  <div key={i} className="col-md-4">
                    <div className="card h-100 border">
                      <div className="card-body text-center">
                        <div
                          className="mx-auto mb-2 rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: 52, height: 52, background: "#e0eaff", fontSize: "1.3rem" }}
                        >
                          <i className="fas fa-user-tie text-primary"></i>
                        </div>
                        <h6 className="mb-0">{m.name}</h6>
                        <small className="text-muted">{m.role}</small>
                        {m.bio && <p className="text-muted mt-1 mb-0" style={{ fontSize: ".8rem" }}>{m.bio}</p>}
                        {m.social && (
                          <a href={m.social} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary mt-2">
                            <i className="fas fa-link me-1"></i>Profile
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Tương tác */}
      {activeTab === "interact" && (
        <div className="row g-4">
          <div className="col-md-6">
            <Donate projectId={projectId} pushToast={pushToast} />
          </div>
          <div className="col-md-6">
            <Vote projectId={projectId} pushToast={pushToast} />
          </div>
        </div>
      )}

      {/* Tab: Bình luận */}
      {activeTab === "comments" && (
        <div>
          <Comment
            projectId={projectId}
            pushToast={pushToast}
            onSubmitted={() => setCommentKey((k) => k + 1)}
          />
          <CommentList projectId={projectId} reloadKey={commentKey} />
        </div>
      )}
    </div>
  );
}
