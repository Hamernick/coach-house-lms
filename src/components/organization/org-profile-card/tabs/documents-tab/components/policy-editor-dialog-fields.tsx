"use client"

import type { PolicyDraft } from "../types"
import { PolicyContentFields } from "./policy-content-fields"
import { PolicyCategoriesField } from "./policy-categories-field"
import { PolicyFileField } from "./policy-file-field"
import { PolicyMetadataFields } from "./policy-metadata-fields"
import { PolicyPeopleField } from "./policy-people-field"
import type { PolicyEditorDialogProps } from "./policy-editor-dialog-types"

type PolicyEditorDialogFieldsProps = Pick<
  PolicyEditorDialogProps,
  | "categoryOptions"
  | "onChange"
  | "onClearPendingDocument"
  | "onCreateCategory"
  | "onRemoveCategory"
  | "onRemoveExistingDocument"
  | "onSelectDocument"
  | "onToggleCategory"
  | "onViewDocument"
  | "open"
  | "pendingDocumentName"
  | "pendingDocumentUpload"
  | "peopleOptions"
  | "programOptions"
  | "viewingDocument"
> & {
  draft: PolicyDraft
}

export function PolicyEditorDialogFields({
  open,
  draft,
  categoryOptions,
  peopleOptions,
  programOptions,
  pendingDocumentName,
  pendingDocumentUpload,
  viewingDocument,
  onChange,
  onToggleCategory,
  onCreateCategory,
  onRemoveCategory,
  onSelectDocument,
  onClearPendingDocument,
  onRemoveExistingDocument,
  onViewDocument,
}: PolicyEditorDialogFieldsProps) {
  return (
    <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1">
      <PolicyContentFields draft={draft} onChange={onChange} />

      <PolicyCategoriesField
        open={open}
        selectedCategories={draft.categories}
        categoryOptions={categoryOptions}
        onToggleCategory={onToggleCategory}
        onCreateCategory={onCreateCategory}
        onRemoveCategory={onRemoveCategory}
      />

      <PolicyMetadataFields
        draft={draft}
        programOptions={programOptions}
        onChange={onChange}
      />

      <PolicyFileField
        document={draft.document}
        pendingDocumentName={pendingDocumentName}
        pendingDocumentUpload={pendingDocumentUpload}
        viewingDocument={viewingDocument}
        onSelectDocument={onSelectDocument}
        onClearPendingDocument={onClearPendingDocument}
        onRemoveExistingDocument={onRemoveExistingDocument}
        onViewDocument={onViewDocument}
      />

      <PolicyPeopleField
        open={open}
        peopleOptions={peopleOptions}
        selectedPersonIds={draft.personIds}
        onChangePersonIds={(personIds) => onChange({ ...draft, personIds })}
      />
    </div>
  )
}
