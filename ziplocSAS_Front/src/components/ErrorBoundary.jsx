import React from 'react';
import AlertaPanel from './AlertaPanel';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Optionally log to external service
    // console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <AlertaPanel type="error" title="Error inesperado" message={this.state.error?.message || 'Ocurrió un error'} />
        </div>
      );
    }
    return this.props.children;
  }
}
