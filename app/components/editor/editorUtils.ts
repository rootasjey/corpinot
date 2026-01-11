import type { Editor } from '@tiptap/core'
import type { EditorView } from 'prosemirror-view'

// Robust runtime check for whether a Tiptap Editor is editable.
// Avoids using `as any` by narrowing to known shapes and types.
export function editorIsEditable(editor?: Editor | null): boolean {
  if (!editor) return false
  const ed = editor as unknown

  // Preferred API: isEditable()
  const hasIsEditable = (ed as { isEditable?: unknown }).isEditable
  if (typeof hasIsEditable === 'function') {
    return (ed as { isEditable: () => boolean }).isEditable()
  }

  // Fallback: check the ProseMirror EditorView's editable property (could be boolean or function)
  const view = (ed as { view?: EditorView }).view
  if (!view) return false
  const editableProp = (view as { editable?: unknown }).editable
  if (typeof editableProp === 'function') return (editableProp as () => boolean)()
  return Boolean(editableProp)
}
