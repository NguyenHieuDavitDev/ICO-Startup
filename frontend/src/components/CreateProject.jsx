import { useState } from "react";
import { ethers } from "ethers";
import { getContract } from "../ethers";
import ProjectImage from "./ProjectImage";

const TABS = [
  { key: "info",  icon: "fa-info-circle",   label: "Thông tin dự án" },
  { key: "team",  icon: "fa-users",          label: "Đội ngũ" },
  { key: "token", icon: "fa-coins",          label: "Token & IOC" },
  { key: "time",  icon: "fa-calendar-alt",   label: "Thời gian" },
];

const initMember = () => ({ name: "", role: "", bio: "", social: "" });

export default function CreateProject({ onCreated, pushToast }) {
  const [tab, setTab] = useState("info");

  // --- Dự án ---
  const [title, setTitle]   = useState("");
  const [desc, setDesc]     = useState("");
  const [image, setImage]   = useState("");
  const [errors, setErrors] = useState({});

  // --- Đội ngũ ---
  const [members, setMembers] = useState([initMember()]);

  // --- Token ---
  const [tokenName,    setTokenName]    = useState("");
  const [tokenSymbol,  setTokenSymbol]  = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenPrice,   setTokenPrice]   = useState("");
  const [goal,         setGoal]         = useState("");

  // --- Thời gian ---
  const [projectStart, setProjectStart] = useState("");
  const [projectEnd,   setProjectEnd]   = useState("");
  const [iocStart,     setIocStart]     = useState("");
  const [iocEnd,       setIocEnd]       = useState("");

  const [loading, setLoading] = useState(false);

  const toTimestamp = (v) => (v ? Math.floor(new Date(v).getTime() / 1000) : 0);

  // Validate
  const validate = () => {
    const e = {};
    if (!title.trim())  e.title = "Tên dự án không được để trống";
    if (!goal || Number(goal) <= 0) e.goal = "Mục tiêu phải > 0 ETH";
    return e;
  };

  const addMember = () => setMembers((m) => [...m, initMember()]);
  const removeMember = (i) => setMembers((m) => m.filter((_, idx) => idx !== i));
  const updateMember = (i, field, val) =>
    setMembers((m) => m.map((mb, idx) => (idx === i ? { ...mb, [field]: val } : mb)));

  const create = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setTab("info");
      return;
    }

    try {
      setLoading(true);
      const c = await getContract();

      const teamJson = JSON.stringify(
        members.filter((m) => m.name.trim())
      );

      const tx = await c.createProject(
        title.trim(),
        desc.trim(),
        image.trim(),
        teamJson,
        tokenName.trim(),
        tokenSymbol.trim(),
        tokenAddress.trim() || ethers.ZeroAddress,
        tokenPrice ? ethers.parseEther(tokenPrice) : 0n,
        ethers.parseEther(goal),
        toTimestamp(projectStart),
        toTimestamp(projectEnd),
        toTimestamp(iocStart),
        toTimestamp(iocEnd)
      );
      await tx.wait();

      if (pushToast) pushToast("Dự án đã được tạo thành công!", "success");
      if (onCreated) onCreated();
    } catch (err) {
      console.error(err);
      const m = err?.message || "";
      const msg =
        m.includes("MetaMask")       ? "Vui lòng cài MetaMask" :
        m.includes("user rejected") || m.includes("ACTION_REJECTED")
                                      ? "Giao dịch đã bị huỷ" :
        err?.reason || err?.data?.message || "Tạo dự án thất bại";
      if (pushToast) pushToast(msg, "error"); else alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Tab nav */}
      <ul className="nav nav-tabs modal-tabs mb-4">
        {TABS.map((t) => (
          <li className="nav-item" key={t.key}>
            <button
              type="button"
              className={`nav-link ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              <i className={`fas ${t.icon} me-1`}></i>
              {t.label}
            </button>
          </li>
        ))}
      </ul>

      {/* === Tab: Thông tin dự án === */}
      {tab === "info" && (
        <div>
          <div className="mb-3">
            <label className="form-label fw-semibold">
              Tên dự án <span className="text-danger">*</span>
            </label>
            <input
              className={`form-control ${errors.title ? "is-invalid" : ""}`}
              placeholder="Nhập tên dự án..."
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((v) => ({ ...v, title: null })); }}
            />
            {errors.title && <div className="invalid-feedback">{errors.title}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Mô tả</label>
            <textarea
              className="form-control"
              rows="4"
              placeholder="Mô tả ngắn về dự án..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">
              <i className="fas fa-image me-1 text-primary"></i>
              URL hình ảnh đại diện
            </label>
            <div className="img-input-wrap">
              <div className="img-preview-box">
                <ProjectImage src={image} alt="preview" seed={0} height="160px" />
                {!image && (
                  <div className="img-preview-hint">
                    <i className="fas fa-cloud-upload-alt fa-lg mb-1"></i>
                    <span>Nhập URL bên dưới để xem trước</span>
                  </div>
                )}
              </div>
              <input
                className="form-control mt-2"
                placeholder="https://example.com/image.jpg"
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
              {image && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger mt-1"
                  onClick={() => setImage("")}
                >
                  <i className="fas fa-times me-1"></i>Xoá ảnh
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === Tab: Đội ngũ === */}
      {tab === "team" && (
        <div>
          {members.map((m, i) => (
            <div key={i} className="border rounded p-3 mb-3 position-relative">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-semibold text-muted" style={{ fontSize: ".85rem" }}>
                  <i className="fas fa-user-tie me-1"></i>
                  Thành viên #{i + 1}
                </span>
                {members.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeMember(i)}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                )}
              </div>
              <div className="row">
                <div className="col-md-6 mb-2">
                  <input
                    className="form-control form-control-sm"
                    placeholder="Họ và tên"
                    value={m.name}
                    onChange={(e) => updateMember(i, "name", e.target.value)}
                  />
                </div>
                <div className="col-md-6 mb-2">
                  <input
                    className="form-control form-control-sm"
                    placeholder="Chức vụ (CEO, CTO...)"
                    value={m.role}
                    onChange={(e) => updateMember(i, "role", e.target.value)}
                  />
                </div>
                <div className="col-md-8 mb-2">
                  <input
                    className="form-control form-control-sm"
                    placeholder="Mô tả ngắn"
                    value={m.bio}
                    onChange={(e) => updateMember(i, "bio", e.target.value)}
                  />
                </div>
                <div className="col-md-4 mb-2">
                  <input
                    className="form-control form-control-sm"
                    placeholder="Link LinkedIn/GitHub..."
                    value={m.social}
                    onChange={(e) => updateMember(i, "social", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={addMember}
          >
            <i className="fas fa-plus me-1"></i>
            Thêm thành viên
          </button>
        </div>
      )}

      {/* === Tab: Token & IOC === */}
      {tab === "token" && (
        <div>
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label fw-semibold">Tên token</label>
              <input
                className="form-control"
                placeholder="Student Token"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label fw-semibold">Ký hiệu</label>
              <input
                className="form-control"
                placeholder="SST"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label fw-semibold">
                Mục tiêu gọi vốn (ETH) <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  className={`form-control ${errors.goal ? "is-invalid" : ""}`}
                  placeholder="1.0"
                  value={goal}
                  onChange={(e) => { setGoal(e.target.value); setErrors((v) => ({ ...v, goal: null })); }}
                />
                <span className="input-group-text">ETH</span>
                {errors.goal && <div className="invalid-feedback">{errors.goal}</div>}
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Địa chỉ contract token (nếu có)</label>
            <input
              className="form-control"
              placeholder="0x..."
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Giá token trong IOC (ETH / token, tuỳ chọn)</label>
            <div className="input-group">
              <input
                className="form-control"
                placeholder="0.001"
                value={tokenPrice}
                onChange={(e) => setTokenPrice(e.target.value)}
              />
              <span className="input-group-text">ETH</span>
            </div>
          </div>
        </div>
      )}

      {/* === Tab: Thời gian === */}
      {tab === "time" && (
        <div>
          <p className="text-muted mb-3" style={{ fontSize: ".85rem" }}>
            <i className="fas fa-info-circle me-1"></i>
            Để trống các trường thời gian → hệ thống tự gán: IOC 30 ngày, dự án 90 ngày từ hiện tại.
          </p>

          <div className="section-title">Thời gian dự án</div>
          <div className="row mb-3">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Bắt đầu dự án</label>
              <input
                type="datetime-local"
                className="form-control"
                value={projectStart}
                onChange={(e) => setProjectStart(e.target.value)}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Kết thúc dự án</label>
              <input
                type="datetime-local"
                className="form-control"
                value={projectEnd}
                onChange={(e) => setProjectEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="section-title">Thời gian IOC (gọi vốn)</div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Bắt đầu IOC</label>
              <input
                type="datetime-local"
                className="form-control"
                value={iocStart}
                onChange={(e) => setIocStart(e.target.value)}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Kết thúc IOC</label>
              <input
                type="datetime-local"
                className="form-control"
                value={iocEnd}
                onChange={(e) => setIocEnd(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
        <div className="text-muted" style={{ fontSize: ".82rem" }}>
          <i className="fas fa-shield-alt me-1 text-success"></i>
          Giao dịch được ký trên MetaMask & ghi lên Sepolia blockchain
        </div>
        <button
          className="btn btn-primary px-4"
          onClick={create}
          disabled={loading}
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin me-2"></i>
              Đang tạo...
            </>
          ) : (
            <>
              <i className="fas fa-rocket me-2"></i>
              Tạo dự án
            </>
          )}
        </button>
      </div>
    </div>
  );
}
