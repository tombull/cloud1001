import type { IconMap, SocialLink, Site } from '@/types'

export const SITE: Site = {
  title: 'Cloud 1001',
  description: 'Cloud 1001 Blog by Tom Bull.',
  href: 'https://cloud1001.com',
  author: 'Tom Bull',
  locale: 'en-GB',
  featuredPostCount: 5,
  postsPerPage: 8,
}

export const NAV_LINKS: SocialLink[] = [
  {
    href: '/archive',
    label: 'ARCHIVE',
  },
  {
    href: '/about',
    label: 'ABOUT',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    href: 'https://tombull.com',
    label: 'Website',
  },
  {
    href: 'https://github.com/tombull',
    label: 'GitHub',
  },
  {
    href: 'https://linkedin.com/in/tombull',
    label: 'LinkedIn',
  },
  {
    href: 'mailto:tom@cloud1001.com',
    label: 'Email',
  },
  {
    href: '/rss.xml',
    label: 'RSS',
  },
]

export const ICON_MAP: IconMap = {
  Website: 'lucide:globe',
  GitHub: 'lucide:github',
  LinkedIn: 'lucide:linkedin',
  Email: 'lucide:mail',
  RSS: 'lucide:rss',
}
