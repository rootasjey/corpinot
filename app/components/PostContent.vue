<template>
  <div class="post-content">
    <EditorContent :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';

interface Props {
  content: string | object;  // Allow both HTML string and Tiptap JSON
  editable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  editable: false
});

const emit = defineEmits<{
  update: [content: string];
}>();

const editor = useEditor({
  content: props.content,
  editable: props.editable,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4],
      },
    }),
    Typography,
    Image.configure({
      HTMLAttributes: {
        class: 'rounded-lg my-8',
      },
    }),
    Link.configure({
      openOnClick: !props.editable,
      HTMLAttributes: {
        class: 'text-primary hover:underline',
      },
    }),
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-lg max-w-none focus:outline-none',
    },
  },
  onUpdate: ({ editor }) => {
    emit('update', editor.getHTML());
  },
});

// Watch for content changes from parent
watch(() => props.content, (newContent) => {
  if (editor.value && newContent) {
    // Handle both HTML string and JSON object
    if (typeof newContent === 'string') {
      if (editor.value.getHTML() !== newContent) {
        editor.value.commands.setContent(newContent);
      }
    } else {
      // It's a Tiptap JSON object
      editor.value.commands.setContent(newContent);
    }
  }
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<style>
/* Tiptap Editor Styles */
.post-content {
  @apply text-foreground;
}

.post-content .ProseMirror {
  @apply focus:outline-none;
}

/* Typography Styles */
.post-content .ProseMirror h1 {
  @apply text-4xl font-serif font-800 mt-12 mb-6 leading-tight;
}

.post-content .ProseMirror h2 {
  @apply text-3xl font-serif font-800 mt-10 mb-5 leading-snug;
}

.post-content .ProseMirror h3 {
  @apply text-2xl font-serif font-500 mt-8 mb-4;
}

.post-content .ProseMirror h4 {
  @apply text-xl font-serif font-500 mt-6 mb-3;
}

.post-content .ProseMirror p {
  @apply text-base md:text-lg leading-relaxed mb-8 text-foreground/80 font-body font-450;
  /* font-body font-600 color-gray-500 text-base md:text-lg leading-relaxed */
}

.post-content .ProseMirror a {
  @apply text-primary hover:text-primary/80 underline decoration-2 underline-offset-2 transition-colors;
}

.post-content .ProseMirror strong {
  @apply font-semibold text-foreground;
}

.post-content .ProseMirror em {
  @apply italic;
}

.post-content .ProseMirror blockquote {
  @apply border-l-4 border-primary/40 pl-6 py-4 my-8 italic text-lg md:text-xl text-muted bg-muted/20 rounded-r-lg;
}

.post-content .ProseMirror blockquote p {
  @apply mb-0;
}

.post-content .ProseMirror ul,
.post-content .ProseMirror ol {
  @apply my-6 ml-6 space-y-2;
}

.post-content .ProseMirror ul {
  @apply list-disc;
}

.post-content .ProseMirror ol {
  @apply list-decimal;
}

.post-content .ProseMirror li {
  @apply text-base md:text-lg leading-relaxed text-foreground/90;
}

.post-content .ProseMirror li > p {
  @apply mb-2;
}

.post-content .ProseMirror code {
  @apply bg-muted px-2 py-1 rounded text-sm font-mono text-primary;
}

.post-content .ProseMirror pre {
  @apply bg-muted p-4 rounded-lg overflow-x-auto my-6;
}

.post-content .ProseMirror pre code {
  @apply bg-transparent p-0 text-foreground;
}

.post-content .ProseMirror img {
  @apply w-full h-auto rounded-xl my-8 shadow-lg;
}

.post-content .ProseMirror hr {
  @apply my-12 border-border;
}

/* Table Styles */
.post-content .ProseMirror table {
  @apply w-full my-8 border-collapse;
}

.post-content .ProseMirror th {
  @apply bg-muted font-semibold text-left p-3 border border-border;
}

.post-content .ProseMirror td {
  @apply p-3 border border-border;
}

/* First paragraph special styling (drop cap effect could be added here) */
.post-content .ProseMirror > p:first-of-type {
  @apply text-xl md:text-2xl font-light mb-8;
}

/* Selection */
.post-content .ProseMirror ::selection {
  @apply bg-primary/20;
}

/* Focus state for editable mode */
.post-content .ProseMirror[contenteditable="true"] {
  @apply min-h-[300px] p-4 border border-border rounded-lg;
}

.post-content .ProseMirror[contenteditable="true"]:focus {
  @apply border-primary ring-2 ring-primary/20;
}
</style>
