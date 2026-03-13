import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { getContract } from "../ethers";
import CreateProject from "../components/CreateProject";
import ProjectDetail  from "../components/ProjectDetail";

export default function Admin({ onCreated, pushToast }) {
  const [showModal,  setShowModal]  = useState(false);
  const [projects,   setProjects]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [reloadKey,  setReloadKey]  = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [search,     setSearch]     = useState("");

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const c     = await getContract(true);
      const count = Number(await c.projectCount());
      const list  = [];

      for (let i = 0; i < count; i++) {
        const p   = await c.projects(i);
        const cmt = Number(await c.getCommentsCount(i));
        list.push({
          id:           i,
          title:        p.title,
          image:        p.image,
          description:  p.description,
          goal:         ethers.formatEther(p.goal),
          total:        ethers.formatEther(p.totalDonated),
          iocStart:     Number(p.iocStart),
          iocEnd:       Number(p.iocEnd),
          trustVotes:   Number(p.trustVotes),
          withdrawVotes:Number(p.withdrawVotes),
          commentCount: cmt,
          active:       p.active,
        });
      }
      setProjects(list);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects, reloadKey]);

  const handleCreated = () => {
    setShowModal(false);
    setReloadKey((k) => k + 1);
    if (onCreated) onCreated();
  };

  const handleToggleActive = async (id, active) => {
    try {
      const c  = await getContract();
      const tx = await c.setProjectActive(id, !active);
      await tx.wait();
      pushToast(`Dự án đã ${active ? "ẩn" : "hiện"}`, "success");
      setReloadKey((k) => k + 1);
    } catch { pushToast("Thao tác thất bại", "error"); }
  };

  const openDetail  = (id) => { setSelectedId(id); setDetailOpen(true); };
  const printDetail = (id) => {
    setSelectedId(id);
    setDetailOpen(true);
    setTimeout(() => window.print(), 500);
  };

  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const now = Date.now() / 1000;
  const statusBadge = (p) => {
    if (!p.active) return <span className="badge bg-secondary">Ẩn</span>;
    if (now >= p.iocStart && now <= p.iocEnd) return <span className="badge bg-success">Mở</span>;
    if (now < p.iocStart)  return <span className="badge bg-info">Sắp mở</span>;
    return <span className="badge bg-warning text-dark">Kết thúc</span>;
  };

  const pct = (total, goal) => {
    const g = parseFloat(goal);
    return g > 0 ? Math.min(100, Math.round((parseFloat(total) / g) * 100)) : 0;
  };

  const totalEth = projects.reduce((s, p) => s + parseFloat(p.total || 0), 0).toFixed(4);

  return (
    <>
      {/* --- Content header --- */}
      <div className="content-header no-print">
        <div>
          <h1><i className="fas fa-folder-open me-2 text-primary"></i>Quản lý dự án</h1>
          <div className="breadcrumb-wrap">
            <i className="fas fa-home me-1"></i>Trang chủ
            <i className="fas fa-chevron-right mx-1" style={{ fontSize:".6rem" }}></i>
            Quản lý dự án
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus me-2"></i>Thêm dự án mới
        </button>
      </div>

      {/* --- Stat cards --- */}
      <div className="row g-3 mb-4 no-print">
        {[
          { label:"Tổng dự án",      value:projects.length,                          icon:"fa-layer-group",      bg:"linear-gradient(135deg,#3699ff,#187de4)" },
          { label:"ETH huy động",    value:totalEth,                                 icon:"fa-coins",            bg:"linear-gradient(135deg,#1bc5bd,#0bb0a8)" },
          { label:"Đang gọi vốn",    value:projects.filter(p=>p.active && now>=p.iocStart && now<=p.iocEnd).length, icon:"fa-fire", bg:"linear-gradient(135deg,#ffa800,#e09400)" },
          { label:"Đang hoạt động",  value:projects.filter(p=>p.active).length,      icon:"fa-check-circle",     bg:"linear-gradient(135deg,#8950fc,#6b2cfc)" },
        ].map((s, i) => (
          <div key={i} className="col-sm-6 col-xl-3">
            <div className="stat-card" style={{ background: s.bg }}>
              <div className="icon-wrap"><i className={`fas ${s.icon}`}></i></div>
              <div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- Table card --- */}
      <div className="card no-print">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
          <span className="card-title mb-0">
            <i className="fas fa-list me-2 text-primary"></i>Danh sách dự án
          </span>
          <div className="d-flex gap-2">
            <div className="input-group input-group-sm" style={{ width:210 }}>
              <span className="input-group-text bg-white border-end-0">
                <i className="fas fa-search text-muted" style={{ fontSize:".8rem" }}></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Tìm dự án..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className="btn btn-sm btn-outline-secondary"
              title="Làm mới"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              <i className="fas fa-sync-alt"></i>
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => setShowModal(true)}
            >
              <i className="fas fa-plus me-1"></i>Thêm dự án mới
            </button>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <i className="fas fa-spinner fa-spin fa-2x text-primary"></i>
              <p className="mt-2 text-muted">Đang tải...</p>
            </div>
          ) : !filtered.length ? (
            <div className="text-center py-5">
              <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
              <p className="text-muted">Chưa có dự án nào</p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                <i className="fas fa-plus me-1"></i>Tạo dự án đầu tiên
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table admin-table align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width:44 }}>#</th>
                    <th>Tên dự án</th>
                    <th>Mục tiêu (ETH)</th>
                    <th>Đã ủng hộ (ETH)</th>
                    <th style={{ minWidth:120 }}>Tiến độ</th>
                    <th>Vote</th>
                    <th>Bình luận</th>
                    <th>Trạng thái</th>
                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td className="text-muted ps-3">{p.id + 1}</td>

                      {/* Tên dự án */}
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt=""
                              style={{ width:36,height:36,borderRadius:".4rem",objectFit:"cover",flexShrink:0 }}
                              onError={(e) => { e.target.style.display="none"; }}
                            />
                          ) : (
                            <div className="d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{ width:36,height:36,borderRadius:".4rem",background:"#f1f6ff" }}
                            >
                              <i className="fas fa-image text-muted" style={{ fontSize:".85rem" }}></i>
                            </div>
                          )}
                          <div style={{ minWidth:0 }}>
                            <div className="fw-semibold text-truncate" style={{ maxWidth:180 }}>{p.title}</div>
                            <div className="text-muted text-truncate" style={{ fontSize:".73rem",maxWidth:180 }}>
                              {p.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Mục tiêu */}
                      <td className="text-nowrap fw-semibold">{p.goal}</td>

                      {/* Đã ủng hộ */}
                      <td className="text-success fw-semibold text-nowrap">{p.total}</td>

                      {/* Tiến độ */}
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{ height:6 }}>
                            <div
                              className={`progress-bar ${pct(p.total,p.goal)>=100?"bg-success":"bg-primary"}`}
                              style={{ width:`${pct(p.total,p.goal)}%` }}
                            ></div>
                          </div>
                          <small className="text-muted" style={{ fontSize:".72rem", whiteSpace:"nowrap" }}>
                            {pct(p.total,p.goal)}%
                          </small>
                        </div>
                      </td>

                      {/* Vote TN / GN */}
                      <td className="text-nowrap">
                        <span className="badge me-1" style={{ background:"#1bc5bd20",color:"#0bb0a8",border:"1px solid #1bc5bd50" }}>
                          {p.trustVotes} TN
                        </span>
                        <span className="badge" style={{ background:"#f64e6020",color:"#d93250",border:"1px solid #f64e6050" }}>
                          {p.withdrawVotes} GN
                        </span>
                      </td>

                      {/* Bình luận */}
                      <td>
                        <span className="text-muted">
                          <i className="fas fa-comment me-1" style={{ fontSize:".8rem" }}></i>
                          {p.commentCount}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td>{statusBadge(p)}</td>

                      {/* Thao tác */}
                      <td className="text-center text-nowrap">
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          title="Xem chi tiết"
                          onClick={() => openDetail(p.id)}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary me-1"
                          title="In"
                          onClick={() => printDetail(p.id)}
                        >
                          <i className="fas fa-print"></i>
                        </button>
                        <button
                          className={`btn btn-sm ${p.active?"btn-outline-warning":"btn-outline-success"}`}
                          title={p.active?"Ẩn dự án":"Hiện dự án"}
                          onClick={() => handleToggleActive(p.id, p.active)}
                        >
                          <i className={`fas ${p.active?"fa-eye-slash":"fa-eye"}`}></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer row count */}
        {!loading && filtered.length > 0 && (
          <div className="card-footer bg-transparent text-muted py-2 px-3" style={{ fontSize:".82rem" }}>
            Hiển thị {filtered.length} / {projects.length} dự án
          </div>
        )}
      </div>

      {/* --- Chi tiết --- */}
      {detailOpen && selectedId !== null && (
        <div className="mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3 no-print">
            <h5 className="mb-0">
              <i className="fas fa-file-alt me-2 text-primary"></i>Chi tiết dự án
            </h5>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setDetailOpen(false)}
            >
              <i className="fas fa-times me-1"></i>Đóng
            </button>
          </div>
          <ProjectDetail projectId={selectedId} pushToast={pushToast} />
        </div>
      )}

      {/* --- Modal thêm dự án --- */}
      {showModal && (
        <>
          <div className="modal show d-block" tabIndex="-1" style={{ zIndex:1055 }}>
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header bg-primary bg-gradient text-white">
                  <h5 className="modal-title">
                    <i className="fas fa-plus-circle me-2"></i>Thêm dự án mới
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <CreateProject onCreated={handleCreated} pushToast={pushToast} />
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex:1054 }}></div>
        </>
      )}
    </>
  );
}
