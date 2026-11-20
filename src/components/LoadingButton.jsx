/* LOADING BUTTON - COMPONENT */
/* A button that shows a spinner and is disabled while a request is running,
   so the user knows something is happening and cannot send the form twice. */

export default function LoadingButton({ loading = false, loadingText = "…", className = "button button-primary", type = "button", disabled, children, ...props }) {
    return (
        <button type={type} className={className} disabled={loading || disabled} aria-busy={loading || undefined} {...props}>
            {loading ? (
                <>
                    <span className="spinner" aria-hidden="true"></span>
                    {loadingText}
                </>
            ) : children}
        </button>
    );
}
