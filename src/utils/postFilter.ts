import type { CollectionEntry } from "astro:content";
import { SITE } from "@/config";

/**
 * Is this post published? Its inverse is a *draft* — see CONTEXT.md. A post is
 * a draft while `draft: true` is set AND while its `pubDatetime` is still in
 * the future. Both states have to be treated identically by every surface that
 * enumerates posts, or a scheduled post leaks early (that is exactly how it
 * reached the archives page and the sitemap before its own publish time).
 *
 * This resolves at BUILD time. The site is fully prerendered, so a scheduled
 * post does not surface on its own when its timestamp passes; it surfaces at
 * the next build. `scheduledPostMargin` is the allowance for build-clock skew.
 */
export const isPublished = (data: CollectionEntry<"blog">["data"]) => {
	const isPublishTimePassed =
		Date.now() >
		new Date(data.pubDatetime).getTime() - SITE.scheduledPostMargin;
	return !data.draft && isPublishTimePassed;
};

const postFilter = ({ data }: CollectionEntry<"blog">) => {
	// In dev, surface everything — including drafts and scheduled posts — so the
	// author can preview them locally. Drafts are clearly marked with a badge.
	if (import.meta.env.DEV) return true;

	// In production, drafts are hidden from every listing (home, pagination,
	// archives, tags, search index, RSS). Their pages are still built at their
	// own URL so they can be shared via a secret link.
	return isPublished(data);
};

export default postFilter;
