import React from 'react';

class MarkdownErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Error rendering markdown:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when rendering markdown fails
      return (
        <div className="markdown-error">
          <p className="markdown-error-message">Error rendering markdown content.</p>
          <pre className="markdown-raw-content">{this.props.children}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MarkdownErrorBoundary;
