/* FORM FIELD - COMPONENT */
/* Label + input + error message under it. The input itself is passed as `children`
   so the same component works with <input>, <select> and <textarea>. */

export default function FormField({ id, label, error, footer, children }) {
    return (
        <div className="form-field">
            <label htmlFor={id}>{label}</label>
            {children}
            {footer ? (
                <div className="field-footer">
                    <small className="field-error" id={`${id}-error`}>{error}</small>
                    {footer}
                </div>
            ) : (
                <small className="field-error" id={`${id}-error`}>{error}</small>
            )}
        </div>
    );
}

//Props every input needs to show (and announce) its error state.
export function fieldProps(id, error) {
    return {
        id,
        "aria-invalid": error ? "true" : "false",
        "aria-describedby": `${id}-error`,
        className: error ? "is-invalid" : undefined,
    };
}
