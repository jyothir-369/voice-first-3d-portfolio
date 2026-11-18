// Single source of truth for identity and contact facts used by the UI.
// Every value here must match content/profile.json; the validator keeps them honest.
import profile from '../content/profile.json'

export const OWNER_NAME = profile.displayName
export const EMAIL_ADDRESS = profile.contact.email
export const EMAIL_MAILTO = `mailto:${EMAIL_ADDRESS}`
export const GITHUB_URL = profile.contact.github
export const LINKEDIN_URL = profile.contact.linkedin
export const LEETCODE_URL = profile.contact.leetcode
export const PORTFOLIO_URL = profile.contact.portfolio
