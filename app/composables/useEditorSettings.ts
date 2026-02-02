export const useEditorSettings = () => {
  const slashMenuVertical = useLocalStorage('editor.slashMenuVertical', false)

  return {
    slashMenuVertical,
  }
}
