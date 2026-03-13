import { useEffect, useState } from "react";
import { getContract } from "../ethers";

export default function CommentList({ projectId, reloadKey }) {
  const [comments, setComments] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function load() {
      if (projectId === null || projectId === undefined) return;
      try {
        setLoading(true);
        const c     = await getContract(true);
        const count = Number(await c.getCommentsCount(projectId));
        const list  = [];
        for (let i = 0; i < count; i++) {
          const [user, content, rating, timestamp] = await c.getComment(projectId, i);
          list.push({ user, content, rating: Number(rating), timestamp: Number(timestamp) });
        }
        setComments(list.reverse());
      } catch {  }
      finally { setLoading(false); }
    }
    load();
  }, [projectId, reloadKey]);

  const shortAddr = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";
  const fmtTime  = (ts) => ts ? new Date(ts * 1000).toLocaleString("vi-VN") : "";

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <span>
          <i className="fas fa-comments me-2 text-primary"></i>
          Bình luận ({comments.length})
        </span>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="text-center py-4">
            <i className="fas fa-spinner fa-spin text-primary"></i>
          </div>
        ) : !comments.length ? (
          <div className="text-center py-4 text-muted">
            <i className="fas fa-comment-slash fa-2x mb-2"></i>
            <p className="mb-0">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
          </div>
        ) : (
          comments.map((c, i) => (
            <div key={i} className={`d-flex gap-3 py-3 ${i < comments.length - 1 ? "border-bottom" : ""}`}>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 40, height: 40, background: "#e0eaff" }}
              >
                <i className="fas fa-user text-primary" style={{ fontSize: ".85rem" }}></i>
              </div>
              <div className="flex-grow-1">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="fw-semibold" style={{ fontSize: ".88rem" }}>
                    {shortAddr(c.user)}
                  </span>
                  <div className="d-flex align-items-center gap-2">
                    <div>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <i
                          key={s}
                          className={`fas fa-star ${s <= c.rating ? "text-warning" : "text-secondary"}`}
                          style={{ fontSize: ".75rem" }}
                        ></i>
                      ))}
                    </div>
                    <small className="text-muted">{fmtTime(c.timestamp)}</small>
                  </div>
                </div>
                <p className="mb-0 text-muted" style={{ fontSize: ".88rem" }}>{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
