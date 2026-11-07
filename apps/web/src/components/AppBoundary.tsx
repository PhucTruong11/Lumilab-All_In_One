import { Component, type ReactNode } from 'react';
export class AppBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <section className="recovery-panel" role="alert"><h1>Không mở được giao diện này</h1><p>Hãy mở lại giao diện. Bản đã lưu trên máy vẫn còn; các thay đổi chưa lưu có thể cần nhập lại.</p><button className="primary-button" onClick={() => this.setState({ failed: false })}>Mở lại giao diện</button></section>;
    return this.props.children;
  }
}
export class ChartBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="chart-area chart-unavailable" role="status">Chưa mở được đồ thị. Số đo vẫn cập nhật; hãy lưu phiên rồi tải lại trang khi có kết nối.</div> : this.props.children;
  }
}
