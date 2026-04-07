import { defineConfig } from 'tinacms'
import { CustomAuthProvider } from '../src/tina/CustomAuthProvider'

const branch = 'main' // default branch

export default defineConfig({
  branch,
  clientId: process.env.TINA_CLIENT_ID || '',
  token: process.env.TINA_TOKEN || '',
  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },
  authProvider: new CustomAuthProvider(),
  media: {
    tina: {
      mediaRoot: '',
      publicFolder: 'public',
    },
  },
  schema: {
    collections: [
      {
        name: 'blog',
        label: 'Blog Posts',
        path: 'src/content/blog',
        format: 'mdx',
        fields: [
          { type: 'string', name: 'title', label: 'Title', isTitle: true, required: true },
          { type: 'string', name: 'description', label: 'Description', required: true },
          { type: 'datetime', name: 'date', label: 'Date', required: true },
          { type: 'number', name: 'order', label: 'Order' },
          { type: 'image', name: 'image', label: 'Image' },
          { type: 'string', name: 'tags', label: 'Tags', list: true },
          { type: 'string', name: 'authors', label: 'Authors', list: true },
          { type: 'boolean', name: 'draft', label: 'Draft' },
          { type: 'rich-text', name: 'body', label: 'Body', isBody: true },
        ],
      },
      {
        name: 'authors',
        label: 'Authors',
        path: 'src/content/authors',
        format: 'md',
        fields: [
          { type: 'string', name: 'name', label: 'Name', required: true, isTitle: true },
          { type: 'string', name: 'pronouns', label: 'Pronouns' },
          { type: 'string', name: 'avatar', label: 'Avatar', required: true },
          { type: 'string', name: 'bio', label: 'Bio' },
          { type: 'string', name: 'mail', label: 'Email' },
          { type: 'string', name: 'website', label: 'Website' },
          { type: 'string', name: 'twitter', label: 'Twitter' },
          { type: 'string', name: 'github', label: 'GitHub' },
          { type: 'string', name: 'linkedin', label: 'LinkedIn' },
          { type: 'string', name: 'discord', label: 'Discord' },
          { type: 'rich-text', name: 'body', label: 'Body', isBody: true },
        ],
      },
      {
        name: 'projects',
        label: 'Projects',
        path: 'src/content/projects',
        format: 'md',
        fields: [
          { type: 'string', name: 'name', label: 'Name', required: true, isTitle: true },
          { type: 'string', name: 'description', label: 'Description', required: true },
          { type: 'string', name: 'tags', label: 'Tags', list: true, required: true },
          { type: 'image', name: 'image', label: 'Image', required: true },
          { type: 'string', name: 'link', label: 'Link', required: true },
          { type: 'datetime', name: 'startDate', label: 'Start Date' },
          { type: 'datetime', name: 'endDate', label: 'End Date' },
          { type: 'rich-text', name: 'body', label: 'Body', isBody: true },
        ],
      },
    ],
  },
})
