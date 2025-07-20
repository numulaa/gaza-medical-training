import React from "react";

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

interface ErrorBoundaryProps {
	children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, info: any) {
		// You can log error info here if needed
		// console.error(error, info);
	}

	handleReload = () => {
		window.location.reload();
	};

	render() {
		if (this.state.hasError) {
			return (
				<div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
					<h1 className="text-2xl font-bold mb-4">
						Something went wrong
					</h1>
					<p className="mb-4 text-gray-300">
						An unexpected error occurred. Please try reloading the
						page.
					</p>
					<button
						onClick={this.handleReload}
						className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-medium"
					>
						Reload
					</button>
					{this.state.error && (
						<pre className="mt-6 text-xs text-red-300 bg-gray-800 p-3 rounded max-w-xl overflow-x-auto">
							{this.state.error.message}
						</pre>
					)}
				</div>
			);
		}
		return this.props.children;
	}
}
