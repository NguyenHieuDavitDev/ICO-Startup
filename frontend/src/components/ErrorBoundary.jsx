import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="d-flex flex-column align-items-center justify-content-center"
          style={{ minHeight: "100vh", background: "#f5f6fa" }}
        >
          <div className="card shadow" style={{ maxWidth: 520, width: "100%", borderRadius: ".9rem" }}>
            <div className="card-body text-center p-5">
              <div
                className="mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle"
                style={{ width: 72, height: 72, background: "#fff0f3" }}
              >
                <i className="fas fa-exclamation-triangle fa-2x" style={{ color: "#f64e60" }}></i>
              </div>
              <h4 className="fw-bold mb-2">Ứng dụng gặp lỗi</h4>
              <p className="text-muted mb-3" style={{ fontSize: ".9rem" }}>
                {this.state.error?.message || "Đã xảy ra lỗi không xác định."}
              </p>
              <details className="text-start mb-4">
                <summary className="text-muted" style={{ fontSize: ".8rem", cursor: "pointer" }}>
                  Chi tiết lỗi
                </summary>
                <pre
                  className="mt-2 p-2 bg-light rounded text-danger"
                  style={{ fontSize: ".75rem", overflowX: "auto", maxHeight: 180 }}
                >
                  {this.state.error?.stack}
                </pre>
              </details>
              <button
                className="btn btn-primary"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                <i className="fas fa-redo me-2"></i>Thử lại
              </button>
              <button
                className="btn btn-outline-secondary ms-2"
                onClick={() => window.location.reload()}
              >
                <i className="fas fa-sync-alt me-2"></i>Tải lại trang
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
