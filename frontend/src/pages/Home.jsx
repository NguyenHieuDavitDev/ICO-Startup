import { useEffect, useState, useCallback } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { ethers } from "ethers";
import { getContract } from "../ethers";
import ProjectImage from "../components/ProjectImage";

export default function Home() {
  const { pushToast } = useOutletContext();
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const c     = await getContract(true);
      const count = Number(await c.projectCount());
      const list  = [];
      for (let i = 0; i < count; i++) {
        const p = await c.projects(i);
        if (!p.active) continue;
        list.push({
          id:          i,
          title:       p.title,
          description: p.description,
          image:       p.image,
          goal:        ethers.formatEther(p.goal),
          total:       ethers.formatEther(p.totalDonated),
          iocStart:    Number(p.iocStart),
          iocEnd:      Number(p.iocEnd),
          hasToken:    p.tokenSymbol?.trim().length > 0,
          tokenSymbol: p.tokenSymbol,
          trustVotes:  Number(p.trustVotes),
        });
      }
      setProjects(list);
    } catch (e) {
      console.warn("Load projects:", e.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const now = Date.now() / 1000;
  const getStatus = (p) => {
    if (now >= p.iocStart && now <= p.iocEnd) return "funding";
    if (now < p.iocStart) return "upcoming";
    return "ended";
  };

  const filtered = projects.filter((p) => {
    const q = p.title.toLowerCase().includes(search.toLowerCase());
    return filter === "all" ? q : q && getStatus(p) === filter;
  });

  const pct = (total, goal) => {
    const g = parseFloat(goal);
    return g > 0 ? Math.min(100, ((parseFloat(total) / g) * 100).toFixed(1)) : 0;
  };

  const statusInfo = (p) => {
    const s = getStatus(p);
    if (s === "funding")  return { label:"Đang gọi vốn", cls:"bg-success"    };
    if (s === "upcoming") return { label:"Sắp mở",       cls:"bg-info"        };
    return                       { label:"Đã kết thúc",  cls:"bg-secondary"   };
  };

  const countdown = (p) => {
    const target = getStatus(p) === "funding" ? p.iocEnd : p.iocStart;
    const diff   = Math.max(0, target - now);
    const d = Math.floor(diff / 86400), h = Math.floor((diff % 86400) / 3600);
    return d > 0 ? `Còn ${d}n ${h}h` : `Còn ${h}g ${Math.floor((diff%3600)/60)}ph`;
  };

  return (
    <>
      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <i className="fas fa-fire me-1"></i>{projects.filter(p=>getStatus(p)==="funding").length} dự án đang gọi vốn
          </div>
          <h1 className="hero-title">Quỹ Hỗ Trợ Startup Sinh Viên</h1>
          <p className="hero-subtitle">
            Khám phá, ủng hộ và bình chọn cho các dự án khởi nghiệp của sinh viên trên blockchain Ethereum.
          </p>
          <div className="d-flex flex-wrap gap-3 justify-content-center">
            <a href="#projects" className="btn btn-primary btn-lg px-4">
              <i className="fas fa-search me-2"></i>Khám phá dự án
            </a>
            <a href="#about" className="btn btn-outline-light btn-lg px-4">
              <i className="fas fa-info-circle me-2"></i>Tìm hiểu thêm
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="stats-strip">
        {[
          { icon:"fa-layer-group", value: projects.length,                                                   label:"Tổng dự án"      },
          { icon:"fa-fire",        value: projects.filter(p=>getStatus(p)==="funding").length,               label:"Đang gọi vốn"   },
          { icon:"fa-coins",       value: projects.reduce((s,p)=>s+parseFloat(p.total||0),0).toFixed(3),     label:"ETH huy động"   },
          { icon:"fa-thumbs-up",   value: projects.reduce((s,p)=>s+p.trustVotes,0),                          label:"Lượt vote"       },
        ].map((s,i) => (
          <div key={i} className="stats-strip-item">
            <i className={`fas ${s.icon} stats-strip-icon`}></i>
            <div className="stats-strip-value">{s.value}</div>
            <div className="stats-strip-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── Project list ── */}
      <section id="projects" className="projects-section">
        <div className="section-head">
          <h2 className="section-title-pub">Danh sách dự án</h2>
          <p className="section-sub">Hãy tìm hiểu và ủng hộ những dự án bạn tin tưởng</p>
        </div>

        {/* Filter bar */}
        <div className="filter-bar">
          <div className="input-group" style={{ maxWidth:280 }}>
            <span className="input-group-text bg-white border-end-0">
              <i className="fas fa-search text-muted" style={{ fontSize:".85rem" }}></i>
            </span>
            <input
              className="form-control border-start-0"
              placeholder="Tìm dự án..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="btn-group">
            {[
              { key:"all",      icon:"fa-th",         label:"Tất cả"        },
              { key:"funding",  icon:"fa-fire",        label:"Đang gọi vốn"  },
              { key:"upcoming", icon:"fa-clock",       label:"Sắp mở"        },
              { key:"ended",    icon:"fa-check",       label:"Đã kết thúc"   },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                className={`btn btn-sm ${filter===f.key?"btn-primary":"btn-outline-secondary"}`}
                onClick={() => setFilter(f.key)}
              >
                <i className={`fas ${f.icon} me-1`}></i>{f.label}
              </button>
            ))}
          </div>
          <span className="text-muted ms-auto" style={{ fontSize:".85rem" }}>
            {filtered.length} dự án
          </span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <i className="fas fa-spinner fa-spin fa-2x text-primary"></i>
            <p className="mt-2 text-muted">Đang tải dự án...</p>
          </div>
        ) : !filtered.length ? (
          <div className="text-center py-5">
            <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
            <p className="text-muted">Không tìm thấy dự án phù hợp</p>
          </div>
        ) : (
          <div className="row g-4">
            {filtered.map((p) => {
              const si = statusInfo(p);
              const pc = pct(p.total, p.goal);
              const s  = getStatus(p);
              return (
                <div key={p.id} className="col-sm-6 col-lg-4">
                  <Link to={`/project/${p.id}`} className="project-card-link">
                    <div className="project-card">
                      <ProjectImage src={p.image} alt={p.title} seed={p.id} height="200px" />

                      <div className="project-card-body">
                        <div className="d-flex flex-wrap gap-1 mb-2">
                          <span className={`badge ${si.cls}`} style={{ fontSize:".72rem" }}>{si.label}</span>
                          {p.hasToken && (
                            <span className="badge" style={{ background:"#8950fc22",color:"#8950fc",border:"1px solid #8950fc50",fontSize:".72rem" }}>
                              <i className="fas fa-coins me-1"></i>Có token riêng
                            </span>
                          )}
                        </div>

                        <h5 className="project-card-title">{p.title}</h5>
                        <p className="project-card-desc">
                          {p.description?.slice(0,90)}{p.description?.length>90?"…":""}
                        </p>

                        <div className="progress-label">
                          <span className="fw-semibold">{p.total} ETH</span>
                          <span className="text-primary fw-semibold">{pc}%</span>
                        </div>
                        <div className="progress mb-2" style={{ height:5 }}>
                          <div className="progress-bar bg-primary" style={{ width:`${pc}%`, borderRadius:3 }}></div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <small className="text-muted">Mục tiêu: {p.goal} ETH</small>
                          {(s==="funding"||s==="upcoming") && (
                            <small className="text-muted"><i className="fas fa-clock me-1"></i>{countdown(p)}</small>
                          )}
                        </div>

                        {p.trustVotes > 0 && (
                          <small className="text-muted">
                            <i className="fas fa-thumbs-up me-1 text-success"></i>{p.trustVotes} vote tín nhiệm
                          </small>
                        )}
                      </div>

                      <div className="project-card-footer">
                        <span className="btn btn-primary w-100">
                          <i className="fas fa-arrow-right me-2"></i>Xem chi tiết &amp; Tham gia
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── About section ── */}
      <section id="about" className="about-section">
        <div className="row g-4 align-items-center">
          <div className="col-md-6">
            <h2 className="fw-bold mb-3">Về nền tảng</h2>
            <p className="text-muted mb-3">
              Quỹ Hỗ Trợ Startup Sinh Viên là nền tảng gây quỹ phi tập trung, minh bạch 100% trên blockchain Ethereum.
              Mọi giao dịch đều được ghi nhận công khai và không thể thay đổi.
            </p>
            <div className="row g-3">
              {[
                { icon:"fa-shield-alt",  color:"#3699ff", title:"Minh bạch",    desc:"Mọi giao dịch on-chain, ai cũng xem được"          },
                { icon:"fa-vote-yea",    color:"#1bc5bd", title:"Dân chủ",       desc:"Cộng đồng quyết định bằng cơ chế vote"            },
                { icon:"fa-lock",        color:"#ffa800", title:"Bảo mật",       desc:"Smart contract tự động thực thi, không bên thứ ba" },
              ].map((f,i) => (
                <div key={i} className="col-12">
                  <div className="d-flex gap-3">
                    <div className="flex-shrink-0 rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width:44,height:44,background:f.color+"22" }}
                    >
                      <i className={`fas ${f.icon}`} style={{ color:f.color }}></i>
                    </div>
                    <div>
                      <h6 className="mb-1 fw-semibold">{f.title}</h6>
                      <p className="text-muted mb-0" style={{ fontSize:".85rem" }}>{f.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-md-6 text-center">
            <div className="about-visual">
              <i className="fas fa-cubes fa-5x" style={{ color:"#3699ff30" }}></i>
              <div className="about-visual-badge">
                <i className="fab fa-ethereum me-1"></i>Ethereum Sepolia
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
