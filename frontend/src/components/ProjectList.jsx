import { useEffect, useState } from "react";
import { getContract } from "../ethers";
import { ethers } from "ethers";

export default function ProjectList({
  reloadKey,
  onSelect,
  isAdmin = false,
  onPrint,
}) {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    async function loadProjects() {
      const c = await getContract(true);
      const count = Number(await c.projectCount());

      const list = [];
      for (let i = 0; i < count; i++) {
        const p = await c.projects(i);
        if (!p.active) continue;
        list.push({
          id: i,
          title: p.title,
          image: p.image,
          goal: ethers.formatEther(p.goal),
          total: ethers.formatEther(p.totalDonated),
        });
      }

      setProjects(list);
    }

    loadProjects();
  }, [reloadKey]);

  if (!projects.length) {
    return <p>Chưa có dự án nào.</p>;
  }

  return (
    <div className="row">
      {projects.map((p) => (
        <div key={p.id} className="col-md-4">
          <div
            className="card mb-3 h-100"
            style={{ cursor: onSelect ? "pointer" : "default" }}
            onClick={() => onSelect && onSelect(p.id)}
          >
            {p.image && (
              <img
                src={p.image}
                className="card-img-top"
                alt={p.title}
                style={{ objectFit: "cover", height: "180px" }}
              />
            )}
            <div className="card-body d-flex flex-column">
              <h5 className="card-title">{p.title}</h5>
              <p className="card-text mb-2">
                <strong>{p.total}</strong> / {p.goal} ETH
              </p>

              {isAdmin && (
                <div className="mt-auto d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect && onSelect(p.id);
                    }}
                  >
                    Xem chi tiết
                  </button>
                  {onPrint && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect && onSelect(p.id);
                        onPrint();
                      }}
                    >
                      In
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
