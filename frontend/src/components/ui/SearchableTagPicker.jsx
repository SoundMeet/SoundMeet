import SearchableTagSection from "./SearchableTagSection";

/**
 * SearchableTagPicker — reusable searchable chip/tag picker for join flows.
 *
 * Thin wrapper over SearchableTagSection using `selectedIds` naming
 * (matching the JoinJam form state shape) instead of `presetIds`.
 *
 * Props:
 *   title            string
 *   placeholder      string
 *   helperText       string?
 *   options          {id, label}[]
 *   selectedIds      string[]
 *   customValues     string[]
 *   onTogglePreset   (id) => void
 *   onAddCustom      (value) => void
 *   onRemoveCustom   (value) => void
 *   maxVisible       number?
 *   allowCustom      boolean?
 *   accent           string?  — hex color for selected chip highlight
 */
const SearchableTagPicker = ({ selectedIds = [], ...rest }) => (
  <SearchableTagSection presetIds={selectedIds} {...rest} />
);

export default SearchableTagPicker;
