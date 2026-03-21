import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getContract } from "../ethers";
import Donate       from "./Donate";
import Vote         from "./Vote";
import Comment      from "./Comment";
import CommentList  from "./CommentList";
import Dividends    from "./Dividends";
import ProjectImage from "./ProjectImage";

export default function ProjectDetailInline({ projectId, pushToast, onClose }) {
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
        try { team = JSON.parse(p.teamJson); if (!Array.isArray(team)) team = []; } catch {}
        setProject({
          title: p.title, description: p.description, image: p.image,
          team, teamJson: p.teamJson, tokenName: p.tokenName, tokenSymbol: p.tokenSymbol,
          tokenAddress: p.tokenAddress,
          tokenPrice: p.tokenPrice > 0n ? ethers.formatEther(p.tokenPrice) : null,
          goal: ethers.formatEther(p.goal), total: ethers.formatEther(p.totalDonated),
          trustVotes: Number(p.trustVotes), withdrawVotes: Number(p.withdrawVotes),
          projectStart: Number(p.projectStart), projectEnd: Number(p.projectEnd),
          iocStart: Number(p.iocStart), iocEnd: Number(p.iocEnd), active: p.active,
        });
      } catch (e) { console.warn(e.message); }
      finally { setLoading(false); }
    }
    load();
  }, [projectId]);

  const fmt = (ts) => ts ? new Date(ts*1000).toLocaleString("vi-VN") : "-";
  const pct = (total, goal) => {
    const g = parseFloat(goal);
    return g > 0 ? Math.min(100, ((parseFloat(total)/g)*100).toFixed(1)) : 0;
  };

  const TABS = [
    { key:"overview", icon:"fa-info-circle", label:"Thông tin"    },
    { key:"team",     icon:"fa-users",        label:"Đội ngũ"      },
    { key:"interact", icon:"fa-coins",        label:"Donate/Vote"  },
    { key:"dividends",icon:"fa-hand-holding-usd", label:"Cổ tức"     },
    { key:"comments", icon:"fa-comments",     label:"Bình luận"    },
  ];

  return (
    <div className="card shadow-sm border-primary border-top border-top-2 print-section">
      <div className="card-header d-flex align-items-center justify-content-between bg-light py-2">
        <span className="fw-semibold">
          <i className="fas fa-folder-open me-2 text-primary"></i>
          Chi tiết dự án {loading ? "..." : `— ${project?.title}`}
        </span>
        <button className="btn btn-sm btn-outline-secondary no-print" onClick={onClose}>
          <i className="fas fa-times me-1"></i>Đóng
        </button>
      </div>

      {loading ? (
        <div className="card-body text-center py-4">
          <i className="fas fa-spinner fa-spin text-primary"></i> Đang tải...
        </div>
      ) : !project ? (
        <div className="card-body text-center py-4 text-danger">
          <i className="fas fa-exclamation-circle me-1"></i>Không tải được dự án
        </div>
      ) : (
        <>
          {/* Print header */}
          <div className="print-only" style={{ display:"none" }}>
            <div className="d-flex align-items-center gap-3 mb-3">
              <div style={{ width:80, height:80, borderRadius:".5rem", overflow:"hidden", flexShrink:0 }}>
                <ProjectImage src={project.image} alt={project.title} seed={projectId} height="80px" />
              </div>
              <div>
                <h4 className="mb-0">{project.title}</h4>
                <p className="text-muted mb-0">{project.description}</p>
              </div>
            </div>
          </div>

          {/* Tabs (no print) */}
          <ul className="nav nav-tabs nav-tabs-sm px-3 pt-2 no-print" style={{ borderBottom:"none" }}>
            {TABS.map((t) => (
              <li key={t.key} className="nav-item">
                <button
                  type="button"
                  className={`nav-link py-1 px-2 ${activeTab===t.key?"active fw-semibold":""}`}
                  style={{ fontSize:".82rem" }}
                  onClick={() => setActiveTab(t.key)}
                >
                  <i className={`fas ${t.icon} me-1`}></i>{t.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="card-body">
            {/* Overview */}
            {(activeTab === "overview" || true) && (
              <div className={activeTab !== "overview" ? "d-none no-print" : ""}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <h6 className="fw-bold mb-2">Gọi vốn</h6>
                    <div className="mb-2">
                      <div className="d-flex justify-content-between mb-1" style={{ fontSize:".85rem" }}>
                        <span>{project.total} / {project.goal} ETH</span>
                        <strong className="text-primary">{pct(project.total,project.goal)}%</strong>
                      </div>
                      <div className="progress" style={{ height:6 }}>
                        <div className="progress-bar bg-primary" style={{ width:`${pct(project.total,project.goal)}%` }}></div>
                      </div>
                    </div>
                    <table className="table table-sm" style={{ fontSize:".83rem" }}>
                      <tbody>
                        <tr><td className="text-muted">Bắt đầu IOC</td><td>{fmt(project.iocStart)}</td></tr>
                        <tr><td className="text-muted">Kết thúc IOC</td><td>{fmt(project.iocEnd)}</td></tr>
                        <tr><td className="text-muted">Bắt đầu dự án</td><td>{fmt(project.projectStart)}</td></tr>
                        <tr><td className="text-muted">Kết thúc dự án</td><td>{fmt(project.projectEnd)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <h6 className="fw-bold mb-2">Token &amp; Vote</h6>
                    <table className="table table-sm" style={{ fontSize:".83rem" }}>
                      <tbody>
                        <tr><td className="text-muted">Token</td><td>{project.tokenSymbol||"-"} {project.tokenName ? `(${project.tokenName})`:""}</td></tr>
                        <tr><td className="text-muted">Giá IOC</td><td>{project.tokenPrice ? `${project.tokenPrice} ETH` : "-"}</td></tr>
                        <tr><td className="text-muted">Vote tín nhiệm</td><td>{project.trustVotes}</td></tr>
                        <tr><td className="text-muted">Vote giải ngân</td><td>{project.withdrawVotes}</td></tr>
                        <tr><td className="text-muted">Trạng thái</td><td><span className={`badge ${project.active?"bg-success":"bg-secondary"}`}>{project.active?"Hoạt động":"Ẩn"}</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Team */}
            {activeTab === "team" && (
              <div>
                {project.team.length === 0 ? (
                  <p className="text-muted">{project.teamJson || "Chưa có thông tin đội ngũ."}</p>
                ) : (
                  <div className="row g-2">
                    {project.team.map((m,i) => (
                      <div key={i} className="col-md-4">
                        <div className="card border text-center p-2">
                          <div className="mx-auto mb-1 rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width:42,height:42,background:"#e0eaff" }}>
                            <i className="fas fa-user-tie text-primary" style={{ fontSize:".9rem" }}></i>
                          </div>
                          <div className="fw-semibold" style={{ fontSize:".85rem" }}>{m.name}</div>
                          <div className="text-muted" style={{ fontSize:".75rem" }}>{m.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Interact */}
            {activeTab === "interact" && (
              <div className="row g-3">
                <div className="col-md-6"><Donate projectId={projectId} pushToast={pushToast} /></div>
                <div className="col-md-6"><Vote   projectId={projectId} pushToast={pushToast} /></div>
              </div>
            )}

            {/* Dividends */}
            {activeTab === "dividends" && (
              <Dividends projectId={projectId} pushToast={pushToast} adminMode />
            )}

            {/* Comments */}
            {activeTab === "comments" && (
              <>
                <Comment
                  projectId={projectId}
                  pushToast={pushToast}
                  onSubmitted={() => setCommentKey(k=>k+1)}
                />
                <CommentList projectId={projectId} reloadKey={commentKey} />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
