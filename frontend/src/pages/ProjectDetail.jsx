import { useEffect, useState } from "react";
import { useParams, Link, useOutletContext } from "react-router-dom";
import { ethers } from "ethers";
import { getContract } from "../ethers";
import Donate       from "../components/Donate";
import Vote         from "../components/Vote";
import Comment      from "../components/Comment";
import CommentList  from "../components/CommentList";
import Dividends    from "../components/Dividends";
import ProjectImage from "../components/ProjectImage";

export default function ProjectDetail() {
  const { id }          = useParams();
  const { pushToast }   = useOutletContext();
  const projectId       = Number(id);

  const [project,     setProject]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState("overview");
  const [commentKey,  setCommentKey]  = useState(0);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const c = await getContract(true);
        const p = await c.projects(projectId);

        let team = [];
        try { team = JSON.parse(p.teamJson); if (!Array.isArray(team)) team = []; } catch { /* raw string */ }

        setProject({
          title:         p.title,
          description:   p.description,
          image:         p.image,
          team,
          teamJson:      p.teamJson,
          tokenName:     p.tokenName,
          tokenSymbol:   p.tokenSymbol,
          tokenAddress:  p.tokenAddress,
          tokenPrice:    p.tokenPrice > 0n ? ethers.formatEther(p.tokenPrice) : null,
          goal:          ethers.formatEther(p.goal),
          total:         ethers.formatEther(p.totalDonated),
          trustVotes:    Number(p.trustVotes),
          withdrawVotes: Number(p.withdrawVotes),
          projectStart:  Number(p.projectStart),
          projectEnd:    Number(p.projectEnd),
          iocStart:      Number(p.iocStart),
          iocEnd:        Number(p.iocEnd),
          active:        p.active,
        });
      } catch (e) {
        console.warn("Load project detail:", e.message);
      } finally { setLoading(false); }
    }
    load();
  }, [projectId]);

  const fmt = (ts) => ts ? new Date(ts * 1000).toLocaleString("vi-VN") : "-";
  const now  = Date.now() / 1000;
  const pct  = (total, goal) => {
    const g = parseFloat(goal);
    return g > 0 ? Math.min(100, ((parseFloat(total) / g) * 100).toFixed(1)) : 0;
  };

  const isFunding = project && now >= project.iocStart && now <= project.iocEnd;

  if (loading) return (
    <div className="text-center py-5" style={{ paddingTop:"5rem" }}>
      <i className="fas fa-spinner fa-spin fa-2x text-primary"></i>
      <p className="mt-2 text-muted">Đang tải...</p>
    </div>
  );

  if (!project) return (
    <div className="text-center py-5" style={{ paddingTop:"5rem" }}>
      <i className="fas fa-exclamation-circle fa-3x text-danger mb-3"></i>
      <p>Không tìm thấy dự án</p>
      <Link to="/" className="btn btn-primary">Quay lại trang chủ</Link>
    </div>
  );

  const pc = pct(project.total, project.goal);

  const TABS = [
    { key:"overview",  icon:"fa-info-circle",  label:"Tổng quan"  },
    { key:"team",      icon:"fa-users",         label:"Đội ngũ"    },
    { key:"interact",  icon:"fa-hand-point-up", label:"Tham gia"   },
    { key:"dividends", icon:"fa-coins",         label:"Cổ tức"     },
    { key:"comments",  icon:"fa-comments",      label:"Bình luận"  },
  ];

  return (
    <div className="detail-page">
      {/* Back */}
      <div className="detail-back">
        <Link to="/" className="btn btn-sm btn-outline-secondary">
          <i className="fas fa-arrow-left me-1"></i>Quay lại
        </Link>
      </div>

      {/* Hero */}
      <div className="detail-hero">
        <ProjectImage
          src={project.image}
          alt={project.title}
          seed={projectId}
          height="100%"
          className="detail-hero-img-wrap"
        />
        <div className="detail-hero-overlay">
          <div className="detail-hero-content">
            <div className="d-flex flex-wrap gap-2 mb-2">
              <span className={`badge ${isFunding?"bg-success":"bg-secondary"} px-3 py-2`}>
                <i className={`fas ${isFunding?"fa-fire":"fa-clock"} me-1`}></i>
                {isFunding ? "Đang gọi vốn" : "Chưa mở / Đã kết thúc"}
              </span>
              {project.tokenSymbol && (
                <span className="badge bg-primary px-3 py-2">
                  <i className="fas fa-coins me-1"></i>{project.tokenSymbol}
                </span>
              )}
            </div>
            <h1 className="detail-hero-title">{project.title}</h1>
            <p className="detail-hero-desc">{project.description}</p>

            {/* Progress */}
            <div className="detail-progress">
              <div className="d-flex justify-content-between mb-1" style={{ fontSize:".9rem" }}>
                <span>Đã huy động: <strong className="text-success">{project.total} ETH</strong></span>
                <span className="fw-bold text-warning">{pc}%</span>
              </div>
              <div className="progress" style={{ height:8, borderRadius:4 }}>
                <div className={`progress-bar ${pc>=100?"bg-success":"bg-warning"}`}
                  style={{ width:`${pc}%`, borderRadius:4 }}
                ></div>
              </div>
              <div className="d-flex justify-content-between mt-1" style={{ fontSize:".82rem", opacity:.8 }}>
                <span>Mục tiêu: {project.goal} ETH</span>
                <span>
                  <i className="fas fa-thumbs-up me-1"></i>{project.trustVotes} TN
                  &nbsp;·&nbsp;
                  <i className="fas fa-money-bill-wave me-1"></i>{project.withdrawVotes} GN
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs-wrap">
        <ul className="nav detail-tabs">
          {TABS.map((t) => (
            <li key={t.key} className="nav-item">
              <button
                type="button"
                className={`nav-link detail-tab-btn ${activeTab===t.key?"active":""}`}
                onClick={() => setActiveTab(t.key)}
              >
                <i className={`fas ${t.icon} me-1`}></i>{t.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Tab content */}
      <div className="detail-body container" style={{ maxWidth:960, paddingTop:"1.5rem" }}>

        {/* ── Tổng quan ── */}
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
                      <tr><td className="text-muted">Tiến độ</td><td><span className="badge bg-primary">{pc}%</span></td></tr>
                      <tr><td className="text-muted">Bắt đầu IOC</td><td>{fmt(project.iocStart)}</td></tr>
                      <tr><td className="text-muted">Kết thúc IOC</td><td>{fmt(project.iocEnd)}</td></tr>
                      <tr><td className="text-muted">Bắt đầu dự án</td><td>{fmt(project.projectStart)}</td></tr>
                      <tr><td className="text-muted">Kết thúc dự án</td><td>{fmt(project.projectEnd)}</td></tr>
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
                        <td className="text-muted">Contract</td>
                        <td style={{ fontSize:".78rem", wordBreak:"break-all" }}>
                          {project.tokenAddress && project.tokenAddress !== ethers.ZeroAddress
                            ? project.tokenAddress
                            : <span className="text-muted">Chưa cập nhật</span>}
                        </td>
                      </tr>
                      <tr><td className="text-muted">Giá IOC</td><td>{project.tokenPrice ? `${project.tokenPrice} ETH` : "-"}</td></tr>
                      <tr><td className="text-muted">Vote tín nhiệm</td><td><span className="badge" style={{ background:"#1bc5bd22",color:"#0bb0a8",border:"1px solid #1bc5bd50" }}>{project.trustVotes} vote</span></td></tr>
                      <tr><td className="text-muted">Vote giải ngân</td><td><span className="badge" style={{ background:"#f64e6022",color:"#d93250",border:"1px solid #f64e6050" }}>{project.withdrawVotes} vote</span></td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Đội ngũ ── */}
        {activeTab === "team" && (
          <div className="card">
            <div className="card-header">
              <i className="fas fa-users me-2 text-primary"></i>Đội ngũ phát triển
            </div>
            <div className="card-body">
              {project.team.length === 0 ? (
                <p className="text-muted mb-0">{project.teamJson || "Chưa có thông tin đội ngũ."}</p>
              ) : (
                <div className="row g-3">
                  {project.team.map((m, i) => (
                    <div key={i} className="col-md-4">
                      <div className="card border h-100">
                        <div className="card-body text-center">
                          <div className="mx-auto mb-2 rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width:52,height:52,background:"#e0eaff" }}
                          >
                            <i className="fas fa-user-tie text-primary"></i>
                          </div>
                          <h6 className="mb-0 fw-bold">{m.name}</h6>
                          <small className="text-muted">{m.role}</small>
                          {m.bio && <p className="text-muted mt-1 mb-0" style={{ fontSize:".8rem" }}>{m.bio}</p>}
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

        {/* ── Tham gia ── */}
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

        {/* ── Cổ tức ── */}
        {activeTab === "dividends" && (
          <Dividends projectId={projectId} pushToast={pushToast} />
        )}

        {/* ── Bình luận ── */}
        {activeTab === "comments" && (
          <>
            <Comment
              projectId={projectId}
              pushToast={pushToast}
              onSubmitted={() => setCommentKey((k) => k + 1)}
            />
            <CommentList projectId={projectId} reloadKey={commentKey} />
          </>
        )}
      </div>
    </div>
  );
}
