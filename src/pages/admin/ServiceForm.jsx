/* SERVICE FORM - ADMIN */
/* Create or edit a catalog service. The validation mirrors the CHECK constraints of the
   services table, and the AI button writes both descriptions in the FixHub tone. */

import { useEffect, useRef, useState } from "react";
import { generateServiceDescriptions } from "../../ai/assistant.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { CATEGORIES } from "../../utils/categories.js";
import { errorMessage } from "../../utils/format.js";
import FormField, { fieldProps } from "../../components/FormField.jsx";
import LoadingButton from "../../components/LoadingButton.jsx";

//Turns a service from the database into form values (inputs always work with strings).
function toFormValues(service, nextSortOrder) {
    if (!service) {
        return {
            name_en: "", name_es: "", category: "repair", price: "", duration_minutes: "",
            sort_order: String(nextSortOrder), description_en: "", description_es: "", is_active: true,
        };
    }
    return {
        name_en: service.name_en, name_es: service.name_es, category: service.category,
        price: String(service.price), duration_minutes: String(service.duration_minutes),
        sort_order: String(service.sort_order), description_en: service.description_en,
        description_es: service.description_es, is_active: Boolean(service.is_active),
    };
}

//Turns the form values into the row we send to Supabase.
function toServiceRow(values) {
    return {
        name_en: values.name_en.trim(),
        name_es: values.name_es.trim(),
        category: values.category,
        price: values.price === "" ? NaN : Number(values.price),
        duration_minutes: Number(values.duration_minutes),
        sort_order: Number(values.sort_order),
        description_en: values.description_en.trim(),
        description_es: values.description_es.trim(),
        is_active: values.is_active,
    };
}

//Mirrors the CHECK constraints of the services table (supabase/schema.sql).
function validate(row, t) {
    const errors = {};
    const between = (text, min, max) => text.length >= min && text.length <= max;
    if (!between(row.name_en, 2, 80)) errors.name_en = t("adminErrorName");
    if (!between(row.name_es, 2, 80)) errors.name_es = t("adminErrorName");
    if (!(row.price >= 0)) errors.price = t("adminErrorPrice");
    if (!(Number.isInteger(row.duration_minutes) && row.duration_minutes >= 5 && row.duration_minutes <= 1440)) {
        errors.duration_minutes = t("adminErrorDuration");
    }
    if (!Number.isInteger(row.sort_order)) errors.sort_order = t("adminErrorSort");
    if (!between(row.description_en, 10, 400)) errors.description_en = t("adminErrorDescription");
    if (!between(row.description_es, 10, 400)) errors.description_es = t("adminErrorDescription");
    return errors;
}

export default function ServiceForm({ service, nextSortOrder, onSave, onCancel }) {
    const { t } = useLanguage();
    const showToast = useToast();
    const [values, setValues] = useState(() => toFormValues(service, nextSortOrder));
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const inputRefs = useRef({});

    useEffect(() => {
        inputRefs.current.name_en?.focus();
    }, []);

    function handleChange(event) {
        const { name, value, type, checked } = event.target;
        setValues((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
        setErrors((current) => ({ ...current, [name]: "" }));
    }

    //Shared props for every text/number input: value, onChange, error state and a ref to focus it.
    function inputProps(name) {
        return {
            ...fieldProps(`service-${name}`, errors[name]),
            name,
            value: values[name],
            onChange: handleChange,
            ref: (element) => { inputRefs.current[name] = element; },
        };
    }

    async function handleSubmit(event) {
        event.preventDefault();
        const row = toServiceRow(values);
        const formErrors = validate(row, t);
        setErrors(formErrors);
        const firstInvalid = Object.keys(formErrors)[0];
        if (firstInvalid) {
            inputRefs.current[firstInvalid]?.focus();
            return;
        }
        setSaving(true);
        await onSave(row);
        setSaving(false);
    }

    //AI: writes both descriptions from the name, category, price and time.
    async function handleGenerate() {
        const row = toServiceRow(values);
        const name = row.name_en || row.name_es;
        if (name.length < 2) {
            setErrors((current) => ({ ...current, name_en: t("adminErrorNameFirst") }));
            inputRefs.current.name_en?.focus();
            return;
        }
        setGenerating(true);
        try {
            const result = await generateServiceDescriptions({
                name,
                category: row.category,
                price: Number.isNaN(row.price) ? 0 : row.price,
                durationMinutes: row.duration_minutes || 60,
            });
            setValues((current) => ({ ...current, ...result }));
            setErrors((current) => ({ ...current, description_en: "", description_es: "" }));
            showToast(t("adminGenerated"), "info");
        } catch (error) {
            showToast(errorMessage(error, t), "error");
        } finally {
            setGenerating(false);
        }
    }

    return (
        <div className="card form-card">
            <h3>{service ? t("adminEditService") : t("adminNewService")}</h3>
            <form className="form" noValidate onSubmit={handleSubmit}>
                <div className="form-row">
                    <FormField id="service-name_en" label={t("adminNameEn")} error={errors.name_en}>
                        <input type="text" maxLength={80} {...inputProps("name_en")} />
                    </FormField>
                    <FormField id="service-name_es" label={t("adminNameEs")} error={errors.name_es}>
                        <input type="text" maxLength={80} {...inputProps("name_es")} />
                    </FormField>
                </div>

                <div className="form-row form-row-4">
                    <div className="form-field">
                        <label htmlFor="service-category">{t("adminColCategory")}</label>
                        <select id="service-category" name="category" value={values.category} onChange={handleChange}>
                            {CATEGORIES.map((category) => <option key={category.value} value={category.value}>{t(category.key)}</option>)}
                        </select>
                    </div>
                    <FormField id="service-price" label={t("servicePrice")} error={errors.price}>
                        <input type="number" min="0" step="0.01" {...inputProps("price")} />
                    </FormField>
                    <FormField id="service-duration_minutes" label={t("adminDuration")} error={errors.duration_minutes}>
                        <input type="number" min="5" max="1440" step="1" {...inputProps("duration_minutes")} />
                    </FormField>
                    <FormField id="service-sort_order" label={t("adminSort")} error={errors.sort_order}>
                        <input type="number" step="1" {...inputProps("sort_order")} />
                    </FormField>
                </div>

                <div className="ai-helper">
                    <p>{t("adminAiHint")}</p>
                    <LoadingButton className="button button-ai" loading={generating} loadingText={t("adminGenerating")} onClick={handleGenerate}>
                        {t("adminAiGenerate")}
                    </LoadingButton>
                </div>

                <div className="form-row">
                    <FormField id="service-description_en" label={t("adminDescEn")} error={errors.description_en}>
                        <textarea rows={4} maxLength={400} {...inputProps("description_en")} />
                    </FormField>
                    <FormField id="service-description_es" label={t("adminDescEs")} error={errors.description_es}>
                        <textarea rows={4} maxLength={400} {...inputProps("description_es")} />
                    </FormField>
                </div>

                <label className="checkbox">
                    <input type="checkbox" name="is_active" checked={values.is_active} onChange={handleChange} />
                    <span>{t("adminActiveLabel")}</span>
                </label>

                <div className="actions">
                    <LoadingButton type="submit" loading={saving} loadingText={t("adminSaving")}>{t("adminSave")}</LoadingButton>
                    <button type="button" className="button button-outline" onClick={onCancel}>{t("adminCancel")}</button>
                </div>
            </form>
        </div>
    );
}
