import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { getContract } from "../ethers";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from "recharts";

const COLORS = ["#3699ff","#1bc5bd","#ffa800","#f64e60","#8950fc","#e4e6ef"];

export default function Dashboard({ onGotoAdmin }) {
  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [stats,     setStats]     = useState({ total: 0, eth: 0, votes: 0, comments: 0 });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const c = await getContract(true);
      const count = Number(await c.projectCount());
      const list = [];
      let totalEth = 0, totalVotes = 0, totalComments = 0;

      for (let i = 0; i < count; i++) {
        const p = await c.projects(i);
        const cmtCount = Number(await c.getCommentsCount(i));
        const tv = Number(p.trustVotes);
        const wv = Number(p.withdrawVotes);
        const eth = parseFloat(ethers.formatEther(p.totalDonated));

        totalEth     += eth;
        totalVotes   += tv + wv;
        totalComments += cmtCount;

        list.push({
          name:     p.title.length > 14 ? p.title.slice(0, 14) + "…" : p.title,
          fullName: p.title,
          eth:      parseFloat(eth.toFixed(4)),
          trust:    tv,
          withdraw: wv,
          comments: cmtCount,
          goal:     parseFloat(ethers.formatEther(p.goal)),
          active:   p.active,
        });
      }

      setProjects(list);
      setStats({
        total:    count,
        eth:      totalEth.toFixed(4),
        votes:    totalVotes,
        comments: totalComments,
      });
    } catch { /* ignore nếu chưa deploy */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const statCards = [
    { label: "Tổng số dự án",        value: stats.total,    icon: "fa-layer-group",       gradient: "linear-gradient(135deg,#3699ff,#187de4)" },
    { label: "Tổng tiền ủng hộ (ETH)",value: stats.eth,      icon: "fa-hand-holding-usd",  gradient: "linear-gradient(135deg,#1bc5bd,#0bb0a8)" },
    { label: "Tổng lượt bình chọn",   value: stats.votes,    icon: "fa-thumbs-up",         gradient: "linear-gradient(135deg,#ffa800,#e09400)" },
    { label: "Tổng bình luận",         value: stats.comments, icon: "fa-comments",          gradient: "linear-gradient(135deg,#f64e60,#d93250)" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="content-header">
        <div>
          <h1><i className="fas fa-tachometer-alt me-2 text-primary"></i>Tổng quan</h1>
          <div className="breadcrumb-wrap">
            <i className="fas fa-home me-1"></i> Trang chủ
            <i className="fas fa-chevron-right mx-1" style={{ fontSize: ".65rem" }}></i>
            Tổng quan
          </div>
        </div>
        <button className="btn btn-sm btn-primary" onClick={() => load()}>
          <i className="fas fa-sync-alt me-1"></i> Làm mới
        </button>
      </div>

      {/* Stat cards */}
      <div className="row g-3 mb-4">
        {statCards.map((s, i) => (
          <div key={i} className="col-sm-6 col-xl-3">
            <div className="stat-card" style={{ background: s.gradient }}>
              <div className="icon-wrap"><i className={`fas ${s.icon}`}></i></div>
              <div>
                {loading
                  ? <div className="stat-value"><i className="fas fa-spinner fa-spin" style={{ fontSize:"1rem" }}></i></div>
                  : <div className="stat-value">{s.value}</div>
                }
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <i className="fas fa-spinner fa-spin fa-2x text-primary"></i>
          <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
        </div>
      ) : !projects.length ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
            <p className="text-muted mb-3">Chưa có dữ liệu. Hãy tạo dự án đầu tiên!</p>
            <button className="btn btn-primary" onClick={onGotoAdmin}>
              <i className="fas fa-plus me-2"></i>Tạo dự án
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Row charts 1 */}
          <div className="row g-4 mb-4">
            {/* Bar chart */}
            <div className="col-lg-7">
              <div className="card h-100">
                <div className="card-header">
                  <i className="fas fa-chart-bar me-2 text-primary"></i>
                  Tiền ủng hộ theo dự án (ETH)
                </div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={projects} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(v, n) => [v + " ETH", "Đã ủng hộ"]}
                        labelFormatter={(l, p) => p[0]?.payload?.fullName || l}
                      />
                      <Bar dataKey="eth" fill="#3699ff" radius={[4,4,0,0]} name="ETH">
                        {projects.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Pie chart */}
            <div className="col-lg-5">
              <div className="card h-100">
                <div className="card-header">
                  <i className="fas fa-chart-pie me-2 text-warning"></i>
                  Phân bổ tiền ủng hộ theo dự án
                </div>
                <div className="card-body d-flex align-items-center justify-content-center">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={projects.filter(p => p.eth > 0)}
                        dataKey="eth"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {projects.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [v + " ETH", "Đã ủng hộ"]} />
                      <Legend iconType="circle" iconSize={10} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Row charts 2 */}
          <div className="row g-4">
            {/* Line chart: votes + comments */}
            <div className="col-lg-8">
              <div className="card h-100">
                <div className="card-header">
                  <i className="fas fa-chart-line me-2 text-success"></i>
                  Lượt bình chọn &amp; bình luận theo dự án
                </div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={projects} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip labelFormatter={(l, p) => p[0]?.payload?.fullName || l} />
                      <Legend iconType="circle" iconSize={10} />
                      <Line
                        type="monotone" dataKey="trust"
                        stroke="#1bc5bd" strokeWidth={2} dot={{ r: 4 }} name="Vote tín nhiệm"
                      />
                      <Line
                        type="monotone" dataKey="withdraw"
                        stroke="#f64e60" strokeWidth={2} dot={{ r: 4 }} name="Vote giải ngân"
                      />
                      <Line
                        type="monotone" dataKey="comments"
                        stroke="#ffa800" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 3" name="Bình luận"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top projects mini table */}
            <div className="col-lg-4">
              <div className="card h-100">
                <div className="card-header">
                  <i className="fas fa-trophy me-2 text-warning"></i>
                  Dự án nổi bật
                </div>
                <div className="card-body p-0">
                  <ul className="list-group list-group-flush">
                    {[...projects]
                      .sort((a, b) => b.eth - a.eth)
                      .slice(0, 5)
                      .map((p, i) => (
                        <li key={i} className="list-group-item d-flex align-items-center gap-3 py-2 px-3">
                          <span
                            className="fw-bold d-flex align-items-center justify-content-center rounded-circle"
                            style={{ width:28,height:28, background: COLORS[i % COLORS.length]+"22", color: COLORS[i % COLORS.length], fontSize:".8rem" }}
                          >
                            {i + 1}
                          </span>
                          <div className="flex-grow-1 text-truncate">
                            <div className="fw-semibold" style={{ fontSize: ".87rem" }}>{p.fullName}</div>
                            <div className="text-muted" style={{ fontSize: ".75rem" }}>
                              <i className="fas fa-thumbs-up me-1"></i>{p.trust + p.withdraw} vote
                              &nbsp;·&nbsp;
                              <i className="fas fa-comment me-1"></i>{p.comments}
                            </div>
                          </div>
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                            {p.eth} ETH
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
