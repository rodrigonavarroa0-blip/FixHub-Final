/* CATEGORIES - JAVASCRIPT */
/* The four catalog categories (same values as the CHECK constraint of the services table)
   and the translation key of each one. */

export const CATEGORIES = [
    { value: "repair", key: "categoryRepair" },
    { value: "maintenance", key: "categoryMaintenance" },
    { value: "upgrade", key: "categoryUpgrade" },
    { value: "support", key: "categorySupport" },
];

export function categoryKey(value) {
    return CATEGORIES.find((category) => category.value === value)?.key ?? value;
}
