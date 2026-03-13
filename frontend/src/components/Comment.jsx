import { getContract } from "../ethers";
import { useState } from "react";

export default function Comment({ projectId, pushToast, onSubmitted }) {
  const [content, setContent] = useState("");
  const [rating,  setRating]  = useState(5);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!content.trim()) {
      if (pushToast) pushToast("Vui lòng nhập nội dung bình luận", "error");
      return;
    }
    try {
      setLoading(true);
      const c  = await getContract();
      const tx = await c.addComment(projectId, content.trim(), Number(rating));
      await tx.wait();
      if (pushToast) pushToast("Bình luận đã được gửi!", "success");
      setContent("");
      setRating(5);
      if (onSubmitted) onSubmitted();
    } catch (err) {
      const m = err?.message || "";
      const msg = m.includes("MetaMask")
        ? "Vui lòng cài MetaMask"
        : m.includes("user rejected") || m.includes("ACTION_REJECTED")
        ? "Giao dịch đã bị huỷ"
        : "Gửi bình luận thất bại";
      if (pushToast) pushToast(msg, "error"); else alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-header">
        <i className="fas fa-comment-dots me-2 text-primary"></i>Viết bình luận
      </div>
      <div className="card-body">
        <div className="mb-3">
          <textarea
            className="form-control"
            rows="3"
            placeholder="Chia sẻ nhận xét của bạn về dự án..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className="d-flex align-items-center gap-3 mb-3">
          <span className="fw-semibold" style={{ fontSize: ".88rem" }}>Đánh giá:</span>
          <div className="star-rating d-flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <i
                key={i}
                className={`fas fa-star ${i <= rating ? "text-warning" : "text-secondary"}`}
                style={{ cursor: "pointer", fontSize: "1.2rem", transition: "transform .1s" }}
                onClick={() => setRating(i)}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              ></i>
            ))}
          </div>
          <span className="text-muted" style={{ fontSize: ".82rem" }}>
            {["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Tuyệt vời"][rating]}
          </span>
        </div>

        <button
          className="btn btn-primary"
          disabled={!content.trim() || loading}
          onClick={submit}
        >
          {loading ? (
            <><i className="fas fa-spinner fa-spin me-2"></i>Đang gửi...</>
          ) : (
            <><i className="fas fa-paper-plane me-2"></i>Gửi bình luận</>
          )}
        </button>
      </div>
    </div>
  );
}
